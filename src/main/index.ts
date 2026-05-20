import { app, BrowserWindow, ipcMain, dialog, shell, clipboard } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { downloadManager } from './downloadManager'
import { getSettings, saveSettings, defaultSettings } from './settings'

// ─── Utility Functions ──────────────────────────────────────────────────────

function extractPlatform(url: string): string {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'YouTube'
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'Twitter'
    if (hostname.includes('tiktok.com')) return 'TikTok'
    if (hostname.includes('instagram.com')) return 'Instagram'
    if (hostname.includes('twitch.tv')) return 'Twitch'
    if (hostname.includes('reddit.com')) return 'Reddit'
    if (hostname.includes('vimeo.com')) return 'Vimeo'
    if (hostname.includes('dailymotion.com')) return 'DailyMotion'
    if (hostname.includes('facebook.com')) return 'Facebook'
    if (hostname.includes('pixiv.net')) return 'Pixiv'
    if (hostname.includes('danbooru.donmai.us')) return 'Danbooru'
    if (hostname.includes('deviantart.com')) return 'DeviantArt'
    // Extract base domain as fallback
    const parts = hostname.split('.')
    if (parts.length > 1) {
      const main = parts[parts.length - 2]
      return main.charAt(0).toUpperCase() + main.slice(1)
    }
    return 'Unknown'
  } catch {
    return 'Unknown'
  }
}

function buildOrganizedPath(basePath: string, pattern: string, platform: string, uploader?: string): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const dateFolder = `${year}-${month}`
  
  const uploaderFolder = uploader ? uploader.replace(/[<>:"\\/|?*]/g, '_').slice(0, 50) : 'Unknown'

  switch (pattern) {
    case 'platform-date':
      return join(basePath, platform, dateFolder)
    case 'date-platform':
      return join(basePath, dateFolder, platform)
    case 'uploader-date':
      return join(basePath, uploaderFolder, dateFolder)
    default:
      return basePath
  }
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1120,
    height: 720,
    minWidth: 860,
    minHeight: 580,
    frame: false,
    backgroundColor: '#0d0d10',
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
      allowRunningInsecureContent: false,
      worldSafeExecuteJavaScript: true,
      v8Code: false,
      devTools: false
    }
  })

  win.on('ready-to-show', () => {
    win.show()
  })

  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.fetchmethis')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const win = createWindow()

  // Forward download events to renderer
  downloadManager.on('progress', (data) => win.webContents.send('download-progress', data))
  downloadManager.on('complete', (data) => win.webContents.send('download-complete', data))
  downloadManager.on('error', (data) => win.webContents.send('download-error', data))
  downloadManager.on('cancelled', (data) => win.webContents.send('download-cancelled', data))
  downloadManager.on('download-log', (data) => win.webContents.send('download-output', data))

  // Window controls
  ipcMain.on('window-minimize', () => win.minimize())
  ipcMain.on('window-maximize', () => {
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
  })
  ipcMain.on('window-close', () => win.close())
  ipcMain.handle('window-is-maximized', () => win.isMaximized())

  // yt-dlp management
  ipcMain.handle('check-ytdlp', async () => {
    return {
      installed: downloadManager.isYtDlpInstalled(),
      path: downloadManager.getYtDlpPath()
    }
  })

  ipcMain.handle('install-ytdlp', async () => {
    try {
      await downloadManager.installYtDlp((progress) => {
        win.webContents.send('ytdlp-install-progress', progress)
      })
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // Video info
  ipcMain.handle('fetch-video-info', async (_e, url: string) => {
    try {
      // Validate URL
      if (!url || typeof url !== 'string') {
        throw new Error('Invalid URL format')
      }
      const urlObj = new URL(url)
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Only HTTP(S) URLs are supported')
      }
      const info = await downloadManager.fetchVideoInfo(url)
      return { success: true, data: info }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // Downloads
  ipcMain.handle('start-download', async (_e, request) => {
    const settings = getSettings()
    try {
      // Validate request object
      if (!request || typeof request !== 'object') {
        throw new Error('Invalid request format')
      }
      if (!request.id || typeof request.id !== 'string') {
        throw new Error('Invalid download ID')
      }
      if (!request.url || typeof request.url !== 'string') {
        throw new Error('Invalid URL')
      }
      // Validate URL
      new URL(request.url)
      
      // Extract platform from URL
      const platform = extractPlatform(request.url)
      
      // Build output directory with auto-organize if enabled
      let outputDir = settings.downloadPath
      if (settings.autoOrganize && settings.organizePattern !== 'none') {
        outputDir = buildOrganizedPath(
          settings.downloadPath,
          settings.organizePattern,
          platform,
          request.title
        )
      }
      
      await downloadManager.startDownload({
        ...request,
        outputDir,
        platform,
        downloadSubtitles: settings.downloadSubtitles,
        extractChapters: settings.extractChapters,
        enrichMetadata: settings.enrichMetadata,
        ffmpegCustomPath: settings.ffmpegCustomPath,
        galleryDlCustomPath: settings.galleryDlCustomPath
      })
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('cancel-download', (_e, id: string) => {
    downloadManager.cancelDownload(id)
    return { success: true }
  })

  // ffmpeg
  ipcMain.handle('check-ffmpeg', () => {
    const settings = getSettings()
    const path = downloadManager.findFfmpeg(settings.ffmpegCustomPath)
    return { available: !!path, path: path || '' }
  })

  ipcMain.handle('install-ffmpeg', async () => {
    try {
      await downloadManager.installFfmpeg((progress) => {
        win.webContents.send('ffmpeg-install-progress', progress)
      })
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // gallery-dl
  ipcMain.handle('check-gallery-dl', () => {
    const settings = getSettings()
    return {
      installed: downloadManager.isGalleryDlInstalled(settings.galleryDlCustomPath),
      path: downloadManager.getGalleryDlPath(settings.galleryDlCustomPath)
    }
  })

  ipcMain.handle('install-gallery-dl', async () => {
    try {
      await downloadManager.installGalleryDl((progress) => {
        win.webContents.send('gallery-dl-install-progress', progress)
      })
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // File system
  ipcMain.handle('open-file', (_e, filePath: string) => {
    shell.openPath(filePath)
  })

  ipcMain.handle('open-folder', (_e, folderPath: string) => {
    shell.openPath(folderPath)
  })

  ipcMain.handle('reveal-file', (_e, filePath: string) => {
    shell.showItemInFolder(filePath)
  })

  ipcMain.handle('copy-to-clipboard', (_e, text: string) => {
    clipboard.writeText(text)
  })

  ipcMain.handle('choose-directory', async () => {
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory']
    })
    if (result.canceled) return null
    return result.filePaths[0]
  })

  // Settings
  ipcMain.handle('get-settings', () => getSettings())
  ipcMain.handle('save-settings', (_e, settings) => {
    try {
      if (!settings || typeof settings !== 'object') {
        throw new Error('Invalid settings format')
      }
      // Validate critical settings
      if (settings.maxConcurrentDownloads !== undefined) {
        const num = Number(settings.maxConcurrentDownloads)
        if (!Number.isInteger(num) || num < 1 || num > 10) {
          throw new Error('maxConcurrentDownloads must be between 1 and 10')
        }
      }
      saveSettings(settings)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })
  ipcMain.handle('get-default-download-path', () => {
    return defaultSettings.downloadPath
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
