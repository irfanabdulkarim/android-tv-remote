const { exec } = require('child_process');

// Test the same logic as in server.js
exec('adb devices', (error, stdout, stderr) => {
  if (error) {
    console.error('Error listing devices:', error);
    return;
  }
  
  if (stderr) {
    console.error('Devices list stderr:', stderr);
    return;
  }
  
  console.log('Raw stdout:');
  console.log(stdout);
  
  // Parse the devices list
  const devices = [];
  const lines = stdout.trim().split('\n');
  console.log('Lines:', lines);
  
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split('\t');
    console.log('Parts for line', i, ':', parts);
    if (parts.length >= 2) {
      devices.push({
        id: parts[0],
        status: parts[1]
      });
    }
  }
  
  console.log('Parsed devices:', devices);
});