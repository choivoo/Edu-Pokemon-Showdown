import { useState } from 'react'
import { useGame } from '../../store/gameStore'
import { isClaimed, isDone, QUESTS, THEMES, type Reward } from '../../lib/quests'
import { Btn, Panel } from '../../ui/kit'
import Icon from '../../ui/Icon'
import { sfx } from '../../lib/sound'
import { CHRONICLES, chronicleCount, chronicleUnlocked } from '../../lib/chronicles'
import { AREAS } from '../../lib/stages'
import Dialog from '../../components/Dialog'

function RewardText({ r }: { r: Reward }) {
  const t = THEMES.find(x => x.id === r.theme)
  return (
    <span className="flex flex-wrap items-center gap-2 text-sm text-[#8a5a10]">
      {r.coins ? <span className="inline-flex items-center gap-0.5"><Icon n="coin" s={16} />{r.coins}</span> : null}
      {r.shell ? <span className="inline-flex items-center gap-0.5"><Icon n="shell" s={18} />×{r.shell}</span> : null}
      {r.rainbow ? <span className="inline-flex items-center gap-0.5"><Icon n="rainbow" s={18} />×{r.rainbow}</span> : null}
      {t ? <span className="border-2 border-[#8a5a10] px-1">굿즈: {t.name}</span> : null}
    </span>
  )
}

export default function QuestPanel() {
  const { save, openPanel, claimQuest, setTheme } = useGame()
  const [tab, setTab] = useState<'quests' | 'story'>('quests')
  const [reading, setReading] = useState<number | null>(null)
  const sorted = [...QUESTS].sort((a, b) => Number(isClaimed(save, a)) - Number(isClaimed(save, b)) || Number(isDone(save, b)) - Number(isDone(save, a)))
  return (
    <Panel title="퀘스트 · 탐험 기록" onClose={() => openPanel(null)} w={900}>
      <div className="mb-2 flex gap-2">
        <Btn color={tab === "quests" ? "yellow" : "gray"} onClick={() => setTab("quests")} className="px-5 py-1 text-base">퀘스트와 굿즈</Btn>
        <Btn color={tab === "story" ? "yellow" : "gray"} onClick={() => setTab("story")} className="px-5 py-1 text-base">모험 기록 {chronicleCount(save.cleared)}/{CHRONICLES.length}</Btn>
      </div>
      {tab === "quests" ? (
      <div className="flex gap-3" style={{ height: 346 }}>
        <div className="pq-inner scroll-thin flex-1 space-y-1.5 overflow-y-auto p-2">
          {sorted.map(q => {
            const p = Math.min(q.goal, q.progress(save))
            const done = isDone(save, q), got = isClaimed(save, q)
            return (
              <div key={q.id} className={`flex items-center gap-2 border-4 px-2 py-1 ${got ? 'border-[#cfc3a0] opacity-60' : done ? 'border-[#3fbf6a] bg-[#f0ffe6]' : 'border-[#e5a500]'}`}>
                <span className={`border-2 border-[#2b2838] px-1 text-xs text-white ${q.kind === 'main' ? 'bg-[#e8524a]' : 'bg-[#3f7fe8]'}`}>{q.kind === 'main' ? '메인' : '도전'}</span>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="text-lg font-bold">{q.title}</div>
                  <div className="text-sm">{q.desc} <b>({p}/{q.goal})</b></div>
                  <RewardText r={q.reward} />
                </div>
                <Btn color="green" disabled={!done || got} onClick={() => { if (claimQuest(q.id)) sfx.coin() }} quiet className="px-3 py-1 text-base">{got ? '완료' : '받기'}</Btn>
              </div>
            )
          })}
        </div>
        <div className="pq-inner w-[240px] shrink-0 space-y-2 p-3">
          <p className="text-lg font-bold">모양바꾸기 굿즈</p>
          <p className="text-sm leading-snug">퀘스트 보상으로 얻은 굿즈로 캠프의 분위기를 바꿔요.</p>
          {THEMES.map(t => {
            const have = save.themes.includes(t.id)
            return (
              <Btn key={t.id} color={save.theme === t.id ? 'green' : have ? 'yellow' : 'gray'} disabled={!have} onClick={() => setTheme(t.id)} className="flex w-full items-center justify-between px-3 py-1 text-base">
                <span>{t.name}</span>{!have && <Icon n="lock" s={20} />}{save.theme === t.id && <Icon n="check" s={20} />}
              </Btn>
            )
          })}
        </div>
      </div>
      ) : (
        <div className="pq-inner scroll-thin overflow-y-auto p-3" style={{ height: 346 }}>
          <p className="mb-2 text-base text-[#8a5a10]">스테이지 첫 클리어 후 수집한 이야기를 다시 읽을 수 있어요.</p>
          <div className="grid grid-cols-2 gap-2">
            {CHRONICLES.map((c, i) => {
              const unlocked = chronicleUnlocked(save.cleared, c)
              return (
                <button key={c.id} disabled={!unlocked} onClick={() => { sfx.select(); setReading(i) }} className={`flex items-start gap-3 border-4 px-3 py-2 text-left ${unlocked ? 'border-[#e5a500] bg-[#fff9e7]' : 'border-[#b9b09b] bg-[#ece7db] opacity-65'}`}>
                  <span className="w-11 shrink-0 bg-[#c06a00] px-1 py-1 text-center text-sm text-white">{c.area + 1}-{c.index + 1}</span>
                  <span className="min-w-0 flex-1"><b className="block text-base">{unlocked ? c.title : '??? — 미발견 기록'}</b><span className="text-xs text-[#8a5a10]">{AREAS[c.area].name}{unlocked ? ' · 읽기' : ' · 탐험으로 해제'}</span></span>
                  {!unlocked && <Icon n="lock" s={18} />}
                </button>
              )
            })}
          </div>
        </div>
      )}
      {reading !== null && <Dialog key={reading} lines={CHRONICLES[reading].lines} name={save.name} onDone={() => setReading(null)} />}
    </Panel>
  )
}
