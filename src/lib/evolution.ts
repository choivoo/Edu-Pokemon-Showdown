import type { OwnedMon } from './stats'
import type { Stone } from './stones'

/** 진화 정보: 진화 전 → { 진화 후, 필요한 레벨 } (레벨은 그대로 이어진다) */
export const EVOLUTIONS: Record<number, { to: number; level: number }> = {
  1: { to: 2, level: 16 }, 2: { to: 3, level: 32 },
  4: { to: 5, level: 16 }, 5: { to: 6, level: 36 },
  7: { to: 8, level: 16 }, 8: { to: 9, level: 36 },
  16: { to: 17, level: 18 }, 17: { to: 18, level: 36 },
  19: { to: 20, level: 20 },
  25: { to: 26, level: 25 },
  133: { to: 135, level: 36 },
  41: { to: 42, level: 22 },
  52: { to: 53, level: 28 },
  54: { to: 55, level: 33 },
  63: { to: 64, level: 16 }, 64: { to: 65, level: 30 },
  66: { to: 67, level: 28 }, 67: { to: 68, level: 40 },
  74: { to: 75, level: 25 }, 75: { to: 76, level: 36 },
  92: { to: 93, level: 25 }, 93: { to: 94, level: 38 },
  100: { to: 101, level: 30 },
  81: { to: 82, level: 30 },
  43: { to: 44, level: 21 }, 44: { to: 45, level: 32 },
  60: { to: 61, level: 25 },
  147: { to: 148, level: 30 }, 148: { to: 149, level: 55 },
  10: { to: 11, level: 7 },
  11: { to: 12, level: 10 },
  13: { to: 14, level: 7 },
  14: { to: 15, level: 10 },
  21: { to: 22, level: 20 },
  23: { to: 24, level: 22 },
  27: { to: 28, level: 22 },
  29: { to: 30, level: 16 },
  30: { to: 31, level: 32 },
  32: { to: 33, level: 16 },
  33: { to: 34, level: 32 },
  35: { to: 36, level: 30 },
  37: { to: 38, level: 36 },
  39: { to: 40, level: 30 },
  46: { to: 47, level: 24 },
  48: { to: 49, level: 31 },
  50: { to: 51, level: 26 },
  56: { to: 57, level: 28 },
  58: { to: 59, level: 35 },
  61: { to: 62, level: 36 },
  69: { to: 70, level: 21 },
  70: { to: 71, level: 32 },
  72: { to: 73, level: 30 },
  77: { to: 78, level: 40 },
  79: { to: 80, level: 37 },
  84: { to: 85, level: 31 },
  86: { to: 87, level: 34 },
  88: { to: 89, level: 38 },
  90: { to: 91, level: 36 },
  96: { to: 97, level: 26 },
  98: { to: 99, level: 28 },
  102: { to: 103, level: 36 },
  104: { to: 105, level: 28 },
  109: { to: 110, level: 35 },
  111: { to: 112, level: 42 },
  116: { to: 117, level: 32 },
  118: { to: 119, level: 33 },
  120: { to: 121, level: 36 },
  129: { to: 130, level: 20 },
  138: { to: 139, level: 40 },
  140: { to: 141, level: 40 },
}

const EVOLVED = new Set([...Object.values(EVOLUTIONS).map(e => e.to), 134, 136, 151, 142, 124, 125, 126])
/** 진화로만 만날 수 있는 포켓몬 (요리/탐험 후보에서는 제외) */
export const isEvolvedForm = (id: number) => EVOLVED.has(id)
/** 이브이의 분기 진화 (돌 대신 고른 타입에 따라) */
export const EEVEE_BRANCH: Record<string, number> = { water: 134, electric: 135, fire: 136 }
/** HP > ATK stones: Vaporeon; ATK > HP: Flareon; ties: Jolteon. */
export function eeveeTarget(placed: Stone[]): number {
  const hp = placed.filter(s => s.kind === 'hp').length
  const atk = placed.filter(s => s.kind === 'atk').length
  return hp > atk ? 134 : atk > hp ? 136 : 135
}
export const targetOf = (species: number, choice?: string) => (species === 133 && choice && EEVEE_BRANCH[choice] ? EEVEE_BRANCH[choice] : EVOLUTIONS[species]?.to ?? null)

export const evolutionOf = (id: number) => EVOLUTIONS[id] ?? null
export const canEvolve = (m: Pick<OwnedMon, 'species' | 'level'>) => {
  if (m.species === 133) return m.level >= 36
  const e = EVOLUTIONS[m.species]
  return !!e && m.level >= e.level
}

/** 요리에서는 나오지 않고 진화로만 만나는 포켓몬 (처음부터 요리로 나오던 종은 그대로 둔다) */
export const EVOLUTION_ONLY = new Set([...Object.values(EVOLUTIONS).map(e => e.to), 134, 136, 124, 125, 126, 142, 151])
