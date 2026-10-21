/** Source-grounded cooking recruitment percentage tables (Pokémon Quest).
 * Each "id,id@weight" group encodes a displayed rate. We normalize rounded
 * published values so the total probability is exactly 1 in-game.
 * https://www.serebii.net/quest/recipes/
 * Only confirmed recipe+grade pairs exist in this table. Other pairs MUST
 * remain visibly labelled as estimates rather than falsely claiming parity.
 */
export type OriginalDishGrade='basic'|'good'|'great'|'special'
const raw:Record<number,Partial<Record<OriginalDishGrade,string>>>={
 2:{
  basic:'21,37,56,58,98,100,118@14.29',
  good:'46,50,79,84,108,137@16.44;4,83,133@0.27;107,140@0.21;124,126,127@0.05',
  great:'46,50,79,84,108,137@13.04;4,83,133@4.30;107,140@3.26;124,126,127@0.78',
  special:'4,83,133@19.76;107,140@14.97;124,126,127@3.59',
 },

 3:{
  basic:'10,19,32,60,72@20',
  good:'23,66,88,109,116@19.71;7,129@0.49;138@0.25;114,131,132,147@0.06',
  great:'23,66,88,109,116@15.41;7,129@7.70;138@3.85;114,131,132,147@0.92',
  special:'7,129@33.56;138@16.78;114,131,132,147@4.03',
 },
 4:{
  basic:'13,16,27,52,54,63,69,120@12.5',
  good:'77@91.91;1,25,96@1.52;106,115@1.15;123,125,143@0.41',
  great:'77@36.23;1,25,96@11.96;106,115@9.06;123,125,143@3.26',
  special:'1,25,96@18.75;106,115@14.20;123,125,143@5.11',
 },
 5:{
  basic:'29,43,74,111@25',
  good:'35,39,41,81,86,90,95,102@12.36;104@0.62;48@0.31;92,113,122,128,142@0.03',
  great:'35,39,41,81,86,90,95,102,104@10.26;48@5.13;92,113,122,128,142@0.51',
  special:'104@57.14;48@28.57;92,113,122,128,142@2.86',
 },
 6:{
  basic:'54,60,72,98,118,120@16.67',
  good:'79,86,90,116@24.52;7,129@0.49;131,138,140@0.31',
  great:'79,86,90,116@18.02;7,129@7.21;131,138,140@4.50',
 },
 18:{
  good:'144,145,146@33.333333',
  great:'144,145,146@33.333333',
  special:'150@47.62;144,145,146@15.87;151@4.76'
 }
}
export type VerifiedDishMon={id:number; probability:number}
export function verifiedRecipeOdds(recipeNo:number,grade:OriginalDishGrade):readonly VerifiedDishMon[]|undefined{
 const value=raw[recipeNo]?.[grade]
 if(!value)return undefined
 const entries=value.split(';').flatMap(section=>{
   const [ids,percent]=section.split('@'),weight=Number(percent)
   return ids.split(',').map(id=>({id:Number(id),probability:weight}))
 })
 const total=entries.reduce((s,e)=>s+e.probability,0)
 if(!Number.isFinite(total)||total<=0)throw new Error('Invalid verified recipe odds')
 return entries.map(e=>({...e,probability:e.probability/total}))
}
export const VERIFIED_RECIPE_GRADES:Readonly<Record<number,readonly OriginalDishGrade[]>>=
 Object.fromEntries(Object.entries(raw).map(([n,grades])=>[Number(n),Object.keys(grades) as OriginalDishGrade[]]))
