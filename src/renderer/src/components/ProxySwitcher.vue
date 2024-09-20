<template>
  <div class="proxy-switcher">
    <label for="proxy">Proxy:</label>
    <select id="proxy" v-model="selectedProxy" @change="changeProxy">
      <option value="default">No Proxy</option>
      <option v-for="(proxy, index) in proxies" :key="index" :value="proxy.url">
        {{ proxy.url }}
      </option>
    </select>

    <div class="add-proxy">
      <h3>Add New Proxy</h3>
      <input v-model="newProxyUrl" placeholder="Proxy URL" />
      <input v-model="newProxyUsername" placeholder="Username (optional)" />
      <input v-model="newProxyPassword" placeholder="Password (optional)" type="password" />
      <button @click="addProxy">Add Proxy</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'ProxySwitcher',
  setup() {
    const selectedProxy = ref('default')
    const proxies = ref<{ url: string; username?: string; password?: string }[]>([
      { url: 'http://my-proxy-server.com:8080' },
      { url: 'http://another-proxy.com:9090', username: 'user1', password: 'pass1' }
    ])

    const newProxyUrl = ref('')
    const newProxyUsername = ref('')
    const newProxyPassword = ref('')

    const changeProxy = () => {
      const selected = proxies.value.find((proxy) => proxy.url === selectedProxy.value)
      window.electron.ipcRenderer.send('change-proxy', selected || { url: 'default' })
    }

    const addProxy = () => {
      if (newProxyUrl.value) {
        proxies.value.push({
          url: newProxyUrl.value,
          username: newProxyUsername.value || undefined,
          password: newProxyPassword.value || undefined
        })

        // Сохраняем прокси в localStorage или другом хранилище
        localStorage.setItem('proxies', JSON.stringify(proxies.value))

        // Очистить форму
        newProxyUrl.value = ''
        newProxyUsername.value = ''
        newProxyPassword.value = ''
      }
    }

    // Загрузка сохраненных прокси из localStorage
    const loadProxies = () => {
      const storedProxies = localStorage.getItem('proxies')
      if (storedProxies) {
        proxies.value = JSON.parse(storedProxies)
      }
    }

    loadProxies()

    return {
      selectedProxy,
      proxies,
      newProxyUrl,
      newProxyUsername,
      newProxyPassword,
      changeProxy,
      addProxy
    }
  }
})
</script>

<style scoped>
.proxy-switcher {
  margin: 20px;
}

.add-proxy {
  margin-top: 20px;
}

input {
  margin-right: 10px;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  padding: 5px 10px;
  background-color: #4b6584;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #2e3b4e;
}
</style>
