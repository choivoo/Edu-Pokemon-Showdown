// 기술스톤: 포켓몬의 필살기에 장착하는 스톤. 한 마리당 3칸. (원작 기술스톤을 이 게임 규칙에 맞게 옮김)
export type MoveStoneKind = 'quick' | 'repeat' | 'widen' | 'multiply' | 'bond' | 'lasting'
export interface MoveStone { id: string; kind: MoveStoneKind }

export const MOVE_SLOTS = 3

export const MOVE_STONE_INFO: Record<MoveStoneKind, { name: string; icon: string; desc: string; detail: string; color: string }> = {
  quick: { name: '빨리쏘기스톤', icon: 'msQuick', desc: '대기시간 -5%', detail: '필살기를 다시 쓸 수 있을 때까지의 시간이 5% 줄어요.', color: '#f5c518' },
  repeat: { name: '리피트스톤', icon: 'msRepeat', desc: '한 번 더 / 대기시간 +50%', detail: '필살기를 연달아 한 번 더 쓰지만, 대기시간이 50% 늘어요.', color: '#e0505a' },
  widen: { name: '넓히기스톤', icon: 'msWiden', desc: '공격 범위 +', detail: '필살기의 범위가 넓어져요. 한 명만 맞히던 필살기는 주변까지 번져요.', color: '#4a8fe0' },
  multiply: { name: '늘리기스톤', icon: 'msMultiply', desc: '타수 +1 / 위력 -15%', detail: '필살기가 가까운 적 한 명을 더 맞혀요. (범위기는 한 번 더 때려요) 위력은 15% 줄어요.', color: '#43b97a' },
  bond: { name: '결속스톤', icon: 'msBond', desc: '동료에게 기합 공유', detail: '필살기를 쓸 때 얻는 공격력 기합을 동료도 25%씩 나눠 받아요.', color: '#b061d8' },
  lasting: { name: '오래가기스톤', icon: 'msLasting', desc: '기합 시간 +25%', detail: '필살기로 얻는 공격력 기합이 25% 더 오래 가요.', color: '#ff9a3c' },
}
export const MOVE_STONE_KINDS = Object.keys(MOVE_STONE_INFO) as MoveStoneKind[]

export type MoveFx = Record<MoveStoneKind, number>
export const NO_FX: MoveFx = { quick: 0, repeat: 0, widen: 0, multiply: 0, bond: 0, lasting: 0 }

export function moveFx(stones: MoveStone[]): MoveFx {
  const fx = { ...NO_FX }
  for (const s of stones) fx[s.kind]++
  return fx
}

/** 필살기를 쓸 때 몸에 붙는 공격력 기합 (모든 포켓몬 공통) */
export const SPIRIT_ATK = 0.15
export const SPIRIT_SECONDS = 4
