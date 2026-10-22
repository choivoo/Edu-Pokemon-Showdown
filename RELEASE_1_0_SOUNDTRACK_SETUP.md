# Fan Edition 1.0 · 모든 기기에서 장면별 음원 재생

## 1.0 웹게임 음원 게시 상태
- **게임 코드:** 웹사이트에서 27개 장면을 자동 인식해 1개 MP3의 지정 타임코드만 반복 재생하도록 구현.
- **원본:** 사용자가 첨부한 `Pokémon Quest Complete Soundtrack w_Timecodes - (320 Kbps) (1).mp3` (75분 24초).
- **배포용 변환:** 같은 녹음의 길이/타임코드를 유지하는 모바일용 64 kbps, 32 kHz 스테레오 MP3 약 35 MB.
- **음원 업로드:** **해당 MP3의 GitHub 릴리스 자산 등록은 별도 필요.** GitHub에 MP3가 없으면 기존 직접 작곡한 BGM이 재생됨.
- **오디오 저작권:** 업로더의 공개·재배포 허가 진술에 의존. 이 리포지토리는 포켓몬의 공식 퍼블리셔 또는 음원 권리자의 인증·승인을 표시하지 않음.

## 한 번만 등록하면 전 기기 자동 활성화 (웹게임 수정 불필요)
1. 배포용 파일 **`quest-licensed-soundtrack.mp3`** 를 준비한다.
2. 리포지토리의 [이미 공개된 1.0.0 릴리스](https://github.com/choivoo/Pokemon-Quest-fan.Edition/releases/tag/v1.0.0-official)에서 **Edit release**를 누른다.
3. **Attach binaries / Assets** 영역에 파일을 넣고 **Update release**로 저장한다. 파일 이름은 반드시 **`quest-licensed-soundtrack.mp3`**.
4. 브라우저에서 **https://choivoo.github.io/Pokemon-Quest-fan.Edition/** 을 열어 재생 버튼을 처음 눌러준다. 인터넷에 연결된 PC/Android/iOS 브라우저에서 동일한 공개 음원을 스트리밍한다. 기기별 MP3 선택 불필요.

실제 릴리스 파일 주소:
`https://github.com/choivoo/Pokemon-Quest-fan.Edition/releases/download/v1.0.0-official/quest-licensed-soundtrack.mp3`

## 작동 방식
- 게임은 Audio HTMLMediaElement를 직접 재생한다. GitHub 파일 제공 도메인에서 CORS 헤더가 없더라도 오디오는 재생 가능하게 구성. Web Audio API에는 연결하지 않는다.
- 전체 27개 장면의 시작과 종료 시각은 `src/lib/officialCues.ts`에서 관리하고 `src/lib/licensedSoundtrack.ts`가 장면별 자동 탐색/반복을 수행.
- 표준 자동재생 차단 정책상 첫 **터치 또는 키 입력**이 필요할 수 있다. 권한이 열리면 다음 장면부터 자동 전환한다.
- 음원 파일이 존재하지 않거나 재생할 수 없으면 페이지가 멈추지 않고 자체 제작 신시사이저 BGM으로 전환한다.
- 사용자가 고른 로컬 MP3는 선택 사항이며 그 파일은 이 기기에서만 사용한다.
- **음원 게시 전에는 '모든 기기에서 해당 원본 BGM 재생 완료'라고 주장하면 안 된다.**

## 1.0 상태
`v1.0.0-official`은 비공식 팬 제작 웹게임의 릴리스 버전 이름이다. Nintendo·GAME FREAK·Creatures·The Pokémon Company의 공식 출시 제품이라는 뜻이 아니다.
