/** Progressive 2D Pokémon Quest story tuning.
 * Intro is intentionally forgiving: one untrained starter must be able to
 * finish 1-1, learn the two move buttons, then earn power stones and recruits.
 * Bosses remain visibly large but do not one-shot the player at level five.
 */
import { ORIGINAL_FIRST } from './originalCampaign'
import type { Stage } from './stages'
export interface EncounterBalance { hp:number; attack:number; defense:number; allyHeal:number; bossHp:number }
export function encounterBalance(stage: Pick<Stage,'area'|'index'>):EncounterBalance {
  if(stage.area===ORIGINAL_FIRST){
    const hp=[0.31,0.42,0.56,0.67,0.78]
    const attack=[0.25,0.34,0.46,0.54,0.68]
    const i=Math.max(0,Math.min(stage.index,4))
    return {hp:hp[i],attack:attack[i],defense:0.88,allyHeal:i<2?0.26:0.16,bossHp:i<3?0.7:0.82}
  }
  if(stage.area===ORIGINAL_FIRST+1||stage.area===ORIGINAL_FIRST+2)
    return {hp:0.87,attack:0.83,defense:0.95,allyHeal:0.12,bossHp:0.92}
  return {hp:1,attack:1,defense:1,allyHeal:0.10,bossHp:1}
}
