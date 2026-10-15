import Phaser from 'phaser'
import { REST_POSE, type Keyframe, type Pose } from '../data/animations'

export type CharacterStyle = {
  outfit: number
  pants: number
  skin: number
  hair: number
  shoes: number
  size?: number
  sunglasses?: boolean
}

const shade = (color: number, amount: number): number => {
  const c = Phaser.Display.Color.ValueToColor(color)

  return amount >= 0 ? c.lighten(amount).color : c.darken(-amount).color
}

/**
 * Векторный персонаж, нарисованный через Graphics.
 * Каждая конечность — контейнер с точкой вращения в суставе,
 * поэтому анимации выглядят как у настоящей "куклы".
 */
export class Character extends Phaser.GameObjects.Container {
  protected readonly pose: Pose = { ...REST_POSE }

  protected readonly bob: Phaser.GameObjects.Container
  protected readonly rig: Phaser.GameObjects.Container

  private readonly shadow: Phaser.GameObjects.Ellipse
  private readonly head: Phaser.GameObjects.Container
  private readonly leftArm: Phaser.GameObjects.Container
  private readonly rightArm: Phaser.GameObjects.Container
  private readonly leftLeg: Phaser.GameObjects.Container
  private readonly rightLeg: Phaser.GameObjects.Container

  private holdTimer?: Phaser.Time.TimerEvent

  constructor(scene: Phaser.Scene, x: number, y: number, style: CharacterStyle) {
    super(scene, x, y)

    scene.add.existing(this)

    const size = style.size ?? 1

    this.shadow = scene.add.ellipse(0, 98 * size, 92 * size, 16 * size, 0x000000, 0.35)

    this.bob = scene.add.container(0, 0)
    this.bob.setScale(size)

    this.rig = scene.add.container(0, 0)

    this.leftLeg = this.buildLeg(-15, style)
    this.rightLeg = this.buildLeg(15, style)

    const torso = this.buildTorso(style)

    this.leftArm = this.buildArm(-34, style)
    this.rightArm = this.buildArm(34, style)

    this.head = this.buildHead(style)

    this.rig.add([this.leftLeg, this.rightLeg, torso, this.leftArm, this.rightArm, this.head])
    this.bob.add(this.rig)

    this.add([this.shadow, this.bob])

    // Idle: лёгкое "дыхание"
    scene.tweens.add({
      targets: this.bob,
      y: 3,
      scaleY: size * 1.012,
      duration: 900 + Math.random() * 300,
      delay: Math.random() * 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    this.applyPose(this.pose)
  }

  // =========================================================
  // BUILD
  // =========================================================

  private buildLeg(x: number, style: CharacterStyle) {
    const c = this.scene.add.container(x, 36)
    const g = this.scene.add.graphics()

    g.fillStyle(style.pants)
    g.fillRoundedRect(-9, 0, 18, 52, 5)

    g.fillStyle(shade(style.pants, -15))
    g.fillRoundedRect(2, 0, 7, 52, 4)

    g.fillStyle(style.shoes)
    g.fillRoundedRect(-11, 47, 24, 11, 5)

    g.fillStyle(0x222233)
    g.fillRect(-11, 56, 24, 3)

    c.add(g)

    return c
  }

  private buildTorso(style: CharacterStyle) {
    const g = this.scene.add.graphics()

    g.fillStyle(style.outfit)
    g.fillRoundedRect(-29, -32, 58, 76, 16)

    g.fillStyle(shade(style.outfit, -14))
    g.fillRoundedRect(8, -32, 21, 76, { tl: 0, tr: 16, bl: 0, br: 16 })

    g.fillStyle(shade(style.outfit, -22))
    g.fillRoundedRect(-29, 34, 58, 10, { tl: 0, tr: 0, bl: 12, br: 12 })

    g.fillStyle(shade(style.outfit, 35))
    g.fillRect(-7, -14, 3, 16)
    g.fillRect(4, -14, 3, 16)

    // шея
    g.fillStyle(shade(style.skin, -12))
    g.fillRect(-7, -40, 14, 12)

    return g
  }

  private buildArm(x: number, style: CharacterStyle) {
    const c = this.scene.add.container(x, -22)
    const g = this.scene.add.graphics()

    g.fillStyle(style.outfit)
    g.fillRoundedRect(-8, -7, 16, 38, 8)

    g.fillStyle(shade(style.outfit, -18))
    g.fillRoundedRect(-8, 24, 16, 8, 4)

    g.fillStyle(style.skin)
    g.fillCircle(0, 39, 8)

    c.add(g)

    return c
  }

  private buildHead(style: CharacterStyle) {
    const c = this.scene.add.container(0, -64)
    const g = this.scene.add.graphics()

    // уши
    g.fillStyle(shade(style.skin, -10))
    g.fillCircle(-26, 3, 6)
    g.fillCircle(26, 3, 6)

    // лицо
    g.fillStyle(style.skin)
    g.fillCircle(0, 0, 27)

    // волосы
    g.fillStyle(style.hair)
    g.slice(0, 0, 29, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), false)
    g.fillPath()
    g.fillRoundedRect(-28, -14, 56, 9, 4)

    // румянец
    g.fillStyle(0xff8a8a, 0.25)
    g.fillCircle(-15, 9, 5)
    g.fillCircle(15, 9, 5)

    if (style.sunglasses) {
      g.fillStyle(0x0b0b10)
      g.fillRoundedRect(-23, -5, 46, 14, 6)

      g.fillStyle(0xffffff, 0.28)
      g.fillRect(-18, -3, 9, 3)
      g.fillRect(4, -3, 9, 3)

      g.lineStyle(2.5, 0x7a3b2e)
      g.lineBetween(-7, 17, 8, 14)
    } else {
      g.fillStyle(0xffffff)
      g.fillEllipse(-10, 2, 10, 12)
      g.fillEllipse(10, 2, 10, 12)

      g.fillStyle(0x111111)
      g.fillCircle(-9, 3, 3)
      g.fillCircle(11, 3, 3)

      g.lineStyle(2.5, 0x7a3b2e)
      g.beginPath()
      g.arc(0, 11, 8, Phaser.Math.DegToRad(25), Phaser.Math.DegToRad(155), false)
      g.strokePath()
    }

    c.add(g)

    return c
  }

  // =========================================================
  // POSE
  // =========================================================

  protected applyPose(p: Pose) {
    this.rig.setPosition(p.x, p.y)
    this.rig.setAngle(p.angle)
    this.rig.setScale(p.sx, p.sy)
    this.rig.setAlpha(p.alpha)

    this.leftArm.setAngle(p.la)
    this.rightArm.setAngle(p.ra)
    this.leftLeg.setAngle(p.ll)
    this.rightLeg.setAngle(p.rl)

    this.head.setPosition(p.hx, -64 + p.hy)
    this.head.setAngle(p.ha)

    const lift = Math.max(0, -p.y)

    this.shadow.setScale(1 - Math.min(0.45, lift / 220))
    this.shadow.setAlpha(1 - Math.min(0.6, lift / 200))

    this.onPoseApplied(p)
  }

  protected onPoseApplied(_pose: Pose) {
    // переопределяется в наследниках
  }

  stopPose() {
    this.scene.tweens.killTweensOf(this.pose)
    this.holdTimer?.remove()
    this.holdTimer = undefined
  }

  playKeyframes(frames: Keyframe[]) {
    this.stopPose()

    let index = 0

    const next = () => {
      if (index >= frames.length) {
        return
      }

      const frame = frames[index]

      index += 1

      if (Math.abs(this.pose.angle) >= 360) {
        this.pose.angle %= 360
      }

      if (Object.keys(frame.to).length === 0) {
        this.holdTimer = this.scene.time.delayedCall(frame.d, next)

        return
      }

      this.scene.tweens.add({
        targets: this.pose,
        props: frame.to,
        duration: frame.d,
        ease: frame.ease ?? 'Sine.easeInOut',
        onUpdate: () => this.applyPose(this.pose),
        onComplete: next,
      })
    }

    next()
  }
}
