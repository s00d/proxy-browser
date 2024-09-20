<template>
  <div class="browser-view flex-grow overflow-hidden">
    <webview
      v-if="activeTab"
      id="onlinesimWebView"
      ref="webViewRef"
      :src="activeTab.url"
      class="w-full h-full"
      allowpopups
      plugins
      disablewebsecurity
      @did-finish-load="updateTitle"
    ></webview>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue'
import type Electron from 'electron'
import type { Tab } from '../App.vue'

const props = defineProps<{
  tabs: Tab[]
  selectedTab: number
}>()

const emit = defineEmits(['update-title'])

// Вычисляем активную вкладку
const activeTab = computed(() => props.tabs[props.selectedTab])

// Обновляем заголовок вкладки
const updateTitle = (event: Event) => {
  const webview = event.target as Electron.WebviewTag
  const title = webview.getTitle()
  emit('update-title', title)
}

onMounted(() => {
  const webview = document.querySelector<any>('#onlinesimWebView')
  webview.addEventListener('permissionrequest', function (e) {
    if (e.permission === 'notifications') {
      e.request.allow() // Явно разрешаем уведомления
    }
  })

  webview.addEventListener('did-fail-load', (event) => {
    console.error('WebView failed to load', event)
  })

  webview.addEventListener('will-navigate', (event) => {
    console.log('WebView will navigate to', event.url)
  })

  webview.addEventListener('did-navigate', (event) => {
    console.log('WebView did navigate to', event.url)
  })

  // Использование webRequest для перехвата запросов и ответов
  webview.addEventListener('dom-ready', () => {
    const dev = process.env.NODE_ENV === 'development'
    console.log(111, dev)
    if (dev) {
      webview.openDevTools()
    }
    console.log(webview)
  })
})
</script>

<style scoped>
.browser-view {
  flex-grow: 1;
  overflow: hidden;
}

.webview {
  width: 100%;
  height: 100%;
}
</style>
