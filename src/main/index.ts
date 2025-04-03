import * as path from 'node:path'
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let mainWindow: BrowserWindow
let deeplinkUrl: string | null = null
let currentLoginHandler: ((...args: any[]) => void) | null = null

function createWindow() {
  app.commandLine.appendSwitch('ignore-certificate-errors')
  app.on('certificate-error', (event, _webContents, _url, _error, _certificate, callback) => {
    event.preventDefault()
    callback(true)
  })

  const win = new BrowserWindow({
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

  win.on('ready-to-show', () => win.show())
  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

function handleDeepLink(url: string) {
  try {
    console.log(`Received deeplink: ${url}`)
    const { hostname, port, searchParams } = new URL(url)
    const targetHost = searchParams.get('host')
    const username = searchParams.get('username')
    const password = searchParams.get('password')
    const protocol = (searchParams.get('protocol') ?? 'HTTP').toUpperCase()

    const proxyConfig: {
      url: string
      protocol: string
      username?: string | undefined
      password?: string | undefined
    } = {
      protocol: protocol,
      url: `${hostname}:${port}`,
      // username: username ?? undefined,
      // password: password ?? undefined // used registerLoginHandler
    }

    console.log(proxyConfig)

    const config = getProxyConfig(proxyConfig)

    mainWindow.webContents.session.setProxy(config).then(() => {
      console.log('Proxy configuration updated:', config)
      mainWindow.webContents.send('select-proxy-config', proxyConfig)
      if (username && password) {
        registerLoginHandler({ username, password })
      }
      mainWindow.webContents.send('apply-proxy-config', { targetHost })
    })
  } catch (err) {
    console.error('Invalid deep link:', err)
  }
}

function getProxyConfig(proxyConfig: {
  url: string
  protocol: string
  username?: string
  password?: string
}): Electron.ProxyConfig {
  const { url, username, password } = proxyConfig

  if (url === 'default') {
    return { mode: 'direct' }
  }

  const proxyCredentials = username && password ? `${username}:${password}@` : ''
  const proxyUrl = `${proxyCredentials}${url}`

  let protocol: string
  switch (proxyConfig.protocol) {
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
      protocol = proxyConfig.protocol
  }

  const pacScript = `
    function FindProxyForURL(url, host) {
      return '${protocol} ${proxyUrl}';
    }
  `

  return {
    pacScript: `data:text/plain;base64,${Buffer.from(pacScript, 'utf8').toString('base64')}`
  }
}

function registerLoginHandler(proxyConfig: { username: string; password: string }) {
  if (currentLoginHandler) app.off('login', currentLoginHandler)

  const newLoginHandler = (
    event: Electron.Event,
    _webContents: Electron.WebContents,
    _authDetails: Electron.AuthenticationResponseDetails,
    authInfo: Electron.AuthInfo,
    callback: (username?: string, password?: string) => void
  ) => {
    if (authInfo.isProxy) {
      event.preventDefault()
      console.log(`Proxy auth required: ${authInfo.host}`)
      callback(proxyConfig.username, proxyConfig.password)
    }
  }

  app.on('login', newLoginHandler)
  currentLoginHandler = newLoginHandler
}

// MAIN ENTRY POINT
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.proxy-browser')
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))

  // Протокол
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('onproxy', process.execPath, [path.resolve(process.argv[1])])
    }
  } else {
    app.setAsDefaultProtocolClient('onproxy')
  }

  // macOS
  app.on('open-url', (event, url) => {
    event.preventDefault()
    if (app.isReady()) handleDeepLink(url)
    else deeplinkUrl = url
  })

  mainWindow = createWindow()

  // Windows/Linux: аргументы запуска
  const deepArg = process.argv.find(arg => arg.startsWith('onproxy://'))
  if (deepArg) deeplinkUrl = deepArg

  if (deeplinkUrl) {
    handleDeepLink(deeplinkUrl)
    deeplinkUrl = null
  }
})

// IPC handlers
ipcMain.on('ping', () => console.log('pong'))

ipcMain.on('change-proxy', async (_event, proxyConfig) => {
  try {
    const config = getProxyConfig(proxyConfig)
    await mainWindow.webContents.session.setProxy(config)
    console.log('Proxy configuration updated:', config)

    if (proxyConfig.username && proxyConfig.password) {
      registerLoginHandler({
        username: proxyConfig.username,
        password: proxyConfig.password
      })
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
      mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize()
      break
    case 'close':
      mainWindow.close()
      break
  }
})

// Восстановление окна
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
