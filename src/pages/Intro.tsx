import { useRef, useState } from 'react'
import { useGame } from '../store/gameStore'
import Dialog from '../components/Dialog'
import { PROLOGUE } from '../lib/stages'
import { getSpecies } from '../lib/roster'
import { frontSprite, fallbackSpriteOnError } from '../data/sprites'
import TypeBadge from '../components/TypeBadge'
import { bgm, sfx } from '../lib/sound'
import { Btn, Panel } from '../ui/kit'
import { useCanvas } from '../components/useCanvas'
import { drawVoyage } from '../art/scenes'
import { H, W } from '../engine/draw'

const STARTERS = [1, 4, 7, 25, 133]

export default function Intro() {
  const { newGame, go } = useGame()
  const [step, setStep] = useState<'name' | 'story' | 'pick'>('name')
  const [name, setName] = useState('')
  const [pick, setPick] = useState(STARTERS[0])
  const canvas = useRef<HTMLCanvasElement>(null)
  useCanvas(canvas, (ctx, t) => drawVoyage(ctx, t))

  const sp = getSpecies(pick)
  return (
    <div className="absolute inset-0">
      <canvas ref={canvas} width={W} height={H} className="absolute inset-0 h-full w-full" />

      {step === 'name' && (
        <Panel title="모험가 등록" w={560}>
          <div className="space-y-4 py-2 text-center">
            <p className="text-xl">이름을 알려 주세요!</p>
            <input value={name} maxLength={8} onChange={e => setName(e.target.value)} placeholder="최대 8글자" autoFocus
              className="w-full border-4 border-[#c98a00] bg-white px-4 py-3 text-center text-2xl text-[#5a3a00]" />
            <div className="flex justify-center gap-4">
              <Btn color="gray" onClick={() => go('title')}>뒤로</Btn>
              <Btn color="green" disabled={!name.trim()} onClick={() => { bgm.playScene('intro','story'); setStep('story') }}>다음</Btn>
            </div>
          </div>
        </Panel>
      )}

      {step === 'story' && <Dialog lines={PROLOGUE} name={name.trim()} onDone={() => setStep('pick')} />}

      {step === 'pick' && (
        <Panel title="첫 번째 동료를 골라 주세요" w={780}>
          <div className="flex gap-5">
            <div className="grid grid-cols-2 gap-3">
              {STARTERS.map(id => (
                <button key={id} onClick={() => { sfx.select(); setPick(id) }} className={`rounded-xl border-4 p-1 ${pick === id ? 'border-[#e8524a] bg-white' : 'border-[#e5a500] bg-[#fff3c8]'}`}>
                  <img src={frontSprite(id)} alt="" onError={e => fallbackSpriteOnError(e.currentTarget, id)} className="sprite h-24 w-24 object-contain" />
                </button>
              ))}
            </div>
            <div className="pq-inner flex flex-1 flex-col items-center justify-center gap-2 p-4">
              <img src={frontSprite(pick)} alt="" onError={e => fallbackSpriteOnError(e.currentTarget, pick)} className="sprite idle h-40 w-40 object-contain" />
              <p className="text-2xl">{sp.name}</p>
              <div className="flex gap-2">{sp.types.map(t => <TypeBadge key={t} type={t} />)}</div>
              <p className="text-sm">첫 동료 한 마리로 시작해요. 요리로 동료를 모으세요!</p>
              <Btn color="red" onClick={() => { bgm.play('camp'); newGame(name.trim(), pick) }} className="mt-1 w-full text-xl">{sp.name}와(과) 모험 시작!</Btn>
            </div>
          </div>
        </Panel>
      )}
    </div>
  )
}
