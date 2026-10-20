import type { PokemonType, Rng, Species } from '../types'
import { SPECIES } from './roster'

// 재료는 원작처럼 "색 / 식감 / 종류" 세 가지 성질을 가진다. 어떤 성질이 얼마나 들어갔는지로 레시피가 정해진다.
export type IngredientId =
  | 'mushroomRed' | 'berryBlue' | 'nutYellow' | 'fossil' | 'rootRed'
  | 'rockBlue' | 'honey' | 'mushroomGray' | 'rainbow' | 'shell'

export type Color = 'red' | 'blue' | 'yellow' | 'gray'
export type Texture = 'soft' | 'hard'
export type Kind = 'mushroom' | 'sweet' | 'plant' | 'mineral'

export interface Ingredient {
  id: IngredientId
  name: string
  /** 도트 아이콘 이름 (art/icons.ts) */
  icon: string
  color: Color | 'all'
  texture: Texture | 'all'
  kind: Kind | 'all' | 'mystic'
  /** 희귀도: 0 흔함, 1 귀함, 2 아주 귀함. 합계로 요리 등급이 정해진다 */
  rarity: 0 | 1 | 2
  /** 상점 판매가 (0이면 팔지 않음) */
  price: number
}

export const INGREDIENTS: Ingredient[] = [
  { id: 'mushroomRed', name: '작은 버섯', icon: 'mushroomRed', color: 'red', texture: 'soft', kind: 'mushroom', rarity: 0, price: 10 },
  { id: 'berryBlue', name: '블리열매', icon: 'berryBlue', color: 'blue', texture: 'soft', kind: 'sweet', rarity: 0, price: 10 },
  { id: 'nutYellow', name: '규토리', icon: 'nutYellow', color: 'yellow', texture: 'hard', kind: 'plant', rarity: 0, price: 10 },
  { id: 'fossil', name: '화석', icon: 'fossil', color: 'gray', texture: 'hard', kind: 'mineral', rarity: 0, price: 10 },
  { id: 'rootRed', name: '큰뿌리', icon: 'rootRed', color: 'red', texture: 'soft', kind: 'plant', rarity: 0, price: 10 },
  { id: 'rockBlue', name: '차가운바위', icon: 'rockBlue', color: 'blue', texture: 'hard', kind: 'mineral', rarity: 1, price: 28 },
  { id: 'honey', name: '달콤한꿀', icon: 'honey', color: 'yellow', texture: 'soft', kind: 'sweet', rarity: 1, price: 28 },
  { id: 'mushroomGray', name: '향기버섯', icon: 'mushroomGray', color: 'gray', texture: 'soft', kind: 'mushroom', rarity: 1, price: 28 },
  { id: 'rainbow', name: '무지개머티리얼', icon: 'rainbow', color: 'all', texture: 'all', kind: 'all', rarity: 2, price: 0 },
  { id: 'shell', name: '신비의 조개껍질', icon: 'shell', color: 'all', texture: 'all', kind: 'mystic', rarity: 1, price: 0 },
]
export const getIngredient = (id: IngredientId) => INGREDIENTS.find(i => i.id === id)!

export const COLOR_LABEL: Record<Color, string> = { red: '빨강', blue: '파랑', yellow: '노랑', gray: '회색' }
export const TEXTURE_LABEL: Record<Texture, string> = { soft: '부드러움', hard: '딱딱함' }
export const KIND_LABEL: Record<Kind | 'mystic', string> = { mushroom: '버섯', sweet: '달콤함', plant: '식물', mineral: '광물', mystic: '신비로움' }

export const DISH_SIZE = 5

/** 냄비에 든 재료의 성질별 개수. 무지개 재료는 모든 색·식감·종류에 +1, 조개껍질은 신비로움에 +1 */
export interface Tally { color: Record<Color, number>; texture: Record<Texture, number>; kind: Record<Kind | 'mystic', number> }
export function tally(sel: IngredientId[]): Tally {
  const t: Tally = {
    color: { red: 0, blue: 0, yellow: 0, gray: 0 },
    texture: { soft: 0, hard: 0 },
    kind: { mushroom: 0, sweet: 0, plant: 0, mineral: 0, mystic: 0 },
  }
  for (const id of sel) {
    const i = getIngredient(id)
    for (const c of Object.keys(t.color) as Color[]) if (i.color === 'all' || i.color === c) t.color[c]++
    for (const x of Object.keys(t.texture) as Texture[]) if (i.texture === 'all' || i.texture === x) t.texture[x]++
    for (const k of Object.keys(t.kind) as (Kind | 'mystic')[]) {
      if (k === 'mystic') { if (i.kind === 'mystic' || i.id === 'rainbow') t.kind.mystic++ } else if (i.kind === 'all' || i.kind === k) t.kind[k]++
    }
  }
  return t
}

/** 듬뿍 = 4개 이상, 많이 = 3개 이상, 조금 = 1개 이상 */
const PLENTY = 4, MANY = 3, SOME = 1

export interface Recipe { no: number; name: string; types: PokemonType[]; hint: string }

const ALL_TYPES: PokemonType[] = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy']

/** 18가지 레시피. 번호가 낮은 것이 먼저 적용되고, 아무것도 맞지 않으면 1번(별모래 수프) */
const RECIPES: { r: Recipe; ok: (t: Tally) => boolean }[] = [
  { r: { no: 2, name: '노을 스튜', types: ['fire', 'fighting', 'dragon'], hint: '빨간 재료 듬뿍' }, ok: t => t.color.red >= PLENTY },
  { r: { no: 3, name: '물결 주스', types: ['water', 'ice'], hint: '파란 재료 듬뿍' }, ok: t => t.color.blue >= PLENTY },
  { r: { no: 4, name: '햇살 카레', types: ['normal', 'bug', 'electric'], hint: '노란 재료 듬뿍' }, ok: t => t.color.yellow >= PLENTY },
  { r: { no: 5, name: '잿빛 그라탕', types: ['rock', 'ground', 'steel'], hint: '회색 재료 듬뿍' }, ok: t => t.color.gray >= PLENTY },
  { r: { no: 6, name: '물빛 차우더', types: ['water', 'ice'], hint: '부드러운 재료 듬뿍 + 파란 재료 많이' }, ok: t => t.texture.soft >= PLENTY && t.color.blue >= MANY },
  { r: { no: 7, name: '구름 크레이프', types: ['normal', 'fairy'], hint: '달콤한 재료 많이 + 회색 조금' }, ok: t => t.kind.sweet >= MANY && t.color.gray >= SOME },
  { r: { no: 8, name: '보라 버섯죽', types: ['poison', 'ghost'], hint: '버섯 듬뿍 + 부드러운 재료 많이' }, ok: t => t.kind.mushroom >= PLENTY && t.texture.soft >= MANY },
  { r: { no: 9, name: '황토 파이', types: ['ground', 'rock'], hint: '부드러운 재료 많이 + 광물 조금' }, ok: t => t.texture.soft >= MANY && t.kind.mineral >= SOME },
  { r: { no: 10, name: '숲속 스무디', types: ['grass', 'bug'], hint: '식물 듬뿍 + 부드러운 재료 조금' }, ok: t => t.kind.plant >= PLENTY && t.texture.soft >= SOME },
  { r: { no: 11, name: '꿀벌 퐁듀', types: ['bug', 'poison'], hint: '달콤한 재료 듬뿍 + 노란 재료 많이' }, ok: t => t.kind.sweet >= PLENTY && t.color.yellow >= MANY },
  { r: { no: 12, name: '별빛 오믈렛', types: ['psychic', 'fairy', 'dark'], hint: '달콤한 재료 많이 + 딱딱한 재료 조금' }, ok: t => t.kind.sweet >= MANY && t.texture.hard >= SOME },
  { r: { no: 13, name: '바위 찜', types: ['rock', 'steel', 'ground'], hint: '딱딱한 재료 듬뿍 + 광물 조금' }, ok: t => t.texture.hard >= PLENTY && t.kind.mineral >= SOME },
  { r: { no: 14, name: '바람 샐러드', types: ['flying', 'dragon'], hint: '광물 많이 + 식물 조금' }, ok: t => t.kind.mineral >= MANY && t.kind.plant >= SOME },
  { r: { no: 15, name: '불꽃 바비큐', types: ['fire', 'dragon'], hint: '버섯 많이 + 빨간 재료 조금' }, ok: t => t.kind.mushroom >= MANY && t.color.red >= SOME },
  { r: { no: 16, name: '번개 소스', types: ['electric', 'steel'], hint: '부드러운 재료 듬뿍 + 노란 재료 많이' }, ok: t => t.texture.soft >= PLENTY && t.color.yellow >= MANY },
  { r: { no: 17, name: '근육 샐러드', types: ['fighting', 'dark'], hint: '달콤한 재료 많이 + 버섯 조금' }, ok: t => t.kind.sweet >= MANY && t.kind.mushroom >= SOME },
  { r: { no: 18, name: '전설의 수프', types: ALL_TYPES, hint: '신비로운 재료 듬뿍' }, ok: t => t.kind.mystic >= PLENTY },
]
const BASIC: Recipe = { no: 1, name: '별모래 수프', types: ALL_TYPES, hint: '아무 재료나' }

export const ALL_RECIPES: Recipe[] = [BASIC, ...RECIPES.map(x => x.r)].sort((a, b) => a.no - b.no)

/** 재료 묶음으로 만들 수 있는 요리. 여러 개가 맞으면 번호가 낮은 것(단, 신비로운 재료 듬뿍은 항상 전설의 수프) */
export function recipeFor(sel: IngredientId[]): Recipe {
  const t = tally(sel)
  const legend = RECIPES[RECIPES.length - 1]
  if (legend.ok(t)) return legend.r
  return RECIPES.find(x => x.ok(t))?.r ?? BASIC
}

export type Grade = 'basic' | 'good' | 'great' | 'special'
export const GRADE_LABEL: Record<Grade, string> = { basic: '기본', good: '좋음', great: '매우 좋음', special: '스페셜' }

/** 재료 희귀도의 합이 클수록 요리 등급이 높다 (0 / 1~2 / 3~4 / 5 이상) */
export function gradeOf(sel: IngredientId[]): Grade {
  const sum = sel.reduce((a, id) => a + getIngredient(id).rarity, 0)
  return sum >= 5 ? 'special' : sum >= 3 ? 'great' : sum >= 1 ? 'good' : 'basic'
}

/** 포켓몬 희귀도 1~3이 나올 가중치 (4는 요리로 나오지 않는다) */
export const RARITY_WEIGHTS: Record<Grade, [number, number, number]> = {
  basic: [88, 12, 0],
  good: [66, 29, 5],
  great: [48, 38, 14],
  special: [30, 45, 25],
}

export function attractPool(recipe: Recipe): Species[] {
  return SPECIES.filter(s => s.rarity <= 3 && s.types.some(t => recipe.types.includes(t)))
}

/** 요리를 해서 찾아오는 포켓몬을 뽑는다 */
export function cook(sel: IngredientId[], rng: Rng = Math.random): Species {
  const pool = attractPool(recipeFor(sel))
  const w = RARITY_WEIGHTS[gradeOf(sel)]
  // 풀에 존재하는 희귀도만으로 가중치를 다시 계산
  const avail = ([1, 2, 3] as const).filter(r => pool.some(s => s.rarity === r) && w[r - 1] > 0)
  const total = avail.reduce((a, r) => a + w[r - 1], 0)
  let roll = rng() * total
  let pick = avail[avail.length - 1]
  for (const r of avail) {
    roll -= w[r - 1]
    if (roll < 0) { pick = r; break }
  }
  const cands = pool.filter(s => s.rarity === pick)
  return cands[Math.floor(rng() * cands.length)]
}
