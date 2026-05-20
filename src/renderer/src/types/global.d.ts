import { ElectronAPI } from '@electron-toolkit/preload'

interface FetchMeThisAPI {
  minimize: () => void
  maximize: () => void
  close: () => void
  isMaximized: () => Promise<boolean>
  checkYtDlp: () => Promise<{ installed: boolean; path: string }>
  installYtDlp: () => Promise<{ success: boolean; error?: string }>
  fetchVideoInfo: (url: string) => Promise<{ success: boolean; data?: any; error?: string }>
  startDownload: (request: any) => Promise<{ success: boolean; error?: string }>
  cancelDownload: (id: string) => Promise<{ success: boolean }>
  openFile: (filePath: string) => Promise<void>
  openFolder: (folderPath: string) => Promise<void>
  chooseDirectory: () => Promise<string | null>
  getSettings: () => Promise<any>
  saveSettings: (settings: any) => Promise<{ success: boolean }>
  getDefaultDownloadPath: () => Promise<string>
  onDownloadProgress: (cb: (data: any) => void) => () => void
  onDownloadComplete: (cb: (data: any) => void) => () => void
  onDownloadError: (cb: (data: any) => void) => () => void
  onDownloadCancelled: (cb: (data: any) => void) => () => void
  onDownloadOutput: (cb: (data: any) => void) => () => void
  onYtDlpInstallProgress: (cb: (msg: string) => void) => () => void
  checkFfmpeg: () => Promise<{ available: boolean; path: string }>
  installFfmpeg: () => Promise<{ success: boolean; error?: string }>
  checkGalleryDl: () => Promise<{ installed: boolean; path: string }>
  installGalleryDl: () => Promise<{ success: boolean; error?: string }>
  onFfmpegInstallProgress: (cb: (msg: string) => void) => () => void
  onGalleryDlInstallProgress: (cb: (msg: string) => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: FetchMeThisAPI
  }
}
