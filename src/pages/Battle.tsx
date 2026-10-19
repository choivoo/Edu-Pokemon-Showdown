import { ULT_COMBO, useGame } from '../store/gameStore'
import BattleScene, { Typewriter } from '../components/BattleScene'
import MoveButton from '../components/MoveButton'
import QuestionPanel from '../components/QuestionPanel'
import { TIME_LIMIT } from '../lib/questions'

export default function Battle() {
  const { battle: b, selectMove, submitAnswer, cancelQuestion, useUltimate } = useGame()
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
          <span className="ml-auto text-gray-400">정답 {b.correct}/{b.total}</span>
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
