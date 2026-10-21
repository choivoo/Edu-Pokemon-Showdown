import type { PokemonType, Rng, Species } from '../types'
import { SPECIES } from './roster'
import { EVOLUTION_ONLY } from './evolution'
import { questStats } from '../data/questSpecies'
import { verifiedRecipeOdds } from '../data/verifiedRecipeOdds'
import { QUEST_DISH_NAMES, ATTRACTABLE_SOURCE_SPECIES, attractionWeight } from '../data/questAttractionWeights'

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
  { id: 'rootRed', name: '큰뿌리', icon: 'rootRed', color: 'red', texture: 'soft', kind: 'plant', rarity: 1, price: 28 },
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
/** Original-style exploration countdown for each pot grade. */
export type CookingTier = 0 | 1 | 2 | 3
export const COOKING_TIERS = [
  { name: '기본 냄비', perSlot: 3, minLevel: 5, unlockArea: -1 },
  { name: '동 냄비', perSlot: 10, minLevel: 20, unlockArea: 8 },
  { name: '은 냄비', perSlot: 15, minLevel: 40, unlockArea: 11 },
  { name: '금 냄비', perSlot: 20, minLevel: 70, unlockArea: 16 },
] as const
/** Cooking duration depends on ingredient quality and pot material. */
export const COOKING_DURATIONS = [
  { basic: 2, good: 4, great: 5, special: 6 },
  { basic: 2, good: 4, great: 5, special: 6 },
  { basic: 3, good: 5, great: 6, special: 7 },
  { basic: 4, good: 6, great: 7, special: 8 },
] as const
export const cookingExpeditions = (sel: IngredientId[], tier: CookingTier = 0): number =>
  COOKING_DURATIONS[tier][gradeOf(sel)] + (sel.includes('shell') ? 1 : 0)

/** Count actual ingredient properties. Rainbow matter has NO colour/texture/material tag in Quest; it only upgrades dish quality. */
export interface Tally { color: Record<Color, number>; texture: Record<Texture, number>; kind: Record<Kind | 'mystic', number> }
export function tally(sel: IngredientId[]): Tally {
  const t: Tally = {
    color: { red: 0, blue: 0, yellow: 0, gray: 0 },
    texture: { soft: 0, hard: 0 },
    kind: { mushroom: 0, sweet: 0, plant: 0, mineral: 0, mystic: 0 },
  }
  for (const id of sel) {
    const i = getIngredient(id)
    for (const c of Object.keys(t.color) as Color[]) if (i.color === c) t.color[c]++
    for (const x of Object.keys(t.texture) as Texture[]) if (i.texture === x) t.texture[x]++
    for (const k of Object.keys(t.kind) as (Kind | 'mystic')[]) if (i.kind === k) t.kind[k]++
  }
  return t
}

/** 듬뿍 = 4개 이상, 많이 = 3개 이상, 조금 = 1개 이상 */
const PLENTY = 4, MANY = 3

export interface Recipe { no: number; name: string; types: PokemonType[]; hint: string }

const ALL_TYPES: PokemonType[] = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy']

/** 18가지 레시피. 번호가 낮은 것이 먼저 적용되고, 아무것도 맞지 않으면 1번(별모래 수프) */
const RECIPES: { r: Recipe; ok: (t: Tally) => boolean }[] = [
  { r: { no: 2, name: '레드네모루루스튜', types: ['fire', 'fighting', 'dragon'], hint: '빨간 재료 듬뿍' }, ok: t => t.color.red >= PLENTY },
  { r: { no: 3, name: '블루네모루루쥬스', types: ['water', 'ice'], hint: '파란 재료 듬뿍' }, ok: t => t.color.blue >= PLENTY },
  { r: { no: 4, name: '옐로네모루루카레', types: ['normal', 'bug', 'electric'], hint: '노란 재료 듬뿍' }, ok: t => t.color.yellow >= PLENTY },
  { r: { no: 5, name: '화이트네모루루그라탕', types: ['rock', 'ground', 'steel'], hint: '회색 재료 듬뿍' }, ok: t => t.color.gray >= PLENTY },
  { r: { no: 6, name: '네모루루워터카우다', types: ['water', 'ice'], hint: '부드러운 재료 듬뿍 + 파란 재료 많이' }, ok: t => t.texture.soft >= PLENTY && t.color.blue >= MANY },
  { r: { no: 7, name: '네모루루실크레이프', types: ['normal', 'fairy'], hint: '달콤한 재료 많이 + 회색 조금' }, ok: t => t.kind.sweet >= MANY && t.color.gray >= 2 },
  { r: { no: 8, name: '네모루루오물단팥죽', types: ['poison', 'ghost'], hint: '버섯 듬뿍 + 부드러운 재료 많이' }, ok: t => t.kind.mushroom >= PLENTY && t.texture.soft >= MANY },
  { r: { no: 9, name: '네모루루클레이차우더', types: ['ground', 'rock'], hint: '부드러운 재료 많이 + 광물 조금' }, ok: t => t.texture.soft >= MANY && t.kind.mineral >= 2 },
  { r: { no: 10, name: '네모루루건강스무디', types: ['grass', 'bug'], hint: '식물 듬뿍 + 부드러운 재료 조금' }, ok: t => t.kind.plant >= PLENTY && t.texture.soft >= 2 },
  { r: { no: 11, name: '네모루루허니퐁듀', types: ['bug', 'poison'], hint: '달콤한 재료 듬뿍 + 노란 재료 많이' }, ok: t => t.kind.sweet >= PLENTY && t.color.yellow >= MANY },
  { r: { no: 12, name: '네모루루염력자오로스', types: ['psychic', 'fairy', 'dark'], hint: '달콤한 재료 많이 + 딱딱한 재료 조금' }, ok: t => t.kind.sweet >= MANY && t.texture.hard >= 2 },
  { r: { no: 13, name: '네모루루암석찜', types: ['rock', 'steel', 'ground'], hint: '딱딱한 재료 듬뿍 + 광물 조금' }, ok: t => t.texture.hard >= PLENTY && t.kind.mineral >= 2 },
  { r: { no: 14, name: '네모루루윈도리아', types: ['flying', 'dragon'], hint: '광물 많이 + 식물 조금' }, ok: t => t.kind.mineral >= MANY && t.kind.plant >= 2 },
  { r: { no: 15, name: '네모루루파이야베스', types: ['fire', 'dragon'], hint: '버섯 많이 + 빨간 재료 조금' }, ok: t => t.kind.mushroom >= MANY && t.color.red >= 2 },
  { r: { no: 16, name: '네모루루찌리리조또', types: ['electric', 'steel'], hint: '부드러운 재료 듬뿍 + 노란 재료 많이' }, ok: t => t.texture.soft >= PLENTY && t.color.yellow >= MANY },
  { r: { no: 17, name: '네모루루머슬오레', types: ['fighting', 'dark'], hint: '달콤한 재료 많이 + 버섯 조금' }, ok: t => t.kind.sweet >= MANY && t.kind.mushroom >= 2 },
  { r: { no: 18, name: '네모루루레전드수프', types: ALL_TYPES, hint: '신비로운 재료 듬뿍' }, ok: t => t.kind.mystic >= PLENTY },
]
const BASIC: Recipe = { no: 1, name: '네모루루수프', types: ALL_TYPES, hint: '아무 재료나' }

export const ALL_RECIPES: Recipe[] = [BASIC, ...RECIPES.map(x => x.r)].sort((a, b) => a.no - b.no)

/** Game order: coloured/type dishes 2–17 first, then shell-only Ambrosia, lastly general stew. */
export function recipeFor(sel: IngredientId[]): Recipe {
  const t = tally(sel)
  const normalRecipe = RECIPES.slice(0, -1).find(x => x.ok(t))
  if (normalRecipe) return normalRecipe.r
  if (sel.includes('shell')) return RECIPES[RECIPES.length-1].r
  return BASIC
}

export type Grade = 'basic' | 'good' | 'great' | 'special'
export const GRADE_LABEL: Record<Grade, string> = { basic: '기본', good: '좋음', great: '매우 좋음', special: '스페셜' }

/** 재료 희귀도의 합이 클수록 요리 등급이 높다 (0 / 1~2 / 3~4 / 5 이상) */
export function gradeOf(sel: IngredientId[]): Grade {
  // Small=1, precious=2, Rainbow=3 and Mystical Shell=2.
  const points = sel.reduce((a, id) => a + (id === 'rainbow' ? 3 : id === 'shell' ? 2 : getIngredient(id).rarity === 0 ? 1 : 2), 0)
  return points >= 10 ? 'special' : points >= 8 ? 'great' : points >= 6 ? 'good' : 'basic'
}

/** 포켓몬 희귀도 1~3이 나올 가중치 (4는 요리로 나오지 않는다) */
export const RARITY_WEIGHTS: Record<Grade, [number, number, number]> = {
  basic: [88, 12, 0],
  good: [66, 29, 5],
  great: [48, 38, 14],
  special: [30, 45, 25],
}

export const LEGENDARY_SPECIES = [144, 145, 146, 150, 151] as const
export function attractPool(recipe: Recipe): Species[] {
  if (recipe.no === 18) return SPECIES.filter(s => LEGENDARY_SPECIES.includes(s.id as typeof LEGENDARY_SPECIES[number]))
  return SPECIES.filter(s => s.rarity <= 3 && !EVOLUTION_ONLY.has(s.id) && !LEGENDARY_SPECIES.includes(s.id as typeof LEGENDARY_SPECIES[number]) && s.types.some(t => recipe.types.includes(t)))
}

/**
 * Species-level recipe odds table. Normal stages use the observed relative
 * rarity bucket and per-species normalized numerical affinities. Until the
 * entire retail datamine is independently verified, these are explicitly
 * ESTIMATES, never advertised as official original spawn percentages.
 */
export interface AttractionOdds { species: Species; probability: number; weight: number }
export function attractionOdds(sel: IngredientId[]): AttractionOdds[] {
  const recipe=recipeFor(sel)
  const verified=verifiedRecipeOdds(recipe.no,gradeOf(sel))
  if(verified) return verified.map(e=>({species:SPECIES.find(s=>s.id===e.id)!,weight:e.probability,probability:e.probability}))
  // Community-vetted species-by-dish weight tables fill missing published
  // recipe/grade pairs, rather than inventing species probabilities by type.
  const dish=QUEST_DISH_NAMES[recipe.no===1?0:recipe.no===18?17:recipe.no-1]
  if(dish){
    const rows=ATTRACTABLE_SOURCE_SPECIES.map(id=>({species:SPECIES.find(s=>s.id===id),weight:attractionWeight(id,dish,gradeOf(sel))}))
      .filter((r):r is {species:Species;weight:number}=>!!r.species&&r.weight>0)
    const sum=rows.reduce((n,r)=>n+r.weight,0)
    if(sum>0)return rows.map(r=>({...r,probability:r.weight/sum}))
  }
  const pool=attractPool(recipe)
  if (!pool.length) return []
  if (recipe.no===18) {
    const shells=sel.filter(x=>x==='shell').length
    const weights=pool.map(p=>p.id===150||p.id===151 ? (shells>1 ? 2 : 1) : 3)
    const total=weights.reduce((a,b)=>a+b,0)
    return pool.map((species,i)=>({species,weight:weights[i],probability:weights[i]/total}))
  }
  const rarity=RARITY_WEIGHTS[gradeOf(sel)]
  const groups=([1,2,3] as const).filter(x=>pool.some(p=>p.rarity===x)&&rarity[x-1]>0)
  const rarityTotal=groups.reduce((n,k)=>n+rarity[k-1],0)
  const odds:AttractionOdds[]=[]
  for (const r of groups) {
    const candidates=pool.filter(s=>s.rarity===r)
    const weights=candidates.map(s=>{
      const q=questStats(s.id)
      const strength=q ? (q.hp+q.atk)/2 : 400
      const flavor=1+((s.id*37)%9)*.025
      return (1/Math.sqrt(Math.max(100,strength))) * flavor
    })
    const groupTotal=weights.reduce((a,b)=>a+b,0)
    candidates.forEach((species,i)=>odds.push({species,weight:weights[i],probability:rarity[r-1]/rarityTotal*weights[i]/groupTotal}))
  }
  return odds
}
export function cook(sel: IngredientId[], rng: Rng = Math.random): Species {
  const odds=attractionOdds(sel)
  let r=rng()
  for (const o of odds) {r-=o.probability;if(r<0)return o.species}
  return odds[odds.length-1].species
}
