/**
 * Numeric encounter importer. Source https://www.serebii.net/quest/location/
 * Reproduce stage-specific wave groups, Pokémon species and lottery weights;
 * don't copy artwork, prose, sound, game binaries or other original resources.
 */
import {mkdir,writeFile} from 'node:fs/promises'
import {dirname} from 'node:path'
const paths=[['firststeppe',1,4],['gloomygrove',2,5],['backforthbrook',3,5],['parchedpeak',4,5],['bellybuttoncave',5,5],['pincushionplain',6,5],['miasmamoor',7,6],['hushedhighlands',8,6],['nightlightnook',9,6],['farsidefjord',10,6],['chamberoflegends',11,1],['happenstanceisland',12,9]]
const sleep=n=>new Promise(resolve=>setTimeout(resolve,n))
function plain(html){
 return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<!--[\s\S]*?-->/g,' ').replace(/<[^>]*>/g,' ')
 .replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ')
}
function groups(part) {
 return part.split(/\bSet\s+\d+\b/g).slice(1).map(raw=>{
  const choices=[]
  for(const m of raw.matchAll(/#\s*0*(\d{1,3})\b[\s\S]*?(\d+(?:\.\d+)?)\s*%/g)){
    const id=Number(m[1]),weight=Number(m[2])
    if(id>0&&id<=151&&weight>0&&weight<=100)choices.push({id,weight})
  }
  return choices
 }).filter(g=>g.length)
}
function blocks(text,area,expected){
 if(area===11){const mark=text.search(/Boss\s*\/\s*Strong\b/i);return [{index:0,raw:mark>=0?text.slice(mark):'',label:'11-1'}]}
 const pattern=area===12 ? /\bPossible\s+Level\s+Selection\s*(\d+)\b/g : new RegExp('\\bStage\\s+'+area+'-(\\d+)\\b','g')
 const marks=[...text.matchAll(pattern)]
 if(marks.length<expected)throw Error('Missing labels '+area+': '+marks.length+'/'+expected)
 return marks.slice(0,expected).map((m,i)=>({index:Number(m[1])-1,raw:text.slice(m.index,i+1<marks.length?marks[i+1].index:undefined),label:area+'-'+m[1]}))
}
function parse(block) {
 const [head,boss='']=block.raw.split(/Boss\s*\/\s*Strong\b/i)
 const segments=head.split(/\bSegment\s+\d+\b/g).slice(1).map(groups).filter(g=>g.length)
 const bossSets=groups(boss)
 if(!bossSets.length&&block.label!=='5-1')throw Error('Missing boss for '+block.label+'; sample='+block.raw.slice(-350))
 if(!segments.length&&block.label!=='11-1')throw Error('Missing segments for '+block.label)
 const recommended=Number(head.match(/Recommended Team Strength:\s*([\d,]+)/)?.[1]?.replace(/,/g,'')??0)
 return {segments,bossSets,...(recommended?{recommended}:{}),source:'serebii-location-numerical'}
}
function validate(key,entry) {
 if(entry.segments.length>8||entry.bossSets.length>12)throw Error('Unexpected segments or boss sets '+key)
 for(const group of [...entry.segments.flat(),...entry.bossSets]){
  if(group.length<1||group.length>15)throw Error('Bad group size '+key)
  const total=group.reduce((n,x)=>n+x.weight,0)
  if(!(total>0&&total<=101))throw Error('Bad probability '+key+': '+total)
 }
}
const result={}
for(const [slug,area,count] of paths){
 try {
  const url='https://www.serebii.net/quest/location/'+slug+'.shtml'
  const response=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 (compatible; QuestDataStudy/1.0)','Accept':'text/html'},signal:AbortSignal.timeout(20000)})
  if(!response.ok)throw Error('HTTP '+response.status)
  const html=await response.text()
  if(html.length<4000)throw Error('Incomplete page')
  const text=plain(html)
  const stages=blocks(text,area,count)
  for(const stage of stages) {
   const key=(area+5)+'-'+stage.index
   const data=parse(stage)
   validate(key,data)
   result[key]=data
  }
  console.log('IMPORTED',slug,stages.length)
 }catch(e){console.error('IMPORT_ERROR',slug,String(e))}
 await sleep(1200)
}
const keys=Object.keys(result)
const missing=paths.flatMap(([_,area,n])=>Array.from({length:n},(_,i)=>(area+5)+'-'+i)).filter(k=>!result[k])
console.log('REPORT',JSON.stringify({imported:keys.length,expected:63,missing}))
if(keys.length<45)throw Error('Refusing incomplete data import: only '+keys.length+'/63')
const path='src/data/originalEncounterTable.json'
await mkdir(dirname(path),{recursive:true})
await writeFile(path,JSON.stringify(Object.fromEntries(Object.entries(result).sort(([a],[b])=>a.localeCompare(b,undefined,{numeric:true}))),null,2)+'\n')
console.log('SAVED',path)
