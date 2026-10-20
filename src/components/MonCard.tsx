import type { OwnedMon } from '../lib/stats'
import { computeStats, powerRating } from '../lib/stats'
import { getSpecies } from '../lib/roster'
import { frontSprite } from '../data/sprites'
import TypeBadge from './TypeBadge'
import type { Stone } from '../lib/stats'

export const RARITY_STARS = ['', '★', '★★', '★★★', '✦']

interface Props { mon: OwnedMon; stones: Stone[]; selected?: boolean; badge?: string; onClick?: () => void }

export default function MonCard({ mon, stones, selected, badge, onClick }: Props) {
  const sp = getSpecies(mon.species)
  const equipped = mon.stones.map(id => stones.find(s => s.id === id)).filter(Boolean) as Stone[]
  const power = powerRating(computeStats(sp, mon.level, equipped))
  return (
    <button onClick={onClick} className={`pixel-btn relative flex flex-col items-center rounded border-4 p-1 ${selected ? 'border-yellow-300 bg-[#44446a]' : 'border-[#555577] bg-[#2b2b45]'}`}>
      {badge && <span className="absolute left-1 top-1 rounded bg-yellow-300 px-1 text-[10px] font-bold text-black">{badge}</span>}
      <span className="absolute right-1 top-1 text-[9px] text-yellow-200">{RARITY_STARS[sp.rarity]}</span>
      <img src={frontSprite(sp.id)} alt={sp.name} loading="lazy" className="sprite h-16 w-16" />
      <span className="text-[11px]">{sp.name}</span>
      <span className="text-[10px] text-gray-300">Lv{mon.level} · ⚔{power}</span>
      <div className="mt-0.5 flex flex-wrap justify-center gap-0.5">{sp.types.map(t => <TypeBadge key={t} type={t} />)}</div>
    </button>
  )
}
