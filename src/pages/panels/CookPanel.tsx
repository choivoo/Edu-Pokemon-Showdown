import { useState } from 'react'
import { areaCleared, useGame } from '../../store/gameStore'
import {
  ALL_RECIPES, COLOR_LABEL, COOKING_TIERS, DISH_SIZE, getIngredient, GRADE_LABEL, gradeOf, INGREDIENTS, type CookingTier, type IngredientId, KIND_LABEL, recipeFor, TEXTURE_LABEL,
} from '../../lib/cooking'
import { getSpecies } from '../../lib/roster'
import { frontSprite, fallbackSpriteOnError } from '../../data/sprites'
import { Btn, Panel } from '../../ui/kit'
import Icon, { RarityMark } from '../../ui/Icon'
import TypeBadge from '../../components/TypeBadge'
import { sfx } from '../../lib/sound'
import type { OwnedMon } from '../../lib/stats'

export default function CookPanel() {
  const { save, startCooking, collectCooked, openPanel } = useGame()
  const [sel, setSel] = useState<IngredientId[]>([])
  const [tier, setTier] = useState<CookingTier>(0)
  const pot = COOKING_TIERS[tier]
  const [got, setGot] = useState<{ mon: OwnedMon; isNew: boolean } | null>(null)
  const [book, setBook] = useState(false)

  const used = (id: IngredientId) => sel.filter(s => s === id).length
  const add = (id: IngredientId) => {
    if (!!save.pot || sel.length >= DISH_SIZE || (used(id) + 1) * pot.perSlot > save.ingredients[id]) return
    sfx.select()
    setSel([...sel, id])
  }
  const recipe = sel.length ? recipeFor(sel) : null
  const grade = sel.length ? gradeOf(sel) : null
  const owned = INGREDIENTS.filter(i => save.ingredients[i.id] >= pot.perSlot || used(i.id) > 0)

  const autoFill = () => {
    const best = INGREDIENTS.filter(i => i.rarity === 0).map(i => ({ id: i.id, n: save.ingredients[i.id] })).sort((a, b) => b.n - a.n)[0]
    setSel(Array(Math.min(DISH_SIZE, Math.floor(best.n / pot.perSlot))).fill(best.id))
  }

  const cookNow = () => {
    if (sel.length !== DISH_SIZE || save.pot) return
    if (startCooking(sel, tier)) { sfx.cook(); setSel([]) }
  }
  const collectNow = () => {
    const known = new Set(save.dex)
    const mon = collectCooked()
    if (mon) {
      setGot({ mon, isNew: !known.has(mon.species) })
      sfx.cry(mon.species)
      sfx.levelup()
    }
  }

  return (
    <Panel title="요리 냄비" onClose={() => openPanel(null)} w={900}>
      <div className="mb-2 flex gap-1.5">
        {COOKING_TIERS.map((p, index) => {
          const unlocked = p.unlockArea < 0 || areaCleared(save, p.unlockArea)
          return <Btn key={p.name} color={tier === index ? 'yellow' : 'gray'} disabled={!unlocked || !!save.pot}
            onClick={() => { setTier(index as CookingTier); setSel([]) }} className="flex-1 px-1 py-1 text-sm">
            {unlocked ? p.name : '잠김'} <span className="text-xs">×{p.perSlot}</span>
          </Btn>
        })}
      </div>
      <div className="flex gap-4" style={{ height: 345 }}>
        <div className="flex w-[330px] flex-col items-center gap-2">
          <div className={`pq-dark flex w-full flex-col items-center gap-2 p-3 ${!!save.pot ? 'animate-bounce' : ''}`}>
            <div className="bg-black/30 px-4 py-0.5 text-lg">{sel.length} / {DISH_SIZE}</div>
            <div className="flex flex-wrap justify-center gap-2">
              {Array.from({ length: DISH_SIZE }, (_, i) => (
                <button key={i} onClick={() => !!!save.pot && sel[i] && setSel(sel.filter((_, k) => k !== i))} className="flex h-[62px] w-[62px] items-center justify-center border-4 border-dashed border-white/30 bg-black/30">
                  {sel[i] && <Icon n={getIngredient(sel[i]).icon} s={48} />}
                </button>
              ))}
            </div>
          </div>
          <div className="min-h-[88px] w-full text-center text-base">
            {recipe && grade ? (<>
              <p className="text-lg font-bold text-[#c06a00]">{recipe.name} <span className="text-base">({GRADE_LABEL[grade]})</span></p>
              <p className="flex flex-wrap items-center justify-center gap-1 pt-1">
                {recipe.no === 18 || recipe.no === 1 ? <span className="text-sm">여러 타입이 찾아와요</span> : recipe.types.map(t => <TypeBadge key={t} type={t} />)}
              </p>
            </>) : <p className="pt-3 text-sm">재료를 눌러 냄비에 넣어 보세요 (칸당 {pot.perSlot}개 소모)</p>}
          </div>
          <div className="mt-auto flex w-full gap-2">
            <Btn color="blue" disabled={!!save.pot} onClick={autoFill} className="flex-1 text-sm">같은 재료로 채우기</Btn>
            <Btn color="red" disabled={sel.length !== DISH_SIZE || !!save.pot} onClick={cookNow} className="flex-1 text-xl">{!!save.pot ? '보글보글…' : '요리!'}</Btn>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm leading-snug">재료의 <b>색·식감·종류</b>가 얼마나 들어갔는지로 요리가 정해져요. 귀한 재료일수록 요리 등급이 높아져 희귀한 친구가 올 확률이 올라가요.</p>
            <Btn color="yellow" onClick={() => setBook(true)} className="shrink-0 px-3 py-1 text-sm">레시피</Btn>
          </div>
          <div className="pq-inner scroll-thin grid flex-1 grid-cols-3 content-start gap-2 overflow-y-auto p-2">
            {owned.length === 0 && <p className="col-span-3 p-6 text-center text-base">재료가 없어요. 탐험에서 얻거나 상점에서 사 보세요.</p>}
            {owned.map(i => {
              const left = save.ingredients[i.id] - used(i.id) * pot.perSlot
              return (
                <button key={i.id} disabled={left < pot.perSlot || sel.length >= DISH_SIZE || !!save.pot} onClick={() => add(i.id)} className="flex flex-col items-center gap-0.5 border-4 border-[#c98a00] bg-white/70 p-1 disabled:opacity-40">
                  <Icon n={i.icon} s={44} />
                  <span className="text-sm font-bold">{i.name}</span>
                  <span className="text-xs text-[#8a5a10]">{i.color === 'all' ? '모든 색' : COLOR_LABEL[i.color]} · {i.texture === 'all' ? '모든 식감' : TEXTURE_LABEL[i.texture]}</span>
                  <span className="text-xs text-[#8a5a10]">{i.kind === 'all' ? '모든 종류' : KIND_LABEL[i.kind]}</span>
                  <span className="text-lg font-bold text-[#c06a00]">×{left}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {book && (
        <div className="absolute inset-0 z-10 flex flex-col bg-[#fff3c8] p-3">
          <div className="mb-2 flex items-center justify-between"><b className="text-xl text-[#c06a00]">레시피 18종</b><Btn color="gray" onClick={() => setBook(false)} className="px-3 py-1 text-sm">닫기</Btn></div>
          <div className="scroll-thin grid flex-1 grid-cols-2 gap-x-4 gap-y-1 overflow-y-auto text-sm">
            {ALL_RECIPES.map(r => (
              <div key={r.no} className="flex items-center gap-2 border-b-2 border-[#e5c36a] py-1">
                <span className="w-6 text-center font-bold text-[#c06a00]">{r.no}</span>
                <span className="w-28 font-bold">{r.name}</span>
                <span className="flex-1 text-xs text-[#8a5a10]">{r.hint}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {save.pot && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[#fff3c8] p-8 text-center">
          <Icon n="pot" s={80} />
          <p className="text-3xl font-bold text-[#b77512]">냄비에서 맛있는 요리가 끓고 있어요!</p>
          <p className="text-xl">{COOKING_TIERS[save.pot.tier ?? 0].name} · {ALL_RECIPES.find(r => r.no === save.pot!.recipe)?.name ?? '네모루루수프'}</p>
          <div className="w-[420px] max-w-full border-4 border-[#9b7832] bg-[#e7d0a3] p-2">
            <div className="h-7 bg-[#e8b34d]" style={{ width: (100 * (save.pot.total - save.pot.remaining) / save.pot.total) + '%' }} />
          </div>
          {save.pot.remaining > 0 ? (
            <>
              <p className="text-2xl font-bold">{save.pot.remaining}번 탐험하면 완성!</p>
              <p className="text-base text-[#755d38]">모험에 출발했다가 돌아오면 요리가 한 단계씩 진행돼요.</p>
              <Btn color="yellow" onClick={() => openPanel(null)} className="px-10 py-3 text-xl">탐험하러 가기</Btn>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-[#3a995b]">요리 완성! 새 동료가 기다리고 있어요.</p>
              <Btn color="green" onClick={collectNow} className="px-10 py-3 text-xl">냄비 열기</Btn>
            </>
          )}
        </div>
      )}
      {got && <Reveal mon={got.mon} isNew={got.isNew} onClose={() => setGot(null)} />}
    </Panel>
  )
}

function Reveal({ mon, isNew, onClose }: { mon: OwnedMon; isNew: boolean; onClose: () => void }) {
  const sp = getSpecies(mon.species)
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/65" onClick={onClose}>
      <div className="pq-panel pop-in flex w-[460px] flex-col items-center gap-2 p-6 text-center">
        <p className="flex items-center gap-1 text-xl text-[#c06a00]"><Icon n="sparkle" s={24} />{isNew ? '처음 만나는 친구가 찾아왔어요!' : '친구가 찾아왔어요!'}</p>
        <img src={frontSprite(sp.id)} alt="" onError={e => fallbackSpriteOnError(e.currentTarget, sp.id)} className="sprite idle h-44 w-44 object-contain" />
        <p className="flex items-center gap-2 text-3xl">{sp.name} <RarityMark rarity={sp.rarity} s={20} /></p>
        <div className="flex gap-2">{sp.types.map(t => <TypeBadge key={t} type={t} />)}</div>
        <p className="text-base">Lv{mon.level}로 합류! 팀 편성에서 파티에 넣어 보세요.</p>
        <Btn color="green" onClick={onClose} className="mt-1 w-full text-xl">확인</Btn>
      </div>
    </div>
  )
}
