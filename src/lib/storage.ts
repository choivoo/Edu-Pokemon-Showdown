import { STARTERS } from './progression'

export interface Progress {
  nickname: string
  avatar: number
  coins: number
  exp: number
  wins: number
  losses: number
  bestSurvival: number
  unlocked: number[]
}

const KEY = 'edu-pokemon-showdown:v1'

export const defaultProgress = (): Progress => ({
  nickname: '', avatar: 0, coins: 0, exp: 0, wins: 0, losses: 0, bestSurvival: 0, unlocked: [...STARTERS],
})

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultProgress()
    return { ...defaultProgress(), ...JSON.parse(raw) }
  } catch {
    return defaultProgress()
  }
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    // 저장 불가(사생활 보호 모드 등)여도 게임은 계속된다
  }
}
