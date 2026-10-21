// 배터리: 탐험 한 번에 1개를 쓰고, 시간이 지나면 하나씩 다시 채워진다. (원작: 기본 5개, 30분에 1개 충전)
export const BATTERY_MAX = 5
export const RECHARGE_MS = 30 * 60 * 1000

export interface Battery { n: number; at: number }

export const freshBattery = (now: number): Battery => ({ n: BATTERY_MAX, at: now })

export interface BatteryView { n: number; /** 다음 1개가 찰 때까지 남은 시간(ms). 가득 차 있으면 0 */ nextMs: number }

/** 지금 시각 기준의 배터리 상태 (저장값 + 지난 시간만큼 충전) */
export function batteryNow(b: Battery, now: number): BatteryView {
  if (b.n >= BATTERY_MAX) return { n: BATTERY_MAX, nextMs: 0 }
  const elapsed = Math.max(0, now - b.at)
  const gained = Math.floor(elapsed / RECHARGE_MS)
  const n = Math.min(BATTERY_MAX, b.n + gained)
  if (n >= BATTERY_MAX) return { n, nextMs: 0 }
  return { n, nextMs: RECHARGE_MS - (elapsed - gained * RECHARGE_MS) }
}

/** 시간이 지나 쌓인 충전분을 저장값에 반영한 새 상태 */
export function settle(b: Battery, now: number): Battery {
  const v = batteryNow(b, now)
  if (v.n >= BATTERY_MAX) return { n: BATTERY_MAX, at: now }
  const gained = v.n - b.n
  return { n: v.n, at: b.at + gained * RECHARGE_MS }
}

/** 배터리 1개 사용. 없으면 null */
export function consume(b: Battery, now: number): Battery | null {
  const s = settle(b, now)
  if (s.n <= 0) return null
  // 가득 찬 상태에서 쓰면 그 시점부터 충전을 센다
  return { n: s.n - 1, at: b.n >= BATTERY_MAX && s.n >= BATTERY_MAX ? now : s.at }
}

/** 코인 등으로 배터리 충전 (최대치까지) */
export function charge(b: Battery, now: number, amount: number): Battery {
  const s = settle(b, now)
  const n = Math.min(BATTERY_MAX, s.n + amount)
  return { n, at: n >= BATTERY_MAX ? now : s.at }
}

export function formatMs(ms: number): string {
  const s = Math.ceil(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
