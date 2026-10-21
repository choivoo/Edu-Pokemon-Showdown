// P애뮬릿: 3x3의 파워스톤 소켓 9칸. 과거 팬 에디션의 다칸 스톤은 저장 호환용으로 허용.
export type StoneKind = 'hp' | 'atk' | 'def' | 'spd' | 'crit'
export type ShapeId = 'dot' | 'bar2' | 'bar3' | 'ell'

export type StoneEffectKind = 'critRate' | 'critDmg' | 'hitHealing' | 'naturalHealing' | 'waveHealing' | 'moveSpeed'
export const STONE_EFFECTS: Record<StoneEffectKind, string> = {
  critRate: '급소 확률', critDmg: '급소 피해', hitHealing: '공격 시 회복',
  naturalHealing: '자연 회복', waveHealing: '웨이브 회복', moveSpeed: '이동 속도',
}
/** Current reward stones use a flat HP/ATK value and up to three extra effects.
 * Optional fields preserve all v1/v2 legacy stone and encrypted save data. */
export interface Stone {
  id: string; kind: StoneKind; star: 1 | 2 | 3; shape: ShapeId
  value?: number
  effects?: Partial<Record<StoneEffectKind, number>>
}
export interface Placement { stone: string; x: number; y: number; rot: number }

export const GRID_W = 3
export const GRID_H = 3

export const STONE_INFO: Record<StoneKind, { name: string; icon: string; desc: string; color: string; per: number }> = {
  hp: { name: '체력석', icon: 'heart', desc: '체력', color: '#e0505a', per: 0.06 },
  atk: { name: '공격석', icon: 'sword', desc: '공격', color: '#f08a30', per: 0.05 },
  def: { name: '방어석', icon: 'shield', desc: '방어', color: '#4a8fe0', per: 0.05 },
  spd: { name: '속도석', icon: 'boots', desc: '속도', color: '#43b97a', per: 0.05 },
  crit: { name: '급소석', icon: 'target', desc: '급소 확률', color: '#b061d8', per: 0.025 },
}
export const STONE_KINDS = Object.keys(STONE_INFO) as StoneKind[]

export const SHAPES: Record<ShapeId, [number, number][]> = {
  dot: [[0, 0]],
  bar2: [[0, 0], [1, 0]],
  bar3: [[0, 0], [1, 0], [2, 0]],
  ell: [[0, 0], [0, 1], [1, 1]],
}
/** 드롭 확률 가중치 */
export const SHAPE_WEIGHTS: [ShapeId, number][] = [['dot', 100]]

/** 90도씩 rot번 회전한 칸 좌표 (좌상단 기준으로 정규화) */
export function cellsOf(shape: ShapeId, rot: number): [number, number][] {
  let cells = SHAPES[shape].map(([x, y]) => [x, y] as [number, number])
  for (let r = 0; r < ((rot % 4) + 4) % 4; r++) cells = cells.map(([x, y]) => [-y, x])
  const mx = Math.min(...cells.map(c => c[0]))
  const my = Math.min(...cells.map(c => c[1]))
  return cells.map(([x, y]) => [x - mx, y - my])
}

/** 레벨이 오를수록 해금되는 칸 (중앙에서 바깥쪽으로) */
const UNLOCK_ORDER: [number, number][] = [[1, 1], [1, 0], [0, 1], [2, 1], [1, 2], [0, 0], [2, 0], [0, 2], [2, 2]]
/** Progressively open nine slots. New players start with one open socket. */
export const unlockedCount = (level: number) => Math.min(UNLOCK_ORDER.length, 1 + Math.floor((Math.max(1, level) - 1) / 10))
export const unlockedSet = (level: number): Set<string> => new Set(UNLOCK_ORDER.slice(0, unlockedCount(level)).map(([x, y]) => `${x},${y}`))

/** 배치된 칸 → 배치 인덱스 */
export function occupancy(placements: Placement[], stones: Stone[]): Map<string, number> {
  const m = new Map<string, number>()
  placements.forEach((p, i) => {
    const s = stones.find(x => x.id === p.stone)
    if (!s) return
    for (const [cx, cy] of cellsOf(s.shape, p.rot)) m.set(`${p.x + cx},${p.y + cy}`, i)
  })
  return m
}

export function canPlace(level: number, occ: Map<string, number>, shape: ShapeId, rot: number, x: number, y: number): boolean {
  const open = unlockedSet(level)
  return cellsOf(shape, rot).every(([cx, cy]) => {
    const k = `${x + cx},${y + cy}`
    return open.has(k) && !occ.has(k)
  })
}

/** 놓을 수 있는 첫 위치를 찾는다 (자동 배치) */
export function findSpot(level: number, occ: Map<string, number>, shape: ShapeId): { x: number; y: number; rot: number } | null {
  for (let rot = 0; rot < 4; rot++) for (let y = 0; y < GRID_H; y++) for (let x = 0; x < GRID_W; x++) if (canPlace(level, occ, shape, rot, x, y)) return { x, y, rot }
  return null
}

export const stoneCells = (s: Stone) => SHAPES[s.shape].length
export const stoneName = (s: Stone) =>
  `${STONE_INFO[s.kind].name} ${s.star}성${s.value !== undefined ? ' +' + s.value : ''}`

/** Each freshly recruited Pokémon receives a stable, individual 3×3 socket pattern.
 * Central slot always accepts either HP or ATK; the others are randomized.
 * Pattern is derived from the individual save ID so no extra data needs storing. */
export type SocketKind = 'atk' | 'hp' | 'both'
export function socketKind(monId: string, species: number, x: number, y: number): SocketKind {
  if (x < 0 || x >= GRID_W || y < 0 || y >= GRID_H) return 'both'
  if (x === 1 && y === 1) return 'both'
  const seed = `${monId}:${species}:${x},${y}`
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  const n = (h >>> 0) % 9
  return n < 3 ? 'both' : n < 6 ? 'hp' : 'atk'
}
export function socketAccepts(monId: string, species: number, kind: StoneKind, shape: ShapeId, x: number, y: number, rot: number): boolean {
  // Existing fan-made DEF/SPD/CRIT stones can still be used in shared sockets.
  return cellsOf(shape, rot).every(([dx, dy]) => {
    const socket = socketKind(monId, species, x + dx, y + dy)
    return socket === 'both' || socket === kind || !['hp', 'atk'].includes(kind)
  })
}
/** 같은 종류·모양·별 2개를 합성하면 별 +1 (최대 3). 비용은 별 × 칸 수 × 40 코인 */
export const mergeCost = (s: Pick<Stone, 'star' | 'shape'>) => s.star * SHAPES[s.shape].length * 40
