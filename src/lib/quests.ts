import type { SaveData } from './storage'

export type Counter = 'clears' | 'kills' | 'cooked' | 'trained' | 'recalled' | 'evolved' | 'bosses'

export interface Reward { ticket?: number; coins?: number; shell?: number; rainbow?: number; theme?: string }
export interface Quest {
  id: string
  kind: 'main' | 'challenge'
  title: string
  desc: string
  goal: number
  progress: (s: SaveData) => number
  reward: Reward
}

const counter = (c: Counter) => (s: SaveData) => s.counters?.[c] ?? 0
const areaDone = (i: number) => (s: SaveData) => (s.cleared[`a${i}-4`] ? 1 : 0)

export const QUESTS: Quest[] = [
  ...['푸른물결 해변', '속삭이는 숲', '달그림자 동굴', '번개 협곡', '불꽃 화산', '별빛 제단'].map((n, i): Quest => ({
    id: `main-${i}`, kind: 'main', title: `${n}의 수호자`, desc: `${n}의 보스를 쓰러뜨려 프리즘 조각을 되찾는다`, goal: 1,
    progress: areaDone(i), reward: { coins: 300 + i * 150, ticket: 1, shell: i >= 3 ? 1 : 0, theme: i === 2 ? 'dusk' : i === 5 ? 'night' : undefined },
  })),
  { id: 'c-clear10', kind: 'challenge', title: '탐험 초보', desc: '탐험을 10번 성공한다', goal: 10, progress: counter('clears'), reward: { coins: 200 } },
  { id: 'c-clear40', kind: 'challenge', title: '탐험 베테랑', desc: '탐험을 40번 성공한다', goal: 40, progress: counter('clears'), reward: { coins: 700, rainbow: 1, ticket: 2 } },
  { id: 'c-kill100', kind: 'challenge', title: '백 마리 격파', desc: '야생 포켓몬을 100마리 쓰러뜨린다', goal: 100, progress: counter('kills'), reward: { coins: 300, theme: 'sunny' } },
  { id: 'c-cook10', kind: 'challenge', title: '냄비 요리사', desc: '요리를 10번 만든다', goal: 10, progress: counter('cooked'), reward: { coins: 250, shell: 1 } },
  { id: 'c-train5', kind: 'challenge', title: '특훈의 시작', desc: '특훈을 5번 한다', goal: 5, progress: counter('trained'), reward: { coins: 250 } },
  { id: 'c-recall3', kind: 'challenge', title: '기술 떠올리기', desc: '새 필살기를 3번 떠올린다', goal: 3, progress: counter('recalled'), reward: { coins: 400, shell: 1 } },
  { id: 'c-evolve3', kind: 'challenge', title: '진화의 기쁨', desc: '포켓몬을 3번 진화시킨다', goal: 3, progress: counter('evolved'), reward: { coins: 500, theme: 'sakura' } },
  { id: 'c-dex30', kind: 'challenge', title: '도감 수집가', desc: '도감을 30마리 채운다', goal: 30, progress: s => s.dex.length, reward: { coins: 600, ticket: 1 } },
  { id: 'c-endless10', kind: 'challenge', title: '끝없는 별길', desc: '끝없는 별길 10층에 도달한다', goal: 10, progress: s => s.endlessBest, reward: { coins: 800, rainbow: 2 } },
]

export const isDone = (s: SaveData, q: Quest) => q.progress(s) >= q.goal
export const isClaimed = (s: SaveData, q: Quest) => s.claimed.includes(q.id)
export const claimable = (s: SaveData) => QUESTS.filter(q => isDone(s, q) && !isClaimed(s, q))

/** 모양바꾸기 굿즈: 캠프의 분위기를 바꾼다 */
export const THEMES: { id: string; name: string; filter: string }[] = [
  { id: 'default', name: '기본', filter: 'none' },
  { id: 'sunny', name: '맑은 한낮', filter: 'saturate(1.25) brightness(1.08)' },
  { id: 'sakura', name: '벚꽃빛', filter: 'hue-rotate(-28deg) saturate(1.15) brightness(1.06)' },
  { id: 'dusk', name: '해질녘', filter: 'sepia(0.45) saturate(1.3) brightness(0.92)' },
  { id: 'night', name: '별밤', filter: 'hue-rotate(190deg) brightness(0.72) saturate(1.2)' },
]
export const themeFilter = (id: string) => THEMES.find(t => t.id === id)?.filter ?? 'none'

/** 번영의 석상: 올릴수록 탐험 경험치가 늘어난다 (낮은 레벨 포켓몬 위주) */
export const STATUE_MAX = 5
export const statueCost = (lv: number) => 400 * Math.pow(2, lv)
export const statueMul = (lv: number) => 1 + 0.1 * lv
export const statueCap = (lv: number) => 12 + lv * 8
