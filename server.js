const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { networkInterfaces } = require('os');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get local network information
function getNetworkInfo() {
  const nets = networkInterfaces();
  const results = [];
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip internal (loopback) and IPv6 addresses
      if (!net.internal && net.family === 'IPv4') {
        results.push({
          interface: name,
          ip: net.address,
          cidr: net.cidr
        });
      }
    }
  }
  
  return results;
}

// Scan network for ADB devices
function scanNetworkForADBDevices(socket, data) {
  const { networkRange } = data;
  console.log('Scanning network for ADB devices:', networkRange);
  
  socket.emit('scanStatus', { status: 'Starting network scan...' });
  
  // Get local network information if no range specified
  let scanRange = networkRange;
  if (!scanRange) {
    const networks = getNetworkInfo();
    if (networks.length > 0) {
      // Use the first network interface as default
      const network = networks[0];
      // Convert CIDR to scan range (simplified)
      const ipParts = network.ip.split('.');
      scanRange = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.0/24`;
    } else {
      socket.emit('scanStatus', { status: 'Error: Could not determine network range' });
      return;
    }
  }
  
  socket.emit('scanStatus', { status: `Scanning network range: ${scanRange}` });
  
  // Extract base IP for scanning
  const baseIP = scanRange.split('/')[0];
  const ipParts = baseIP.split('.');
  
  // Scan common ADB ports (5555 is standard for network ADB)
  const portsToScan = [5555];
  let scanCount = 0;
  const totalScans = 254 * portsToScan.length; // 254 IPs * number of ports
  const foundDevices = [];
  
  // Simple port scanner function
  function scanIP(ip, port, callback) {
    const net = require('net');
    const socket = new net.Socket();
    let connected = false;
    
    socket.setTimeout(1000); // 1 second timeout
    
    socket.on('connect', () => {
      connected = true;
      socket.destroy();
      callback(true);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      callback(false);
    });
    
    socket.on('error', () => {
      socket.destroy();
      callback(false);
    });
    
    socket.connect(port, ip);
  }
  
  // Scan each IP in the range
  for (let i = 1; i < 255; i++) {
    const ip = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.${i}`;
    
    portsToScan.forEach(port => {
      scanIP(ip, port, (isOpen) => {
        scanCount++;
        const progress = Math.round((scanCount / totalScans) * 100);
        socket.emit('scanProgress', { progress });
        
        if (isOpen) {
          const deviceId = `${ip}:${port}`;
          console.log(`Found potential ADB device: ${deviceId}`);
          foundDevices.push(deviceId);
          
          // Try to connect to verify it's actually an ADB device
          exec(`adb connect ${deviceId}`, (error, stdout, stderr) => {
            if (!error && (stdout.includes('connected') || stdout.includes('already connected'))) {
              socket.emit('deviceDiscovered', { deviceId, ip, port });
            }
          });
        }
        
        if (scanCount === totalScans) {
          socket.emit('scanStatus', { status: `Scan complete. Found ${foundDevices.length} potential devices.` });
          socket.emit('scanComplete', { devices: foundDevices });
        }
      });
    });
  }
}

// Handle socket connections
io.on('connection', (socket) => {
  console.log('A user connected');
  let screenCaptureProcess = null;

  // Handle command requests from the client
  socket.on('sendCommand', (data) => {
    const { deviceId, command } = data;
    
    // Security check - only allow specific commands
    const allowedCommands = [
      'input keyevent KEYCODE_DPAD_UP',
      'input keyevent KEYCODE_DPAD_DOWN',
      'input keyevent KEYCODE_DPAD_LEFT',
      'input keyevent KEYCODE_DPAD_RIGHT',
      'input keyevent KEYCODE_DPAD_CENTER',
      'input keyevent KEYCODE_ENTER',
      'input keyevent KEYCODE_BACK',
      'input keyevent KEYCODE_HOME',
      'input keyevent KEYCODE_MENU',
      'input keyevent KEYCODE_POWER',
      'input keyevent KEYCODE_VOLUME_UP',
      'input keyevent KEYCODE_VOLUME_DOWN',
      'input keyevent KEYCODE_MUTE',
      'input keyevent KEYCODE_0',
      'input keyevent KEYCODE_1',
      'input keyevent KEYCODE_2',
      'input keyevent KEYCODE_3',
      'input keyevent KEYCODE_4',
      'input keyevent KEYCODE_5',
      'input keyevent KEYCODE_6',
      'input keyevent KEYCODE_7',
      'input keyevent KEYCODE_8',
      'input keyevent KEYCODE_9',
      'input keyevent KEYCODE_DEL',
      'input keyevent KEYCODE_SPACE',
      'input text',
      'input mouse',
      'input touchscreen',
      'screencap'
    ];
    
    // Check if command is allowed
    const isAllowed = allowedCommands.some(allowed => command.startsWith(allowed));
    
    if (!isAllowed) {
      console.log('Blocked unauthorized command:', command);
      socket.emit('commandResponse', { error: 'Unauthorized command' });
      return;
    }
    
    // Construct the ADB command
    const adbCommand = deviceId ? 
      `adb -s ${deviceId} shell ${command}` : 
      `adb shell ${command}`;
    
    console.log('Executing command:', adbCommand);
    
    // Execute the ADB command
    exec(adbCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('Error executing command:', error);
        socket.emit('commandResponse', { error: error.message });
        return;
      }
      
      if (stderr) {
        console.error('Command stderr:', stderr);
        socket.emit('commandResponse', { error: stderr });
        return;
      }
      
      console.log('Command output:', stdout);
      socket.emit('commandResponse', { success: true, output: stdout });
    });
  });
  
  // Handle text input
  socket.on('sendText', (data) => {
    const { deviceId, text } = data;
    
    // Special handling for space character
    let adbCommand;
    if (text === ' ') {
      // For space, use keyevent instead of text input to avoid issues
      adbCommand = deviceId ? 
        `adb -s ${deviceId} shell input keyevent KEYCODE_SPACE` : 
        `adb shell input keyevent KEYCODE_SPACE`;
    } else {
      // Escape special characters in text
      const escapedText = text.replace(/"/g, '\\"');
      adbCommand = deviceId ? 
        `adb -s ${deviceId} shell input text "${escapedText}"` : 
        `adb shell input text "${escapedText}"`;
    }
    
    console.log('Sending text:', adbCommand);
    
    // Execute the ADB command
    exec(adbCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('Error sending text:', error);
        socket.emit('commandResponse', { error: error.message });
        return;
      }
      
      if (stderr) {
        console.error('Text input stderr:', stderr);
        socket.emit('commandResponse', { error: stderr });
        return;
      }
      
      console.log('Text sent successfully');
      socket.emit('commandResponse', { success: true, output: stdout });
    });
  });
  
  // Handle touch events
  socket.on('sendTap', (data) => {
    const { deviceId, x, y } = data;
    
    // Construct the ADB command
    const adbCommand = deviceId ? 
      `adb -s ${deviceId} shell input tap ${x} ${y}` : 
      `adb shell input tap ${x} ${y}`;
    
    console.log('Sending tap:', adbCommand);
    
    // Execute the ADB command
    exec(adbCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('Error sending tap:', error);
        socket.emit('commandResponse', { error: error.message });
        return;
      }
      
      if (stderr) {
        console.error('Tap stderr:', stderr);
        socket.emit('commandResponse', { error: stderr });
        return;
      }
      
      console.log('Tap sent successfully');
      socket.emit('commandResponse', { success: true, output: stdout });
    });
  });
  
  // Handle swipe events
  socket.on('sendSwipe', (data) => {
    const { deviceId, x1, y1, x2, y2, duration } = data;
    
    // Construct the ADB command
    const adbCommand = deviceId ? 
      `adb -s ${deviceId} shell input swipe ${x1} ${y1} ${x2} ${y2} ${duration || 300}` : 
      `adb shell input swipe ${x1} ${y1} ${x2} ${y2} ${duration || 300}`;
    
    console.log('Sending swipe:', adbCommand);
    
    // Execute the ADB command
    exec(adbCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('Error sending swipe:', error);
        socket.emit('commandResponse', { error: error.message });
        return;
      }
      
      if (stderr) {
        console.error('Swipe stderr:', stderr);
        socket.emit('commandResponse', { error: stderr });
        return;
      }
      
      console.log('Swipe sent successfully');
      socket.emit('commandResponse', { success: true, output: stdout });
    });
  });
  
  // Handle screen capture requests
  socket.on('startScreenCapture', (data) => {
    const { deviceId } = data;
    
    // Kill any existing screen capture process
    if (screenCaptureProcess) {
      screenCaptureProcess.kill();
    }
    
    // Start screen capture with better performance
    let lastFrameTime = 0;
    const minFrameInterval = 100; // Minimum time between frames in ms
    
    const captureScreen = () => {
      const now = Date.now();
      if (now - lastFrameTime < minFrameInterval) {
        // Schedule next capture
        setTimeout(captureScreen, minFrameInterval - (now - lastFrameTime));
        return;
      }
      
      lastFrameTime = now;
      
      // Use screencap with better compression for faster transfer
      const adbCommand = deviceId ? 
        `adb -s ${deviceId} shell screencap -p | base64` : 
        `adb shell screencap -p | base64`;
      
      exec(adbCommand, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (error) {
          console.error('Error capturing screen:', error);
          return;
        }
        
        if (stderr) {
          console.error('Screen capture stderr:', stderr);
          return;
        }
        
        // Send the base64 encoded image data to the client
        socket.emit('screenData', { data: stdout });
        
        // Continue capturing screens
        setTimeout(captureScreen, 100); // Capture every 100ms
      });
    };
    
    console.log('Starting screen capture');
    captureScreen();
  });
  
  // Handle screen capture stop requests
  socket.on('stopScreenCapture', () => {
    // For screencap method, there's no persistent process to kill
    socket.emit('screenCaptureStopped');
  });
  
  // Handle device listing requests
  socket.on('listDevices', () => {
    console.log('Received listDevices request from client');
    exec('adb devices', (error, stdout, stderr) => {
      if (error) {
        console.error('Error listing devices:', error);
        socket.emit('devicesList', { error: error.message });
        return;
      }
      
      if (stderr) {
        console.error('Devices list stderr:', stderr);
        socket.emit('devicesList', { error: stderr });
        return;
      }
      
      console.log('ADB devices output:', stdout);
      
      // Parse the devices list
      const devices = [];
      const lines = stdout.trim().split('\n');
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split('\t');
        if (parts.length >= 2) {
          devices.push({
            id: parts[0],
            status: parts[1]
          });
        }
      }
      
      console.log('Parsed devices:', devices);
      console.log('Sending devicesList to client');
      socket.emit('devicesList', { devices });
    });
  });
  
  // Handle device disconnection requests
  socket.on('disconnectDevice', (data) => {
    const { deviceId } = data;
    console.log('Received disconnectDevice request for:', deviceId);
    
    if (!deviceId) {
      socket.emit('disconnectResponse', { error: 'No device ID provided' });
      return;
    }
    
    // Execute ADB disconnect command
    const adbCommand = `adb disconnect ${deviceId}`;
    console.log('Executing disconnect command:', adbCommand);
    
    exec(adbCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('Error disconnecting device:', error);
        socket.emit('disconnectResponse', { error: error.message });
        return;
      }
      
      if (stderr) {
        console.error('Disconnect stderr:', stderr);
        socket.emit('disconnectResponse', { error: stderr });
        return;
      }
      
      console.log('Device disconnected successfully:', stdout);
      socket.emit('disconnectResponse', { success: true, output: stdout, deviceId });
    });
  });
  
  // Handle network scan requests
  socket.on('scanNetwork', (data) => {
    scanNetworkForADBDevices(socket, data);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected');
    // Kill screen capture process when user disconnects
    if (screenCaptureProcess) {
      screenCaptureProcess.kill();
      screenCaptureProcess = null;
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});