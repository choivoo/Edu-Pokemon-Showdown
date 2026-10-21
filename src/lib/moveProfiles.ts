/** Distinct 2D projectile, beam, dash, strike, cone and area skills.
 * Individual attack-family geometry is mapped from the supplied 167 Quest
 * move names; advanced retail frame data is not available and stays a
 * documented approximation.
 */
import type { Move, PokemonType } from '../types'
export type MoveShape = 'strike'|'beam'|'cone'|'burst'|'dash'|'projectile'|'wave'
export interface MoveProfile {
 shape:MoveShape; range:number; radius:number; angle:number; hits:number; windup:number
 status?: 'poison'|'burn'|'paralyze'|'freeze'|'confuse'|'sleep'
}
const STRIKES=/^(Mega Punch|Scratch|Slam|Tackle|Stomp|Fury Swipes|Lick|High Jump Kick|Cross Chop|Rock Smash|Rolling Kick|Ice Punch|Fire Punch|Thunder Punch|Power-Up Punch|Drain Punch|Submission|Dynamic Punch|Metal Claw|Iron Tail|Psycho Cut|Zen Headbutt|Crunch|Night Slash|Sucker Punch|Play Rough|Dragon Claw|Aerial Ace|Drill Peck|Take Down|Extreme Speed|Giga Impact|Flail|Leech Life|Lunge|Megahorn|Vine Whip)$/i
const BEAMS=/^(Hyper Beam|Solar Beam|Ice Beam|Psybeam|Dragon Pulse|Flash Cannon|Psychic|Psystrike|Hydro Pump|Thunderbolt|Thunder Shock|Flamethrower|Thunder)$/i
const BURSTS=/^(Fire Blast|Blizzard|Earthquake|Explosion|Self-Destruct|Lava Plume|Heat Wave|Hurricane|Whirlpool|Surf|Stealth Rock|Spikes|Rock Tomb|Rock Throw|Mud Bomb|Sludge Bomb|Sandstorm|Tri Attack)$/i
const CONES=/^(Gust|Icy Wind|Smog|Ember|Poison Sting|Toxic|String Shot|Stun Spore|Will-O-Wisp|Dazzling Gleam|Acid Armor|Bubble)$/i
const DASHES=/^(Fly|Dig|Bounce|Dragon Rush|Waterfall|Aqua Jet|Flame Wheel|Flare Blitz|Volt Tackle|U-turn)$/i
const MULTI=/^(Fury Swipes|Pin Missile|Bullet Seed|Rock Blast|Comet Punch|Bonemerang|Petal Dance|Fire Spin|Outrage)$/i
const STATES:Record<string,MoveProfile['status']>={
 Toxic:'poison','Poison Powder':'poison','Poison Sting':'poison','Smog':'poison','Sludge Bomb':'poison',
 'Will-O-Wisp':'burn','Fire Blast':'burn',Ember:'burn','Thunder Shock':'paralyze',
 'Thunderbolt':'paralyze',Thunder:'paralyze','Ice Beam':'freeze',Blizzard:'freeze',
 'Confuse Ray':'confuse','Supersonic':'confuse',Spore:'sleep',Hypnosis:'sleep',Sing:'sleep',
}
export function moveProfile(move:Move):MoveProfile {
 if(!move.id.startsWith('quest-'))return {shape:'strike',range:190,radius:140,angle:Math.PI/2,hits:1,windup:.12}
 const name=move.name
 const shape:MoveShape=BEAMS.test(name)?'beam':BURSTS.test(name)?'burst':CONES.test(name)?'cone':DASHES.test(name)?'dash':STRIKES.test(name)?'strike':MULTI.test(name)?'wave':'projectile'
 const hits=MULTI.test(name)?3:1
 const status=STATES[name]
 const config:Record<MoveShape,[number,number,number,number]>={
  strike:[85,48,1.2,.15],beam:[300,42,.12,.18],
  cone:[170,160,.8,.25],burst:[260,148,Math.PI,.38],
  dash:[260,78,.8,.22],projectile:[250,80,1.6,.26],wave:[200,125,1.5,.2]
 }
 const [range,radius,angle,windup]=config[shape]
 return {shape,range,radius,angle,hits,windup,status}
}
export interface V {x:number;y:number}
const norm=(v:V)=>Math.hypot(v.x,v.y)||1
/** Geometry uses target center and radius with normalized forward direction. */
export function moveHits(profile:MoveProfile,from:V,aim:V,to:V,targetRadius=0):boolean{
 const dx=to.x-from.x,dy=to.y-from.y
 const vx=aim.x-from.x,vy=aim.y-from.y
 const d=norm({x:dx,y:dy}),l=norm({x:vx,y:vy})
 const forward=(dx*vx+dy*vy)/l
 const cross=Math.abs(dx*vy-dy*vx)/l
 switch(profile.shape){
  case 'strike': return d<=profile.range+targetRadius && forward>=-targetRadius
  case 'dash': return forward>=-targetRadius && forward<=profile.range+targetRadius && cross<=profile.radius+targetRadius
  case 'beam': return forward>=-targetRadius && forward<=profile.range+targetRadius && cross<=profile.radius+targetRadius
  case 'cone': return d<=profile.range+targetRadius && (dx*vx+dy*vy)/(d*l)>=Math.cos(profile.angle/2)
  case 'burst': return Math.hypot(to.x-aim.x,to.y-aim.y)<=profile.radius+targetRadius
  case 'projectile': return Math.hypot(to.x-aim.x,to.y-aim.y)<=profile.radius+targetRadius
  case 'wave': return Math.hypot(to.x-aim.x,to.y-aim.y)<=profile.radius+targetRadius
 }
}
export const moveAttackType = (move:Move):PokemonType => move.type
