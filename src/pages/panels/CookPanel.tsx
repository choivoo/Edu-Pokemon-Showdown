import { useState } from 'react'
import { useGame } from '../../store/gameStore'
import { DISH_LABEL, DISH_SIZE, dishKind, getIngredient, INGREDIENTS, type IngredientId } from '../../lib/cooking'
import { getSpecies } from '../../lib/roster'
import { frontSprite } from '../../data/sprites'
import { Btn, Panel } from '../../ui/kit'
import TypeBadge from '../../components/TypeBadge'
import { sfx } from '../../lib/sound'
import type { OwnedMon } from '../../lib/stats'

const RARITY = ['', '★', '★★', '★★★', '✦']

export default function CookPanel() {
  const { save, cookDish, openPanel } = useGame()
  const [sel, setSel] = useState<IngredientId[]>([])
  const [cooking, setCooking] = useState(false)
  const [got, setGot] = useState<{ mon: OwnedMon; isNew: boolean } | null>(null)

  const used = (id: IngredientId) => sel.filter(s => s === id).length
  const add = (id: IngredientId) => {
    if (cooking || sel.length >= DISH_SIZE || used(id) >= save.ingredients[id]) return
    sfx.select()
    setSel([...sel, id])
  }
  // 가장 많은 재료의 타입 미리보기 (동률이면 모두)
  const counts = INGREDIENTS.map(i => ({ i, n: used(i.id) })).filter(x => x.n > 0)
  const max = Math.max(0, ...counts.map(c => c.n))
  const doms = counts.filter(c => c.n === max).map(c => c.i)
  const kind = sel.length === DISH_SIZE ? dishKind(sel) : null

  const autoFill = () => {
    const best = INGREDIENTS.map(i => ({ id: i.id, n: save.ingredients[i.id] })).sort((a, b) => b.n - a.n)[0]
    setSel(Array(Math.min(DISH_SIZE, best.n)).fill(best.id))
  }

  const cookNow = () => {
    if (sel.length !== DISH_SIZE || cooking) return
    const known = new Set(save.dex)
    setCooking(true)
    sfx.cook()
    setTimeout(() => {
      const mon = cookDish(sel)
      setCooking(false)
      setSel([])
      if (mon) { setGot({ mon, isNew: !known.has(mon.species) }); sfx.levelup() }
    }, 1400)
  }

  return (
    <Panel title="🍲 요리 냄비" onClose={() => openPanel(null)} w={880}>
      <div className="flex gap-4" style={{ height: 380 }}>
        <div className="flex w-[330px] flex-col items-center gap-3">
          <div className={`pq-dark flex w-full flex-col items-center gap-2 p-4 ${cooking ? 'animate-bounce' : ''}`}>
            <div className="rounded-lg bg-black/30 px-4 py-1 text-xl">{sel.length} / {DISH_SIZE}</div>
            <div className="flex flex-wrap justify-center gap-2">
              {Array.from({ length: DISH_SIZE }, (_, i) => (
                <button key={i} onClick={() => !cooking && sel[i] && setSel(sel.filter((_, k) => k !== i))} className="flex h-[68px] w-[68px] items-center justify-center rounded-lg border-4 border-dashed border-white/30 bg-black/30 text-4xl">
                  {sel[i] ? getIngredient(sel[i]).emoji : ''}
                </button>
              ))}
            </div>
          </div>
          <div className="min-h-[60px] text-center text-base">
            {kind && <p className="text-lg font-bold text-[#c06a00]">{DISH_LABEL[kind]}</p>}
            {doms.length > 0 && (
              <p className="mt-1 flex flex-wrap items-center justify-center gap-1">끌어들일 타입: {[...new Set(doms.flatMap(d => d.types))].map(t => <TypeBadge key={t} type={t} />)}</p>
            )}
          </div>
          <div className="mt-auto flex w-full gap-2">
            <Btn color="blue" disabled={cooking} onClick={autoFill} className="flex-1 text-base">같은 재료로 채우기</Btn>
            <Btn color="red" disabled={sel.length !== DISH_SIZE || cooking} onClick={cookNow} className="flex-1 text-xl">{cooking ? '보글보글…' : '요리!'}</Btn>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <p className="text-base leading-snug">재료 {DISH_SIZE}개를 넣으면 냄새를 맡은 포켓몬이 찾아와요. 같은 재료를 많이 넣을수록 그 타입의 <b>희귀한 친구</b>가 올 확률이 올라가요! (4개 이상 = 특선, 3개 = 좋은 요리)</p>
          <div className="grid flex-1 grid-cols-3 gap-3">
            {INGREDIENTS.map(i => {
              const left = save.ingredients[i.id] - used(i.id)
              return (
                <button key={i.id} disabled={left <= 0 || sel.length >= DISH_SIZE || cooking} onClick={() => add(i.id)} className="pq-inner flex flex-col items-center justify-center gap-1 disabled:opacity-40">
                  <span className="text-5xl">{i.emoji}</span>
                  <span className="text-lg">{i.name}</span>
                  <span className="text-xl font-bold text-[#c06a00]">×{left}</span>
                  <span className="flex gap-0.5">{i.types.map(t => <TypeBadge key={t} type={t} />)}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {got && <Reveal mon={got.mon} isNew={got.isNew} onClose={() => setGot(null)} />}
    </Panel>
  )
}

function Reveal({ mon, isNew, onClose }: { mon: OwnedMon; isNew: boolean; onClose: () => void }) {
  const sp = getSpecies(mon.species)
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/65" onClick={onClose}>
      <div className="pq-panel pop-in flex w-[460px] flex-col items-center gap-2 p-6 text-center">
        <p className="text-xl text-[#c06a00]">{isNew ? '✨ 처음 만나는 친구가 찾아왔어요!' : '친구가 찾아왔어요!'}</p>
        <img src={frontSprite(sp.id)} alt="" className="sprite idle h-44 w-44" />
        <p className="text-3xl">{sp.name} <span className="text-lg text-[#c06a00]">{RARITY[sp.rarity]}</span></p>
        <div className="flex gap-2">{sp.types.map(t => <TypeBadge key={t} type={t} />)}</div>
        <p className="text-base">Lv{mon.level}로 합류! 팀 편성에서 파티에 넣어 보세요.</p>
        <Btn color="green" onClick={onClose} className="mt-1 w-full text-xl">확인</Btn>
      </div>
    </div>
  )
}
