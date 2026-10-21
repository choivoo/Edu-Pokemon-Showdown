import { useEffect, useState } from 'react'
import { frontSprite, fallbackSpriteOnError } from '../data/sprites'

const FEATURED=[25,1,4,7,133]
/** Never blocks indefinitely on an external sprite host; PokéAPI artwork has a local 2D fallback. */
export default function LoadingScreen({onReady}:{onReady:()=>void}) {
  const [done,setDone]=useState(0)
  useEffect(()=>{
    let active=true
    let count=0
    const finish=()=>{if(active){count++;setDone(count)}}
    for(const id of FEATURED){
      const img=new Image()
      img.onload=finish
      img.onerror=finish
      img.src=frontSprite(id)
    }
    const timer=setTimeout(()=>{if(active)onReady()},1400)
    return ()=>{active=false;clearTimeout(timer)}
  },[onReady])
  return <div className="quest-loading" role="status" aria-live="polite">
    <div className="quest-loading-light" />
    <div className="quest-loading-mark"><span>Q</span><span className="quest-loading-burst">✦</span></div>
    <div className="quest-loading-title">TUMBLECUBE ADVENTURE</div>
    <h2>새로운 섬으로 모험을 떠날 준비 중!</h2>
    <div className="quest-loading-mons">
      {FEATURED.map((id,i)=><div className="quest-loading-mon" key={id} style={{animationDelay:`${i*0.12}s`}}>
        <img src={frontSprite(id)} onError={e=>fallbackSpriteOnError(e.currentTarget,id)} alt="" />
      </div>)}
    </div>
    <div className="quest-loading-progress">
      <span style={{width:`${Math.max(8,(done/FEATURED.length)*100)}%`}} />
    </div>
    <p>2D PIXEL WORLD <span>✦</span> ORIGINAL MUSIC <span>✦</span> QUEST EDITION</p>
  </div>
}
