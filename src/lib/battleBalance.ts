/** Progressive 2D Pokémon Quest story tuning.
 * Intro is intentionally forgiving: one untrained starter must be able to
 * finish 1-1, learn the two move buttons, then earn power stones and recruits.
 * Bosses remain visibly large but do not one-shot the player at level five.
 */
import { ORIGINAL_FIRST } from './originalCampaign'
import type { Stage } from './stages'
export interface EncounterBalance { hp:number; attack:number; defense:number; allyHeal:number; bossHp:number }
export function encounterBalance(stage: Pick<Stage,'area'|'index'>, partySize = 3):EncounterBalance {
  if(stage.area===ORIGINAL_FIRST){
    const hp=[0.31,0.42,0.56,0.67,0.78]
    const attack=[0.25,0.34,0.46,0.54,0.68]
    const i=Math.max(0,Math.min(stage.index,4))
    // The starter tutorial must be clearable without farming or cooking.
    // Three-mon parties receive the normal tuned fight; one-mon parties
    // are given fewer effective enemy hit points and lower enemy damage.
    const solo=partySize<=1
    const duo=partySize===2
    const hpMul=solo ? (i<3?0.65:0.78) : duo ? 0.87 : 1
    const atkMul=solo ? (i<3?0.56:0.75) : duo ? 0.83 : 1
    return {
      hp:hp[i]*hpMul,
      attack:attack[i]*atkMul,
      defense:solo ? 0.72 : duo ? 0.82 : 0.88,
      allyHeal:(i<2?0.30:0.20)+(solo?0.20:duo?0.07:0),
      bossHp:(i<3?0.7:0.82)*(solo?0.75:duo?0.90:1),
    }
  }
  if(stage.area===ORIGINAL_FIRST+1||stage.area===ORIGINAL_FIRST+2) {
    const solo=partySize<=1
    return {hp:solo?0.71:0.87,attack:solo?0.64:0.83,defense:solo?0.84:0.95,
      allyHeal:solo?0.24:0.12,bossHp:solo?0.78:0.92}
  }
  return {hp:1,attack:1,defense:1,allyHeal:0.10,bossHp:1}
}
