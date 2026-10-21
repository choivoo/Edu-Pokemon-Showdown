import { useEffect, useState } from 'react'
import { useGame } from '../store/gameStore'
import { BATTERY_MAX, batteryNow, formatMs } from '../lib/battery'
import Icon from './Icon'

/** 배터리 5칸 + 다음 충전까지 남은 시간 */
export default function BatteryMeter({ compact = false, dark = false }: { compact?: boolean; dark?: boolean }) {
  const battery = useGame(s => s.save.battery)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])
  const v = batteryNow(battery, now)
  return (
    <span className="inline-flex items-center gap-1" title="탐험 한 번에 배터리 1개를 써요. 30분마다 1개씩 충전돼요.">
      {Array.from({ length: BATTERY_MAX }, (_, i) => <Icon key={i} n={i < v.n ? 'battery' : 'batteryEmpty'} s={compact ? 20 : 26} />)}
      {v.n < BATTERY_MAX && <span className={`ml-1 text-sm font-bold ${dark ? 'text-[#c06a00]' : 'text-yellow-200'}`}>{formatMs(v.nextMs)}</span>}
    </span>
  )
}

export const useBattery = () => {
  const battery = useGame(s => s.save.battery)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])
  return batteryNow(battery, now)
}
