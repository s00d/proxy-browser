<template>
  <div class="flex items-center space-x-2">
    <input
      v-model="url"
      placeholder="Enter URL"
      class="w-full p-2 bg-white text-black rounded border border-gray-300"
      @keyup.enter="updatePage"
    />

    <div class="flex items-center space-x-2 no-drag">
      <button class="px-2 py-1 bg-transparent hover:bg-gray-700 rounded" @click="refreshPage">
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="w-5 h-5">
          <path d="M11.293 2.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L13.586 8H13a5 5 0 100 10h4a1 1 0 110 2h-4a7 7 0 110-14h.586L11.293 3.707a1 1 0 010-1.414z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
const props = defineProps<{
  initialUrl: string
}>()

const emit = defineEmits(['update-url', 'refresh-page'])

const url = ref(props.initialUrl)

watch(
  () => props.initialUrl,
  (newUrl) => {
    url.value = newUrl
  }
)

const updatePage = () => emit('update-url', url.value)
const refreshPage = () => emit('refresh-page')
</script>

<style scoped>
/* Tailwind используется, поэтому дополнительные стили не нужны */
</style>
