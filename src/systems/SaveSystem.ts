import { platform } from '../platform/PlatformService'

export type SaveData = {
  aura: number
  unlockedMovements: string[]
  currentMovementId: string
  rebirths?: number
  muted?: boolean
  savedAt?: number
}

/** Сохраняет в localStorage и (на Яндексе) в облако. При загрузке берёт более свежее. */
export class SaveSystem {
  private readonly saveKey = 'aura-farming-save'

  save(data: SaveData, flush = false) {
    const payload: SaveData = { ...data, savedAt: Date.now() }

    try {
      localStorage.setItem(this.saveKey, JSON.stringify(payload))
    } catch {
      // localStorage может быть недоступен в iframe / приватном режиме
    }

    platform.cloudSave(payload, flush)
  }

  load(): SaveData | null {
    const local = this.loadLocal()
    const cloud = (platform.cloudData as SaveData | null) ?? null

    if (local && cloud) {
      return (cloud.savedAt ?? 0) > (local.savedAt ?? 0) ? cloud : local
    }

    return cloud ?? local
  }

  private loadLocal(): SaveData | null {
    try {
      const save = localStorage.getItem(this.saveKey)

      return save ? JSON.parse(save) : null
    } catch {
      console.warn('Could not load saved game.')

      return null
    }
  }

  clear() {
    try {
      localStorage.removeItem(this.saveKey)
    } catch {
      // ignore
    }
  }
}
