import { useEffect, useRef, useState } from 'react'
import { useGame } from '../store/gameStore'
import { type Backend, getBackend } from '../lib/backend'
import { type RoomState, submitAnswer, subscribeRoom } from '../lib/classRoom'
import { ranking } from '../lib/classBattle'
import QuestionPanel from '../components/QuestionPanel'
import HpBar from '../components/HpBar'
import { backSprite, frontSprite } from '../data/sprites'
import { CLASS_KEY } from './ClassJoin'
import { sfx } from '../lib/sound'
import type { Question } from '../types'

export default function ClassPlay() {
  const go = useGame(s => s.go)
  const [be, setBe] = useState<Backend | null>(null)
  const [loadErr, setLoadErr] = useState('')
  const pid = be?.uid ?? ''
  const [room, setRoom] = useState<RoomState | null | undefined>(undefined)
  const [submitted, setSubmitted] = useState<number>(-1)
  const [code] = useState(() => { try { return sessionStorage.getItem(CLASS_KEY) ?? '' } catch { return '' } })
  const lastRound = useRef(-2)

  useEffect(() => {
    let off = () => {}
    let dead = false
    getBackend().then(b => {
      if (dead) return
      setBe(b)
      off = subscribeRoom(b, code, r => setRoom(r))
    }).catch(e => setLoadErr(e instanceof Error ? e.message : '연결 실패'))
    return () => { dead = true; off() }
  }, [code])

  useEffect(() => {
    if (room?.lastResult && room.lastResult.round !== lastRound.current) {
      lastRound.current = room.lastResult.round
      room.lastResult.verdicts[pid]?.correct ? sfx.correct() : sfx.wrong()
    }
  }, [room?.lastResult, pid])

  if (loadErr) return <Center>{loadErr}<button onClick={() => go('title')} className="mt-3 underline">나가기</button></Center>
  if (room === undefined || !be) return <Center>연결 중…</Center>
  if (room === null) return <Center>방이 닫혔어요. <button onClick={() => go('title')} className="mt-3 underline">나가기</button></Center>
  const me = room.fighters?.[pid]
  const foe = me?.opponent ? room.fighters?.[me.opponent] : undefined
  if (!me) return <Center>참가 정보를 찾을 수 없어요. <button onClick={() => go('classJoin')} className="mt-3 underline">다시 입장</button></Center>

  if (room.status === 'finished') {
    const rank = ranking(room.fighters!)
    const myRank = rank.findIndex(([id]) => id === pid) + 1
    return (
      <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
        <h2 className="font-title text-center text-lg text-yellow-300">{myRank}위!</h2>
        <Board rank={rank} pid={pid} />
        <button onClick={() => go('title')} className="pixel-btn pixel-box mt-auto py-3">나가기</button>
      </div>
    )
  }

  const cur = room.current
  const answering = room.status === 'playing' && cur && submitted !== cur.round
  return (
    <div className="relative flex h-full flex-col">
      <div className="relative min-h-0 flex-[3]" style={{ background: 'linear-gradient(#8fd3ff 0%, #d7f0ff 45%, #8bd06a 45%, #5fa84a 100%)' }}>
        {foe && (
          <>
            <div className="absolute left-3 top-3"><HpBar name={foe.name} level={50} hp={foe.hp} maxHp={foe.maxHp} /></div>
            <img src={frontSprite(foe.pokemonId)} alt="" className="sprite idle absolute right-6 top-10" style={{ width: 112, height: 112 }} />
          </>
        )}
        <img src={backSprite(me.pokemonId)} alt="" className="sprite absolute bottom-3 left-6" style={{ width: 128, height: 128 }} />
        <div className="absolute bottom-3 right-3"><HpBar name={me.name} level={50} hp={me.hp} maxHp={me.maxHp} showNumbers /></div>
      </div>
      <div className="flex flex-[2] flex-col gap-2 overflow-y-auto border-t-4 border-black bg-[#1b1b2f] p-3 text-sm">
        <div className="flex justify-between text-xs"><span>방 {room.code}</span><span className="text-yellow-300">점수 {me.score}</span></div>
        {room.status === 'lobby' && <p className="pixel-box p-3 text-center">선생님이 시작하길 기다리는 중…</p>}
        {room.status === 'playing' && !cur && (
          <div className="pixel-box space-y-1 p-3 text-[12px]">
            {room.lastResult ? (
              <>
                <p className={room.lastResult.verdicts[pid]?.correct ? 'text-green-300' : 'text-red-300'}>
                  {room.lastResult.verdicts[pid]?.correct ? '정답!' : '오답/무응답'} · 정답: {room.lastResult.answer}
                </p>
                <p className="text-gray-300">{room.lastResult.explanation}</p>
                {room.lastResult.events.map((e, i) => <p key={i}>{e}</p>)}
              </>
            ) : <p>곧 첫 문제가 나와요!</p>}
            <p className="pt-1 text-gray-400">다음 문제를 기다리는 중…</p>
          </div>
        )}
        {room.status === 'playing' && cur && !answering && <p className="pixel-box p-3 text-center">제출 완료! 결과를 기다려요…</p>}
        {!me.opponent && room.status === 'playing' && <p className="text-xs text-gray-400">상대가 없어요</p>}
      </div>
      {answering && cur && (
        <QuestionPanel
          key={cur.round}
          question={{ ...(cur.q as unknown as Question), subject: 'math', answer: '', explanation: '' }}
          timeLimit={cur.limitSec}
          moveName={`라운드 ${cur.round + 1}/${room.totalRounds}`}
          noCancel
          onCancel={() => {}}
          onSubmit={(input, ratio) => {
            setSubmitted(cur.round)
            void submitAnswer(be, room.code, cur.round, pid, { answer: input ?? '', ms: Math.round((1 - ratio) * cur.limitSec * 1000) })
          }}
        />
      )}
    </div>
  )
}

const Center = ({ children }: { children: React.ReactNode }) => <div className="flex h-full flex-col items-center justify-center p-6 text-center">{children}</div>

export function Board({ rank, pid }: { rank: ReturnType<typeof ranking>; pid?: string }) {
  return (
    <ol className="space-y-1">
      {rank.map(([id, f], i) => (
        <li key={id} className={`flex items-center gap-2 rounded px-2 py-1 text-xs ${id === pid ? 'bg-[#44446a]' : 'bg-[#2b2b45]'}`}>
          <span className="w-5 text-yellow-300">{i + 1}</span>
          <img src={frontSprite(f.pokemonId)} alt="" className="sprite h-8 w-8" />
          <span className="min-w-0 flex-1 truncate">{f.name}</span>
          <span className={f.hp > 0 ? 'text-green-300' : 'text-red-300'}>{f.hp > 0 ? `HP ${f.hp}` : '기절'}</span>
          <span className="w-12 text-right">{f.score}점</span>
        </li>
      ))}
    </ol>
  )
}
