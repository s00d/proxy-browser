<template>
  <div class="flex items-center space-x-2">

    <!-- Обёртка для поля ввода, чтобы разместить иконку поверх (absolute) -->
    <div class="relative w-full">
      <!-- Поле ввода URL -->
      <input
        v-model="url"
        placeholder="Enter URL"
        class="w-full p-2 bg-white text-black rounded border border-gray-300 pr-10"
        @keyup.enter="updatePage"
      />
    </div>

    <!-- Кнопка "Перейти" -->
    <button
      class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
      @click="updatePage"
    >
      Go
    </button>

    <!-- Кнопка "Обновить" -->
    <button
      class="px-3 py-1 bg-gray-300 hover:bg-gray-400 text-black rounded"
      @click="refreshPage"
    >
      🔄
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

/**
 * Props:
 * - initialUrl: начальное значение для поля
 */
const props = defineProps<{
  initialUrl: string
}>()

/**
 * События:
 * - update-url(url: string): когда пользователь жмёт Enter или «Go»
 * - refresh-page(): когда жмут кнопку «🔄»
 */
const emit = defineEmits(['update-url', 'refresh-page'])

// Локальное поле ввода
const url = ref(props.initialUrl)

// Следим за обновлениями initialUrl
watch(
  () => props.initialUrl,
  (newVal) => {
    url.value = newVal
  }
)

// При нажатии Enter или кнопки «Go»
function updatePage() {
  emit('update-url', url.value)
}

// При нажатии «Обновить»
function refreshPage() {
  emit('refresh-page')
}
</script>

<style scoped>
/* Дополнительные стили, если вы не используете Tailwind для анимации */
.animate-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
