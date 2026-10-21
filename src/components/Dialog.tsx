import { useEffect, useState } from 'react'
import type { DialogLine } from '../lib/stages'
import { sfx } from '../lib/sound'

interface Props { lines: DialogLine[]; name: string; onDone: () => void }

/** 원작처럼 화면 아래에 뜨는 노란 대사창. 탭하면 글자를 모두 보여주고, 다시 탭하면 다음 줄로 넘어간다. */
export default function Dialog({ lines, name, onDone }: Props) {
  const [i, setI] = useState(0)
  const [n, setN] = useState(0)
  const line = lines[i]
  const text = line.text.replaceAll('{name}', name || '모험가')

  useEffect(() => {
    setN(0)
    const t = setInterval(() => setN(v => (v >= text.length ? (clearInterval(t), v) : v + 1)), 28)
    return () => clearInterval(t)
  }, [text])

  const advance = () => {
    sfx.select()
    if (n < text.length) return setN(text.length)
    if (i + 1 >= lines.length) return onDone()
    setI(i + 1)
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/30" onClick={advance}>
      <div className="pq-panel pop-in mx-auto mb-8 w-[780px] px-8 py-5">
        {line.speaker && <p className="mb-1 text-lg font-bold text-[#c06a00]">{line.speaker}</p>}
        <p className="min-h-[3.4rem] text-[22px] leading-snug">{text.slice(0, n)}</p>
        <div className="mt-2 flex items-center justify-between text-sm text-[#a06a10]">
          <button onClick={e => { e.stopPropagation(); onDone() }} className="underline">건너뛰기</button>
          <span className={n >= text.length ? 'cursor' : ''}>{i + 1}/{lines.length}</span>
        </div>
      </div>
    </div>
  )
}
