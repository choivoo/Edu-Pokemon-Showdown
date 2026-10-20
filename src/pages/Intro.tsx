import { useState } from 'react'
import { useGame } from '../store/gameStore'
import Dialog from '../components/Dialog'
import { PROLOGUE } from '../lib/stages'
import { frontSprite } from '../data/sprites'
import { getSpecies } from '../lib/roster'
import TypeBadge from '../components/TypeBadge'
import { bgm, sfx } from '../lib/sound'

const STARTERS = [1, 4, 7, 25]

export default function Intro() {
  const { newGame, go } = useGame()
  const [step, setStep] = useState<'name' | 'story' | 'pick'>('name')
  const [name, setName] = useState('')
  const [pick, setPick] = useState(STARTERS[0])

  if (step === 'name') {
    return (
      <div className="flex h-full flex-col gap-4 p-5">
        <h2 className="font-title text-sm text-yellow-300">모험가 등록</h2>
        <label className="flex flex-col gap-2 text-xs">
          이름을 알려 주세요
          <input value={name} maxLength={8} onChange={e => setName(e.target.value)} placeholder="최대 8글자"
            className="rounded border-4 border-black bg-white px-3 py-2 text-base text-black" />
        </label>
        <div className="mt-auto flex gap-3">
          <button onClick={() => go('title')} className="pixel-btn pixel-box flex-1 py-3">뒤로</button>
          <button disabled={!name.trim()} onClick={() => { sfx.select(); bgm.play('story'); setStep('story') }} className="pixel-btn pixel-box flex-1 bg-[#3d6b3d] py-3">다음</button>
        </div>
      </div>
    )
  }
  if (step === 'story') {
    return (
      <div className="relative h-full" style={{ background: 'linear-gradient(#0b0b2a, #3b2a7a)' }}>
        <Dialog lines={PROLOGUE} name={name.trim()} onDone={() => setStep('pick')} />
      </div>
    )
  }
  const sp = getSpecies(pick)
  return (
    <div className="flex h-full flex-col gap-4 p-5">
      <h2 className="font-title text-sm text-yellow-300">첫 번째 동료</h2>
      <div className="grid grid-cols-4 gap-2">
        {STARTERS.map(id => (
          <button key={id} onClick={() => { sfx.select(); setPick(id) }} className={`pixel-btn rounded border-4 p-1 ${pick === id ? 'border-yellow-300 bg-[#44446a]' : 'border-[#555577] bg-[#2b2b45]'}`}>
            <img src={frontSprite(id)} alt="" className="sprite mx-auto h-14 w-14" />
          </button>
        ))}
      </div>
      <div className="pixel-box flex flex-col items-center gap-2 p-4">
        <img src={frontSprite(pick)} alt="" className="sprite idle h-28 w-28" />
        <p className="text-base">{sp.name}</p>
        <div className="flex gap-1">{sp.types.map(t => <TypeBadge key={t} type={t} />)}</div>
      </div>
      <button onClick={() => { bgm.play('camp'); newGame(name.trim(), pick) }} className="pixel-btn pixel-box mt-auto bg-[#b03a2e] py-3">{sp.name}와(과) 모험 시작!</button>
    </div>
  )
}
