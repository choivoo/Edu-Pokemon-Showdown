import { TEAM_SIZE, useGame } from '../store/gameStore'
import { POKEMON } from '../lib/pokedex'
import PokemonCard from '../components/PokemonCard'

export default function TeamSelect() {
  const { team, toggleTeam, startBattle, go } = useGame()
  return (
    <div className="flex h-full flex-col">
      <div className="p-3 pb-2">
        <h2 className="font-title text-sm text-yellow-300">팀 선택</h2>
        <p className="mt-1 text-xs text-gray-300">포켓몬 {TEAM_SIZE}마리를 고르세요 ({team.length}/{TEAM_SIZE})</p>
      </div>
      <div className="grid flex-1 grid-cols-3 content-start gap-2 overflow-y-auto px-3 pb-3">
        {POKEMON.map(p => (
          <PokemonCard key={p.id} pokemon={p} selected={team.includes(p.id)} order={team.indexOf(p.id) + 1} onClick={() => toggleTeam(p.id)} />
        ))}
      </div>
      <div className="flex gap-3 border-t-4 border-black bg-[#1b1b2f] p-3">
        <button onClick={() => go('title')} className="pixel-btn pixel-box flex-1 py-3">뒤로</button>
        <button disabled={team.length !== TEAM_SIZE} onClick={startBattle} className="pixel-btn pixel-box flex-[2] bg-[#b03a2e] py-3">배틀 시작!</button>
      </div>
    </div>
  )
}
