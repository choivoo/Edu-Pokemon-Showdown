import { useGame } from '../../store/gameStore'
import { SPECIES } from '../../lib/roster'
import { frontSprite } from '../../data/sprites'
import TypeBadge from '../../components/TypeBadge'
import { RARITY_STARS } from '../../components/MonCard'

export default function DexTab() {
  const { save } = useGame()
  const sorted = [...SPECIES].sort((a, b) => a.id - b.id)
  return (
    <div className="space-y-3 p-3">
      <p className="text-sm text-yellow-300">📖 도감 {save.dex.length}/{SPECIES.length}</p>
      <div className="grid grid-cols-3 gap-2">
        {sorted.map(sp => {
          const seen = save.dex.includes(sp.id)
          return (
            <div key={sp.id} className="flex flex-col items-center rounded border-4 border-[#555577] bg-[#2b2b45] p-1">
              <img src={frontSprite(sp.id)} alt="" loading="lazy" className="sprite h-14 w-14" style={seen ? undefined : { filter: 'brightness(0) opacity(0.5)' }} />
              <span className="text-[11px]">{seen ? sp.name : '???'}</span>
              <span className="text-[9px] text-yellow-200">{seen ? RARITY_STARS[sp.rarity] : ' '}</span>
              <div className="flex gap-0.5">{seen && sp.types.map(t => <TypeBadge key={t} type={t} />)}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
