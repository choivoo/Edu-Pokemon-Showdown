import { useState } from 'react'
import { useGame } from '../../store/gameStore'
import { expToNext, MAX_LEVEL } from '../../lib/stats'
import { canPlace, cellsOf, GRID_H, GRID_W, occupancy, SHAPES, type Stone, STONE_INFO, stoneName, unlockedSet } from '../../lib/stones'
import { getMove, getSpecies } from '../../lib/roster'
import { powerOf, statsOf, usedStoneIds } from '../../lib/party'
import { Bar, Btn, PARTY_COLORS, Panel, Portrait } from '../../ui/kit'
import TypeBadge from '../../components/TypeBadge'
import { sfx } from '../../lib/sound'
import { powerRating } from '../../lib/stats'

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
  const { save, openPanel, setParty, placeStone, removeStone, levelUpCost, levelUpWithCoins, release } = useGame()
  const [selId, setSelId] = useState(save.party[0] ?? save.owned[0]?.id)
  const [right, setRight] = useState<'mons' | 'stones'>('mons')
  const [hold, setHold] = useState<{ id: string; rot: number } | null>(null)
  const [hover, setHover] = useState<[number, number] | null>(null)
  const [msg, setMsg] = useState('')

  const mon = save.owned.find(o => o.id === selId) ?? save.owned[0]
  if (!mon) return null
  const sp = getSpecies(mon.species)
  const stats = statsOf(save, mon)
  const occ = occupancy(mon.stones, save.stones)
  const open = unlockedSet(mon.level)
  const used = usedStoneIds(save)
  const freeStones = save.stones.filter(s => !used.has(s.id))
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
        {/* 왼쪽: 포켓몬 정보 + 파워스톤 격자 */}
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
          <p className="text-sm">⚔️ {powerRating(stats)} · {getMove(sp.basic).name}(자동) · ★{getMove(sp.special).name}</p>

          <div className="flex gap-3">
            <div className="pq-dark relative p-2" style={{ width: GRID_W * CELL + 16 }} onMouseLeave={() => setHover(null)}>
              <div className="grid" style={{ gridTemplateColumns: `repeat(${GRID_W}, ${CELL}px)`, gap: 0 }}>
                {Array.from({ length: GRID_H * GRID_W }, (_, i) => {
                  const x = i % GRID_W, y = Math.floor(i / GRID_W)
                  const k = `${x},${y}`
                  const isOpen = open.has(k)
                  const oi = occ.get(k)
                  const st = oi !== undefined ? save.stones.find(s => s.id === mon.stones[oi].stone) : undefined
                  const g = ghost.get(k)
                  return (
                    <button
                      key={k} onClick={() => clickCell(x, y)} onMouseEnter={() => setHover([x, y])} onTouchStart={() => setHover([x, y])}
                      className="flex items-center justify-center border-2 border-black/40 text-lg font-bold text-white"
                      style={{ width: CELL, height: CELL, background: st ? STONE_INFO[st.kind].color : g !== undefined ? (g ? '#58cf7c' : '#e0505a') : isOpen ? '#566' : '#2a2d38', opacity: isOpen ? 1 : 0.7 }}
                    >
                      {st ? '★'.repeat(st.star) : isOpen ? '' : '🔒'}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2 text-sm">
              {hold && holdStone ? (
                <div className="pq-inner p-2 text-center">
                  <p className="font-bold">{STONE_INFO[holdStone.kind].emoji} {stoneName(holdStone)}</p>
                  <ShapePreview stone={holdStone} />
                  <Btn color="blue" onClick={() => setHold({ ...hold, rot: hold.rot + 1 })} className="mt-1 w-full px-1 py-1 text-base">↻ 회전</Btn>
                  <Btn color="gray" onClick={() => setHold(null)} className="mt-1 w-full px-1 py-1 text-base">내려놓기</Btn>
                </div>
              ) : <p className="pq-inner p-2 text-xs leading-snug">오른쪽 <b>파워스톤</b> 탭에서 스톤을 골라 격자에 놓으세요. 놓인 스톤을 누르면 다시 집어요. 레벨이 오르면 칸이 열려요.</p>}
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
                <button key={i} onClick={() => m && setSelId(m.id)} className={`flex h-[70px] flex-1 items-center gap-2 rounded-xl border-4 px-2 ${m && m.id === mon.id ? 'border-white' : 'border-black/30'}`} style={{ background: PARTY_COLORS[i] }}>
                  {m ? (<><Portrait id={m.species} size={52} /><span className="text-left text-sm leading-tight text-white" style={{ textShadow: '0 1px 0 #0008' }}>{getSpecies(m.species).name}<br /><b>Lv{m.level}</b></span></>) : <span className="w-full text-center text-sm text-white/80">빈 자리</span>}
                </button>
              )
            })}
          </div>
          <div className="flex gap-2">
            <Btn color={right === 'mons' ? 'yellow' : 'gray'} onClick={() => setRight('mons')} className="flex-1 py-1 text-base">포켓몬 {save.owned.length}</Btn>
            <Btn color={right === 'stones' ? 'yellow' : 'gray'} onClick={() => setRight('stones')} className="flex-1 py-1 text-base">파워스톤 {freeStones.length}</Btn>
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
            ) : (
              <div className="space-y-1.5">
                {freeStones.length === 0 && <p className="p-4 text-center text-base">남은 스톤이 없어요. 탐험에서 얻어 보세요!</p>}
                {freeStones.map(s => (
                  <button key={s.id} onClick={() => { sfx.select(); setHold({ id: s.id, rot: 0 }); setMsg('') }} className={`flex w-full items-center gap-3 rounded-lg border-4 px-2 py-1 text-left ${hold?.id === s.id ? 'border-[#e8524a] bg-white' : 'border-[#e5a500]'}`}>
                    <span className="flex w-16 justify-center"><ShapePreview stone={s} /></span>
                    <span className="flex-1 text-lg">{STONE_INFO[s.kind].emoji} {stoneName(s)}</span>
                    <span className="text-sm">{STONE_INFO[s.kind].desc} +{Math.round(STONE_INFO[s.kind].per * s.star * SHAPES[s.shape].length * 100)}%</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Btn color={inParty ? 'gray' : 'green'} onClick={toggleParty} className="flex-1 py-1.5 text-base">{inParty ? '파티에서 빼기' : '파티에 넣기'}</Btn>
            <Btn color="blue" disabled={!lvCost || save.coins < lvCost} onClick={() => { if (levelUpWithCoins(mon.id)) sfx.levelup() }} className="flex-1 py-1.5 text-base">{lvCost ? `🪙${lvCost} 레벨업` : '최고 레벨'}</Btn>
            <Btn color="red" disabled={inParty || save.owned.length <= 1} onClick={() => { if (release(mon.id)) setSelId(save.party[0]) }} className="flex-1 py-1.5 text-base">보내주기</Btn>
          </div>
        </div>
      </div>
    </Panel>
  )
}

