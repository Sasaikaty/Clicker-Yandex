import Phaser from 'phaser'
import { ANIMATIONS, type AnimationId, type Pose } from '../data/animations'
import { COLORS } from '../config/theme'
import { Character } from './Character'

export class Player extends Character {
  private readonly glow: Phaser.GameObjects.Image

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, {
      outfit: COLORS.player,
      pants: 0x1d1d2b,
      skin: 0xffd0a0,
      hair: 0x2b1b12,
      shoes: 0xffffff,
      sunglasses: true,
    })

    this.glow = scene.add.image(0, 10, 'glow')
    this.glow.setBlendMode(Phaser.BlendModes.ADD)

    this.addAt(this.glow, 0)

    this.onPoseApplied(this.pose)
  }

  setAuraColor(color: number) {
    this.glow.setTint(color)
  }

  playMovement(id: AnimationId) {
    this.playKeyframes(ANIMATIONS[id])
  }

  protected override onPoseApplied(p: Pose) {
    if (!this.glow) {
      return
    }

    this.glow.setAlpha(0.15 + 0.55 * p.glow)
    this.glow.setScale(1.1 + 0.6 * p.glow)
  }
}
