# TVRmote - Web-based Android TV Remote Control

A web-based remote control for Android TV boxes using ADB over the internet.

## Features

- Web-based interface for controlling Android TV boxes
- Navigation controls (up, down, left, right, center)
- Action buttons (back, home, menu)
- Power and volume controls
- Support for multiple devices
- Secure command execution

## Prerequisites

- Node.js and npm installed
- ADB (Android Debug Bridge) installed
- Android TV box with ADB debugging enabled
- Network connectivity between the server and the TV box

## Setup

1. Clone or download this repository
2. Install dependencies:
   ```
   npm install
   ```

## Configuration

1. Enable Developer Options on your Android TV:
   - Go to Settings
   - About > Build Number (tap 7 times)
   
2. Enable ADB debugging:
   - Go to Settings > Developer Options
   - Enable "ADB Debugging"
   - Enable "Unknown Sources" if you plan to install apps

3. Connect your Android TV to the same network as your server

4. Find your TV's IP address:
   - Go to Settings > Network & Internet > Network Status
   - Note the IP address

5. Connect ADB to your TV over network:
   ```
   adb connect TV_IP_ADDRESS:5555
   ```

## Usage

1. Start the server:
   ```
   npm start
   ```
   
2. Open your browser and navigate to `http://localhost:3000`

3. Select your device from the dropdown list

4. Use the remote control interface to control your TV

## Building APK with GitHub Actions

This repository includes GitHub Actions workflows to automatically build APK files:

1. **Debug Build**: Automatically builds a debug APK on every push to the main branch
2. **Release Build**: Builds and signs a release APK (requires signing keys)

To use these workflows:

1. Push your changes to the main branch
2. Go to the "Actions" tab in your GitHub repository
3. Select the workflow you want to run
4. Download the generated APK from the "Artifacts" section

For release builds, you'll need to set up signing keys as GitHub secrets:
- SIGNING_KEY
- KEY_ALIAS
- KEY_STORE_PASSWORD
- KEY_PASSWORD

## Security Considerations

- This application should only be run in a trusted network environment
- The server exposes control over your devices, so protect access to it
- Commands are validated on the server side to prevent arbitrary command execution
- For external access, consider using a VPN or SSH tunneling

## Troubleshooting

### Device not showing in the list
- Ensure ADB debugging is enabled on your TV
- Check network connectivity between the server and TV
- Try reconnecting: `adb connect TV_IP_ADDRESS:5555`

### Commands not working
- Make sure your TV is not in a sleep state
- Check if the selected device is still connected: `adb devices`
- Try disconnecting and reconnecting: `adb disconnect TV_IP_ADDRESS:5555` then `adb connect TV_IP_ADDRESS:5555`

## Customization

You can add more buttons or modify existing ones by editing:
- `public/index.html` - for the interface
- `public/style.css` - for styling
- `server.js` - to add new allowed commands

## License

MIT