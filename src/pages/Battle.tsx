import { useState } from 'react'
import { ULT_COMBO, useGame } from '../store/gameStore'
import BattleScene, { Typewriter } from '../components/BattleScene'
import MoveButton from '../components/MoveButton'
import QuestionPanel from '../components/QuestionPanel'
import { TIME_LIMIT } from '../lib/questions'
import { frontSprite } from '../data/sprites'

export default function Battle() {
  const { battle: b, selectMove, submitAnswer, cancelQuestion, useUltimate, switchTo } = useGame()
  const [showSwitch, setShowSwitch] = useState(false)
  if (!b) return null
  const me = b.player[b.pi]
  const canAct = b.phase === 'choose'
  const gauge = Math.min(b.combo, ULT_COMBO)
  return (
    <div className="relative flex h-full flex-col">
      <div className="min-h-0 flex-[3]">
        <BattleScene battle={b} />
      </div>
      <div className="flex flex-[2] flex-col gap-2 border-t-4 border-black bg-[#1b1b2f] p-2">
        <div className="pixel-box min-h-[3.2rem] px-3 py-2 text-[13px] leading-snug">
          <Typewriter text={b.message || ' '} />
          {b.lastExplanation && (
            <div className="mt-1 text-[11px] text-red-300">{b.lastExplanation.text}</div>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-yellow-300">콤보 {b.combo}</span>
          <div className="flex gap-1">
            {Array.from({ length: ULT_COMBO }, (_, i) => (
              <span key={i} className={`h-3 w-6 border-2 border-black ${i < gauge ? 'bg-orange-400' : 'bg-gray-700'}`} />
            ))}
          </div>
          {b.mode === 'survival' && <span className="text-green-300">격파 {b.defeated}</span>}
          <button disabled={!canAct || b.player.filter(m => m.hp > 0).length < 2} onClick={() => setShowSwitch(true)} className="pixel-btn ml-auto rounded border-2 border-white px-2 py-0.5">교체</button>
          <span className="text-gray-400">정답 {b.correct}/{b.total}</span>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-2">
          {me.moves.map(m => <MoveButton key={m.id} move={m} disabled={!canAct} onClick={() => selectMove(m)} />)}
        </div>
        {canAct && b.combo >= ULT_COMBO && (
          <button onClick={useUltimate} className="pixel-btn animate-pulse rounded border-4 border-black bg-gradient-to-r from-orange-500 to-yellow-400 py-2 text-sm font-bold text-black">
            ⚡ 필살기 발동! (문제 없이 강력한 공격)
          </button>
        )}
      </div>
      {showSwitch && canAct && (
        <div className="pixel-box slide-up absolute inset-x-0 bottom-0 z-20 rounded-t-lg p-3">
          <div className="mb-2 flex justify-between text-[11px]">
            <span className="text-yellow-300">교체할 포켓몬 (턴 소모)</span>
            <button onClick={() => setShowSwitch(false)} className="underline">닫기</button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {b.player.map((m, i) => (
              <button key={m.id} disabled={m.hp <= 0 || i === b.pi} onClick={() => { setShowSwitch(false); switchTo(i) }} className="pixel-btn rounded border-4 border-black bg-[#44446a] p-1 text-center text-[11px]">
                <img src={frontSprite(m.id)} alt="" className="sprite mx-auto h-12 w-12" />
                {m.name}<br />HP {m.hp}/{m.maxHp}
              </button>
            ))}
          </div>
        </div>
      )}
      {b.phase === 'question' && b.question && b.pendingMove && (
        <QuestionPanel
          key={b.question.id + b.total}
          question={b.question}
          timeLimit={TIME_LIMIT[b.pendingMove.difficulty]}
          moveName={b.pendingMove.name}
          onSubmit={submitAnswer}
          onCancel={cancelQuestion}
        />
      )}
    </div>
  )
}
