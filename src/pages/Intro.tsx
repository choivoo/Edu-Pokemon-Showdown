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
const STEPS:Step[]=['arrival','reboot','name','starters','pick']
/** Noncommercial fan intro: independent dialogue, no original retail VO/images. */
export default function Intro(){
  const {newGame,go}=useGame()
  const [step,setStep]=useState<Step>('arrival')
  const [name,setName]=useState('')
  const [pick,setPick]=useState(STARTERS[0])
  const canvas=useRef<HTMLCanvasElement>(null)
  useCanvas(canvas,(ctx,t)=>drawVoyage(ctx,t))
  useEffect(()=>{bgm.playScene('intro','story')},[])
  const sp=getSpecies(pick)
  const progress=STEPS.indexOf(step)+1
  const crashing=step==='arrival'
  return <div className="absolute inset-0 overflow-hidden">
    <canvas ref={canvas} width={W} height={H} className="absolute inset-0 h-full w-full"/>
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#276b69]/10 via-transparent to-[#123e44]/35"/>
    <div className="pointer-events-none absolute left-5 top-5 z-10 border-[5px] border-[#ffe8a0] bg-[#205963]/95 px-4 py-2 text-[#ffe8a8] shadow-[5px_6px_0_#16383d]">
      <p className="text-xs tracking-[.25em]">TUMBLECUBE ISLAND · PROLOGUE</p>
      <b className="text-lg">네모루루섬으로 출발!</b>
      <div className="mt-1 flex gap-1">{STEPS.map((item,i)=><span key={item} className={`h-2 w-10 border border-[#ffe8a0]/50 ${i<progress?'bg-[#ffd653]':'bg-[#19464b]'}`}/>)}</div>
    </div>
    <div className="pointer-events-none absolute right-10 top-12 z-10 flex items-center gap-3 border-[5px] border-[#eac65b] bg-[#fff3c8] px-4 py-2 shadow-[6px_7px_0_#235456]">
      <div className={`relative grid h-[78px] w-[78px] place-items-center rounded-xl border-4 border-[#2e6563] ${crashing?'bg-[#ec9984]':'bg-[#9ce0d8]'} ${crashing?'animate-pulse':'animate-bounce'}`}>
        <span className="absolute -top-3 h-2 w-12 border-2 border-[#2b535b] bg-[#fff5bf]"/>
        <div className="flex gap-3"><span className="h-3 w-3 bg-[#284e59]"/><span className="h-3 w-3 bg-[#284e59]"/></div>
        <span className="absolute bottom-2 text-xs font-black text-[#28565c]">{crashing?'!!':'◡'}</span>
      </div>
      <div className="min-w-[172px] text-[#375955]"><b className="text-xl">모비 · MoBee</b>
        <p className="text-sm">{step==='arrival'?'신호 불안정 · 착륙 중':step==='reboot'?'재시작 중 · 안내 복구':step==='name'?'탐험 기록을 등록합니다':step==='starters'?'첫 동료를 찾는 중':'스타팅 포켓몬을 골라요'}</p>
        <div className="mt-1 h-2 w-full overflow-hidden bg-[#a9c6a5]"><div className="h-2 bg-[#f1c454]" style={{width:`${progress/STEPS.length*100}%`}}/></div>
      </div>
    </div>
    {step==='arrival'&&<Dialog key="landing" lines={[...ONBOARDING_LINES.arrival]} name="" onDone={()=>setStep('reboot')}/>}
    {step==='reboot'&&<Dialog key="reboot" lines={[...ONBOARDING_LINES.reboot]} name="" onDone={()=>setStep('name')}/>}
    {step==='name'&&<Panel title="모비 · 탐험가 등록" w={590}>
      <div className="space-y-4 py-3 text-center">
        <p className="text-xl font-bold">섬의 첫 번째 탐험가가 되어 볼까요?</p>
        <p className="text-sm text-[#825f34]">이름은 모비의 탐험 기록과 캠프에 표시돼요.</p>
        <input value={name} maxLength={12} onChange={e=>setName(e.target.value)}
          placeholder="탐험가 이름을 입력하세요 · 최대 12글자" autoFocus aria-label="탐험가 이름"
          onKeyDown={e=>{if(e.key==='Enter'&&name.trim()){bgm.playScene('tutorial','story');setStep('starters')}}}
          className="w-full border-4 border-[#c98a00] bg-white px-4 py-3 text-center text-2xl text-[#5a3a00]"/>
        <div className="flex justify-center gap-3">
          <Btn color="gray" onClick={()=>go('title')}>타이틀로</Btn>
          <Btn color="green" disabled={!name.trim()} onClick={()=>{bgm.playScene('tutorial','story');setStep('starters')}}>모비에 등록하기</Btn>
        </div>
      </div>
    </Panel>}
    {step==='starters'&&<Dialog key="starters" lines={[...ONBOARDING_LINES.starters]} name={name.trim()} onDone={()=>setStep('pick')}/>}
    {step==='pick'&&<Panel title="첫 동료 선택 · 선택하면 바로 1-1 탐험!" w={820}>
      <div className="flex gap-4">
        <div className="grid grid-cols-3 gap-2">
          {STARTERS.map(id=><button key={id} onClick={()=>{sfx.select();setPick(id)}}
            aria-label={getSpecies(id).name} aria-pressed={pick===id}
            className={`flex w-[100px] flex-col items-center rounded-lg border-4 p-1 transition-transform hover:-translate-y-1 ${pick===id?'border-[#df5936] bg-white shadow-[0_4px_0_#dc7f2c]':'border-[#e5a500] bg-[#fff3c8]'}`}>
            <img src={frontSprite(id)} alt="" onError={e=>fallbackSpriteOnError(e.currentTarget,id)} className="sprite h-[68px] w-[68px] object-contain"/>
            <span className="text-sm font-bold">{getSpecies(id).name}</span>
          </button>)}
        </div>
        <div className="pq-inner flex min-w-0 flex-1 flex-col items-center justify-center gap-2 p-3">
          <img src={frontSprite(pick)} alt="" onError={e=>fallbackSpriteOnError(e.currentTarget,pick)} className="sprite idle h-32 w-32 object-contain"/>
          <b className="text-2xl">{sp.name}</b>
          <div className="flex gap-2">{sp.types.map(t=><TypeBadge key={t} type={t}/>)}</div>
          <p className="text-center text-sm leading-relaxed">처음에는 한 마리와 시작해요. <b>첫 전투 → P스톤 장착 → 두 번째 전투 → 요리 → 구구·꼬렛</b> 순서로 배워요.</p>
          <Btn color="red" onClick={()=>{sfx.select();newGame(name.trim(),pick)}} className="mt-1 w-full text-xl">선택 완료 · 1-1 바로 출발!</Btn>
        </div>
      </div>
    </Panel>}
  </div>
}
