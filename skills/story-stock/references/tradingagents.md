# TradingAgents로 보고서 두 편 만들기

[TradingAgents](https://github.com/TauricResearch/TradingAgents)(TauricResearch, Apache-2.0)는 분석가 · 연구원 · 트레이더 · 리스크 · 포트폴리오 매니저 에이전트가 토론해 종목 등급을 내는 오픈소스 멀티 에이전트 프레임워크다.

아래 내용은 공개 저장소 README에 적힌 설치 · CLI · 환경 변수만 옮긴 것이다. 버전마다 바뀔 수 있으니 실행 전에 README를 한 번 확인한다.

## 설치

```bash
git clone https://github.com/TauricResearch/TradingAgents.git && cd TradingAgents
python -m venv .venv && source .venv/bin/activate   # Python 3.11+
pip install .
cp .env.example .env    # 쓸 공급자의 키를 채운다
```

키 예시:
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_API_KEY`
- 선택: `FRED_API_KEY` · `ALPHA_VANTAGE_API_KEY`

ChatGPT Plus/Pro 요금제로 돌릴 때는 다음 둘 중 하나를 한다.
- `tradingagents login chatgpt`로 로그인한 뒤 공급자를 `chatgpt`로 둔다.
- CLI 공급자 메뉴에서 "Subscription"을 고른다.

## 같은 종목 · 같은 날을 두 모델로

질문 없이 돌리려면 실행마다 플래그를 주고, 나머지는 `TRADINGAGENTS_*` 변수로 채운다.

결과 폴더를 `TRADINGAGENTS_RESULTS_DIR`로 나누면 두 실행이 섞이지 않는다.

```bash
COMMON="--ticker NVDA --date 2026-09-23 --analysts market,news,fundamentals --save --no-show"
export TRADINGAGENTS_OUTPUT_LANGUAGE=Korean TRADINGAGENTS_MAX_DEBATE_ROUNDS=1 TRADINGAGENTS_MAX_RISK_ROUNDS=1

# 실행 A
TRADINGAGENTS_RESULTS_DIR=./runs/a TRADINGAGENTS_LLM_PROVIDER=openai \
  TRADINGAGENTS_QUICK_THINK_LLM=<빠른 모델> TRADINGAGENTS_DEEP_THINK_LLM=<깊은 모델> tradingagents $COMMON

# 실행 B
TRADINGAGENTS_RESULTS_DIR=./runs/b TRADINGAGENTS_LLM_PROVIDER=anthropic \
  TRADINGAGENTS_QUICK_THINK_LLM=<빠른 모델> TRADINGAGENTS_DEEP_THINK_LLM=<깊은 모델> tradingagents $COMMON
```

- 빠른 모델(quick)은 분석가 · 연구원 · 토론자 · 트레이더가, 깊은 모델(deep)은 리서치 매니저와 포트폴리오 매니저가 쓴다.
  - 층마다 공급자를 따로 둘 수도 있다: `TRADINGAGENTS_DEEP_THINK_PROVIDER` · `TRADINGAGENTS_QUICK_THINK_PROVIDER`.
- 출력 언어를 한국어로 두면 본문은 한국어로 나온다. 제목 · 라벨 · 등급 · 최종 제안 문장 · 기사 헤드라인은 영어로 남는 경우가 많다.
  - 그것을 `export.mjs`와 `translate.dict.mjs`가 옮긴다.
- `--no-html`로 HTML 보고서를 건너뛸 수 있다. story-stock은 markdown만 읽는다.

## 저장 구조

`<results_dir>/reports/<TICKER>_<날짜시각>/` 아래에 다음이 저장된다.

```text
1_analysts/   market.md · news.md · fundamentals.md (고른 분석가만)
2_research/   bull.md · bear.md · manager.md
3_trading/    trader.md
4_risk/       aggressive.md · conservative.md · neutral.md
5_portfolio/  decision.md
complete_report.md
```

starter의 `stock.config.mjs` `files` 표가 이 구조를 따른다.

- `runs.<id>.dir`에 각 실행의 보고서 폴더를 적는다.
- `complete_report.md` 머리말에는 실행 환경(공급자 이름 등)이 적혀 있다. 공개 페이지에 그대로 옮기지 않는다.
- 에이전트별 파일만 쓰는 것이 안전하다.

## 읽을 때 확인할 것

- **같은 질문이었는가.** 두 실행의 종목 · 기준일 · 분석가 구성 · 토론 라운드 · 데이터 벤더가 같은지 본다(complete_report 머리말).
- **도구가 실제로 데이터를 받았는가.** 한쪽 보고서가 도구 실패나 빈 보고서로 시작하면 그건 모델 차이가 아니라 입력 차이다.
  - 먼저 다시 돌리고, 그대로 비교해야 한다면 그 사실을 이야기의 중심에 둔다.
- **등급 척도.** 다섯 칸이다: Buy · Overweight · Hold · Underweight · Sell.
  - 트레이더의 행동 칸 "Sell"이 실제로는 "절반까지 축소"인 경우가 있으니 본문을 읽고 쉬운 말로 옮긴다.
