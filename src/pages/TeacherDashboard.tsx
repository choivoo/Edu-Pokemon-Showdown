import { useGame } from '../store/gameStore'

// 3단계(클래스 모드 · 실시간 멀티플레이)에서 구현 예정
export default function TeacherDashboard() {
  const go = useGame(s => s.go)
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="font-title text-sm text-yellow-300">선생님 대시보드</h2>
      <p className="text-xs text-gray-300">3단계에서 방 만들기·학생 목록·실시간 순위가 추가됩니다.</p>
      <button onClick={() => go('title')} className="pixel-btn pixel-box px-6 py-3">뒤로</button>
    </div>
  )
}
