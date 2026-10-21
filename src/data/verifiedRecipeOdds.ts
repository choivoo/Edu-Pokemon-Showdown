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
