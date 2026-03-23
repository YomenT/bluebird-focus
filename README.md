# Bluebird Focus

A minimal, distraction-free focus timer for your desktop — built with React and Tauri.

## Download

Pre-built binaries are available on the [Releases](https://github.com/YomenT/bluebird-focus/releases) page.

| Platform | Status |
|----------|--------|
| Linux    | ✅ Available |
| Windows  | 🔜 Coming Soon |

## Installation (Linux)

### Option 1 — AppImage (recommended, no install needed)

1. Download `bluebird-focus_0.1.0_linux.tar.gz` from the [repository](https://github.com/YomenT/bluebird-focus/blob/main/bluebird-focus_0.1.0_linux.tar.gz).
2. Extract the archive:
   ```bash
   tar -xzf bluebird-focus_0.1.0_linux.tar.gz
   ```
3. Make the AppImage executable and run it:
   ```bash
   chmod +x bluebird-focus_*.AppImage
   ./bluebird-focus_*.AppImage
   ```

### Option 2 — install.sh script

The repository includes an `install.sh` convenience script:

```bash
tar -xzf bluebird-focus_0.1.0_linux.tar.gz
cd bluebird-focus
chmod +x install.sh
./install.sh
```

## Building from source

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://www.rust-lang.org/tools/install) (stable)
- Tauri CLI and system dependencies — see the [Tauri prerequisites guide](https://tauri.app/start/prerequisites/)

### Steps

```bash
git clone https://github.com/YomenT/bluebird-focus.git
cd bluebird-focus

npm install
npm run build          # Build the React frontend
npm run tauri:build    # Package the Tauri desktop app
```

The packaged output will be in `src-tauri/target/release/bundle/`.

For development (hot-reload):

```bash
npm run dev
```

## License

[MIT](LICENSE)
