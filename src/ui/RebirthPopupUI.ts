import Phaser from 'phaser'
import { COLORS, textStyle } from '../config/theme'
import { t } from '../config/i18n'

type Handlers = {
  onWatchAd: () => void
  onReset: () => void
  onClose: () => void
  /** Вызывается при открытии и закрытии окна. */
  onToggle?: (open: boolean) => void
}

/** Модальное окно: переродиться без сброса за рекламу / со сбросом / не сейчас. */
export class RebirthPopupUI {
  private readonly scene: Phaser.Scene
  private readonly handlers: Handlers

  private dim!: Phaser.GameObjects.Rectangle
  private panel!: Phaser.GameObjects.Graphics
  private title!: Phaser.GameObjects.Text
  private hint!: Phaser.GameObjects.Text
  private adButton!: Phaser.GameObjects.Text
  private resetButton!: Phaser.GameObjects.Text
  private closeButton!: Phaser.GameObjects.Text

  private open = false
  private openedAt = 0
  private multiplier = 1

  constructor(scene: Phaser.Scene, handlers: Handlers) {
    this.scene = scene
    this.handlers = handlers

    this.dim = scene.add.rectangle(0, 0, 10, 10, 0x000000, 0.75)
    this.dim.setOrigin(0)
    this.dim.setDepth(300)
    this.dim.setInteractive()
    this.dim.setData('blocksFarm', true)
    this.dim.on(
      'pointerdown',
      (
        _p: Phaser.Input.Pointer,
        _x: number,
        _y: number,
        event: Phaser.Types.Input.EventData,
      ) => event.stopPropagation(),
    )

    this.panel = scene.add.graphics()
    this.panel.setDepth(301)

    this.title = scene.add.text(0, 0, '', textStyle(26, COLORS.yellow, { align: 'center' }))
    this.title.setOrigin(0.5, 0)
    this.title.setDepth(302)

    this.hint = scene.add.text(0, 0, '', textStyle(14, COLORS.white, { align: 'center' }))
    this.hint.setOrigin(0.5, 0)
    this.hint.setDepth(302)

    this.adButton = this.makeButton('#1f6b3a', handlers.onWatchAd)
    this.resetButton = this.makeButton('#6b1f2a', handlers.onReset)
    this.closeButton = this.makeButton('#2a2a38', handlers.onClose)

    this.setOpen(false)
  }

  private makeButton(background: string, callback: () => void): Phaser.GameObjects.Text {
    const button = this.scene.add.text(
      0,
      0,
      '',
      textStyle(15, COLORS.white, {
        backgroundColor: background,
        align: 'center',
        padding: { left: 12, right: 12, top: 12, bottom: 12 },
      }),
    )

    button.setOrigin(0.5, 0)
    button.setDepth(302)
    button.setInteractive({ useHandCursor: true })
    button.setData('blocksFarm', true)

    button.on(
      'pointerdown',
      (
        _p: Phaser.Input.Pointer,
        _x: number,
        _y: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        event.stopPropagation()

        // Защита от случайного тапа в момент появления окна.
        if (!this.open || this.scene.time.now - this.openedAt < 600) {
          return
        }

        callback()
      },
    )

    return button
  }

  private setOpen(value: boolean) {
    this.open = value

    this.handlers.onToggle?.(value)

    const objects = [
      this.dim,
      this.panel,
      this.title,
      this.hint,
      this.adButton,
      this.resetButton,
      this.closeButton,
    ]

    objects.forEach((object) => {
      object.setVisible(value)

      if (object.input) {
        object.input.enabled = value
      }
    })
  }

  isOpen(): boolean {
    return this.open
  }

  show(nextMultiplier: number) {
    this.multiplier = nextMultiplier
    this.openedAt = this.scene.time.now

    this.setOpen(true)
    this.layout()
  }

  hide() {
    this.setOpen(false)
  }

  layout() {
    if (!this.open) {
      return
    }

    const width = this.scene.scale.width
    const height = this.scene.scale.height

    this.dim.setSize(width, height)

    const small = width < 500 || height < 460
    const panelWidth = Math.min(440, width - 24)
    const inner = panelWidth - 40

    this.title.setText(t('popupTitle'))
    this.title.setFontSize(small ? 20 : 26)
    this.title.setWordWrapWidth(inner)

    this.hint.setText(`${t('popupBody', { m: this.multiplier.toFixed(1) })}\n\n${t('popupHint')}`)
    this.hint.setFontSize(small ? 12 : 14)
    this.hint.setWordWrapWidth(inner)

    const fontSize = small ? 13 : 15

    const buttons: [Phaser.GameObjects.Text, string][] = [
      [this.adButton, t('popupAd')],
      [this.resetButton, t('popupReset')],
      [this.closeButton, t('popupClose')],
    ]

    buttons.forEach(([button, label]) => {
      button.setText(label)
      button.setFontSize(fontSize)
      button.setWordWrapWidth(inner - 24)
      button.setFixedSize(inner, 0)
    })

    const pad = 22
    const gap = 12

    const total =
      pad +
      this.title.height +
      gap +
      this.hint.height +
      gap * 2 +
      this.adButton.height +
      gap +
      this.resetButton.height +
      gap +
      this.closeButton.height +
      pad

    const top = Math.max(8, (height - total) / 2)
    const centerX = width / 2

    this.panel.clear()
    this.panel.fillStyle(COLORS.panel, 1)
    this.panel.fillRoundedRect(centerX - panelWidth / 2, top, panelWidth, total, 18)
    this.panel.lineStyle(2, 0x55ff88, 1)
    this.panel.strokeRoundedRect(centerX - panelWidth / 2, top, panelWidth, total, 18)

    let y = top + pad

    this.title.setPosition(centerX, y)
    y += this.title.height + gap

    this.hint.setPosition(centerX, y)
    y += this.hint.height + gap * 2

    ;[this.adButton, this.resetButton, this.closeButton].forEach((button) => {
      button.setPosition(centerX, y)
      y += button.height + gap
    })
  }
}
