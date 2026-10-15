import Phaser from 'phaser'

export class ComboSystem {
  private combo = 1

  private comboClicks = 0

  private comboTimer?: Phaser.Time.TimerEvent

  private readonly clicksRequired = 30

  private readonly maxCombo = 3

  private readonly resetDelay = 1500

  private readonly scene: Phaser.Scene
  private readonly onComboChanged: (combo: number) => void
  private readonly onComboMessage: (message: string) => void

  constructor(
    scene: Phaser.Scene,
    onComboChanged: (combo: number) => void,
    onComboMessage: (message: string) => void,
  ) {
    this.scene = scene
    this.onComboChanged = onComboChanged
    this.onComboMessage = onComboMessage
  }

  // =========================================================
  // GETTERS
  // =========================================================

  getCombo(): number {
    return this.combo
  }

  // =========================================================
  // ADD COMBO
  // =========================================================

  addCombo() {
    this.comboClicks += 1

    if (this.comboClicks >= this.clicksRequired && this.combo < this.maxCombo) {
      this.combo += 1

      this.comboClicks = 0

      this.onComboMessage(`COMBO ×${this.combo}`)
    }

    this.onComboChanged(this.combo)

    this.restartResetTimer()
  }

  // =========================================================
  // RESET TIMER
  // =========================================================

  private restartResetTimer() {
    if (this.comboTimer) {
      this.comboTimer.remove()
    }

    this.comboTimer = this.scene.time.delayedCall(this.resetDelay, () => {
      this.combo = 1
      this.comboClicks = 0

      this.onComboChanged(1)
    })
  }

  // =========================================================
  // DESTROY
  // =========================================================

  destroy() {
    if (this.comboTimer) {
      this.comboTimer.remove()
    }
  }
}
