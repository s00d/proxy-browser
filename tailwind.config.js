/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/renderer/src/**/*.{vue,js,ts,jsx,tsx}' // Добавляем пути к файлам, чтобы Tailwind мог их сканировать
  ],
  theme: {
    extend: {}
  },
  plugins: []
}
