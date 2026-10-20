import { iconUrl } from '../art/icons'

/** 코드로 찍은 도트 아이콘 (이모지 대신 사용) */
export default function Icon({ n, s = 24, className = '' }: { n: string; s?: number; className?: string }) {
  return <img src={iconUrl(n)} alt="" draggable={false} className={`sprite inline-block align-middle ${className}`} style={{ width: s, height: s, imageRendering: 'pixelated' }} />
}

/** 별 n개 (희귀도·스톤 등급 표시) */
export function Stars({ n, s = 16 }: { n: number; s?: number }) {
  return <span className="inline-flex align-middle">{Array.from({ length: n }, (_, i) => <Icon key={i} n="star" s={s} />)}</span>
}

/** 희귀도 표시: 1~3은 별, 4(전설)는 반짝이 */
export function RarityMark({ rarity, s = 14 }: { rarity: number; s?: number }) {
  return rarity >= 4 ? <Icon n="sparkle" s={s + 2} /> : <Stars n={rarity} s={s} />
}

/** 코인 아이콘 + 숫자 */
export function Coins({ n, s = 22, className = '' }: { n: number | string; s?: number; className?: string }) {
  return <span className={`inline-flex items-center gap-1 ${className}`}><Icon n="coin" s={s} />{n}</span>
}
