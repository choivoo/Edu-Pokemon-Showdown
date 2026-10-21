/** Original-styled 2D camp decorations.
 * Effects are granted by OWNING furniture even if it is not displayed,
 * as in the retail game's Base Camp. All art is generated locally.
 */
export type DecorKind = 'ingredient' | 'exp' | 'cook' | 'stone'
export interface Decoration { id: string; name: string; cost: number; kind: DecorKind; amount: number; color: string; desc: string }
export const DECOR_MAX = 5
export const DECORATIONS: Decoration[] = [
  { id: 'berry-basket', name: '열매 바구니', cost: 300, kind: 'ingredient', amount: 0.15, color: '#e8556e', desc: '탐험 재료 +15%' },
  { id: 'craft-totem', name: '탐험 기념탑', cost: 600, kind: 'exp', amount: 0.12, color: '#f4c451', desc: '탐험 경험치 +12%' },
  { id: 'camp-tent', name: '모험가 텐트', cost: 450, kind: 'cook', amount: 1, color: '#71c3cf', desc: '요리 완료까지 탐험 1회 단축' },
  { id: 'stone-garden', name: '돌정원', cost: 650, kind: 'stone', amount: 0.1, color: '#86a39c', desc: '파워스톤 획득 확률 +10%p' },
  { id: 'moss-lantern', name: '이끼 등불', cost: 800, kind: 'ingredient', amount: 0.2, color: '#7cbd74', desc: '탐험 재료 +20%' },
  { id: 'coral-banner', name: '산호 깃발', cost: 900, kind: 'exp', amount: 0.15, color: '#ed8c73', desc: '탐험 경험치 +15%' },
  { id: 'pot-stand', name: '주방 조리대', cost: 1400, kind: 'cook', amount: 1, color: '#b791e7', desc: '요리 완료까지 탐험 1회 단축' },
  { id: 'shiny-display', name: '반짝이는 진열대', cost: 1800, kind: 'stone', amount: 0.2, color: '#e5c7ff', desc: '파워스톤 획득 확률 +20%p' },
]
export const decorationById = (id: string) => DECORATIONS.find(d => d.id === id)
export function decorationBonus(owned: string[]) {
  const b = { ingredient: 0, exp: 0, cook: 0, stone: 0 }
  for (const id of new Set(owned)) {
    const d = decorationById(id)
    if (d) b[d.kind] += d.amount
  }
  return {
    ingredient: Math.min(1, b.ingredient),
    exp: Math.min(1, b.exp),
    cook: Math.min(2, b.cook),
    stone: Math.min(0.5, b.stone),
  }
}
