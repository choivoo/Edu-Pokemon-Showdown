import { useRef } from 'react'
import { useGame } from '../store/gameStore'
import { frontSprite } from '../data/sprites'
import { bgm, sfx } from '../lib/sound'
import { enterLandscapeFullscreen } from '../lib/fullscreen'
import { Btn } from '../ui/kit'
import { useCanvas } from '../components/useCanvas'
import { drawGround, H, W } from '../engine/draw'
import { preload, sprite } from '../engine/render'

const HEROES = [25, 6, 131, 94, 133, 1, 7, 4]

export default function Title() {
  const { save, go, openPanel, toggleMute } = useGame()
  const canvas = useRef<HTMLCanvasElement>(null)
  preload(HEROES)

  useCanvas(canvas, (ctx, t) => {
    ctx.imageSmoothingEnabled = false
    drawGround(ctx, 'forest', t * 40, t)
    // 지나가는 동료들
    HEROES.forEach((id, i) => {
      const x = ((t * 55 + i * 160) % (W + 160)) - 80
      const y = 400 + (i % 3) * 40
      const img = sprite(frontSprite(id))
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(x, y, 30, 10, 0, 0, Math.PI * 2); ctx.fill()
      if (img.complete && img.naturalWidth) { ctx.save(); ctx.translate(x, y - Math.abs(Math.sin(t * 6 + i)) * 8); ctx.scale(-1, 1); ctx.drawImage(img, -48, -86, 96, 96); ctx.restore() }
    })
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(0, 0, W, H)
  })

  const start = () => { sfx.select(); bgm.play('camp'); go(save.started ? 'camp' : 'intro') }

  return (
    <div className="absolute inset-0">
      <canvas ref={canvas} width={W} height={H} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-x-0 top-8 text-center">
        <p className="font-title text-2xl text-pink-500" style={{ textShadow: '3px 3px 0 #fff' }}>POKÉMON</p>
        <h1 className="font-title mt-2 text-6xl text-[#ffc400]" style={{ textShadow: '5px 5px 0 #c0392b, 0 0 0 #000', WebkitTextStroke: '2px #8a3a00' }}>QUEST</h1>
        <p className="mx-auto mt-3 inline-block rounded-full bg-[#e8524a] px-6 py-1 text-xl font-bold text-white shadow-[0_4px_0_#8a2a26]">FAN EDITION</p>
      </div>
      <div className="absolute inset-x-0 bottom-20 flex flex-col items-center gap-3">
        <Btn onClick={start} className="w-[320px] py-3 text-2xl" quiet>{save.started ? `▶ 이어하기 (${save.name})` : '▶ 새 모험 시작'}</Btn>
        <div className="flex gap-3">
          <Btn color="blue" onClick={() => openPanel('save')} className="text-base">🔑 데이터 이전</Btn>
          <Btn color="gray" onClick={() => void enterLandscapeFullscreen()} className="text-base">⛶ 전체화면</Btn>
          <Btn color="gray" onClick={toggleMute} className="text-base">{save.muted ? '🔇 소리 꺼짐' : '🔊 소리 켜짐'}</Btn>
        </div>
      </div>
      <p className="absolute inset-x-0 bottom-2 text-center text-[11px] leading-snug text-white/90" style={{ textShadow: '0 1px 2px #000' }}>
        비공식 팬게임 · 포켓몬은 Nintendo/Game Freak/The Pokémon Company의 상표입니다. 비상업 개인 프로젝트이며 스프라이트는 PokeAPI에서 불러옵니다.
      </p>
    </div>
  )
}
