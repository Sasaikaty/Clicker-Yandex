import { getLanguage } from '../config/i18n'

const SUFFIXES = {
  en: ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'],
  ru: ['', 'К', 'М', 'Млрд', 'Трлн', 'Квдр', 'Квнт'],
}

export function formatNumber(value: number): string {
  const lang = getLanguage()

  if (value < 10_000) {
    return Math.floor(value)
      .toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')
      .replace(/[\u00a0\u202f]/g, ' ')
  }

  const suffixes = SUFFIXES[lang]

  let v = value
  let i = 0

  while (v >= 1000 && i < suffixes.length - 1) {
    v /= 1000
    i += 1
  }

  const rounded = v >= 100 ? Math.round(v) : Math.round(v * 10) / 10

  return `${rounded}${suffixes[i]}`
}

export function formatTime(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60

  return `${m}:${s.toString().padStart(2, '0')}`
}
