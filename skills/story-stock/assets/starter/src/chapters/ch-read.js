/* READ — 부록. 고정 무대가 아닌 보통 문서 흐름. 에이전트 11명마다 두 실행을 나란히 두고, 등급 · 한 줄 요약 ·
   주요 주장(원문 → 쉬운 말) · 접어 둔 전문 번역(REPORT, export.mjs가 만든 것)을 보여 준다. */

const ChRead = (() => {
  let root;
  const claim = (c) => `<li class="rd-claim">
      <blockquote>${qHtml(c.q)}</blockquote>
      <p class="rd-plain"><b>쉬운 말</b>${esc(c.plain)}</p>
    </li>`;
  const col = (run, id) => {
    const c = CLAIMS[run][id];
    const rep = REPORT[run][id];
    return `<section class="rd-col rd-${run}">
      <p class="rd-col-h">${runTag(run)}<span class="rd-rate" data-tone="${c.tone}">${esc(c.rating)}${c.ratingEn && c.ratingEn !== "—" ? ` · ${esc(c.ratingEn)}` : ""}</span></p>
      <p class="rd-gist">${esc(c.gist)}</p>
      <ol class="rd-claims">${c.items.map(claim).join("")}</ol>
      <details class="rd-full"><summary>전문 번역 펼치기 <span>${RUNS[run].name} · ${AGENT[id].name}</span></summary><div class="rd-doc">${rep.html}</div></details>
    </section>`;
  };
  const agent = (a, i) => `<article class="rd-agent" id="rd-${a.id}">
      <header class="rd-agent-h">
        <p class="rd-no"><span>${String(i + 1).padStart(2, "0")}</span>${a.stage}</p>
        <h3>${a.name} <em>${a.en}</em>${a.tier === "deep" ? '<i class="rd-deep">deep 모델</i>' : '<i class="rd-quick">quick 모델</i>'}</h3>
        <p class="rd-job">${a.job}</p>
      </header>
      <div class="rd-cols">${col("claude", a.id)}${col("gpt", a.id)}</div>
    </article>`;
  const runCard = (run) => {
    const r = RUNS[run];
    return `<div class="rd-run rd-run-${run}">${runTag(run)}<dl>
      <div><dt>실행</dt><dd>${r.plan}</dd></div>
      <div><dt>quick 모델</dt><dd class="mono">${r.quick}</dd></div>
      <div><dt>deep 모델</dt><dd class="mono">${r.deep}</dd></div>
      <div><dt>보고서 생성</dt><dd class="mono">${r.generated}</dd></div>
      <div><dt>최종 등급</dt><dd><b>${r.rating} · ${r.ratingEn}</b></dd></div>
    </dl></div>`;
  };

  function build() {
    root = document.getElementById("ch-read");
    root.innerHTML = `<div class="rd">
      <header class="rd-head">
        <p class="rd-kick">원문 · READ</p>
        <h2 class="rd-h">에이전트별 <em>전문 번역</em>과<br>주장 해설</h2>
        <p class="rd-lead">두 보고서를 에이전트 11명 순서로 나란히 옮겼어요. 칸마다 등급, 한 줄 요약, 주요 주장(원문 → 쉬운 말)이 있고, 보고서 전문은 접어 뒀어요. 영어로 남아 있던 제목 · 라벨 · 등급 · 최종 제안 문장만 한국어로 옮겼고, 숫자와 나머지 문장은 원문 그대로예요.</p>
        <div class="rd-runs">${runCard("claude")}${runCard("gpt")}</div>
        <p class="rd-common">공통 설정 · TradingAgents · 분석 기준일 2026-10-26 · 분석가: 시장 · 뉴스 · 재무 · 리서치 토론 1라운드 · 리스크 토론 1라운드 · 데이터: 가격·지표 yfinance, 재무 SEC EDGAR · yfinance, 뉴스 yfinance, 거시 FRED, 예측시장 Polymarket</p>
      </header>
      <section class="rd-gloss" aria-label="용어 한 줄 사전">
        <h3>용어 한 줄 사전</h3>
        <dl>${GLOSSARY.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
        <h3>최종 등급 다섯 칸</h3>
        <ol class="rd-scale">${SCALE.map((x) => `<li${x.en === "Hold" || x.en === "Underweight" ? ' class="is-pick"' : ""}><b>${x.ko}</b><span>${x.en}</span><em>${x.d}</em></li>`).join("")}</ol>
      </section>
      <nav class="rd-toc" aria-label="에이전트 목차">${AGENTS.map((a, i) => `<a href="#rd-${a.id}"><span>${String(i + 1).padStart(2, "0")}</span>${a.name}</a>`).join("")}
        <button type="button" class="rd-all" data-all>전문 모두 펼치기</button></nav>
      ${AGENTS.map(agent).join("")}
      <footer class="rd-foot">
        <p><b>출처</b> TradingAgents는 TauricResearch가 만든 오픈소스 멀티 에이전트 LLM 트레이딩 프레임워크예요(Apache-2.0). 보고서는 AI가 공개 시장 데이터를 분석해서 썼어요.</p>
        <p><b>원문</b> 두 실행이 남긴 에이전트별 보고서(markdown)를 옮겼어요. 위 그림은 보고서에 적힌 숫자와 문장만으로 그렸고, 흔들림을 보여 주는 선 하나만 예시예요.</p>
      </footer>
    </div>`;
    const all = root.querySelector("[data-all]");
    all.addEventListener("click", () => {
      const list = $$(".rd-full", root);
      const open = !list.every((d) => d.open);
      list.forEach((d) => (d.open = open));
      all.textContent = open ? "전문 모두 접기" : "전문 모두 펼치기";
    });
  }
  /** 부록이 화면을 다 덮으면 하단 readout을 숨긴다(본문과 겹치지 않게). */
  function update(p, scene) {
    toggle(document.documentElement, "is-reading", scene.enter >= 1);
  }
  /** 부록이 화면에서 벗어나면 장면 구간의 HUD로 돌아간다. */
  function hide() {
    toggle(document.documentElement, "is-reading", false);
  }
  return { build, update, hide };
})();
