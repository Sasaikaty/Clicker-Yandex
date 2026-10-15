import Phaser from 'phaser'
import { textStyle } from '../config/theme'
import { t } from '../config/i18n'
import { formatNumber } from '../utils/format'

export class HeaderUI {
  private readonly scene: Phaser.Scene
  private auraText!: Phaser.GameObjects.Text

  constructor(scene: Phaser.Scene) {
    this.scene = scene

    this.auraText = scene.add.text(640, 35, '', textStyle(34))
    this.auraText.setOrigin(0.5)
    this.auraText.setDepth(100)
    this.auraText.setStroke('#000000', 6)
    this.auraText.setShadow(0, 4, '#000000', 8, true, true)
  }

  setAura(aura: number) {
    this.auraText.setText(`${formatNumber(aura)} ${t('aura')}`)
  }

  bump() {
    this.scene.tweens.killTweensOf(this.auraText)
    this.auraText.setScale(1)

    this.scene.tweens.add({
      targets: this.auraText,
      scale: 1.1,
      duration: 70,
      yoyo: true,
      ease: 'Sine.easeOut',
    })
  }

  setPosition(x: number, y: number) {
    this.auraText.setPosition(x, y)
  }

  setFontSize(size: number) {
    this.auraText.setFontSize(size)
  }
}
