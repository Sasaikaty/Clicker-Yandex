export type Lang = 'ru' | 'en'

const en = {
  gameTitle: 'Aura Farming Simulator',
  aura: 'AURA',
  plusAura: '+{n} AURA',
  npc: 'NPC',
  title1: 'AURA FARMER',
  title2: 'AURA GRINDER',
  title3: 'AURA MASTER',
  title4: 'THE ONE',
  title5: 'SIGMA',
  title6: 'LEGEND',
  title7: 'GIGACHAD',
  movements: 'MOVEMENTS',
  equipped: 'EQUIPPED',
  owned: 'OWNED',
  need: 'NEED {n} AURA',
  unlocked: '{name} UNLOCKED',
  equippedMsg: '{name} EQUIPPED',
  rebirth: 'REBIRTH {n}  •  ×{m}',
  rebirthReady: 'REBIRTH NOW  →  ×{m}',
  rebirthProgress: '{a} / {r} AURA',
  rebirthConfirm: 'TAP AGAIN TO CONFIRM',
  rebirthConfirmSub: 'AURA & MOVEMENTS WILL RESET',
  rebirthNeed: 'NEED {n} AURA TO REBIRTH',
  rebirthDone: 'REBORN! ×{m} FOREVER',
  rebirthDoneKeep: 'REBORN! ×{m} • PROGRESS KEPT',
  popupTitle: 'REBIRTH READY!',
  popupBody: 'NEW MULTIPLIER: ×{m}',
  popupHint: 'Watch an ad to be reborn and keep all your aura and movements.',
  popupAd: 'WATCH AD: REBIRTH WITHOUT RESET',
  popupReset: 'REBIRTH & RESET PROGRESS',
  popupClose: 'NOT NOW',
  combo: 'COMBO ×{n}',
  critical: 'CRITICAL!',
  soundOn: 'SOUND: ON',
  soundOff: 'SOUND: OFF',
  soundOnShort: 'SND ON',
  soundOffShort: 'SND OFF',
  boostAd: 'WATCH AD: ×2 AURA',
  boostAdShort: 'AD ×2',
  boostActive: '×2 AURA {time}',
  boostStarted: '×2 AURA FOR 2 MIN!',
  adCountdown: 'AD IN {n}...',
  adUnavailable: 'AD IS NOT AVAILABLE',
}

type Dict = typeof en

const ru: Dict = {
  gameTitle: 'Аура-фарм симулятор',
  aura: 'АУРА',
  plusAura: '+{n} АУРЫ',
  npc: 'НПС',
  title1: 'ФЕРМЕР АУРЫ',
  title2: 'ГРИНДЕР АУРЫ',
  title3: 'МАСТЕР АУРЫ',
  title4: 'ИЗБРАННЫЙ',
  title5: 'СИГМА',
  title6: 'ЛЕГЕНДА',
  title7: 'ГИГАЧАД',
  movements: 'ДВИЖЕНИЯ',
  equipped: 'ВЫБРАНО',
  owned: 'КУПЛЕНО',
  need: 'НУЖНО {n} АУРЫ',
  unlocked: '{name}: ОТКРЫТО',
  equippedMsg: '{name}: ВЫБРАНО',
  rebirth: 'ПЕРЕРОЖДЕНИЕ {n}  •  ×{m}',
  rebirthReady: 'ПЕРЕРОДИТЬСЯ  →  ×{m}',
  rebirthProgress: '{a} / {r} АУРЫ',
  rebirthConfirm: 'НАЖМИ ЕЩЁ РАЗ ДЛЯ ПОДТВЕРЖДЕНИЯ',
  rebirthConfirmSub: 'АУРА И ДВИЖЕНИЯ СБРОСЯТСЯ',
  rebirthNeed: 'НУЖНО {n} АУРЫ ДЛЯ ПЕРЕРОЖДЕНИЯ',
  rebirthDone: 'ПЕРЕРОЖДЕНИЕ! ×{m} НАВСЕГДА',
  rebirthDoneKeep: 'ПЕРЕРОЖДЕНИЕ! ×{m} • ПРОГРЕСС СОХРАНЁН',
  popupTitle: 'ПЕРЕРОЖДЕНИЕ ГОТОВО!',
  popupBody: 'НОВЫЙ МНОЖИТЕЛЬ: ×{m}',
  popupHint: 'Посмотри рекламу, чтобы переродиться и сохранить всю ауру и все движения.',
  popupAd: 'РЕКЛАМА: ПЕРЕРОДИТЬСЯ БЕЗ СБРОСА',
  popupReset: 'ПЕРЕРОДИТЬСЯ И СБРОСИТЬ ПРОГРЕСС',
  popupClose: 'ПОКА НЕ НАДО',
  combo: 'КОМБО ×{n}',
  critical: 'КРИТ!',
  soundOn: 'ЗВУК: ВКЛ',
  soundOff: 'ЗВУК: ВЫКЛ',
  soundOnShort: 'ЗВУК ВКЛ',
  soundOffShort: 'ЗВУК ВЫКЛ',
  boostAd: 'РЕКЛАМА: ×2 АУРА',
  boostAdShort: 'ВИДЕО ×2',
  boostActive: '×2 АУРА {time}',
  boostStarted: '×2 АУРА НА 2 МИН!',
  adCountdown: 'РЕКЛАМА ЧЕРЕЗ {n}...',
  adUnavailable: 'РЕКЛАМА НЕДОСТУПНА',
}

const MOVEMENT_NAMES_RU: Record<string, string> = {
  stare: 'ВЗГЛЯД НПС',
  '67': '67',
  deb: 'ДЕБ',
  sigma: 'СИГМА-НАКЛОН',
  robot: 'РОБОТ',
  floss: 'ФЛОСС',
  moonwalk: 'ЛУННАЯ ПОХОДКА',
  tpose: 'Т-ПОЗА',
  dab: 'ДЭБ',
  griddy: 'ГРИДДИ',
  shuffle: 'ШАФФЛ',
  wave: 'ВОЛНА',
  headbang: 'ХЭДБЭНГ',
  spin: 'ТОРНАДО',
  jump: 'МЕГАПРЫЖОК',
  backflip: 'БЭКФЛИП',
  flex: 'ФЛЕКС',
  levitate: 'ЛЕВИТАЦИЯ',
  glitch: 'ГЛИТЧ',
  gigachad: 'ГИГАЧАД',
}

const RU_FAMILY = ['ru', 'be', 'kk', 'uk', 'uz', 'hy', 'az', 'tg', 'ky', 'tk']

let lang: Lang = 'en'
let current: Dict = en

export function setLanguage(code?: string | null) {
  const raw = code ?? navigator.languages?.[0] ?? navigator.language ?? 'en'
  const short = raw.toLowerCase().slice(0, 2)

  lang = RU_FAMILY.includes(short) ? 'ru' : 'en'
  current = lang === 'ru' ? ru : en

  document.documentElement.lang = lang
  document.title = current.gameTitle
}

export function getLanguage(): Lang {
  return lang
}

export function t(key: keyof Dict, params: Record<string, string | number> = {}): string {
  return current[key].replace(/\{(\w+)\}/g, (_match, name: string) => String(params[name] ?? ''))
}

/** Локализованное название движения. Английское берётся из movements.ts. */
export function getMovementName(id: string, fallback: string): string {
  return lang === 'ru' ? (MOVEMENT_NAMES_RU[id] ?? fallback) : fallback
}
