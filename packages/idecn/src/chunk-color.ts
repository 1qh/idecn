import type { CSSProperties } from 'react'

const CHUNK_COLORS: [string, string][] = [
  ['oklch(0.63 0.24 25)', 'oklch(0.70 0.19 25)'],
  ['oklch(0.63 0.21 50)', 'oklch(0.70 0.16 50)'],
  ['oklch(0.75 0.18 85)', 'oklch(0.80 0.14 85)'],
  ['oklch(0.77 0.17 100)', 'oklch(0.82 0.13 100)'],
  ['oklch(0.72 0.19 140)', 'oklch(0.78 0.15 140)'],
  ['oklch(0.65 0.19 155)', 'oklch(0.72 0.15 155)'],
  ['oklch(0.60 0.15 170)', 'oklch(0.68 0.12 170)'],
  ['oklch(0.58 0.13 185)', 'oklch(0.66 0.11 185)'],
  ['oklch(0.57 0.13 200)', 'oklch(0.65 0.11 200)'],
  ['oklch(0.55 0.15 230)', 'oklch(0.65 0.12 230)'],
  ['oklch(0.55 0.20 255)', 'oklch(0.65 0.16 255)'],
  ['oklch(0.55 0.22 270)', 'oklch(0.65 0.18 270)'],
  ['oklch(0.55 0.24 285)', 'oklch(0.65 0.19 285)'],
  ['oklch(0.58 0.24 300)', 'oklch(0.68 0.19 300)'],
  ['oklch(0.62 0.24 320)', 'oklch(0.70 0.19 320)'],
  ['oklch(0.62 0.22 340)', 'oklch(0.70 0.17 340)'],
  ['oklch(0.62 0.23 355)', 'oklch(0.70 0.18 355)']
]
const FALLBACK: [string, string] = ['oklch(0.63 0.24 25)', 'oklch(0.70 0.19 25)']
const STRIDE = 5
const chunkColor = (ordinal: number, dark: boolean): string => {
  const len = CHUNK_COLORS.length
  const idx = (((ordinal * STRIDE) % len) + len) % len
  const pair = CHUNK_COLORS[idx] ?? FALLBACK
  return dark ? pair[1] : pair[0]
}
const tint = (color: string, pct: number): string => `color-mix(in oklch, ${color} ${pct}%, transparent)`
const rowStyle = (color: string, selected: boolean): CSSProperties =>
  ({
    '--chunk-ring': color,
    backgroundColor: tint(color, selected ? 22 : 8),
    borderLeftColor: selected ? color : undefined
  }) as CSSProperties
const PAD = 2
const regionBgPct = (retrieved: boolean, selected: boolean): number => {
  if (selected) return 38
  if (retrieved) return 28
  return 16
}
const regionBorderWidth = (retrieved: boolean, selected: boolean): number => {
  if (selected) return 3
  if (retrieved) return 2
  return 1
}
const regionStyle = ({
  base,
  color,
  retrieved,
  selected
}: {
  base: { height: number; left: number; top: number; width: number }
  color: string
  retrieved: boolean
  selected: boolean
}): CSSProperties =>
  ({
    '--chunk-ring': color,
    backgroundColor: tint(color, regionBgPct(retrieved, selected)),
    borderColor: color,
    borderWidth: regionBorderWidth(retrieved, selected),
    height: base.height + PAD * 2,
    left: base.left - PAD,
    top: base.top - PAD,
    width: base.width + PAD * 2
  }) as CSSProperties
const badgeStyle = (color: string): CSSProperties => ({ backgroundColor: color })
const textColor = (color: string): CSSProperties => ({ color })
export { badgeStyle, chunkColor, regionStyle, rowStyle, textColor, tint }
