import type { PokemonData } from '../types'
import { frontSprite } from '../data/sprites'
import TypeBadge from './TypeBadge'

interface Props { pokemon: PokemonData; selected: boolean; order?: number; onClick: () => void }

export default function PokemonCard({ pokemon, selected, order, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`pixel-btn relative flex flex-col items-center rounded border-4 p-1 ${selected ? 'border-yellow-300 bg-[#44446a]' : 'border-[#555577] bg-[#2b2b45]'}`}
    >
      {selected && (
        <span className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-300 text-[11px] font-bold text-black">{order}</span>
      )}
      <img src={frontSprite(pokemon.id)} alt={pokemon.name} loading="lazy" className="sprite h-16 w-16" />
      <span className="text-[11px]">{pokemon.name}</span>
      <div className="mt-0.5 flex flex-wrap justify-center gap-0.5">
        {pokemon.types.map(t => <TypeBadge key={t} type={t} />)}
      </div>
      <div className="mt-1 text-[9px] text-gray-300">
        HP{pokemon.stats.hp} 공{pokemon.stats.atk} 방{pokemon.stats.def} 속{pokemon.stats.spe}
      </div>
    </button>
  )
}
