import type { AnimationId } from './animations'

export type Movement = {
  id: string
  name: string
  cost: number
  aura: number
  color: number // цвет ауры / частиц
  animation: AnimationId
}

// ID первых трёх движений не менялись — старые сохранения совместимы.
export const MOVEMENTS: Movement[] = [
  // ------------------------------------------------------------------------------------------------;
  // 00:00 - 02:00 | Фаза захвата (Онбординг).
  // Игрок разгоняет комбо 30 -> 60 кликов. Доход растет с 1 до 3.3 за клик.
  // Покупки каждые 3-5 секунд.
  // ------------------------------------------------------------------------------------------------;
  { id: 'stare',    name: 'NPC STARE',    cost: 0,              aura: 1,         color: 0x8f8f9f, animation: 'stare' },
  { id: '67',       name: '67',           cost: 80,             aura: 6,         color: 0xff4444, animation: 'sixSeven' },
  { id: 'deb',      name: 'DEB',          cost: 450,            aura: 22,        color: 0xff8a3d, animation: 'deb' },

  // ------------------------------------------------------------------------------------------------;
  // 02:00 - 05:00 | Первая «Стена» (Hard Gate).
  // На комбо x3 игрок получает ~150-300 ауры/сек.
  // Покупка SIGMA и ROBOT требует от 20 до 45 секунд ЧИСТОГО кликанья на х3.
  // Идеальный момент для первой Rewarded Video (Автокликер / x2 Доход).
  // ------------------------------------------------------------------------------------------------;
  { id: 'sigma',    name: 'SIGMA LEAN',   cost: 3_200,          aura: 70,        color: 0xffd23d, animation: 'sigma' },
  { id: 'robot',    name: 'ROBOT',        cost: 14_000,         aura: 220,       color: 0xb8e03d, animation: 'robot' },

  // ------------------------------------------------------------------------------------------------;
  // 05:00 - 10:00 | Переход в Idle и Рулетка.
  // Достижение FLOSS и MOONWALK требует удержания х3 комбо в течение 1.5 - 2 минут без остановки.
  // Пальцы устают -> игрок смотрит рекламу за Автокликер или воспользуется Колесом Фортуны.
  // ------------------------------------------------------------------------------------------------;
  { id: 'floss',    name: 'FLOSS',        cost: 65_000,         aura: 650,       color: 0x55ff88, animation: 'floss' },
  { id: 'moonwalk', name: 'MOONWALK',     cost: 280_000,        aura: 2_100,     color: 0x3dffc4, animation: 'moonwalk' },

  // ------------------------------------------------------------------------------------------------;
  // 10:00 - 15:00 | Подводка к Престижу (Перерождению).
  // Цены вырастают до миллионов. Даже при х3 комбо (доход ~25_000/сек)
  // накопление на T-POSE и DAB занимает 3-5 минут кликанья.
  // ------------------------------------------------------------------------------------------------;
  { id: 'tpose',    name: 'T-POSE',       cost: 1_200_000,      aura: 7_500,     color: 0x3dd6ff, animation: 'tpose' },
  { id: 'dab',      name: 'DAB',          cost: 5_500_000,      aura: 25_000,    color: 0x3d8bff, animation: 'dab' },
  { id: 'griddy',   name: 'GRIDDY',       cost: 24_000_000,     aura: 85_000,    color: 0x6a5dff, animation: 'griddy' },

  // ------------------------------------------------------------------------------------------------;
  // 15:00 - 20:00+ | Второй цикл (После Сброса / Престижа) и Лейтгейм.
  // Контент рассчитан на игроков с перманентными множителями от перерождения и просмотра рекламы.
  // ------------------------------------------------------------------------------------------------;
  { id: 'shuffle',  name: 'SHUFFLE',      cost: 100_000_000,    aura: 280_000,   color: 0x9b5dff, animation: 'shuffle' },
  { id: 'wave',     name: 'THE WAVE',     cost: 450_000_000,    aura: 950_000,   color: 0xc85dff, animation: 'wave' },
  { id: 'headbang', name: 'HEADBANG',     cost: 1_800_000_000,  aura: 3_200_000, color: 0xff5de0, animation: 'headbang' },
  { id: 'spin',     name: 'TORNADO SPIN', cost: 7_500_000_000,  aura: 11_000_000,color: 0xff5d9b, animation: 'spin' },
  { id: 'jump',     name: 'MEGA JUMP',    cost: 30_000_000_000, aura: 38_000_000,color: 0xff5d5d, animation: 'jump' },
  { id: 'backflip', name: 'BACKFLIP',     cost: 120_000_000_000,aura: 130_000_000,color: 0xff7a3d, animation: 'backflip' },
  { id: 'flex',     name: 'FLEX',         cost: 500_000_000_000,aura: 450_000_000,color: 0xffb83d, animation: 'flex' },
  { id: 'levitate', name: 'LEVITATION',   cost: 2_000_000_000_000, aura: 1_500_000_000, color: 0xffe97a, animation: 'levitate' },
  { id: 'glitch',   name: 'GLITCH',       cost: 8_000_000_000_000, aura: 5_000_000_000, color: 0x7affd9, animation: 'glitch' },
  { id: 'gigachad', name: 'GIGACHAD',     cost: 35_000_000_000_000, aura: 18_000_000_000, color: 0xffd700, animation: 'gigachad' },
]
