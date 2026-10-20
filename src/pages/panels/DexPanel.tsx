import { useGame } from '../../store/gameStore'
import { SPECIES } from '../../lib/roster'
import { Panel, Portrait } from '../../ui/kit'
import TypeBadge from '../../components/TypeBadge'

const RARITY = ['', '★', '★★', '★★★', '✦']

export default function DexPanel() {
  const { save, openPanel } = useGame()
  const list = [...SPECIES].sort((a, b) => a.id - b.id)
  return (
    <Panel title={`📖 포켓몬 도감 ${save.dex.length}/${SPECIES.length}`} onClose={() => openPanel(null)} w={880}>
      <div className="pq-inner scroll-thin grid grid-cols-6 content-start gap-2 overflow-y-auto p-3" style={{ height: 390 }}>
        {list.map(sp => {
          const seen = save.dex.includes(sp.id)
          return (
            <div key={sp.id} className="flex flex-col items-center rounded-lg bg-white/60 p-1 text-center">
              <Portrait id={sp.id} size={64} dim={!seen} />
              <span className="mt-1 text-base">{seen ? sp.name : '???'}</span>
              <span className="text-xs text-[#c06a00]">{seen ? RARITY[sp.rarity] : ' '}</span>
              <span className="flex gap-0.5">{seen && sp.types.map(t => <TypeBadge key={t} type={t} />)}</span>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
