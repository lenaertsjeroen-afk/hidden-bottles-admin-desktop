# Hidden Bottles Admin - Desktop Application

A standalone Windows/Mac/Linux desktop application for the Hidden Bottles Admin Dashboard.

## Features

- **Dedicated Admin Login**: Secure login screen with animated Hidden Bottles branding
- **Embedded Web Dashboard**: Loads the full admin panel without website header/footer
- **Auto Updates**: Automatic update checking with one-click install (supports rollback via releases)
- **System Tray**: Minimize to system tray for quick access
- **Persistent Sessions**: Remember login sessions across app restarts
- **Light Theme**: Clean, professional light theme

## Project Structure

```
desktop-app/
├── main.js              # Electron main process with auto-update
├── preload.js           # Secure API bridge for renderer
├── login.html           # Admin login screen
├── admin.html           # Admin dashboard container (iframe)
├── splash.html          # Loading splash screen
├── package.json         # App configuration & build settings
├── assets/
│   └── icon.png         # App icon
└── .github/
    └── workflows/
        └── build-release.yml  # CI/CD for automated builds
```

## Development

### Prerequisites

- Node.js 18+ 
- Yarn package manager
- For Windows builds on Linux: Wine

### Setup

```bash
cd desktop-app
yarn install
```

### Run in Development Mode

```bash
yarn start
```

## Building for Distribution

### Option 1: Build Locally

**Windows (from Windows)**:
```bash
yarn build:win
```

**Windows (from Linux with Wine)**:
```bash
# Install Wine first
apt-get install wine64
yarn build:win
```

**macOS (from macOS only)**:
```bash
yarn build:mac
```

**Linux**:
```bash
yarn build:linux
```

### Option 2: Use GitHub Actions (Recommended)

The project includes a GitHub Actions workflow that automatically builds for all platforms:

1. Push the `/app/desktop-app` folder to a new GitHub repository
2. Create a new tag to trigger the build:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. The workflow will build Windows, macOS, and Linux versions
4. Artifacts are automatically uploaded to GitHub Releases

### Build Outputs

| Platform | File | Size |
|----------|------|------|
| Windows Installer | `Hidden-Bottles-Admin-1.0.0-Setup.exe` | ~85 MB |
| Windows Portable | `Hidden-Bottles-Admin-1.0.0-win-x64-portable.zip` | ~209 MB |
| macOS | `Hidden-Bottles-Admin-1.0.0.dmg` | ~90 MB |
| Linux AppImage | `Hidden-Bottles-Admin-1.0.0.AppImage` | ~95 MB |
| Linux DEB | `hidden-bottles-admin_1.0.0_amd64.deb` | ~70 MB |

## Auto-Update Setup

The app uses `electron-updater` for automatic updates via GitHub Releases.

### Configuration Steps

1. **Create a GitHub Repository** for the desktop app
2. **Update `package.json`** with your repository details:
   ```json
   "publish": {
     "provider": "github",
     "owner": "your-org-or-username",
     "repo": "admin-desktop",
     "releaseType": "release"
   }
   ```
3. **Create a Release** on GitHub with the build artifacts
4. **Enable Auto-Update** in the app - it will check for updates on launch

### Rollback Support

To rollback to a previous version:
- Download the desired version from GitHub Releases
- Uninstall current version and install the older version
- Or use the portable version for side-by-side installations

## API Configuration

The app connects to the Hidden Bottles backend API. Default configuration:

```javascript
// In main.js
const store = new Store({
  defaults: {
    apiUrl: 'https://your-domain.com/api'
  }
});
```

Update the `apiUrl` default value before building for production.

## Web App Integration

The desktop app loads the web admin panel at `/admin?embedded=true&desktop=true`. This URL parameter:
- Hides the website header and footer
- Hides the mobile navigation
- Hides the "Download Desktop App" button (to avoid recursion)

## User Roles

- **Admin**: Standard administrator access
- **Super Admin**: Can manage other admin users

## Security

- All API communication uses HTTPS
- Tokens are stored securely using `electron-store`
- Context isolation enabled for renderer processes
- External links open in the default browser

## Troubleshooting

### App doesn't start
- Check if the API URL is correct in settings
- Verify network connectivity

### Auto-update fails
- Check GitHub Releases are publicly accessible
- Verify the `publish` configuration in `package.json`

### Login fails
- Ensure you have admin privileges on the web platform
- Check API endpoint is reachable

## License

PROPRIETARY - All rights reserved by Hidden Bottles
