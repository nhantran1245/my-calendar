// Type declarations for the Electron preload contextBridge API
interface ElectronAPI {
  sendNotification: (title: string, body: string) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
