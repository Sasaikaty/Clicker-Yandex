import Phaser from 'phaser'
import { COLORS, textStyle } from '../config/theme'
import { t } from '../config/i18n'

export class PlayerInfoUI {
  private readonly scene: Phaser.Scene
  private titleText!: Phaser.GameObjects.Text
  private comboText!: Phaser.GameObjects.Text

  constructor(scene: Phaser.Scene) {
    this.scene = scene

    this.titleText = scene.add.text(440, 160, t('npc'), textStyle(24))
    this.titleText.setOrigin(0.5)
    this.titleText.setDepth(100)
    this.titleText.setStroke('#000000', 4)

    this.comboText = scene.add.text(440, 188, '', textStyle(17, COLORS.yellow))
    this.comboText.setOrigin(0.5)
    this.comboText.setDepth(100)
    this.comboText.setStroke('#000000', 4)
  }

  setTitle(title: string) {
    this.titleText.setText(title)
  }

  setCombo(combo: number) {
    this.comboText.setText(combo > 1 ? t('combo', { n: combo }) : '')

    if (combo > 1) {
      this.scene.tweens.killTweensOf(this.comboText)
      this.comboText.setScale(1)

      this.scene.tweens.add({
        targets: this.comboText,
        scale: 1.15,
        duration: 80,
        yoyo: true,
      })
    }
  }

  setPosition(x: number, titleY: number, comboY: number) {
    this.titleText.setPosition(x, titleY)
    this.comboText.setPosition(x, comboY)
  }

  setTitleFontSize(size: number) {
    this.titleText.setFontSize(size)
  }

  setComboFontSize(size: number) {
    this.comboText.setFontSize(size)
  }
}
