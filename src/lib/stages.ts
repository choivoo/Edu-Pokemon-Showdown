import type { Rng } from '../types'
import { INGREDIENTS, type IngredientId } from './cooking'
import { SPECIES } from './roster'
import { computeStats, expToNext, powerRating } from './stats'
import { SHAPE_WEIGHTS, type Stone, STONE_KINDS, type StoneKind } from './stones'
import type { Species } from '../types'

export type Theme = 'beach' | 'forest' | 'cave' | 'gorge' | 'volcano' | 'altar'
export interface DialogLine { speaker: string | null; text: string }

export interface Area {
  name: string
  emoji: string
  theme: Theme
  levelBase: number
  pool: number[]
  boss: number
  bossName: string
  shard: string
  drops: IngredientId[]
  /** 스톤 별 등급 가중치 [1성, 2성, 3성] */
  stars: [number, number, number]
  intro: DialogLine[]
  outro: DialogLine[]
}

const MIRA = '미라 박사'
const N = null

export const AREAS: Area[] = [
  {
    name: '푸른물결 해변', emoji: '🏖️', theme: 'beach', levelBase: 4, pool: [19, 54, 129, 60, 74, 16], boss: 130,
    bossName: '성난 갸라도스', shard: '파도의 조각', drops: ['dew', 'mushroom'], stars: [90, 10, 0],
    intro: [
      { speaker: N, text: '짭짤한 바람과 거센 파도 소리. 별모래섬의 첫 번째 지역, 푸른물결 해변이다.' },
      { speaker: MIRA, text: '첫 번째 조각은 "파도의 조각"이야. 해변의 우두머리 갸라도스가 품고 있을 거야.' },
      { speaker: MIRA, text: '무리하지 말고, 동료들의 힘을 믿어 보자. 출발!' },
    ],
    outro: [
      { speaker: N, text: '갸라도스의 이마에서 푸른 조각이 떨어져 반짝였다.' },
      { speaker: N, text: '파도의 조각을 되찾았다! (1/6)' },
      { speaker: MIRA, text: '해냈구나! 갸라도스도 이제 진정된 것 같아. 너와 함께 가고 싶은가 봐.' },
    ],
  },
  {
    name: '속삭이는 숲', emoji: '🌲', theme: 'forest', levelBase: 10, pool: [13, 43, 41, 1, 16, 19, 54], boss: 3,
    bossName: '숲의 파수꾼 이상해꽃', shard: '숲의 조각', drops: ['leaf', 'mushroom'], stars: [75, 22, 3],
    intro: [
      { speaker: N, text: '나뭇잎이 서로 속삭이는 숲. 하지만 오늘은 어딘가 시끄럽다.' },
      { speaker: MIRA, text: '두 번째 조각은 숲의 파수꾼, 이상해꽃이 품고 있어. 꽃향기에 정신을 뺏기지 않게 조심해!' },
    ],
    outro: [
      { speaker: N, text: '이상해꽃의 등에 핀 큰 꽃에서 초록빛 조각이 굴러떨어졌다.' },
      { speaker: N, text: '숲의 조각을 되찾았다! (2/6)' },
      { speaker: MIRA, text: '숲이 다시 조용해졌어. 이상해꽃이 고맙다며 뒤를 따라오네?' },
    ],
  },
  {
    name: '달그림자 동굴', emoji: '🕳️', theme: 'cave', levelBase: 16, pool: [92, 74, 104, 50, 41, 63, 261], boss: 94,
    bossName: '그림자 속의 팬텀', shard: '달그림자 조각', drops: ['moon', 'mushroom'], stars: [60, 32, 8],
    intro: [
      { speaker: N, text: '햇빛이 닿지 않는 깊은 동굴. 벽에 박힌 광석이 희미하게 빛난다.' },
      { speaker: MIRA, text: '여긴 낮에도 밤처럼 어두워. 세 번째 조각은 그림자 속의 팬텀이 숨기고 있을 거야.' },
    ],
    outro: [
      { speaker: N, text: '팬텀이 웃음을 터뜨리자 그림자 속에서 보랏빛 조각이 모습을 드러냈다.' },
      { speaker: N, text: '달그림자 조각을 되찾았다! (3/6)' },
      { speaker: MIRA, text: '장난이 좀 심했던 것뿐이었나 봐. 팬텀도 같이 다니고 싶대!' },
    ],
  },
  {
    name: '번개 협곡', emoji: '⛰️', theme: 'gorge', levelBase: 22, pool: [25, 81, 66, 198, 50, 74, 35], boss: 135,
    bossName: '천둥의 쥬피썬더', shard: '번개 조각', drops: ['spark', 'mushroom'], stars: [50, 38, 12],
    intro: [
      { speaker: N, text: '구름 사이로 번개가 끊임없이 내리치는 협곡. 머리카락이 곤두선다.' },
      { speaker: MIRA, text: '네 번째 조각은 번개 조각이야. 쥬피썬더가 전기를 잔뜩 모으고 있어. 땅 타입 동료가 있다면 든든할 거야!' },
    ],
    outro: [
      { speaker: N, text: '쥬피썬더가 크게 울부짖자 노란 번개 조각이 하늘에서 떨어졌다.' },
      { speaker: N, text: '번개 조각을 되찾았다! (4/6)' },
      { speaker: MIRA, text: '하늘이 맑아졌어! 쥬피썬더, 너도 우리 팀에 오겠니?' },
    ],
  },
  {
    name: '불꽃 화산', emoji: '🌋', theme: 'volcano', levelBase: 28, pool: [4, 58, 37, 66, 95, 74, 215], boss: 6,
    bossName: '불꽃의 군주 리자몽', shard: '불꽃 조각', drops: ['ember', 'mushroom'], stars: [40, 42, 18],
    intro: [
      { speaker: N, text: '용암이 흐르는 뜨거운 화산. 발바닥이 후끈거린다.' },
      { speaker: MIRA, text: '다섯 번째 조각은 불꽃 조각! 리자몽이 화산 꼭대기를 지키고 있어. 물 타입으로 열기를 식혀 줘!' },
    ],
    outro: [
      { speaker: N, text: '리자몽의 불꽃이 잦아들자 붉은 조각이 용암 위에서 빛났다.' },
      { speaker: N, text: '불꽃 조각을 되찾았다! (5/6)' },
      { speaker: MIRA, text: '이제 마지막 하나야. 제단에서 이상한 기운이 느껴져… 서두르자!' },
    ],
  },
  {
    name: '별빛 제단', emoji: '🌌', theme: 'altar', levelBase: 32, pool: [215, 198, 94, 65, 131, 147, 143, 135], boss: 149,
    bossName: '별을 삼킨 망나뇽', shard: '별빛 조각', drops: ['ember', 'dew', 'leaf', 'spark', 'moon', 'mushroom'], stars: [30, 45, 25],
    intro: [
      { speaker: N, text: '별빛이 쏟아지는 섬의 중심, 별빛 제단. 그 위에 거대한 그림자가 똬리를 틀고 있다.' },
      { speaker: MIRA, text: '저건… 마지막 조각을 삼켜 버린 망나뇽이야! 조각의 힘이 너무 강해서 스스로도 멈추지 못하는 거야.' },
      { speaker: MIRA, text: '지금까지 모은 조각들이 공명하고 있어. 모두의 힘으로 망나뇽을 구해 주자!' },
    ],
    outro: [
      { speaker: N, text: '망나뇽이 부드럽게 숨을 내쉬자 마지막 조각이 제단 위로 떠올랐다.' },
      { speaker: N, text: '여섯 조각이 한자리에 모이자 오로라 프리즘이 눈부시게 되살아났다!' },
      { speaker: MIRA, text: '섬이 웃고 있어. 모두 네 덕분이야, {name}!' },
      { speaker: MIRA, text: '프리즘의 빛이 하늘로 뻗어 나가 "끝없는 별길"이 열렸어. 더 강한 포켓몬들과 겨뤄 볼래?' },
      { speaker: N, text: '— 별모래섬의 이야기는 여기서 끝나지 않는다. —' },
    ],
  },
]

export const PROLOGUE: DialogLine[] = [
  { speaker: N, text: '하늘에서 별이 떨어진 날, 그 조각들이 모여 섬이 되었다고 한다. 그 이름은 별모래섬.' },
  { speaker: N, text: '섬 한가운데 별빛 제단에는 "오로라 프리즘"이 있어, 섬의 포켓몬들은 오랫동안 평화롭게 살아왔다.' },
  { speaker: MIRA, text: '{name}! 드디어 도착했구나. 여기가 별모래섬이야!' },
  { speaker: MIRA, text: '그런데 큰일이야. 지난 폭풍에 오로라 프리즘이 여섯 조각으로 깨져 버렸어. 빛을 잃은 포켓몬들이 흥분해서 난폭해졌지.' },
  { speaker: MIRA, text: '조각은 각 지역의 우두머리가 품고 있어. 모두 모아 제단에 놓으면 섬이 다시 평화로워질 거야.' },
  { speaker: MIRA, text: '탐험은 혼자 할 수 없어. 베이스캠프 냄비에서 요리를 하면, 냄새를 맡은 친구들이 찾아올 거야!' },
  { speaker: MIRA, text: "자, 먼저 첫 번째 동료를 골라 봐. 구구와 꼬렛도 함께 데려가렴. 잘 부탁한다!" },
]

export const STAGES_PER_AREA = 5

export interface Stage {
  id: string
  /** 모험 지역 인덱스, 무한 모드는 -1 */
  area: number
  index: number
  name: string
  level: number
  /** 웨이브별 적 수 (마지막 웨이브가 보스면 보스 포함) */
  wavePlan: number[]
  boss: boolean
  coins: number
  exp: number
  /** 첫 클리어 시 동료가 되는 포켓몬 */
  recruit: number | null
  endlessFloor?: number
}

export const stageId = (area: number, index: number) => `a${area}-s${index}`

export function getStage(area: number, index: number): Stage {
  const a = AREAS[area]
  const boss = index === STAGES_PER_AREA - 1
  const level = a.levelBase + index + (boss ? 1 : 0)
  return {
    id: stageId(area, index), area, index,
    name: boss ? a.bossName : `${a.name} ${index + 1}`,
    level,
    wavePlan: wavePlanFor(area, index, boss),
    boss,
    coins: Math.round((24 + area * 12 + index * 8) * (boss ? 2 : 1)),
    exp: Math.round(expToNext(level) * (boss ? 2 : 1.1)),
    recruit: boss ? a.boss : null,
  }
}

/** 첫 지역 초반은 적 수를 줄여 부담 없이 시작 */
function wavePlanFor(area: number, index: number, boss: boolean): number[] {
  if (boss) return [2, 3, 2]
  if (area === 0 && index === 0) return [1, 2, 2]
  if (area === 0 && index === 1) return [2, 2, 2]
  return index === 3 ? [2, 3, 3, 3] : [2, 2, 3]
}

export const allStages = (): Stage[] => AREAS.flatMap((_, a) => Array.from({ length: STAGES_PER_AREA }, (_, i) => getStage(a, i)))

export function getEndlessStage(floor: number): Stage {
  const boss = floor % 5 === 0
  return {
    id: `endless-${floor}`, area: -1, index: floor, name: `끝없는 별길 ${floor}층`,
    level: 12 + floor * 2, wavePlan: boss ? [2, 3, 2] : [2, 3, 3], boss,
    coins: 50 + floor * 10, exp: Math.round(expToNext(12 + floor * 2) * (boss ? 2 : 1.1)), recruit: floor === 10 ? 150 : null, endlessFloor: floor,
  }
}

export interface WaveEnemy { species: number; level: number; boss?: boolean }

const pick = <T,>(arr: T[], rng: Rng): T => arr[Math.floor(rng() * arr.length)]

/** 스테이지의 웨이브 구성을 무작위로 뽑는다 */
export function buildWaves(stage: Stage, rng: Rng = Math.random): WaveEnemy[][] {
  const area = stage.area >= 0 ? AREAS[stage.area] : null
  const pool = area ? area.pool : SPECIES.filter(s => s.rarity <= 3).map(s => s.id)
  return stage.wavePlan.map((count, wi) => {
    const last = wi === stage.wavePlan.length - 1
    if (stage.boss && last) {
      const bossId = area ? area.boss : pick(SPECIES.filter(s => s.rarity === 3).map(s => s.id), rng)
      const minions = Array.from({ length: count - 1 }, () => ({ species: pick(pool, rng), level: Math.max(1, stage.level - 2) }))
      return [{ species: bossId, level: stage.level, boss: true }, ...minions]
    }
    return Array.from({ length: count }, () => ({ species: pick(pool, rng), level: stage.level - (last ? 0 : 1) }))
  })
}

export interface Rewards {
  coins: number
  exp: number
  ingredients: Partial<Record<IngredientId, number>>
  stone: Omit<Stone, 'id'> | null
}

function weighted(w: number[], rng: Rng): number {
  const total = w.reduce((a, b) => a + b, 0)
  let r = rng() * total
  for (let i = 0; i < w.length; i++) { r -= w[i]; if (r < 0) return i }
  return w.length - 1
}

/** 클리어 보상: 코인/경험치/재료/파워스톤 */
export function rollRewards(stage: Stage, rng: Rng = Math.random): Rewards {
  const area = stage.area >= 0 ? AREAS[stage.area] : null
  const drops = area ? area.drops : INGREDIENTS.map(i => i.id)
  const ingredients: Rewards['ingredients'] = {}
  const n = 5 + Math.floor(rng() * 4) + (stage.boss ? 4 : 0)
  for (let i = 0; i < n; i++) {
    const id = pick(drops, rng)
    ingredients[id] = (ingredients[id] ?? 0) + 1
  }
  const stars = area ? area.stars : ([40, 40, 20] as [number, number, number])
  const gotStone = stage.boss || rng() < 0.35
  const shape = SHAPE_WEIGHTS[weighted(SHAPE_WEIGHTS.map(w => w[1]), rng)][0]
  const stone = gotStone ? { kind: pick<StoneKind>(STONE_KINDS, rng), star: (weighted(stars, rng) + 1) as 1 | 2 | 3, shape } : null
  return { coins: stage.coins, exp: stage.exp, ingredients, stone }
}

const AVG: Species = { id: 0, name: '', types: ['normal'], stats: { hp: 60, atk: 60, def: 60, spe: 60 }, rarity: 2, basic: '', special: '' }
/** 스테이지 추천 전투력 (파티 3마리 합계 기준, 원작처럼 숫자로 표시) */
export const recommendedPower = (stage: Stage) => 3 * powerRating(computeStats(AVG, stage.level))
