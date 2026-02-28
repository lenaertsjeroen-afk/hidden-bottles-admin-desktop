# Hidden Bottles Admin Desktop App

**Version 2.0.0** - One-Time Activation Code Support

A standalone desktop application for managing the Hidden Bottles marketplace admin panel.

## What's New in v2.0.0

### One-Time Activation Code System
- **No more repeated logins!** Activate your device once with a code, and you're automatically logged in on future launches.
- Generate activation codes from the web admin dashboard (Settings → Desktop App)
- Codes are valid for 24 hours and can only be used once
- Admins can view and revoke activated devices at any time

### How to Activate
1. Log in to the web admin dashboard
2. Go to **Settings → Desktop App**
3. Click **"Generate Activation Code"**
4. Open the desktop app and enter the code (format: XXXX-XXXX-XXXX)
5. Done! The app will remember your device.

## Features

- **Dedicated Admin Access** - Direct access to the admin panel without browser distractions
- **System Tray** - Minimize to system tray, stays running in background
- **Auto-Updates** - Automatic update notifications when new versions are available
- **One-Time Activation** - Activate once per device, no repeated sign-ins
- **Fallback Login** - Traditional email/password login still available if needed
- **Secure** - Device tokens can be revoked from the admin dashboard at any time

## Installation

### Windows
1. Download `Hidden Bottles Admin-2.0.0-Setup.exe`
2. Run the installer
3. Launch from Start Menu or Desktop shortcut
4. Enter your activation code

### Mac
1. Download `Hidden Bottles Admin-2.0.0.dmg`
2. Open the DMG and drag to Applications
3. Launch from Applications
4. Enter your activation code

### Linux
1. Download `Hidden-Bottles-Admin-2.0.0.AppImage`
2. Make it executable: `chmod +x Hidden-Bottles-Admin-2.0.0.AppImage`
3. Run it
4. Enter your activation code

## Building from Source

### Prerequisites
- Node.js 18+ (required)
- npm or yarn

### Using NPM
```bash
# Install dependencies
npm install

# Run in development
npm start

# Build for Windows
npm run build:win

# Build for Mac
npm run build:mac

# Build for Linux
npm run build:linux
```

### Using Yarn
```bash
# Install dependencies
yarn install

# Run in development
yarn start

# Build for Windows
yarn build:win

# Build for Mac
yarn build:mac

# Build for Linux
yarn build:linux
```

### Quick Start (Windows)
```bash
# 1. Extract the zip file
# 2. Open terminal in the extracted folder
# 3. Run:
npm install
npm run build:win

# 4. Find the installer in the 'dist' folder:
#    - Hidden Bottles Admin-2.0.0-Setup.exe (installer)
#    - Hidden Bottles Admin-2.0.0-Portable.exe (portable)
```

## Troubleshooting

### "Invalid activation code"
- Ensure the code hasn't expired (valid for 24 hours)
- Check that the code hasn't been used on another device
- Generate a new code from the admin dashboard

### "Device deactivated"
- Your device was remotely deactivated by an admin
- Generate a new activation code to reactivate

### Reset App Data
Click "Having trouble? Reset app data" on the login screen to clear all stored data and start fresh.

## Security Notes

- Activation codes expire after 24 hours
- Each code can only be used once
- Admins can view all activated devices and revoke access at any time
- Device tokens are stored securely using electron-store

## Changelog

### v2.0.0 (Feb 2026)
- Added one-time activation code system
- Two-tab login: Activation Code (default) + Admin Login (fallback)
- Device token stored locally for auto-login
- Logout now clears device token
- Updated to Electron 28

### v1.0.2
- Fixed login authentication issues
- Added "Remember Me" feature
- Improved error handling

### v1.0.0
- Initial release
