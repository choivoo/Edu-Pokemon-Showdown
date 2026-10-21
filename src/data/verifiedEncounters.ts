/**
 * Verified encounter samples from Serebii Pokémon Quest location listings.
 * Format is each segment's weighted species groups, not one global area pool.
 * Only accurately sourced routes are listed; others continue using procedural
 * waves and are NOT claimed to be exact original wave tables.
 * Source: serebii.net/quest/location/{firststeppe,gloomygrove,backforthbrook,parchedpeak,bellybuttoncave,pincushionplain}.shtml
 */
import type { Rng } from '../types'
import type { WaveEnemy } from '../lib/stages'
type Choice = {id:number; weight:number}
type Group = readonly Choice[]
type Segment = readonly Group[]
interface Encounter { segments: readonly Segment[]; boss:Group; bossExtra?:readonly Group[]; noBoss?: boolean }
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

 '8-0': {
  segments:[
   [g(129),w([79,95],[129,5])],
   [w([118,50],[98,50]),g(79)],
   [g(79),w([118,50],[98,50])],
   [g(79),w([98,50],[118,50])],
  ], boss:g(80),
 },
 '8-1':{
  segments:[
   [w([72,77.78],[118,11.11],[98,11.11])],
   [w([60,86.67],[140,3.33],[129,10]),g(60),g(72)],
   [g(72)],
   [g(72)],
  ],boss:g(73),
 },
 '8-2':{
  segments:[
   [w([54,70],[72,20],[129,10]),g(60),g(54)],
   [w([61,96.67],[138,3.33]),g(61),g(54)],
   [g(54)],
  ],boss:g(55),
 },
 '8-3':{
  segments:[
   [w([79,18.18],[90,63.64],[98,9.09],[118,9.09]),g(90)],
   [w([79,90],[7,5],[134,5]),g(80),g(90),g(79)],
   [w([80,90],[7,5],[134,5]),g(90)],
  ],boss:g(91),
 },
 '8-4':{
  segments:[
   [w([129,2.5],[79,25],[60,72.5]),g(60),w([98,50],[118,50])],
   [w([55,63.33],[147,3.33],[61,33.34]),w([61,85],[55,15]),w([54,93.33],[61,6.67]),g(60)],
   [g(60),g(61)],
   [g(61)],
  ],boss:g(62),
 },

 '9-0': {segments:[
  [g(23),g(66)],
  [w([66,95],[39,2.5],[35,2.5]),g(66),g(66)],
  [g(66),g(66)],
  [g(66)],
 ],boss:g(67)},
 '9-1': {segments:[
  [g(58),w([100,86.67],[136,10],[126,3.33]),g(37)],
  [g(37),g(77),g(37)],
  [g(37),g(37)],
  [g(37),g(37)],
 ],boss:g(38)},
 '9-2': {segments:[
  [g(77),w([77,95],[23,5])],
  [w([30,50],[33,50]),g(77),g(77)],
  [g(77),g(77)],
 ],boss:g(78)},
 '9-3': {segments:[
  [w([58,93.33],[66,6.67]),g(58),g(56)],
  [w([78,75],[35,12.5],[39,12.5]),g(58),g(78),g(56)],
  [g(58),g(56)],
  [g(58),g(56)],
 ],boss:g(59)},
 '9-4': {segments:[
  [g(66),g(56),g(67)],
  [g(66),g(67),g(66),w([100,50],[67,50]),g(56)],
  [w([57,95],[113,5]),g(66)],
 ],boss:g(68)},


 '10-0':{segments:[
  [w([41,25],[74,75]),g(41),g(74)],
  [w([92,80],[66,20]),g(92),g(74)],
  [g(19),g(74)],
  [g(20)],
 ],boss:g(20),noBoss:true},
 '10-1':{segments:[
  [w([27,46.67],[41,36.67],[19,16.66]),g(27),g(41)],
  [w([75,70],[20,30]),g(41),g(28),g(41)],
  [g(41),g(41)],
  [g(41),g(41)],
 ],boss:g(42),bossExtra:[g(41)]},
 '10-2':{segments:[
  [g(50),g(81)],
  [g(75),w([50,50],[27,50]),g(81)],
  [g(81),w([100,96.67],[135,3.33]),w([50,50],[27,50])],
 ],boss:g(95)},
 '10-3':{segments:[
  [g(104),w([129,3.33],[54,30],[41,13.34],[104,53.33]),g(55)],
  [w([28,50],[55,50]),g(104),g(54)],
  [g(54),g(104)],
  [g(54)],
 ],boss:g(105),bossExtra:[g(105),g(105)]},
 '10-4':{segments:[
  [g(74),g(28),g(50)],
  [g(75),g(105),g(50),g(75)],
  [g(74),w([51,95],[113,5])],
  [g(74)],
 ],boss:g(76)},


 '11-0':{segments:[
  [w([96,90],[4,10]),g(52),g(52)],
  [w([63,75],[5,17.5],[6,2.5],[113,5]),w([20,90],[17,10]),g(52)],
 ],boss:g(53)},
 '11-1':{segments:[
  [w([84,10],[77,10],[16,80]),g(22)],
  [w([78,22.22],[17,77.78]),g(17),g(16),g(21)],
  [g(21),g(16)],
  [g(21),g(16)],
 ],boss:g(18)},
 '11-2':{segments:[
  [w([52,17.5],[96,82.5]),g(64)],
  [w([103,32.86],[128,5.71],[64,61.43]),g(63),g(96),w([102,75],[64,25])],
  [g(63),g(96)],
  [g(63),g(96)],
 ],boss:g(97)},
 '11-3':{segments:[
  [w([63,20],[96,70],[102,10]),g(102)],
  [w([64,13.33],[103,6.67],[53,80]),w([97,50],[64,50]),g(102)],
  [g(102),w([97,50],[64,50])],
  [w([103,96.67],[83,3.33])],
 ],boss:g(122)},
 '11-4':{segments:[
  [w([63,35],[56,20],[52,20],[84,25]),w([64,55],[97,42.5],[113,2.5]),g(63)],
  [w([64,50],[57,25],[53,25]),g(63),g(64),g(63)],
  [g(64),g(63),g(63)],
  [g(64),g(63),g(63)],
 ],boss:w([65,96.67],[143,3.33])},

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
 const final=route.noBoss
    ? [] : [{species:pick(route.boss,rng),level,boss:true},...((route.bossExtra??[]).map((set,i)=>({species:pick(set,rng),level,elite:i<3})))]
 return route.noBoss ? [early,middle] : [early,middle,final]
}
