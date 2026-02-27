export type Language = 'en' | 'ru'

export const DEFAULT_LANGUAGE: Language = 'en'

export const LANGUAGE_OPTIONS: Array<{ value: Language; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Russian' }
]

export const EVENT_TYPES = [
  { value: 'birthday', emoji: '🎂', labels: { en: 'Birthday', ru: 'День рождения' } },
  { value: 'new-year', emoji: '🎄', labels: { en: 'New Year', ru: 'Новый год' } },
  { value: 'christmas', emoji: '🎅', labels: { en: 'Christmas', ru: 'Рождество' } },
  { value: 'wedding', emoji: '💍', labels: { en: 'Wedding', ru: 'Свадьба' } },
  { value: 'anniversary', emoji: '💑', labels: { en: 'Anniversary', ru: 'Годовщина' } },
  { value: 'valentines', emoji: '💝', labels: { en: "Valentine's Day", ru: 'День Святого Валентина' } },
  { value: 'womens-day', emoji: '🌸', labels: { en: "Women's Day", ru: '8 Марта' } },
  { value: 'mens-day', emoji: '🎖️', labels: { en: "Men's Day", ru: '23 Февраля' } },
  { value: 'graduation', emoji: '🎓', labels: { en: 'Graduation', ru: 'Выпускной' } },
  { value: 'baby-shower', emoji: '🍼', labels: { en: 'Baby Shower', ru: 'Рождение ребенка' } },
  { value: 'other', emoji: '✨', labels: { en: 'Other', ru: 'Другое' } }
]

export const EVENT_TYPE_KEYS = new Set(EVENT_TYPES.map((type) => type.value))

const normalizeEventLabel = (label: string) =>
  label.replace(/^[^\s]+\s/, '').trim().toLowerCase()

export const getEventLabelByValue = (value: string, language: Language) => {
  const found = EVENT_TYPES.find((type) => type.value === value)
  return found ? found.labels[language] : ''
}

export const getEventOptionLabel = (value: string, language: Language) => {
  const found = EVENT_TYPES.find((type) => type.value === value)
  if (!found) return value
  return `${found.emoji} ${found.labels[language]}`
}

export const getEventKeyFromLabel = (label: string) => {
  const normalized = normalizeEventLabel(label)
  if (!normalized) return null

  for (const type of EVENT_TYPES) {
    const en = normalizeEventLabel(type.labels.en)
    const ru = normalizeEventLabel(type.labels.ru)
    if (normalized === en || normalized === ru) {
      return type.value
    }
  }

  return null
}
