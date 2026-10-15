import type Phaser from 'phaser'

export const FONT_FAMILY = "'Russo One', Arial, sans-serif"

export const COLORS = {
  background: 0x0d0d12,
  panel: 0x17171f,
  panelLight: 0x20202a,
  border: 0x343440,

  white: '#ffffff',
  muted: '#8f8f9f',
  red: '#ff4444',
  yellow: '#ffe14d',
  green: '#55ff88',

  player: 0xe63946,
}

const DPR = Math.min(2, window.devicePixelRatio || 1)

export function textStyle(
  size: number,
  color: string = COLORS.white,
  extra: Phaser.Types.GameObjects.Text.TextStyle = {},
): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: FONT_FAMILY,
    fontSize: `${size}px`,
    color,
    resolution: DPR,
    ...extra,
  }
}

export const toHex = (n: number): string => '#' + n.toString(16).padStart(6, '0')
