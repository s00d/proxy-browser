<template>
  <div class="url-input-container">
    <input v-model="url" placeholder="Enter URL" class="url-input" @keyup.enter="updatePage" />
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'

// Пропсы
const props = defineProps<{
  initialUrl: string
}>()

// Эмиттер для отправки нового URL
const emit = defineEmits(['update-url'])

// URL введённый пользователем
const url = ref(props.initialUrl)

// Следим за изменением начального URL
watch(
  () => props.initialUrl,
  (newUrl) => {
    url.value = newUrl
  }
)

// Функция для отправки нового URL
const updatePage = () => {
  emit('update-url', url.value)
}
</script>

<style scoped>
.url-input-container {
  flex-grow: 1;
  margin: 0 10px;
}

.url-input {
  width: 100%;
  padding: 5px;
  background-color: #fff;
  color: #000;
  border-radius: 4px;
  border: 1px solid #ccc;
}
</style>
