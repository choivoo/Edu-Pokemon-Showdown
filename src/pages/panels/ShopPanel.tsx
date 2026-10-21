import { useGame } from '../../store/gameStore'
import { INGREDIENTS } from '../../lib/cooking'
import { mergeCost, type ShapeId, SHAPES, type StoneKind, STONE_INFO, STONE_KINDS } from '../../lib/stones'
import { usedStoneIds } from '../../lib/party'
import { Btn, Panel } from '../../ui/kit'
import Icon, { Coins, Stars } from '../../ui/Icon'
import { sfx } from '../../lib/sound'
import BatteryMeter, { useBattery } from '../../ui/BatteryMeter'
import { BATTERY_MAX } from '../../lib/battery'
import { BATTERY_FULL_COST, BATTERY_ONE_COST } from '../../store/gameStore'

const SHAPE_IDS = Object.keys(SHAPES) as ShapeId[]

export default function ShopPanel() {
  const { save, openPanel, buyIngredient, mergeStones, buyBattery } = useGame()
  const bat = useBattery()
  const used = usedStoneIds(save)
  const free = save.stones.filter(s => !used.has(s.id))
  const groups = STONE_KINDS.flatMap(kind => SHAPE_IDS.flatMap(shape => ([1, 2] as const).map(star => ({ kind: kind as StoneKind, shape, star, n: free.filter(s => s.kind === kind && s.shape === shape && s.star === star).length })))).filter(g => g.n > 0)

  return (
    <Panel title="상점" onClose={() => openPanel(null)} w={900}>
      <div className="pq-inner mb-2 flex items-center gap-3 p-2 text-lg">
        <span className="font-bold">배터리</span>
        <BatteryMeter dark />
        <span className="flex-1" />
        <Btn color="green" disabled={bat.n >= BATTERY_MAX || save.coins < BATTERY_ONE_COST} onClick={() => { if (buyBattery(false)) sfx.coin() }} quiet className="flex items-center gap-1 px-3 py-1 text-sm">1개 충전 <Icon n="coin" s={16} />{BATTERY_ONE_COST}</Btn>
        <Btn color="blue" disabled={bat.n >= BATTERY_MAX || save.coins < BATTERY_FULL_COST} onClick={() => { if (buyBattery(true)) sfx.coin() }} quiet className="flex items-center gap-1 px-3 py-1 text-sm">가득 충전 <Icon n="coin" s={16} />{BATTERY_FULL_COST}</Btn>
        <span className="text-xl text-[#c06a00]"><Coins n={save.coins} /></span>
      </div>
      <div className="flex gap-4" style={{ height: 280 }}>
        <div className="pq-inner scroll-thin flex-1 space-y-1.5 overflow-y-auto p-3">
          <p className="text-xl font-bold">재료 상점</p>
          {INGREDIENTS.filter(i => i.price > 0).map(i => (
            <div key={i.id} className="flex items-center gap-2 text-lg">
              <Icon n={i.icon} s={36} />
              <span className="flex-1">{i.name} <span className="text-sm text-[#a06a10]">보유 {save.ingredients[i.id]}</span></span>
              {[1, 5].map(q => (
                <Btn key={q} color="green" disabled={save.coins < i.price * q} onClick={() => { if (buyIngredient(i.id, q)) sfx.coin() }} quiet className="flex items-center gap-1 px-2 py-1 text-sm">×{q} <Icon n="coin" s={16} />{i.price * q}</Btn>
              ))}
            </div>
          ))}
          <p className="pt-2 text-xs text-[#8a5a10]">무지개머티리얼과 신비의 조개껍질은 팔지 않아요. 마지막 지역과 끝없는 별길에서 구할 수 있어요.</p>
        </div>
        <div className="pq-inner scroll-thin flex-1 space-y-2 overflow-y-auto p-3">
          <p className="text-xl font-bold">파워스톤 합성</p>
          <p className="text-sm leading-snug">격자에 놓지 않은 같은 종류·모양·별의 스톤 2개를 합치면 별이 1개 늘어요.</p>
          {groups.length === 0 && <p className="p-3 text-center text-base">합칠 수 있는 스톤이 없어요.</p>}
          {groups.map(g => (
            <div key={`${g.kind}${g.shape}${g.star}`} className="flex items-center gap-2 text-lg">
              <span className="flex flex-1 items-center gap-1" style={{ color: STONE_INFO[g.kind].color }}><Icon n={STONE_INFO[g.kind].icon} s={26} />{STONE_INFO[g.kind].name} <Stars n={g.star} s={14} /> <span className="text-sm text-[#5a3a00]">({SHAPES[g.shape].length}칸) ×{g.n}</span></span>
              <Btn color="blue" disabled={g.n < 2 || save.coins < mergeCost(g)} onClick={() => { if (mergeStones(g.kind, g.shape, g.star)) sfx.levelup() }} quiet className="flex items-center gap-1 px-2 py-1 text-sm">합성 <Icon n="coin" s={16} />{mergeCost(g)}</Btn>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  )
}
