import type { PokemonData } from '../types'

export const STARTERS = [25, 1, 4, 7, 133, 52, 54, 58, 63, 74, 104, 92]
export const EXP_PER_LEVEL = 100
export const MAX_BONUS = 1.3

/** 코인으로 해금하는 가격: 종족값 총합에 비례 */
export const unlockPrice = (p: PokemonData) => Math.round((p.stats.hp + p.stats.atk + p.stats.def + p.stats.spe) / 4)

export const trainerLevel = (exp: number) => 1 + Math.floor(exp / EXP_PER_LEVEL)

/** 트레이너 레벨 1당 스탯 +2% (최대 +30%) */
export const statBonus = (exp: number) => Math.min(MAX_BONUS, 1 + 0.02 * (trainerLevel(exp) - 1))
