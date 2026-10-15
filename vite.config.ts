import { defineConfig, type Plugin } from 'vite'

// SDK подставляется в index.html только в нужной сборке:
//   vite build --mode yandex      -> /sdk.js (Яндекс Игры)
//   vite build --mode crazygames  -> SDK CrazyGames
//   vite build                    -> без SDK (itch.io, GameDistribution и т.п.)
function platformSdk(mode: string): Plugin {
  return {
    name: 'platform-sdk',
    transformIndexHtml() {
      if (mode === 'yandex') {
        return [{ tag: 'script', attrs: { src: '/sdk.js' }, injectTo: 'head-prepend' }]
      }
      if (mode === 'crazygames') {
        return [
          {
            tag: 'script',
            attrs: { src: 'https://sdk.crazygames.com/crazygames-sdk-v3.js' },
            injectTo: 'head-prepend',
          },
        ]
      }
      return []
    },
  }
}

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [platformSdk(mode)],
  build: {
    target: 'es2019',
    // Phaser весит ~1.2 МБ, для игры это нормально — предупреждение отключаем.
    chunkSizeWarningLimit: 2000,
  },
}))
