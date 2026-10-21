/**
 * Original Quest's P Charms have nine slots with Mighty-only, Sturdy-only,
 * or unrestricted sockets. These are game-play socket types, not images.
 * Existing Fan Edition saves without socket information remain unrestricted.
 */
import { questStats } from '../data/questSpecies'
import type { StoneKind } from './stones'
export type SocketKind = 'hp' | 'atk' | 'any'
export const SOCKET_LABEL: Record<SocketKind,string> = { hp:'체력석 전용',atk:'공격석 전용',any:'공용' }
export const P_CHARM_SOCKETS = 9
export function socketLayout(species: number, rollSeed = species): SocketKind[] {
  const sp = questStats(species)
  const ratio = sp ? sp.hp / Math.max(1, sp.hp + sp.atk) : 0.5
  const hp = Math.max(2, Math.min(6, Math.round(ratio * 9)))
  const atk = 8 - hp
  const kinds: SocketKind[] = [...Array(hp).fill('hp'), ...Array(atk).fill('atk'), 'any'] as SocketKind[]
  // Keep the arrangement stable for each species without random changes on reload.
  return kinds.map((_,i)=>kinds[(i*5+rollSeed%9)%9])
}
export function acceptsSocket(layout: readonly SocketKind[]|undefined,x:number,y:number,kind: StoneKind): boolean {
  if (!layout) return true // all legacy multi-shape saves continue to load and function
  const socket = layout[y*3+x] ?? 'any'
  return socket==='any'||kind===socket
}
