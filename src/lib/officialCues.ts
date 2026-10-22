/** Public licensed soundtrack cue manifest. Timecodes supplied by user.
 * Files must be actual audio assets under public/soundtrack/ at build time.
 * The website falls back to bundled original synthesized music otherwise.
 */
export const OFFICIAL_CUES = [
 ['title','Title','00:00','02:38'],
 ['intro','Intro','02:38','04:44'],
 ['tutorial','Tutorial','04:44','06:30'],
 ['expedition-results','Expedition Results','06:30','07:18'],
 ['base-camp','Base Camp','07:18','09:40'],
 ['expeditions','Expeditions','09:40','11:24'],
 ['first-steppe','First Steppe','11:24','13:18'],
 ['boss-battle-1','Boss Battle 1','13:18','15:14'],
 ['story-talk','Story Talk','15:14','15:43'],
 ['boss-battle-2','Boss Battle 2','15:43','17:27'],
 ['gloomy-grove','Gloomy Grove','17:27','21:00'],
 ['backforth-brook','Backforth Brook','21:00','24:43'],
 ['parched-peak','Parched Peak','24:43','27:54'],
 ['belly-button-cave','Belly Button Cave','27:54','30:28'],
 ['pincushion-plain','Pincushion Plain','30:28','33:42'],
 ['miasma-moor','Miasma Moor','33:42','36:39'],
 ['hushed-highlands','Hushed Highlands','36:39','40:12'],
 ['nightlight-nook','Nightlight Nook','40:12','44:16'],
 ['farside-fjord','Farside Fjord','44:16','48:18'],
 ['story-emergency','Story Emergency','48:18','49:03'],
 ['mewtwo-battle','Mewtwo Battle','49:03','52:13'],
 ['staff-roll','Staff Roll','52:13','54:48'],
 ['happenstance-grassland','Happenstance Island (Grassland)','54:48','58:14'],
 ['happenstance-waterside','Happenstance Island (Waterside)','58:14','1:02:23'],
 ['happenstance-cave','Happenstance Island (Cave)','1:02:23','1:07:39'],
 ['happenstance-forest','Happenstance Island (Forest)','1:07:39','1:10:47'],
 ['happenstance-mountain','Happenstance Island (Mountain)','1:10:47','1:15:24'],
] as const
export type OfficialCue = typeof OFFICIAL_CUES[number][0]
export const CUE_DETAILS: Record<OfficialCue,{label:string;start:string;end:string}> =
  Object.fromEntries(OFFICIAL_CUES.map(([id,label,start,end])=>[id,{label,start,end}])) as Record<OfficialCue,{label:string;start:string;end:string}>
export function cuePath(cue:OfficialCue):string {
 return `${import.meta.env.BASE_URL}soundtrack/${cue}.mp3`
}
export function cueForBattle(area:number,index:number,boss:boolean):OfficialCue {
 if(area===16)return 'mewtwo-battle'
 if(area===17) {
   if(boss&&index===8)return 'mewtwo-battle'
   return ['happenstance-grassland','happenstance-waterside','happenstance-cave','happenstance-forest','happenstance-mountain'][Math.min(4,Math.floor(index/2))] as OfficialCue
 }
 if(boss) return area>=11 ? 'boss-battle-2' : 'boss-battle-1'
 const map: Record<number,OfficialCue>={6:'first-steppe',7:'gloomy-grove',8:'backforth-brook',9:'parched-peak',10:'belly-button-cave',11:'pincushion-plain',12:'miasma-moor',13:'hushed-highlands',14:'nightlight-nook',15:'farside-fjord'}
 return map[area]??'expeditions'
}
export const DEFAULT_SCENE_CUE={title:'title',camp:'base-camp',map:'expeditions',battle:'first-steppe',boss:'boss-battle-1',story:'story-talk',tide:'backforth-brook',grove:'gloomy-grove',echo:'nightlight-nook',spark:'parched-peak',ember:'miasma-moor',astral:'happenstance-grassland'} as const
