<template>
  <header class="browser-header">
    <div class="tabs-container">
      <button
        v-for="(_tab, index) in tabs"
        :key="index"
        :class="{ active: index === selectedTab }"
        @click="selectTab(index)"
      >
        Tab {{ index + 1 }}
      </button>
      <button @click="newTab">New Tab</button>
    </div>

    <ProxySwitcher />

    <div class="window-controls">
      <button @click="minimizeWindow">_</button>
      <button @click="maximizeWindow">[]</button>
      <button @click="closeWindow">X</button>
    </div>
  </header>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import ProxySwitcher from './ProxySwitcher.vue'

export default defineComponent({
  name: 'BrowserHeader',
  components: { ProxySwitcher },
  setup() {
    const tabs = ref([{ url: 'https://www.example.com' }])
    const selectedTab = ref(0)

    const selectTab = (index: number) => {
      selectedTab.value = index
    }

    const newTab = () => {
      tabs.value.push({ url: 'https://www.example.com' })
      selectedTab.value = tabs.value.length - 1
    }

    const minimizeWindow = () => {
      window.electron.ipcRenderer.send('window-control', 'minimize')
    }

    const maximizeWindow = () => {
      window.electron.ipcRenderer.send('window-control', 'maximize')
    }

    const closeWindow = () => {
      window.electron.ipcRenderer.send('window-control', 'close')
    }

    return {
      tabs,
      selectedTab,
      selectTab,
      newTab,
      minimizeWindow,
      maximizeWindow,
      closeWindow
    }
  }
})
</script>

<style scoped>
.browser-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #2e3b4e;
  color: white;
}

.tabs-container {
  display: flex;
}

.tabs-container button {
  margin-right: 10px;
  padding: 5px 10px;
  background-color: transparent;
  color: white;
  border: none;
  cursor: pointer;
}

.tabs-container button.active {
  background-color: #4b6584;
}

.window-controls button {
  background-color: transparent;
  border: none;
  color: white;
  padding: 5px 10px;
  cursor: pointer;
}

.window-controls button:hover {
  background-color: #ff6b6b;
}
</style>
