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
 const move=first || pool[0]?.id || sp.special
 let move2=second || pool.find(m=>m.id!==move)?.id || sp.basic
 if(move2===move)move2=sp.basic!==move?sp.basic:sp.special
 return {move,move2}
}
export function ensureDualMoves(mon:OwnedMon):OwnedMon {
 const x=defaultDualMoves(mon.species,mon.move,mon.move2)
 if(mon.move===x.move && mon.move2===x.move2)return mon
 return {...mon,...x}
}
