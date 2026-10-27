// 이 이야기에 쓰는 보고서 — export.mjs · verify-numbers.mjs · verify-quotes.mjs가 함께 읽는다.
// dir는 이 폴더 기준 상대 경로 또는 절대 경로. 보고서가 하나면 runs에 하나만 둔다.
// files는 에이전트 id → 보고서 안의 파일 경로(TradingAgents의 저장 구조). 다른 도구의 보고서면 이 표만 바꾼다.
export default {
  runs: {
    claude: { dir: "reports/claude" },
    gpt: { dir: "reports/gpt" },
  },
  files: {
    market: "1_analysts/market.md",
    news: "1_analysts/news.md",
    fundamentals: "1_analysts/fundamentals.md",
    bull: "2_research/bull.md",
    bear: "2_research/bear.md",
    manager: "2_research/manager.md",
    trader: "3_trading/trader.md",
    aggressive: "4_risk/aggressive.md",
    conservative: "4_risk/conservative.md",
    neutral: "4_risk/neutral.md",
    pm: "5_portfolio/decision.md",
  },
  out: "src/report.js",
};
