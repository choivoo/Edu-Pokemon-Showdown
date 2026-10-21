/**
 * Verified encounter samples from Serebii Pokémon Quest location listings.
 * Format is each segment's weighted species groups, not one global area pool.
 * Only accurately sourced routes are listed; others continue using procedural
 * waves and are NOT claimed to be exact original wave tables.
 * Source: serebii.net/quest/location/firststeppe.shtml and gloomygrove.shtml
 */
import type { Rng } from '../types'
import type { WaveEnemy } from '../lib/stages'
type Choice = {id:number; weight:number}
type Group = readonly Choice[]
type Segment = readonly Group[]
interface Encounter { segments: readonly Segment[]; boss:Group }
const g=(...entries:number[]):Group=>entries.map((id,i)=>({id,weight:i===0?1:1}))
const w=(...entries:[number,number][]):Group=>entries.map(([id,weight])=>({id,weight}))
export const VERIFIED_ENCOUNTERS: Readonly<Record<string,Encounter>> = {
 '6-0':{
  segments:[
   [g(16)],
   [g(19),w([16,50],[19,50]),g(19)],
   [g(19),g(16)],
   [g(19)],
  ],
  boss:g(52),
 },
 '6-1':{
  segments:[
   [g(10),g(10)],
   [g(13),w([10,95],[13,5])],
   [g(13),w([10,95],[13,5])],
   [g(13),w([10,95],[13,5])],
  ],
  boss:w([11,50],[14,50]),
 },
 '6-2':{
  segments:[
   [g(21)],
   [g(16),g(16),w([16,95],[21,5])],
   [g(21)],
   [w([4,10],[37,45],[58,45])],
  ],
  boss:w([17,76.67],[63,20],[133,3.33]),
 },
 '6-3':{
  segments:[
   [w([84,90],[19,10]),g(21)],
   [w([52,65],[16,35]),g(21),g(19),g(84)],
   [g(21),g(52),g(19)],
   [g(21),g(19)],
  ],
  boss:g(20),
 },
 '7-0':{
  segments:[
   [w([43,80],[10,20])],
   [g(11),g(48),g(43)],
   [g(43)],
   [g(43)],
  ],
  boss:g(44),
 },
 '7-1':{
  segments:[
   [w([46,80],[43,10],[10,10]),g(46)],
   [w([16,12.5],[21,12.5],[102,75]),g(102)],
   [w([16,50],[21,50]),g(102)],
   [g(102),g(102)],
  ],
  boss:g(103),
 },
 '7-2': {
  segments: [
   [w([69,85],[13,5],[43,10]),w([43,97.5],[69,2.5]),g(14)],
   [g(13),g(48),g(69),w([43,95],[69,5])],
   [g(13),w([43,95],[69,5])],
   [g(13),w([43,85],[69,15])],
  ],
  boss:g(70),
 },
 '7-3': {
  segments: [
   [w([43,20],[69,30],[46,50])],
   [w([23,85],[25,10],[1,5]),w([23,85],[48,15]),g(46)],
  ],
  boss:g(47),
 },
 '7-4': {
  segments: [
   [w([10,50],[13,40],[46,10]),g(11),g(14)],
   [g(10),w([48,60],[102,40]),w([48,50],[46,50]),g(13)],
   [g(10)],
   [g(10)],
  ],
  boss:w([12,50],[15,50]),
 },
}
function pick(group:Group,rng:Rng):number{
 let total=group.reduce((n,e)=>n+e.weight,0),r=rng()*total
 for(const e of group){r-=e.weight;if(r<0)return e.id}
 return group[group.length-1].id
}
/** The 2D engine uses three encounter waves; retain segments as wave groups. */
export function verifiedWaves(area:number,index:number,level:number,rng:Rng):WaveEnemy[][]|undefined{
 const route=VERIFIED_ENCOUNTERS[`${area}-${index}`]
 if(!route)return undefined
 // Preserve original per-segment encounter groups, with 2-segment courses split
 // into separate waves and 3/4-segment courses compacted for the 2D battle UI.
 const midpoint=route.segments.length<=2?1:2
 const early=route.segments.slice(0,midpoint).flatMap(s=>s.map(group=>({species:pick(group,rng),level})))
 const middle=route.segments.slice(midpoint).flatMap(s=>s.map(group=>({species:pick(group,rng),level})))
 const final=[{species:pick(route.boss,rng),level,boss:true}]
 return [early,middle,final]
}
