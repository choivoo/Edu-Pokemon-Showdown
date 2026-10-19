import { useGame } from '../store/gameStore'
import { frontSprite } from '../data/sprites'
import { isMuted, setMuted, sfx } from '../lib/sound'
import { useState } from 'react'

export default function Title() {
  const { go, progress } = useGame()
  const [muted, setM] = useState(isMuted())
  const start = () => { sfx.select(); go(progress.nickname ? 'team' : 'profile') }
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-6 text-center" style={{ background: 'linear-gradient(#1b1b2f, #3a2f6b)' }}>
      <div>
        <h1 className="font-title text-xl leading-relaxed text-yellow-300" style={{ textShadow: '3px 3px 0 #c0392b' }}>
          POKÉMON<br />QUIZ BATTLE
        </h1>
        <p className="mt-2 text-xs text-gray-300">문제를 맞혀야 기술을 쓸 수 있다!</p>
      </div>
      <div className="flex gap-2">
        {[25, 6, 9, 3].map(id => <img key={id} src={frontSprite(id)} alt="" className="sprite idle h-16 w-16" />)}
      </div>
      <div className="flex w-full max-w-[260px] flex-col gap-3">
        <button onClick={start} className="pixel-btn pixel-box py-3 text-base text-white">싱글 배틀</button>
        <button disabled className="pixel-btn pixel-box py-3 text-base text-gray-400">서바이벌 (준비 중)</button>
        <button disabled className="pixel-btn pixel-box py-3 text-base text-gray-400">클래스 모드 (준비 중)</button>
        <button onClick={() => go('profile')} className="pixel-btn py-2 text-xs text-gray-300 underline">
          {progress.nickname ? `${progress.nickname} · 프로필 수정` : '프로필'}
        </button>
      </div>
      <button onClick={() => { setMuted(!muted); setM(!muted) }} className="text-xs text-gray-400">{muted ? '🔇 소리 꺼짐' : '🔊 소리 켜짐'}</button>
      <p className="text-[10px] leading-relaxed text-gray-500">
        비공식 팬게임 · 포켓몬은 Nintendo/Game Freak/<br />The Pokémon Company의 상표입니다.
      </p>
    </div>
  )
}
