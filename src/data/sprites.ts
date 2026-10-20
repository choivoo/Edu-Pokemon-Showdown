// 스프라이트 URL은 이 파일에서만 관리한다. (오리지널 몬스터로 교체할 때 여기만 수정)
// 이미지는 레포에 저장하지 않고 PokeAPI/sprites 저장소에서 런타임에 불러온다.
const BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'

export const frontSprite = (id: number) => `${BASE}/${id}.png`
export const backSprite = (id: number) => `${BASE}/back/${id}.png`
