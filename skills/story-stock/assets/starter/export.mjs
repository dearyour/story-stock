// 보고서(markdown)를 한국어로 옮긴 HTML 조각으로 만들어 src/report.js에 쓴다(부록의 전문 번역과 verify-quotes의 기준).
//   node export.mjs
// 보고서 위치는 stock.config.mjs, 번역 사전은 translate.dict.mjs. 본문 숫자와 문장은 손대지 않고,
// 사전에 없는 영어가 남으면 그 낱말을 보여 주고 멈춘다(사전에 한 쌍을 더하고 다시 실행).
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import config from "./stock.config.mjs";
import * as DICT from "./translate.dict.mjs";
const { SENTENCES = [], WORDS = [], WORDS2 = [] } = DICT;

const dir = dirname(fileURLToPath(import.meta.url));
const at = (p) => (isAbsolute(p) ? p : join(dir, p));
const rep = (s, [a, b]) => (a instanceof RegExp ? s.replace(a, b) : s.split(a).join(b));

export function translate(md) {
  let s = md.replace(/\r/g, "").trim();
  for (const pair of [...SENTENCES, ...WORDS, ...WORDS2]) s = rep(s, pair);
  return s;
}

// 번역 뒤에도 남아도 되는 영어: 지표 약어 · 등급 원어 · 출처 이름 · 회사 약칭. 코드(`…`) 안은 검사하지 않는다.
const ALLOW = new Set(
  (
    "SNDK EMA SMA RSI MACD ATR VWMA EPS FCF AI API FRED SEC EDGAR OHLCV ASP TTM Hold Buy Sell Underweight Overweight " +
    "Bullish Bearish Neutral Not Rated HOLD SELL BUY Fed SK CPI VIX IBM FOMC NAND CAPEX capex PER PBR EV EBITDA BofA " +
    "Barchart IBD Zacks GuruFocus Wall St Simply Investing com Stocktwits Yahoo Finance"
  ).split(" "),
);
const leftovers = (s) => [...new Set((s.replace(/`[^`]*`/g, "").match(/[A-Za-z][A-Za-z_]+/g) || []).filter((w) => !ALLOW.has(w)))];

// 작은 markdown → HTML(제목 · 문단 · 목록 · 번호 목록 · 표 · 굵게 · 코드).
const escH = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (s) => escH(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
function mdToHtml(md) {
  const lines = md.split("\n");
  const out = [];
  let i = 0;
  const isList = (l) => /^\s*([-*]|\d+[.)])\s+/.test(l);
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const lvl = Math.min(6, h[1].length + 2);
      out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`);
      i++;
      continue;
    }
    if (/^\|/.test(line)) {
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
      const cells = (r) => r.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const num = (c) => /^[-+−]?[\d,.]+%?$/.test(c);
      out.push(
        `<div class="rd-table"><table><thead><tr>${cells(rows[0]).map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${rows
          .slice(2)
          .map((r) => `<tr>${cells(r).map((c) => `<td${num(c) ? ' class="n"' : ""}>${inline(c)}</td>`).join("")}</tr>`)
          .join("")}</tbody></table></div>`,
      );
      continue;
    }
    if (isList(line)) {
      const items = [];
      while (i < lines.length && isList(lines[i])) {
        const m = lines[i].match(/^(\s*)([-*]|\d+[.)])\s+(.*)$/);
        items.push({ depth: Math.floor(m[1].length / 2), ordered: /\d/.test(m[2]), text: m[3] });
        i++;
      }
      const render = (list, depth) => {
        let html = "";
        let k = 0;
        while (k < list.length) {
          const tag = list[k].ordered ? "ol" : "ul";
          const group = [];
          while (k < list.length && list[k].depth >= depth) {
            if (list[k].depth === depth) group.push({ ...list[k], kids: [] });
            else group[group.length - 1]?.kids.push(list[k]);
            k++;
          }
          html += `<${tag}>${group.map((g) => `<li>${inline(g.text)}${g.kids.length ? render(g.kids, depth + 1) : ""}</li>`).join("")}</${tag}>`;
          if (k < list.length && list[k].depth < depth) break;
        }
        return html;
      };
      out.push(render(items, 0));
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|\|)/.test(lines[i]) && !isList(lines[i])) para.push(lines[i++]);
    out.push(`<p>${para.map((l) => inline(l.trimEnd())).join("<br>")}</p>`);
  }
  return out.join("\n");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const REPORT = {};
  const problems = [];
  for (const [run, r] of Object.entries(config.runs)) {
    REPORT[run] = {};
    for (const [agent, file] of Object.entries(config.files)) {
      let raw;
      try {
        raw = readFileSync(join(at(r.dir), file), "utf8");
      } catch {
        continue; // 그 실행에 없는 에이전트는 건너뛴다
      }
      const ko = translate(raw);
      const left = leftovers(ko);
      if (left.length) problems.push(`${run}/${agent}: ${left.join(", ")}`);
      REPORT[run][agent] = { html: mdToHtml(ko), chars: Array.from(ko.replace(/\s+/g, "")).length };
    }
  }
  if (problems.length) {
    console.error(`번역되지 않은 영어가 남았습니다 — translate.dict.mjs에 더하세요:\n${problems.join("\n")}`);
    process.exit(1);
  }
  const js = `/* 보고서 전문 — export.mjs가 stock.config.mjs의 보고서에서 만든 한국어 HTML. 손으로 고치지 않는다. */\nconst REPORT = ${JSON.stringify(REPORT)};\n`;
  writeFileSync(at(config.out), js);
  console.log(`${config.out} · ${(js.length / 1024).toFixed(1)} KB`);
}
