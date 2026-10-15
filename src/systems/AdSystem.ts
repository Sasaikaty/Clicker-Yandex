import type Phaser from 'phaser'
import { platform } from '../platform/PlatformService'

type AdHooks = {
  /** Можно ли сейчас показывать рекламу (нет попапов, другой рекламы, игрок активен). */
  canShow: () => boolean
  /** Обратный отсчёт перед рекламой: число секунд или null, если отсчёт скрыт. */
  onCountdown: (seconds: number | null) => void
  onAdStart: () => void
  onAdEnd: () => void
}

/**
 * Межстраничная реклама раз в 3 минуты активной игры.
 * Перед показом — предупреждение с обратным отсчётом (рекомендация Яндекса).
 */
export class AdSystem {
  static readonly INTERVAL_SECONDS = 180
  private static readonly COUNTDOWN_SECONDS = 3

  private elapsed = 0
  private countdown = 0
  private busy = false
  private timer?: Phaser.Time.TimerEvent

  private readonly scene: Phaser.Scene
  private readonly hooks: AdHooks

  constructor(scene: Phaser.Scene, hooks: AdHooks) {
    this.scene = scene
    this.hooks = hooks
  }

  start() {
    this.timer = this.scene.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => this.tick(),
    })
  }

  /** Вызывается после любой показанной рекламы, чтобы отсчёт начался заново. */
  markAdShown() {
    this.elapsed = 0

    if (this.countdown > 0) {
      this.countdown = 0
      this.hooks.onCountdown(null)
    }
  }

  private tick() {
    if (!platform.interstitialSupported || this.busy) {
      return
    }

    if (this.countdown > 0) {
      if (!this.hooks.canShow()) {
        // Что-то открылось — откладываем рекламу ненадолго.
        this.countdown = 0
        this.elapsed = AdSystem.INTERVAL_SECONDS - 15
        this.hooks.onCountdown(null)

        return
      }

      this.countdown -= 1

      if (this.countdown > 0) {
        this.hooks.onCountdown(this.countdown)

        return
      }

      this.hooks.onCountdown(null)
      void this.show()

      return
    }

    this.elapsed += 1

    if (this.elapsed >= AdSystem.INTERVAL_SECONDS && this.hooks.canShow()) {
      this.countdown = AdSystem.COUNTDOWN_SECONDS
      this.hooks.onCountdown(this.countdown)
    }
  }

  private async show() {
    this.busy = true

    await platform.showInterstitial(this.hooks.onAdStart, this.hooks.onAdEnd)

    this.busy = false
    this.elapsed = 0
  }

  destroy() {
    this.timer?.remove()
  }
}
