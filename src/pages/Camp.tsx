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
import { tutorialPhase, TUTORIAL_ACKNOWLEDGED } from '../lib/tutorial'
import { getStage } from '../lib/stages'
import { ORIGINAL_FIRST } from '../lib/originalCampaign'

export default function Camp() {
  const { save, go, openPanel, toggleMute, startStage, autoPlaceStone, markStory } = useGame()
  const canvas = useRef<HTMLCanvasElement>(null)
  const party = partyMons(save)
  const others = save.owned.filter(o => !save.party.includes(o.id)).slice(0, 5).map(o => o.species)
  const ids = [...party.map(m => m.species), ...others]
  const key = ids.join(',')
  preload(ids)
  useEffect(() => { bgm.play('camp') }, [])
  const decorKey = save.decorations.join(',')
  useCanvas(canvas, (ctx, t) => drawCamp(ctx, t, ids, false, save.decorations), [key, decorKey])

  const needBackup = save.exportedAt === 0 ? save.owned.length >= 6 : save.clearsSinceExport >= 3
  const firstTime = save.owned.length <= 3
  const tutorial = tutorialPhase(save)
  const starter = save.owned.find(o=>save.party.includes(o.id))
  const beginnerStone = save.stones.find(st=>!save.owned.some(o=>o.stones.some(p=>p.stone===st.id)))

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
        <span className="text-sm" title="탐험을 열 번 성공하면 다음 성공 시 금빛 P스톤 확정">탐험 보너스 {(save.counters.clears ?? 0) % 10}/10{(save.counters.clears ?? 0) > 0 && (save.counters.clears ?? 0) % 10 === 0 ? ' ★ 다음 탐험 보너스' : ''}</span>
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
        <button onClick={() => openPanel('shop')} aria-label="캠프 장식 관리"
          title="구입한 가구를 캠프 풍경에 배치했어요. 장식 효과는 항상 적용됩니다."
          className="absolute bottom-[124px] right-4 z-10 flex items-center gap-2 border-4 border-[#67563c] bg-[#ffe5a0]/95 px-3 py-1.5 text-sm font-bold text-[#6b4e2b] shadow-[3px_4px_0_#554333]">
          <Icon n="sparkle" s={22} /> 장식 {save.decorations.length}개 · 관리
        </button>
      )}

      <Btn color="blue" onClick={() => openPanel('story')} className="absolute bottom-[124px] left-4 z-10 flex items-center gap-2 px-4 py-1.5 text-base"><Icon n="book" s={22} />모험일지</Btn>

      {tutorial && (tutorial !== 'complete' || !save.seenStory.includes(TUTORIAL_ACKNOWLEDGED)) && (
        <div className="absolute right-5 top-[104px] z-30 w-[415px] border-[5px] border-[#bd8626] bg-[#fff2c3]/95 p-3 text-[#553e27] shadow-[6px_7px_0_#385c53]">
          <div className="flex items-center justify-between gap-2">
            <b className="text-lg text-[#b96813]">모비의 첫 모험 가이드</b>
            <span className="rounded bg-[#e8ba55] px-2 text-xs font-bold">
              {tutorial==='first-expedition'?'1 / 5':tutorial==='power-stone'?'2 / 5':tutorial==='second-expedition'?'3 / 5':tutorial==='cooking'?'4 / 5':tutorial==='friends'?'5 / 5':'완료!'}
            </span>
          </div>
          <p className="my-2 text-sm leading-snug">
            {tutorial==='first-expedition'?'첫 번째 전투부터 시작해요! 출발의초원 1-1로 향해서 이동과 기술 사용을 연습하세요.':tutorial==='power-stone'?'첫 탐험에서 받은 P스톤을 장착하면 더욱 든든해져요. 아래 버튼으로 팀 화면을 열고 직접 장착해 보세요.'
            :tutorial==='second-expedition'?'준비됐어요! 출발의초원 1-2에서 두 번째 전투를 익혀 볼까요?'
            :tutorial==='cooking'?'두 번째 탐험 성공! 캠프의 냄비에 다섯 종류 재료를 넣어 새 친구를 초대해요.'
            :tutorial==='friends'?'요리가 완성됐어요! 구구와 꼬렛을 차례대로 맞이해 세 마리 파티를 완성하세요.'
            :'구구와 꼬렛까지 합류! 이제 탐험대 세 마리가 함께 출발할 수 있어요.'}
          </p>
          <div className="flex gap-2">
            {tutorial==='first-expedition' && <Btn color="yellow" onClick={()=>startStage(getStage(ORIGINAL_FIRST,0))} className="w-full text-base">1-1 첫 탐험 계속하기</Btn>}
            {tutorial==='power-stone' && <>
              <Btn color="yellow" onClick={()=>openPanel('team')} className="flex-1 text-sm">P애뮬릿 열기</Btn>
              <Btn color="green" disabled={!starter||!beginnerStone} onClick={()=>{if(starter&&beginnerStone)autoPlaceStone(starter.id,beginnerStone.id)}} className="flex-1 text-sm">추천 칸에 장착</Btn>
            </>}
            {tutorial==='second-expedition'&&<Btn color="yellow" onClick={()=>startStage(getStage(ORIGINAL_FIRST,1))} className="w-full text-base">1-2 탐험 출발!</Btn>}
            {(tutorial==='cooking'||tutorial==='friends')&&<Btn color="yellow" onClick={()=>openPanel('cook')} className="w-full text-base">요리 냄비 열기</Btn>}
            {tutorial==='complete'&&<Btn color="green" onClick={()=>markStory(TUTORIAL_ACKNOWLEDGED)} className="w-full text-base">이제 자유롭게 탐험하기!</Btn>}
          </div>
        </div>
      )}
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
