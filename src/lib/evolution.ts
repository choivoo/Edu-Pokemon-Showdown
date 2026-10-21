import type { OwnedMon } from './stats'

/** 진화 정보: 진화 전 → { 진화 후, 필요한 레벨 } (레벨은 그대로 이어진다) */
export const EVOLUTIONS: Record<number, { to: number; level: number }> = {
  1: { to: 2, level: 16 }, 2: { to: 3, level: 32 },
  4: { to: 5, level: 16 }, 5: { to: 6, level: 36 },
  7: { to: 8, level: 16 }, 8: { to: 9, level: 36 },
  16: { to: 17, level: 18 }, 17: { to: 18, level: 36 },
  19: { to: 20, level: 20 },
  25: { to: 26, level: 25 },
  133: { to: 135, level: 20 },
  41: { to: 42, level: 22 },
  52: { to: 53, level: 28 },
  54: { to: 55, level: 33 },
  63: { to: 64, level: 16 }, 64: { to: 65, level: 30 },
  66: { to: 67, level: 28 }, 67: { to: 68, level: 40 },
  74: { to: 75, level: 25 }, 75: { to: 95, level: 38 },
  92: { to: 93, level: 25 }, 93: { to: 94, level: 38 },
  100: { to: 101, level: 30 },
  81: { to: 82, level: 30 },
  43: { to: 44, level: 21 }, 44: { to: 45, level: 32 },
  60: { to: 61, level: 25 },
  147: { to: 148, level: 30 }, 148: { to: 149, level: 55 },
}

const EVOLVED = new Set([...Object.values(EVOLUTIONS).map(e => e.to), 134, 136, 151, 142, 124, 125, 126])
/** 진화로만 만날 수 있는 포켓몬 (요리/탐험 후보에서는 제외) */
export const isEvolvedForm = (id: number) => EVOLVED.has(id)
/** 이브이의 분기 진화 (돌 대신 고른 타입에 따라) */
export const EEVEE_BRANCH: Record<string, number> = { water: 134, electric: 135, fire: 136 }
export const targetOf = (species: number, choice?: string) => (species === 133 && choice && EEVEE_BRANCH[choice] ? EEVEE_BRANCH[choice] : EVOLUTIONS[species]?.to ?? null)

export const evolutionOf = (id: number) => EVOLUTIONS[id] ?? null
export const canEvolve = (m: Pick<OwnedMon, 'species' | 'level'>) => {
  const e = EVOLUTIONS[m.species]
  return !!e && m.level >= e.level
}

/** 요리에서는 나오지 않고 진화로만 만나는 포켓몬 (처음부터 요리로 나오던 종은 그대로 둔다) */
export const EVOLUTION_ONLY = new Set([2, 5, 8, 17, 18, 20, 26, 42, 53, 55, 61, 64, 75, 82, 93, 101, 44, 45, 67, 148, 134, 136, 124, 125, 126, 142, 151])
