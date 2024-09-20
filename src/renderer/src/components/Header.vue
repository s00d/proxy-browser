<template>
  <header class="bar flex justify-between items-center bg-gray-800 text-white">
    <div class="tabs-container text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:text-gray-400 dark:border-gray-700 no-drag">
      <ul class="flex flex-wrap -mb-px">
        <li v-for="(tab, index) in tabs" :key="index" class="me-2 flex items-center">
          <a
            class="inline-block p-4 border-b-2 border-transparent rounded-t-lg w-full"
            :class="[
              index === selectedTab
                ? 'active dark:text-blue-500 dark:border-blue-500 text-blue-100 border-blue-600'
                : 'hover:border-gray-300 dark:hover:text-gray-300 hover:text-gray-600'
            ]"
            @click="() => selectTab(index)"
          >{{ tab.title || 'New Tab' }}</a
          >
          <!-- Добавляем кнопку с крестиком -->
          <button class="text-red-500 hover:text-red-700 ml-2 no-drag" @click="closeTab(index)">
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="w-4 h-4">
              <path
                fill-rule="evenodd"
                d="M6.225 6.225a.75.75 0 011.06 0L12 10.94l4.715-4.715a.75.75 0 111.06 1.06L13.06 12l4.715 4.715a.75.75 0 11-1.06 1.06L12 13.06l-4.715 4.715a.75.75 0 11-1.06-1.06L10.94 12 6.225 7.285a.75.75 0 010-1.06z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </li>
        <li class="me-2">
          <button class="no-drag px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white" @click="newTab">+</button>
        </li>
      </ul>
    </div>

    <!-- Добавляем кнопки "Назад", "Вперёд", "Обновить" -->
    <div class="flex items-center space-x-2 no-drag">
      <ProxySwitcher />
      <button class="px-2 py-1 bg-transparent hover:bg-gray-700 rounded" @click="minimizeWindow">
        <svg width="14" height="14" viewBox="0 0 512 512">
          <path fill="white" d="M480 480H32c-17.75 0-32-14.25-32-32s14.25-32 32-32h448c17.75 0 32 14.25 32 32S497.8 480 480 480z"/>
        </svg>
      </button>
      <button class="px-2 py-1 bg-transparent hover:bg-gray-700 rounded" @click="maximizeWindow">
        <svg width="14" height="14" viewBox="0 0 32 32">
          <path fill="white" d="M28,2h-6c-1.104,0-2,0.896-2,2s0.896,2,2,2h1.2l-4.6,4.601C18.28,10.921,18,11.344,18,12c0,1.094,0.859,2,2,2 c0.641,0,1.049-0.248,1.4-0.6L26,8.8V10c0,1.104,0.896,2,2,2s2-0.896,2-2V4C30,2.896,29.104,2,28,2z M12,18 c-0.641,0-1.049,0.248-1.4,0.6L6,23.2V22c0-1.104-0.896-2-2-2s-2,0.896-2,2v6c0,1.104,0.896,2,2,2h6c1.104,0,2-0.896,2-2 s-0.896-2-2-2H8.8l4.6-4.601C13.72,21.079,14,20.656,14,20C14,18.906,13.141,18,12,18z"/>
        </svg>
      </button>
      <button class="px-2 py-1 bg-red-500 hover:bg-red-700 rounded" @click="closeWindow">
        <svg width="14" height="14" viewBox="0 0 512 512">
          <path fill="white" d="M437.5,386.6L306.9,256l130.6-130.6c14.1-14.1,14.1-36.8,0-50.9c-14.1-14.1-36.8-14.1-50.9,0L256,205.1L125.4,74.5 c-14.1-14.1-36.8-14.1-50.9,0c-14.1,14.1-14.1,36.8,0,50.9L205.1,256L74.5,386.6c-14.1,14.1-14.1,36.8,0,50.9 c14.1,14.1,36.8,14.1,50.9,0L256,306.9l130.6,130.6c14.1,14.1,36.8,14.1,50.9,0C451.5,423.4,451.5,400.6,437.5,386.6z"/>
        </svg>
      </button>
    </div>
  </header>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import ProxySwitcher from './ProxySwitcher.vue'
import type { Tab } from '../App.vue'

const props = defineProps<{
  tabs: Tab[]
  selectedTab: number
}>()

const emit = defineEmits(['new-tab', 'select-tab', 'close-tab'])

const url = ref(props.tabs[props.selectedTab].url)

watch(
  () => props.selectedTab,
  (newIndex) => {
    url.value = props.tabs[newIndex].url
  }
)

const newTab = () => emit('new-tab')
const selectTab = (index: number) => emit('select-tab', index)
const closeTab = (index: number) => emit('close-tab', index)

const minimizeWindow = () => window.electron.ipcRenderer.send('window-control', 'minimize')
const maximizeWindow = () => window.electron.ipcRenderer.send('window-control', 'maximize')
const closeWindow = () => window.electron.ipcRenderer.send('window-control', 'close')
</script>

<style scoped>
.bar {
  -webkit-app-region: drag;
}
.no-drag {
  -webkit-app-region: no-drag;
}
.tabs-container {
  max-width: 80%; /* Ограничиваем ширину табов для прокрутки */
  overflow-x: auto; /* Добавляем прокрутку по оси X */
  white-space: nowrap; /* Запрещаем перенос строк внутри контейнера */
}
</style>
