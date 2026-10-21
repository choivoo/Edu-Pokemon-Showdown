import { useEffect, useState } from 'react'
import { useGame } from '../../store/gameStore'
import { INGREDIENTS } from '../../lib/cooking'
import { mergeCost, type ShapeId, SHAPES, type StoneKind, STONE_INFO, STONE_KINDS } from '../../lib/stones'
import { usedStoneIds } from '../../lib/party'
import { Btn, Panel } from '../../ui/kit'
import Icon, { Coins, Stars } from '../../ui/Icon'
import { sfx } from '../../lib/sound'
import BatteryMeter, { useBattery } from '../../ui/BatteryMeter'
import { BATTERY_MAX } from '../../lib/battery'
import { DECORATIONS, memberRewardReady, memberRewardWait, maxBatteryBonus } from '../../lib/decorations'
import { STATUE_MAX, statueCap, statueCost, statueMul } from '../../lib/quests'
import { BATTERY_FULL_COST, BATTERY_ONE_COST } from '../../store/gameStore'

const SHAPE_IDS = Object.keys(SHAPES) as ShapeId[]

export default function ShopPanel() {
  const { save, openPanel, buyIngredient, mergeStones, buyBattery, upgradeStatue, claimMemberTickets, buyDecoration, recycleStone } = useGame()
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t) }, [])
  const batteryCap = BATTERY_MAX + maxBatteryBonus(save.decorations)
  const bat = useBattery()
  const used = usedStoneIds(save)
  const free = save.stones.filter(s => !used.has(s.id))
  const groups = STONE_KINDS.flatMap(kind => SHAPE_IDS.flatMap(shape => ([1, 2] as const).map(star => ({ kind: kind as StoneKind, shape, star, n: free.filter(s => s.kind === kind && s.shape === shape && s.star === star).length })))).filter(g => g.n > 0)

  return (
    <Panel title="프렌들리숍" onClose={() => openPanel(null)} w={900}>
      <div className="pq-inner mb-2 p-2">
        <div className="flex items-center gap-2 text-sm">
          <Icon n="gem" s={23} /><b className="text-lg">PM티켓 {save.pmTickets}장</b>
          <span className="flex-1 text-xs">22시간마다 무료 50장 · 구입 즉시 장식 효과 적용</span>
          <Btn color="green" disabled={!memberRewardReady(save, now)} quiet className="px-2 py-1 text-sm"
            onClick={() => { if (claimMemberTickets()) { sfx.coin(); setNow(Date.now()) } }}>
            {memberRewardReady(save, now) ? '무료 50장 받기' : '다음 지급 ' + Math.ceil(memberRewardWait(save, now) / 60000) + '분 후'}
          </Btn>
        </div>
        <div className="scroll-thin mt-2 grid max-h-[154px] grid-cols-3 gap-2 overflow-y-auto">
          {DECORATIONS.map(item => {
            const owned = save.decorations.includes(item.id)
            return <div key={item.id} className="flex flex-col gap-1 border-2 border-[#d3b077] bg-[#fff0ca] p-2 text-xs">
              <b className="text-sm">{item.name}{owned ? ' ✓' : ''}</b>
              <span className="flex-1">{item.effect}</span>
              <Btn color={owned ? 'gray' : 'blue'} disabled={owned || save.pmTickets < item.tickets}
                onClick={() => { if (buyDecoration(item.id)) sfx.coin() }} quiet className="px-1 py-0.5 text-xs">
                {owned ? '보유 중' : 'PM ' + item.tickets + '장'}
              </Btn>
            </div>
          })}
        </div>
      </div>
      <div className="pq-inner mb-2 flex items-center gap-3 p-2 text-lg">
        <span className="font-bold">배터리</span>
        <BatteryMeter dark />
        <span className="flex-1" />
        <Btn color="green" disabled={bat.n >= batteryCap || save.coins < BATTERY_ONE_COST} onClick={() => { if (buyBattery(false)) sfx.coin() }} quiet className="flex items-center gap-1 px-3 py-1 text-sm">1개 충전 <Icon n="coin" s={16} />{BATTERY_ONE_COST}</Btn>
        <Btn color="blue" disabled={bat.n >= batteryCap || save.coins < BATTERY_FULL_COST} onClick={() => { if (buyBattery(true)) sfx.coin() }} quiet className="flex items-center gap-1 px-3 py-1 text-sm">가득 충전 <Icon n="coin" s={16} />{BATTERY_FULL_COST}</Btn>
        <span className="text-xl text-[#c06a00]"><Coins n={save.coins} /></span>
      </div>
      <div className="pq-inner mb-2 flex items-center gap-3 p-2 text-lg">
        <Icon n="crown" s={28} />
        <span className="font-bold">번영의 석상 Lv{save.statue}</span>
        <span className="flex-1 text-sm">탐험 경험치 ×{statueMul(save.statue).toFixed(1)} (Lv{statueCap(save.statue)} 미만 포켓몬)</span>
        <Btn color="yellow" disabled={save.statue >= STATUE_MAX || save.coins < statueCost(save.statue)} onClick={() => { if (upgradeStatue()) sfx.levelup() }} quiet className="flex items-center gap-1 px-3 py-1 text-sm">
          {save.statue >= STATUE_MAX ? '최대 레벨' : <>올리기 <Icon n="coin" s={16} />{statueCost(save.statue)}</>}
        </Btn>
      </div>

      <div className="pq-inner mb-2 flex items-center gap-2 px-3 py-2 text-sm">
        <b>스톤 재활용</b>
        <span className="flex-1 text-xs">장착하지 않은 P스톤을 재료로 바꿔요</span>
        <div className="scroll-thin flex max-w-[580px] gap-2 overflow-x-auto">
          {free.slice(0, 15).map(s => <Btn key={s.id} color="gray" quiet className="whitespace-nowrap px-2 py-1 text-xs"
            onClick={() => { if (recycleStone(s.id)) sfx.coin() }}>
            {STONE_INFO[s.kind].name} {s.star}성 · 재활용
          </Btn>)}
          {free.length === 0 && <span>재활용 가능한 스톤 없음</span>}
        </div>
      </div>
      <div className="flex gap-4" style={{ minHeight: 230 }}>
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
          <p className="text-xl font-bold">P스톤 합성</p>
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
