# 스테이지 제로 메이커: 후속작 핸드오프

> 새 대화창에서 이 문서부터 읽게 하세요. 1편의 구조, 데이터, 규칙, 빌드 방법, 그림 규칙을 한곳에 모았습니다.
> 저장소: `github.com/3678132-rgb/stagezero-maker` (main = GitHub Pages로 바로 배포)
> 1편 웹 버전(Claude 아티팩트): https://claude.ai/artifact/WjizajU4vZ4xwhkBeL7iLv
> 마지막 빌드: `2026.10.09-Q`

---

## 1. 게임 한 줄 요약
- 「프린세스 메이커」식 **뷰티 CEO 육성 시뮬레이션**.
- 플레이어는 **대표의 부모**다. 스무 살 딸이 원룸에서 화장품 회사(기본 브랜드 STAGE:ZERO)를 차려 **서른 살(120개월)**이 될 때까지 키운다.
- 브랜드 세계관은 "긁힌 유리(미세 스크래치)를 투명한 유리로 되돌리는 **복원**"이다. 진정이 아니라 복원이 핵심이다.
- 매달 상순·중순·하순 **3칸**에 활동을 넣고 「이번 달 시작」을 누르면 한 달이 돌아간다. 그 뒤 이벤트가 나온다.
- 엔딩 **25종**이 있다. 엔딩 편지(부모님께 쓰는 편지), 엔딩 도감, 공유 카드가 있다.

## 2. 파일 구조

```
/ (저장소 루트 = 배포되는 PWA)
├─ index.html        ← 빌드 결과물 (직접 수정 금지)
├─ sw.js             ← 서비스워커 (ASSETS 목록 + CACHE 버전)
├─ manifest.json, icon-*.png
├─ art/              ← 그림 395장 (jpg/png)
└─ dev/              ← ★ 원본은 여기
   ├─ stagezero-maker.html   ← 게임 전체 원본 (HTML+CSS+JS 한 파일, 약 420KB)
   ├─ compat.js              ← 구형 iPad용 ES2017 변환 (typescript 필요)
   ├─ build.sh               ← 원본 → 루트 index.html + sw.js 갱신
   ├─ build_offline.py       ← (선택) 그림까지 다 박은 오프라인 단일 HTML
   ├─ sim14.js, sim19.js     ← 1,500판 자동 플레이 테스트 (errors {} 이어야 함)
   └─ HANDOFF.md             ← 이 문서
```

**빌드와 배포 순서**
1. `dev/stagezero-maker.html`을 수정한다.
2. 화면 위 빌드 태그 두 곳(`BUILD 2026.10.09-X`와 `const BUILD_TAG`)을 올린다.
3. `cd dev && ./build.sh`를 실행한다. node, `npm i -g typescript`, python3가 필요하다.
4. `node sim14.js && node sim19.js`를 돌려 `errors {}`인지 확인한다.
5. git commit 후 push한다. GitHub Pages가 자동 배포하고, 설치된 앱은 다음 달 계획 화면에서 업데이트된다.
6. Claude 아티팩트로도 올린다면 `dev/stagezero-maker.compat.html`과 `art/`를 함께 publish한다.

## 3. 원본 코드 지도 (`dev/stagezero-maker.html`)
- `<style>`: 모든 CSS. 색 토큰은 `:root`에 있다(`--serum:#2B44C0` 사파이어 블루가 메인).
- 마크업: 타이틀 커버 → 셋업(이름·브랜드·부모 직업·성향) → 게임 화면(`.phone`) → 시트들(스케줄, 썸남, 엔딩 도감 등).
- `<script>` 안의 **`// ==ENGINE==` ~ `// ==/ENGINE==`** 구간은 순수 게임 로직이다. 시뮬레이션 테스트가 이 구간만 잘라 `eval`한다. **DOM 코드를 넣으면 테스트가 깨진다.**
- 그 아래가 UI다: `render()`, `renderSchedule()`, `renderLove()`, `say()`/`ask()`/`note()` 대화창, `playEvent()`, `runMonth()`, `showCG()`, 사운드(`sfx`/`bgm`, WebAudio).

### 핵심 상태 `S` (저장 = localStorage JSON)
```js
{ name, brand, origin, prof:{blood,mbti,zodiac}, gb /*성장 보정*/,
  m /*0~119 개월*/, phase:'plan'|'run', plan:[a,b,c] /*'>'는 이어지는 칸*/,
  hp, stress, cash /*만원 단위! 10000=1억*/, aware, fan,
  st:{rnd,aes,mkt,biz,lead,net,charm} /*능력치 0~100*/,
  prods:[{name,q,m}], prog /*개발 진척*/, emp, staff:{roleId:n}, invest,
  love:{ id:{aff, stage /*-1썸 1연인 2약혼 3배우자 -9이별 -8라이벌약혼*/,
             secret, taken /*한서린의 연인(윤재현만)*/, blocked /*완전히 끝*/, recall, recallUsed, probe, closed, divorced, gone} },
  married, sus /*의심도 0~100*/, dateWith, heartbreak,
  owned:{itemId:m} /*쇼핑*/, giftLog:{to:{m,items[]}},
  seen:{eventId:true}, picks:{}, album:[] /*엔딩 회고용 기록*/, ending }
```

### 데이터 테이블 (후속작에서 그대로 복사해 쓰기 좋은 것)
| 이름 | 내용 |
| --- | --- |
| `ORIGINS` | 부모 직업 9종: 시작 능력치·자금 |
| `BLOODS`/`MBTI_FX`/`ZODIACS` | 타고난 성향, 성장 보정, 생일 달 |
| `ACTS` | 활동 35종. `{cat, name, desc, cost, hp, stress, eff, slots, req(S), run(S,ch,out)}`. 카테고리: 교육·업무·알바·운동·휴식·연애 |
| `PT_RANKS` | 알바 등급 4단계(승급 시 일당↑), `PT_ENDINGS`와 연결 |
| `ROLES` | 채용 직무 9종(매출 기준으로 열림), 월급 |
| `EVENTS` | 랜덤 이벤트 약 121개. `{id, once, w, cd, cond(S), face, speaker, title, text(S), choices:[{label, sub, run(S)→{text,chips}}], cg?, place?, cast?, beats?}` |
| `fixedEvents(S)` | 매달 반드시 확인하는 이벤트: 생일, 메인 스토리(`STORY`/`STORY2`), 어워즈(10월), 연애(`loveEvent`), 정부지원(`grantEvents`), 팀 프로젝트 결과, 연애 평판 기사, 정리·의심도·통보, 기념일 챙기기 |
| `LOVERS` | 남자 캐릭터 6명(아래 표) |
| `ENDINGS` + `computeEnding(S)` | 엔딩 25종: `nolaunch, bankrupt, exit, chair, couture, olive, lab, director, influencer, actress, model, minister, vc, author, burnout, indie, barista, cvs, hbmd, mua, clinic, academy, host, consult, plain` |
| `SHOP` / `GIFTS` / `GIFT_TASTE` | 내 물건(나이 해금, 영구 능력치), 선물(현실 가격, 취향) |
| `CG_MAP`/`CG_PREFIX`/`cgKey()` | 이벤트 id → 풀스크린 CG 연결 |
| `SPR` | 캐릭터 스탠딩(투명 PNG) |

**공용 함수**
- 능력치·수치 변경: `bump(S,key,d,ch)`, `grow(S,stat,base,ch)`, `addAff(S,id,d,ch)`
- 칩 표시: `push(ch,label,d,money)`
- 한국어 조사: `josa(word,'이','가')` ★ 조사 오류가 잦았으니 반드시 쓴다
- 기타: `pick()`, `R()`(시드 난수), `clamp()`, `fmtMoney()`(만→억 표기)

### 연애 규칙 (최종 정리판, 여러 번 갈아엎은 결과)
1. **공식 관계(연인 이상)는 한 명이다.** 연인이 생기면 남은 썸을 「정리 / 몰래 계속」 중에 고르게 한다(`sortEvent`).
2. 몰래 데이트, 소개팅, 생일 방문, 몰래 선물은 **의심도 `S.sus`**를 쌓는다. 100이 되면 **상대가 먼저 이별·이혼을 통보**한다(`confrontEvent`).
3. 이별 뒤에는 **다시 연락 1회**만 할 수 있다. 답장 확률은 매력과 호감도로 정한다. 그 뒤 **재회 데이트**에서 결정되고, 실패하면 "이제 연락하지 마"와 함께 **완전히 끝**(`blocked`)이다. 재회 후 3개월은 수습 기간이라 끝날 수 있다(`probeEvent`).
4. 평판: 환승은 팬덤↓, 이혼은 기사가 나고, 사내 연애(콜론·서하준)는 리더십↓, 차이안과의 관계는 소속사 보도자료, 윤재현과의 관계는 증권가 찌라시로 1년간 투자 확률↓(`relNewsEvent`, `vcRumor`).
5. 한서린(라이벌)의 남자친구는 **항상 윤재현**이다(`RIVAL_LOVER='vc'`).
6. 생일에는 관계가 있는 사람만 **한 명씩 찾아와** 선물을 준다. 선물은 호감 3단계 × 해마다 다르다.

## 4. 캐릭터

| id | 이름 | 나이·직업 | 성격 | 좋아하는 능력 |
| --- | --- | --- | --- | --- |
| (주인공) | 기본 이름 「스뉴이」 | 20→30세 대표 | 긴 흑발, 일자 앞머리, **파란 헤어핀**, 남색 리본·스커트, 레이스 재킷. 대표 색은 사파이어 블루·화이트·라벤더 | |
| playboy | 강도윤 | 28 · 클럽 DJ, 청담 레스토랑 오너 | 붉은 갈색 머리에 가죽 재킷, 능글맞음 | 매력 |
| intern | 서하준 | 23 · 우리 회사 인턴 | 다정한 연하남, 대표님의 팬 | 리더십 |
| vc | 윤재현 | 32 · VC 심사역 | 안경, 냉철함. **히어로 서사**(`hero_vc1~5`), 한서린의 남자친구 | 경영 |
| star | 차이안 | 27 · 아이돌 출신 배우 | 흑발 웨이브, 은색 십자가 귀걸이 | 감각 |
| ceo2 | 백승우 | 34 · 핀테크 대표 | 여유로운 어른 | 인맥 |
| colon | 콜론(이서진) | 26 · 수석비서 | 완벽주의, 안경. 퇴사하면 새 비서 한유나 또는 강다온 | 연구 |
| rival | 한서린 | 라이벌 브랜드 대표 | 매년 10월 어워즈, 최종 대결 | |
| mom | 엄마 | | 스트레스가 높으면 찾아온다. 생신은 6월 | |

남자 캐릭터 생일: 도윤 7월, 하준 3월, 재현 11월, 이안 5월, 승우 9월, 콜론 2월.

## 5. 그림 (art/) 규칙
- **스타일:** 화사한 한국 웹툰·애니 일러스트, 사파이어 네이비와 화이트 위주, 라벤더·골드 포인트, 반짝이는 빛, 꽃(흰색·파란색).
- **생성 도구:** Higgsfield `gpt_image_2_5`. 주인공 일관성을 위해 **레퍼런스 이미지(age20_ok 등)를 넣고** "same heroine as the reference"로 시작한다. 프롬프트 끝에 "no text, no letters, no logo, no watermark"를 붙인다.
  - 이번 세션에서 업로드한 주인공 레퍼런스: Higgsfield media `4947e3d6-0536-475b-b644-060426d95fca` (art/age20_ok.jpg). 계정이 같으면 재사용할 수 있고, 아니면 다시 업로드한다.
- **파일 이름과 크기**

| 종류 | 파일 이름 | 크기·비율 |
| --- | --- | --- |
| 주인공 나이·계절 전신 | `age{20,22,25,27,30}_{ok,tired,spring,summer,autumn,winter}.jpg` (`_t`는 태블릿용) | 9:16 |
| 활동 그림 | `act_<id>.jpg`, 나이대별 `_mid`(25)·`_late`(27~30) | 3:4 (720×960) |
| 미니 꼬마 대표 | `mini_<id>_a.png`, `mini_<id>_b.png` (프레임 2장, 투명) | |
| 이벤트 CG | `cg_<key>.jpg`. 계절 CG는 `cg_<season>_<20/22/25/27/30>.jpg` | 9:16 (720×1280) |
| 엔딩 | `end_<ending>.jpg` | 3:4 |
| 배경 | `bg_<place>.jpg` | |
| 스탠딩 | `spr_lv_<id>.png`, `spr_rival_*`, `spr_sec*`, `spr_mom`, `spr_team`, `spr_reporter` | 투명 PNG |
| 타이틀 커버 | `cover.jpg` | 1080×1928 |

- 새 그림을 넣으면 `build.sh`가 sw.js ASSETS를 자동으로 다시 만든다.

## 6. UX 원칙 (사용자 피드백으로 굳어진 것)
- **모바일 세로 화면이 기준이다.** 태블릿 가로에서는 세로 화면을 가운데에 둔다. 대화창이 캐릭터 얼굴을 가리지 않게 한다.
- 모든 문구는 한국어다. 조사는 `josa()`로 처리한다. 금액은 「만원」 단위 정수이고 `fmtMoney` 표기를 쓴다.
- 돈이 나가면 화면에서 바로 보이게 한다(토스트와 보유 자금 표시).
- 첫 석 달 상순 칸은 비서가 「제형 개발」로 고정한다. 석 달 안에 제품을 못 내면 폐업이다.
- 직원 관련 이벤트(회식, 첫눈 출근길 등)는 **직원이 있을 때만** 나온다.
- 선물과 쇼핑 가격은 **현실 시세**로 한다.
- 사용자는 "계속 진행해"를 선호한다. 작은 결정은 묻지 말고 진행하고, 큰 구조 변경만 확인받는다.

## 7. 후속작에 그대로 가져갈 것 / 바꿀 것 (제안)
- **그대로 가져갈 것:** 월 3칸 스케줄 엔진(`runMonth`, `doAction`, `settle`), 이벤트 스키마와 `playEvent`(beats → 선택 → 결과 → CG), 연애 규칙 세트, 쇼핑·선물, 평판 기사, 시드 난수 저장, PWA와 서비스워커 업데이트 방식(계획 단계에서만 새로고침), 엔딩 편지와 공유 카드, `josa()`.
- **세계관 연결:** 1편 저장 키는 `stagezero-maker-v1`(진행 중 게임), `stagezero-maker-slots-v1`(슬롯 3개), `stagezero-maker-endings-v1`(본 엔딩 목록)이다. 같은 도메인(GitHub Pages)에서 2편을 열면 이 값을 읽을 수 있다. 다만 지금은 엔딩을 볼 때 브랜드명·배우자 같은 결과를 따로 저장하지 않으니, 이어지게 하려면 1편 엔딩 화면에 `stagezero-legacy` 키로 요약을 저장하는 작은 수정을 먼저 넣으면 된다.
- **코드 구조 개선 추천:** 한 파일이 420KB라 수정할 때마다 부담이 크다. 후속작은 `engine.js`, `data/*.js`(이벤트·캐릭터), `ui.js`로 나누고 빌드에서 합치는 걸 추천한다.

## 8. 새 대화창에 붙여 넣을 시작 문장 예시
> "스테이지 제로 메이커 후속작을 만들려고 해. 저장소 `3678132-rgb/stagezero-maker`의 `dev/HANDOFF.md`와 `dev/stagezero-maker.html`을 먼저 읽고, 1편 엔진과 연애·쇼핑·이벤트 시스템을 재사용해서 ○○ 컨셉의 2편을 기획부터 같이 하자."
