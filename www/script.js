// Connect to the server via Socket.IO
// For mobile app, we'll try to connect to the local network server
const socket = io('http://192.168.0.100:3000'); // Default IP, can be changed by user

// DOM elements
const deviceIdSelect = document.getElementById('deviceId');
const refreshDevicesBtn = document.getElementById('refreshDevices');
const disconnectDeviceBtn = document.getElementById('disconnectDevice');
const statusEl = document.getElementById('status');
const buttons = document.querySelectorAll('button[data-command]');
const startScreenBtn = document.getElementById('startScreenCapture');
const stopScreenBtn = document.getElementById('stopScreenCapture');
const screenContainer = document.getElementById('screenContainer');
const screenCanvas = document.getElementById('screenCanvas');
const ctx = screenCanvas.getContext('2d');
const toggleKeyboardBtn = document.getElementById('toggleKeyboard');
const visibleInput = document.getElementById('visibleInput');
const inputContainer = document.querySelector('.input-container');
const clearInputBtn = document.getElementById('clearInput');
const sendInputBtn = document.getElementById('sendInput');
const fpsCounter = document.getElementById('fpsCounter');

// Network scanning elements
const networkRangeInput = document.getElementById('networkRange');
const scanNetworkBtn = document.getElementById('scanNetwork');
const scanStatusEl = document.getElementById('scanStatus');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const discoveredDevicesEl = document.getElementById('discoveredDevices');

// Mouse pad elements
const mousePad = document.getElementById('mousePad');
const mousePadSurface = document.querySelector('.mouse-pad-surface');
const mouseLeftClickBtn = document.getElementById('mouseLeftClick');
const mouseRightClickBtn = document.getElementById('mouseRightClick');

// Screen control elements
const screenControlLeft = document.getElementById('screenControlLeft');
const screenControlCenter = document.getElementById('screenControlCenter');
const screenControlRight = document.getElementById('screenControlRight');

// Tab navigation elements
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

// State variables
let keyboardInputEnabled = false;
let isShiftPressed = false;
let isMouseDown = false;
let lastX = 0;
let lastY = 0;
let frameCount = 0;
let lastFpsUpdate = Date.now();
let previousInputValue = ''; // Track previous input value for better backspace handling

// Tab navigation
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.dataset.tab;
        
        // Update active tab button
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Update active tab content
        tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === `${tabName}-tab`) {
                content.classList.add('active');
            }
        });
    });
});

// Update status message
function updateStatus(message) {
    statusEl.textContent = message;
    statusEl.style.color = 'white';
}

// Update status with error
function updateError(message) {
    statusEl.textContent = message;
    statusEl.style.color = '#f44336';
}

// Update scan status
function updateScanStatus(message) {
    scanStatusEl.textContent = message;
}

// Update scan progress
function updateScanProgress(progress) {
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${progress}%`;
}

// Add discovered device to list
function addDiscoveredDevice(deviceId) {
    const deviceDiv = document.createElement('div');
    deviceDiv.className = 'discovered-device';
    deviceDiv.innerHTML = `
        <span>${deviceId}</span>
        <button class="connect-btn" data-device-id="${deviceId}">Connect</button>
    `;
    
    discoveredDevicesEl.appendChild(deviceDiv);
    
    // Add event listener to connect button
    const connectBtn = deviceDiv.querySelector('.connect-btn');
    connectBtn.addEventListener('click', () => {
        connectToDiscoveredDevice(deviceId);
    });
}

// Connect to discovered device
function connectToDiscoveredDevice(deviceId) {
    // Send connect command to server
    socket.emit('connectToDevice', { deviceId });
    
    // Add device to dropdown
    const option = document.createElement('option');
    option.value = deviceId;
    option.textContent = `${deviceId} (discovered)`;
    deviceIdSelect.appendChild(option);
    
    // Select the newly added device
    deviceIdSelect.value = deviceId;
    
    updateStatus(`Connected to discovered device: ${deviceId}`);
    
    // Switch to remote tab
    document.querySelector('[data-tab="remote"]').click();
}

// Populate device list
function populateDevices(devices) {
    // Clear existing options except the first one
    while (deviceIdSelect.options.length > 1) {
        deviceIdSelect.remove(1);
    }
    
    // Add devices to the dropdown
    devices.forEach(device => {
        const option = document.createElement('option');
        option.value = device.id;
        option.textContent = `${device.id} (${device.status})`;
        deviceIdSelect.appendChild(option);
    });
    
    updateStatus(`Found ${devices.length} device(s)`);
}

// Send command to the server
function sendCommand(command) {
    const deviceId = deviceIdSelect.value;
    
    if (!deviceId) {
        updateError('Please select a device first');
        return;
    }
    
    updateStatus(`Sending command: ${command}`);
    
    socket.emit('sendCommand', { deviceId, command });
}

// Send text input to the server
function sendTextInput(text) {
    const deviceId = deviceIdSelect.value;
    
    if (!deviceId) {
        updateError('Please select a device first');
        return;
    }
    
    updateStatus(`Sending text: ${text}`);
    
    socket.emit('sendText', { deviceId, text });
}

// Send mouse click to the server
function sendMouseClick(button) {
    const deviceId = deviceIdSelect.value;
    
    if (!deviceId) {
        updateError('Please select a device first');
        return;
    }
    
    // For now, we'll send a center click as an example
    // In a more advanced implementation, you might capture actual screen coordinates
    const command = button === 'left' ? 
        'input keyevent KEYCODE_DPAD_CENTER' : 
        'input keyevent KEYCODE_BACK';
    
    updateStatus(`Sending ${button} click`);
    socket.emit('sendCommand', { deviceId, command });
}

// Send tap command to the server
function sendTap(x, y) {
    const deviceId = deviceIdSelect.value;
    
    if (!deviceId) {
        updateError('Please select a device first');
        return;
    }
    
    updateStatus(`Sending tap at coordinates: ${x}, ${y}`);
    socket.emit('sendTap', { deviceId, x, y });
}

// Start screen capture
function startScreenCapture() {
    const deviceId = deviceIdSelect.value;
    
    if (!deviceId) {
        updateError('Please select a device first');
        return;
    }
    
    updateStatus('Starting screen capture...');
    screenContainer.style.display = 'block';
    frameCount = 0;
    lastFpsUpdate = Date.now();
    socket.emit('startScreenCapture', { deviceId });
}

// Stop screen capture
function stopScreenCapture() {
    updateStatus('Stopping screen capture...');
    screenContainer.style.display = 'none';
    socket.emit('stopScreenCapture');
}

// Refresh device list
function refreshDevices() {
    updateStatus('Refreshing devices...');
    socket.emit('listDevices');
}

// Disconnect selected device
function disconnectDevice() {
    const deviceId = deviceIdSelect.value;
    
    if (!deviceId) {
        updateError('Please select a device first');
        return;
    }
    
    updateStatus(`Disconnecting device: ${deviceId}`);
    socket.emit('disconnectDevice', { deviceId });
}

// Scan network for devices
function scanNetwork() {
    const networkRange = networkRangeInput.value;
    updateScanStatus('Starting network scan...');
    discoveredDevicesEl.innerHTML = ''; // Clear previous results
    socket.emit('scanNetwork', { networkRange });
}

// Handle screen data
function handleScreenData(data) {
    try {
        // Create image directly from base64 data
        const img = new Image();
        img.onload = function() {
            // Draw the image on the canvas
            screenCanvas.width = img.width;
            screenCanvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            // Update FPS counter
            frameCount++;
            const now = Date.now();
            if (now - lastFpsUpdate >= 1000) { // Update every second
                const fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
                fpsCounter.textContent = `${fps} FPS`;
                frameCount = 0;
                lastFpsUpdate = now;
            }
            
            // Clean up
            URL.revokeObjectURL(this.src);
        };
        img.onerror = function() {
            console.error('Error loading screen image');
        };
        img.src = 'data:image/png;base64,' + data.data;
    } catch (e) {
        console.error('Error processing screen data:', e);
    }
}

// Toggle keyboard input
function toggleKeyboardInput() {
    keyboardInputEnabled = !keyboardInputEnabled;
    
    if (keyboardInputEnabled) {
        // Show and focus the visible input to trigger mobile keyboard
        inputContainer.classList.add('active');
        visibleInput.classList.add('active');
        visibleInput.focus();
        toggleKeyboardBtn.textContent = 'Hide Keyboard';
        toggleKeyboardBtn.classList.add('active');
    } else {
        // Hide the visible input
        inputContainer.classList.remove('active');
        visibleInput.classList.remove('active');
        visibleInput.value = ''; // Clear the input field
        toggleKeyboardBtn.textContent = 'Show Keyboard';
        toggleKeyboardBtn.classList.remove('active');
    }
}

// Handle keyboard events
function handleKeyboardEvent(event) {
    if (!keyboardInputEnabled) return;
    
    // Prevent default behavior for most keys to avoid browser shortcuts
    if (event.key !== 'F5' && event.key !== 'F12') {
        event.preventDefault();
    }
    
    // Handle special keys
    switch (event.key) {
        case 'Enter':
            sendCommand('input keyevent KEYCODE_ENTER');
            break;
        case 'Backspace':
            sendCommand('input keyevent KEYCODE_DEL');
            break;
        case 'Escape':
            sendCommand('input keyevent KEYCODE_BACK');
            break;
        case 'ArrowUp':
            sendCommand('input keyevent KEYCODE_DPAD_UP');
            break;
        case 'ArrowDown':
            sendCommand('input keyevent KEYCODE_DPAD_DOWN');
            break;
        case 'ArrowLeft':
            sendCommand('input keyevent KEYCODE_DPAD_LEFT');
            break;
        case 'ArrowRight':
            sendCommand('input keyevent KEYCODE_DPAD_RIGHT');
            break;
        case ' ':
            sendTextInput(' '); // Send space as text input, not keyevent
            break;
        case 'Shift':
            isShiftPressed = true;
            break;
        case 'Control':
        case 'Meta': // Cmd key on Mac
            // Could be used for copy/paste shortcuts
            break;
        case 'Tab':
            sendCommand('input keyevent KEYCODE_TAB');
            break;
        default:
            // Handle regular text input
            if (event.key.length === 1) {
                // For letters, numbers, and symbols, send them as text input
                sendTextInput(event.key);
            }
            break;
    }
}

// Handle input events on the visible input field with better backspace support
function handleInputEvent(event) {
    if (!keyboardInputEnabled) return;
    
    const currentValue = event.target.value;
    
    // If the current value is shorter than the previous value, it's likely a backspace/delete
    if (currentValue.length < previousInputValue.length) {
        // Calculate how many characters were deleted
        const diff = previousInputValue.length - currentValue.length;
        
        // Send backspace commands for each deleted character
        for (let i = 0; i < diff; i++) {
            sendCommand('input keyevent KEYCODE_DEL');
        }
        
        // Then send the new text that was typed (if any)
        if (currentValue.length > 0) {
            sendTextInput(currentValue);
        }
    } 
    // If the current value is longer, characters were added
    else if (currentValue.length > previousInputValue.length) {
        // Send only the new characters
        const newChars = currentValue.substring(previousInputValue.length);
        sendTextInput(newChars);
    }
    // If same length, it might be a replacement (like typing over selected text)
    else if (currentValue !== previousInputValue) {
        // For simplicity, we'll clear and resend the entire text
        // First, clear the field with backspaces
        for (let i = 0; i < previousInputValue.length; i++) {
            sendCommand('input keyevent KEYCODE_DEL');
        }
        // Then send the new text
        if (currentValue.length > 0) {
            sendTextInput(currentValue);
        }
    }
    
    // Update the previous value
    previousInputValue = currentValue;
    
    // Clear the input field to prepare for next input
    event.target.value = '';
    previousInputValue = '';
}

// Clear input field
function clearInput() {
    visibleInput.value = '';
    previousInputValue = '';
    visibleInput.focus();
}

// Send input text
function sendInput() {
    const text = visibleInput.value;
    if (text) {
        sendTextInput(text);
        visibleInput.value = '';
        previousInputValue = '';
        visibleInput.focus();
    }
}

function handleKeyboardUp(event) {
    if (event.key === 'Shift') {
        isShiftPressed = false;
    }
}

// Mouse pad event handlers
function handleMouseDown(event) {
    isMouseDown = true;
    lastX = event.clientX || (event.touches && event.touches[0].clientX) || 0;
    lastY = event.clientY || (event.touches && event.touches[0].clientY) || 0;
    mousePadSurface.style.backgroundColor = '#3d3d3d';
}

function handleMouseMove(event) {
    if (!isMouseDown) return;
    
    event.preventDefault();
    
    const currentX = event.clientX || (event.touches && event.touches[0].clientX) || 0;
    const currentY = event.clientY || (event.touches && event.touches[0].clientY) || 0;
    
    // Calculate movement delta
    const deltaX = currentX - lastX;
    const deltaY = currentY - lastY;
    
    // Scale down the movement for better control
    const scaledDeltaX = Math.round(deltaX * 0.5);
    const scaledDeltaY = Math.round(deltaY * 0.5);
    
    // Send swipe command with the movement
    if (scaledDeltaX !== 0 || scaledDeltaY !== 0) {
        sendSwipe(scaledDeltaX, scaledDeltaY);
    }
    
    // Update last position
    lastX = currentX;
    lastY = currentY;
}

function handleMouseUp() {
    isMouseDown = false;
    mousePadSurface.style.backgroundColor = '#2d2d2d';
}

function sendSwipe(deltaX, deltaY) {
    const deviceId = deviceIdSelect.value;
    
    if (!deviceId) {
        updateError('Please select a device first');
        return;
    }
    
    // We'll simulate a swipe by sending multiple small movements
    // For now, we'll just send a single swipe command
    updateStatus(`Sending swipe: ${deltaX}, ${deltaY}`);
    
    // Send swipe command to server
    socket.emit('sendSwipe', { 
        deviceId, 
        x1: 100, 
        y1: 100, 
        x2: 100 + deltaX, 
        y2: 100 + deltaY,
        duration: 100
    });
}

// Event listeners for command buttons
buttons.forEach(button => {
    button.addEventListener('click', () => {
        const command = button.getAttribute('data-command');
        sendCommand(command);
    });
});

// Event listeners for screen controls
startScreenBtn.addEventListener('click', startScreenCapture);
stopScreenBtn.addEventListener('click', stopScreenCapture);

// Event listener for refresh devices button
refreshDevicesBtn.addEventListener('click', refreshDevices);

// Event listener for disconnect device button
disconnectDeviceBtn.addEventListener('click', disconnectDevice);

// Event listener for network scan button
scanNetworkBtn.addEventListener('click', scanNetwork);

// Event listener for keyboard toggle button
toggleKeyboardBtn.addEventListener('click', toggleKeyboardInput);

// Event listeners for keyboard input
document.addEventListener('keydown', handleKeyboardEvent);
document.addEventListener('keyup', handleKeyboardUp);

// Event listener for input on visible field
visibleInput.addEventListener('input', handleInputEvent);

// Add click event to screen canvas for mouse input
screenCanvas.addEventListener('click', (event) => {
    const deviceId = deviceIdSelect.value;
    
    if (!deviceId) {
        updateError('Please select a device first');
        return;
    }
    
    // Calculate the click position relative to the canvas
    const rect = screenCanvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) * (screenCanvas.width / rect.width));
    const y = Math.floor((event.clientY - rect.top) * (screenCanvas.height / rect.height));
    
    updateStatus(`Sending tap at coordinates: ${x}, ${y}`);
    
    // Send tap command with coordinates
    socket.emit('sendTap', { deviceId, x, y });
});

// Screen control buttons
screenControlLeft.addEventListener('click', () => sendCommand('input keyevent KEYCODE_DPAD_LEFT'));
screenControlCenter.addEventListener('click', () => sendCommand('input keyevent KEYCODE_DPAD_CENTER'));
screenControlRight.addEventListener('click', () => sendCommand('input keyevent KEYCODE_DPAD_RIGHT'));

// Input control buttons
clearInputBtn.addEventListener('click', clearInput);
sendInputBtn.addEventListener('click', sendInput);

// Mouse pad event listeners
mousePadSurface.addEventListener('mousedown', handleMouseDown);
mousePadSurface.addEventListener('mousemove', handleMouseMove);
mousePadSurface.addEventListener('mouseup', handleMouseUp);
mousePadSurface.addEventListener('mouseleave', handleMouseUp);

// Touch events for mobile
mousePadSurface.addEventListener('touchstart', (event) => {
    handleMouseDown(event.touches[0]);
    event.preventDefault();
});

mousePadSurface.addEventListener('touchmove', (event) => {
    handleMouseMove(event.touches[0]);
    event.preventDefault();
});

mousePadSurface.addEventListener('touchend', handleMouseUp);

// Mouse button event listeners
mouseLeftClickBtn.addEventListener('click', () => sendMouseClick('left'));
mouseRightClickBtn.addEventListener('click', () => sendMouseClick('right'));

// Socket event handlers
socket.on('connect', () => {
    updateStatus('Connected to server');
    // Refresh devices when connected
    refreshDevices();
});

socket.on('commandResponse', (data) => {
    if (data.error) {
        updateError(`Error: ${data.error}`);
    } else {
        updateStatus('Command sent successfully');
    }
});

socket.on('devicesList', (data) => {
    if (data.error) {
        updateError(`Error listing devices: ${data.error}`);
    } else {
        populateDevices(data.devices);
    }
});

socket.on('disconnectResponse', (data) => {
    if (data.error) {
        updateError(`Error disconnecting device: ${data.error}`);
    } else {
        updateStatus(`Successfully disconnected device: ${data.deviceId}`);
        
        // Remove the disconnected device from the dropdown
        const options = deviceIdSelect.options;
        for (let i = 0; i < options.length; i++) {
            if (options[i].value === data.deviceId) {
                deviceIdSelect.remove(i);
                break;
            }
        }
        
        // If no devices left, select the default option
        if (deviceIdSelect.options.length <= 1) {
            deviceIdSelect.selectedIndex = 0;
        }
    }
});

socket.on('screenData', (data) => {
    // Handle screen capture data
    handleScreenData(data);
});

socket.on('screenCaptureStopped', () => {
    updateStatus('Screen capture stopped');
    fpsCounter.textContent = '0 FPS';
});

socket.on('scanStatus', (data) => {
    updateScanStatus(data.status);
});

socket.on('scanProgress', (data) => {
    updateScanProgress(data.progress);
});

socket.on('deviceDiscovered', (data) => {
    addDiscoveredDevice(data.deviceId);
});

socket.on('scanComplete', (data) => {
    updateScanStatus(`Scan complete. Found ${data.devices.length} potential devices.`);
});

socket.on('disconnect', () => {
    updateError('Disconnected from server');
});