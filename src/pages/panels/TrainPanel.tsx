import { useState } from 'react'
import { useGame } from '../../store/gameStore'
import { getMove, getSpecies } from '../../lib/roster'
import { koreanMoveName } from '../../data/questMoveKorean'
import { expToNext, MAX_LEVEL } from '../../lib/stats'
import { recallChance, recallFatigue, trainExp, TRAIN_MAX } from '../../lib/training'
import { STATUS_INFO } from '../../lib/moveSet'
import { Btn, Panel, Portrait } from '../../ui/kit'
import TypeBadge from '../../components/TypeBadge'
import Icon from '../../ui/Icon'
import { sfx } from '../../lib/sound'

const ROLE = { buff: '버프', debuff: '디버프', status: '상태이상' } as const

export default function TrainPanel() {
  const { save, openPanel, train } = useGame()
  const [targetId, setTargetId] = useState(save.party[0] ?? save.owned[0]?.id)
  const [foods, setFoods] = useState<string[]>([])
  const [mode, setMode] = useState<'exp' | 'move'>('exp')
  const [moveSlot, setMoveSlot] = useState<0|1>(0)
  const [msg, setMsg] = useState('')

  const target = save.owned.find(o => o.id === targetId)
  const picked = foods.map(id => save.owned.find(o => o.id === id)).filter((o): o is NonNullable<typeof o> => !!o)
  const now = Date.now()
  const pool = save.owned.filter(o => o.id !== targetId && !save.party.includes(o.id))
  const toggle = (id: string) => setFoods(f => (f.includes(id) ? f.filter(x => x !== id) : f.length < TRAIN_MAX ? [...f, id] : f))
  const move = target ? getMove((moveSlot===1?target.move2:target.move) ?? getSpecies(target.species).special) : null

  const go = () => {
    if (!target || !picked.length) return
    const r = train(target.id, foods, mode, moveSlot)
    if (!r) return
    setFoods([])
    if (mode === 'exp') { sfx.levelup(); setMsg(`경험치 ${r.exp}을(를) 얻었어요!`) }
    else if (r.ok && r.recall?.move) { sfx.levelup(); setMsg(`새 필살기 「${koreanMoveName(r.recall.move.name)}」을(를) 떠올렸어요!`) }
    else { sfx.faint(); setMsg('아쉽지만 아무것도 떠오르지 않았어요…') }
  }

  return (
    <Panel title="특훈" onClose={() => openPanel(null)} w={940}>
      <div className="flex gap-3" style={{ height: 380 }}>
        {/* 왼쪽: 특훈을 받을 포켓몬 */}
        <div className="pq-inner scroll-thin w-[230px] shrink-0 space-y-1 overflow-y-auto p-2">
          <p className="text-lg font-bold">특훈받을 포켓몬</p>
          {save.owned.map(o => (
            <button key={o.id} onClick={() => { setTargetId(o.id); setFoods(f => f.filter(x => x !== o.id)); setMsg('') }} className={`flex w-full items-center gap-2 border-4 px-1 py-0.5 text-left text-base ${o.id === targetId ? 'border-[#e8524a] bg-white' : 'border-[#e5a500]'}`}>
              <Portrait id={o.species} size={40} />
              <span className="flex-1 leading-tight">{getSpecies(o.species).name}<br /><span className="text-xs">Lv{o.level}{save.party.includes(o.id) ? ' · 파티' : ''}</span></span>
            </button>
          ))}
        </div>
        {/* 가운데: 재료로 쓸 포켓몬 */}
        <div className="pq-inner scroll-thin flex-1 overflow-y-auto p-2">
          <p className="text-lg font-bold">함께 훈련할 포켓몬 <span className="text-sm font-normal">(최대 {TRAIN_MAX}마리, 훈련하면 떠나요 · 파티는 제외)</span></p>
          {pool.length === 0 && <p className="p-4 text-center text-base">훈련 상대가 없어요. 요리로 포켓몬을 더 모아 보세요!</p>}
          <div className="grid grid-cols-2 gap-1">
            {pool.map(o => (
              <button key={o.id} onClick={() => toggle(o.id)} className={`flex items-center gap-2 border-4 px-1 py-0.5 text-left text-base ${foods.includes(o.id) ? 'border-[#3fbf6a] bg-[#e6ffe6]' : 'border-[#e5a500]'}`}>
                <Portrait id={o.species} size={40} />
                <span className="flex-1 leading-tight">{getSpecies(o.species).name}<br /><span className="text-xs">Lv{o.level}</span></span>
                {foods.includes(o.id) && <Icon n="check" s={22} />}
              </button>
            ))}
          </div>
        </div>
        {/* 오른쪽: 결과 미리보기 */}
        <div className="pq-inner flex w-[260px] shrink-0 flex-col gap-2 p-3">
          {target && (<>
            <div className="flex items-center gap-2"><Portrait id={target.species} size={56} /><div className="text-lg font-bold leading-tight">{getSpecies(target.species).name}<br /><span className="text-sm">Lv{target.level}{target.level < MAX_LEVEL ? ` · 다음 레벨까지 ${expToNext(target.level) - target.exp}` : ''}</span></div></div>
            <div className="flex gap-1">
              <Btn color={mode === 'exp' ? 'yellow' : 'gray'} onClick={() => { setMode('exp'); setMsg('') }} className="flex-1 px-1 py-1 text-base">경험치</Btn>
              <Btn color={mode === 'move' ? 'yellow' : 'gray'} onClick={() => { setMode('move'); setMsg('') }} className="flex-1 px-1 py-1 text-base">기술 떠올리기</Btn>
            </div>
            {mode === 'exp' ? (
              <p className="text-base leading-snug">고른 포켓몬을 훈련 상대로 삼아 경험치를 얻어요. 같은 종류·같은 타입·진화한 포켓몬일수록 더 많이 받아요.<br /><b className="text-[#c06a00]">예상 경험치 +{picked.length ? trainExp(target, picked) : 0}</b></p>
            ) : (
              <div className="text-base leading-snug">
                {target.move2 && <div className="mb-2 flex gap-1"><Btn color={moveSlot===0?'yellow':'gray'} onClick={()=>setMoveSlot(0)} className="flex-1 text-sm">기술 1 변경</Btn><Btn color={moveSlot===1?'yellow':'gray'} onClick={()=>setMoveSlot(1)} className="flex-1 text-sm">기술 2 변경</Btn></div>}
                <p>고른 포켓몬이 많고 잘 맞을수록 새 필살기를 떠올릴 확률이 올라요. 연달아 시도하면 확률이 떨어지고, 시간이 지나면 회복돼요.</p>
                <p className="mt-1">성공 확률 <b className="text-[#c06a00]">{Math.round(recallChance(target, picked, now) * 100)}%</b> <span className="text-xs">(피로 {recallFatigue(target, now)})</span></p>
              </div>
            )}
            {move && (
              <p className="flex flex-wrap items-center gap-1 text-sm"><Icon n="star" s={16} />지금 필살기: <b>{koreanMoveName(move.name)}</b> <TypeBadge type={move.type} />{move.role && <span className="border-2 border-[#2b2838] px-1" style={{ background: move.fx?.status ? STATUS_INFO[move.fx.status].color : '#fff' }}>{ROLE[move.role]}</span>}</p>
            )}
            <span className="flex-1" />
            {msg && <p className="border-4 border-[#2b2838] bg-white p-1 text-center text-base font-bold text-[#c03a30]">{msg}</p>}
            <Btn color="red" disabled={!picked.length} onClick={go} className="py-2 text-xl">특훈 시작!</Btn>
          </>)}
        </div>
      </div>
    </Panel>
  )
}
