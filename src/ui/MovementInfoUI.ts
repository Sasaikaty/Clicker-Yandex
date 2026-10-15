import Phaser from 'phaser'
import { COLORS, textStyle, toHex } from '../config/theme'
import { t } from '../config/i18n'
import { formatNumber } from '../utils/format'

export class MovementInfoUI {
  private moveNameText!: Phaser.GameObjects.Text
  private moveAuraText!: Phaser.GameObjects.Text

  constructor(scene: Phaser.Scene) {
    this.moveNameText = scene.add.text(440, 600, '', textStyle(20))
    this.moveNameText.setOrigin(0.5)
    this.moveNameText.setDepth(100)

    this.moveAuraText = scene.add.text(440, 628, '', textStyle(14, COLORS.muted))
    this.moveAuraText.setOrigin(0.5)
    this.moveAuraText.setDepth(100)
  }

  setMovement(name: string, aura: number, color: number) {
    this.moveNameText.setText(name)
    this.moveNameText.setColor(toHex(color))
    this.moveAuraText.setText(t('plusAura', { n: formatNumber(aura) }))
  }

  setPosition(x: number, nameY: number, auraY: number) {
    this.moveNameText.setPosition(x, nameY)
    this.moveAuraText.setPosition(x, auraY)
  }

  setNameFontSize(size: number) {
    this.moveNameText.setFontSize(size)
  }

  setAuraFontSize(size: number) {
    this.moveAuraText.setFontSize(size)
  }

  setVisible(visible: boolean) {
    this.moveNameText.setVisible(visible)
    this.moveAuraText.setVisible(visible)
  }

  destroy() {
    this.moveNameText.destroy()
    this.moveAuraText.destroy()
  }
}
