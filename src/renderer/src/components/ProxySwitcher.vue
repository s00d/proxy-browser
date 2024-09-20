<template>
  <div class="proxy-switcher" style="margin-right: 0">
    <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700" @click="toggleModal">
      Config
    </button>

    <!-- Модалка для выбора и добавления прокси -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
    >
      <div class="bg-white p-6 rounded shadow-lg w-96">
        <h3 class="text-xl font-semibold mb-4">Proxy Configuration</h3>

        <!-- Выбор прокси -->
        <div class="flex flex-col space-y-4">
          <label for="proxy" class="font-bold">Select Proxy:</label>
          <select
            id="proxy"
            v-model="selectedProxy"
            class="p-2 border border-gray-300 rounded"
            @change="changeProxy"
          >
            <option value="default" disabled>No Proxy</option>
            <option v-for="(proxy, index) in proxies" :key="index" :value="proxy.url">
              {{ proxy.protocol }} - {{ proxy.url }} - {{ proxy.username }}
            </option>
          </select>
        </div>

        <!-- Добавление нового прокси -->
        <div class="mt-6 flex flex-col space-y-4">
          <h3 class="text-lg font-semibold">Add New Proxy</h3>
          <select
            id="proxy"
            v-model="protocol"
            class="p-2 border border-gray-300 rounded"
          >
            <option v-for="(value, index) in protocols" :key="index" :value="value">
              {{ value }}
            </option>
          </select>
          <input
            v-model="newProxyUrl"
            placeholder="Proxy URL (127.0.0.1:3000)"
            class="p-2 border border-gray-300 rounded"
          />
          <input
            v-model="newProxyUsername"
            placeholder="Username (optional)"
            class="p-2 border border-gray-300 rounded"
          />
          <input
            v-model="newProxyPassword"
            placeholder="Password (optional)"
            type="password"
            class="p-2 border border-gray-300 rounded"
          />
        </div>

        <!-- Кнопки управления -->
        <div class="flex justify-end space-x-4 mt-6">
          <button
            class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-700"
            @click="toggleModal"
          >
            Close
          </button>
          <button
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
            @click="addProxy"
          >
            Add Proxy
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'

// Прокси и их параметры
const selectedProxy = ref('default')
const protocols = ['HTTP', 'HTTPS', 'SOCKS4', 'SOCKS5']
const proxies = ref<{ protocol: string, url: string; username?: string; password?: string }[]>([
  { protocol: 'HTTP', url: 'my-proxy-server.com:8080' },
])

const isModalOpen = ref(false)
const protocol = ref('HTTP')
const newProxyUrl = ref('127.0.0.1:4034')
const newProxyUsername = ref('')
const newProxyPassword = ref('')

// Функции для работы с прокси
const toggleModal = () => {
  isModalOpen.value = !isModalOpen.value
}

const changeProxy = () => {
  const selected = JSON.parse(JSON.stringify(proxies.value.find((proxy) => proxy.url === selectedProxy.value)))
  window.electron.ipcRenderer.send('change-proxy', selected || { url: 'default' })
}

const addProxy = () => {
  if (newProxyUrl.value) {
    proxies.value.push({
      protocol: protocol.value,
      url: newProxyUrl.value,
      username: newProxyUsername.value || undefined,
      password: newProxyPassword.value || undefined
    })

    // Сохраняем прокси в localStorage
    localStorage.setItem('proxies_list', JSON.stringify(proxies.value))

    // Очистить форму и закрыть модалку
    protocol.value = 'HTTP'
    newProxyUrl.value = ''
    newProxyUsername.value = ''
    newProxyPassword.value = ''
  }
}

const loadProxies = () => {
  const storedProxies = localStorage.getItem('proxies_list')
  if (storedProxies) {
    proxies.value = JSON.parse(storedProxies)
  }
}

// Загружаем прокси при монтировании компонента
onMounted(() => {
  loadProxies()
})
</script>

<style scoped>
select {
  color: black;
}
input {
  color: black;
}
/* Используем TailwindCSS, дополнительные стили не нужны */
</style>
