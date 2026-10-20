import { useState } from 'react'
import { useGame } from '../../store/gameStore'
import { computeStats, expToNext, MAX_LEVEL, powerRating, type OwnedMon, type Stone, STONE_INFO, STONE_SLOTS } from '../../lib/stats'
import { getMove, getSpecies } from '../../lib/roster'
import { frontSprite } from '../../data/sprites'
import MonCard from '../../components/MonCard'
import Modal from '../../components/Modal'
import TypeBadge from '../../components/TypeBadge'
import { sfx } from '../../lib/sound'

export default function TeamTab() {
  const { save, setParty } = useGame()
  const [detail, setDetail] = useState<string | null>(null)
  const sorted = [...save.owned].sort((a, b) => {
    const p = (m: OwnedMon) => powerRating(computeStats(getSpecies(m.species), m.level, stonesOf(m)))
    return p(b) - p(a)
  })
  function stonesOf(m: OwnedMon): Stone[] { return m.stones.map(id => save.stones.find(s => s.id === id)).filter(Boolean) as Stone[] }

  return (
    <div className="space-y-3 p-3">
      <div className="pixel-box p-3">
        <p className="mb-2 text-sm text-yellow-300">탐험 파티 ({save.party.length}/3)</p>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }, (_, i) => {
            const m = save.owned.find(o => o.id === save.party[i])
            return m
              ? <MonCard key={m.id} mon={m} stones={save.stones} badge={`${i + 1}`} onClick={() => setDetail(m.id)} />
              : <div key={i} className="flex h-28 items-center justify-center rounded border-4 border-dashed border-[#555577] text-[11px] text-gray-500">빈 자리</div>
          })}
        </div>
      </div>

      <p className="text-xs text-gray-300">보유 포켓몬 {save.owned.length}마리 · 탭하면 상세</p>
      <div className="grid grid-cols-3 gap-2">
        {sorted.map(m => <MonCard key={m.id} mon={m} stones={save.stones} selected={save.party.includes(m.id)} onClick={() => { sfx.select(); setDetail(m.id) }} />)}
      </div>

      {detail && <Detail id={detail} onClose={() => setDetail(null)} setParty={setParty} />}
    </div>
  )
}

function Detail({ id, onClose, setParty }: { id: string; onClose: () => void; setParty: (ids: string[]) => void }) {
  const { save, equipStone, levelUpCost, levelUpWithCoins, release } = useGame()
  const [pickSlot, setPickSlot] = useState<number | null>(null)
  const m = save.owned.find(o => o.id === id)
  if (!m) return null
  const sp = getSpecies(m.species)
  const eq = m.stones.map(sid => save.stones.find(s => s.id === sid) ?? null)
  const stats = computeStats(sp, m.level, eq.filter(Boolean) as Stone[])
  const inParty = save.party.includes(m.id)
  const cost = levelUpCost(m.id)

  const toggleParty = () => {
    if (inParty) setParty(save.party.filter(x => x !== m.id))
    else if (save.party.length < 3) setParty([...save.party, m.id])
    else setParty([...save.party.slice(1), m.id]) // 가득 차 있으면 가장 앞 멤버와 교체
    sfx.select()
  }

  return (
    <Modal onClose={onClose}>
      <div className="space-y-2 text-[12px]">
        <div className="flex items-center gap-3">
          <img src={frontSprite(sp.id)} alt="" className="sprite h-20 w-20" />
          <div className="flex-1">
            <p className="text-base">{sp.name} <span className="text-xs">Lv{m.level}</span></p>
            <div className="flex gap-1">{sp.types.map(t => <TypeBadge key={t} type={t} />)}</div>
            <p className="mt-1 text-[10px] text-gray-300">EXP {m.exp}/{m.level >= MAX_LEVEL ? '-' : expToNext(m.level)} · ⚔ {powerRating(stats)}</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
          <span>HP<br />{stats.maxHp}</span><span>공격<br />{stats.atk}</span><span>방어<br />{stats.def}</span><span>속도<br />{stats.spe}</span>
        </div>
        <p className="text-[10px] text-gray-300">기술: {getMove(sp.basic).name}(자동) · ★ {getMove(sp.special).name}(필살기) · 급소 {Math.round(stats.crit * 100)}%</p>

        <div>
          <p className="mb-1 text-yellow-300">파워스톤</p>
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: STONE_SLOTS }, (_, i) => (
              <button key={i} onClick={() => setPickSlot(pickSlot === i ? null : i)} className={`pixel-btn rounded border-4 py-2 text-[11px] ${pickSlot === i ? 'border-yellow-300' : 'border-[#555577]'} bg-[#1b1b2f]`}>
                {eq[i] ? `${STONE_INFO[eq[i]!.kind].emoji} ${STONE_INFO[eq[i]!.kind].name} ${'★'.repeat(eq[i]!.star)}` : '＋ 비어 있음'}
              </button>
            ))}
          </div>
          {pickSlot !== null && (
            <div className="mt-2 max-h-32 space-y-1 overflow-y-auto rounded bg-[#1b1b2f] p-2">
              {eq[pickSlot] && <button onClick={() => { equipStone(m.id, pickSlot, null); setPickSlot(null) }} className="w-full rounded bg-[#3a2a2a] py-1 text-red-300">장착 해제</button>}
              {save.stones.length === 0 && <p className="text-gray-400">스톤이 없어요. 탐험에서 얻을 수 있어요!</p>}
              {save.stones.map(s => {
                const holder = save.owned.find(o => o.stones.includes(s.id))
                return (
                  <button key={s.id} onClick={() => { equipStone(m.id, pickSlot, s.id); setPickSlot(null); sfx.select() }} className="flex w-full justify-between rounded bg-[#2b2b45] px-2 py-1">
                    <span>{STONE_INFO[s.kind].emoji} {STONE_INFO[s.kind].name} {'★'.repeat(s.star)}</span>
                    <span className="text-[10px] text-gray-400">{holder ? (holder.id === m.id ? '장착 중' : `${getSpecies(holder.species).name} 장착`) : STONE_INFO[s.kind].desc}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={toggleParty} className="pixel-btn pixel-box py-2">{inParty ? '파티에서 빼기' : '파티에 넣기'}</button>
          <button disabled={cost === 0 || save.coins < cost} onClick={() => { if (levelUpWithCoins(m.id)) sfx.levelup() }} className="pixel-btn pixel-box py-2">
            {cost ? `🪙${cost} 레벨업` : '최고 레벨'}
          </button>
        </div>
        <div className="flex gap-2">
          <button disabled={inParty || save.owned.length <= 1} onClick={() => { if (release(m.id)) onClose() }} className="pixel-btn flex-1 py-1 text-[11px] text-red-300 underline">
            {inParty ? '파티 멤버는 보낼 수 없어요' : '보내주기 (코인 획득)'}
          </button>
          <button onClick={onClose} className="pixel-btn pixel-box flex-1 py-1.5">닫기</button>
        </div>
      </div>
    </Modal>
  )
}
