import { useState } from 'react'
import { useGame } from '../store/gameStore'
import { frontSprite } from '../data/sprites'

export const AVATARS = [25, 1, 4, 7, 133, 150]

export default function Profile() {
  const { progress, setProfile, go } = useGame()
  const [name, setName] = useState(progress.nickname)
  const [avatar, setAvatar] = useState(progress.avatar)
  const ok = name.trim().length > 0
  return (
    <div className="flex h-full flex-col gap-5 p-5">
      <h2 className="font-title text-sm text-yellow-300">트레이너 등록</h2>
      <label className="flex flex-col gap-2 text-xs">
        닉네임
        <input
          value={name} maxLength={8} onChange={e => setName(e.target.value)} placeholder="최대 8글자"
          className="rounded border-4 border-black bg-white px-3 py-2 text-base text-black"
        />
      </label>
      <div>
        <p className="mb-2 text-xs">아바타</p>
        <div className="grid grid-cols-3 gap-2">
          {AVATARS.map((id, i) => (
            <button key={id} onClick={() => setAvatar(i)} className={`pixel-btn rounded border-4 p-1 ${avatar === i ? 'border-yellow-300 bg-[#44446a]' : 'border-[#555577] bg-[#2b2b45]'}`}>
              <img src={frontSprite(id)} alt="" className="sprite mx-auto h-16 w-16" />
            </button>
          ))}
        </div>
      </div>
      <div className="mt-auto flex gap-3">
        <button onClick={() => go('title')} className="pixel-btn pixel-box flex-1 py-3">뒤로</button>
        <button disabled={!ok} onClick={() => { setProfile(name.trim(), avatar); go('team') }} className="pixel-btn pixel-box flex-1 bg-[#3d6b3d] py-3">다음</button>
      </div>
    </div>
  )
}
