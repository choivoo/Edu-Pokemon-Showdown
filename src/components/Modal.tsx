import type { ReactNode } from 'react'

export default function Modal({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 p-5" onClick={onClose}>
      <div className="pixel-box slide-up w-full max-w-[340px] p-4" onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  )
}
