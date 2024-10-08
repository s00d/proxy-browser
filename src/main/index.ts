import * as path from 'node:path'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let currentLoginHandler:
  | ((
      event: Electron.Event,
      webContents: Electron.WebContents,
      authenticationResponseDetails: Electron.AuthenticationResponseDetails,
      authInfo: Electron.AuthInfo,
      callback: (username?: string, password?: string) => void
    ) => void)
  | null = null

function createWindow() {
  app.commandLine.appendSwitch('ignore-certificate-errors')
  app.on('certificate-error', (event, _webContents, _url, _error, _certificate, callback) => {
    // Prevent having error
    event.preventDefault()
    // and continue
    callback(true)
  })
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    frame: false,
    // alwaysOnTop: true,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webviewTag: true,
      webSecurity: false,
      allowRunningInsecureContent: true
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
    mainWindow.webContents.openDevTools({ mode: 'detach' })
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
  electronApp.setAppUserModelId('com.proxy-browser')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('onproxy', process.execPath, [path.resolve(process.argv[1])])
    }
  } else {
    app.setAsDefaultProtocolClient('onproxy')
  }

  app.on('open-url', async (event, url) => {
    event.preventDefault()

    console.log(`Received deeplink: ${url}`)

    // Парсим URL
    const { hostname, port, username, password, searchParams } = new URL(url)
    const targetHost = searchParams.get('host')
    const protocol = (searchParams.get('protocol') ?? 'HTTP').toString().toUpperCase()

    const proxyConfig: {
      url: string
      protocol: string
      username?: string | undefined
      password?: string | undefined
    } = {
      protocol: protocol,
      url: `${hostname}:${port}`
    }

    console.log(proxyConfig)

    const config = getProxyConfig(proxyConfig)

    await mainWindow.webContents.session.setProxy(config)
    console.log('Proxy configuration updated:', config)

    // Если прокси требует авторизации, добавляем обработку login
    if (username && password) {
      registerLoginHandler({ username, password })
    }

    // Передаем данные в рендерный процесс
    if (mainWindow) {
      mainWindow.webContents.send('apply-proxy-config', { targetHost })
    }
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  let mainWindow = createWindow()

  ipcMain.on('change-proxy', async (_event, proxyConfig) => {
    try {
      const config = getProxyConfig(proxyConfig)

      await mainWindow.webContents.session.setProxy(config)
      console.log('Proxy configuration updated:', config)

      // Если прокси требует авторизации, добавляем обработку login

      if (proxyConfig.username && proxyConfig.password) {
        registerLoginHandler({ username: proxyConfig.username, password: proxyConfig.password })
      }
    } catch (error) {
      console.error('Failed to set proxy:', error)
    }
  })

  ipcMain.on('webview-control', (_event, action) => {
    const focusedWindow = BrowserWindow.getFocusedWindow()
    if (!focusedWindow) return

    const webContents = focusedWindow.webContents
    switch (action) {
      case 'goBack':
        if (webContents.canGoBack()) webContents.goBack()
        break
      case 'goForward':
        if (webContents.canGoForward()) webContents.goForward()
        break
      case 'reload':
        webContents.reload()
        break
    }
  })

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
  protocol: string
  username?: string
  password?: string
}): Electron.ProxyConfig {
  const { url, username, password } = proxyConfig

  // Если прокси установлен как "default", то используется режим direct (без прокси)
  if (url === 'default') {
    return { mode: 'direct' }
  }

  // Формируем строку прокси с аутентификацией, если логин и пароль предоставлены
  const proxyCredentials = username && password ? `${username}:${password}@` : ''
  const proxyUrl = `${proxyCredentials}${url}`

  let protocol: string
  switch (proxyConfig.protocol.toUpperCase()) {
    case 'HTTP':
    case 'HTTPS':
      protocol = 'PROXY'
      break
    case 'SOCKS4':
      protocol = 'SOCKS4'
      break
    case 'SOCKS5':
      protocol = 'SOCKS5'
      break
    default:
      protocol = proxyConfig.protocol.toUpperCase()
  }

  // PAC-скрипт для использования прокси
  const pacScript = `
    function FindProxyForURL(url, host) {
      return '${protocol} ${proxyUrl}';
    }
  `

  return {
    // mode: 'pac_script',
    pacScript: `data:text/plain;base64,${Buffer.from(pacScript, 'utf8').toString('base64')}`
    // proxyBypassRules: '<-loopback>' // Пример: пропускать локальные адреса
  }
}

function registerLoginHandler(proxyConfig: { username: string; password: string }) {
  // Удаляем предыдущий обработчик, если он существует
  if (currentLoginHandler) {
    app.off('login', currentLoginHandler)
  }

  // Новый обработчик авторизации для прокси
  const newLoginHandler = (
    event: Electron.Event,
    _webContents: Electron.WebContents,
    _authenticationResponseDetails: Electron.AuthenticationResponseDetails,
    authInfo: Electron.AuthInfo,
    callback: (username?: string, password?: string) => void
  ) => {
    if (authInfo.isProxy) {
      event.preventDefault()
      console.log(`Proxy auth required. Providing credentials for ${authInfo.host}`)
      callback(proxyConfig.username, proxyConfig.password) // Передаем логин и пароль
    }
  }

  // Регистрируем новый обработчик
  app.on('login', newLoginHandler)

  // Обновляем текущий обработчик
  currentLoginHandler = newLoginHandler
}
