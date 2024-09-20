<template>
  <div class="browser-view">
    <webview v-if="activeTab" :src="activeTab.url" class="webview" allowpopups></webview>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

// Пропсы
interface Tab {
  url: string
}

const props = defineProps<{
  tabs: Tab[]
  selectedTab: number
}>()

// Вычисляем активную вкладку
const activeTab = computed(() => props.tabs[props.selectedTab])
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
