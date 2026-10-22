import { useState } from 'react'
import { useGame } from '../../store/gameStore'
import { expToNext, MAX_LEVEL } from '../../lib/stats'
import { canPlace, cellsOf, GRID_H, GRID_W, occupancy, SHAPES, type Stone, STONE_INFO, STONE_PERK_LABEL, stoneName, unlockedSet } from '../../lib/stones'
import { getMove, getSpecies } from '../../lib/roster'
import { koreanMoveName } from '../../data/questMoveKorean'
import { bingoOf, equippedMoveStones, powerOf, statsOf, usedMoveStoneIds, usedStoneIds } from '../../lib/party'
import { BONUS_INFO, completeLines } from '../../lib/bingo'
import { questBingoOptions } from '../../lib/questBingo'
import { MOVE_SLOTS, MOVE_STONE_INFO } from '../../lib/moveStones'
import { Bar, Btn, PARTY_COLORS, Panel, Portrait } from '../../ui/kit'
import TypeBadge from '../../components/TypeBadge'
import { sfx } from '../../lib/sound'
import { powerRating } from '../../lib/stats'
import Icon, { Stars } from '../../ui/Icon'
import { canEvolve, evolutionOf } from '../../lib/evolution'

const CELL = 62

function ShapePreview({ stone, size = 16 }: { stone: Stone; size?: number }) {
  const cells = SHAPES[stone.shape]
  const w = Math.max(...cells.map(c => c[0])) + 1, h = Math.max(...cells.map(c => c[1])) + 1
  return (
    <span className="relative inline-block" style={{ width: w * size, height: h * size }}>
      {cells.map(([x, y], i) => <span key={i} className="absolute rounded-sm border border-black/40" style={{ left: x * size, top: y * size, width: size, height: size, background: STONE_INFO[stone.kind].color }} />)}
    </span>
  )
}

export default function TeamPanel() {
  const { save, openPanel, setParty, placeStone, removeStone, levelUpCost, levelUpWithCoins, release, equipMoveStone, unequipMoveStone, evolve, toggleEverstone } = useGame()
  const [selId, setSelId] = useState(save.party[0] ?? save.owned[0]?.id)
  const [right, setRight] = useState<'mons' | 'stones' | 'moves' | 'bingo'>('mons')
  const [hold, setHold] = useState<{ id: string; rot: number } | null>(null)
  const [hover, setHover] = useState<[number, number] | null>(null)
  const [msg, setMsg] = useState('')
  const [activeMoveSlot, setActiveMoveSlot] = useState<0|1>(0)

  const mon = save.owned.find(o => o.id === selId) ?? save.owned[0]
  if (!mon) return null
  const sp = getSpecies(mon.species)
  const stats = statsOf(save, mon)
  const occ = occupancy(mon.stones, save.stones)
  const open = unlockedSet(mon.level)
  const used = usedStoneIds(save)
  const freeStones = save.stones.filter(s => !used.has(s.id))
  const usedMove = usedMoveStoneIds(save)
  const freeMove = save.moveStones.filter(m => !usedMove.has(m.id))
  const equipped = equippedMoveStones(save, mon)
  const moveSlots = mon.move2 ? 2 : MOVE_SLOTS
  const bingos = bingoOf(save, mon)
  const bingoCells = new Set(completeLines(occ).flat())
  const holdStone = hold ? save.stones.find(s => s.id === hold.id) : undefined
  const inParty = save.party.includes(mon.id)
  const lvCost = levelUpCost(mon.id)

  const ghost = new Map<string, boolean>()
  if (holdStone && hover && hold) {
    const ok = canPlace(mon.level, occ, holdStone.shape, hold.rot, hover[0], hover[1])
    for (const [cx, cy] of cellsOf(holdStone.shape, hold.rot)) ghost.set(`${hover[0] + cx},${hover[1] + cy}`, ok)
  }

  const clickCell = (x: number, y: number) => {
    setMsg('')
    if (hold && holdStone) {
      if (placeStone(mon.id, hold.id, x, y, hold.rot)) { sfx.select(); setHold(null) } else { sfx.wrong(); setMsg('거기에는 놓을 수 없어요 (잠긴 칸이거나 겹쳐요)') }
      return
    }
    const idx = occ.get(`${x},${y}`)
    if (idx !== undefined) {
      const p = mon.stones[idx]
      removeStone(mon.id, p.stone)
      setHold({ id: p.stone, rot: p.rot })
      sfx.select()
    }
  }

  const toggleParty = () => {
    if (inParty) { if (save.party.length > 1) setParty(save.party.filter(x => x !== mon.id)) }
    else setParty(save.party.length < 3 ? [...save.party, mon.id] : [...save.party.slice(1), mon.id])
    sfx.select()
  }

  const sorted = [...save.owned].sort((a, b) => powerOf(save, b) - powerOf(save, a))

  return (
    <Panel title="팀 편성" onClose={() => openPanel(null)} w={920}>
      <div className="flex gap-4" style={{ height: 410 }}>
        {/* 왼쪽: 포켓몬 정보 + P스톤 격자 */}
        <div className="flex w-[400px] flex-col gap-2">
          <div className="pq-inner flex items-center gap-3 p-2">
            <Portrait id={mon.species} size={72} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xl font-bold">{sp.name} <span className="text-base">Lv{mon.level}</span></p>
              <div className="flex gap-1">{sp.types.map(t => <TypeBadge key={t} type={t} />)}</div>
              <Bar value={mon.exp} max={mon.level >= MAX_LEVEL ? 1 : expToNext(mon.level)} color="#58cf7c" label={mon.level >= MAX_LEVEL ? 'MAX' : `EXP ${mon.exp}/${expToNext(mon.level)}`} />
            </div>
          </div>
          <div className="grid grid-cols-5 gap-1 text-center text-sm">
            {[['HP', stats.maxHp, '#4a8fe0'], ['공격', stats.atk, '#e0505a'], ['방어', stats.def, '#4a8fe0'], ['속도', stats.spe, '#43b97a'], ['급소', `${Math.round(stats.crit * 100)}%`, '#b061d8']].map(([k, v, c]) => (
              <span key={k as string} className="rounded-lg px-1 py-0.5 text-white" style={{ background: c as string }}>{k}<br /><b className="text-base">{v}</b></span>
            ))}
          </div>
          <p className="flex items-center gap-1 text-sm"><Icon n="sword" s={18} />{powerRating(stats)} · {koreanMoveName(getMove(sp.basic).name)}(자동) · <Icon n="star" s={16} />{koreanMoveName(getMove(mon.move ?? sp.special).name)}{mon.move2 ? ' / ' + koreanMoveName(getMove(mon.move2).name) : ''}</p>

          <div className="flex gap-3">
            <div className="pq-dark relative p-2" style={{ width: GRID_W * CELL + 16 }} onMouseLeave={() => setHover(null)}>
              <div className="grid" style={{ gridTemplateColumns: `repeat(${GRID_W}, ${CELL}px)`, gap: 0 }}>
                {Array.from({ length: GRID_H * GRID_W }, (_, i) => {
                  const x = i % GRID_W, y = Math.floor(i / GRID_W)
                  const k = `${x},${y}`
                  const isOpen = open.has(k)
                   const socket = mon.sockets?.[i] ?? 'any'
                  const oi = occ.get(k)
                  const st = oi !== undefined ? save.stones.find(s => s.id === mon.stones[oi].stone) : undefined
                  const g = ghost.get(k)
                  return (
                    <button
                      key={k} title={socket === 'hp' ? '체력석 전용' : socket === 'atk' ? '공격석 전용' : '체력/공격 공용'} onClick={() => clickCell(x, y)} onMouseEnter={() => setHover([x, y])} onTouchStart={() => setHover([x, y])}
                      className="flex items-center justify-center border-2 border-black/40 text-lg font-bold text-white"
                      style={{ width: CELL, height: CELL, background: st ? STONE_INFO[st.kind].color : g !== undefined ? (g ? '#58cf7c' : '#e0505a') : isOpen ? (socket === 'hp' ? '#8a4457' : socket === 'atk' ? '#916036' : '#566') : '#2a2d38', opacity: isOpen ? 1 : 0.7, boxShadow: bingoCells.has(k) ? 'inset 0 0 0 4px #ffe14d' : undefined }}
                    >
                      {st ? <Stars n={st.star} s={14} /> : isOpen ? <span className="text-[11px]">{socket === 'hp' ? 'HP' : socket === 'atk' ? 'ATK' : '·'}</span> : <Icon n="lock" s={26} />}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2 text-sm">
              {hold && holdStone ? (
                <div className="pq-inner p-2 text-center">
                  <p className="flex items-center justify-center gap-1 font-bold"><Icon n={STONE_INFO[holdStone.kind].icon} s={22} />{stoneName(holdStone)}</p>
                  <ShapePreview stone={holdStone} />
                  <Btn color="blue" onClick={() => setHold({ ...hold, rot: hold.rot + 1 })} className="mt-1 flex w-full items-center justify-center gap-1 px-1 py-1 text-base"><Icon n="rotate" s={20} />회전</Btn>
                  <Btn color="gray" onClick={() => setHold(null)} className="mt-1 w-full px-1 py-1 text-base">내려놓기</Btn>
                </div>
              ) : <p className="pq-inner p-2 text-xs leading-snug">오른쪽 <b>P스톤</b> 탭에서 스톤을 골라 격자에 놓으세요. 놓인 스톤을 누르면 다시 집어요. 레벨이 오르면 칸이 열려요.</p>}
              {msg && <p className="text-xs text-[#d23c36]">{msg}</p>}
            </div>
          </div>
        </div>

        {/* 오른쪽: 파티 / 목록 */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex gap-2">
            {[0, 1, 2].map(i => {
              const m = save.owned.find(o => o.id === save.party[i])
              return (
                <button key={i} onClick={() => m && setSelId(m.id)} className={`flex h-[70px] flex-1 items-center gap-2 border-4 px-2 ${m && m.id === mon.id ? 'border-white' : 'border-[#2b2838]'}`} style={{ background: PARTY_COLORS[i] }}>
                  {m ? (<><Portrait id={m.species} size={52} /><span className="text-left text-sm leading-tight text-white" style={{ textShadow: '0 1px 0 #0008' }}>{getSpecies(m.species).name}<br /><b>Lv{m.level}</b></span></>) : <span className="w-full text-center text-sm text-white/80">빈 자리</span>}
                </button>
              )
            })}
          </div>
          <div className="flex gap-2">
            <Btn color={right === 'mons' ? 'yellow' : 'gray'} onClick={() => setRight('mons')} className="flex-1 whitespace-nowrap px-1 py-1 text-sm">포켓몬 {save.owned.length}</Btn>
            <Btn color={right === 'stones' ? 'yellow' : 'gray'} onClick={() => setRight('stones')} className="flex-1 whitespace-nowrap px-1 py-1 text-sm">P스톤 {freeStones.length}</Btn>
            <Btn color={right === 'moves' ? 'yellow' : 'gray'} onClick={() => setRight('moves')} className="flex-1 whitespace-nowrap px-1 py-1 text-sm">기술스톤 {freeMove.length}</Btn>
            <Btn color={right === 'bingo' ? 'yellow' : 'gray'} onClick={() => setRight('bingo')} className="flex flex-1 items-center justify-center gap-1 whitespace-nowrap px-1 py-1 text-sm"><Icon n="bingo" s={18} />빙고 {bingos}</Btn>
          </div>
          <div className="pq-inner scroll-thin min-h-0 flex-1 overflow-y-auto p-2">
            {right === 'mons' ? (
              <div className="grid grid-cols-6 gap-2">
                {sorted.map(m => (
                  <button key={m.id} onClick={() => { sfx.select(); setSelId(m.id) }} className={`relative rounded-lg border-4 ${m.id === mon.id ? 'border-[#e8524a]' : save.party.includes(m.id) ? 'border-[#3fbf6a]' : 'border-transparent'}`}>
                    <Portrait id={m.species} size={60} />
                    <span className="absolute bottom-0 right-0 rounded bg-black/70 px-1 text-xs text-white">Lv{m.level}</span>
                  </button>
                ))}
              </div>
            ) : right === 'moves' ? (
              <div className="space-y-1.5">
                <p className="text-sm font-bold">장착 중 ({equipped.length}/{moveSlots}) · 각 기술에 개별 적용</p>
                {mon.move2 && <div className="flex gap-1 pb-1"><Btn color={activeMoveSlot===0?'yellow':'gray'} onClick={()=>setActiveMoveSlot(0)} className="flex-1 text-sm">기술 1: {koreanMoveName(getMove(mon.move??sp.special).name)}</Btn><Btn color={activeMoveSlot===1?'yellow':'gray'} onClick={()=>setActiveMoveSlot(1)} className="flex-1 text-sm">기술 2: {koreanMoveName(getMove(mon.move2).name)}</Btn></div>}
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: moveSlots }, (_, i) => {
                    const m = equipped[i]
                    return (
                      <button key={i} disabled={!m} onClick={() => m && unequipMoveStone(mon.id, m.id)} className="flex h-[78px] flex-col items-center justify-center gap-0.5 border-4 border-dashed border-[#c98a00] bg-white/60 text-xs">
                        {m ? (<><Icon n={MOVE_STONE_INFO[m.kind].icon} s={36} /><span>{MOVE_STONE_INFO[m.kind].name}</span><span>기술 {(mon.moveStoneSlots?.[i]??0)+1}</span></>) : <span className="text-[#a06a10]">빈 칸</span>}
                      </button>
                    )
                  })}
                </div>
                <p className="pt-1 text-sm font-bold">보유한 기술스톤</p>
                {freeMove.length === 0 && <p className="p-3 text-center text-sm">남은 기술스톤이 없어요. 탐험에서 가끔 얻을 수 있어요!</p>}
                {freeMove.map(m => (
                  <button key={m.id} disabled={equipped.length >= moveSlots} onClick={() => { if (equipMoveStone(mon.id, m.id, mon.move2 ? activeMoveSlot : 0)) sfx.select() }} className="flex w-full items-center gap-2 border-4 border-[#c98a00] bg-white/60 px-2 py-1 text-left disabled:opacity-50">
                    <Icon n={MOVE_STONE_INFO[m.kind].icon} s={32} />
                    <span className="flex-1"><b className="text-base">{MOVE_STONE_INFO[m.kind].name}</b><br /><span className="text-xs text-[#8a5a10]">{MOVE_STONE_INFO[m.kind].detail}</span></span>
                  </button>
                ))}
              </div>
            ) : right === 'bingo' ? (
              <div className="space-y-2 text-sm">
                <p className="leading-snug">P스톤 격자의 <b>가로 또는 세로 한 줄을 스톤으로 모두 채우면</b> 빙고! 가로·세로 빙고 줄을 1·2·3개 완성할 때마다 각각의 보너스가 켜져요.</p>
                <p className="flex items-center gap-1 text-lg font-bold text-[#c06a00]"><Icon n="bingo" s={26} />완성한 빙고 {bingos}줄{bingos > 3 ? ' (3줄까지 인정)' : ''}</p>
                {mon.bingoChoices ? ([0,1,2] as const).map(bi=><div key={bi} className="border-4 border-[#c98a00] bg-white/60 p-2">
                  <p className="text-base font-bold">{bi+1}번째 빙고 {bingos>bi?'● 활성':'○ 잠김'} · {getSpecies(mon.species).name}</p>
                  <div className="mt-1 grid grid-cols-3 gap-1 text-center text-xs">
                    {questBingoOptions(mon.species,bi).map((option,i)=><span key={i}
                      className={`border-2 p-1 leading-snug ${mon.bingoChoices?.[bi]===i?(bingos>bi?'border-[#e8524a] bg-[#ffe9a0]':'border-[#bd9b52] bg-[#fff6d4]'):'border-[#e5c36a] opacity-60'}`}>
                      {option}
                    </span>)}
                  </div>
                </div>) : mon.bonus.map((b,bi)=>(
                  <div key={bi} className="border-4 border-[#c98a00] bg-white/60 p-2">
                    <p className="text-base font-bold">{bi+1}번째 빙고 {bingos>bi?'활성':'잠김'} · {BONUS_INFO[b.kind].label}</p>
                    <div className="mt-1 grid grid-cols-3 gap-1 text-center text-xs">
                    {b.v.map((v,i)=><span key={i} className="border-2 border-[#e5c36a]">{i+1}빙고 +{v}{BONUS_INFO[b.kind].unit}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                {freeStones.length === 0 && <p className="p-4 text-center text-base">남은 스톤이 없어요. 탐험에서 얻어 보세요!</p>}
                {freeStones.map(s => (
                  <button key={s.id} onClick={() => { sfx.select(); setHold({ id: s.id, rot: 0 }); setMsg('') }} className={`flex w-full items-center gap-3 rounded-lg border-4 px-2 py-1 text-left ${hold?.id === s.id ? 'border-[#e8524a] bg-white' : 'border-[#e5a500]'}`}>
                    <span className="flex w-16 justify-center"><ShapePreview stone={s} /></span>
                    <span className="flex flex-1 items-center gap-1 text-lg"><Icon n={STONE_INFO[s.kind].icon} s={26} />{STONE_INFO[s.kind].name} <Stars n={s.star} s={14} /></span>
                    <span className="text-sm">{STONE_INFO[s.kind].desc} +{s.value !== undefined ? s.value : Math.round(STONE_INFO[s.kind].per * s.star * SHAPES[s.shape].length * 100) + '%'} {Object.entries(s.perks ?? {}).map(([k,v]) => STONE_PERK_LABEL[k as keyof typeof STONE_PERK_LABEL] + ' +' + v + '%').join(' · ')}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 rounded border-2 border-[#d7bc7a] bg-[#fff5d7] px-2 py-1 text-xs">
            <span>레벨에 도달하면 자동 진화해요. 진화를 원치 않으면 변함없는돌을 켜세요.</span>
            <Btn color={mon.everstone ? 'red' : 'gray'} onClick={() => { toggleEverstone(mon.id); sfx.select() }} className="shrink-0 px-2 py-1 text-xs">
              변함없는돌 {mon.everstone ? 'ON' : 'OFF'}
            </Btn>
          </div>
          {canEvolve(mon) && !mon.everstone && (
            <div className="flex items-center gap-2 border-4 border-[#e8524a] bg-[#fff0b8] px-2 py-1">
              <span className="flex-1 text-base font-bold text-[#c03a30]">{getSpecies(mon.species).name}이(가) 진화할 수 있어요! (레벨 {evolutionOf(mon.species)!.level})</span>
              {(mon.species === 133 ? [['fire', '불꽃'], ['water', '물'], ['electric', '번개']] : [['', '진화']]).map(([c, label]) => (
                <Btn key={c} color="red" onClick={() => { if (evolve(mon.id, c || undefined)) sfx.levelup() }} className="px-3 py-1 text-base">{label}</Btn>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Btn color={inParty ? 'gray' : 'green'} onClick={toggleParty} className="flex-1 py-1.5 text-base">{inParty ? '파티에서 빼기' : '파티에 넣기'}</Btn>
            <Btn color="blue" disabled={!lvCost || save.coins < lvCost} onClick={() => { if (levelUpWithCoins(mon.id)) sfx.levelup() }} className="flex-1 py-1.5 text-base">{lvCost ? <span className="flex items-center justify-center gap-1"><Icon n="coin" s={20} />{lvCost} 레벨업</span> : '최고 레벨'}</Btn>
            <Btn color="red" disabled={inParty || save.owned.length <= 1} onClick={() => { if (release(mon.id)) setSelId(save.party[0]) }} className="flex-1 py-1.5 text-base">보내주기</Btn>
          </div>
        </div>
      </div>
    </Panel>
  )
}

