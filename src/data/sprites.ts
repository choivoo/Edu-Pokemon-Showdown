/**
 * Use PokeAPI's pixel sprites as the default Pokémon art in every screen.
 * 2D Canvas cube art remains a graceful offline/network fallback (no 3D).
 * The URLs point to the PokeAPI/sprites public image repository, NOT a
 * per-frame call to the rate-limited PokeAPI JSON service.
 * Pokémon sprite artwork remains copyrighted by its respective owners.
 */
import { cubeFrontSprite, cubeBackSprite } from '../art/cubePokemon'

export const POKEAPI_SPRITE_ROOT =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'

export type SpriteView = 'front' | 'back'
export function pokeapiSprite(id: number, view: SpriteView = 'front'): string {
  if (!Number.isSafeInteger(id) || id < 1 || id > 1025) {
    throw new RangeError('invalid Pokédex ID')
  }
  // Official Black/White static pixel sprites cover all of the first 151.
  if (id <= 649) {
    return POKEAPI_SPRITE_ROOT + '/versions/generation-v/black-white/' +
      (view === 'back' ? 'back/' : '') + id + '.png'
  }
  // Future fan expansions still get official API-hosted 2D defaults.
  return POKEAPI_SPRITE_ROOT + '/' + (view === 'back' ? 'back/' : '') + id + '.png'
}
export const frontSprite = (id: number): string => pokeapiSprite(id, 'front')
export const backSprite = (id: number): string => pokeapiSprite(id, 'back')
export const fallbackFrontSprite = cubeFrontSprite
export const fallbackBackSprite = cubeBackSprite

/** React <img> can reuse this handler without retrying a dead PokeAPI URL. */
export function fallbackSpriteOnError(img: HTMLImageElement, id: number, view: SpriteView = 'front'): void {
  img.onerror = null
  const fallback = view === 'back' ? fallbackBackSprite : fallbackFrontSprite
  img.src = fallback(id)
}
