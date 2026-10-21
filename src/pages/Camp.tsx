import { useEffect, useRef } from 'react'
import { originalStatueCount, shardCount, allCleared, useGame } from '../store/gameStore'
import { ORIGINAL_STATUE_COUNT } from '../lib/originalCampaign'
import { getSpecies } from '../lib/roster'
import { partyMons } from '../lib/party'
import { useCanvas } from '../components/useCanvas'
import { drawCamp, POT } from '../art/scenes'
import { H, W } from '../engine/draw'
import { preload } from '../engine/render'
import { Btn, PARTY_COLORS, Portrait } from '../ui/kit'
import Icon, { Coins } from '../ui/Icon'
import BatteryMeter from '../ui/BatteryMeter'
import { bgm, sfx } from '../lib/sound'
import { claimable, themeFilter } from '../lib/quests'
import { DECORATIONS } from '../lib/decorations'

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
      <canvas ref={canvas} width={W} height={H} className="absolute inset-0 h-full w-full" style={{ filter: themeFilter(save.theme) }} />

      {/* 냄비 (눌러서 요리) */}
      <button onClick={() => { sfx.select(); openPanel('cook') }} className="absolute" style={{ left: POT.x, top: POT.y, width: POT.w, height: POT.h }} aria-label="요리 냄비">
        <span className={`absolute -top-6 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap border-4 border-[#2b2838] bg-white px-3 py-0.5 text-lg font-bold text-[#c06a00] ${firstTime ? 'blink' : ''}`}><Icon n="pot" s={24} />요리하기</span>
      </button>

      {/* 상단 정보 */}
      <div className="hud-bar absolute left-3 top-3 flex items-center gap-4 px-4 py-2 text-lg">
        <span className="font-bold">{save.name}</span>
        <Coins n={save.coins} className="text-yellow-300" />
        <span className="inline-flex items-center gap-1 text-purple-200"><Icon n="gem" s={22} />석상 {originalStatueCount(save)}/{ORIGINAL_STATUE_COUNT} {allCleared(save) && <span className="text-yellow-200">· 프리즘 {shardCount(save)}/6</span>}</span>
        <BatteryMeter compact />
      </div>
      <div className="absolute right-3 top-3 flex gap-2">
        <Btn color={needBackup ? 'red' : 'blue'} onClick={() => openPanel('save')} className="relative flex items-center gap-1 px-3 py-1 text-base">
          <Icon n="key" s={22} />저장 키{needBackup && <span className="blink absolute -right-2 -top-2 h-4 w-4 border-2 border-[#2b2838] bg-yellow-300" />}
        </Btn>
        <Btn color="gray" onClick={toggleMute} className="px-3 py-1"><Icon n={save.muted ? 'mute' : 'sound'} s={24} /></Btn>
        <Btn color="gray" onClick={() => go('title')} className="px-3 py-1"><Icon n="home" s={24} /></Btn>
      </div>
      {needBackup && (
        <button onClick={() => openPanel('save')} className="blink absolute left-1/2 top-16 flex -translate-x-1/2 items-center gap-2 border-4 border-[#2b2838] bg-[#e8524a] px-4 py-1.5 text-base font-bold">
          <Icon n="key" s={22} />저장 키를 만들어 두세요! 기기를 바꾸거나 데이터가 지워져도 복구할 수 있어요
        </button>
      )}

      {save.decorations.length > 0 && (
        <button onClick={() => openPanel('shop')} aria-label="캠프 장식 관리" title="구매한 장식품. 효과는 항상 적용돼요."
          className="absolute bottom-[124px] right-4 flex max-w-[420px] flex-wrap justify-end gap-1.5">
          {save.decorations.slice(0, 7).map((id, i) => {
            const deco = DECORATIONS.find(d => d.id === id)
            if (!deco) return null
            return <span key={id} className="flex flex-col items-center border-2 border-[#5b4835] bg-[#f6d88c]/90 px-2 py-1 shadow-[0_3px_0_#5b4835]"
              title={deco.name + ': ' + deco.effect}>
              <Icon n={id.includes('Flag') ? 'flag' : id.includes('Cushion') ? 'heart' : id.includes('Arch') ? 'star' : i % 2 ? 'gem' : 'sparkle'} s={22} />
              <span className="max-w-[65px] truncate text-xs font-bold">{deco.name}</span>
            </span>
          })}
          {save.decorations.length > 7 && <span className="border-2 border-[#5b4835] bg-[#fff3c8] px-2 py-1 text-xs font-bold">+{save.decorations.length - 7}</span>}
        </button>
      )}

      <Btn color="blue" onClick={() => openPanel('story')} className="absolute bottom-[124px] left-4 z-10 flex items-center gap-2 px-4 py-1.5 text-base"><Icon n="book" s={22} />모험일지</Btn>

      {/* 하단 바: 메뉴 / 파티 / 탐험 */}
      <div className="absolute inset-x-0 bottom-0 flex h-[112px] items-center justify-between gap-3 px-4 pb-3 pt-4">
        <div className="flex gap-2">
          {([['dex', 'book', '도감'], ['shop', 'cart', '프렌들리숍'], ['train', 'sword', '특훈'], ['quest', 'flag', '퀘스트']] as const).map(([p, icon, label]) => (
            <Btn key={p} onClick={() => openPanel(p)} className="flex h-[78px] w-[76px] flex-col items-center justify-center gap-1 whitespace-nowrap px-0 py-0 text-sm"><span className="relative"><Icon n={icon} s={34} />{p === 'quest' && claimable(save).length > 0 && <span className="blink absolute -right-3 -top-2 h-4 w-4 border-2 border-[#2b2838] bg-[#e8524a]" />}</span>{label}</Btn>
          ))}
        </div>
        <button onClick={() => { sfx.select(); openPanel('team') }} className="flex gap-1 p-1" aria-label="팀 편성">
          {[0, 1, 2].map(i => {
            const m = party[i]
            return (
              <span key={i} className="flex h-[78px] w-[150px] items-center gap-2 border-4 border-[#2b2838] px-2" style={{ background: PARTY_COLORS[i] }}>
                {m ? (<>
                  <Portrait id={m.species} size={56} />
                  <span className="text-left text-sm leading-tight text-white" style={{ textShadow: '2px 2px 0 #0008' }}>{getSpecies(m.species).name}<br /><b>Lv{m.level}</b></span>
                </>) : <span className="w-full text-center text-sm text-white/80">빈 자리</span>}
              </span>
            )
          })}
        </button>
        <Btn color="yellow" onClick={() => go('island')} className="flex h-[78px] w-[150px] items-center justify-center gap-2 text-2xl">탐험<Icon n="next" s={28} /></Btn>
      </div>
    </div>
  )
}
