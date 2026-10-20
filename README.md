# 포켓몬 퀘스트 팬 에디션 (Pokémon Quest: Fan Edition)

베이스캠프에서 **요리로 친구를 불러 모으고**, 3마리 파티로 섬을 **자동 전투로 탐험**하는 도트풍 2D 웹게임입니다.
(원작 *포켓몬 퀘스트* 에서 영감을 받은 비공식 팬 에디션이며, 3D 큐브 대신 도트 스프라이트로 만들었습니다. 스토리는 새로 썼습니다.)

> **고지:** 이 프로젝트는 비공식·비상업 팬게임이며, 포켓몬(Pokémon)은 Nintendo / Game Freak / The Pokémon Company의 상표입니다.
> 포켓몬 이미지는 레포에 저장하지 않고 [PokeAPI/sprites](https://github.com/PokeAPI/sprites) 에서 런타임에 불러옵니다.
> 이미지 URL은 `src/data/sprites.ts` 한 곳에서만 관리하므로 나중에 오리지널 몬스터로 쉽게 바꿀 수 있습니다.

## 줄거리

하늘에서 별이 떨어진 날 그 조각이 모여 만들어졌다는 **별모래섬**. 섬 한가운데 별빛 제단의 **오로라 프리즘**이
폭풍에 여섯 조각으로 깨지자, 빛을 잃은 포켓몬들이 난폭해졌습니다. 미라 박사와 함께 각 지역의 우두머리가 품은
조각을 되찾아 섬을 다시 평화롭게 만드세요.

| 지역 | 우두머리 | 조각 |
|---|---|---|
| 1. 푸른물결 해변 | 성난 갸라도스 | 파도의 조각 |
| 2. 속삭이는 숲 | 숲의 파수꾼 이상해꽃 | 숲의 조각 |
| 3. 달그림자 동굴 | 그림자 속의 팬텀 | 달그림자 조각 |
| 4. 번개 협곡 | 천둥의 쥬피썬더 | 번개 조각 |
| 5. 불꽃 화산 | 불꽃의 군주 리자몽 | 불꽃 조각 |
| 6. 별빛 제단 | 별을 삼킨 망나뇽 | 별빛 조각 |

모두 클리어하면 **끝없는 별길**(무한 탑)이 열리고, 10층을 넘으면 전설의 동료가…?

## 게임 방법

- **탐험(자동 전투):** 파티 3마리가 알아서 기본 공격을 하고, 포켓몬 카드에 ★이 뜨면 **탭해서 필살기**를 씁니다. (자동 필살기 / 배속 ×1·2·3 / 일시정지 지원)
  타입 상성(2배·0.5배·0배), 급소, 범위 필살기(전기·땅·얼음·에스퍼·고스트), 웨이브 사이 소량 회복, 보스 웨이브가 있습니다.
- **베이스캠프 요리:** 재료 3개를 냄비에 넣으면 포켓몬이 찾아옵니다. 가장 많이 넣은 재료의 타입 포켓몬이 오고,
  같은 재료 3개(특선)일수록 희귀한 친구가 올 확률이 올라갑니다.
- **팀:** 파티 편성, 파워스톤(체력/공격/방어/속도/급소) 2칸 장착, 코인으로 즉시 레벨업, 포켓몬 보내주기.
- **상점:** 재료 구매, 같은 스톤 2개를 합쳐 별 등급 올리기.
- **도감:** 45종 수집 현황.
- **성장:** 클리어 보상은 코인·경험치(파티 전원)·재료·파워스톤. 보스는 첫 클리어 시 동료로 합류합니다.
- 진행 데이터는 브라우저 `localStorage` 에 자동 저장됩니다. (타이틀에서 초기화 가능)
- 효과음과 배경음악은 Web Audio API 로 직접 생성합니다. (외부 음원 파일 없음)

## 실행 방법

```bash
npm install
npm run dev        # 개발 서버
npm test           # Vitest (전투 엔진, 타입 상성, 데미지, 요리, 성장 곡선 등)
npm run build      # 프로덕션 빌드 (dist/)
```

모바일 세로 화면 기준 반응형이며 터치 조작을 지원합니다.

## 배포 (GitHub Pages)

`main` 브랜치에 push 하면 `.github/workflows/deploy.yml` 이 테스트 → 빌드 → 배포를 수행합니다.
레포 **Settings → Pages → Source** 를 **GitHub Actions** 로 설정하세요. (`vite.config.ts` 의 `base: './'` 로 하위 경로에서도 동작)

## 구조

```
src/
  engine/   battle.ts(전투 시뮬레이션, 화면과 무관) · render.ts(캔버스 도트 렌더러)
  lib/      stages(지역·스토리·보상) · cooking · stats(레벨/파워스톤) · damage · typeChart · roster · storage · sound
  data/     pokemon.json(45종) · moves.json · sprites.ts
  store/    gameStore.ts (Zustand, 저장 데이터 관리)
  pages/    Title · Intro · Home(탐험/캠프/팀/상점/도감) · Battle · Result
  components/ Dialog · Modal · MonCard · TypeBadge
```

## 새 포켓몬/스토리 추가

- 포켓몬: `src/data/pokemon.json` 에 `{ id(도감 번호), name, types, stats, rarity(1~4), basic, special }` 추가. (기술 id 는 `moves.json`)
- 지역·스토리 대사: `src/lib/stages.ts` 의 `AREAS` / `PROLOGUE`.
- 재료와 끌어들이는 타입: `src/lib/cooking.ts` 의 `INGREDIENTS`.
