/** Scene-specific offsets from the supplied licensed compilation. All times seconds. */
export const SOUNDTRACK_CUES = {
 title:[0,158],intro:[158,284],tutorial:[284,390],results:[390,438],
 camp:[438,580],expeditions:[580,684],firstSteppe:[684,798],
 boss1:[798,914],storyTalk:[914,943],boss2:[943,1047],
 gloom:[1047,1260],brook:[1260,1483],peak:[1483,1674],
 cave:[1674,1828],plain:[1828,2013],moor:[2013,2199],
 highlands:[2199,2412],nook:[2412,2656],fjord:[2656,2898],
 emergency:[2898,2943],mewtwo:[2943,3133],credits:[3133,3288],
 happenGrass:[3288,3494],happenWater:[3494,3743],
 happenCave:[3743,4059],happenForest:[4059,4239],
 happenMountain:[4239,4524],
} as const
export type TrackCue = keyof typeof SOUNDTRACK_CUES
/** Original game world ordering, not fan sequel array position. */
export const AREA_CUES: readonly TrackCue[] = [
 'firstSteppe','gloom','brook','peak','cave','plain','moor','highlands','nook','fjord',
]
export const REGION_CUES:readonly TrackCue[]=[
 'firstSteppe','gloom','brook','peak','cave','plain',
 'moor','highlands','nook','fjord'
]
export function cueForExpedition(area:number,boss:boolean,stageIndex:number):TrackCue {
 if(area===17){
   const biome=(stageIndex%5)
   return (['happenGrass','happenWater','happenCave','happenForest','happenMountain'] as const)[biome]
 }
 if(boss)return area===16?'mewtwo':stageIndex>=4?'boss2':'boss1'
 return REGION_CUES[Math.max(0,Math.min(REGION_CUES.length-1,area>=6 ? area-6 : area))]??'expeditions'
}
export function cueForScene(screen:string):TrackCue {
 switch(screen){
  case 'title':return 'title'
  case 'intro':return 'intro'
  case 'camp':return 'camp'
  case 'island':return 'expeditions'
  case 'result':return 'results'
  case 'battle':return 'firstSteppe'
  default:return 'storyTalk'
 }
}
