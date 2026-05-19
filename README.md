# FetchMeThis

A modern, local video downloader powered by **yt-dlp**. Supports 1000+ websites including YouTube, Twitter/X, TikTok, Instagram, Twitch, Reddit, and many more.

![FetchMeThis screenshot](src/screenshot.png)

**⚠️ LEGAL DISCLAIMER**: Ensure you have the right to download content you access. FetchMeThis is a tool—users are responsible for legal compliance.

## Features

- **One-time auto-setup** — downloads yt-dlp automatically on first run, no manual install needed
- **Smart info fetching** — shows thumbnail, title, uploader, and duration before downloading
- **Format & quality selector** — Best quality, 4K, 1080p, 720p, 480p, 360p, Audio-only (MP3)
- **Real-time progress** — live progress bar, speed, and ETA per download
- **Concurrent downloads** — configurable, up to 5 simultaneous downloads
- **Download history** — persists between sessions, with quick folder-open action
- **Cancel support** — cancel any active download
- **Modern dark UI** — frameless window with custom titlebar

## Installation

### From Release

1. Download the latest release for your OS from [Releases](https://github.com/neetfrog/FetchMeThis/releases)
2. **Windows**: Run the NSIS installer or portable exe
3. **macOS**: Mount DMG, drag app to Applications
4. **Linux**: Install AppImage or deb package

### From Source

```bash
git clone https://github.com/yourusername/viddown.git
cd viddown
npm install
npm run package      # Creates installer in dist/
```

## Supported Platforms

| Platform | Format | Notes |
|----------|--------|-------|
| **Windows** | NSIS installer, Portable exe | Windows 7+ |
| **macOS** | DMG, Zip | macOS 10.13+ (Intel & Apple Silicon) |
| **Linux** | AppImage, deb | Ubuntu 16.04+, Fedora 21+, Debian 8+ |

## Requirements

- **Disk space**: ~500 MB for binaries (yt-dlp, ffmpeg optional)
- **RAM**: 1 GB minimum
- **Internet**: For downloading, info fetching, and auto-updates of binaries

## Development

### Quick start
```bash
npm install
npm run dev      # Launch dev build with hot-reload
```

### Build & package
```bash
npm run build           # Build for current platform
npm run package         # Create installer/package
npm run package:all     # Build for Windows, macOS, Linux
```

### Code quality
```bash
npm run lint            # Check code style
npm run test            # Run tests
npm run format          # Format with Prettier
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed dev guide.

## Tech Stack

- [Electron](https://electronjs.org) + [electron-vite](https://electron-vite.org)
- [React 18](https://react.dev) + TypeScript
- [Tailwind CSS](https://tailwindcss.com)
- [Zustand](https://zustand-demo.pmnd.rs) state management
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) (auto-downloaded binary)
- [framer-motion](https://www.framer.com/motion) animations
- [Lucide React](https://lucide.dev) icons
- [electron-builder](https://www.electron.build) packaging

## Configuration

Settings are stored in `~/.fetchmethis/settings.json`:

```json
{
  "downloadPath": "/path/to/downloads/FetchMeThis",
  "maxConcurrentDownloads": 3,
  "defaultFormat": "bestvideo+bestaudio/best",
  "embedThumbnail": false,
  "addMetadata": true,
  "ytdlpCustomPath": "",
  "ffmpegCustomPath": "",
  "galleryDlCustomPath": ""
}
```

## Binaries

FetchMeThis auto-downloads and manages:

- **yt-dlp**: YouTube video/playlist downloader
- **ffmpeg** (optional): Audio/video conversion
- **gallery-dl** (optional): Multi-site downloader

**Installation location**: `~/.fetchmethis/bin/`

## Supported Sites

Everything [yt-dlp supports](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md):

- YouTube, YouTube Music
- Twitter/X, TikTok, Instagram, Threads
- Twitch, Kick
- Reddit, 4chan
- Facebook, LinkedIn
- Vimeo, Dailymotion
- SoundCloud, Spotify, Bandcamp
- Pornhub, OnlyFans*
- 1000+ more sites

*Use responsibly and legally.

## Privacy & Security

FetchMeThis is **local-first**: all processing happens on your machine. We don't collect data.

- No telemetry or tracking
- No account creation required
- Downloads stay private
- GitHub API used only to fetch binary releases

See [PRIVACY.md](PRIVACY.md) for full privacy policy.

## License

MIT License — see [LICENSE](LICENSE)

### Third-Party Licenses
- **yt-dlp**: Public Domain / MIT
- **ffmpeg**: GPL v2 / v3
- **gallery-dl**: GPL v2

## Troubleshooting

### "yt-dlp binary not found"
- Click "Install yt-dlp" in the Setup screen
- Ensure you have internet and write permissions to `~/.fetchmethis/`

### Download fails with "yt-dlp error"
- Website may have changed its structure
- Try updating yt-dlp via the app settings or manually

### Windows Defender warning
- This is normal for unsigned installers
- Build from source and sign with your own certificate for production
- See [Code Signing](#code-signing--distribution)

### macOS "App is damaged" error
- Remove quarantine: `xattr -d com.apple.quarantine FetchMeThis.app`

## Code Signing & Distribution

### Windows Code Signing
```bash
set CERT_FILE=path/to/cert.pfx
set CERT_PASS=your_password
npm run package:win
```

### macOS Notarization
```bash
npm run package:mac
# Follow Apple's notarization process with your Developer ID
```

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Development setup
- Code style guidelines
- Testing requirements
- Pull request process

## Changelog

See [Releases](https://github.com/neetfrog/FetchMeThis/releases) for version history.

## Support

- 📖 [Documentation](https://github.com/yourusername/viddown/wiki)
- 🐛 [Report Issues](https://github.com/yourusername/viddown/issues)
- 💬 [Discussions](https://github.com/yourusername/viddown/discussions)

---

Made with ❤️ by FetchMeThis contributors
