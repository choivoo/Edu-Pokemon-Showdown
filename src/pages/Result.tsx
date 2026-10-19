import { useGame } from '../store/gameStore'

export default function Result() {
  const { battle: b, reward, progress, go, startBattle } = useGame()
  if (!b) return null
  const win = b.winner === 'player'
  const rate = b.total ? Math.round((b.correct / b.total) * 100) : 0
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className={`font-title text-2xl ${win ? 'text-yellow-300' : 'text-red-400'}`}>{win ? 'YOU WIN!' : 'YOU LOSE...'}</h2>
      <p className="text-sm">{win ? `${progress.nickname || '트레이너'}의 승리!` : '다음엔 더 잘할 수 있어요!'}</p>
      <div className="pixel-box w-full space-y-2 p-4 text-left text-sm">
        <Row k="정답률" v={`${rate}% (${b.correct}/${b.total})`} />
        <Row k="최대 콤보" v={`${b.maxCombo}`} />
        <Row k="획득 경험치" v={`+${reward?.exp ?? 0} EXP`} />
        <Row k="획득 코인" v={`+${reward?.coins ?? 0} 🪙`} />
        <hr className="border-gray-600" />
        <Row k="누적 경험치" v={`${progress.exp}`} />
        <Row k="보유 코인" v={`${progress.coins}`} />
        <Row k="전적" v={`${progress.wins}승 ${progress.losses}패`} />
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
