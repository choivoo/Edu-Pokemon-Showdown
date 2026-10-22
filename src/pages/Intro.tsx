import { useEffect, useRef, useState } from 'react'
import { useGame } from '../store/gameStore'
import Dialog from '../components/Dialog'
import { ONBOARDING_LINES } from '../lib/tutorial'
import { getSpecies } from '../lib/roster'
import { frontSprite, fallbackSpriteOnError } from '../data/sprites'
import TypeBadge from '../components/TypeBadge'
import { bgm, sfx } from '../lib/sound'
import { Btn, Panel } from '../ui/kit'
import { useCanvas } from '../components/useCanvas'
import { drawVoyage } from '../art/scenes'
import { H, W } from '../engine/draw'

const STARTERS = [1,4,7,25,133]
type Step='arrival'|'reboot'|'name'|'starters'|'pick'

/** Fully authored introductory tutorial; dialogue is original rather than lifted from retail assets. */
export default function Intro(){
  const {newGame,go}=useGame()
  const [step,setStep]=useState<Step>('arrival')
  const [name,setName]=useState('')
  const [pick,setPick]=useState(STARTERS[0])
  const canvas=useRef<HTMLCanvasElement>(null)
  useCanvas(canvas,(ctx,t)=>drawVoyage(ctx,t))
  useEffect(()=>{bgm.playScene('intro','story')},[])
  const sp=getSpecies(pick)
  return <div className="absolute inset-0">
    <canvas ref={canvas} width={W} height={H} className="absolute inset-0 h-full w-full"/>
    <div className="pointer-events-none absolute left-6 top-5 z-10 border-4 border-white bg-[#215961]/90 px-4 py-2 text-base font-bold text-[#ffe8a8] shadow-[5px_5px_0_#16383d]">
      네모루루섬 · 첫 번째 항해
    </div>
    {(step==='arrival'||step==='reboot')&&<div className="pointer-events-none absolute right-12 top-14 z-10 flex items-center gap-3 rounded-lg border-4 border-[#ecc25c] bg-[#fff2bd] p-3 shadow-[6px_7px_0_#315f5b]">
      <div className={`relative grid h-[67px] w-[67px] place-items-center rounded-xl border-4 border-[#2a5659] bg-[#9ce0d8] ${step==='arrival'?'animate-bounce':''}`}>
        <div className="flex gap-2"><i className="h-3 w-3 bg-[#294f59]"/><i className="h-3 w-3 bg-[#294f59]"/></div>
        <div className="absolute -top-3 h-2 w-12 border-2 border-[#2a5659] bg-[#fff4b7]"/>
      </div>
      <div className="text-[#3c5d58]"><b className="text-lg">모비 / MoBee</b><p className="text-sm">{step==='arrival'?'연결 불안정 · 재시작 필요':'재부팅 완료 · 안내 준비!'}</p></div>
    </div>}
    {step==='arrival'&&<Dialog key="landing" lines={[...ONBOARDING_LINES.arrival]} name="" onDone={()=>setStep('reboot')}/>}
    {step==='reboot'&&<Dialog key="reboot" lines={[...ONBOARDING_LINES.reboot]} name="" onDone={()=>setStep('name')}/>}
    {step==='name'&&<Panel title="모비 · 모험가 정보 등록" w={570}>
      <div className="space-y-4 py-2 text-center">
        <p className="text-xl">모비가 탐험 기록에 사용할 이름을 물어봐요!</p>
        <input value={name} maxLength={10} onChange={e=>setName(e.target.value)}
          placeholder="이름을 입력하세요 · 최대 10글자" autoFocus
          className="w-full border-4 border-[#c98a00] bg-white px-4 py-3 text-center text-2xl text-[#5a3a00]"/>
        <div className="flex justify-center gap-3">
          <Btn color="gray" onClick={()=>go('title')}>타이틀로</Btn>
          <Btn color="green" disabled={!name.trim()} onClick={()=>{bgm.playScene('tutorial','story');setStep('starters')}}>등록 완료 · 계속</Btn>
        </div>
      </div>
    </Panel>}
    {step==='starters'&&<Dialog key="starters" lines={[...ONBOARDING_LINES.starters]} name={name.trim()} onDone={()=>setStep('pick')}/>}
    {step==='pick'&&<Panel title="첫 동료 선택 · 첫 탐험 준비" w={780}>
      <div className="flex gap-5">
        <div className="grid grid-cols-2 gap-3">
          {STARTERS.map(id=><button key={id} onClick={()=>{sfx.select();setPick(id)}}
            aria-label={getSpecies(id).name}
            className={`rounded-xl border-4 p-1 ${pick===id?'border-[#e8524a] bg-white':'border-[#e5a500] bg-[#fff3c8]'}`}>
            <img src={frontSprite(id)} alt="" onError={e=>fallbackSpriteOnError(e.currentTarget,id)} className="sprite h-24 w-24 object-contain"/>
          </button>)}
        </div>
        <div className="pq-inner flex flex-1 flex-col items-center justify-center gap-2 p-4">
          <img src={frontSprite(pick)} alt="" onError={e=>fallbackSpriteOnError(e.currentTarget,pick)} className="sprite idle h-40 w-40 object-contain"/>
          <p className="text-2xl">{sp.name}</p>
          <div className="flex gap-2">{sp.types.map(t=><TypeBadge key={t} type={t}/>)}</div>
          <p className="text-center text-sm leading-snug">처음에는 한 마리와 함께해요. 첫 탐험에서 P스톤을 얻고, 두 번째 탐험 뒤 구구·꼬렛을 만나요.</p>
          <Btn color="red" onClick={()=>{sfx.select();newGame(name.trim(),pick)}} className="mt-1 w-full text-xl">1-1 첫 전투 시작!</Btn>
        </div>
      </div>
    </Panel>}
  </div>
}