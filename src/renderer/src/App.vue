<template>
  <div class="flex flex-col h-screen">
    <BrowserHeader
      :tabs="tabs"
      :selected-tab="selectedTab"
      @new-tab="newTab"
      @select-tab="selectTab"
      @close-tab="closeTab"
    />

    <UrlInput :initial-url="tabs[selectedTab].url" @update-url="updateUrl" @refresh-page="refreshPage" />

    <BrowserView :tabs="tabs" :selected-tab="selectedTab" @update-title="updateTabTitle" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import BrowserHeader from './components/Header.vue'
import BrowserView from './components/BrowserView.vue'
import UrlInput from './components/UrlInput.vue'

export interface Tab {
  url: string
  title: string
}

const tabs = ref<Tab[]>([{ url: 'https://www.example.com', title: 'Tab' }])
const selectedTab = ref(0)

const updateUrl = (url: string) => {
  tabs.value[selectedTab.value].url = url
}

const newTab = () => {
  tabs.value.push({ url: 'https://www.example.com', title: 'Tab' })
  selectedTab.value = tabs.value.length - 1
}

const selectTab = (index: number) => {
  selectedTab.value = index
}

const updateTabTitle = (title: string) => {
  tabs.value[selectedTab.value].title = title
}

const closeTab = (index: number) => {
  if (tabs.value.length <= 1) {
    return
  }
  if (selectedTab.value == index) {
    selectedTab.value = 0
  }
  tabs.value.splice(index, 1)
}

const refreshPage = () => {
  // Здесь создаем механизм обновления путем перезапуска webview
  const url = tabs.value[selectedTab.value].url;
  tabs.value[selectedTab.value].url = ''; // Очистим URL, чтобы webview перезагрузился
  setTimeout(() => {
    tabs.value[selectedTab.value].url = url; // Вернем URL для перезагрузки
  }, 100);
}
</script>

<style scoped>
/* Tailwind используется, поэтому дополнительные стили не нужны */
</style>
