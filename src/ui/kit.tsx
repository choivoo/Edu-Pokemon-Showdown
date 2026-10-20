import type { CSSProperties, ReactNode } from 'react'
import { frontSprite } from '../data/sprites'
import { sfx } from '../lib/sound'
import Icon from './Icon'

type Color = 'yellow' | 'green' | 'red' | 'blue' | 'gray'

export function Btn({ color = 'yellow', children, onClick, disabled, className = '', style, quiet }: {
  color?: Color; children: ReactNode; onClick?: () => void; disabled?: boolean; className?: string; style?: CSSProperties; quiet?: boolean
}) {
  return (
    <button
      disabled={disabled} style={style}
      onClick={() => { if (!quiet) sfx.select(); onClick?.() }}
      className={`pq-btn pq-${color} px-4 py-2 text-lg ${className}`}
    >{children}</button>
  )
}

/** 화면 위에 뜨는 노란 창. 바깥을 누르거나 X 버튼으로 닫는다. */
export function Panel({ title, onClose, children, w = 760, h, z = 40 }: { title: string; onClose?: () => void; children: ReactNode; w?: number; h?: number; z?: number }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/55" style={{ zIndex: z }} onClick={onClose}>
      <div className="pq-panel pop-in flex flex-col overflow-hidden" style={{ width: w, height: h, maxHeight: 510 }} onClick={e => e.stopPropagation()}>
        <div className="pq-title flex items-center justify-between px-5 py-2 text-xl">
          <span>{title}</span>
          {onClose && <button onClick={() => { sfx.select(); onClose() }} className="flex h-8 w-8 items-center justify-center"><Icon n="x" s={28} /></button>}
        </div>
        <div className="scroll-thin relative min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  )
}

/** 포켓몬 얼굴 칸 (배경색은 파티 색) */
export function Portrait({ id, bg = '#fff3c8', size = 64, dim }: { id: number; bg?: string; size?: number; dim?: boolean }) {
  return (
    <span className="inline-flex items-center justify-center overflow-hidden rounded-lg border-2 border-black/25" style={{ width: size, height: size, background: bg }}>
      <img src={frontSprite(id)} alt="" className="sprite" style={{ width: size * 1.35, height: size * 1.35, marginTop: size * 0.08, filter: dim ? 'brightness(0) opacity(0.45)' : undefined }} />
    </span>
  )
}

export function Bar({ value, max, color, label }: { value: number; max: number; color: string; label?: string }) {
  return (
    <div className="relative h-5 overflow-hidden rounded border-2 border-black/40 bg-black/40">
      <div className="h-full" style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color }} />
      {label && <span className="absolute inset-0 flex items-center justify-end pr-1 text-xs font-bold text-white" style={{ textShadow: '0 1px 0 #000' }}>{label}</span>}
    </div>
  )
}

export const PARTY_COLORS = ['#e8524a', '#3fbf6a', '#3f7fe8']
