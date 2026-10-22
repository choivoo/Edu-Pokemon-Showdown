/** Progressive encounter tuning for the 1.0 official 2D fan edition.
 * Stage 1-1 remains completable by a solo starter, but normal enemies
 * must survive multiple basic attacks and elites should feel substantial.
 * Player stone upgrades continue to matter across later areas.
 */
import { ORIGINAL_FIRST } from './originalCampaign'
import type { Stage } from './stages'
export interface EncounterBalance {
  hp:number; attack:number; defense:number; allyHeal:number; bossHp:number
  /** Optional maximum percentage of enemy maximum HP removed by ONE impact.
   * Restricts one-shot attacks ONLY in first-original-world expeditions.
   * Later content and all enemy-to-player damage stay unchanged.
   */
  earlyEnemyHitCap?: { normal:number; elite:number; boss:number }
}

/** A single beginner hit should feel powerful but not instantly erase the
 * enemies, especially strong-looking Pokémon in the final encounter.
 * Basic attacks have a slightly lower ceiling than named Quest techniques.
 * Damage taken by the player's Pokémon is never capped by this function.
 */
export function capFirstWorldHit(rawDamage:number, targetMaxHp:number,
  cap:EncounterBalance['earlyEnemyHitCap'], target:'normal'|'elite'|'boss', isSpecial:boolean):number {
  const raw=Math.max(0,Math.round(rawDamage))
  if (!cap || !Number.isFinite(targetMaxHp) || targetMaxHp<=0) return raw
  const share=cap[target] * (isSpecial?1:0.85)
  return Math.min(raw,Math.max(1,Math.floor(targetMaxHp*share)))
}
export function encounterBalance(stage: Pick<Stage,'area'|'index'>, partySize = 3):EncounterBalance {
  const solo=partySize<=1
  const duo=partySize===2
  if(stage.area===ORIGINAL_FIRST){
    const i=Math.max(0,Math.min(stage.index,4))
    // Former 0.31 × 0.65 health made the first enemies die to a single
    // unupgraded basic move. The new band is deliberately near neutral HP.
    const hp=[1.07,1.11,1.13,1.21,1.27][i]
    const attack=[0.58,0.62,0.66,0.75,0.84][i]
    const defense=[1.02,1.05,1.04,1.10,1.13][i]
    return {
      // 1-1 to 1-4: regular foes withstand at least two ordinary hits;
      // elite finales and the region boss last several well-aimed impacts.
      earlyEnemyHitCap: { normal:0.58, elite:0.39, boss:0.30 },
      hp:hp*(solo?0.83:duo?0.93:1),
      attack:attack*(solo?(i===0?0.61:i===1?0.70:0.74):duo?0.87:1),
      defense:defense*(solo?0.96:duo?0.99:1.02),
      allyHeal:(i<2?0.16:i===2?0.19:0.12)+(solo?0.12:duo?0.035:0),
      // A boss's multiplier is applied on top of the large innate boss HP.
      bossHp:(i<2?0.94:i===2?0.84:1.05)*(solo?(i===0?0.76:0.88):duo?0.96:1),
    }
  }
  if(stage.area===ORIGINAL_FIRST+1||stage.area===ORIGINAL_FIRST+2){
    return {
      hp:solo?0.94:duo?1.03:1.13,
      attack:solo?0.71:duo?0.84:0.95,
      defense:solo?0.98:duo?1.04:1.10,
      allyHeal:solo?0.16:duo?0.11:0.075,
      bossHp:solo?0.94:duo?1.03:1.10,
    }
  }
  return {hp:1.06,attack:1.00,defense:1.02,allyHeal:0.08,bossHp:1.08}
}
