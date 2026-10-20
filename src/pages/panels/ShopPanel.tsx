import { useGame } from '../../store/gameStore'
import { INGREDIENTS } from '../../lib/cooking'
import { mergeCost, type ShapeId, SHAPES, type StoneKind, STONE_INFO, STONE_KINDS } from '../../lib/stones'
import { usedStoneIds } from '../../lib/party'
import { Btn, Panel } from '../../ui/kit'
import { sfx } from '../../lib/sound'

const SHAPE_IDS = Object.keys(SHAPES) as ShapeId[]

export default function ShopPanel() {
  const { save, openPanel, buyIngredient, mergeStones } = useGame()
  const used = usedStoneIds(save)
  const free = save.stones.filter(s => !used.has(s.id))
  const groups = STONE_KINDS.flatMap(kind => SHAPE_IDS.flatMap(shape => ([1, 2] as const).map(star => ({ kind: kind as StoneKind, shape, star, n: free.filter(s => s.kind === kind && s.shape === shape && s.star === star).length })))).filter(g => g.n > 0)

  return (
    <Panel title="🛒 상점" onClose={() => openPanel(null)} w={880}>
      <p className="mb-2 text-right text-xl text-[#c06a00]">🪙 {save.coins}</p>
      <div className="flex gap-4" style={{ height: 340 }}>
        <div className="pq-inner scroll-thin flex-1 space-y-2 overflow-y-auto p-3">
          <p className="text-xl font-bold">🧺 재료 상점</p>
          {INGREDIENTS.map(i => (
            <div key={i.id} className="flex items-center gap-2 text-lg">
              <span className="text-3xl">{i.emoji}</span>
              <span className="flex-1">{i.name} <span className="text-sm text-[#a06a10]">보유 {save.ingredients[i.id]}</span></span>
              {[1, 5].map(q => (
                <Btn key={q} color="green" disabled={save.coins < i.price * q} onClick={() => { if (buyIngredient(i.id, q)) sfx.coin() }} quiet className="px-3 py-1 text-base">×{q} 🪙{i.price * q}</Btn>
              ))}
            </div>
          ))}
        </div>
        <div className="pq-inner scroll-thin flex-1 space-y-2 overflow-y-auto p-3">
          <p className="text-xl font-bold">💠 파워스톤 합성</p>
          <p className="text-sm leading-snug">격자에 놓지 않은 같은 종류·모양·별의 스톤 2개를 합치면 별이 1개 늘어요.</p>
          {groups.length === 0 && <p className="p-3 text-center text-base">합칠 수 있는 스톤이 없어요.</p>}
          {groups.map(g => (
            <div key={`${g.kind}${g.shape}${g.star}`} className="flex items-center gap-2 text-lg">
              <span className="flex-1" style={{ color: STONE_INFO[g.kind].color }}>{STONE_INFO[g.kind].emoji} {STONE_INFO[g.kind].name} {'★'.repeat(g.star)} <span className="text-sm text-[#5a3a00]">({SHAPES[g.shape].length}칸) ×{g.n}</span></span>
              <Btn color="blue" disabled={g.n < 2 || save.coins < mergeCost(g)} onClick={() => { if (mergeStones(g.kind, g.shape, g.star)) sfx.levelup() }} quiet className="px-3 py-1 text-base">합성 🪙{mergeCost(g)}</Btn>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  )
}
