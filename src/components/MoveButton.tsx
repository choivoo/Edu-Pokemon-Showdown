import type { Difficulty, Move } from '../types'
import { TYPE_COLOR, TYPE_LABEL } from '../lib/typeChart'

const STARS: Record<Difficulty, string> = { easy: '★☆☆', normal: '★★☆', hard: '★★★' }
const LABEL: Record<Difficulty, string> = { easy: '쉬움', normal: '보통', hard: '어려움' }

interface Props { move: Move; disabled?: boolean; onClick: () => void }

export default function MoveButton({ move, disabled, onClick }: Props) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="pixel-btn flex flex-col items-start rounded border-4 border-black px-2 py-1.5 text-left"
      style={{ background: TYPE_COLOR[move.type], textShadow: '1px 1px 0 #0008' }}
    >
      <span className="text-[12px] font-bold text-white">{move.name}</span>
      <span className="text-[10px] text-white">{TYPE_LABEL[move.type]} · 위력 {move.power}</span>
      <span className="text-[10px] text-yellow-100">{STARS[move.difficulty]} {LABEL[move.difficulty]}</span>
    </button>
  )
}
