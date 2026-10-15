import Phaser from 'phaser'
import { BootScene } from '../scenes/BootScene'
import { GameScene } from '../scenes/GameScene'

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#0d0d12',
  disableContextMenu: true,

  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
    min: { width: 320, height: 320 },
  },

  input: { activePointers: 3 },
  render: { antialias: true },

  scene: [BootScene, GameScene],
}
