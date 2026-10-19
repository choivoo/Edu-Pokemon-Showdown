# 포켓몬 퀴즈 배틀 (비공식 팬게임)

문제를 맞혀야 기술을 쓸 수 있는 교육용 턴제 배틀 웹 게임입니다. 비상업적 개인/교실용 팬게임입니다.

> **고지:** 이 프로젝트는 비공식 팬게임이며, 포켓몬(Pokémon)은 Nintendo / Game Freak / The Pokémon Company의 상표입니다.
> 포켓몬 이미지는 레포에 저장하지 않고 [PokeAPI/sprites](https://github.com/PokeAPI/sprites)에서 런타임에 불러옵니다.

## 실행 방법

```bash
npm install
npm run dev        # 개발 서버
npm test           # Vitest (데미지·타입 상성·수학 문제 생성기·AI)
npm run build      # 프로덕션 빌드 (dist/)
```

모바일 세로 화면(380px) 기준 반응형입니다.

## 배포 (GitHub Pages)

`main` 브랜치에 push 하면 `.github/workflows/deploy.yml` 이 테스트 → 빌드 → 배포를 수행합니다.
레포 **Settings → Pages → Source** 를 **GitHub Actions** 로 설정하세요. (`vite.config.ts` 의 `base: './'` 로 하위 경로에서도 동작)

## 게임 방법 (1단계: 싱글 배틀)

1. 닉네임/아바타를 정하고 포켓몬 3마리로 팀을 만듭니다.
2. 기술을 고르면 그 기술 난이도의 문제가 나옵니다. (쉬움 12초 / 보통 15초 / 어려움 20초)
3. **정답** → 기술 발동 (빨리 맞힐수록 급소 확률 증가) · **오답/시간초과** → 기술 실패, 상대 턴
4. 3연속 정답이면 필살기 게이지가 차서 문제 없이 강력한 필살기를 쓸 수 있습니다.
5. 승패와 정답률에 따라 경험치/코인을 얻고 `localStorage` 에 저장됩니다.

데미지: `((2*레벨/5+2) * 위력 * 공격/방어 / 50 + 2) * 상성 * 랜덤(0.85~1)` (급소 1.5배)

## 문제 추가 방법

`src/data/questions/{math,korean,english,science}.json` 에 아래 형식으로 추가합니다.

```json
{
  "id": "math-n4",
  "subject": "math",
  "difficulty": "normal",
  "type": "choice",
  "question": "7 × 8 = ?",
  "choices": ["54", "56", "58", "64"],
  "answer": "56",
  "explanation": "7 × 8 = 56"
}
```

- `difficulty`: `easy` | `normal` | `hard`
- `type`: `choice`(4지선다, `answer` 는 보기 텍스트) / `ox`(`answer` 는 `"O"` 또는 `"X"`) / `number`(숫자 직접 입력, `answer` 는 숫자 문자열)
- 수학은 `src/lib/mathGenerator.ts` 가 난이도별로 자동 생성합니다. (출제 비율 70%)
- 오답일 때 `explanation` 이 표시됩니다.

## 구조

```
src/
  components/  BattleScene, QuestionPanel, HpBar, PokemonCard, MoveButton, TypeBadge
  pages/       Title, Profile, TeamSelect, Battle, Result, TeacherDashboard(자리표시)
  lib/         damage, typeChart, ai, mathGenerator, questions, sound(Web Audio), storage, pokedex
  data/        pokemon.json, moves.json, sprites.ts(스프라이트 URL 단일 관리), questions/
  store/       gameStore.ts (Zustand)
```

## 로드맵

- [x] 1단계: 싱글 배틀
- [ ] 2단계: 서바이벌, 상태이상, 교체, 코인 해금, 과목 추가 UI, 문제 관리 화면
- [ ] 3단계: 클래스 모드(실시간 멀티플레이) + 선생님 대시보드
