# Pokémon Quest Fan Edition — 1.0 Official Release 오디오 배포

**최종 앱 버전:** 1.0.0. 사용자는 Pokémon Quest OST MP3를 제공하고 사용 허가를 받았다고 밝혔습니다. 이 저장소에서는 원본의 실제 권리·허가서를 검증하지 않았습니다.

## 27개 음악 자동 장면 매핑
- 타이틀: Title; 새 게임: Intro; 튜토리얼: Tutorial(추후 실제 튜토리얼 화면 별도 대응)
- 탐험 결과: Expedition Results; 베이스캠프: Base Camp; 월드맵: Expeditions
- 본편 1~10지역: First Steppe, Gloomy Grove, Backforth Brook, Parched Peak, Belly Button Cave, Pincushion Plain, Miasma Moor, Hushed Highlands, Nightlight Nook, Farside Fjord
- 보스전: Boss Battle 1 / Boss Battle 2; 최종 뮤츠: Mewtwo Battle
- 기이한 섬: Grassland, Waterside, Cave, Forest, Mountain
- Story Talk, Story Emergency, Staff Roll 음원은 매니페스트에 포함되며 실제 해당 장면에서 호출 가능한 구조입니다. 별도 스토리 스크립트/크레딧 진입 흐름이 연결되지 않은 화면은 곡만 준비된 상태입니다.

## 현재 GitHub 배포의 중요한 제한

연결된 GitHub 파일 편집 도구는 **텍스트 파일만 전송**할 수 있습니다. 사용자가 제공한 원본은 **174MB**이고, 여기서 분리한 27개 크로스브라우저 MP3는 합계 약 **36MB**입니다. 이 MP3 **바이너리까지 저장소에 업로드된 것은 아닙니다**. 따라서 코드가 1.0으로 배포돼도, 개별 MP3를 저장소에 저장하기 전에는 공식 음원이 모든 기기에서 재생되는 상태가 아닙니다. 오디오를 찾지 못하면 기존 자체 작곡 BGM을 사용합니다.

### 배포 마지막 단계

1. 첨부된 `quest_official_1_0_music_pack.zip` 압축을 풉니다.
2. ZIP 내부의 `public/soundtrack/`에 들어 있는 **27개의 MP3**를 동일한 경로로 GitHub 저장소에 커밋합니다. 필요시 GitHub 웹 업로드 또는 Git 클라이언트로 파일을 올리세요. 파일당 2.6MB 이하여서 GitHub의 파일 크기 제한 안에 있습니다.
3. main으로 병합한 뒤 GitHub Actions의 **Deploy to GitHub Pages**가 성공했는지 확인합니다.
4. 제목, 각 지역, 보스전, 뮤츠전 등에서 음악이 장면마다 바뀌는지 확인합니다. iOS/Android에서는 첫 터치로 오디오 권한을 활성화합니다.

기존 게임/암호화 저장 데이터는 삭제하지 않습니다. **계정 초기화**는 게임 내 계정 초기화 UI가 기존 기능을 호출합니다. 초기화 시 데이터 손실 가능성을 반드시 확인해야 합니다.

## 중요한 고지

버전의 'Official Release'는 **이 팬게임의 최종 공식 버전명**이지, Nintendo·The Pokémon Company의 공식 게임 또는 그 승인을 의미하지 않습니다.
