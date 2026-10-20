import { useGame } from '../store/gameStore'
import { trainerLevel } from '../lib/progression'

export default function Result() {
  const { battle: b, reward, progress, go, startBattle } = useGame()
  if (!b) return null
  const survival = b.mode === 'survival'
  const win = b.winner === 'player'
  const rate = b.total ? Math.round((b.correct / b.total) * 100) : 0
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 overflow-y-auto p-6 text-center">
      <h2 className={`font-title text-2xl ${win || survival ? 'text-yellow-300' : 'text-red-400'}`}>
        {survival ? 'GAME OVER' : win ? 'YOU WIN!' : 'YOU LOSE...'}
      </h2>
      <p className="text-sm">
        {survival ? `${b.defeated}마리를 쓰러뜨렸다!` : win ? `${progress.nickname || '트레이너'}의 승리!` : '다음엔 더 잘할 수 있어요!'}
      </p>
      {reward?.newRecord && <p className="animate-pulse text-sm text-green-300">🏆 최고 기록 갱신!</p>}
      {reward?.levelUp && <p className="animate-pulse text-sm text-orange-300">⬆ 트레이너 레벨 {reward.levelUp}! 포켓몬 스탯이 올랐어요</p>}
      <div className="pixel-box w-full space-y-2 p-4 text-left text-sm">
        <Row k="정답률" v={`${rate}% (${b.correct}/${b.total})`} />
        <Row k="최대 콤보" v={`${b.maxCombo}`} />
        <Row k="획득 경험치" v={`+${reward?.exp ?? 0} EXP`} />
        <Row k="획득 코인" v={`+${reward?.coins ?? 0} 🪙`} />
        <hr className="border-gray-600" />
        <Row k="트레이너 레벨" v={`Lv${trainerLevel(progress.exp)} (${progress.exp} EXP)`} />
        <Row k="보유 코인" v={`${progress.coins}`} />
        <Row k="전적" v={`${progress.wins}승 ${progress.losses}패`} />
        <Row k="서바이벌 최고" v={`${progress.bestSurvival}`} />
      </div>
      <div className="flex w-full gap-3">
        <button onClick={() => go('title')} className="pixel-btn pixel-box flex-1 py-3">타이틀</button>
        <button onClick={() => go('team')} className="pixel-btn pixel-box flex-1 py-3">팀 변경</button>
        <button onClick={startBattle} className="pixel-btn pixel-box flex-1 bg-[#b03a2e] py-3">재도전</button>
      </div>
    </div>
  )
}

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex justify-between"><span className="text-gray-300">{k}</span><span>{v}</span></div>
)
