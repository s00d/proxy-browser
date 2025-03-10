<template>
  <div class="browser-view flex-1 overflow-hidden">
    <!-- Генерируем webview для каждого таба -->
    <webview
      v-for="(tab, i) in tabs"
      v-show="i === selectedTab"
      :key="i"
      :src="tab.url"
      class="w-full h-full"
      allowpopups
      plugins
      disablewebsecurity
      @did-start-loading="(event) => onDidStartLoading(event, i)"
      @did-stop-loading="(event) => onDidStopLoading(event, i)"
      @did-finish-load="(event) => onDidFinishLoad(event, i)"
      @did-fail-load="(event) => onDidFailLoad(event, i)"
    ></webview>
  </div>
</template>

<script setup lang="ts">
import type { Tab } from '../App.vue'

const props = defineProps<{
  tabs: (Tab & { loading?: boolean; error?: string })[]
  selectedTab: number
}>()

/**
 * Здесь мы не используем activeTab,
 * а напрямую работаем с tabs[i], потому что
 * у каждого webview есть свой индекс i.
 */

// При старте загрузки → ставим tab[i].loading = true
function onDidStartLoading(_event: Event, i: number) {
  props.tabs[i].loading = true
}

// При остановке загрузки → tab[i].loading = false
function onDidStopLoading(_event: Event, i: number) {
  props.tabs[i].loading = false
}

// При полной загрузке (did-finish-load) → можем обновить заголовок
function onDidFinishLoad(event: Event, i: number) {
  const webview = event.target as Electron.WebviewTag
  const title = webview.getTitle()
  // Можно, например, в родителя эмитить
  // emit('update-title', { index: i, title })
  props.tabs[i].title = title
}

/**
 * При ошибке → останавливаем лоадер,
 * и можем сохранить описание ошибки в tab[i].error,
 * а также подменить контент webview на errorHtml.
 */
function onDidFailLoad(event: any, i: number) {
  props.tabs[i].loading = false

  console.error('[BrowserView] did-fail-load:', event)

  const webview = event.target as Electron.WebviewTag
  const errorHtml = `
    <html>
      <head><title>Load error</title></head>
      <body style="background: #f0f0f0; color: #333;">
        <h2>Oops, something went wrong...</h2>
        <p>Error code: ${event.errorCode}</p>
        <p>${event.errorDescription}</p>
      </body>
    </html>
  `
  webview.executeJavaScript('document.documentElement.innerHTML = `' + errorHtml + '`;')

  // Можно хранить информацию в tab[i].error
  props.tabs[i].error = `Error ${event.errorCode}: ${event.errorDescription}`
}
</script>

<style scoped>
.browser-view {
  flex: 1;
  overflow: hidden;
}
</style>
