<template>
  <div class="app">
    <BrowserHeader
      :tabs="tabs"
      :selected-tab="selectedTab"
      @new-tab="newTab"
      @select-tab="selectTab"
    />

    <UrlInput :initial-url="tabs[selectedTab].url" @update-url="updateUrl" />

    <BrowserView :tabs="tabs" :selected-tab="selectedTab" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import BrowserHeader from './components/Header.vue'
import BrowserView from './components/BrowserView.vue'
import UrlInput from './components/UrlInput.vue'

// Типизация вкладок
interface Tab {
  url: string
}

// Список вкладок и выбранная вкладка
const tabs = ref<Tab[]>([{ url: 'https://www.example.com' }])
const selectedTab = ref(0)

// Функции управления вкладками
const updateUrl = (url: string) => {
  tabs.value[selectedTab.value].url = url
}

const newTab = () => {
  tabs.value.push({ url: 'https://www.example.com' })
  selectedTab.value = tabs.value.length - 1
}

const selectTab = (index: number) => {
  selectedTab.value = index
}
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
</style>
