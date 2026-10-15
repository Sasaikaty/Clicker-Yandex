import Phaser from 'phaser'
import '@fontsource/russo-one/400.css'

import { gameConfig } from './config/gameConfig'
import { setLanguage } from './config/i18n'
import { platform } from './platform/PlatformService'

async function bootstrap() {
  await platform.init()

  // Язык: сначала от платформы (Яндекс), иначе язык браузера.
  setLanguage(platform.getLanguage())

  // Облачное сохранение нужно загрузить до старта сцены.
  await platform.loadCloud()

  // Шрифт должен быть загружен ДО создания Phaser.Text, иначе будет fallback.
  try {
    await document.fonts.load("24px 'Russo One'", 'AaБбЯя0123456789')
    await document.fonts.ready
  } catch {
    // не критично
  }

  // Требования площадок: без контекстного меню и зума жестами.
  document.addEventListener('contextmenu', (e) => e.preventDefault())
  document.addEventListener('gesturestart', (e) => e.preventDefault())
  window.addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey) {
        e.preventDefault()
      }
    },
    { passive: false },
  )

  new Phaser.Game(gameConfig)
}

bootstrap()
