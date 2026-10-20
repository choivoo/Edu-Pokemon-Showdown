import { useState } from 'react'
import { useGame } from '../store/gameStore'
import { frontSprite } from '../data/sprites'
import { bgm, sfx } from '../lib/sound'

export default function Title() {
  const { save, go, toggleMute, hardReset } = useGame()
  const [confirm, setConfirm] = useState(false)
  const start = () => {
    sfx.select()
    bgm.play('camp')
    go(save.started ? 'home' : 'intro')
  }
  return (
    <div className="flex h-full flex-col items-center gap-5 overflow-y-auto p-5 text-center" style={{ background: 'linear-gradient(#1b1b2f, #3a2f6b 60%, #5a3f8a)' }}>
      <div className="mt-6">
        <p className="font-title text-[10px] text-pink-300">POKÉMON</p>
        <h1 className="font-title text-xl leading-relaxed text-yellow-300" style={{ textShadow: '3px 3px 0 #c0392b' }}>
          QUEST<br />FAN EDITION
        </h1>
        <p className="mt-2 text-xs text-gray-300">별모래섬의 프리즘을 되찾아라!</p>
      </div>
      <div className="flex items-end gap-1">
        {[25, 6, 131, 94, 133].map(id => <img key={id} src={frontSprite(id)} alt="" className="sprite idle h-14 w-14" style={{ animationDelay: `${id % 5 * 0.2}s` }} />)}
      </div>
      <div className="flex w-full max-w-[260px] flex-col gap-3">
        <button onClick={start} className="pixel-btn pixel-box py-3 text-base text-white">
          {save.started ? `▶ 이어하기 (${save.name})` : '▶ 새 모험 시작'}
        </button>
        {save.started && !confirm && (
          <button onClick={() => setConfirm(true)} className="pixel-btn text-xs text-gray-400 underline">처음부터 다시 시작</button>
        )}
        {confirm && (
          <div className="pixel-box p-3 text-xs">
            저장 데이터가 모두 사라져요. 정말 처음부터 할까요?
            <div className="mt-2 flex gap-2">
              <button onClick={() => setConfirm(false)} className="pixel-btn pixel-box flex-1 py-1.5">취소</button>
              <button onClick={() => { hardReset(); setConfirm(false) }} className="pixel-btn pixel-box flex-1 bg-[#b03a2e] py-1.5">삭제</button>
            </div>
          </div>
        )}
      </div>
      <button onClick={toggleMute} className="text-xs text-gray-400">{save.muted ? '🔇 소리 꺼짐' : '🔊 소리 켜짐'}</button>
      <p className="mt-auto pb-2 text-[10px] leading-relaxed text-gray-500">
        비공식 팬게임 · 포켓몬은 Nintendo/Game Freak/<br />The Pokémon Company의 상표입니다. 비상업적 개인 프로젝트이며<br />스프라이트는 PokeAPI에서 불러옵니다.
      </p>
    </div>
  )
}
