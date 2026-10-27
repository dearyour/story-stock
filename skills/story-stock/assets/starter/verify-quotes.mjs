// 주장 원문(q)이 번역본(REPORT)에 그대로 있는지 검사한다. "…"로 나뉜 조각마다 확인한다.
//   node verify-quotes.mjs        (먼저 node export.mjs)
// 장면 캡션의 원문은 Q(run, agent, 앞부분)로 CLAIMS에서만 꺼내므로, 이 검사가 장면 인용까지 덮는다.
import { readFileSync } from "node:fs";

const load = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const ctx = {};
new Function("ctx", `${load("src/claims.js")}\n${load("src/report.js")}\nctx.CLAIMS = CLAIMS; ctx.REPORT = REPORT;`)(ctx);
const strip = (h) => h.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, "");
let bad = 0;
let n = 0;
for (const run of Object.keys(ctx.CLAIMS))
  for (const [agent, c] of Object.entries(ctx.CLAIMS[run])) {
    const text = strip(ctx.REPORT[run]?.[agent]?.html || "");
    for (const it of c.items)
      for (const frag of it.q.replace(/`/g, "").split("…")) {
        const f = frag.replace(/\s+/g, "").replace(/^[.,]|[.,]$/g, "");
        if (!f) continue;
        n++;
        if (!text.includes(f)) {
          bad++;
          console.log(`✗ ${run}/${agent}: ${frag.trim().slice(0, 90)}`);
        }
      }
  }
console.log(`${n - bad}/${n} 조각이 번역본에 그대로 있습니다.`);
process.exitCode = bad ? 1 : 0;
