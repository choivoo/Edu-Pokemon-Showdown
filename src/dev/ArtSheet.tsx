import { useRef } from 'react'
import { ICON_NAMES, iconUrl } from '../art/icons'
import { useCanvas } from '../components/useCanvas'
import { drawBattleWorld, flush } from '../art/world'
import { drawCamp, drawIsland, drawTitleWorld, drawVoyage } from '../art/scenes'
import type { Theme } from '../lib/stages'

const THEMES: Theme[] = ['beach', 'forest', 'cave', 'gorge', 'volcano', 'altar']

function Scene({ draw, w = 480 }: { draw: (ctx: CanvasRenderingContext2D, t: number) => void; w?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useCanvas(ref, (ctx, t) => draw(ctx, t))
  return <canvas ref={ref} width={960} height={540} style={{ width: w, height: (w * 540) / 960, imageRendering: 'pixelated' }} />
}

/** 개발용: #art 주소로 열면 코드로 찍은 도트 그림을 한눈에 확인할 수 있다 */
export default function ArtSheet() {
  return (
    <div className="min-h-full bg-[#5aa84a] p-4">
      <div className="flex flex-wrap gap-3">
        {ICON_NAMES.map(n => (
          <div key={n} className="flex flex-col items-center text-xs text-white">
            <img src={iconUrl(n)} alt={n} className="sprite bg-[#3b3f4f]" style={{ width: 64, height: 64, imageRendering: 'pixelated' }} />
            {n}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        {THEMES.map(th => <Scene key={th} draw={(ctx, t) => { drawBattleWorld(th, t * 30, t); flush(ctx) }} />)}
        <Scene draw={(ctx, t) => drawCamp(ctx, t, [], false)} />
        <Scene draw={(ctx, t) => drawIsland(ctx, t, [true, true, false, false, false, false], false)} />
        <Scene draw={(ctx, t) => drawTitleWorld(ctx, t)} />
        <Scene draw={(ctx, t) => drawVoyage(ctx, t)} />
      </div>
    </div>
  )
}
