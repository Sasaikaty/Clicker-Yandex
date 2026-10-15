import Phaser from 'phaser'

import { MOVEMENTS, type Movement } from '../data/movements'
import { COLORS, textStyle } from '../config/theme'
import { getMovementName, t } from '../config/i18n'
import { formatNumber } from '../utils/format'

export type MovementShopState = {
  isUnlocked: (movementId: string) => boolean
  isEquipped: (movementId: string) => boolean
  canAfford: (cost: number) => boolean
}

type ShopItem = {
  movement: Movement
  container: Phaser.GameObjects.Container
  rect: Phaser.GameObjects.Rectangle
  stripe: Phaser.GameObjects.Rectangle
  name: Phaser.GameObjects.Text
  status: Phaser.GameObjects.Text
  key: string
}

/**
 * Список движений живёт далеко за пределами экрана (x = LIST_X), а показывает его
 * отдельная камера, чья область просмотра в точности равна окну магазина.
 * Камера обрезает всё, что не помещается в окно, поэтому элементы
 * физически не могут выйти за его границы при скролле (маски не используются).
 */
const LIST_X = 100_000

export class MovementShopUI {
  private readonly scene: Phaser.Scene
  private readonly onMovementClick: (movement: Movement) => void

  private panel!: Phaser.GameObjects.Rectangle
  private title!: Phaser.GameObjects.Text
  private listCamera!: Phaser.Cameras.Scene2D.Camera

  private items: ShopItem[] = []

  private scrollOffset = 0
  private pointerDown = false
  private dragStartY = 0
  private lastY = 0
  private dragged = false

  private readonly wheelHandler: (
    pointer: Phaser.Input.Pointer,
    objects: Phaser.GameObjects.GameObject[],
    dx: number,
    dy: number,
  ) => void
  private readonly moveHandler: (pointer: Phaser.Input.Pointer) => void
  private readonly upHandler: () => void

  constructor(scene: Phaser.Scene, onMovementClick: (movement: Movement) => void) {
    this.scene = scene
    this.onMovementClick = onMovementClick

    this.wheelHandler = (pointer, _objects, _dx, dy) => {
      if (!Phaser.Geom.Rectangle.Contains(this.panel.getBounds(), pointer.x, pointer.y)) {
        return
      }

      this.scrollOffset -= dy * 0.5
      this.updateLayout()
    }

    this.moveHandler = (pointer) => {
      if (!this.pointerDown) {
        return
      }

      if (Math.abs(pointer.y - this.dragStartY) > 12) {
        this.dragged = true
      }

      if (this.dragged) {
        this.scrollOffset += pointer.y - this.lastY
        this.updateLayout()
      }

      this.lastY = pointer.y
    }

    this.upHandler = () => {
      this.pointerDown = false
    }

    this.create()

    scene.input.on('wheel', this.wheelHandler)
    scene.input.on('pointermove', this.moveHandler)
    scene.input.on('pointerup', this.upHandler)
  }

  // =========================================================
  // CREATE
  // =========================================================

  private create() {
    const scene = this.scene

    this.panel = scene.add.rectangle(0, 0, 300, 500, COLORS.panel)
    this.panel.setOrigin(0)
    this.panel.setDepth(90)
    this.panel.setStrokeStyle(2, COLORS.border)
    this.panel.setData('blocksFarm', true)
    this.panel.setInteractive()
    this.panel.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.startDrag(pointer))

    this.title = scene.add.text(0, 0, t('movements'), textStyle(18))
    this.title.setDepth(100)

    this.listCamera = scene.cameras.add(0, 0, 100, 100)
    this.listCamera.setScroll(LIST_X, 0)
    this.listCamera.setRoundPixels(true)

    MOVEMENTS.forEach((movement) => {
      const item = this.createItem(movement)

      // Основная камера список не рисует и не опрашивает.
      scene.cameras.main.ignore(item.container)

      this.items.push(item)
    })
  }

  private startDrag(pointer: Phaser.Input.Pointer) {
    this.pointerDown = true
    this.dragged = false
    this.dragStartY = pointer.y
    this.lastY = pointer.y
  }

  private createItem(movement: Movement): ShopItem {
    const scene = this.scene

    const container = scene.add.container(LIST_X, 0)
    container.setDepth(100)

    const rect = scene.add.rectangle(0, 0, 330, 76, COLORS.panelLight)
    rect.setOrigin(0)
    rect.setStrokeStyle(1, COLORS.border)
    rect.setInteractive(new Phaser.Geom.Rectangle(0, 0, 330, 76), Phaser.Geom.Rectangle.Contains)
    rect.input!.cursor = 'pointer'
    rect.setData('blocksFarm', true)

    const stripe = scene.add.rectangle(0, 0, 6, 76, movement.color)
    stripe.setOrigin(0)

    const name = scene.add.text(18, 12, getMovementName(movement.id, movement.name), textStyle(17))
    const status = scene.add.text(18, 44, '', textStyle(13, COLORS.muted))

    container.add([rect, stripe, name, status])

    rect.on(
      'pointerdown',
      (
        pointer: Phaser.Input.Pointer,
        _lx: number,
        _ly: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        event.stopPropagation()
        this.startDrag(pointer)
      },
    )

    rect.on(
      'pointerup',
      (
        _pointer: Phaser.Input.Pointer,
        _lx: number,
        _ly: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        event.stopPropagation()

        if (this.pointerDown && !this.dragged) {
          this.onMovementClick(movement)
        }

        this.pointerDown = false
      },
    )

    return { movement, container, rect, stripe, name, status, key: '' }
  }

  // =========================================================
  // STATE
  // =========================================================

  update(state: MovementShopState) {
    this.items.forEach((item) => {
      const { movement, rect, stripe, status, container } = item

      const unlocked = state.isUnlocked(movement.id)
      const equipped = state.isEquipped(movement.id)
      const affordable = state.canAfford(movement.cost)

      const key = equipped ? 'E' : unlocked ? 'O' : affordable ? 'A' : 'L'

      // Ничего не перерисовываем, если состояние кнопки не менялось.
      if (key === item.key) {
        return
      }

      item.key = key

      const aura = formatNumber(movement.aura)

      if (equipped) {
        status.setText(`${t('equipped')} • +${aura}`)
        status.setColor(COLORS.green)
        rect.setStrokeStyle(2, 0x55ff88)
        rect.setFillStyle(COLORS.panelLight)
        stripe.setAlpha(1)
        container.setAlpha(1)

        return
      }

      if (unlocked) {
        status.setText(`${t('owned')} • +${aura}`)
        status.setColor(COLORS.white)
        rect.setStrokeStyle(1, COLORS.border)
        rect.setFillStyle(COLORS.panelLight)
        stripe.setAlpha(1)
        container.setAlpha(1)

        return
      }

      status.setText(`${formatNumber(movement.cost)} ${t('aura')} • +${aura}`)
      status.setColor(affordable ? COLORS.yellow : COLORS.muted)
      rect.setStrokeStyle(1, COLORS.border)
      rect.setFillStyle(COLORS.panel)
      stripe.setAlpha(0.35)
      container.setAlpha(affordable ? 1 : 0.65)
    })
  }

  // =========================================================
  // LAYOUT
  // =========================================================

  updateLayout() {
    if (!this.panel) {
      return
    }

    const width = this.scene.scale.width
    const height = this.scene.scale.height

    const isPortrait = width < 700 && height > width
    const isLandscape = width < 900 && width >= height

    let panelX: number
    let panelY: number
    let panelWidth: number
    let panelHeight: number
    let buttonHeight = 76
    let gap = 10

    if (isPortrait) {
      const gameArea = this.scene.data.get('gameAreaBounds') as
        | { y: number; height: number }
        | undefined

      const gameBottom = gameArea ? gameArea.y + gameArea.height : height * 0.43

      panelWidth = width - 24
      panelHeight = Math.min(260, height * 0.32)
      panelX = 12
      panelY = gameBottom + 95
      buttonHeight = 60
      gap = 8
    } else if (isLandscape) {
      panelWidth = Math.min(270, width * 0.29)
      panelHeight = Math.max(180, height - 60)
      panelX = width - panelWidth - 10
      panelY = 45
      buttonHeight = 60
      gap = 8
    } else {
      panelWidth = Math.min(340, width * 0.29)
      panelHeight = Math.min(560, height - 100)
      panelX = width - panelWidth - 20
      panelY = 80
    }

    this.panel.setPosition(panelX, panelY)
    this.panel.setSize(panelWidth, panelHeight)
    this.updateHitArea(this.panel, panelWidth, panelHeight)

    this.title.setPosition(panelX + 14, panelY + 10)

    const viewportX = panelX + 8
    const viewportY = panelY + 42
    const viewportWidth = panelWidth - 16
    const viewportHeight = panelHeight - 50

    // Камера списка = окно магазина. Всё, что за его границами, не рисуется.
    this.listCamera.setViewport(viewportX, viewportY, viewportWidth, viewportHeight)
    this.listCamera.setScroll(LIST_X, 0)

    const contentHeight = MOVEMENTS.length * (buttonHeight + gap) - gap
    const maxScroll = Math.max(0, contentHeight - viewportHeight)

    this.scrollOffset = Phaser.Math.Clamp(this.scrollOffset, -maxScroll, 0)

    this.items.forEach((item, index) => {
      const top = index * (buttonHeight + gap) + this.scrollOffset

      item.container.setPosition(LIST_X, top)

      item.rect.setSize(viewportWidth, buttonHeight)
      this.updateHitArea(item.rect, viewportWidth, buttonHeight)

      item.stripe.setSize(6, buttonHeight)

      item.name.setY(buttonHeight * 0.16)
      item.status.setY(buttonHeight * 0.58)

      // Невидимые строки не рисуем и не опрашиваем.
      const visible = top + buttonHeight > 0 && top < viewportHeight

      item.container.setVisible(visible)

      if (item.rect.input) {
        item.rect.input.enabled = visible
      }
    })
  }

  /**
   * Камера списка рисуется поверх основной, поэтому на время модальных окон
   * её нужно выключить вместе с обработкой нажатий.
   */
  setListEnabled(enabled: boolean) {
    this.listCamera.setVisible(enabled)
    this.listCamera.inputEnabled = enabled

    if (!enabled) {
      this.pointerDown = false
    }
  }

  private updateHitArea(shape: Phaser.GameObjects.Rectangle, w: number, h: number) {
    const area = shape.input?.hitArea as Phaser.Geom.Rectangle | undefined

    if (area) {
      area.setSize(w, h)
    }
  }

  // =========================================================
  // CLEANUP
  // =========================================================

  destroy() {
    this.scene.input.off('wheel', this.wheelHandler)
    this.scene.input.off('pointermove', this.moveHandler)
    this.scene.input.off('pointerup', this.upHandler)

    this.items.forEach((item) => item.container.destroy())
    this.items = []

    if (this.listCamera) {
      this.scene.cameras.remove(this.listCamera)
    }

    this.title?.destroy()
    this.panel?.destroy()
  }
}
