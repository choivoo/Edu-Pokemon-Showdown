import { useGame } from '../../store/gameStore'
import { INGREDIENTS } from '../../lib/cooking'
import { mergeCost, STONE_INFO, STONE_KINDS } from '../../lib/stats'
import { sfx } from '../../lib/sound'

export default function ShopTab() {
  const { save, buyIngredient, mergeStones } = useGame()
  const equipped = new Set(save.owned.flatMap(o => o.stones))
  const free = save.stones.filter(s => !equipped.has(s.id))

  return (
    <div className="space-y-3 p-3">
      <div className="pixel-box space-y-2 p-3">
        <p className="text-sm text-yellow-300">🧺 재료 상점</p>
        {INGREDIENTS.map(i => (
          <div key={i.id} className="flex items-center gap-2 text-[12px]">
            <span className="text-xl">{i.emoji}</span>
            <span className="flex-1">{i.name} <span className="text-gray-400">보유 {save.ingredients[i.id]}</span></span>
            {[1, 5].map(q => (
              <button key={q} disabled={save.coins < i.price * q} onClick={() => { if (buyIngredient(i.id, q)) sfx.coin() }} className="pixel-btn rounded border-2 border-white px-2 py-1 text-[11px]">
                ×{q} 🪙{i.price * q}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="pixel-box space-y-2 p-3">
        <p className="text-sm text-yellow-300">💠 파워스톤 합성</p>
        <p className="text-[11px] text-gray-300">장착하지 않은 같은 종류·같은 별의 스톤 2개를 합치면 별이 1개 늘어요. (별 × 50 코인)</p>
        {STONE_KINDS.flatMap(kind => ([1, 2] as const).map(star => {
          const n = free.filter(s => s.kind === kind && s.star === star).length
          if (n === 0) return null
          return (
            <div key={`${kind}${star}`} className="flex items-center gap-2 text-[12px]">
              <span className="flex-1">{STONE_INFO[kind].emoji} {STONE_INFO[kind].name} {'★'.repeat(star)} ×{n}</span>
              <button disabled={n < 2 || save.coins < mergeCost(star)} onClick={() => { if (mergeStones(kind, star)) sfx.levelup() }} className="pixel-btn rounded border-2 border-white px-2 py-1 text-[11px]">
                합성 🪙{mergeCost(star)}
              </button>
            </div>
          )
        }))}
        {free.length === 0 && <p className="text-[11px] text-gray-400">장착하지 않은 스톤이 없어요.</p>}
      </div>
    </div>
  )
}
