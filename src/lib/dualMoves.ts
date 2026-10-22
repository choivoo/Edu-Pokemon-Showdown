/** Two usable moves from the first expedition, even for older save keys.
 * First slot can retain a player-taught legacy move. The second slot prefers
 * a genuinely different member of the Pokémon Quest move learnset.
 * This is a fan-edition usability choice (not a claim of original slot rolls).
 */
import { questLearnset } from '../data/questSpecies'
import { getSpecies } from './roster'
import type { OwnedMon } from './stats'
export function defaultDualMoves(species:number,first?:string,second?:string):{move:string;move2:string}{
 const pool=questLearnset(species)
 const sp=getSpecies(species)
 // The workbook order is not a power ranking: Pikachu's first entry is
 // Iron Tail (67), while its Electric move Thunder Shock is 173. Prefer a
 // reliable, non-status STAB move on a fresh recruit instead of handicapping
 // particular starters from the very first expedition.
 const offensive=pool.filter(m=>m.power>0)
   .sort((a,b)=>b.power*(sp.types.includes(b.type)?1.25:1)-a.power*(sp.types.includes(a.type)?1.25:1))
 const move=first || offensive[0]?.id || pool[0]?.id || sp.special
 let move2=second || offensive.find(m=>m.id!==move)?.id || pool.find(m=>m.id!==move)?.id || sp.basic
 if(move2===move)move2=sp.basic!==move?sp.basic:sp.special
 return {move,move2}
}
export function ensureDualMoves(mon:OwnedMon):OwnedMon {
 const x=defaultDualMoves(mon.species,mon.move,mon.move2)
 if(mon.move===x.move && mon.move2===x.move2)return mon
 return {...mon,...x}
}
