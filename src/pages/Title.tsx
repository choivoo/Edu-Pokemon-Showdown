import { useEffect, useRef, useState } from 'react'
import { useGame } from '../store/gameStore'
import { frontSprite, fallbackSpriteOnError } from '../data/sprites'
import { bgm, sfx } from '../lib/sound'
import { enterLandscapeFullscreen } from '../lib/fullscreen'
import { Btn } from '../ui/kit'
import Icon from '../ui/Icon'
import { useCanvas } from '../components/useCanvas'
import { H, W } from '../engine/draw'
import { drawTitleWorld } from '../art/scenes'
import { preload, sprite } from '../engine/render'
const HEROES=[25,6,131,94,133,1,7,4]
const POSTER=[{id:1,x:'-3deg'},{id:25,x:'2deg'},{id:4,x:'-1deg'},{id:7,x:'4deg'}]
export default function Title(){
 const {save,go,openPanel,toggleMute}=useGame()
 const canvas=useRef<HTMLCanvasElement>(null)
 const [localSound,setLocalSound]=useState(bgm.localMusicActive)
 const [bundledSound,setBundledSound]=useState(bgm.bundledMusicActive)
 const [musicMessage,setMusicMessage]=useState('')
 useEffect(()=>{preload(HEROES);bgm.play('title','title');void bgm.autoUseBundledAlbum().then(ok=>setBundledSound(ok))},[])
 useCanvas(canvas,(ctx,t)=>{
   drawTitleWorld(ctx,t)
   HEROES.forEach((id,i)=>{
     const x=((t*39+i*160)%(W+160))-80,y=412+(i%3)*35
     const img=sprite(frontSprite(id))
     ctx.fillStyle='rgba(0,0,0,0.17)';ctx.fillRect(Math.floor(x-26),y+4,52,7)
     if(img.complete&&img.naturalWidth){
       ctx.save();ctx.translate(Math.floor(x),y-Math.abs(Math.sin(t*3.5+i))*7)
       ctx.scale(-1,1);ctx.drawImage(img,-35,-69,70,70);ctx.restore()
     }
   })
 })
 const start=()=>{sfx.select();bgm.play(save.started?'camp':'story');go(save.started?'camp':'intro')}
 return <div className="quest-title-root">
   <canvas ref={canvas} width={W} height={H} className="absolute inset-0 h-full w-full opacity-80" />
   <div className="quest-title-wash" />
   <div className="quest-title-spark quest-title-spark-one">✦</div>
   <div className="quest-title-spark quest-title-spark-two">◆</div>
   <div className="quest-title-spark quest-title-spark-three">✧</div>
   <header className="quest-title-head">
     <p className="quest-title-overline">AN ORIGINAL 2D PIXEL ADVENTURE <span>◈</span> VOL. 03</p>
     <div className="quest-title-logo">
       <span className="quest-title-emblem">Q</span>
       <div>
         <div className="quest-title-kicker">NE모네모 ISLAND</div>
         <h1>포켓몬 퀘스트 <span>FAN EDITION</span></h1>
         <p>작은 친구들과 떠나는 커다란 모험!</p>
       </div>
     </div>
     <div className="quest-title-tag"><span>2D</span><span>151 KANTO</span><span>93 EXPEDITIONS</span><span>16 NEW TRACKS</span></div>
   </header>
   <section className="quest-title-cast" aria-label="모험을 함께할 포켓몬">
     {POSTER.map(({id,x},i)=><div key={id} className="quest-title-cast-item" style={{transform:`rotate(${x})`,animationDelay:`${i*.18}s`}}>
       <div className="quest-title-cast-bg"/>
       <img src={frontSprite(id)} alt="" onError={e=>fallbackSpriteOnError(e.currentTarget,id)} />
       <small>#{String(id).padStart(3,'0')}</small>
     </div>)}
   </section>
   <div className="quest-title-menu">
     <p className="quest-title-menu-label">✦  SELECT YOUR ADVENTURE  ✦</p>
     <button onClick={start} className="quest-title-primary">
       <Icon n="play" s={28}/><span>{save.started?`이어하기 · ${save.name}`:'새로운 모험 시작'}</span><span className="quest-title-arrow">➜</span>
     </button>
     <div className="quest-title-actions">
       <Btn color="blue" onClick={()=>openPanel('save')} className="flex items-center gap-2 text-sm"><Icon n="key" s={19}/>데이터 이전</Btn>
       <Btn color="gray" onClick={()=>void enterLandscapeFullscreen()} className="flex items-center gap-2 text-sm"><Icon n="expand" s={19}/>전체화면</Btn>
       <Btn color="gray" onClick={toggleMute} className="flex items-center gap-2 text-sm"><Icon n={save.muted?'mute':'sound'} s={19}/>{save.muted?'소리 켜기':'소리 끄기'}</Btn>
     </div>
     <div className="flex items-center justify-center gap-2 bg-[#214d4b]/75 p-1 text-center text-xs text-white">
       <label className="cursor-pointer border-2 border-[#fff0b8] bg-[#518b71] px-2 py-1 font-bold">
         <input className="sr-only" type="file" accept="audio/*,.mp3" aria-label="내 기기의 BGM 파일 선택"
          onChange={e=>{const file=e.target.files?.[0];if(!file)return
            const ok=bgm.useLocalFile(file);setLocalSound(ok);setBundledSound(false);setMusicMessage(ok?'선택한 MP3 앨범의 27개 구간을 자동 재생합니다':'오디오 파일을 열 수 없습니다')
          }} />
         개인 MP3 음악 선택
       </label>
       {localSound && <button className="border-2 border-white bg-[#4f665c] px-2 py-1" onClick={()=>{
         bgm.disableLocalFile();setLocalSound(false);setBundledSound(bgm.bundledMusicActive);setMusicMessage(bgm.bundledMusicActive?'배포된 앨범을 자동 재생합니다':'기본 창작 BGM으로 복귀')
       }}>기본 음악 복원</button>}
       <span>{musicMessage || (bundledSound?'공개 배포된 앨범 자동 재생 중 · 모든 기기':'내 MP3를 고르거나 기본 BGM으로 플레이')}</span>
     </div>
   </div>
   <footer className="quest-title-footer">비공식 · 비상업 2D 팬게임  |  Pokémon 관련 권리는 원권리자 소유  |  PokéAPI 도트 사용</footer>
 </div>
}