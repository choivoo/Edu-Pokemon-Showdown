import { useEffect, useRef, useState } from 'react'
import type { Question } from '../types'
import { sfx } from '../lib/sound'

interface Props {
  question: Question
  timeLimit: number
  moveName: string
  onSubmit: (input: string | null, timeLeftRatio: number) => void
  onCancel: () => void
  noCancel?: boolean
}

export default function QuestionPanel({ question, timeLimit, moveName, onSubmit, onCancel, noCancel }: Props) {
  const [left, setLeft] = useState(timeLimit)
  const [text, setText] = useState('')
  const done = useRef(false)
  const deadline = useRef(Date.now() + timeLimit * 1000)

  const submit = (input: string | null) => {
    if (done.current) return
    done.current = true
    const ratio = Math.max(0, (deadline.current - Date.now()) / (timeLimit * 1000))
    onSubmit(input, ratio)
  }

  useEffect(() => {
    let lastTick = Math.ceil(timeLimit)
    const t = setInterval(() => {
      const remain = Math.max(0, (deadline.current - Date.now()) / 1000)
      setLeft(remain)
      if (remain <= 3 && Math.ceil(remain) !== lastTick && remain > 0) { lastTick = Math.ceil(remain); sfx.tick() }
      if (remain <= 0) { clearInterval(t); submit(null) }
    }, 100)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const ratio = left / timeLimit
  const barColor = ratio > 0.5 ? '#3ddc5a' : ratio > 0.2 ? '#f5d02e' : '#ee3b3b'

  return (
    <div className="pixel-box absolute inset-x-0 bottom-0 z-20 slide-up rounded-t-lg p-3">
      <div className="mb-2 flex items-center justify-between text-[11px]">
        <span className="text-yellow-300">{moveName} 발동 조건!</span>
        {!noCancel && <button onClick={() => { if (!done.current) { done.current = true; onCancel() } }} className="text-gray-300 underline">취소</button>}
      </div>
      <div className="mb-2 h-3 border-2 border-black bg-gray-700">
        <div className="h-full" style={{ width: `${ratio * 100}%`, background: barColor, transition: 'width 0.1s linear' }} />
      </div>
      <p className="mb-3 min-h-[2.5rem] text-[15px] leading-snug">{question.question}</p>

      {question.type === 'choice' && (
        <div className="grid grid-cols-2 gap-2">
          {question.choices!.map(c => (
            <button key={c} onClick={() => submit(c)} className="pixel-btn rounded border-4 border-black bg-[#4a6fd8] px-2 py-3 text-[14px] text-white">{c}</button>
          ))}
        </div>
      )}
      {question.type === 'ox' && (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => submit('O')} className="pixel-btn rounded border-4 border-black bg-[#3d9a5a] py-4 text-3xl text-white">O</button>
          <button onClick={() => submit('X')} className="pixel-btn rounded border-4 border-black bg-[#d84a4a] py-4 text-3xl text-white">X</button>
        </div>
      )}
      {question.type === 'number' && (
        <form onSubmit={e => { e.preventDefault(); if (text.trim()) submit(text) }} className="flex gap-2">
          <input
            autoFocus inputMode="numeric" value={text} onChange={e => setText(e.target.value)}
            className="min-w-0 flex-1 rounded border-4 border-black bg-white px-3 py-2 text-lg text-black" placeholder="정답 입력"
          />
          <button type="submit" disabled={!text.trim()} className="pixel-btn rounded border-4 border-black bg-[#4a6fd8] px-4 text-white">확인</button>
        </form>
      )}
    </div>
  )
}
