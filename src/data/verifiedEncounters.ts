/**
 * Verified encounter samples from Serebii Pokémon Quest location listings.
 * Format is each segment's weighted species groups, not one global area pool.
 * Only accurately sourced routes are listed; others continue using procedural
 * waves and are NOT claimed to be exact original wave tables.
 * Source: serebii.net/quest/location/firststeppe.shtml and gloomygrove.shtml
 */
import type { Rng } from '../types'
import type { WaveEnemy } from '../lib/stages'
import { EXTRA_STAGE_FIXTURES, type EncounterFixture } from './expandedStageTables'
type Choice = {id:number; weight:number}
type Group = readonly Choice[]
type Segment = readonly Group[]
interface Encounter { segments: readonly Segment[]; boss:Group; bossExtra?:readonly Group[]; estimated?:boolean }
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
 ...EXTRA_STAGE_FIXTURES,
}

// Complete original 63-expedition stage-table coverage. The records marked
// 'modeled' deliberately do not claim sourced retail enemy probabilities.
// The user can replace them with experimentally confirmed encounters later.
const POOLS:Record<number,readonly number[]> = {
  6:[16,19,21,10,13,52,63],7:[43,44,46,48,69,102,103],
  8:[129,79,118,98,72,60,54,90,55,61,62],
  9:[23,66,77,58,56,35,39,30,33,67,78],
  10:[41,74,92,66,27,50,81,104,54,55,75],
  11:[96,63,64,52,84,77,16,21,97,103,102],
  12:[13,14,15,21,48,49,111,112,123,127],
  13:[1,2,43,44,46,47,48,69,70,102,103,109,110,114],
  14:[27,28,29,30,31,32,33,34,35,36,39,40,50,51,74,75,113],
  15:[41,42,92,93,94,63,64,65,100,101,81,82],
  16:[150,94,65,143],
  17:[3,6,9,18,65,68,76,94,103,112,115,127,130,131,143,149],
}
const STAGE_COUNTS:Record<number,number>={6:4,7:5,8:5,9:5,10:5,11:5,12:6,13:6,14:6,15:6,16:1,17:9}
const AREA_BOSS:Record<number,number[]> = {
  6:[52,11,17,20],7:[44,103,70,47,12],8:[80,73,55,91,62],
  9:[67,38,78,59,68],10:[20,42,95,105,76],11:[20,18,97,122,65],
  12:[14,49,15,112,123,127],13:[44,47,49,70,89,123],
  14:[28,33,40,51,30,31],15:[42,93,101,65,94,94],16:[150],
  17:[149,143,115,127,130,144,145,146,150],
}
function modeledEncounter(area:number,index:number):Encounter{
  const pool=POOLS[area]
  const offset=(index*3+area)%pool.length
  const group=(step:number):Group=>[
    {id:pool[(offset+step)%pool.length],weight:65},
    {id:pool[(offset+step+1)%pool.length],weight:28},
    {id:pool[(offset+step+3)%pool.length],weight:7},
  ]
  return {
    estimated:true,
    segments:[
      [group(0),group(2),group(4)],
      [group(1),group(3),group(5),group(6)],
      [group(2),group(4),group(7)],
      [group(5),group(0)],
    ],
    boss:[{id:AREA_BOSS[area][index]??pool[pool.length-1],weight:100}],
  }
}
const ALL_ENCOUNTERS:Record<string,Encounter>={...VERIFIED_ENCOUNTERS}
for(const [key,count] of Object.entries(STAGE_COUNTS)){
  const area=Number(key)
  for(let i=0;i<count;i++){
    const id=`${area}-${i}`
    if(!ALL_ENCOUNTERS[id])ALL_ENCOUNTERS[id]=modeledEncounter(area,i)
  }
}
export const STAGE_ENCOUNTERS:Readonly<Record<string,Encounter>>=ALL_ENCOUNTERS
export const STAGE_SOURCE_COUNT=Object.values(ALL_ENCOUNTERS).filter(x=>!x.estimated).length
export const STAGE_MODELED_COUNT=Object.values(ALL_ENCOUNTERS).filter(x=>x.estimated).length
export const sourceConfidence=(area:number,index:number):'reference'|'modeled'=>
  ALL_ENCOUNTERS[`${area}-${index}`]?.estimated?'modeled':'reference'

function pick(group:Group,rng:Rng):number{
 let total=group.reduce((n,e)=>n+e.weight,0),r=rng()*total
 for(const e of group){r-=e.weight;if(r<0)return e.id}
 return group[group.length-1].id
}
/** The 2D engine uses three encounter waves; retain segments as wave groups. */
export function verifiedWaves(area:number,index:number,level:number,rng:Rng):WaveEnemy[][]|undefined{
 const route=STAGE_ENCOUNTERS[`${area}-${index}`]
 if(!route)return undefined
 // Preserve original per-segment encounter groups, with 2-segment courses split
 // into separate waves and 3/4-segment courses compacted for the 2D battle UI.
 const midpoint=route.segments.length<=2?1:2
 const early=route.segments.slice(0,midpoint).flatMap(s=>s.map(group=>({species:pick(group,rng),level})))
 const middle=route.segments.slice(midpoint).flatMap(s=>s.map(group=>({species:pick(group,rng),level})))
 const final=[{species:pick(route.boss,rng),level,boss:true},...(route.bossExtra??[]).map(group=>({species:pick(group,rng),level,boss:false}))]
 return [early,middle,final]
}
