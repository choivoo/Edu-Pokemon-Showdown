# 포켓몬 퀴즈 배틀 (비공식 팬게임)

문제를 맞혀야 기술을 쓸 수 있는 교육용 턴제 배틀 웹 게임입니다. 비상업적 개인/교실용 팬게임입니다.

> **고지:** 이 프로젝트는 비공식 팬게임이며, 포켓몬(Pokémon)은 Nintendo / Game Freak / The Pokémon Company의 상표입니다.
> 포켓몬 이미지는 레포에 저장하지 않고 [PokeAPI/sprites](https://github.com/PokeAPI/sprites)에서 런타임에 불러옵니다.

## 실행 방법

```bash
npm install
npm run dev        # 개발 서버
npm test           # Vitest (데미지·타입 상성·수학 생성기·AI·상태이상·문제 파서·클래스 판정)
npm run build      # 프로덕션 빌드 (dist/)
```

모바일 세로 화면(380px) 기준 반응형입니다.

## 배포 (GitHub Pages)

`main` 브랜치에 push 하면 `.github/workflows/deploy.yml` 이 테스트 → 빌드 → 배포를 수행합니다.
레포 **Settings → Pages → Source** 를 **GitHub Actions** 로 설정하세요. (`vite.config.ts` 의 `base: './'` 로 하위 경로에서도 동작)

## 게임 모드

- **싱글 배틀**: 3마리 팀으로 AI 트레이너와 대결.
- **서바이벌**: 야생 포켓몬이 계속 등장(2마리마다 레벨 +2, 쓰러뜨릴 때마다 현재 포켓몬 HP 25% 회복). 팀이 전멸하면 끝, 격파 수 최고 기록이 저장됩니다.
- **클래스 모드**: 선생님이 방을 만들고 학생이 4자리 코드로 입장 → 2명씩 짝지어 같은 문제를 동시에 풉니다. 정답자만 공격하고, 더 빨리 맞힌 쪽이 먼저 공격합니다. 정답 속도/정확도/KO로 점수를 매기고 실시간 순위를 보여줍니다. (홀수 인원은 AI 트레이너와 대결)

## 게임 방법

1. 기술을 고르면 그 기술 난이도의 문제가 나옵니다. (쉬움 12초 / 보통 15초 / 어려움 20초)
2. **정답** → 기술 발동 (빨리 맞힐수록 급소 확률 증가) · **오답/시간초과** → 기술 실패, 상대 턴, 해설 표시
3. 3연속 정답이면 필살기 게이지가 차서 문제 없이 강력한 필살기를 쓸 수 있습니다.
4. **상태이상**: 독/전기/불꽃 기술이 30% 확률로 독·마비·화상을 겁니다. 독·화상은 턴마다 최대 HP 1/8, 화상은 공격 절반, 마비는 속도 절반+25% 행동불가.
5. **교체**: 교체 버튼으로 턴을 쓰고 다른 포켓몬으로 바꿉니다.
6. **성장**: 정답마다 코인/경험치. 🔒 포켓몬은 코인으로 해금(종족값 총합/4 코인). 트레이너 레벨이 오르면 포켓몬 스탯이 +2%씩(최대 +30%) 상승. 진행 데이터는 `localStorage` 저장.

데미지: `((2*레벨/5+2) * 위력 * 공격/방어 / 50 + 2) * 상성 * 랜덤(0.85~1)` (급소 1.5배)

## 선생님 기능

### 문제 관리 (타이틀 → 문제 관리)
JSON 붙여넣기 또는 CSV/JSON 파일 업로드. 이 브라우저의 `localStorage` 에 저장되어 모든 모드에서 출제됩니다.
CSV 헤더: `subject,difficulty,type,question,choices,answer,explanation` (보기는 `|` 로 구분)

```csv
subject,difficulty,type,question,choices,answer,explanation
math,normal,choice,"3, 4 중 큰 수?",3|4,4,4가 더 커요
```

### 클래스 모드 설정 (Firebase)
Firebase 설정이 없으면 **로컬 데모 모드**(같은 브라우저의 다른 탭끼리)로 동작합니다. 교실의 여러 기기에서 쓰려면:

1. [Firebase 콘솔](https://console.firebase.google.com)에서 프로젝트 → **Realtime Database** 생성 (+ 웹 앱 등록).
2. `.env.example` 을 `.env.local` 로 복사해 값을 채웁니다. (`npm run dev` 로 확인)
3. 배포 시에는 레포 **Settings → Secrets and variables → Actions → Variables** 에 같은 이름(`VITE_FIREBASE_*`)으로 등록하면 워크플로가 빌드에 주입합니다.
4. 데이터베이스 규칙은 `database.rules.json` 을 참고하세요. **주의:** 이 규칙은 인증 없이 누구나 읽고 쓸 수 있는 교실용 최소 규칙입니다. 정답은 선생님 화면에서만 판정되고 학생에게는 전송되지 않지만, 공개 서비스로 운영하려면 인증/규칙 강화가 필요합니다.

선생님 화면(판정 담당)을 새로고침하면 진행 중이던 문제 정보가 사라지므로 수업 중에는 유지해 주세요.

## 문제 추가 방법 (코드에 직접)

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
  pages/       Title, Profile, TeamSelect, Battle, Result, QuestionAdmin, ClassJoin, ClassPlay, TeacherDashboard
  lib/         damage, typeChart, ai, status, progression, mathGenerator, questions, customQuestions,
               classBattle, classRoom, backend(Firebase/로컬), sound(Web Audio), storage, pokedex
  data/        pokemon.json, moves.json, sprites.ts(스프라이트 URL 단일 관리), questions/
  store/       gameStore.ts (Zustand)
```

## 로드맵

- [x] 1단계: 싱글 배틀
- [x] 2단계: 서바이벌, 상태이상, 교체, 코인 해금, 과목 선택, 문제 관리
- [x] 3단계: 클래스 모드(실시간 멀티플레이) + 선생님 대시보드
