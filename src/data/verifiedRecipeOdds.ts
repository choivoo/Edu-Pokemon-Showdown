/** Source-grounded cooking recruitment percentage tables (Pokémon Quest).
 * Each "id,id@weight" group encodes a displayed rate. We normalize rounded
 * published values so the total probability is exactly 1 in-game.
 * https://www.serebii.net/quest/recipes/
 * Only confirmed recipe+grade pairs exist in this table. Other pairs MUST
 * remain visibly labelled as estimates rather than falsely claiming parity.
 */
export type OriginalDishGrade='basic'|'good'|'great'|'special'
const raw:Record<number,Partial<Record<OriginalDishGrade,string>>>={
 1:{
  basic:'10,13,16,19,21,27,29,32,37,43,52,54,56,58,60,63,69,72,74,98,100,111,118,120@4.17',
  good:'23,35,39,41,46,50,66,77,79,81,84,86,88,90,95,102,108,109,116,137@4.65;1,4,7,25,48,83,92,96,104,106,107,113,114,115,122,123,124,125,126,127,128,129,131,132,133,138,140,142@0.23',
  great:'1,4,7,23,25,35,39,41,46,48,50,66,77,79,81,83,84,86,88,90,92,95,96,102,104,106,107,108,109,113,114,115,116,122,123,124,125,126,127,128,129,131,132,133,137,138,140,142,143,147@2',
  special:'1,4,7,25,48,83,92,96,104,106,107,113,114,115,122,123,124,125,126,127,128,129,131,132,133,138,140,142,143,147@3.333333',
 },
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

 7:{
  basic:'16,19,21,52@25',
  good:'39,84,108,137@24.53;115@0.61;83@0.55;133@0.43;113,128,132,143@0.07',
  great:'39,84,108,137@18.05;115@9.03;83@8.12;133@6.32;113,128,132,143@1.08',
  special:'115@32.47;83@29.22;133@22.73;113,128,132,143@3.90',
 },
 8:{
  good:'23,41,88,109@24.52;1@0.98;48@0.61;92@0.31',
  great:'23,41,88,109@18.02;1@14.41;48@9.01;92@4.50',
  special:'1@51.61;48@32.26;92@16.13',
 },
 9:{
  basic:'27,74,111@33.333333',
  good:'50,95@48.78;104@2.44',
  great:'50,95,104@33.333333',
  special:'104@100',
 },
 10:{
  good:'46,102@48.78;1@1.95;114@0.49',
  great:'46,102@33.33;1@26.67;114@6.67',
  special:'1@80;114@20',
 },

 11:{
  good:'46@96.43;48@2.41;123,127@0.58',
  great:'46@57.47;48@28.74;123,127@6.90',
  special:'48@67.57;123,127@16.22',
 },
 12:{
  basic:'63@100',
  good:'79,102@48.78;96@1.95;122,124@0.24',
  great:'79,102@33.33;96@26.67;122,124@3.33',
 },
 13:{
  basic:'74,111@50',
  good:'95@97.32;138,140@1.22;142@0.24',
  great:'95@64.52;138,140@16.13;142@3.23',
  special:'138,140@45.45;142@9.09',
 },

 14:{
  good:'41@97.32;84,83@1.22;123@0.24',
  great:'41,84@38.17;83@17.18;123@4.58;142@1.91',
  special:'83@72.58;123@19.35;142@8.06',
 },
 15:{
  basic:'37,58@50',
  good:'77@95.24;4@3.81;126@0.95',
  great:'77@50;4@40;126@10',
  special:'4@80;126@20',
 },
 16:{
  good:'81@95.24;25@3.81;125@0.95',
  great:'81@50;25@40;125@10',
  special:'25@80;125@20',
 },
 17:{
  good:'66@96.15;106,107@1.92',
  great:'66@55.56;106,107@22.22',
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
