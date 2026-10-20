import { type Tab, shardCount, useGame } from '../store/gameStore'
import { AREAS } from '../lib/stages'
import { sfx } from '../lib/sound'
import MapTab from './home/MapTab'
import CampTab from './home/CampTab'
import TeamTab from './home/TeamTab'
import ShopTab from './home/ShopTab'
import DexTab from './home/DexTab'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'map', label: '탐험', icon: '🗺️' },
  { id: 'camp', label: '캠프', icon: '🍲' },
  { id: 'team', label: '팀', icon: '👥' },
  { id: 'shop', label: '상점', icon: '🛒' },
  { id: 'dex', label: '도감', icon: '📖' },
]

export default function Home() {
  const { tab, setTab, save, go, toggleMute } = useGame()
  return (
    <div className="relative flex h-full flex-col">
      <div className="flex items-center gap-2 border-b-4 border-black bg-[#23233d] px-3 py-2 text-[11px]">
        <button onClick={() => go('title')} className="text-gray-400">◀</button>
        <span className="min-w-0 flex-1 truncate">{save.name}</span>
        <span className="text-purple-200">💎 {shardCount(save)}/{AREAS.length}</span>
        <span className="text-yellow-300">🪙 {save.coins}</span>
        <button onClick={toggleMute}>{save.muted ? '🔇' : '🔊'}</button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'map' && <MapTab />}
        {tab === 'camp' && <CampTab />}
        {tab === 'team' && <TeamTab />}
        {tab === 'shop' && <ShopTab />}
        {tab === 'dex' && <DexTab />}
      </div>
      <nav className="grid grid-cols-5 border-t-4 border-black bg-[#23233d]">
        {TABS.map(t => (
          <button key={t.id} onClick={() => { sfx.select(); setTab(t.id) }} className={`py-2 text-center text-[11px] ${tab === t.id ? 'bg-[#44446a] text-yellow-300' : 'text-gray-300'}`}>
            <div className="text-lg leading-none">{t.icon}</div>{t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
