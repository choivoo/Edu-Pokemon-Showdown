import { useGame } from './store/gameStore'
import Title from './pages/Title'
import Intro from './pages/Intro'
import Home from './pages/Home'
import Battle from './pages/Battle'
import Result from './pages/Result'

export default function App() {
  const screen = useGame(s => s.screen)
  return (
    <div className="mx-auto h-full w-full max-w-[480px] overflow-hidden text-sm">
      {screen === 'title' && <Title />}
      {screen === 'intro' && <Intro />}
      {screen === 'home' && <Home />}
      {screen === 'battle' && <Battle />}
      {screen === 'result' && <Result />}
    </div>
  )
}
