import { useRef } from 'react'
import { shardCount, useGame } from '../store/gameStore'
import { AREAS } from '../lib/stages'
import { getSpecies } from '../lib/roster'
import { partyMons } from '../lib/party'
import { useCanvas } from '../components/useCanvas'
import { drawCamp, POT } from '../engine/scenes'
import { H, W } from '../engine/draw'
import { preload } from '../engine/render'
import { Btn, PARTY_COLORS, Portrait } from '../ui/kit'
import { sfx } from '../lib/sound'
import { useEffect } from 'react'
import { bgm } from '../lib/sound'

export default function Camp() {
  const { save, go, openPanel, toggleMute } = useGame()
  const canvas = useRef<HTMLCanvasElement>(null)
  const party = partyMons(save)
  const others = save.owned.filter(o => !save.party.includes(o.id)).slice(0, 5).map(o => o.species)
  const ids = [...party.map(m => m.species), ...others]
  const key = ids.join(',')
  preload(ids)
  useEffect(() => { bgm.play('camp') }, [])
  useCanvas(canvas, (ctx, t) => drawCamp(ctx, t, ids, false), [key])

  const needBackup = save.exportedAt === 0 ? save.owned.length >= 6 : save.clearsSinceExport >= 3
  const firstTime = save.owned.length <= 3

  return (
    <div className="absolute inset-0">
      <canvas ref={canvas} width={W} height={H} className="absolute inset-0 h-full w-full" />

      {/* 냄비 (눌러서 요리) */}
      <button onClick={() => { sfx.select(); openPanel('cook') }} className="absolute" style={{ left: POT.x, top: POT.y, width: POT.w, height: POT.h }} aria-label="요리 냄비">
        <span className={`absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-4 py-1 text-lg font-bold text-[#c06a00] shadow ${firstTime ? 'blink' : ''}`}>🍲 요리하기</span>
      </button>

      {/* 상단 정보 */}
      <div className="hud-bar absolute left-3 top-3 flex items-center gap-4 rounded-xl px-4 py-2 text-lg">
        <span className="font-bold">{save.name}</span>
        <span className="text-yellow-300">🪙 {save.coins}</span>
        <span className="text-purple-200">💎 {shardCount(save)}/{AREAS.length}</span>
      </div>
      <div className="absolute right-3 top-3 flex gap-2">
        <Btn color={needBackup ? 'red' : 'blue'} onClick={() => openPanel('save')} className="relative px-3 py-1 text-base">
          🔑 저장 키{needBackup && <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-yellow-300 blink" />}
        </Btn>
        <Btn color="gray" onClick={toggleMute} className="px-3 py-1 text-base">{save.muted ? '🔇' : '🔊'}</Btn>
        <Btn color="gray" onClick={() => go('title')} className="px-3 py-1 text-base">⌂</Btn>
      </div>
      {needBackup && (
        <button onClick={() => openPanel('save')} className="absolute left-1/2 top-16 -translate-x-1/2 rounded-full bg-[#e8524a] px-5 py-1.5 text-base font-bold shadow-[0_4px_0_#8a2a26] blink">
          🔑 저장 키를 만들어 두세요! 기기를 바꾸거나 데이터가 지워져도 복구할 수 있어요
        </button>
      )}

      {/* 하단 바: 메뉴 / 파티 / 탐험 */}
      <div className="absolute inset-x-0 bottom-0 flex h-[112px] items-center justify-between gap-3 bg-gradient-to-t from-black/50 to-transparent px-4 pb-3 pt-4">
        <div className="flex gap-2">
          {([['dex', '📖', '도감'], ['shop', '🛒', '상점'], ['cook', '🍲', '요리']] as const).map(([p, icon, label]) => (
            <Btn key={p} onClick={() => openPanel(p)} className="flex h-[78px] w-[78px] flex-col items-center justify-center px-0 py-0 text-sm"><span className="text-3xl leading-none">{icon}</span>{label}</Btn>
          ))}
        </div>
        <button onClick={() => { sfx.select(); openPanel('team') }} className="flex gap-1 rounded-2xl p-1" aria-label="팀 편성">
          {[0, 1, 2].map(i => {
            const m = party[i]
            return (
              <span key={i} className="flex h-[78px] w-[150px] items-center gap-2 rounded-xl border-4 border-black/30 px-2" style={{ background: PARTY_COLORS[i] }}>
                {m ? (<>
                  <Portrait id={m.species} size={56} />
                  <span className="text-left text-sm leading-tight text-white" style={{ textShadow: '0 1px 0 #0008' }}>{getSpecies(m.species).name}<br /><b>Lv{m.level}</b></span>
                </>) : <span className="w-full text-center text-sm text-white/80">빈 자리</span>}
              </span>
            )
          })}
        </button>
        <Btn color="yellow" onClick={() => go('island')} className="h-[78px] w-[150px] text-2xl">탐험 ▶</Btn>
      </div>
    </div>
  )
}
