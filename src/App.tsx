import { useEffect, useState } from 'react'
import { useGame } from './store/gameStore'
import Title from './pages/Title'
import Intro from './pages/Intro'
import Camp from './pages/Camp'
import Island from './pages/Island'
import Battle from './pages/Battle'
import Result from './pages/Result'
import TeamPanel from './pages/panels/TeamPanel'
import CookPanel from './pages/panels/CookPanel'
import DexPanel from './pages/panels/DexPanel'
import ShopPanel from './pages/panels/ShopPanel'
import SavePanel from './pages/panels/SavePanel'
import { enterLandscapeFullscreen } from './lib/fullscreen'
import Icon from './ui/Icon'
import { audio } from './lib/audio'

/** 게임은 항상 960×540(16:9) 가상 화면에 그려지고, 창 크기에 맞춰 통째로 확대/축소된다. */
const VW = 960
const VH = 540

function useViewport() {
  const [v, setV] = useState({ w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    const f = () => setV({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', f)
    window.addEventListener('orientationchange', f)
    return () => { window.removeEventListener('resize', f); window.removeEventListener('orientationchange', f) }
  }, [])
  return v
}

export default function App() {
  const { screen, panel } = useGame()
  // 브라우저는 첫 터치 이후에만 소리를 허용한다
  useEffect(() => {
    const unlock = () => { audio() }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => { window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock) }
  }, [])
  const { w, h } = useViewport()
  const portrait = h > w
  const scale = Math.min(w / VW, h / VH)

  const goFull = () => { void enterLandscapeFullscreen() }

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <div
        className="absolute overflow-hidden"
        style={{ width: VW, height: VH, left: '50%', top: '50%', transform: `translate(-50%, -50%) scale(${scale})`, transformOrigin: 'center center' }}
      >
        {screen === 'title' && <Title />}
        {screen === 'intro' && <Intro />}
        {screen === 'camp' && <Camp />}
        {screen === 'island' && <Island />}
        {screen === 'battle' && <Battle />}
        {screen === 'result' && <Result />}
        {panel === 'team' && <TeamPanel />}
        {panel === 'cook' && <CookPanel />}
        {panel === 'dex' && <DexPanel />}
        {panel === 'shop' && <ShopPanel />}
        {panel === 'save' && <SavePanel />}
      </div>
      {portrait && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-[#1b1b2f] p-6 text-center" onClick={goFull}>
          <div className="flex items-center gap-3" style={{ animation: 'bob 1.2s steps(4) infinite' }}><Icon n="phone" s={96} /><Icon n="rotate" s={72} /></div>
          <p className="text-lg text-yellow-300">가로 화면으로 돌려 주세요</p>
          <p className="text-xs text-gray-300">이 게임은 가로 전용이에요. 화면 회전이 잠겨 있다면 해제해 주세요.</p>
        </div>
      )}
    </div>
  )
}
