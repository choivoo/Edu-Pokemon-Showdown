/** Deterministic 30 FPS action timing for Pokémon Quest-inspired 2D battles.
 * This is ORIGINAL FRAME-AWARE 2D COMBAT, NOT recovered retail frame data.
 * The original executable's per-move animation timelines are not available.
 */
import type { Move } from '../types'
import { moveProfile } from './moveProfiles'
export const QUEST_COMBAT_FPS=30
export interface MoveFrameTimeline {
 name:string
 shape:string
 startupFrames:number
 hitFrames:number[]
 recoveryFrames:number
 totalFrames:number
}
const byName:Record<string,number>={
 'Hyper Beam':20,'Solar Beam':24,'Thunder':16,'Earthquake':12,'Explosion':25,
 'Self-Destruct':21,'Mega Punch':7,'Ice Beam':13,'Hydro Pump':18,
 'Volt Tackle':11,'Dragon Rush':14,'Pin Missile':9,'Bullet Seed':10,
 'Fury Swipes':5,'Bonemerang':12,'Fire Blast':16,
}
/**
 * Quantize every attack onto 30 FPS discrete startup/contact/recovery ticks.
 * Attack styles differ by shape; multi-hit attacks have their own contact
 * windows. These 2D timing frames are author-designed estimates.
 */
export function moveFrameTimeline(move:Move):MoveFrameTimeline{
 const profile=moveProfile(move)
 const startupFrames=byName[move.name]??Math.max(3,Math.round(profile.windup*QUEST_COMBAT_FPS))
 const step=profile.hits>1?(profile.shape==='wave'?5:4):0
 const hitFrames=Array.from({length:profile.hits},(_,i)=>startupFrames+i*step)
 const recoveryFrames=Math.max(4,Math.min(18,Math.round((move.wait??5)*1.5)))
 return {name:move.name,shape:profile.shape,startupFrames,hitFrames,recoveryFrames,
  totalFrames:hitFrames[hitFrames.length-1]+recoveryFrames}
}
export function attackFrameDelay(move:Move,hitIndex=0):number{
 const frames=moveFrameTimeline(move).hitFrames
 return (frames[Math.max(0,Math.min(hitIndex,frames.length-1))]??0)/QUEST_COMBAT_FPS
}
