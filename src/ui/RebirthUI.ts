import Phaser from 'phaser'
import { COLORS, textStyle } from '../config/theme'
import { t } from '../config/i18n'
import { formatNumber } from '../utils/format'

type RebirthState = 'locked' | 'ready' | 'confirm'

export class RebirthUI {
  private button!: Phaser.GameObjects.Text
  private state: RebirthState | null = null
  private baseScale = 1

  constructor(scene: Phaser.Scene, onClick: () => void) {
    this.button = scene.add.text(
      440,
      545,
      '',
      textStyle(14, COLORS.white, {
        backgroundColor: '#17171f',
        align: 'center',
        padding: { left: 14, right: 14, top: 8, bottom: 8 },
      }),
    )

    this.button.setOrigin(0.5)
    this.button.setDepth(100)
    this.button.setInteractive({ useHandCursor: true })
    this.button.setData('blocksFarm', true)

    this.button.on(
      'pointerdown',
      (
        _pointer: Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        event.stopPropagation()
        onClick()
      },
    )

    this.button.on('pointerover', () => this.button.setScale(this.baseScale * 1.04))
    this.button.on('pointerout', () => this.button.setScale(this.baseScale))
  }

  update(
    rebirths: number,
    multiplier: number,
    nextMultiplier: number,
    requirement: number,
    aura: number,
    confirming: boolean,
  ) {
    const ready = aura >= requirement
    const state: RebirthState = ready ? (confirming ? 'confirm' : 'ready') : 'locked'

    if (state === 'confirm') {
      this.button.setText(`${t('rebirthConfirm')}\n${t('rebirthConfirmSub')}`)
    } else {
      const line1 = t('rebirth', { n: rebirths, m: multiplier.toFixed(1) })

      const line2 =
        state === 'ready'
          ? t('rebirthReady', { m: nextMultiplier.toFixed(1) })
          : t('rebirthProgress', { a: formatNumber(aura), r: formatNumber(requirement) })

      this.button.setText(`${line1}\n${line2}`)
    }

    if (state !== this.state) {
      this.state = state

      if (state === 'confirm') {
        this.button.setColor(COLORS.red)
        this.button.setBackgroundColor('#3a1218')
      } else {
        this.button.setColor(state === 'ready' ? COLORS.yellow : COLORS.muted)
        this.button.setBackgroundColor('#17171f')
      }
    }
  }

  setPosition(x: number, y: number) {
    this.button.setPosition(x, y)
  }

  setScale(scale: number) {
    this.baseScale = scale
    this.button.setScale(scale)
  }
}
