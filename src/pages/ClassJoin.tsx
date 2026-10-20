import { useState } from 'react'
import { useGame } from '../store/gameStore'
import { getBackend } from '../lib/backend'
import { joinRoom } from '../lib/classRoom'
import { makeFighter } from '../lib/classBattle'
import { POKEMON } from '../lib/pokedex'
import { frontSprite } from '../data/sprites'

const PID_KEY = 'edu-pokemon-showdown:pid'
export const getPid = (): string => {
  try {
    let p = sessionStorage.getItem(PID_KEY)
    if (!p) { p = 'p' + Math.random().toString(36).slice(2, 9); sessionStorage.setItem(PID_KEY, p) }
    return p
  } catch { return 'p' + Math.random().toString(36).slice(2, 9) }
}

export const CLASS_KEY = 'edu-pokemon-showdown:class-code'

export default function ClassJoin() {
  const { go, progress, setProfile } = useGame()
  const [code, setCode] = useState('')
  const [name, setName] = useState(progress.nickname)
  const [pokemon, setPokemon] = useState(progress.unlocked[0])
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const join = async () => {
    setBusy(true); setErr('')
    try {
      const be = await getBackend()
      await joinRoom(be, code.trim(), getPid(), makeFighter(name.trim(), progress.avatar, pokemon))
      setProfile(name.trim(), progress.avatar)
      try { sessionStorage.setItem(CLASS_KEY, code.trim()) } catch { /* 무시 */ }
      go('classPlay')
    } catch (e) {
      setErr(e instanceof Error ? e.message : '입장에 실패했어요')
    } finally { setBusy(false) }
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
      <h2 className="font-title text-sm text-yellow-300">클래스 입장</h2>
      <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" placeholder="방 코드 4자리"
        className="rounded border-4 border-black bg-white px-3 py-2 text-center text-2xl tracking-widest text-black" />
      <input value={name} maxLength={8} onChange={e => setName(e.target.value)} placeholder="닉네임"
        className="rounded border-4 border-black bg-white px-3 py-2 text-base text-black" />
      <p className="text-xs">함께 싸울 포켓몬</p>
      <div className="grid grid-cols-4 gap-1">
        {progress.unlocked.map(id => {
          const p = POKEMON.find(x => x.id === id)!
          return (
            <button key={id} onClick={() => setPokemon(id)} className={`pixel-btn rounded border-4 p-0.5 text-[10px] ${pokemon === id ? 'border-yellow-300 bg-[#44446a]' : 'border-[#555577] bg-[#2b2b45]'}`}>
              <img src={frontSprite(id)} alt="" className="sprite mx-auto h-12 w-12" />{p.name}
            </button>
          )
        })}
      </div>
      {err && <p className="text-xs text-red-300">{err}</p>}
      <div className="mt-auto flex gap-3">
        <button onClick={() => go('title')} className="pixel-btn pixel-box flex-1 py-3">뒤로</button>
        <button disabled={busy || code.length !== 4 || !name.trim()} onClick={join} className="pixel-btn pixel-box flex-1 bg-[#3d6b3d] py-3">입장</button>
      </div>
    </div>
  )
}
