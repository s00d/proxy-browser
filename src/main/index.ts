import { app, shell, BrowserWindow, ipcMain, session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.on('change-proxy', async (_event, proxyConfig) => {
    try {
      const config = getProxyConfig(proxyConfig)
      await session.defaultSession.setProxy(config)
      console.log('Proxy configuration updated:', config)

      // Если прокси требует авторизации, добавляем обработку login
      if (proxyConfig.username && proxyConfig.password) {
        app.on('login', (event, _webContents, _request, authInfo, callback) => {
          if (authInfo.isProxy) {
            event.preventDefault() // Останавливаем стандартное поведение
            console.log(`Proxy auth required. Providing credentials for ${authInfo.host}`)
            callback(proxyConfig.username, proxyConfig.password) // Передаем логин и пароль
          }
        })
      }
    } catch (error) {
      console.error('Failed to set proxy:', error)
    }
  })

  let mainWindow = createWindow()

  ipcMain.on('window-control', (_event, action) => {
    if (!mainWindow) return
    switch (action) {
      case 'minimize':
        mainWindow.minimize()
        break
      case 'maximize':
        if (mainWindow.isMaximized()) {
          mainWindow.unmaximize()
        } else {
          mainWindow.maximize()
        }
        break
      case 'close':
        mainWindow.close()
        break
    }
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

function getProxyConfig(proxyConfig: {
  url: string
  username?: string
  password?: string
}): Electron.ProxyConfig {
  const { url, username, password } = proxyConfig

  // Если прокси установлен как "default", то используется режим direct (без прокси)
  if (url === 'default') {
    return { mode: 'direct' }
  }

  // Формируем строку для прокси с аутентификацией, если логин и пароль предоставлены
  const proxyRules = username && password ? `${username}:${password}@${url}` : url

  return {
    mode: 'fixed_servers',
    proxyRules,
    proxyBypassRules: '<-loopback>' // Пример: пропускать локальные адреса
  }
}
