export type ThemeDecoration = {
  kind: 'blob' | 'emoji'
  x: string
  y: string
  size: number
  opacity?: number
  blur?: number
  rotate?: number
  color?: string
  gradient?: string
  emoji?: string
}

export type ThemeConfig = {
  key: string
  label?: string | null
  palette: {
    page_bg: string
    title_gradient: string
    card_bg: string
    border: string
    accent: string
  }
  decorations?: ThemeDecoration[]
  reserved_overlay?: {
    type: 'fireworks' | 'confetti' | 'sparkles'
    opacity?: number
    colors?: string[]
    icon?: string
  }
}

export const DEFAULT_THEME: ThemeConfig = {
  key: 'default',
  palette: {
    page_bg: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 45%, #fdf2f8 100%)',
    title_gradient: 'linear-gradient(90deg, #2563eb, #7c3aed)',
    card_bg: '#ffffff',
    border: '#dbeafe',
    accent: '#7c3aed'
  },
  decorations: []
}

export function resolveTheme(theme?: ThemeConfig | null): ThemeConfig {
  if (!theme) return DEFAULT_THEME

  return {
    key: theme.key || DEFAULT_THEME.key,
    label: theme.label ?? null,
    palette: {
      page_bg: theme.palette?.page_bg || DEFAULT_THEME.palette.page_bg,
      title_gradient: theme.palette?.title_gradient || DEFAULT_THEME.palette.title_gradient,
      card_bg: theme.palette?.card_bg || DEFAULT_THEME.palette.card_bg,
      border: theme.palette?.border || DEFAULT_THEME.palette.border,
      accent: theme.palette?.accent || DEFAULT_THEME.palette.accent
    },
    decorations: theme.decorations || [],
    reserved_overlay: theme.reserved_overlay
  }
}

export type OverlayStyle = {
  backgroundImage: string
  backgroundSize?: string
  backgroundPosition?: string
  opacity: number
}

export type PatternStyle = {
  backgroundImage: string
  backgroundSize?: string
  backgroundPosition?: string
  opacity: number
}

const normalizeHexColor = (color: string) => {
  const trimmed = color.trim()
  if (!trimmed.startsWith('#')) return trimmed
  if (trimmed.length === 4) {
    const r = trimmed[1]
    const g = trimmed[2]
    const b = trimmed[3]
    return `#${r}${r}${g}${g}${b}${b}`
  }
  return trimmed
}

const hexToRgba = (color: string, alpha: number) => {
  const normalized = normalizeHexColor(color)
  if (!normalized.startsWith('#') || normalized.length !== 7) return color
  const r = parseInt(normalized.slice(1, 3), 16)
  const g = parseInt(normalized.slice(3, 5), 16)
  const b = parseInt(normalized.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function getThemePatternStyle(theme: ThemeConfig): PatternStyle {
  const accent = hexToRgba(theme.palette.accent, 0.14)
  const border = hexToRgba(theme.palette.border, 0.12)

  return {
    backgroundImage:
      `linear-gradient(135deg, ${accent} 0 25%, transparent 25% 50%, ${accent} 50% 75%, transparent 75% 100%),` +
      `linear-gradient(45deg, ${border} 0 25%, transparent 25% 50%, ${border} 50% 75%, transparent 75% 100%)`,
    backgroundSize: '140px 140px, 160px 160px',
    backgroundPosition: '0 0, 20px 20px',
    opacity: 0.18
  }
}

export function getReservedOverlayStyle(theme: ThemeConfig): OverlayStyle | null {
  const overlay = theme.reserved_overlay
  if (!overlay) return null

  const opacity = typeof overlay.opacity === 'number' ? overlay.opacity : 0.28
  const fallbackColors = [theme.palette.accent, '#ffffff', '#fef3c7', '#bae6fd']
  const colors = (overlay.colors && overlay.colors.length > 0 ? overlay.colors : fallbackColors)
    .map(color => normalizeHexColor(color))

  switch (overlay.type) {
    case 'confetti':
      return {
        backgroundImage:
          `linear-gradient(135deg, ${hexToRgba(colors[0] || '#ec4899', 0.5)} 0 12%, transparent 13% 100%),` +
          `linear-gradient(45deg, ${hexToRgba(colors[1] || '#22c55e', 0.5)} 0 10%, transparent 11% 100%),` +
          `linear-gradient(90deg, ${hexToRgba(colors[2] || '#3b82f6', 0.45)} 0 8%, transparent 9% 100%)`,
        backgroundSize: '60px 60px, 70px 70px, 80px 80px',
        backgroundPosition: '0 0, 20px 10px, 10px 30px',
        opacity
      }
    case 'sparkles':
      return {
        backgroundImage:
          `radial-gradient(circle at 20% 30%, ${hexToRgba(colors[0] || '#ffffff', 0.85)} 0 2px, transparent 3px),` +
          `radial-gradient(circle at 80% 20%, ${hexToRgba(colors[1] || '#ffffff', 0.75)} 0 2px, transparent 3px),` +
          `radial-gradient(circle at 60% 70%, ${hexToRgba(colors[2] || '#ffffff', 0.65)} 0 2px, transparent 3px),` +
          `radial-gradient(circle at 30% 80%, ${hexToRgba(colors[3] || '#ffffff', 0.7)} 0 2px, transparent 3px)`,
        backgroundSize: '160px 160px, 140px 140px, 180px 180px, 200px 200px',
        backgroundPosition: '0 0, 40px 20px, 20px 60px, 60px 30px',
        opacity
      }
    case 'fireworks':
    default:
      return {
        backgroundImage:
          `radial-gradient(circle at 20% 30%, ${hexToRgba(colors[0] || '#ffffff', 0.85)} 0 2px, transparent 3px),` +
          `radial-gradient(circle at 80% 20%, ${hexToRgba(colors[1] || '#ffffff', 0.8)} 0 2px, transparent 3px),` +
          `radial-gradient(circle at 50% 60%, ${hexToRgba(colors[2] || '#ffffff', 0.75)} 0 2px, transparent 3px),` +
          `radial-gradient(circle at 70% 80%, ${hexToRgba(colors[3] || '#ffffff', 0.7)} 0 2px, transparent 3px),` +
          `radial-gradient(circle at 30% 75%, ${hexToRgba(colors[4] || colors[0] || '#ffffff', 0.65)} 0 2px, transparent 3px)`,
        backgroundSize: '180px 180px, 200px 200px, 160px 160px, 220px 220px, 190px 190px',
        backgroundPosition: '0 0, 40px 10px, 20px 60px, 60px 30px, 10px 80px',
        opacity
      }
  }
}
