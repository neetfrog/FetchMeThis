import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  // yt-dlp
  checkYtDlp: () => ipcRenderer.invoke('check-ytdlp'),
  installYtDlp: () => ipcRenderer.invoke('install-ytdlp'),

  // Video info
  fetchVideoInfo: (url: string) => ipcRenderer.invoke('fetch-video-info', url),

  // Downloads
  startDownload: (request: any) => ipcRenderer.invoke('start-download', request),
  cancelDownload: (id: string) => ipcRenderer.invoke('cancel-download', id),

  // File system
  openFile: (filePath: string) => ipcRenderer.invoke('open-file', filePath),
  openFolder: (folderPath: string) => ipcRenderer.invoke('open-folder', folderPath),
  revealFile: (filePath: string) => ipcRenderer.invoke('reveal-file', filePath),
  copyToClipboard: (text: string) => ipcRenderer.invoke('copy-to-clipboard', text),
  chooseDirectory: () => ipcRenderer.invoke('choose-directory'),

  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
  getDefaultDownloadPath: () => ipcRenderer.invoke('get-default-download-path'),

  // Events
  onDownloadProgress: (cb: (data: any) => void) => {
    const listener = (_e: any, data: any) => cb(data)
    ipcRenderer.on('download-progress', listener)
    return () => ipcRenderer.removeListener('download-progress', listener)
  },
  onDownloadComplete: (cb: (data: any) => void) => {
    const listener = (_e: any, data: any) => cb(data)
    ipcRenderer.on('download-complete', listener)
    return () => ipcRenderer.removeListener('download-complete', listener)
  },
  onDownloadError: (cb: (data: any) => void) => {
    const listener = (_e: any, data: any) => cb(data)
    ipcRenderer.on('download-error', listener)
    return () => ipcRenderer.removeListener('download-error', listener)
  },
  onDownloadCancelled: (cb: (data: any) => void) => {
    const listener = (_e: any, data: any) => cb(data)
    ipcRenderer.on('download-cancelled', listener)
    return () => ipcRenderer.removeListener('download-cancelled', listener)
  },
  onDownloadOutput: (cb: (data: any) => void) => {
    const listener = (_e: any, data: any) => cb(data)
    ipcRenderer.on('download-output', listener)
    return () => ipcRenderer.removeListener('download-output', listener)
  },
  onYtDlpInstallProgress: (cb: (msg: string) => void) => {
    const listener = (_e: any, msg: string) => cb(msg)
    ipcRenderer.on('ytdlp-install-progress', listener)
    return () => ipcRenderer.removeListener('ytdlp-install-progress', listener)
  },

  // ffmpeg
  checkFfmpeg: () => ipcRenderer.invoke('check-ffmpeg'),
  installFfmpeg: () => ipcRenderer.invoke('install-ffmpeg'),

  // gallery-dl
  checkGalleryDl: () => ipcRenderer.invoke('check-gallery-dl'),
  installGalleryDl: () => ipcRenderer.invoke('install-gallery-dl'),

  onFfmpegInstallProgress: (cb: (msg: string) => void) => {
    const listener = (_e: any, msg: string) => cb(msg)
    ipcRenderer.on('ffmpeg-install-progress', listener)
    return () => ipcRenderer.removeListener('ffmpeg-install-progress', listener)
  },
  onGalleryDlInstallProgress: (cb: (msg: string) => void) => {
    const listener = (_e: any, msg: string) => cb(msg)
    ipcRenderer.on('gallery-dl-install-progress', listener)
    return () => ipcRenderer.removeListener('gallery-dl-install-progress', listener)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error('Failed to expose APIs via context bridge:', error)
  }
} else {
  // Context isolation is required for production security
  throw new Error('Context isolation is not enabled. This is a critical security issue.')
}
