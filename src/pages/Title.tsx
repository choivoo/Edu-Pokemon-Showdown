import { useEffect, useRef } from 'react'
import { useGame } from '../store/gameStore'
import { frontSprite } from '../data/sprites'
import { bgm, sfx } from '../lib/sound'
import { enterLandscapeFullscreen } from '../lib/fullscreen'
import { Btn } from '../ui/kit'
import Icon from '../ui/Icon'
import { useCanvas } from '../components/useCanvas'
import { H, W } from '../engine/draw'
import { drawTitleWorld } from '../art/scenes'
import { preload, sprite } from '../engine/render'

const HEROES = [25, 6, 131, 94, 133, 1, 7, 4]

export default function Title() {
  const { save, go, openPanel, toggleMute } = useGame()
  const canvas = useRef<HTMLCanvasElement>(null)
  preload(HEROES)
  useEffect(() => { bgm.play('title') }, [])

  useCanvas(canvas, (ctx, t) => {
    drawTitleWorld(ctx, t)
    // 지나가는 동료들
    HEROES.forEach((id, i) => {
      const x = ((t * 55 + i * 160) % (W + 160)) - 80
      const y = 400 + (i % 3) * 40
      const img = sprite(frontSprite(id))
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(Math.floor(x - 30), Math.floor(y - 4), 60, 8)
      if (img.complete && img.naturalWidth) { ctx.save(); ctx.translate(Math.floor(x), Math.floor(y - Math.abs(Math.sin(t * 6 + i)) * 8)); ctx.scale(-1, 1); ctx.drawImage(img, -48, -86, 96, 96); ctx.restore() }
    })
  })

  const start = () => { sfx.select(); bgm.play(save.started ? 'camp' : 'story'); go(save.started ? 'camp' : 'intro') }

  return (
    <div className="absolute inset-0">
      <canvas ref={canvas} width={W} height={H} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-x-0 bottom-20 flex flex-col items-center gap-3">
        <Btn onClick={start} className="flex w-[340px] items-center justify-center gap-3 py-3 text-2xl" quiet><Icon n="play" s={28} />{save.started ? `이어하기 (${save.name})` : '새 모험 시작'}</Btn>
        <div className="flex gap-3">
          <Btn color="blue" onClick={() => openPanel('save')} className="flex items-center gap-2 text-base"><Icon n="key" s={22} />데이터 이전</Btn>
          <Btn color="gray" onClick={() => void enterLandscapeFullscreen()} className="flex items-center gap-2 text-base"><Icon n="expand" s={22} />전체화면</Btn>
          <Btn color="gray" onClick={toggleMute} className="flex items-center gap-2 text-base"><Icon n={save.muted ? 'mute' : 'sound'} s={22} />{save.muted ? '소리 꺼짐' : '소리 켜짐'}</Btn>
        </div>
      </div>
      <p className="absolute inset-x-0 bottom-2 text-center text-[11px] leading-snug text-white/90" style={{ textShadow: '0 1px 2px #000' }}>
        비공식 팬게임 · 포켓몬은 Nintendo/Game Freak/The Pokémon Company의 상표입니다. 비상업 개인 프로젝트이며 스프라이트는 PokeAPI에서 불러옵니다.
      </p>
    </div>
  )
}
