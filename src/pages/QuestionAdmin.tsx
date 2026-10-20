import { useState } from 'react'
import { useGame } from '../store/gameStore'
import { addCustomQuestions, CSV_HEADER, loadCustomQuestions, parseCsvQuestions, parseJsonQuestions, saveCustomQuestions } from '../lib/customQuestions'
import { SUBJECT_LABEL } from '../lib/questions'
import { getBackend } from '../lib/backend'
import { fetchQuestionSet, shareQuestionSet } from '../lib/classRoom'

const SAMPLE = `[
  {"subject":"math","difficulty":"normal","type":"choice","question":"7 × 8 = ?","choices":["54","56","58","64"],"answer":"56","explanation":"7 × 8 = 56"}
]`

export default function QuestionAdmin() {
  const go = useGame(s => s.go)
  const [text, setText] = useState('')
  const [all, setAll] = useState(loadCustomQuestions())
  const [info, setInfo] = useState<{ ok: string; errors: string[] } | null>(null)

  const apply = (r: { questions: import('../types').Question[]; errors: string[] }) => {
    if (r.questions.length) setAll(addCustomQuestions(r.questions))
    setInfo({ ok: `${r.questions.length}개 추가됨`, errors: r.errors })
  }
  const onFile = async (f: File | undefined) => {
    if (!f) return
    const t = await f.text()
    apply(f.name.toLowerCase().endsWith('.json') ? parseJsonQuestions(t) : parseCsvQuestions(t))
  }
  const [shareCode, setShareCode] = useState('')
  const [importCode, setImportCode] = useState('')
  const [busy, setBusy] = useState(false)
  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    try { await fn() } catch (e) { setInfo({ ok: '', errors: [e instanceof Error ? e.message : '실패했어요'] }) } finally { setBusy(false) }
  }
  const share = () => run(async () => { setShareCode(await shareQuestionSet(await getBackend(), all)) })
  const importSet = () => run(async () => {
    const qs = await fetchQuestionSet(await getBackend(), importCode.trim())
    setAll(addCustomQuestions(qs.map(q => ({ ...q, id: `${q.id}-${importCode.trim()}` }))))
    setInfo({ ok: `${qs.length}개 가져옴`, errors: [] })
  })
  const download = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url; a.download = 'questions.json'; a.click()
    URL.revokeObjectURL(url)
  }
  const remove = (id: string) => { const n = all.filter(q => q.id !== id); saveCustomQuestions(n); setAll(n) }

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
      <h2 className="font-title text-sm text-yellow-300">문제 관리 (선생님)</h2>
      <p className="text-[11px] leading-relaxed text-gray-300">
        JSON을 붙여넣거나 CSV/JSON 파일을 올리세요. 이 브라우저(localStorage)에 저장되며 모든 모드에서 출제됩니다.
        CSV 헤더: <code className="text-yellow-200">{CSV_HEADER}</code> (보기는 <code>|</code> 로 구분)
      </p>
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder={SAMPLE} rows={7}
        className="rounded border-4 border-black bg-white p-2 text-[11px] text-black" />
      <div className="flex gap-2">
        <button disabled={!text.trim()} onClick={() => { apply(text.trim().startsWith('[') || text.trim().startsWith('{') ? parseJsonQuestions(text) : parseCsvQuestions(text)); setText('') }} className="pixel-btn pixel-box flex-1 bg-[#3d6b3d] py-2">추가</button>
        <label className="pixel-btn pixel-box flex-1 cursor-pointer py-2 text-center">
          파일 업로드
          <input type="file" accept=".csv,.json,text/csv,application/json" className="hidden" onChange={e => { void onFile(e.target.files?.[0]); e.target.value = '' }} />
        </label>
      </div>
      {info && (
        <div className="text-[11px]">
          <p className="text-green-300">{info.ok}</p>
          {info.errors.map((e, i) => <p key={i} className="text-red-300">⚠ {e}</p>)}
        </div>
      )}
      <div className="pixel-box space-y-2 p-3 text-[11px]">
        <p className="text-yellow-300">문제 세트 공유</p>
        <p className="text-gray-300">선생님이 만든 문제를 학생 기기로 보내요. (클래스 모드에서는 선생님 화면의 문제가 자동으로 학생에게 전달돼요)</p>
        <div className="flex gap-2">
          <button disabled={busy || !all.length} onClick={() => void share()} className="pixel-btn pixel-box flex-1 py-1.5">공유 코드 만들기</button>
          <button disabled={!all.length} onClick={download} className="pixel-btn pixel-box flex-1 py-1.5">JSON 내보내기</button>
        </div>
        {shareCode && <p className="text-center text-lg text-green-300">공유 코드 {shareCode}</p>}
        <div className="flex gap-2">
          <input value={importCode} onChange={e => setImportCode(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" placeholder="코드 4자리"
            className="min-w-0 flex-1 rounded border-4 border-black bg-white px-2 py-1 text-black" />
          <button disabled={busy || importCode.length !== 4} onClick={() => void importSet()} className="pixel-btn pixel-box px-3 py-1.5">가져오기</button>
        </div>
      </div>
      <p className="text-xs">등록된 문제 {all.length}개</p>
      <ul className="space-y-1 text-[11px]">
        {all.map(q => (
          <li key={q.id} className="flex items-center gap-2 rounded bg-[#2b2b45] px-2 py-1">
            <span className="text-yellow-200">{SUBJECT_LABEL[q.subject]}·{q.difficulty}</span>
            <span className="min-w-0 flex-1 truncate">{q.question}</span>
            <button onClick={() => remove(q.id)} className="text-red-300">삭제</button>
          </li>
        ))}
      </ul>
      <button onClick={() => go('title')} className="pixel-btn pixel-box mt-auto py-3">뒤로</button>
    </div>
  )
}
