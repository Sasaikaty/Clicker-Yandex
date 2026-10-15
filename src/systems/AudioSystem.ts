import type Phaser from 'phaser'

/**
 * Процедурные звуки через WebAudio — никаких файлов, вес билда не растёт.
 * Использует AudioContext самого Phaser (он разблокирует его по первому клику
 * и ставит на паузу при потере фокуса).
 */
export class AudioSystem {
  private ctx?: AudioContext
  private master?: GainNode

  private userMuted = false
  private suppressed = false

  constructor(scene: Phaser.Scene) {
    const manager = scene.sound as Phaser.Sound.WebAudioSoundManager

    if ('context' in manager && manager.context) {
      this.ctx = manager.context
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.5
      this.master.connect(this.ctx.destination)
    }
  }

  isUserMuted(): boolean {
    return this.userMuted
  }

  setUserMuted(muted: boolean) {
    this.userMuted = muted
  }

  /** Временное глушение (на время рекламы). */
  setSuppressed(value: boolean) {
    this.suppressed = value
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.2,
    slideTo?: number,
    delay = 0,
  ) {
    if (
      !this.ctx ||
      !this.master ||
      this.userMuted ||
      this.suppressed ||
      this.ctx.state !== 'running'
    ) {
      return
    }

    const start = this.ctx.currentTime + delay
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(freq, start)

    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration)
    }

    gain.gain.setValueAtTime(volume, start)
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration)

    osc.connect(gain)
    gain.connect(this.master)

    osc.start(start)
    osc.stop(start + duration + 0.03)
  }

  playClick(combo: number) {
    const jitter = 1 + (Math.random() - 0.5) * 0.08

    this.tone((360 + combo * 90) * jitter, 0.09, 'triangle', 0.18, (620 + combo * 120) * jitter)
  }

  playCritical() {
    this.tone(660, 0.12, 'square', 0.08)
    this.tone(880, 0.12, 'square', 0.08, undefined, 0.07)
    this.tone(1320, 0.22, 'square', 0.08, undefined, 0.14)
  }

  playCombo() {
    this.tone(700, 0.1, 'triangle', 0.16)
    this.tone(1050, 0.18, 'triangle', 0.16, undefined, 0.08)
  }

  playUnlock() {
    ;[523, 659, 784, 1046].forEach((f, i) => {
      this.tone(f, 0.22, 'triangle', 0.16, undefined, i * 0.08)
    })
  }

  playUpgrade() {
    this.tone(440, 0.25, 'sawtooth', 0.1, 880)
    this.tone(660, 0.25, 'triangle', 0.14, 1320, 0.08)
  }

  playRebirth() {
    this.tone(220, 0.6, 'sawtooth', 0.12, 880)
    ;[523, 659, 784, 1046, 1318].forEach((f, i) => {
      this.tone(f, 0.25, 'triangle', 0.15, undefined, 0.35 + i * 0.07)
    })
  }

  playError() {
    this.tone(170, 0.18, 'sawtooth', 0.12, 110)
  }
}
