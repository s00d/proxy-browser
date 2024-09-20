<template>
  <div class="flex items-center space-x-2">
    <input
      v-model="url"
      placeholder="Enter URL"
      class="w-full p-2 bg-white text-black rounded border border-gray-300"
      @keyup.enter="updatePage"
    />
    <button
      @click="refreshPage"
      class="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded border border-gray-300"
    >
      🔄
    </button>
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

const updatePage = () => {
  emit('update-url', url.value)
}

const refreshPage = () => {
  emit('refresh-page')
}
</script>

<style scoped>
/* Tailwind используется, поэтому дополнительные стили не нужны */
</style>
