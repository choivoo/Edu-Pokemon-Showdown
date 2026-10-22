/**
 * Private device-local recording storage for the user's own legally possessed audio.
 * No uploads, server calls, analytics or public distribution. Playback is opt-in.
 */
const DB='pq-fan-private-soundtrack'
const TABLE='recordings'
const KEY='personal-quest-soundtrack'
async function openDB():Promise<IDBDatabase>{
 return await new Promise((resolve,reject)=>{
  const req=indexedDB.open(DB,1)
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(TABLE))req.result.createObjectStore(TABLE)}
  req.onsuccess=()=>resolve(req.result)
  req.onerror=()=>reject(req.error)
 })
}
export async function saveDeviceSoundtrack(file:File):Promise<boolean>{
 try{
  const db=await openDB()
  await new Promise<void>((resolve,reject)=>{
   const tx=db.transaction(TABLE,'readwrite')
   tx.objectStore(TABLE).put(file,KEY)
   tx.oncomplete=()=>resolve()
   tx.onerror=()=>reject(tx.error)
   tx.onabort=()=>reject(tx.error)
  })
  db.close()
  return true
 }catch{return false}
}
export async function restoreDeviceSoundtrack():Promise<File|null>{
 try{
  const db=await openDB()
  const blob=await new Promise<Blob|null>((resolve,reject)=>{
   const tx=db.transaction(TABLE,'readonly')
   const req=tx.objectStore(TABLE).get(KEY)
   req.onsuccess=()=>resolve(req.result instanceof Blob?req.result:null)
   req.onerror=()=>reject(req.error)
  })
  db.close()
  if(!blob)return null
  return new File([blob],'my-pokemon-quest-soundtrack.mp3',{type:blob.type||'audio/mpeg'})
 }catch{return null}
}
export async function clearDeviceSoundtrack():Promise<boolean>{
 try{
  const db=await openDB()
  await new Promise<void>((resolve,reject)=>{
   const tx=db.transaction(TABLE,'readwrite')
   tx.objectStore(TABLE).delete(KEY)
   tx.oncomplete=()=>resolve()
   tx.onerror=()=>reject(tx.error)
  })
  db.close()
  return true
 }catch{return false}
}
