// Поза персонажа. Все анимации — это последовательности ключевых поз.
// Углы в градусах. Левая рука: + уводит руку наружу/вверх. Правая: - наружу/вверх.
export type Pose = {
  x: number
  y: number
  angle: number
  sx: number
  sy: number
  la: number // left arm
  ra: number // right arm
  ll: number // left leg
  rl: number // right leg
  hx: number // head offset
  hy: number
  ha: number // head angle
  alpha: number
  glow: number // сила ауры вокруг игрока 0..1
}

export const REST_POSE: Pose = {
  x: 0, y: 0, angle: 0, sx: 1, sy: 1,
  la: 4, ra: -4, ll: 0, rl: 0,
  hx: 0, hy: 0, ha: 0,
  alpha: 1, glow: 0.25,
}

export type Keyframe = {
  d: number // длительность, мс
  to: Partial<Pose> // пустой объект = пауза
  ease?: string
}

const f = (d: number, to: Partial<Pose>, ease = 'Sine.easeInOut'): Keyframe => ({ d, to, ease })
const rest = (d = 130): Keyframe => f(d, { ...REST_POSE }, 'Back.easeOut')
const hold = (d: number): Keyframe => ({ d, to: {} })

export const ANIMATIONS = {
  stare: [f(80, { sx: 1.05, sy: 1.05, hy: -2, glow: 0.6 }, 'Sine.easeOut'), rest(140)],

  sixSeven: [
    f(90, { ra: -110, la: 10, sx: 1.04, sy: 0.96, angle: -4, glow: 0.6 }),
    f(90, { la: 110, ra: -10, angle: 4 }),
    f(90, { ra: -110, la: 10, angle: -4 }),
    rest(110),
  ],

  deb: [
    f(130, { angle: -10, la: 80, ra: -70, hx: -10, hy: -6, ha: -12, sx: 1.04, sy: 0.96, glow: 0.7 }, 'Quad.easeOut'),
    hold(250),
    rest(160),
  ],

  sigma: [
    f(150, { angle: 12, x: 10, ha: -8, hy: 3, la: 20, ra: -25, glow: 0.7 }),
    hold(220),
    rest(160),
  ],

  robot: [
    f(90, { la: 90, ra: -10, hx: -4 }, 'Linear'),
    f(90, { la: 90, ra: -90, hx: 0 }, 'Linear'),
    f(90, { la: 0, ra: -90, ha: -10 }, 'Linear'),
    f(90, { la: 60, ra: -60, ha: 10, hy: -2, glow: 0.7 }, 'Linear'),
    rest(120),
  ],

  floss: [
    f(80, { x: 14, la: 50, ra: 50, angle: -4, glow: 0.6 }),
    f(80, { x: -14, la: -50, ra: -50, angle: 4 }),
    f(80, { x: 14, la: 50, ra: 50, angle: -4 }),
    f(80, { x: -14, la: -50, ra: -50, angle: 4 }),
    rest(120),
  ],

  moonwalk: [
    f(120, { x: -14, ll: 28, rl: -14, la: 25, ra: -25, glow: 0.6 }),
    f(120, { x: -26, ll: -14, rl: 28, sy: 0.97 }),
    f(120, { x: -14, ll: 28, rl: -14, sy: 1 }),
    rest(150),
  ],

  tpose: [
    f(90, { la: 90, ra: -90, sx: 1.03, sy: 1.03, glow: 0.85 }, 'Quad.easeOut'),
    hold(260),
    rest(140),
  ],

  dab: [
    f(110, { ra: -150, la: 55, ha: 18, hx: 8, hy: 5, angle: 6, glow: 0.8 }, 'Quad.easeOut'),
    hold(240),
    rest(150),
  ],

  griddy: [
    f(70, { ll: 22, rl: -22, la: 35, ra: -35, y: -10, x: -8, glow: 0.7 }),
    f(70, { ll: -22, rl: 22, x: 8, y: 0 }),
    f(70, { ll: 22, rl: -22, x: -8, y: -10 }),
    f(70, { ll: -22, rl: 22, x: 8, y: 0 }),
    rest(120),
  ],

  shuffle: [
    f(80, { x: -16, ll: 18, rl: -10, la: -30, ra: -60, glow: 0.7 }),
    f(80, { x: 16, ll: -10, rl: 18, la: 60, ra: 30 }),
    f(80, { x: -16, ll: 18, rl: -10, la: -30, ra: -60 }),
    f(80, { x: 16, ll: -10, rl: 18, la: 60, ra: 30 }),
    rest(120),
  ],

  wave: [
    f(100, { la: 150, ha: -6, glow: 0.7 }),
    f(100, { la: 115 }),
    f(100, { la: 150 }),
    f(100, { la: 115 }),
    f(100, { la: 4, ra: -150, ha: 6 }),
    f(100, { ra: -115 }),
    rest(140),
  ],

  headbang: [
    f(70, { hy: 10, ha: 30, sy: 0.97, la: 130, ra: -130, glow: 0.8 }),
    f(70, { hy: -4, ha: -25, sy: 1.02 }),
    f(70, { hy: 10, ha: 30, sy: 0.97 }),
    f(70, { hy: -4, ha: -25, sy: 1.02 }),
    rest(130),
  ],

  spin: [
    f(110, { sx: 0.05, y: -15, glow: 0.8 }),
    f(110, { sx: -1, y: -25 }),
    f(110, { sx: 0.05, y: -15 }),
    f(110, { sx: 1, y: 0 }),
    rest(100),
  ],

  jump: [
    f(100, { sy: 0.88, sx: 1.08, ll: -10, rl: 10 }),
    f(220, { y: -70, sy: 1.06, sx: 0.96, la: 150, ra: -150, ll: 15, rl: -15, glow: 0.9 }, 'Quad.easeOut'),
    f(200, { y: 0, sy: 0.9, sx: 1.08, ll: -5, rl: 5 }, 'Quad.easeIn'),
    rest(140),
  ],

  backflip: [
    f(120, { sy: 0.88, sx: 1.08 }),
    f(200, { y: -90, angle: -180, la: 90, ra: -90, ll: 25, rl: -25, sy: 1, sx: 1, glow: 0.9 }, 'Quad.easeOut'),
    f(200, { y: 0, angle: -360 }, 'Quad.easeIn'),
    rest(150),
  ],

  flex: [
    f(110, { la: 125, ra: -125, sx: 1.12, sy: 1.04, glow: 0.9 }, 'Back.easeOut'),
    f(90, { sx: 1.05 }),
    f(90, { sx: 1.14 }),
    rest(160),
  ],

  levitate: [
    f(300, { y: -45, la: 70, ra: -70, ll: 6, rl: -6, glow: 1 }, 'Sine.easeOut'),
    f(300, { y: -52 }),
    f(300, { y: -45 }),
    f(250, { ...REST_POSE }, 'Sine.easeIn'),
  ],

  glitch: [
    f(40, { x: -10, sx: 1.1, alpha: 0.5, glow: 0.8 }, 'Linear'),
    f(40, { x: 12, sx: 0.9, alpha: 1 }, 'Linear'),
    f(40, { x: -6, y: -5, alpha: 0.4 }, 'Linear'),
    f(40, { x: 8, sx: 1.15, alpha: 1 }, 'Linear'),
    f(40, { x: 0, sx: 0.85, alpha: 0.6 }, 'Linear'),
    rest(60),
  ],

  gigachad: [
    f(140, { sx: 1.2, sy: 1.12, la: 35, ra: -35, hy: -4, glow: 1 }, 'Back.easeOut'),
    hold(280),
    rest(200),
  ],
} satisfies Record<string, Keyframe[]>

export type AnimationId = keyof typeof ANIMATIONS

// Короткая реакция толпы
export const CROWD_CHEER: Keyframe[] = [
  f(100, { la: 150, ra: -150, y: -14, ll: 6, rl: -6 }, 'Sine.easeOut'),
  rest(140),
]
