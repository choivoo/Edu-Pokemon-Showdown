import { useState } from 'react'
import { TEAM_SIZE, useGame } from '../store/gameStore'
import { POKEMON } from '../lib/pokedex'
import { unlockPrice } from '../lib/progression'
import PokemonCard from '../components/PokemonCard'
import type { PokemonData } from '../types'

export default function TeamSelect() {
  const { team, toggleTeam, startBattle, go, progress, unlock, mode } = useGame()
  const [target, setTarget] = useState<PokemonData | null>(null)
  const [msg, setMsg] = useState('')
  return (
    <div className="relative flex h-full flex-col">
      <div className="flex items-end justify-between p-3 pb-2">
        <div>
          <h2 className="font-title text-sm text-yellow-300">팀 선택 · {mode === 'survival' ? '서바이벌' : '싱글'}</h2>
          <p className="mt-1 text-xs text-gray-300">포켓몬 {TEAM_SIZE}마리 ({team.length}/{TEAM_SIZE}) · 🔒는 코인으로 해금</p>
        </div>
        <span className="text-sm text-yellow-300">🪙 {progress.coins}</span>
      </div>
      <div className="grid flex-1 grid-cols-3 content-start gap-2 overflow-y-auto px-3 pb-3">
        {POKEMON.map(p => {
          const open = progress.unlocked.includes(p.id)
          return (
            <div key={p.id} className="relative">
              <div className={open ? '' : 'opacity-50'}>
                <PokemonCard pokemon={p} selected={team.includes(p.id)} order={team.indexOf(p.id) + 1} onClick={() => (open ? toggleTeam(p.id) : (setMsg(''), setTarget(p)))} />
              </div>
              {!open && <span className="pointer-events-none absolute right-1 top-1 text-[11px]">🔒 {unlockPrice(p)}</span>}
            </div>
          )
        })}
      </div>
      {target && (
        <div className="pixel-box slide-up absolute inset-x-0 bottom-16 z-20 mx-3 p-3 text-center text-sm">
          <p>{target.name}을(를) <span className="text-yellow-300">🪙{unlockPrice(target)}</span>에 해금할까요?</p>
          {msg && <p className="mt-1 text-xs text-red-300">{msg}</p>}
          <div className="mt-2 flex gap-2">
            <button onClick={() => setTarget(null)} className="pixel-btn pixel-box flex-1 py-2">취소</button>
            <button onClick={() => (unlock(target.id) ? setTarget(null) : setMsg('코인이 부족해요! 배틀로 모아보세요.'))} className="pixel-btn pixel-box flex-1 bg-[#3d6b3d] py-2">해금</button>
          </div>
        </div>
      )}
      <div className="flex gap-3 border-t-4 border-black bg-[#1b1b2f] p-3">
        <button onClick={() => go('title')} className="pixel-btn pixel-box flex-1 py-3">뒤로</button>
        <button disabled={team.length !== TEAM_SIZE} onClick={startBattle} className="pixel-btn pixel-box flex-[2] bg-[#b03a2e] py-3">배틀 시작!</button>
      </div>
    </div>
  )
}
