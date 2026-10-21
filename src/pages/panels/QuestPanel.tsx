import { useGame } from '../../store/gameStore'
import { isClaimed, isDone, QUESTS, THEMES, type Reward } from '../../lib/quests'
import { Btn, Panel } from '../../ui/kit'
import Icon from '../../ui/Icon'
import { sfx } from '../../lib/sound'

function RewardText({ r }: { r: Reward }) {
  const t = THEMES.find(x => x.id === r.theme)
  return (
    <span className="flex flex-wrap items-center gap-2 text-sm text-[#8a5a10]">
      {r.ticket ? <span className="inline-flex items-center gap-0.5"><Icon n="star" s={16} />티켓×{r.ticket}</span> : null}
      {r.coins ? <span className="inline-flex items-center gap-0.5"><Icon n="coin" s={16} />{r.coins}</span> : null}
      {r.shell ? <span className="inline-flex items-center gap-0.5"><Icon n="shell" s={18} />×{r.shell}</span> : null}
      {r.rainbow ? <span className="inline-flex items-center gap-0.5"><Icon n="rainbow" s={18} />×{r.rainbow}</span> : null}
      {t ? <span className="border-2 border-[#8a5a10] px-1">굿즈: {t.name}</span> : null}
    </span>
  )
}

export default function QuestPanel() {
  const { save, openPanel, claimQuest, setTheme } = useGame()
  const sorted = [...QUESTS].sort((a, b) => Number(isClaimed(save, a)) - Number(isClaimed(save, b)) || Number(isDone(save, b)) - Number(isDone(save, a)))
  return (
    <Panel title="퀘스트와 굿즈" onClose={() => openPanel(null)} w={900}>
      <div className="flex gap-3" style={{ height: 380 }}>
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
    </Panel>
  )
}
