// 페이지에 나오는 숫자가 보고서 원문에 있는지 검사한다.
//   node verify-numbers.mjs
// 1) 화면 글: 한글이 든 큰따옴표 문자열, 숫자만 든 문자열, 캔버스에 그리는 글(D.text · lineLabel의 첫 인자).
// 2) 그림 숫자: src/data.js의 숫자 값(쉼표 표기 · 소수 자리까지 바꿔 가며 찾는다).
// 원문 = stock.config.mjs의 보고서 폴더 안 모든 .md. 같은 표기가 어디에도 없으면 목록으로 보여 주고 실패한다.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import config from "./stock.config.mjs";

const dir = dirname(fileURLToPath(import.meta.url));
const at = (p) => (isAbsolute(p) ? p : join(dir, p));
const mds = [];
const walk = (d) => readdirSync(d).forEach((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : f.endsWith(".md") && mds.push(join(d, f))));
Object.values(config.runs).forEach((r) => walk(at(r.dir)));
const corpus = mds.map((p) => readFileSync(p, "utf8")).join("\n");

const files = ["src/claims.js", "src/data.js", "src/app.js", "src/scenes.js", ...readdirSync(join(dir, "src/chapters")).filter((f) => f.endsWith(".js") && !f.startsWith("_")).map((f) => `src/chapters/${f}`)];
// 보고서 밖에서 온 것이 분명한 표기: 척도 눈금(0 · 30 · 50 · 70 · 100%), 등급 칸 수 같은 작은 정수
const ALLOW = new Set(["0", "1", "2", "3", "5", "11", "30", "50", "70", "100", "0%", "50%", "100%"]);
const has = (n) => corpus.includes(n) || corpus.includes(n.replace(/^-/, "")) || corpus.includes(n.replace(/%$/, ""));
const misses = new Map();
const miss = (n, where) => {
  if (!misses.has(n)) misses.set(n, new Set());
  misses.get(n).add(where);
};
const nums = (text) => text.match(/[-−+]?\d[\d,]*(?:\.\d+)?%?/g) || [];

for (const f of files) {
  let src;
  try {
    src = readFileSync(join(dir, f), "utf8");
  } catch {
    continue;
  }
  const shown = [];
  for (const m of src.matchAll(/"((?:[^"\\\n]|\\.)*)"/g)) if (/[가-힣]/.test(m[1]) || /^[-+]?\d[\d,]*\.?\d*%?$/.test(m[1])) shown.push(m[1]);
  for (const m of src.matchAll(/(?:D\.text|lineLabel)\(g, "([^"]*)"/g)) shown.push(m[1]);
  for (const m of src.matchAll(/(?:D\.text|lineLabel)\(g, `([^`]*)`/g)) shown.push(m[1].replace(/\$\{[^}]*\}/g, " "));
  for (const s of shown)
    for (const raw of nums(s)) {
      const n = raw.replace("−", "-").replace(/,$/, "").replace(/^\+/, "");
      if (ALLOW.has(n.replace(/^-/, ""))) continue;
      if (/^\d{4}-\d{2}(-\d{2})?$/.test(n) || /^-\d{2}$/.test(n)) continue; // 날짜 조각
      if (/^\d{4}$/.test(n) && corpus.includes(n)) continue;
      if (!has(n)) miss(n, `${f}: ${s.slice(0, 70)}`);
    }
}
// data.js의 숫자 값(키: 값, 배열 원소). 날짜 문자열 · 주석은 건너뛴다.
const data = readFileSync(join(dir, "src/data.js"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "").replace(/"[^"]*"/g, '""');
for (const m of data.matchAll(/(?<![\w.])-?\d+(?:\.\d+)?(?![\w.])/g)) {
  const raw = m[0];
  const v = Number(raw);
  if (Math.abs(v) < 10 && !raw.includes(".")) continue;
  const dec = (raw.split(".")[1] || "").length;
  const forms = [
    v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }),
    v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    String(v),
  ];
  if (!forms.some((x) => has(x))) miss(forms[0], "src/data.js 값");
}

if (!misses.size) console.log("화면 숫자가 모두 보고서 원문에 있습니다.");
else {
  console.log(`보고서 원문에서 찾지 못한 숫자 ${misses.size}개:`);
  for (const [n, w] of misses) console.log(`  ${n}\n    ${[...w].slice(0, 4).join("\n    ")}`);
  process.exitCode = 1;
}
