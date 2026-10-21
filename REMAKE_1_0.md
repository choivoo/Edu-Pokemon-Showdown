# Pokémon Quest: Fan Edition — 1.0 리메이크 제작 기록

> 비공식·비상업적 팬 프로젝트. Pokémon 관련 명칭과 캐릭터의 권리는 해당 권리자에게 있습니다.
> Game Freak / Nintendo / The Pokémon Company와 무관합니다.

## 핵심 목표
- 기존 React/TypeScript 2D 제작물을 유지하고 가로 전용 960×540 게임 화면 최적화
- 탐험·3마리 자동 전투·보스·요리·도감·파워스톤·특훈·진화·퀘스트·저장 키의 기능 유지
- 한국어 공식 포켓몬 명칭 / 기술명 / 원작 요리 용어 사용
- 관동 도감 151종 + 팬게임 확장 포켓몬 3종
- 별모래섬 장편 46장면 (본편 30, 외전 12, 후일담 4)
- 스토리 최초 클리어 자동 연출, 캠프 → 퀘스트 → 모험일지에서 재감상
- 원곡 음악 12개 루프곡 (기존 6곡, 신규 지역 6곡) + 4종 징글
- 음색 14종 / 퍼커션 8종, 독립 SFX 레이어, 스테레오 패닝·리버브
- 기존 `pokemon-quest-fan-edition:v1` 저장 유지 및 백업 키 이전 호환성

## 플레이 경로
1. 타이틀에서 모험 시작 → 프롤로그 / 스타팅 선택
2. 베이스캠프 → 팀 구성 / 요리 / 퀘스트 / 도감 / 특훈
3. 섬 탐험 → 6개 지역 30개 스테이지 / 클리어 시 스토리
4. 보스 6마리로 오로라 프리즘 복원 → 끝없는 별길
5. 끝없는 별길 특정 층에서 전설 포켓몬 보상 획득
6. 캠프 → 퀘스트 → 모험일지에서 공개된 스토리 다시 보기

## 출처
- 참고 원작 게임: https://www.pokemon.com/us/pokemon-video-games/pokemon-quest
- 게임 내 기술/능력치 참고: 제공된 Pokémon Quest Movesheet.xlsx
- 본 리메이크의 음악과 대사는 원작 음원·대사·악보를 복사하지 않고 직접 작성

## 검수
```sh
npm ci
npm run typecheck
npm test
npm run build
```
배포: GitHub Actions `deploy.yml` → GitHub Pages
