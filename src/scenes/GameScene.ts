import Phaser from 'phaser'

import { MOVEMENTS, type Movement } from '../data/movements'
import { CROWD_CHEER } from '../data/animations'

import { Character, type CharacterStyle } from '../entities/Character'
import { Player } from '../entities/Player'

import { AdSystem } from '../systems/AdSystem'
import { AudioSystem } from '../systems/AudioSystem'
import { AuraSystem } from '../systems/AuraSystem'
import { ComboSystem } from '../systems/ComboSystem'
import { MovementSystem } from '../systems/MovementSystem'
import { SaveSystem } from '../systems/SaveSystem'

import { HeaderUI } from '../ui/HeaderUI'
import { MovementInfoUI } from '../ui/MovementInfoUI'
import { MovementShopUI } from '../ui/MovementShopUI'
import { PlayerInfoUI } from '../ui/PlayerInfoUI'
import { RebirthPopupUI } from '../ui/RebirthPopupUI'
import { RebirthUI } from '../ui/RebirthUI'

import { COLORS, textStyle } from '../config/theme'
import { getMovementName, t } from '../config/i18n'
import { platform } from '../platform/PlatformService'
import { formatNumber, formatTime } from '../utils/format'

type LayoutConfig = {
  gameLeft: number
  gameTop: number
  gameWidth: number
  gameHeight: number
  playerYRatio: number
  scale: number
  headerY: number
  headerSize: number
  titleY: number
  titleSize: number
  comboY: number
  comboSize: number
  upgradeY: number
  upgradeScale: number
  info: { nameY: number; auraY: number; nameSize: number; auraSize: number } | null
  buttonFont: number
  compact: boolean
}

const BOOST_DURATION_MS = 120_000

const CROWD_STYLES: CharacterStyle[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => ({
  outfit: [0x555566, 0x666655, 0x555577, 0x665555, 0x4a6670, 0x6b4a70][i % 6],
  pants: [0x2a2a38, 0x33333f, 0x262633][i % 3],
  skin: [0xffd0a0, 0xe0ac80, 0xc68642, 0x8d5524, 0xf1c27d][i % 5],
  hair: [0x2b1b12, 0x6b4423, 0x111111, 0xb08d57, 0x555555][(i * 2) % 5],
  shoes: [0xdddddd, 0x888899, 0x444455][i % 3],
  size: 0.85,
}))

export class GameScene extends Phaser.Scene {
  // systems
  private auraSystem!: AuraSystem
  private comboSystem!: ComboSystem
  private movementSystem!: MovementSystem
  private saveSystem!: SaveSystem
  private audio!: AudioSystem

  // objects
  private player!: Player
  private crowd: Character[] = []

  // ui
  private headerUI!: HeaderUI
  private playerInfoUI!: PlayerInfoUI
  private rebirthUI!: RebirthUI
  private rebirthConfirming = false
  private rebirthConfirmTimer?: Phaser.Time.TimerEvent
  private rebirthPopup!: RebirthPopupUI
  private rebirthOfferedLevel = -1

  private adSystem!: AdSystem
  private adCountdownText!: Phaser.GameObjects.Text
  private movementInfoUI!: MovementInfoUI
  private movementShopUI!: MovementShopUI
  private muteButton!: Phaser.GameObjects.Text
  private boostButton!: Phaser.GameObjects.Text

  // visuals
  private bg!: Phaser.GameObjects.Image
  private stage!: Phaser.GameObjects.Graphics
  private floorGlow!: Phaser.GameObjects.Image
  private burst!: Phaser.GameObjects.Particles.ParticleEmitter
  private ambient?: Phaser.GameObjects.Particles.ParticleEmitter
  private ambientW = 0
  private ambientH = 0
  private fxColor = 0x8f8f9f

  // boost / platform / save
  private boostEndsAt = 0
  private lastBoostLabel = ''
  private compactUI = false
  private adBusy = false
  private gameplayActive = false
  private idleTimer?: Phaser.Time.TimerEvent
  private saveTimer?: Phaser.Time.TimerEvent

  constructor() {
    super('GameScene')
  }

  // =========================================================
  // CREATE
  // =========================================================

  create() {
    this.createSystems()
    this.createBackground()
    this.createEffects()

    this.headerUI = new HeaderUI(this)

    this.createCrowd()

    this.player = new Player(this, 440, 370)
    this.player.setDepth(10)

    this.playerInfoUI = new PlayerInfoUI(this)
    this.rebirthUI = new RebirthUI(this, () => this.onRebirthClick())
    this.movementInfoUI = new MovementInfoUI(this)
    this.movementShopUI = new MovementShopUI(this, (movement) => this.handleMovementClick(movement))

    this.createSideButtons()
    this.createAdCountdown()

    this.rebirthPopup = new RebirthPopupUI(this, {
      onWatchAd: () => {
        void this.rebirthWithAd()
      },
      onReset: () => {
        this.rebirthPopup.hide()
        this.doRebirth(false)
      },
      onClose: () => this.rebirthPopup.hide(),
      onToggle: (open) => this.movementShopUI.setListEnabled(!open),
    })

    this.setupKeyboard()
    this.setupGlobalGameClick()

    this.loadGame()
    this.applyMovementTheme()
    this.updateAllUI()
    this.refreshMuteButton()
    this.refreshBoostButton()

    this.handleResize()

    // Страховка для телефонов: размер родителя иногда уточняется на следующих кадрах.
    this.time.delayedCall(150, () => this.handleResize())

    this.scale.on('resize', this.handleResize, this)
    this.game.events.on('hidden', this.onHidden, this)
    this.game.events.on('blur', this.onHidden, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this)

    this.adSystem = new AdSystem(this, {
      canShow: () => !this.adBusy && !this.rebirthPopup.isOpen() && this.gameplayActive,
      onCountdown: (seconds) => {
        if (seconds === null) {
          this.adCountdownText.setVisible(false)

          return
        }

        this.adCountdownText.setText(t('adCountdown', { n: seconds }))
        this.adCountdownText.setVisible(true)
      },
      onAdStart: () => {
        this.audio.setSuppressed(true)
        this.stopGameplay()
      },
      onAdEnd: () => this.audio.setSuppressed(false),
    })

    this.adSystem.start()

    // Платформа может попросить поставить игру на паузу.
    platform.setPauseHandlers(
      () => {
        this.audio.setSuppressed(true)
        this.scene.pause()
      },
      () => {
        this.audio.setSuppressed(false)
        this.scene.resume()
      },
    )

    platform.gameReady()
  }

  private createSystems() {
    this.auraSystem = new AuraSystem()
    this.saveSystem = new SaveSystem()
    this.audio = new AudioSystem(this)

    this.comboSystem = new ComboSystem(
      this,
      (combo) => {
        this.playerInfoUI?.setCombo(combo)
      },
      () => {
        this.showMessage(t('combo', { n: this.comboSystem.getCombo() }))
        this.audio.playCombo()
      },
    )

    this.movementSystem = new MovementSystem(this.auraSystem, this.comboSystem)
  }

  // =========================================================
  // BACKGROUND & FX
  // =========================================================

  private createBackground() {
    this.bg = this.add.image(0, 0, 'bg').setOrigin(0).setDepth(-100)
    this.stage = this.add.graphics().setDepth(-30)

    this.floorGlow = this.add
      .image(0, 0, 'glow')
      .setDepth(1)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.55)
  }

  private createEffects() {
    const burstConfig = {
      emitting: false,
      lifespan: { min: 350, max: 750 },
      speed: { min: 140, max: 380 },
      angle: { min: 210, max: 330 },
      gravityY: 700,
      scale: { start: 0.9, end: 0 },
      alpha: { start: 1, end: 0 },
      blendMode: 'ADD',
      tint: { onEmit: () => this.fxColor },
    } as unknown as Phaser.Types.GameObjects.Particles.ParticleEmitterConfig

    this.burst = this.add.particles(0, 0, 'spark', burstConfig)
    this.burst.setDepth(120)
  }

  private createAmbient(width: number, height: number) {
    this.ambient?.destroy()

    const config = {
      x: { min: 0, max: width },
      y: { min: height * 0.3, max: height },
      lifespan: { min: 3500, max: 6500 },
      speedY: { min: -45, max: -15 },
      speedX: { min: -10, max: 10 },
      scale: { start: 0.35, end: 0 },
      alpha: { start: 0.55, end: 0 },
      frequency: 140,
      blendMode: 'ADD',
      tint: { onEmit: () => this.fxColor },
    } as unknown as Phaser.Types.GameObjects.Particles.ParticleEmitterConfig

    this.ambient = this.add.particles(0, 0, 'spark', config)
    this.ambient.setDepth(-25)

    this.ambientW = width
    this.ambientH = height
  }

  private applyMovementTheme() {
    const movement = this.movementSystem.getCurrentMovement()

    this.fxColor = movement.color
    this.player.setAuraColor(movement.color)
    this.floorGlow.setTint(movement.color)
  }

  private spawnBurst(count: number) {
    this.burst.explode(count, this.player.x, this.player.y - 40 * this.player.scaleY)
  }

  // =========================================================
  // CROWD
  // =========================================================

  private createCrowd() {
    CROWD_STYLES.forEach((style) => {
      this.crowd.push(new Character(this, 0, 0, style))
    })
  }

  private layoutCrowd(x: number, y: number, width: number, height: number, scale: number) {
    const positions = [
      [0.1, 0.28], [0.22, 0.5], [0.34, 0.25], [0.42, 0.68], [0.56, 0.27],
      [0.62, 0.68], [0.75, 0.3], [0.88, 0.5], [0.28, 0.82], [0.72, 0.82],
    ]

    this.crowd.forEach((npc, index) => {
      const [rx, ry] = positions[index]

      npc.setPosition(x + width * rx, y + height * ry)
      npc.setScale(scale)
      npc.setDepth(2 + npc.y * 0.001)
    })
  }

  private reactCrowd() {
    if (this.movementSystem.getCurrentMovement().id === 'stare') {
      return
    }

    this.crowd.forEach((npc) => npc.playKeyframes(CROWD_CHEER))
  }

  // =========================================================
  // SIDE BUTTONS (sound / ad boost)
  // =========================================================

  private makePill(originX: number, onClick: () => void): Phaser.GameObjects.Text {
    const pill = this.add.text(
      0,
      0,
      '',
      textStyle(12, COLORS.white, {
        backgroundColor: '#17171f',
        padding: { left: 8, right: 8, top: 5, bottom: 5 },
      }),
    )

    pill.setOrigin(originX, 0)
    pill.setDepth(100)
    pill.setInteractive({ useHandCursor: true })
    pill.setData('blocksFarm', true)

    pill.on(
      'pointerdown',
      (
        _pointer: Phaser.Input.Pointer,
        _lx: number,
        _ly: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        event.stopPropagation()
        onClick()
      },
    )

    return pill
  }

  private createSideButtons() {
    this.muteButton = this.makePill(0, () => {
      this.audio.setUserMuted(!this.audio.isUserMuted())
      this.refreshMuteButton()
      this.scheduleSave()
    })

    this.boostButton = this.makePill(1, () => {
      void this.watchAdForBoost()
    })
  }

  private createAdCountdown() {
    this.adCountdownText = this.add.text(
      0,
      0,
      '',
      textStyle(24, COLORS.yellow, {
        backgroundColor: '#17171f',
        align: 'center',
        padding: { left: 18, right: 18, top: 10, bottom: 10 },
      }),
    )

    this.adCountdownText.setOrigin(0.5)
    this.adCountdownText.setDepth(250)
    this.adCountdownText.setVisible(false)
  }

  private refreshMuteButton() {
    const muted = this.audio.isUserMuted()

    this.muteButton.setText(
      this.compactUI
        ? muted ? t('soundOffShort') : t('soundOnShort')
        : muted ? t('soundOff') : t('soundOn'),
    )
  }

  private refreshBoostButton() {
    const visible = platform.rewardedSupported

    this.boostButton.setVisible(visible)

    if (this.boostButton.input) {
      this.boostButton.input.enabled = visible
    }

    if (visible && this.boostEndsAt === 0) {
      this.boostButton.setText(this.compactUI ? t('boostAdShort') : t('boostAd'))
      this.boostButton.setColor(COLORS.yellow)
      this.lastBoostLabel = ''
    }
  }

  private async watchAdForBoost() {
    if (this.adBusy || this.boostEndsAt > 0) {
      return
    }

    const rewarded = await this.runRewardedAd()

    if (!rewarded) {
      return
    }

    this.boostEndsAt = Date.now() + BOOST_DURATION_MS
    this.auraSystem.setBoostMultiplier(2)
    this.boostButton.setColor(COLORS.green)

    this.showMessage(t('boostStarted'))
    this.audio.playUnlock()
  }

  /** Единая точка показа rewarded-рекламы (буст и перерождение). */
  private async runRewardedAd(): Promise<boolean> {
    if (this.adBusy) {
      return false
    }

    this.adBusy = true
    this.stopGameplay()

    const rewarded = await platform.showRewarded(
      () => this.audio.setSuppressed(true),
      () => this.audio.setSuppressed(false),
    )

    this.adBusy = false

    // Следующая межстраничная реклама — не раньше чем через 3 минуты после этой.
    this.adSystem.markAdShown()

    return rewarded
  }

  // =========================================================
  // INPUT
  // =========================================================

  private setupKeyboard() {
    if (!this.input.keyboard) {
      return
    }

    this.input.keyboard.addCapture('SPACE')
    this.input.keyboard.on('keydown-SPACE', () => this.performMovement())
  }

  private setupGlobalGameClick() {
    this.input.on(
      'pointerdown',
      (_pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.GameObject[]) => {
        const blocked = gameObjects.some((object) => object.getData('blocksFarm') === true)

        if (!blocked) {
          this.performMovement()
        }
      },
    )
  }

  // =========================================================
  // GAMEPLAY
  // =========================================================

  private handleMovementClick(movement: Movement) {
    const result = this.movementSystem.handleMovementClick(movement)

    if (result.reason === 'not-enough-aura') {
      this.audio.playError()
      this.showMessage(t('need', { n: formatNumber(movement.cost) }))

      return
    }

    this.applyMovementTheme()
    this.updateAllUI()
    this.scheduleSave()

    if (result.reason === 'equipped') {
      this.showMessage(t('equippedMsg', { name: getMovementName(movement.id, movement.name) }))
      this.player.playMovement(movement.animation)

      return
    }

    // unlocked
    this.showMessage(t('unlocked', { name: getMovementName(movement.id, movement.name) }))
    this.audio.playUnlock()
    this.spawnBurst(26)
    this.player.playMovement(movement.animation)
    platform.happyTime()
  }

  private performMovement() {
    if (this.rebirthPopup.isOpen()) {
      return
    }

    this.startGameplay()

    const result = this.movementSystem.performMovement()
    const movement = this.movementSystem.getCurrentMovement()

    this.headerUI.setAura(this.auraSystem.getAura())
    this.headerUI.bump()

    this.updatePlayerTitle()
    this.updateRebirthUI()
    this.updateMovementUI()

    this.scheduleSave()

    this.player.playMovement(movement.animation)

    this.audio.playClick(this.comboSystem.getCombo())

    this.maybeOfferRebirth()

    if (result.critical) {
      this.audio.playCritical()
      this.showCriticalPopup(result.auraGain)
      this.spawnBurst(20)
      this.cameras.main.shake(140, 0.005)
    } else {
      this.showAuraPopup(result.auraGain)
      this.spawnBurst(6)
    }

    this.reactCrowd()
  }

  private onRebirthClick() {
    if (!this.auraSystem.canRebirth()) {
      this.audio.playError()
      this.showMessage(
        t('rebirthNeed', { n: formatNumber(this.auraSystem.getRebirthRequirement()) }),
      )

      return
    }

    // Есть реклама — предлагаем выбор в попапе (в т.ч. перерождение без сброса).
    if (platform.rewardedSupported) {
      this.openRebirthPopup()

      return
    }

    // Без рекламы: обычное перерождение с подтверждением.
    if (!this.rebirthConfirming) {
      this.rebirthConfirming = true

      this.rebirthConfirmTimer?.remove()
      this.rebirthConfirmTimer = this.time.delayedCall(3500, () => {
        this.rebirthConfirming = false
        this.updateRebirthUI()
      })

      this.updateRebirthUI()

      return
    }

    this.rebirthConfirmTimer?.remove()
    this.rebirthConfirming = false

    this.doRebirth(false)
  }

  private openRebirthPopup() {
    this.rebirthPopup.show(this.auraSystem.getRebirthMultiplier(this.auraSystem.getRebirths() + 1))
  }

  /** Один раз на каждый уровень перерождения сами предлагаем попап. */
  private maybeOfferRebirth() {
    if (
      !platform.rewardedSupported ||
      !this.auraSystem.canRebirth() ||
      this.rebirthOfferedLevel === this.auraSystem.getRebirths() ||
      this.rebirthPopup.isOpen() ||
      this.adBusy
    ) {
      return
    }

    this.rebirthOfferedLevel = this.auraSystem.getRebirths()
    this.openRebirthPopup()
  }

  private async rebirthWithAd() {
    this.rebirthPopup.hide()

    const rewarded = await this.runRewardedAd()

    if (rewarded) {
      this.doRebirth(true)
    } else {
      this.audio.playError()
      this.showMessage(t('adUnavailable'))
    }
  }

  private doRebirth(keepProgress: boolean) {
    if (!this.auraSystem.rebirth(keepProgress)) {
      return
    }

    if (!keepProgress) {
      this.movementSystem.setUnlockedMovements(['stare'])
      this.movementSystem.setCurrentMovement(MOVEMENTS[0])
    }

    this.applyMovementTheme()
    this.updateAllUI()
    this.flushSave()

    this.audio.playRebirth()
    this.spawnBurst(45)
    this.cameras.main.flash(350, 255, 255, 255)
    this.cameras.main.shake(300, 0.008)

    this.player.playMovement('levitate')
    this.reactCrowd()

    this.showMessage(
      t(keepProgress ? 'rebirthDoneKeep' : 'rebirthDone', {
        m: this.auraSystem.getRebirthMultiplier().toFixed(1),
      }),
    )

    platform.happyTime()
  }

  // =========================================================
  // TITLES / UI
  // =========================================================

  private getPlayerTitle(): string {
    const aura = this.auraSystem.getAura()

    if (aura >= 10_000_000_000) return t('title7')
    if (aura >= 100_000_000) return t('title6')
    if (aura >= 1_000_000) return t('title5')
    if (aura >= 100_000) return t('title4')
    if (aura >= 10_000) return t('title3')
    if (aura >= 1_000) return t('title2')
    if (aura >= 100) return t('title1')

    return t('npc')
  }

  private updatePlayerTitle() {
    this.playerInfoUI.setTitle(this.getPlayerTitle())
  }

  private updateRebirthUI() {
    const rebirths = this.auraSystem.getRebirths()

    this.rebirthUI.update(
      rebirths,
      this.auraSystem.getRebirthMultiplier(),
      this.auraSystem.getRebirthMultiplier(rebirths + 1),
      this.auraSystem.getRebirthRequirement(),
      this.auraSystem.getAura(),
      this.rebirthConfirming,
    )
  }

  private updateMovementUI() {
    const current = this.movementSystem.getCurrentMovement()

    this.movementInfoUI.setMovement(
      getMovementName(current.id, current.name),
      current.aura,
      current.color,
    )

    this.movementShopUI.update({
      isUnlocked: (id) => this.movementSystem.isUnlocked(id),
      isEquipped: (id) => current.id === id,
      canAfford: (cost) => this.auraSystem.getAura() >= cost,
    })
  }

  private updateAllUI() {
    this.headerUI.setAura(this.auraSystem.getAura())

    this.updatePlayerTitle()
    this.updateRebirthUI()
    this.updateMovementUI()
  }

  // =========================================================
  // POPUPS
  // =========================================================

  private popupOrigin() {
    return {
      x: this.player.x + Phaser.Math.Between(-30, 30),
      y: this.player.y - 110 * this.player.scaleY,
    }
  }

  private showAuraPopup(amount: number) {
    const { x, y } = this.popupOrigin()

    const popup = this.add.text(
      x,
      y,
      `+${formatNumber(amount)}`,
      textStyle(24, '#ffffff', { stroke: '#000000', strokeThickness: 5 }),
    )

    popup.setOrigin(0.5)
    popup.setDepth(150)
    popup.setTint(this.fxColor)

    this.tweens.add({
      targets: popup,
      y: popup.y - 60,
      alpha: 0,
      duration: 700,
      onComplete: () => popup.destroy(),
    })
  }

  private showCriticalPopup(amount: number) {
    const { x, y } = this.popupOrigin()

    const popup = this.add.text(
      x,
      y,
      `${t('critical')}\n+${formatNumber(amount)}`,
      textStyle(28, COLORS.yellow, {
        align: 'center',
        stroke: '#5a3b00',
        strokeThickness: 6,
      }),
    )

    popup.setOrigin(0.5)
    popup.setDepth(151)
    popup.setScale(0.6)

    this.tweens.add({
      targets: popup,
      scale: 1.2,
      duration: 150,
      ease: 'Back.easeOut',
    })

    this.tweens.add({
      targets: popup,
      y: popup.y - 70,
      alpha: 0,
      duration: 1200,
      delay: 150,
      ease: 'Sine.easeOut',
      onComplete: () => popup.destroy(),
    })
  }

  private showMessage(message: string) {
    const popup = this.add.text(
      this.player.x,
      this.player.y - 150 * this.player.scaleY,
      message,
      textStyle(16, COLORS.white, {
        backgroundColor: '#17171f',
        padding: { left: 12, right: 12, top: 7, bottom: 7 },
      }),
    )

    popup.setOrigin(0.5)
    popup.setDepth(200)

    this.tweens.add({
      targets: popup,
      alpha: 0,
      y: popup.y - 25,
      duration: 900,
      delay: 350,
      onComplete: () => popup.destroy(),
    })
  }

  // =========================================================
  // LAYOUT
  // =========================================================

  private isMobilePortrait(): boolean {
    return this.scale.width < 700 && this.scale.height > this.scale.width
  }

  private isMobileLandscape(): boolean {
    return this.scale.width < 900 && this.scale.width >= this.scale.height
  }

  private handleResize() {
    const width = this.scale.width
    const height = this.scale.height

    if (width <= 0 || height <= 0) {
      return
    }

    this.bg.setDisplaySize(width, height)

    if (width !== this.ambientW || height !== this.ambientH) {
      this.createAmbient(width, height)
    }

    if (this.isMobilePortrait()) {
      this.applyLayout(this.portraitLayout(width, height))
    } else if (this.isMobileLandscape()) {
      this.applyLayout(this.landscapeLayout(width, height))
    } else {
      this.applyLayout(this.desktopLayout(width, height))
    }

    this.movementShopUI.updateLayout()

    this.adCountdownText.setPosition(width / 2, height * 0.28)
    this.adCountdownText.setFontSize(width < 500 ? 18 : 24)

    this.rebirthPopup.layout()
  }

  private desktopLayout(width: number, height: number): LayoutConfig {
    const gameLeft = width * 0.035
    const gameTop = 85
    const gameBottom = height - 35
    const gameHeight = gameBottom - gameTop

    return {
      gameLeft,
      gameTop,
      gameWidth: width * 0.68 - gameLeft,
      gameHeight,
      playerYRatio: 0.52,
      scale: Phaser.Math.Clamp(gameHeight / 600, 0.7, 1.15),
      headerY: 35,
      headerSize: 32,
      titleY: gameTop + 35,
      titleSize: 24,
      comboY: gameTop + 62,
      comboSize: 17,
      upgradeY: gameBottom - 72,
      upgradeScale: 1,
      info: { nameY: gameBottom - 28, auraY: gameBottom - 6, nameSize: 19, auraSize: 13 },
      buttonFont: 12,
      compact: false,
    }
  }

  private landscapeLayout(width: number, height: number): LayoutConfig {
    const gameLeft = width * 0.025
    const gameTop = 48
    const gameBottom = height - 12
    const gameHeight = gameBottom - gameTop

    return {
      gameLeft,
      gameTop,
      gameWidth: width * 0.68 - gameLeft,
      gameHeight,
      playerYRatio: 0.52,
      scale: Phaser.Math.Clamp(gameHeight / 400, 0.5, 0.8),
      headerY: 24,
      headerSize: 26,
      titleY: gameTop + 20,
      titleSize: 18,
      comboY: gameTop + 42,
      comboSize: 14,
      upgradeY: gameBottom - 32,
      upgradeScale: 0.82,
      info: null,
      buttonFont: 11,
      compact: true,
    }
  }

  private portraitLayout(width: number, height: number): LayoutConfig {
    const gameTop = 55
    const gameHeight = Math.min(height * 0.38, 330)
    const infoY = gameTop + gameHeight + 22

    return {
      gameLeft: 10,
      gameTop,
      gameWidth: width - 20,
      gameHeight,
      playerYRatio: 0.56,
      scale: Phaser.Math.Clamp(gameHeight / 480, 0.5, 0.75),
      headerY: 27,
      headerSize: 26,
      titleY: gameTop + 18,
      titleSize: 18,
      comboY: gameTop + 40,
      comboSize: 14,
      upgradeY: infoY + 55,
      upgradeScale: 0.78,
      info: { nameY: infoY, auraY: infoY + 22, nameSize: 18, auraSize: 13 },
      buttonFont: 11,
      compact: true,
    }
  }

  private applyLayout(cfg: LayoutConfig) {
    const width = this.scale.width

    this.drawStage(cfg.gameLeft, cfg.gameTop, cfg.gameWidth, cfg.gameHeight)

    this.data.set('gameAreaBounds', { y: cfg.gameTop, height: cfg.gameHeight })

    const playerX = cfg.gameLeft + cfg.gameWidth / 2
    const playerY = cfg.gameTop + cfg.gameHeight * cfg.playerYRatio

    this.player.setPosition(playerX, playerY)
    this.player.setScale(cfg.scale)

    this.floorGlow.setPosition(playerX, playerY + 98 * cfg.scale)
    this.floorGlow.setScale(cfg.scale * 1.7, cfg.scale * 0.45)

    this.headerUI.setPosition(width / 2, cfg.headerY)
    this.headerUI.setFontSize(cfg.headerSize)

    this.playerInfoUI.setPosition(playerX, cfg.titleY, cfg.comboY)
    this.playerInfoUI.setTitleFontSize(cfg.titleSize)
    this.playerInfoUI.setComboFontSize(cfg.comboSize)

    this.rebirthUI.setPosition(playerX, cfg.upgradeY)
    this.rebirthUI.setScale(cfg.upgradeScale)

    if (cfg.info) {
      this.movementInfoUI.setPosition(playerX, cfg.info.nameY, cfg.info.auraY)
      this.movementInfoUI.setNameFontSize(cfg.info.nameSize)
      this.movementInfoUI.setAuraFontSize(cfg.info.auraSize)
      this.movementInfoUI.setVisible(true)
    } else {
      this.movementInfoUI.setVisible(false)
    }

    if (this.compactUI !== cfg.compact) {
      this.compactUI = cfg.compact
      this.refreshMuteButton()
      this.refreshBoostButton()
      this.lastBoostLabel = ''
    }

    this.muteButton.setPosition(cfg.gameLeft + 10, cfg.gameTop + 10)
    this.muteButton.setFontSize(cfg.buttonFont)

    this.boostButton.setPosition(cfg.gameLeft + cfg.gameWidth - 10, cfg.gameTop + 10)
    this.boostButton.setFontSize(cfg.buttonFont)

    this.layoutCrowd(cfg.gameLeft, cfg.gameTop, cfg.gameWidth, cfg.gameHeight, cfg.scale * 0.95)
  }

  private drawStage(x: number, y: number, width: number, height: number) {
    this.stage.clear()

    this.stage.fillStyle(0x14141d, 0.78)
    this.stage.fillRoundedRect(x, y, width, height, 18)

    this.stage.lineStyle(2, 0x2c2c3b, 1)
    this.stage.strokeRoundedRect(x, y, width, height, 18)
  }

  // =========================================================
  // PLATFORM LIFECYCLE
  // =========================================================

  private startGameplay() {
    if (!this.gameplayActive) {
      this.gameplayActive = true
      platform.gameplayStart()
    }

    this.idleTimer?.remove()
    this.idleTimer = this.time.delayedCall(10_000, () => this.stopGameplay())
  }

  private stopGameplay() {
    if (this.gameplayActive) {
      this.gameplayActive = false
      platform.gameplayStop()
    }
  }

  private onHidden() {
    this.stopGameplay()
    this.flushSave()
  }

  // =========================================================
  // SAVE / LOAD
  // =========================================================

  /** Сохраняем не чаще раза в секунду, а не на каждый клик. */
  private scheduleSave() {
    if (this.saveTimer) {
      return
    }

    this.saveTimer = this.time.delayedCall(1000, () => {
      this.saveTimer = undefined
      this.saveGame()
    })
  }

  private flushSave() {
    this.saveTimer?.remove()
    this.saveTimer = undefined
    this.saveGame(true)
  }

  private saveGame(flush = false) {
    this.saveSystem.save({
      aura: this.auraSystem.getAura(),
      unlockedMovements: this.movementSystem.getUnlockedMovements(),
      currentMovementId: this.movementSystem.getCurrentMovement().id,
      rebirths: this.auraSystem.getRebirths(),
      muted: this.audio.isUserMuted(),
    }, flush)
  }

  private loadGame() {
    const data = this.saveSystem.load()

    if (!data) {
      return
    }

    this.auraSystem.setAura(data.aura ?? 0)
    this.auraSystem.setRebirths(data.rebirths ?? 0)
    this.movementSystem.setUnlockedMovements(data.unlockedMovements ?? ['stare'])
    this.audio.setUserMuted(data.muted ?? false)

    const saved = MOVEMENTS.find((m) => m.id === data.currentMovementId)

    if (saved && this.movementSystem.isUnlocked(saved.id)) {
      this.movementSystem.setCurrentMovement(saved)
    }
  }

  // =========================================================
  // UPDATE / SHUTDOWN
  // =========================================================

  update() {
    if (this.boostEndsAt === 0) {
      return
    }

    const left = this.boostEndsAt - Date.now()

    if (left <= 0) {
      this.boostEndsAt = 0
      this.auraSystem.setBoostMultiplier(1)
      this.refreshBoostButton()

      return
    }

    const time = formatTime(left)
    const label = this.compactUI ? `×2 ${time}` : t('boostActive', { time })

    // Текст перерисовываем только когда меняется секунда.
    if (label !== this.lastBoostLabel) {
      this.lastBoostLabel = label
      this.boostButton.setText(label)
    }
  }

  private shutdown() {
    this.flushSave()
    this.stopGameplay()

    this.scale.off('resize', this.handleResize, this)
    this.game.events.off('hidden', this.onHidden, this)
    this.game.events.off('blur', this.onHidden, this)

    platform.setPauseHandlers()
    this.adSystem?.destroy()

    this.comboSystem?.destroy()
    this.movementShopUI?.destroy()
  }
}
