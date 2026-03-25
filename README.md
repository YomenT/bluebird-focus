# Bluebird Focus

A minimal, distraction-free focus timer for your desktop — built with React and Tauri.

## Download

Pre-built binaries are available on the [Releases](https://github.com/YomenT/bluebird-focus/releases) page.

> **Note:** You must install from the Releases page. Cloning and building from source will not include the Firebase API key required for the app to function.

| Platform | Status |
|----------|--------|
| Linux    | ✅ Available |
| Windows  | ✅ Available |

## Installation (Linux)

1. Download `bluebird-focus_0.1.0_linux.tar.gz` from the [Releases](https://github.com/YomenT/bluebird-focus/releases/latest) page.
2. Extract the archive:
   ```bash
   tar -xzf bluebird-focus_0.1.0_linux.tar.gz
   cd bluebird-focus
   ```

### Option 1 — Run directly (no install)

```bash
chmod +x bluebird-focus_*.AppImage
./bluebird-focus_*.AppImage
```

### Option 2 — Install system-wide (recommended)

The included `install.sh` script installs the app to `~/.local/bin` and adds it to your application launcher. Running it again on a newer release will update the existing installation.

```bash
chmod +x install.sh
./install.sh
```

## Installation (Windows)

1. Download `bluebird-focus_0.1.0_windows.zip` from the [Releases](https://github.com/YomenT/bluebird-focus/releases/latest) page.
2. Extract the zip and run the `.exe` installer.
3. Follow the setup wizard.

To update to a newer version, simply download and run the new installer — it will upgrade the existing installation automatically. You do not need to uninstall first.

## License

[MIT](LICENSE)
