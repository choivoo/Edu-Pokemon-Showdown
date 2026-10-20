import { useCallback, useEffect, useRef, useState } from 'react'
import { useGame } from '../store/gameStore'
import { type Backend, firebaseConfigured, getBackend } from '../lib/backend'
import {
  closeRoom, createRoom, publishQuestion, publishResult, type RoomState, startGame, subscribeRoom,
} from '../lib/classRoom'
import { assignPairs, isDecided, ranking, resolveRound, roundDifficulty } from '../lib/classBattle'
import { checkAnswer, pickQuestion, SUBJECT_LABEL, SUBJECTS, TIME_LIMIT } from '../lib/questions'
import type { Question, Subject } from '../types'
import { Board } from './ClassPlay'
import { frontSprite } from '../data/sprites'

export default function TeacherDashboard() {
  const go = useGame(s => s.go)
  const [be, setBe] = useState<Backend | null>(null)
  const [code, setCode] = useState('')
  const [room, setRoom] = useState<RoomState | null>(null)
  const [subject, setSubject] = useState<Subject | 'mix'>('math')
  const [rounds, setRounds] = useState(8)
  const [err, setErr] = useState('')

  const roomRef = useRef<RoomState | null>(null)
  const qRef = useRef<{ q: Question; limitSec: number } | null>(null)
  const used = useRef<string[]>([])
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resolving = useRef(false)

  useEffect(() => { void getBackend().then(setBe) }, [])
  useEffect(() => {
    if (!be || !code) return
    return subscribeRoom(be, code, r => { roomRef.current = r; setRoom(r) })
  }, [be, code])
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const resolve = useCallback(async () => {
    const r = roomRef.current
    const cq = qRef.current
    if (!be || !r || !r.current || !cq || resolving.current) return
    resolving.current = true
    if (timer.current) clearTimeout(timer.current)
    try {
      const round = r.current.round
      const res = resolveRound(cq.q, cq.limitSec * 1000, r.fighters ?? {}, r.answers?.[round] ?? {}, checkAnswer)
      const last = round + 1 >= r.totalRounds || isDecided(res.fighters)
      await publishResult(be, r.code, res.fighters, {
        round, answer: cq.q.answer, explanation: cq.q.explanation, events: res.events, verdicts: res.verdicts,
      }, last)
      qRef.current = null
    } finally { resolving.current = false }
  }, [be])

  // 모든 학생이 답하면 자동으로 판정
  useEffect(() => {
    if (!room?.current || !room.fighters) return
    const humans = Object.entries(room.fighters).filter(([, f]) => !f.bot).length
    const n = Object.keys(room.answers?.[room.current.round] ?? {}).length
    if (humans > 0 && n >= humans) { const t = setTimeout(() => void resolve(), 700); return () => clearTimeout(t) }
  }, [room, resolve])

  const create = async () => {
    if (!be) return
    try { setErr(''); setCode(await createRoom(be, subject, rounds)) } catch (e) { setErr(String(e)) }
  }
  const start = async () => {
    if (!be || !room?.fighters) return
    await startGame(be, room.code, assignPairs(room.fighters))
  }
  const next = async () => {
    if (!be || !room) return
    const round = room.round + 1
    const diff = roundDifficulty(round)
    const q = pickQuestion(room.subject, diff, used.current)
    used.current.push(q.id)
    const limitSec = TIME_LIMIT[q.difficulty]
    qRef.current = { q, limitSec }
    await publishQuestion(be, room.code, round, q, limitSec)
    timer.current = setTimeout(() => void resolve(), (limitSec + 2) * 1000)
  }
  const endGame = async () => {
    if (be && room) await publishResult(be, room.code, room.fighters ?? {}, room.lastResult ?? null, true)
  }
  const close = async () => {
    if (be && code) await closeRoom(be, code)
    setCode(''); setRoom(null)
  }

  const players = Object.entries(room?.fighters ?? {}).filter(([, f]) => !f.bot)
  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
      <h2 className="font-title text-sm text-yellow-300">선생님 대시보드</h2>
      {be && !firebaseConfigured && (
        <p className="rounded bg-[#5a3a1a] p-2 text-[11px] leading-relaxed">
          ⚠ 데모 모드: Firebase가 설정되지 않아 <b>같은 브라우저의 다른 탭</b>에서만 학생이 입장할 수 있어요.
          교실에서 쓰려면 README의 Firebase 설정을 하세요.
        </p>
      )}

      {!code && (
        <div className="space-y-3">
          <div>
            <p className="mb-1 text-xs">과목</p>
            <div className="flex flex-wrap gap-1">
              {([...SUBJECTS, 'mix'] as const).map(s => (
                <button key={s} onClick={() => setSubject(s)} className={`pixel-btn rounded border-2 px-2 py-1 text-xs ${subject === s ? 'border-yellow-300 text-yellow-300' : 'border-gray-500'}`}>{SUBJECT_LABEL[s]}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs">라운드 수</p>
            <div className="flex gap-1">
              {[5, 8, 12, 20].map(n => (
                <button key={n} onClick={() => setRounds(n)} className={`pixel-btn rounded border-2 px-3 py-1 text-xs ${rounds === n ? 'border-yellow-300 text-yellow-300' : 'border-gray-500'}`}>{n}</button>
              ))}
            </div>
          </div>
          {err && <p className="text-xs text-red-300">{err}</p>}
          <button disabled={!be} onClick={create} className="pixel-btn pixel-box w-full bg-[#3d6b3d] py-3">방 만들기</button>
        </div>
      )}

      {room && (
        <>
          <div className="pixel-box p-3 text-center">
            <p className="text-xs text-gray-300">방 코드 · {SUBJECT_LABEL[room.subject]} · {room.totalRounds}라운드</p>
            <p className="font-title text-3xl tracking-widest text-yellow-300">{room.code}</p>
          </div>

          {room.status === 'lobby' && (
            <>
              <p className="text-xs">참가자 {players.length}명</p>
              <div className="flex flex-wrap gap-2">
                {players.map(([id, f]) => (
                  <span key={id} className="flex items-center gap-1 rounded bg-[#2b2b45] px-2 py-1 text-xs">
                    <img src={frontSprite(f.pokemonId)} alt="" className="sprite h-6 w-6" />{f.name}
                  </span>
                ))}
              </div>
              <button disabled={players.length < 1} onClick={start} className="pixel-btn pixel-box bg-[#b03a2e] py-3">게임 시작 ({players.length}명)</button>
            </>
          )}

          {room.status === 'playing' && (
            <>
              <div className="pixel-box space-y-1 p-3 text-sm">
                {room.current && qRef.current ? (
                  <>
                    <p className="text-xs text-yellow-300">라운드 {room.current.round + 1}/{room.totalRounds} · {qRef.current.q.difficulty} · 제출 {Object.keys(room.answers?.[room.current.round] ?? {}).length}/{players.length}</p>
                    <p>{qRef.current.q.question}</p>
                    <p className="text-xs text-green-300">정답: {qRef.current.q.answer}</p>
                    <button onClick={() => void resolve()} className="pixel-btn mt-1 rounded border-2 border-white px-2 py-1 text-xs">지금 마감</button>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-gray-300">{room.lastResult ? `라운드 ${room.lastResult.round + 1} 종료` : '준비 완료'}</p>
                    {room.lastResult?.events.map((e, i) => <p key={i} className="text-[11px]">{e}</p>)}
                    <button onClick={() => void next()} className="pixel-btn pixel-box mt-2 w-full bg-[#4a6fd8] py-3">다음 문제 출제 ▶</button>
                  </>
                )}
              </div>
              <button onClick={() => void endGame()} className="pixel-btn self-end text-xs text-gray-400 underline">게임 종료</button>
            </>
          )}

          {room.status === 'finished' && <p className="text-center font-title text-sm text-yellow-300">🏆 최종 순위</p>}
          {room.fighters && <Board rank={ranking(room.fighters)} />}
          <button onClick={() => void close()} className="pixel-btn pixel-box mt-2 py-2 text-xs">방 닫기</button>
        </>
      )}
      <button onClick={() => go('title')} className="pixel-btn pixel-box mt-auto py-3">타이틀로</button>
    </div>
  )
}
