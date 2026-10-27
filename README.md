# story-stock

주식 분석 보고서를 **한국어 쉬운 말 스크롤 스토리**로 만드는 Claude Code 스킬입니다.

- 주장 하나마다 **화면 전체를 쓰는 스크롤 연동 모션그래픽** 한 장면을 만듭니다(Canvas 2D).
  - 가격선이 평균선 천장 아래로 미끄러지고, RSI 바늘이 과매도 문턱으로 가라앉습니다.
  - MACD 막대가 0 아래로 내리꽂히고, 하루 흔들림 띠가 손절선을 삼킵니다.
- 장면 아래에는 **쉬운 말 한두 문장**과 근거 **원문 인용**만 붙습니다. 비유는 쓰지 않습니다.
- 같은 종목 · 같은 날을 **다른 모델이 분석한 보고서 두 편**이면, 두 궤적이 같은 관문을 지나며 벌어지는 장면으로 어디서 같고 왜 갈렸는지 보여 줍니다.
  - 예: [TradingAgents](https://github.com/TauricResearch/TradingAgents)를 두 모델로 한 번씩 돌린 결과.
- 숫자는 전부 보고서에서 옵니다. 빌드 전 검사가 화면 숫자와 인용문을 원문과 대조합니다.
- 스크롤만 내리면 끝까지 읽히고, 맨 아래 부록에 에이전트별 전문 번역이 접혀 있습니다.

> 예시 보고서(SNDK, 기준일 2026-10-26)는 공개 시장 데이터를 AI가 분석한 것이며 투자 권유가 아닙니다.

## 설치

### 한 줄 설치 (권장 — 자동 업데이트까지 켜짐)

```bash
curl -fsSL https://raw.githubusercontent.com/dearyour/story-stock/main/install.sh | bash
```

[install.sh](install.sh)가 다음을 한 번에 합니다. 설치 후 Claude Code를 다시 시작하세요.
- 플러그인 설치
- 자동 업데이트 켜기
- `/story-stock` 짧은 별칭 만들기

### Claude Code 플러그인 명령으로

```text
/plugin marketplace add dearyour/story-stock
/plugin install story-stock@story-stock
```

`/story-stock:story-stock`, 또는 다음 같은 요청에 쓰입니다.
- “이 주식 보고서를 스토리로”
- “TradingAgents 결과 페이지로 만들어줘”
- “두 모델 분석 비교 페이지”

짧게 `/story-stock`으로 부르려면 `~/.claude/commands/story-stock.md`에 별칭을 둡니다(install.sh가 만들어 줍니다).

### 스킬 폴더만 복사해서

```bash
git clone https://github.com/dearyour/story-stock.git
cp -R story-stock/skills/story-stock ~/.claude/skills/story-stock   # Claude Code
cp -R story-stock/skills/story-stock ~/.codex/skills/story-stock    # Codex ($story-stock)
```

## 들어 있는 것

| 경로 | 내용 |
| --- | --- |
| `skills/story-stock/SKILL.md` | 작업 순서, 꼭 지킬 것, 함정 |
| `references/scenes.md` · `scene-library.js` | 장면 레시피 17개(두 갈래 · 같은 가격표 · 천장 · RSI 바늘 · MACD 낙하 · 흔들림 · 200일선 바닥 · 다른 선 하나 · 실적 폭발 · 꼭대기 경고 · 빚 · 강세 대 약세 · 두 저울 · 인계철선 · 갭 · 한 칸 차이 · 다음에 볼 줄)와 전체 코드 |
| `references/tradingagents.md` | 공개 TradingAgents로 같은 종목 · 같은 날 보고서 두 편을 만드는 방법과 저장 구조 |
| `assets/starter/` | 장면 런타임(`app.js` · `boot.js`), 예시 장면 6개, 부록, `export.mjs`(번역 · 남은 영어에서 멈춤), `verify-numbers.mjs` · `verify-quotes.mjs`, `build.mjs` · `check.mjs`, 예시 보고서 두 편 |

## 출발점 직접 써 보기

```bash
cp -R skills/story-stock/assets/starter my-stock && cd my-stock
node export.mjs            # 보고서 → src/report.js (남은 영어가 있으면 멈춤)
node verify-quotes.mjs     # 인용이 번역본에 그대로 있는지
node verify-numbers.mjs    # 화면 숫자가 보고서에 있는지
node build.mjs             # → dist/index.html (단일 HTML)
open dist/index.html
```

`node build.mjs --publish=<경로.html>`로 결과를 아무 사이트의 정적 폴더에 복사할 수 있습니다.

캡처 검사(`check.mjs`)에는 `playwright-core`와 설치된 Google Chrome이 필요합니다.

```bash
mkdir -p ~/.cache/story-stock-pw && cd ~/.cache/story-stock-pw && npm init -y >/dev/null && npm i playwright-core
```

## 라이선스

MIT. TradingAgents는 TauricResearch의 Apache-2.0 프로젝트이며, 이 스킬은 그 결과물(보고서)을 읽기만 합니다.
