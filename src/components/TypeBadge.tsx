import type { PokemonType } from '../types'
import { TYPE_COLOR, TYPE_LABEL } from '../lib/typeChart'

export default function TypeBadge({ type }: { type: PokemonType }) {
  return (
    <span className="rounded-md px-2 py-0.5 text-sm font-bold text-white" style={{ background: TYPE_COLOR[type], textShadow: '1px 1px 0 #0006' }}>
      {TYPE_LABEL[type]}
    </span>
  )
}
