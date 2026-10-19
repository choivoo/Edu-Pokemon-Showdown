import { useGame } from './store/gameStore'
import Title from './pages/Title'
import Profile from './pages/Profile'
import TeamSelect from './pages/TeamSelect'
import Battle from './pages/Battle'
import Result from './pages/Result'
import TeacherDashboard from './pages/TeacherDashboard'

export default function App() {
  const screen = useGame(s => s.screen)
  return (
    <div className="mx-auto flex h-full w-full max-w-[480px] flex-col overflow-hidden text-sm">
      {screen === 'title' && <Title />}
      {screen === 'profile' && <Profile />}
      {screen === 'team' && <TeamSelect />}
      {screen === 'battle' && <Battle />}
      {screen === 'result' && <Result />}
      {screen === 'teacher' && <TeacherDashboard />}
    </div>
  )
}
