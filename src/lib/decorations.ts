/**
 * Pokémon Quest-inspired PM Ticket decorations. Prices and core effects are
 * adapted from the original free-to-play Poké Mart, never real-money DLC.
 * A purchased item's passive effect applies even if it is not on display.
 */
import type { IngredientId } from './cooking'
import type { SaveData } from './storage'

export const MEMBER_REWARD_MS = 22 * 60 * 60 * 1000
export const MEMBER_REWARD_TICKETS = 50

export const DECORATIONS = [
  { id: 'flareonCushion', name: '부스터 쿠션', tickets: 50, effect: '빨강 재료 ×1.5', color: 'red', multiplier: 1.5 },
  { id: 'charizardTorch', name: '리자몽 횃불', tickets: 300, effect: '빨강 재료 ×2', color: 'red', multiplier: 2 },
  { id: 'vaporeonCushion', name: '샤미드 쿠션', tickets: 50, effect: '파랑 재료 ×1.5', color: 'blue', multiplier: 1.5 },
  { id: 'blastoiseFountain', name: '거북왕 분수', tickets: 300, effect: '파랑 재료 ×2', color: 'blue', multiplier: 2 },
  { id: 'jolteonCushion', name: '쥬피썬더 쿠션', tickets: 50, effect: '노랑 재료 ×1.5', color: 'yellow', multiplier: 1.5 },
  { id: 'venusaurPlanter', name: '이상해꽃 화분', tickets: 300, effect: '노랑 재료 ×2', color: 'yellow', multiplier: 2 },
  { id: 'dodrioTent', name: '두트리오 텐트', tickets: 50, effect: '회색 재료 ×1.5', color: 'gray', multiplier: 1.5 },
  { id: 'taurosMachine', name: '켄타로스 장난감', tickets: 300, effect: '회색 재료 ×2', color: 'gray', multiplier: 2 },
  { id: 'bulbasaurFlag', name: '이상해씨 깃발', tickets: 150, effect: '레벨 특훈 경험치 ×1.5', multiplier: 1.5 },
  { id: 'fearowVane', name: '깨비드릴조 풍향계', tickets: 500, effect: '레벨 특훈 경험치 ×2', multiplier: 2 },
  { id: 'charmanderFlag', name: '파이리 깃발', tickets: 200, effect: '기술 특훈 성공률 ×1.5', multiplier: 1.5 },
  { id: 'dittoBalloon', name: '메타몽 풍선', tickets: 700, effect: '기술 특훈 성공률 ×2', multiplier: 2 },
  { id: 'squirtleFlag', name: '꼬부기 깃발', tickets: 100, effect: '스톤 재활용 재료 ×1.5', multiplier: 1.5 },
  { id: 'meowthBalloon', name: '나옹 풍선', tickets: 400, effect: '스톤 재활용 재료 ×2', multiplier: 2 },
  { id: 'victreebelBag', name: '우츠보트 골프백', tickets: 200, effect: '기술 2개인 포켓몬 출현율 ×1.5', multiplier: 1.5 },
  { id: 'kangaskhanChair', name: '캥카 흔들의자', tickets: 800, effect: '기술 2개인 포켓몬 출현율 ×2', multiplier: 2 },
  { id: 'pikachuSurfboard', name: '피카츄 서핑보드', tickets: 400, effect: '요리로 여러 마리 방문 확률 ×1.5', multiplier: 1.5 },
  { id: 'mewtwoArch', name: '뮤츠 아치', tickets: 700, effect: '배터리 최대치 +1', multiplier: 1 },
] as const

export type DecorationId = typeof DECORATIONS[number]['id']
export const buyableDecoration = (id: string) => DECORATIONS.find(item => item.id === id)

export function memberRewardReady(s: Pick<SaveData, 'ticketClaimedAt'>, now = Date.now()): boolean {
  return !s.ticketClaimedAt || now - s.ticketClaimedAt >= MEMBER_REWARD_MS
}
export function memberRewardWait(s: Pick<SaveData, 'ticketClaimedAt'>, now = Date.now()): number {
  return memberRewardReady(s, now) ? 0 : MEMBER_REWARD_MS - (now - s.ticketClaimedAt)
}
export function ownedMultiplier(owned: readonly string[], ids: readonly string[]): number {
  return Math.max(1, ...DECORATIONS.filter(x => owned.includes(x.id) && ids.includes(x.id)).map(x => x.multiplier))
}
const COLOR_DECOR: Record<string, string[]> = {
  red: ['flareonCushion','charizardTorch'],
  blue: ['vaporeonCushion','blastoiseFountain'],
  yellow: ['jolteonCushion','venusaurPlanter'],
  gray: ['dodrioTent','taurosMachine'],
}
const INGREDIENT_COLOR: Record<IngredientId, string | null> = {
  mushroomRed: 'red', berryBlue: 'blue', nutYellow: 'yellow', fossil: 'gray',
  rootRed: 'red', rockBlue: 'blue', honey: 'yellow', mushroomGray: 'gray',
  rainbow: null, shell: null,
}
export function ingredientBonus(id: IngredientId, amount: number, owned: readonly string[]): number {
  const color = INGREDIENT_COLOR[id]
  return color ? Math.ceil(amount * ownedMultiplier(owned, COLOR_DECOR[color])) : amount
}
export const trainingExpBonus = (owned: readonly string[]) =>
  ownedMultiplier(owned, ['bulbasaurFlag','fearowVane'])
export const moveSuccessBonus = (owned: readonly string[]) =>
  ownedMultiplier(owned, ['charmanderFlag','dittoBalloon'])
export const recycledIngredientBonus = (owned: readonly string[]) =>
  ownedMultiplier(owned, ['squirtleFlag','meowthBalloon'])
export const multipleMoveBonus = (owned: readonly string[]) => ownedMultiplier(owned,['victreebelBag','kangaskhanChair'])
export const multipleCookingBonus = (owned: readonly string[]) => ownedMultiplier(owned,['pikachuSurfboard'])
export const maxBatteryBonus = (owned: readonly string[]) => owned.includes('mewtwoArch') ? 1 : 0
