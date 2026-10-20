import { useState } from 'react'
import { useGame } from '../store/gameStore'
import { frontSprite } from '../data/sprites'
import { isMuted, setMuted, sfx } from '../lib/sound'
import { SUBJECT_LABEL, SUBJECTS } from '../lib/questions'
import { trainerLevel } from '../lib/progression'

export default function Title() {
  const { go, progress, subject, setSubject, startMode } = useGame()
  const [muted, setM] = useState(isMuted())
  const btn = 'pixel-btn pixel-box py-3 text-base text-white'
  return (
    <div className="flex h-full flex-col items-center gap-4 overflow-y-auto p-5 text-center" style={{ background: 'linear-gradient(#1b1b2f, #3a2f6b)' }}>
      <div className="mt-2">
        <h1 className="font-title text-xl leading-relaxed text-yellow-300" style={{ textShadow: '3px 3px 0 #c0392b' }}>
          POKÉMON<br />QUIZ BATTLE
        </h1>
        <p className="mt-2 text-xs text-gray-300">문제를 맞혀야 기술을 쓸 수 있다!</p>
      </div>
      <div className="flex gap-2">
        {[25, 6, 9, 3].map(id => <img key={id} src={frontSprite(id)} alt="" className="sprite idle h-14 w-14" />)}
      </div>
      <div className="w-full max-w-[280px]">
        <p className="mb-1 text-[11px] text-gray-300">과목</p>
        <div className="flex flex-wrap justify-center gap-1">
          {([...SUBJECTS, 'mix'] as const).map(s => (
            <button key={s} onClick={() => { sfx.select(); setSubject(s) }} className={`pixel-btn rounded border-2 px-2 py-1 text-xs ${subject === s ? 'border-yellow-300 bg-[#44446a] text-yellow-300' : 'border-gray-500'}`}>
              {SUBJECT_LABEL[s]}
            </button>
          ))}
        </div>
      </div>
      <div className="flex w-full max-w-[280px] flex-col gap-3">
        <button onClick={() => { sfx.select(); startMode('single') }} className={btn}>싱글 배틀</button>
        <button onClick={() => { sfx.select(); startMode('survival') }} className={btn}>서바이벌 <span className="text-[10px] text-yellow-300">최고 {progress.bestSurvival}</span></button>
        <button onClick={() => go('classJoin')} className={btn}>클래스 모드 (학생 입장)</button>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => go('teacher')} className="pixel-btn pixel-box py-2 text-xs">선생님 대시보드</button>
          <button onClick={() => go('admin')} className="pixel-btn pixel-box py-2 text-xs">문제 관리</button>
        </div>
        <button onClick={() => go('profile')} className="pixel-btn py-1 text-xs text-gray-300 underline">
          {progress.nickname ? `${progress.nickname} · Lv${trainerLevel(progress.exp)} · 🪙${progress.coins}` : '프로필 만들기'}
        </button>
      </div>
      <button onClick={() => { setMuted(!muted); setM(!muted) }} className="text-xs text-gray-400">{muted ? '🔇 소리 꺼짐' : '🔊 소리 켜짐'}</button>
      <p className="text-[10px] leading-relaxed text-gray-500">
        비공식 팬게임 · 포켓몬은 Nintendo/Game Freak/<br />The Pokémon Company의 상표입니다.
      </p>
    </div>
  )
}
