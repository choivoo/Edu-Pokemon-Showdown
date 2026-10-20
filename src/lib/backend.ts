// Realtime Database 와 같은 경로 기반 API. Firebase 설정이 있으면 Firebase,
// 없으면 같은 브라우저의 탭끼리 동작하는 로컬 데모 백엔드(localStorage)를 쓴다.
export interface Backend {
  kind: 'firebase' | 'local'
  get<T = unknown>(path: string): Promise<T | null>
  set(path: string, value: unknown): Promise<void>
  /** 해당 경로 아래 키들을 병합 갱신 (키에 / 가 있으면 하위 경로 갱신) */
  update(path: string, patch: Record<string, unknown>): Promise<void>
  remove(path: string): Promise<void>
  subscribe<T = unknown>(path: string, cb: (v: T | null) => void): () => void
}

const env = import.meta.env
export const firebaseConfigured = Boolean(env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_DATABASE_URL)

const parts = (p: string) => p.split('/').filter(Boolean)

// ---------- 로컬 데모 백엔드 ----------
const LKEY = 'edu-pokemon-showdown:local-db'

function readTree(): Record<string, unknown> {
  try { return JSON.parse(localStorage.getItem(LKEY) ?? '{}') } catch { return {} }
}
function writeTree(t: Record<string, unknown>) {
  try { localStorage.setItem(LKEY, JSON.stringify(t)) } catch { /* 무시 */ }
}
function getAt(tree: unknown, path: string): unknown {
  let cur = tree
  for (const k of parts(path)) {
    if (cur && typeof cur === 'object' && k in (cur as object)) cur = (cur as Record<string, unknown>)[k]
    else return null
  }
  return cur ?? null
}
function setAt(tree: Record<string, unknown>, path: string, value: unknown) {
  const ks = parts(path)
  let cur = tree
  ks.slice(0, -1).forEach(k => {
    if (!cur[k] || typeof cur[k] !== 'object') cur[k] = {}
    cur = cur[k] as Record<string, unknown>
  })
  const last = ks[ks.length - 1]
  if (value === null || value === undefined) delete cur[last]
  else cur[last] = value
}

function createLocal(): Backend {
  const listeners = new Set<() => void>()
  const notify = () => listeners.forEach(l => l())
  window.addEventListener('storage', e => { if (e.key === LKEY) notify() })
  const mutate = (fn: (t: Record<string, unknown>) => void) => {
    const t = readTree()
    fn(t)
    writeTree(t)
    notify()
  }
  return {
    kind: 'local',
    get: async path => getAt(readTree(), path) as never,
    set: async (path, value) => mutate(t => setAt(t, path, value)),
    update: async (path, patch) => mutate(t => { for (const [k, v] of Object.entries(patch)) setAt(t, `${path}/${k}`, v) }),
    remove: async path => mutate(t => setAt(t, path, null)),
    subscribe: (path, cb) => {
      let last = ''
      const fire = () => {
        const v = getAt(readTree(), path)
        const s = JSON.stringify(v)
        if (s !== last) { last = s; cb(v as never) }
      }
      listeners.add(fire)
      fire()
      return () => listeners.delete(fire)
    },
  }
}

// ---------- Firebase 백엔드 (설정이 있을 때만 동적 로드) ----------
async function createFirebase(): Promise<Backend> {
  const [{ initializeApp }, db] = await Promise.all([import('firebase/app'), import('firebase/database')])
  const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: env.VITE_FIREBASE_DATABASE_URL,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  })
  const d = db.getDatabase(app)
  return {
    kind: 'firebase',
    get: async path => (await db.get(db.ref(d, path))).val(),
    set: (path, value) => db.set(db.ref(d, path), value),
    update: (path, patch) => db.update(db.ref(d, path), patch),
    remove: path => db.remove(db.ref(d, path)),
    subscribe: (path, cb) => db.onValue(db.ref(d, path), snap => cb(snap.val())),
  }
}

let cached: Promise<Backend> | null = null
export function getBackend(): Promise<Backend> {
  if (!cached) cached = firebaseConfigured ? createFirebase() : Promise.resolve(createLocal())
  return cached
}
