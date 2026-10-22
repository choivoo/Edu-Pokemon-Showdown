# Pokémon Quest Fan Edition 1.0 Official — 실제 출시·음악 재생 상태

**현재 저장소:** https://github.com/choivoo/PQFE-Pokemon-Quest-fan.Edition-  
**게임:** https://choivoo.github.io/PQFE-Pokemon-Quest-fan.Edition-/  
**출시:** https://github.com/choivoo/PQFE-Pokemon-Quest-fan.Edition-/releases/tag/v1.0.0-official

## 공개 음원은 이미 업로드되어 있습니다

사용자가 제공하고 공개 사용 허가를 받았다고 밝힌 **75분 24초 MP3**가 `v1.0.0-official` GitHub 릴리스에 `quest-licensed-soundtrack.mp3`라는 이름으로 약 **36MB 크기**로 등록되어 있습니다. 각 기기에서 사용자가 따로 MP3를 선택할 필요가 없으며, 게임은 동일한 공개 릴리스 URL을 브라우저 HTMLAudioElement로 직접 스트리밍합니다.

`src/lib/licensedSoundtrack.ts`는 **변경된 저장소명**을 사용합니다. `src/lib/officialCues.ts`에서 지정된 **27개 연속 트랙 구간**을 해당 단일 MP3에서 탐색하고, 구간 종료 시 해당 부분을 반복 재생합니다. 별도 `public/soundtrack/` 폴더나 27개 MP3 업로드는 필요하지 않습니다.

장면 자동 매칭: 시작(Title), 입항(Intro), 첫 두 탐험(Tutorial), 탐험 결과(Expedition Results), 캠프(Base Camp), 지도(Expeditions), 1~10지역, 중·후반 보스전, 뮤츠, 스태프롤, 기이한 섬 5종 환경. 효과음과 강적 퇴장 팡파르는 별도 게임 오디오 합성 경로를 사용합니다.

브라우저의 자동 재생 차단으로 **첫 터치·클릭 또는 키 입력 이후에 재생이 시작**될 수 있습니다. 사용자가 음소거한 경우 음악도 음소거됩니다. 릴리스 음원이 응답하지 않거나 디코딩에 실패하면 기본 창작 2D 게임 신시사이저 BGM으로 자동 전환합니다.

## 1.0 배포 및 보존

`.github/workflows/official-1-0-release.yml`은 현재 저장소명으로 검증을 통과한 `main` 커밋마다 Official 웹 ZIP을 새로 만들고 릴리스에 **덮어쓰기**합니다. 음원 자산은 삭제하거나 덮어쓰지 않고 그대로 유지합니다. Pages 워크플로도 `main`으로부터 게임을 빌드합니다. npm 패키지 버전은 `1.0.0`을 유지합니다.

기존 포켓몬·빙고·재료·석상·스테이지 진행은 보존합니다. 게임 내 계정 초기화는 사용자 확인 문구 입력을 요구하는 별도 기능이며, 배포·업데이트가 자동으로 초기화를 실행하지 않습니다.

**권리 안내:** 사용자는 음원 사용 허가를 받았다고 진술했습니다. 공개 배포 권한의 구체적인 범위 및 권리자 동의를 저장소나 이 문서에서 독립 검증한 것은 아닙니다. 'Official'은 이 팬게임 버전명일 뿐 Pokémon 권리자의 승인·제휴를 뜻하지 않습니다.
