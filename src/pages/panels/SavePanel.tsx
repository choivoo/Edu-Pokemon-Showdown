import { useState } from 'react'
import { useGame } from '../../store/gameStore'
import { exportSave, type ExportedKeys, formatPassword, formatSaveKey, importSave, keysToText, parseKeysText, SaveKeyError } from '../../lib/saveKey'
import { Btn, Panel } from '../../ui/kit'
import { sfx } from '../../lib/sound'
import Icon from '../../ui/Icon'

async function copy(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true } catch {
    const ta = document.createElement('textarea')
    ta.value = text; document.body.appendChild(ta); ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  }
}

export default function SavePanel() {
  const { save, openPanel, markExported, importSave: apply, hardReset } = useGame()
  const [tab, setTab] = useState<'export' | 'import' | 'reset'>(save.started ? 'export' : 'import')
  const [keys, setKeys] = useState<ExportedKeys | null>(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [inKey, setInKey] = useState('')
  const [inPw, setInPw] = useState('')
  const [err, setErr] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [resetPhrase, setResetPhrase] = useState('')
  const [resetArmed, setResetArmed] = useState(false)

  const make = async () => {
    setBusy(true)
    try {
      const k = await exportSave(save)
      setKeys(k)
      markExported()
      sfx.coin()
    } finally { setBusy(false) }
  }
  const flash = (m: string) => { setNote(m); setTimeout(() => setNote(''), 1800) }
  const download = () => {
    if (!keys) return
    const url = URL.createObjectURL(new Blob([keysToText(keys)], { type: 'text/plain;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url; a.download = `포켓몬퀘스트-저장키-${save.name || 'save'}.txt`; a.click()
    URL.revokeObjectURL(url)
  }
  const readFile = async (f?: File) => {
    if (!f) return
    const parsed = parseKeysText(await f.text())
    if (!parsed) { setErr('이 파일에서 저장 키와 암호 키를 찾지 못했어요.'); return }
    setInKey(formatSaveKey(parsed.saveKey)); setInPw(parsed.password); setErr('')
  }
  const doImport = async () => {
    setBusy(true); setErr('')
    try {
      const s = await importSave(inKey, inPw)
      apply(s)
      sfx.levelup()
    } catch (e) {
      setErr(e instanceof SaveKeyError ? e.message : '불러오기에 실패했어요.')
      setConfirm(false)
    } finally { setBusy(false) }
  }

  return (
    <Panel title="저장 데이터 관리" onClose={() => openPanel(null)} w={880} z={60}>
      <div className="mb-3 flex gap-2">
        <Btn color={tab === 'export' ? 'yellow' : 'gray'} onClick={() => setTab('export')} className="flex-1 py-1.5 text-lg">저장 키 만들기</Btn>
        <Btn color={tab === 'import' ? 'yellow' : 'gray'} onClick={() => setTab('import')} className="flex-1 py-1.5 text-lg">저장 키로 불러오기</Btn>
        <Btn color={tab === 'reset' ? 'red' : 'gray'} onClick={() => { setTab('reset'); setResetPhrase(''); setResetArmed(false) }} className="px-3 py-1.5 text-lg">계정 초기화</Btn>
      </div>

      {tab === 'export' && (
        <div className="space-y-3" style={{ minHeight: 330 }}>
          {!save.started && <p className="pq-inner p-3 text-base">아직 시작한 모험이 없어요. 먼저 게임을 시작하거나, 불러오기 탭을 사용하세요.</p>}
          <p className="text-base leading-snug">진행 상황을 <b>저장 키</b>와 <b>암호 키</b> 한 쌍으로 만들어요. 두 가지를 <b>스크린샷이나 메모로 보관</b>하면 다른 기기에서도, 데이터를 지운 뒤에도 이어서 할 수 있어요. 진행이 쌓이면 다시 만들어 주세요(새 키가 최신).</p>
          {!keys ? (
            <div className="flex justify-center pt-6"><Btn color="red" disabled={busy || !save.started} onClick={() => void make()} className="px-10 py-4 text-2xl"><span className="flex items-center gap-2"><Icon n="key" s={28} />{busy ? '만드는 중…' : '저장 키 만들기'}</span></Btn></div>
          ) : (
            <div className="space-y-2">
              <div className="pq-inner p-2">
                <div className="mb-1 flex items-center justify-between"><b className="text-lg">저장 키</b><Btn color="blue" quiet onClick={async () => flash((await copy(keys.saveKey)) ? '저장 키를 복사했어요' : '복사에 실패했어요')} className="px-3 py-0.5 text-base">복사</Btn></div>
                <textarea readOnly value={formatSaveKey(keys.saveKey)} className="h-[84px] w-full resize-none rounded bg-white p-2 font-mono text-sm text-[#333]" onFocus={e => e.currentTarget.select()} />
              </div>
              <div className="pq-inner flex items-center justify-between p-2">
                <div><b className="text-lg">암호 키</b><p className="font-mono text-3xl tracking-wider text-[#c0392b]">{formatPassword(keys.password)}</p></div>
                <Btn color="blue" quiet onClick={async () => flash((await copy(formatPassword(keys.password))) ? '암호 키를 복사했어요' : '복사에 실패했어요')} className="px-3 py-1 text-base">복사</Btn>
              </div>
              <div className="flex items-center gap-2">
                <Btn color="green" onClick={download} className="flex items-center gap-2 text-base"><Icon n="download" s={22} />파일로 저장 (.txt)</Btn>
                <Btn color="yellow" quiet onClick={async () => flash((await copy(keysToText(keys))) ? '두 키를 모두 복사했어요' : '복사에 실패했어요')} className="text-base">둘 다 복사</Btn>
                <span className="text-sm font-bold text-[#c0392b]">{note}</span>
              </div>
              <p className="flex items-start gap-1 text-sm text-[#a03a2a]"><Icon n="warn" s={20} />암호 키가 없으면 저장 키를 열 수 없고, 이 키 없이는 잃어버린 데이터를 복구할 수 없어요. 꼭 두 가지를 함께 보관하세요.</p>
            </div>
          )}
        </div>
      )}

      {tab === 'reset' && (
        <div className="space-y-4 rounded-lg border-4 border-[#ad403a] bg-[#fff0df] p-5 text-[#613327]" style={{minHeight:330}}>
          <div className="flex items-center gap-2 text-2xl font-black"><Icon n="warn" s={30}/>이 기기의 모험 데이터를 초기화</div>
          <p className="text-base leading-relaxed">이 브라우저에 저장된 <b>포켓몬·레벨·파워스톤·지역 진행도·요리 재료·PM티켓·업적</b>이 모두 초기화되고, 첫 시작 화면으로 돌아갑니다. 다른 기기의 데이터나 이미 만들어 둔 저장 키 파일은 삭제하지 않습니다.</p>
          <p className="text-sm font-bold">초기화 전에는 위의 ‘저장 키 만들기’에서 저장 키와 암호 키를 백업하는 것을 권장합니다.</p>
          <label className="block text-base font-bold" htmlFor="quest-reset-phrase">정말 초기화하려면 아래에 <span className="text-red-700">초기화</span>를 입력하세요.</label>
          <input id="quest-reset-phrase" className="w-full rounded border-4 border-[#d1a177] bg-white px-3 py-2 text-xl text-[#452c20]"
            value={resetPhrase} onChange={e=>{setResetPhrase(e.target.value);setResetArmed(false)}} placeholder="초기화" autoComplete="off" />
          <div className="flex items-center justify-end gap-2">
            <Btn color="gray" onClick={()=>{setTab('export');setResetArmed(false);setResetPhrase('')}} className="px-5 py-2">취소</Btn>
            {!resetArmed ? (
              <Btn color="red" disabled={!save.started || resetPhrase.trim()!=='초기화'}
                onClick={()=>setResetArmed(true)} className="px-5 py-2">초기화 확인</Btn>
            ) : (
              <Btn color="red" onClick={()=>{sfx.wrong();hardReset()}} className="px-5 py-2">
                모든 진행 데이터 삭제하고 새로 시작
              </Btn>
            )}
          </div>
          {resetArmed && <p role="alert" className="text-center text-sm font-bold text-red-700">마지막 확인입니다. 삭제 후에는 백업이 없으면 이전 진행도를 복구할 수 없습니다.</p>}
        </div>
      )}

      {tab === 'import' && (
        <div className="space-y-2" style={{ minHeight: 330 }}>
          <p className="text-base leading-snug">보관해 둔 <b>저장 키</b>와 <b>암호 키</b>를 붙여 넣으면 그 시점의 모험을 불러와요. (이 기기의 현재 데이터는 덮어써져요)</p>
          <textarea value={inKey} onChange={e => { setInKey(e.target.value); setErr('') }} placeholder="저장 키 (PQF1 로 시작)" className="h-[96px] w-full resize-none rounded-lg border-4 border-[#e5a500] bg-white p-2 font-mono text-sm text-[#333]" />
          <input value={inPw} onChange={e => { setInPw(e.target.value); setErr('') }} placeholder="암호 키 (XXXX-XXXX-XXXX-XXXX)" className="w-full rounded-lg border-4 border-[#e5a500] bg-white px-3 py-2 font-mono text-2xl tracking-wider text-[#c0392b]" />
          {err && <p className="flex items-center gap-1 text-base font-bold text-[#d23c36]"><Icon n="warn" s={22} />{err}</p>}
          <div className="flex items-center gap-2">
            <label className="pq-btn pq-green flex cursor-pointer items-center gap-2 px-4 py-2 text-base"><Icon n="upload" s={22} />파일에서 읽기<input type="file" accept=".txt,text/plain" className="hidden" onChange={e => { void readFile(e.target.files?.[0]); e.target.value = '' }} /></label>
            <span className="flex-1" />
            {!confirm ? (
              <Btn color="red" disabled={busy || !inKey.trim() || !inPw.trim()} onClick={() => (save.started ? setConfirm(true) : void doImport())} className="px-8 text-xl">불러오기</Btn>
            ) : (
              <>
                <span className="text-base font-bold text-[#d23c36]">현재 데이터가 사라져요. 계속할까요?</span>
                <Btn color="gray" onClick={() => setConfirm(false)} className="text-base">취소</Btn>
                <Btn color="red" disabled={busy} onClick={() => void doImport()} className="text-base">덮어쓰기</Btn>
              </>
            )}
          </div>
        </div>
      )}
    </Panel>
  )
}
