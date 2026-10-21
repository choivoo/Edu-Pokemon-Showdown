/** Predictable, testable 2D Pokémon combat tactical policy.
 * The exact original game's private AI source is unavailable; our behavior
 * reproduces observable classes: threat focus, move-range checks, buff/heal
 * decisions, ranged spacing and boss telegraph cadence.
 */
import type { Move } from '../types'
export interface TacticsActor {
 x:number; y:number; maxHp:number; hp:number; range:number; boss:boolean
 side:'ally'|'enemy'; spCd:number; spCd2:number
 special:Move; secondary:Move|null
}
export interface TacticalChoice {slot:0|1|null;retreat:boolean;reason:string}
const dist=(a:{x:number;y:number},b:{x:number;y:number})=>Math.hypot(a.x-b.x,a.y-b.y)
const urgent=(m:Move,actor:TacticsActor,friends:readonly TacticsActor[])=>{
 if(m.role==='buff'&&m.fx?.heal)return friends.some(x=>x.hp/x.maxHp<.72)
 if(m.role==='buff'&&(m.fx?.atk||m.fx?.def))return true
 return !!m.role && m.role!=='buff'
}
export function chooseTacticalAction(
 actor:TacticsActor,target:{x:number;y:number}|undefined,
 friends:readonly TacticsActor[],area:number,auto:boolean,roll:number
):TacticalChoice{
 if(!target)return {slot:null,retreat:false,reason:'no-target'}
 const d=dist(actor,target)
 const wounded=actor.hp/Math.max(1,actor.maxHp)<.35
 const ranged=actor.range>100
 const retreat=ranged&&d<Math.max(85,actor.range*.54)&&wounded
 if(actor.side==='ally'&&!auto)return {slot:null,retreat,reason:'manual'}
 // Route 1 is intentionally easier; regular wild Pokémon do not proactively
 // launch strong specials until after the original intro stages.
 const permitted=actor.side==='ally'||actor.boss||area>=8
 if(!permitted)return {slot:null,retreat,reason:'intro-balance'}
 const options: Array<{slot:0|1;move:Move;cd:number}>=[
  {slot:0,move:actor.special,cd:actor.spCd}]
 if(actor.secondary)options.push({slot:1,move:actor.secondary,cd:actor.spCd2})
 const ready=options.filter(x=>x.cd<=0)
 if(!ready.length)return {slot:null,retreat,reason:'cooldown'}
 // Range of moves depends on genre geometry, but special attacks must never
 // auto-hit targets across the entire camera/field.
 const rangeLimit=actor.boss?450:ranged?actor.range+130:205
 if(d>rangeLimit)return {slot:null,retreat,reason:'out-of-range'}
 const support=ready.find(x=>urgent(x.move,actor,friends))
 if(support)return {slot:support.slot,retreat,reason:'support'}
 const attacks=ready.filter(x=>x.move.power>0)
 if(!attacks.length)return {slot:null,retreat,reason:'support-not-needed'}
 // Limit basic enemy skill spam and preserve a reaction window.
 if(actor.side==='enemy'&&!actor.boss&&roll>.55)return {slot:null,retreat,reason:'conserve'}
 const ranked=attacks.sort((a,b)=>{
   const as=(a.move.power||0)/(a.move.wait||5)
   const bs=(b.move.power||0)/(b.move.wait||5)
   return bs-as
 })
 return {slot:ranked[0].slot,retreat,reason:'attack'}
}
