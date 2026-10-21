import type { PokemonType, Rng } from '../types'
import { type IngredientId } from './cooking'
import { SPECIES } from './roster'
import { computeStats, expToNext, powerRating } from './stats'
import { SHAPE_WEIGHTS, STONE_PERKS, type Stone, type StoneKind, type StonePerk } from './stones'
import { MOVE_STONE_KINDS, type MoveStoneKind } from './moveStones'
import type { Species } from '../types'
import { ORIGINAL_AREAS, ORIGINAL_BOSS_AREA, ORIGINAL_FIRST, HAPPENSTANCE_AREA, HAPPENSTANCE } from './originalCampaign'

export type Theme = 'beach' | 'forest' | 'cave' | 'gorge' | 'volcano' | 'altar'
export interface DialogLine { speaker: string | null; text: string }

export interface Area {
  name: string
  /** 도트 아이콘 이름 */
  icon: string
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
  /** Some original worlds have 4 or 6 expeditions; the legendary chamber has 1. */
  stageCount?: number
  bonusTypes?: PokemonType[]
  campaign?: 'original' | 'fan'
}

const MIRA = '미라 박사'
const N = null

const FAN_AREAS: Area[] = [
  {
    name: '푸른물결 해변', icon: 'areaBeach', theme: 'beach', levelBase: 4, pool: [19, 54, 129, 60, 74, 16], boss: 130,
    bossName: '성난 갸라도스', shard: '파도의 조각', drops: ['berryBlue', 'rockBlue', 'fossil', 'mushroomRed'], stars: [90, 10, 0],
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
    name: '속삭이는 숲', icon: 'areaForest', theme: 'forest', levelBase: 10, pool: [13, 43, 41, 1, 16, 19, 54], boss: 3,
    bossName: '숲의 파수꾼 이상해꽃', shard: '숲의 조각', drops: ['rootRed', 'nutYellow', 'mushroomRed', 'honey'], stars: [75, 22, 3],
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
    name: '달그림자 동굴', icon: 'areaCave', theme: 'cave', levelBase: 16, pool: [92, 74, 104, 50, 41, 63, 261], boss: 94,
    bossName: '그림자 속의 팬텀', shard: '달그림자 조각', drops: ['fossil', 'mushroomGray', 'rockBlue', 'nutYellow'], stars: [60, 32, 8],
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
    name: '번개 협곡', icon: 'areaGorge', theme: 'gorge', levelBase: 22, pool: [25, 81, 66, 198, 50, 74, 35], boss: 135,
    bossName: '천둥의 쥬피썬더', shard: '번개 조각', drops: ['nutYellow', 'honey', 'fossil', 'mushroomGray'], stars: [50, 38, 12],
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
    name: '불꽃 화산', icon: 'areaVolcano', theme: 'volcano', levelBase: 28, pool: [4, 58, 37, 66, 95, 74, 215], boss: 6,
    bossName: '불꽃의 군주 리자몽', shard: '불꽃 조각', drops: ['mushroomRed', 'rootRed', 'fossil', 'mushroomGray'], stars: [40, 42, 18],
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
    name: '별빛 제단', icon: 'areaAltar', theme: 'altar', levelBase: 32, pool: [215, 198, 94, 65, 131, 147, 143, 135], boss: 149,
    bossName: '별을 삼킨 망나뇽', shard: '별빛 조각', drops: ['mushroomRed', 'berryBlue', 'nutYellow', 'fossil', 'rootRed', 'rockBlue', 'honey', 'mushroomGray'], stars: [30, 45, 25],
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

export const AREAS: Area[] = [
  ...FAN_AREAS.map((area, i): Area => ({ ...area, levelBase: 62 + i * 7, campaign: 'fan' })),
  ...ORIGINAL_AREAS,
  {
    name: HAPPENSTANCE.name, icon: 'areaAltar', theme: 'altar', levelBase: 60,
    pool: [3,6,9,18,65,68,76,94,103,112,115,127,130,131,143,149], boss: 150,
    bossName: '전설의 포켓몬', shard: '', drops: ['mushroomRed','berryBlue','nutYellow','fossil','rootRed','rockBlue','honey','mushroomGray'],
    stars: [10, 30, 60], stageCount: HAPPENSTANCE.stageCount, bonusTypes: [], campaign: 'original',
    intro: [{ speaker: '모비', text: '뮤츠와의 결전 이후 나타난 기이한 섬입니다. 지형과 포켓몬이 탐험할 때마다 달라집니다.' }, { speaker: null, text: '아홉 가지 난이도에 자유롭게 도전할 수 있지만 각 탐험에는 5분 제한이 있다.' }],
    outro: [{ speaker: null, text: '끝없이 변화하는 기이한 섬에서 또 하나의 전설이 기록되었다.' }],
  },
]

export const PROLOGUE: DialogLine[] = [
  { speaker: N, text: '새로 발견된 네모루루섬. 탐험가는 이 섬에 감춰진 보물을 찾기 위해 배를 타고 출발했다.' },
  { speaker: N, text: '섬에는 오래전에 누군가 남긴 석상과 신기한 포켓몬들이 기다리고 있다.' },
  { speaker: '모비', text: '안녕하세요! 탐험 지원 드론 모비입니다. 현재 이 섬의 지도 데이터가 없습니다.' },
  { speaker: '모비', text: '처음 만난 포켓몬과 친구가 되어 섬의 지형을 조사해 보세요.' },
  { speaker: '모비', text: '첫 동료를 고른 다음에는 출발의초원으로! 재료를 모아 요리하면 더 많은 친구를 만날 수 있어요.' },
  { speaker: N, text: '열 개의 고대 석상을 모으면 섬에 숨겨진 전설의공간으로 가는 길이 열린다고 한다.' },
  { speaker: N, text: '네모루루섬을 탐험한 다음, 원작 엔딩 너머의 새로운 이야기도 기다리고 있다.' },
]

export const STAGES_PER_AREA = 5
export const stageCount = (area: number): number => AREAS[area]?.stageCount ?? STAGES_PER_AREA
export const originalAreaCount = () => ORIGINAL_AREAS.length

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
  /** Set on original island 12. Losing when this many seconds elapse. */
  timeLimitSec?: number
  recommended?: number
  /** Strong-looking Pokemon appears in the final wave of each expedition. */
  finalEnemy?: number
}

export const stageId = (area: number, index: number) => `a${area}-s${index}`

export function getStage(area: number, index: number): Stage {
  const a = AREAS[area]
  const postgame = area === HAPPENSTANCE_AREA
  const boss = postgame || index === stageCount(area) - 1
  const level = a.levelBase + index * (postgame ? 5 : 1) + (boss ? 1 : 0)
  const firstSteppe = area === ORIGINAL_FIRST
  const firstSteppeStrength = [200, 650, 750, 850] as const
  const firstSteppeBoss = [52, 11, 17] as const
  return {
    id: stageId(area, index), area, index,
    name: postgame ? (index === 8 ? '12-BOSS · 전설의 시련' : `12-${index + 1} · 기이한 섬`) : a.campaign === 'original' ? `${area - ORIGINAL_FIRST + 1}-${boss ? 'BOSS' : index + 1} · ${boss ? a.bossName : a.name}` : boss ? a.bossName : `${a.name} ${index + 1}`,
    level,
    wavePlan: postgame ? [2, 3, 3, index === 8 ? 1 : 2] : area === ORIGINAL_BOSS_AREA ? [1] : wavePlanFor(area, index, boss),
    boss,
    coins: Math.round((24 + area * 12 + index * 8) * (boss ? 2 : 1)),
    exp: Math.round(expToNext(level) * (boss ? 2 : 1.1)),
    recruit: boss && a.campaign !== 'original' ? a.boss : null,
    ...(postgame ? { timeLimitSec: HAPPENSTANCE.timeLimit, recommended: HAPPENSTANCE.recommended[index] } : {}),
    ...(firstSteppe ? { recommended: firstSteppeStrength[index], ...(!boss ? { finalEnemy: firstSteppeBoss[index] } : {}) } : {}),
  }
}

/** 첫 지역 초반은 적 수를 줄여 부담 없이 시작 */
function wavePlanFor(area: number, index: number, boss: boolean): number[] {
  if (boss) return [2, 3, 2]
  if ((area === 0 || area === ORIGINAL_FIRST) && index === 0) return [1, 2, 2]
  if ((area === 0 || area === ORIGINAL_FIRST) && index === 1) return [2, 2, 2]
  return index === 3 ? [2, 3, 3, 3] : [2, 2, 3]
}

export const allStages = (): Stage[] => AREAS.flatMap((_, a) => Array.from({ length: stageCount(a) }, (_, i) => getStage(a, i)))

export function getEndlessStage(floor: number): Stage {
  const boss = floor % 5 === 0
  return {
    id: `endless-${floor}`, area: -1, index: floor, name: `끝없는 별길 ${floor}층`,
    level: 12 + floor * 2, wavePlan: boss ? [2, 3, 2] : [2, 3, 3], boss,
    coins: 50 + floor * 10, exp: Math.round(expToNext(12 + floor * 2) * (boss ? 2 : 1.1)), recruit: floor === 10 ? 150 : null, endlessFloor: floor,
  }
}

export interface WaveEnemy {
  species: number
  level: number
  boss?: boolean
  /** 강해 보이는 포켓몬 */
  elite?: boolean
  /** 웨이브 도중에 나타나는 적: call 동료 호출 / new 새로운 무리 / bossHp 보스 체력이 반쯤 깎이면 포위 */
  late?: 'call' | 'new' | 'bossHp'
  /** 처음부터 사방에서 몰려온다 */
  surround?: boolean
}

const pick = <T,>(arr: T[], rng: Rng): T => arr[Math.floor(rng() * arr.length)]

/** 스테이지의 웨이브 구성을 무작위로 뽑는다 */
export function buildWaves(stage: Stage, rng: Rng = Math.random): WaveEnemy[][] {
  const area = stage.area >= 0 ? AREAS[stage.area] : null
  const postgame = stage.area === HAPPENSTANCE_AREA
  const pool = stage.area === ORIGINAL_FIRST && stage.index < 3 ? [
    [16, 19], [10, 13], [16, 21, 4, 37, 58],
  ][stage.index] : area ? area.pool : SPECIES.filter(s => s.rarity <= 3).map(s => s.id)
  // 첫 두 판은 이벤트 없이 익숙해지도록 한다
  const eventsOn = !((stage.area === 0 || stage.area === ORIGINAL_FIRST) && stage.index < 2)
  const mk = (level: number, extra: Partial<WaveEnemy> = {}): WaveEnemy => ({ species: pick(pool, rng), level, ...extra })
  return stage.wavePlan.map((count, wi) => {
    // 12-BOSS: Legendary birds guard the last room before Mew/Mewtwo.
    if (postgame && stage.index === 8 && wi === 2) return [144, 145, 146].map(id => ({ species: id, level: stage.level - 2, elite: true }))
    const last = wi === stage.wavePlan.length - 1
    if (stage.boss && last) {
      const bossId = postgame ? pick(stage.index === 8 ? [150, 151] : [3, 6, 9, 18, 65, 68, 76, 94, 103, 115, 127, 130, 131, 143, 144, 145, 146, 149, 150, 151], rng) : area ? area.boss : pick(SPECIES.filter(s => s.rarity === 3).map(s => s.id), rng)
      const minions = Array.from({ length: postgame && stage.index === 8 ? 0 : count - 1 }, () => mk(Math.max(1, stage.level - 2)))
      // 보스 체력이 반쯤 깎이면 부하들이 사방에서 나타난다 (보스가 쓰러지면 모두 도망친다)
      const rush = postgame && stage.index === 8 ? [] : Array.from({ length: 2 }, () => mk(Math.max(1, stage.level - 2), { late: 'bossHp' as const }))
      return [{ species: bossId, level: stage.level, boss: true }, ...minions, ...rush]
    }
    const lv = stage.level - (last ? 0 : 1)
    const base = Array.from({ length: count }, () => mk(lv))
    if (last && !stage.boss && (eventsOn || !!stage.finalEnemy)) base[0] = { ...base[0], ...(stage.finalEnemy ? { species: stage.finalEnemy } : {}), elite: true, level: lv + 1 }
    if (!eventsOn || (last && !stage.boss)) return base
    const roll = rng()
    if (roll < 0.22) return [...base, mk(lv - 1, { late: 'call' }), mk(lv - 1, { late: 'call' }), mk(lv - 1, { late: 'call' })]
    if (roll < 0.40) return [...base, mk(lv, { late: 'new' }), mk(lv, { late: 'new' })]
    if (roll < 0.52) return base.map(e => ({ ...e, surround: true }))
    return base
  })
}

export interface Rewards {
  coins: number
  exp: number
  ingredients: Partial<Record<IngredientId, number>>
  stone: Omit<Stone, 'id'> | null
  /** 기술스톤 (가끔, 보스는 자주) */
  moveStone: MoveStoneKind | null
}

function weighted(w: number[], rng: Rng): number {
  const total = w.reduce((a, b) => a + b, 0)
  let r = rng() * total
  for (let i = 0; i < w.length; i++) { r -= w[i]; if (r < 0) return i }
  return w.length - 1
}

/** 클리어 보상: 코인/경험치/재료/파워스톤 */
export function rollRewards(stage: Stage, rng: Rng = Math.random, expeditionBonus = false): Rewards {
  const area = stage.area >= 0 ? AREAS[stage.area] : null
  const drops: IngredientId[] = area ? area.drops : ['mushroomRed', 'berryBlue', 'nutYellow', 'fossil', 'rootRed', 'rockBlue', 'honey', 'mushroomGray']
  const ingredients: Rewards['ingredients'] = {}
  const n = 5 + Math.floor(rng() * 4) + (stage.boss ? 4 : 0) + (expeditionBonus ? 5 : 0)
  for (let i = 0; i < n; i++) {
    const id = pick(drops, rng)
    ingredients[id] = (ingredients[id] ?? 0) + 1
  }
  // 마지막 지역과 끝없는 별길에서는 무지개 재료가, 끝없는 별길 보스층에서는 신비의 조개껍질이 가끔 나온다
  if ((stage.area === HAPPENSTANCE_AREA || stage.area < 0) && rng() < (stage.boss ? 0.9 : 0.35)) ingredients.rainbow = 1
  if (stage.area === HAPPENSTANCE_AREA && rng() < (0.15 + stage.index * 0.06)) ingredients.shell = 1
  const stars = area ? area.stars : ([40, 40, 20] as [number, number, number])
  const gotStone = expeditionBonus || stage.boss || rng() < 0.35
  const shape = SHAPE_WEIGHTS[weighted(SHAPE_WEIGHTS.map(w => w[1]), rng)][0]
  const star = expeditionBonus ? 3 : (weighted(stars, rng) + 1) as 1 | 2 | 3
  const perks: Partial<Record<StonePerk, number>> = {}
  if (gotStone) {
    const available = [...STONE_PERKS]
    for (let i = 0; i < star; i++) {
      const index = Math.floor(rng() * available.length)
      const perk = available.splice(index,1)[0]
      perks[perk] = Math.round((2 + stage.level * 0.045 + rng() * 2) * 10) / 10
    }
  }
  const stone = gotStone ? { kind: pick<StoneKind>(['hp', 'atk'], rng), star, shape, perks,
    value: Math.max(10, Math.round((stage.level * 5 + 15) * (0.82 + rng() * 0.36))) } : null
  const moveStone = rng() < (stage.boss ? 0.7 : 0.2) ? pick<MoveStoneKind>(MOVE_STONE_KINDS, rng) : null
  return { coins: stage.coins, exp: stage.exp, ingredients, stone, moveStone }
}

const AVG: Species = { id: 0, name: '', types: ['normal'], stats: { hp: 60, atk: 60, def: 60, spe: 60 }, rarity: 2, basic: '', special: '' }
/** 스테이지 추천 전투력 (파티 3마리 합계 기준, 원작처럼 숫자로 표시) */
export const recommendedPower = (stage: Stage) => stage.recommended ?? 3 * powerRating(computeStats(AVG, stage.level))

/** 지역별 보너스 타입: 해당 타입 포켓몬은 그 지역에서 체력과 공격력이 늘어난다 */
export const AREA_BONUS: PokemonType[][] = [
  ['water', 'flying'], ['grass', 'bug'], ['rock', 'ghost'], ['electric', 'fighting'], ['fire', 'ground'], ['psychic', 'dragon'],
  ...ORIGINAL_AREAS.map(area => area.bonusTypes ?? []),
  [],
]
export const AREA_BONUS_MUL = 1.5
export const hasAreaBonus = (area: number, types: PokemonType[]) => area >= 0 && types.some(t => AREA_BONUS[area]?.includes(t))
