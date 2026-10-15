/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
  interface Window {
    YaGames?: any
    CrazyGames?: any
  }
}

export type PlatformName = 'yandex' | 'crazygames' | 'local'

/**
 * Единая обёртка над SDK площадок. Остальной код игры
 * ничего не знает про Яндекс / CrazyGames — только про этот сервис.
 */
class PlatformService {
  name: PlatformName = 'local'

  /** Можно ли показывать rewarded-рекламу (награда за просмотр). */
  rewardedSupported = false

  /** Можно ли показывать межстраничную (fullscreen) рекламу. Только Яндекс. */
  interstitialSupported = false

  /** Данные облачного сохранения, загруженные до старта игры. */
  cloudData: any = null

  private ysdk: any = null
  private cg: any = null
  private player: any = null

  private mockAds = false

  private pauseHandler?: () => void
  private resumeHandler?: () => void

  async init(): Promise<void> {
    try {
      if (window.YaGames) {
        this.ysdk = await window.YaGames.init()
        this.name = 'yandex'
        this.rewardedSupported = true
        this.interstitialSupported = true

        // Яндекс просит ставить игру на паузу, когда SDK этого требует.
        try {
          this.ysdk.on('game_api_pause', () => this.pauseHandler?.())
          this.ysdk.on('game_api_resume', () => this.resumeHandler?.())
        } catch {
          // событие может отсутствовать в старых версиях SDK
        }
      } else if (window.CrazyGames?.SDK) {
        await window.CrazyGames.SDK.init()
        this.cg = window.CrazyGames.SDK
        this.name = 'crazygames'
        this.rewardedSupported = true
      } else if (import.meta.env.DEV) {
        // В dev-режиме эмулируем rewarded, чтобы тестировать кнопки.
        this.rewardedSupported = true

        // Межстраничную рекламу в dev можно включить так: http://localhost:5173/?testads
        if (new URLSearchParams(location.search).has('testads')) {
          this.interstitialSupported = true
          this.mockAds = true
        }
      }
    } catch (error) {
      console.warn('Platform SDK init failed', error)
    }
  }

  getLanguage(): string | null {
    try {
      return this.ysdk?.environment?.i18n?.lang ?? null
    } catch {
      return null
    }
  }

  // =========================================================
  // CLOUD SAVE (Яндекс)
  // =========================================================

  async loadCloud(): Promise<void> {
    if (!this.ysdk) {
      return
    }

    try {
      this.player = await this.ysdk.getPlayer({ scopes: false })

      const data = await this.player.getData()

      this.cloudData = data && Object.keys(data).length > 0 ? data : null
    } catch (error) {
      console.warn('Cloud save is unavailable', error)
    }
  }

  cloudSave(data: unknown, flush = false) {
    if (!this.player) {
      return
    }

    try {
      Promise.resolve(this.player.setData(data, flush)).catch(() => undefined)
    } catch {
      // ignore
    }
  }

  // =========================================================
  // LIFECYCLE
  // =========================================================

  setPauseHandlers(onPause?: () => void, onResume?: () => void) {
    this.pauseHandler = onPause
    this.resumeHandler = onResume
  }

  gameReady() {
    try {
      this.ysdk?.features?.LoadingAPI?.ready()
      this.cg?.game?.sdkGameLoadingStop?.()
    } catch {
      // ignore
    }
  }

  gameplayStart() {
    try {
      this.ysdk?.features?.GameplayAPI?.start()
      this.cg?.game?.gameplayStart()
    } catch {
      // ignore
    }
  }

  gameplayStop() {
    try {
      this.ysdk?.features?.GameplayAPI?.stop()
      this.cg?.game?.gameplayStop()
    } catch {
      // ignore
    }
  }

  happyTime() {
    try {
      this.cg?.game?.happytime?.()
    } catch {
      // ignore
    }
  }

  // =========================================================
  // ADS
  // =========================================================

  /** Межстраничная реклама. Промис завершается, когда реклама закрыта или не показана. */
  showInterstitial(onStart: () => void, onEnd: () => void): Promise<void> {
    return new Promise((resolve) => {
      const finish = () => {
        onEnd()
        resolve()
      }

      if (this.ysdk) {
        try {
          this.ysdk.adv.showFullscreenAdv({
            callbacks: {
              onOpen: () => onStart(),
              onClose: () => finish(),
              onError: () => finish(),
              onOffline: () => finish(),
            },
          })
        } catch {
          finish()
        }

        return
      }

      if (this.mockAds) {
        onStart()
        window.setTimeout(finish, 1500)

        return
      }

      resolve()
    })
  }

  /** Rewarded-реклама. true, если игрок досмотрел до конца. */
  showRewarded(onStart: () => void, onEnd: () => void): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.ysdk) {
        let rewarded = false

        try {
          this.ysdk.adv.showRewardedVideo({
            callbacks: {
              onOpen: () => onStart(),
              onRewarded: () => {
                rewarded = true
              },
              onClose: () => {
                onEnd()
                resolve(rewarded)
              },
              onError: () => {
                onEnd()
                resolve(false)
              },
            },
          })
        } catch {
          onEnd()
          resolve(false)
        }

        return
      }

      if (this.cg) {
        this.cg.ad.requestAd('rewarded', {
          adStarted: () => onStart(),
          adFinished: () => {
            onEnd()
            resolve(true)
          },
          adError: () => {
            onEnd()
            resolve(false)
          },
        })

        return
      }

      // Локальная эмуляция
      onStart()
      window.setTimeout(() => {
        onEnd()
        resolve(true)
      }, 600)
    })
  }
}

export const platform = new PlatformService()
