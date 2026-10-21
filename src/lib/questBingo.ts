/** Exact nine Bingo candidates per Kanto species supplied in the user's Movesheet.
 * Three independently chosen options per line; evolution reads the new species row.
 * Normalise source-sheet spelling variants before computing passives.
 */
import { questBingoTexts } from '../data/questBingoCorpus'
import type { PokemonType, Rng } from '../types'
export type BingoChoices = [number,number,number]
export const ALL_QUEST_BINGO_SPECIES = 151
export function questBingoOptions(species:number,slot:0|1|2):readonly string[]{
 const data=questBingoTexts(species)
 return data.slice(slot*3,slot*3+3)
}
export function rollQuestBingo(_species:number,rng:Rng=Math.random):BingoChoices {
 return [Math.floor(rng()*3),Math.floor(rng()*3),Math.floor(rng()*3)]
}
export function activeQuestBingo(species:number,choices:readonly number[],completeLines:number):string[]{
 const result:string[]=[]
 for(let i=0;i<Math.min(3,completeLines);i++)result.push(questBingoOptions(species,i as 0|1|2)[choices[i]??0]??'')
 return result
}
export const EMPTY_BINGO_EFFECTS=()=>({
 hpFlat:0,atkFlat:0,atkCd:0,critRate:0,critDmg:0,moveSpd:0,waveHeal:0,
 lifesteal:0,regen:0,koHeal:0,reviveSpeed:0,reviveHp:0,effectResist:0,statusResist:0,
 criticalTaken:0,knockback:0,size:0,
 typeAtk:{} as Record<string,number>, typeWait:{} as Record<string,number>,
 typeDamageResist:{} as Record<string,number>,statusTypeResist:{} as Record<string,number>
})
export type QuestBingoEffects=ReturnType<typeof EMPTY_BINGO_EFFECTS>
const TYPE_NAMES=['normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','steel','fairy'] as const
const keyFor=(text:string):PokemonType|undefined=>TYPE_NAMES.find(t=>new RegExp(t+'[- ]*type','i').test(text))
const add=(o:Record<string,number>,k:string,v:number)=>{o[k]=(o[k]??0)+v}
export function questBingoEffects(species:number,choices:readonly number[],bingos:number):QuestBingoEffects {
 const e=EMPTY_BINGO_EFFECTS()
 for(const raw of activeQuestBingo(species,choices,bingos)){
  const x=raw.replace(/\s+/g,' ').toLowerCase()
  const value=Number(x.match(/[-+]?\s*(\d+(?:\.\d+)?)/)?.[1]??0)
  const pct=value/100
  const type=keyFor(x)
  if(/^(?:atk\s*\+|atk\+|attack\s*\+)/i.test(x))e.atkFlat+=value
  else if(/^hp\s*\+/.test(x))e.hpFlat+=value
  else if(/^(?:atk|attack) of .* type moves|^attack of .* type moves/.test(x)) {if(type)add(e.typeAtk,type,pct)}
  else if(/type moves? wait/.test(x)) {if(type)add(e.typeWait,type,pct)}
  else if(/type damage taken/.test(x)) {if(type)add(e.typeDamageResist,type,pct)}
  else if(/movement speed/.test(x))e.moveSpd+=pct
  else if(/critical hit(?:s)? rate|critical hit rate|critical hit rate/.test(x))e.critRate+=pct
  else if(/critical hit damage|crit hit damage/.test(x))e.critDmg+=pct
  else if(/taking critical hits?/.test(x))e.criticalTaken+=pct
  else if(/healing per wave/.test(x))e.waveHeal+=pct
  else if(/healing from k\.o\./.test(x))e.koHeal+=pct
  else if(/hit healing/.test(x))e.lifesteal+=pct
  else if(/natural hp healing/.test(x))e.regen+=pct
  else if(/hp upon recovery/.test(x))e.reviveHp+=pct
  else if(/time to recover/.test(x))e.reviveSpeed+=pct
  else if(/wait for standard attacks/.test(x))e.atkCd+=pct
  else if(/own knockback distance/.test(x))e.knockback+=pct
  else if(/pokemon size change/.test(x))e.size+=raw.includes('-')?-pct:pct
  else if(/resistan.*status conditions|resistan.*statis conditions/.test(x))e.statusResist+=pct
  else if(/resistan.*effects|resistan.*damage down|resistan.*def/.test(x))e.effectResist+=pct
  else if(/resistan.*poison/.test(x))add(e.statusTypeResist,'poison',pct)
  else if(/resistan.*burn/.test(x))add(e.statusTypeResist,'burn',pct)
  else if(/resistan.*paraly/.test(x))add(e.statusTypeResist,'paralyze',pct)
  else if(/resistan.*frozen/.test(x))add(e.statusTypeResist,'freeze',pct)
  else if(/resistan.*asleep/.test(x))add(e.statusTypeResist,'sleep',pct)
  else if(/resistan.*confused/.test(x))add(e.statusTypeResist,'confuse',pct)
 }
 return e
}
