import Phaser from 'phaser'

/** Генерирует все текстуры кодом — игра не требует ни одного файла картинок. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  create() {
    this.makeRadial('glow', 256, [
      [0, 'rgba(255,255,255,1)'],
      [0.35, 'rgba(255,255,255,0.35)'],
      [1, 'rgba(255,255,255,0)'],
    ])

    this.makeRadial('spark', 24, [
      [0, 'rgba(255,255,255,1)'],
      [0.4, 'rgba(255,255,255,0.6)'],
      [1, 'rgba(255,255,255,0)'],
    ])

    this.makeBackground()

    this.scene.start('GameScene')
  }

  private makeRadial(key: string, size: number, stops: [number, string][]) {
    const texture = this.textures.createCanvas(key, size, size)

    if (!texture) {
      return
    }

    const ctx = texture.getContext()
    const half = size / 2
    const gradient = ctx.createRadialGradient(half, half, 0, half, half, half)

    stops.forEach(([offset, color]) => gradient.addColorStop(offset, color))

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)

    texture.refresh()
  }

  private makeBackground() {
    const texture = this.textures.createCanvas('bg', 4, 512)

    if (!texture) {
      return
    }

    const ctx = texture.getContext()
    const gradient = ctx.createLinearGradient(0, 0, 0, 512)

    gradient.addColorStop(0, '#1d1236')
    gradient.addColorStop(0.55, '#0f0d1c')
    gradient.addColorStop(1, '#07070b')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 4, 512)

    texture.refresh()
  }
}
