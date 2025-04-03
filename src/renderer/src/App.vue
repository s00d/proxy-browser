<template>
  <div class="flex flex-col h-screen relative">
    <!-- Вся остальная разметка -->

    <!-- Шапка с вкладками -->
    <BrowserHeader
      :tabs="tabs"
      :selected-tab="selectedTab"
      @new-tab="newTab"
      @select-tab="selectTab"
      @close-tab="closeTab"
    />

    <!-- Строка ввода, куда передаем loading -->
    <UrlInput
      :initial-url="tabs[selectedTab].url"
      :loading="loading"
      @update-url="updateUrl"
      @refresh-page="refreshPage"
    />

    <!-- WebView, слушаем start/stop загрузки -->
    <BrowserView :tabs="tabs" :selected-tab="selectedTab" @update-title="updateTabTitle" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import BrowserHeader from './components/Header.vue'
import BrowserView from './components/BrowserView.vue'
import UrlInput from './components/UrlInput.vue'

export interface Tab {
  url: string
  title: string
  loading: boolean
}

// Массив вкладок
const tabs = ref<Tab[]>([{ url: 'https://www.example.com', title: 'Tab 1', loading: false }])
const selectedTab = ref(0)

// Флаг загрузки (чтобы показывать спиннер)
const loading = ref(false)

// Меняем URL (например, при нажатии Enter)
function updateUrl(url: string) {
  const currentUrl = tabs.value[selectedTab.value].url

  if (url === currentUrl) {
    // Если пользователь ввел ту же самую ссылку
    // можно сделать refreshPage() или вообще ничего не делать
    refreshPage()
    return
  }

  // Иначе реально меняем URL
  tabs.value[selectedTab.value].url = url
  // Можно вручную ставить loading=true, но лучше пусть webview
  // сам генерирует did-start-loading. Чтобы не крутить бесконечно,
  // если страница не начала грузиться.
  // loading.value = true
}

function newTab() {
  tabs.value.push({
    url: 'https://www.example.com',
    title: `Tab ${tabs.value.length + 1}`,
    loading: false
  })
  selectedTab.value = tabs.value.length - 1
}

function selectTab(index: number) {
  selectedTab.value = index
}

// Закрыть вкладку
function closeTab(index: number) {
  if (tabs.value.length <= 1) return
  if (index === selectedTab.value) {
    if (index > 0) {
      selectedTab.value = index - 1
    } else {
      selectedTab.value = 0
    }
  }
  tabs.value.splice(index, 1)
  if (selectedTab.value >= tabs.value.length) {
    selectedTab.value = tabs.value.length - 1
  }
}

// Обновляем заголовок вкладки
function updateTabTitle(title: string) {
  tabs.value[selectedTab.value].title = title
}

// Принудительная перезагрузка
function refreshPage() {
  const url = tabs.value[selectedTab.value].url
  // Сбрасываем URL, чтобы webview реально перезагрузился
  tabs.value[selectedTab.value].url = ''
  setTimeout(() => {
    tabs.value[selectedTab.value].url = url
  }, 50)
}

onMounted(() => {
  window.electron.ipcRenderer.on('apply-proxy-config', (_event, proxyConfig) => {
    console.log('Received proxy config:', proxyConfig)

    // Здесь вы можете применить настройки прокси к webview или сделать что-то еще
    tabs.value[selectedTab.value].url = proxyConfig.targetHost
  })
})
</script>
