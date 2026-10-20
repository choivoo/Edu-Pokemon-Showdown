import { useEffect, useState } from 'react'
import type { BattleState } from '../store/gameStore'
import { backSprite, frontSprite } from '../data/sprites'
import HpBar from './HpBar'

export function Typewriter({ text }: { text: string }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    setN(0)
    const t = setInterval(() => setN(v => (v >= text.length ? (clearInterval(t), v) : v + 1)), 30)
    return () => clearInterval(t)
  }, [text])
  return <span className={n >= text.length ? 'cursor' : ''}>{text.slice(0, n)}</span>
}

function animClass(b: BattleState, side: 'player' | 'enemy') {
  const a = b.anim
  if (!a || a.side !== side) return 'idle'
  if (a.kind === 'hit') return 'anim-hit'
  if (a.kind === 'faint') return 'anim-faint'
  return side === 'player' ? 'anim-attack-player' : 'anim-attack-enemy'
}

export default function BattleScene({ battle: b }: { battle: BattleState }) {
  const me = b.player[b.pi]
  const foe = b.enemy[b.ei]
  const dots = (team: typeof b.player) => (
    <div className="mt-1 flex gap-1">
      {team.map((m, i) => <span key={i} className={`h-2.5 w-2.5 rounded-full border border-black ${m.hp > 0 ? 'bg-red-500' : 'bg-gray-600'}`} />)}
    </div>
  )
  return (
    <div className="relative h-full overflow-hidden" style={{ background: 'linear-gradient(#8fd3ff 0%, #d7f0ff 45%, #8bd06a 45%, #5fa84a 100%)' }}>
      {/* 상대 */}
      <div className="absolute left-3 top-3">
        <HpBar name={foe.name} level={foe.level} hp={foe.hp} maxHp={foe.maxHp} status={foe.status} />
        {dots(b.enemy)}
      </div>
      <img
        key={`foe-${foe.id}-${b.ei}-${b.anim?.key ?? 0}`} src={frontSprite(foe.id)} alt={foe.name}
        className={`sprite absolute right-6 top-10 h-28 w-28 ${animClass(b, 'enemy')}`}
        style={{ width: 112, height: 112 }}
      />
      {/* 나 */}
      <img
        key={`me-${me.id}-${b.pi}-${b.anim?.key ?? 0}`} src={backSprite(me.id)} alt={me.name}
        className={`sprite absolute bottom-3 left-6 ${animClass(b, 'player')}`}
        style={{ width: 128, height: 128 }}
      />
      <div className="absolute bottom-3 right-3">
        <HpBar name={me.name} level={me.level} hp={me.hp} maxHp={me.maxHp} showNumbers status={me.status} />
        {dots(b.player)}
      </div>
    </div>
  )
}
