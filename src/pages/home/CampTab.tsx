import { useState } from 'react'
import { useGame } from '../../store/gameStore'
import { DISH_LABEL, DISH_SIZE, dishKind, getIngredient, INGREDIENTS, type IngredientId } from '../../lib/cooking'
import { getSpecies } from '../../lib/roster'
import { frontSprite } from '../../data/sprites'
import TypeBadge from '../../components/TypeBadge'
import Modal from '../../components/Modal'
import { RARITY_STARS } from '../../components/MonCard'
import { sfx } from '../../lib/sound'
import type { OwnedMon } from '../../lib/stats'

export default function CampTab() {
  const { save, cookDish } = useGame()
  const [sel, setSel] = useState<IngredientId[]>([])
  const [cooking, setCooking] = useState(false)
  const [got, setGot] = useState<{ mon: OwnedMon; isNew: boolean } | null>(null)

  const used = (id: IngredientId) => sel.filter(s => s === id).length
  const add = (id: IngredientId) => {
    if (sel.length >= DISH_SIZE || used(id) >= save.ingredients[id]) return
    sfx.select()
    setSel([...sel, id])
  }
  const kind = sel.length === DISH_SIZE ? dishKind(sel) : null
  // 가장 많이 들어간 재료(동률이면 모두)가 끌어들일 타입 미리보기
  const counts = INGREDIENTS.map(i => ({ i, n: used(i.id) })).filter(x => x.n > 0)
  const max = Math.max(0, ...counts.map(c => c.n))
  const doms = counts.filter(c => c.n === max).map(c => c.i)

  const cookNow = () => {
    if (sel.length !== DISH_SIZE || cooking) return
    const wasNew = (id: number) => !save.dex.includes(id)
    setCooking(true)
    sfx.cook()
    setTimeout(() => {
      const mon = cookDish(sel)
      setCooking(false)
      setSel([])
      if (mon) { setGot({ mon, isNew: wasNew(mon.species) }); sfx.levelup() }
    }, 1300)
  }

  return (
    <div className="space-y-3 p-3">
      <div className="relative h-36 overflow-hidden rounded border-4 border-black" style={{ background: 'linear-gradient(#ffb36b 0%, #ffd9a0 55%, #6f9b4a 55%, #567d3a 100%)' }}>
        <span className={`absolute bottom-3 left-1/2 -translate-x-1/2 text-6xl ${cooking ? 'animate-bounce' : ''}`}>🍲</span>
        <span className="absolute bottom-[4.6rem] left-[46%] text-xl opacity-70">{cooking ? '♨️💨♨️' : ''}</span>
        {save.party.slice(0, 3).map((id, i) => {
          const m = save.owned.find(o => o.id === id)
          return m ? <img key={id} src={frontSprite(m.species)} alt="" className="sprite idle absolute bottom-1 h-16 w-16" style={{ left: `${6 + i * 14}%`, animationDelay: `${i * 0.3}s` }} /> : null
        })}
        <p className="absolute right-2 top-2 rounded bg-black/50 px-2 py-0.5 text-[10px]">⛺ 베이스캠프</p>
      </div>

      <div className="pixel-box space-y-3 p-3">
        <p className="text-sm text-yellow-300">냄비 요리 ({sel.length}/{DISH_SIZE})</p>
        <p className="text-[11px] leading-relaxed text-gray-300">재료 {DISH_SIZE}개를 넣으면 냄새를 맡은 포켓몬이 찾아와요. 같은 재료를 많이 넣을수록 해당 타입의 희귀한 친구가 올 확률이 올라가요!</p>
        <div className="flex justify-center gap-2">
          {Array.from({ length: DISH_SIZE }, (_, i) => (
            <button key={i} onClick={() => sel[i] && setSel(sel.filter((_, k) => k !== i))} className="flex h-14 w-14 items-center justify-center rounded border-4 border-dashed border-[#777799] bg-[#1b1b2f] text-3xl">
              {sel[i] ? getIngredient(sel[i]).emoji : ''}
            </button>
          ))}
        </div>
        <div className="min-h-[2.5rem] text-center text-[11px]">
          {kind && <p className="text-yellow-200">{DISH_LABEL[kind]}</p>}
          {doms.length > 0 && (
            <p className="mt-1 flex flex-wrap items-center justify-center gap-1 text-gray-300">
              끌어들일 타입:
              {[...new Set(doms.flatMap(d => d.types))].map(t => <TypeBadge key={t} type={t} />)}
            </p>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {INGREDIENTS.map(i => {
            const left = save.ingredients[i.id] - used(i.id)
            return (
              <button key={i.id} disabled={left <= 0 || sel.length >= DISH_SIZE} onClick={() => add(i.id)} className="pixel-btn rounded border-4 border-[#555577] bg-[#2b2b45] py-1.5 text-center text-[11px]">
                <div className="text-xl">{i.emoji}</div>{i.name}<div className="text-yellow-200">×{left}</div>
              </button>
            )
          })}
        </div>
        <button disabled={sel.length !== DISH_SIZE || cooking} onClick={cookNow} className="pixel-btn pixel-box w-full bg-[#b03a2e] py-3">
          {cooking ? '보글보글…' : '요리하기!'}
        </button>
      </div>

      {got && <Reveal mon={got.mon} isNew={got.isNew} onClose={() => setGot(null)} />}
    </div>
  )
}

function Reveal({ mon, isNew, onClose }: { mon: OwnedMon; isNew: boolean; onClose: () => void }) {
  const sp = getSpecies(mon.species)
  return (
    <Modal onClose={onClose}>
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-xs text-yellow-300">{isNew ? '✨ 처음 만나는 친구가 찾아왔어요!' : '친구가 찾아왔어요!'}</p>
        <img src={frontSprite(sp.id)} alt="" className="sprite idle h-28 w-28" />
        <p className="text-base">{sp.name} <span className="text-xs text-yellow-200">{RARITY_STARS[sp.rarity]}</span></p>
        <div className="flex gap-1">{sp.types.map(t => <TypeBadge key={t} type={t} />)}</div>
        <p className="text-[11px] text-gray-300">Lv{mon.level}로 합류! 팀 탭에서 파티에 넣어 보세요.</p>
        <button onClick={onClose} className="pixel-btn pixel-box mt-1 w-full py-2">확인</button>
      </div>
    </Modal>
  )
}

