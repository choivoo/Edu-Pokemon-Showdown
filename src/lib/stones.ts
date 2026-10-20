// 파워스톤: 포켓몬마다 있는 격자(4x3)에 모양이 다른 조각을 배치한다. (원작의 파워스톤 격자를 단순화)
export type StoneKind = 'hp' | 'atk' | 'def' | 'spd' | 'crit'
export type ShapeId = 'dot' | 'bar2' | 'bar3' | 'ell'

export interface Stone { id: string; kind: StoneKind; star: 1 | 2 | 3; shape: ShapeId }
export interface Placement { stone: string; x: number; y: number; rot: number }

export const GRID_W = 4
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
export const SHAPE_WEIGHTS: [ShapeId, number][] = [['dot', 50], ['bar2', 28], ['ell', 14], ['bar3', 8]]

/** 90도씩 rot번 회전한 칸 좌표 (좌상단 기준으로 정규화) */
export function cellsOf(shape: ShapeId, rot: number): [number, number][] {
  let cells = SHAPES[shape].map(([x, y]) => [x, y] as [number, number])
  for (let r = 0; r < ((rot % 4) + 4) % 4; r++) cells = cells.map(([x, y]) => [-y, x])
  const mx = Math.min(...cells.map(c => c[0]))
  const my = Math.min(...cells.map(c => c[1]))
  return cells.map(([x, y]) => [x - mx, y - my])
}

/** 레벨이 오를수록 해금되는 칸 (중앙에서 바깥쪽으로) */
const UNLOCK_ORDER: [number, number][] = [[1, 1], [2, 1], [1, 0], [2, 0], [1, 2], [2, 2], [0, 1], [3, 1], [0, 0], [3, 0], [0, 2], [3, 2]]
export const unlockedCount = (level: number) => Math.min(UNLOCK_ORDER.length, 4 + Math.floor((level - 1) / 5))
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
export const stoneName = (s: Stone) => `${STONE_INFO[s.kind].name} ${s.star}성`
/** 같은 종류·모양·별 2개를 합성하면 별 +1 (최대 3). 비용은 별 × 칸 수 × 40 코인 */
export const mergeCost = (s: Pick<Stone, 'star' | 'shape'>) => s.star * SHAPES[s.shape].length * 40
