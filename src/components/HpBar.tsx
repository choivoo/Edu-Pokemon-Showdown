interface Props { name: string; level: number; hp: number; maxHp: number; showNumbers?: boolean }

export function hpColor(ratio: number) {
  return ratio > 0.5 ? '#3ddc5a' : ratio > 0.2 ? '#f5d02e' : '#ee3b3b'
}

export default function HpBar({ name, level, hp, maxHp, showNumbers }: Props) {
  const ratio = Math.max(0, hp / maxHp)
  return (
    <div className="pixel-box w-44 px-2 py-1.5 text-[11px]">
      <div className="flex justify-between">
        <span>{name}</span>
        <span>Lv{level}</span>
      </div>
      <div className="mt-1 flex items-center gap-1">
        <span className="font-title text-[8px] text-yellow-300">HP</span>
        <div className="h-2.5 flex-1 border-2 border-black bg-gray-700">
          <div className="hp-fill h-full" style={{ width: `${ratio * 100}%`, background: hpColor(ratio) }} />
        </div>
      </div>
      {showNumbers && <div className="mt-0.5 text-right text-[10px]">{hp} / {maxHp}</div>}
    </div>
  )
}
