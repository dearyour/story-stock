// 장면 검사기: 장면마다 정확한 진행률로 스크롤해 찍고, 접촉 시트(_sheet.png)를 만든다.
// 사용: node check.mjs <url> <outDir> <width> <height> "<id>:p,p,p;<id>@enter:p"
//   p = 고정 무대 안 진행률. "@enter" = 장면이 아래에서 들어오는 중의 진행률(전환 구간 확인용).
//   REDUCE=1 → prefers-reduced-motion. WAIT=ms(기본 1400). 콘솔 오류 · 가로 넘침을 함께 보고한다.
// 모바일 폭(390 등)은 창 크기가 아니라 뷰포트 에뮬레이션으로 연다(헤드리스 Chrome 창은 약 500px 아래로 줄지 않는다).
// playwright-core와 설치된 Google Chrome이 필요하다(브라우저를 내려받지 않음). $PW_DIR → ~/.cache/story-stock-pw →
// ~/.cache/story-html-pw → 이 폴더 순서로 찾는다. 한 번만:
//   mkdir -p ~/.cache/story-stock-pw && cd ~/.cache/story-stock-pw && npm init -y >/dev/null && npm i playwright-core
import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const roots = [process.env.PW_DIR, path.join(os.homedir(), ".cache/story-stock-pw"), path.join(os.homedir(), ".cache/story-html-pw"), path.dirname(new URL(import.meta.url).pathname)].filter(Boolean);
let chromium;
for (const root of roots) {
  try {
    ({ chromium } = createRequire(path.join(root, "package.json"))("playwright-core"));
    break;
  } catch {}
}
if (!chromium) {
  console.error("playwright-core not found. Run once:\n  mkdir -p ~/.cache/story-stock-pw && cd ~/.cache/story-stock-pw && npm init -y >/dev/null && npm i playwright-core");
  process.exit(1);
}

const [url, out, w = "1440", h = "900", spec = ""] = process.argv.slice(2);
const width = +w;
const height = +h;
fs.mkdirSync(out, { recursive: true });
const FRAMES = spec
  .split(";")
  .filter(Boolean)
  .map((part) => {
    const [id, ps] = part.split(":");
    return [id, ps.split(",").map(Number)];
  });
const wait = +(process.env.WAIT || 1400);
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--enable-webgl", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1, hasTouch: width < 820, reducedMotion: process.env.REDUCE === "1" ? "reduce" : "no-preference" });
const logs = [];
page.on("console", (m) => {
  if (["error", "warning"].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`);
});
page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(url, { waitUntil: "load", timeout: 90000 });
await page.waitForTimeout(2500);
const shots = [];
for (const [id, ps] of FRAMES) {
  for (const p of ps) {
    const y = await page.evaluate(
      ([id, p]) => {
        const [sid, mode] = id.split("@");
        const el = document.getElementById(sid);
        if (!el) return -1;
        const top = el.getBoundingClientRect().top + scrollY;
        const y = mode === "enter" ? Math.round(top - innerHeight * (1 - p)) : Math.round(top + Math.max(0, el.offsetHeight - innerHeight) * p);
        scrollTo(0, y);
        return y;
      },
      [id, p],
    );
    await page.waitForTimeout(wait);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    if (overflow) logs.push(`[overflow] horizontal overflow at ${id} p=${p}`);
    const file = path.join(out, `${id.replace("@", "-")}_${String(Math.round(p * 100)).padStart(3, "0")}.png`);
    await page.screenshot({ path: file });
    shots.push({ file, label: `${id} p=${p} y=${y}` });
  }
}
const cols = width < 820 ? 5 : 3;
const tw = width < 820 ? 300 : 600;
const th = Math.round((tw * height) / width);
const sheet = path.join(out, "_sheet.html");
fs.writeFileSync(
  sheet,
  `<!doctype html><meta charset=utf-8><style>body{margin:0;background:#222;color:#ddd;font:13px monospace;display:grid;grid-template-columns:repeat(${cols},${tw}px);gap:6px;padding:6px;width:${cols * tw + (cols + 1) * 6}px}figure{margin:0}img{display:block;width:${tw}px;height:${th}px}figcaption{padding:3px}</style>` +
    shots.map((s) => `<figure><img src="${pathToFileURL(s.file).href}"><figcaption>${s.label}</figcaption></figure>`).join(""),
);
const sp = await browser.newPage({ viewport: { width: cols * tw + (cols + 1) * 6, height: 600 } });
await sp.goto(pathToFileURL(sheet).href);
await sp.waitForTimeout(500);
await sp.screenshot({ path: path.join(out, "_sheet.png"), fullPage: true });
fs.writeFileSync(path.join(out, "_log.txt"), logs.join("\n"));
console.log(JSON.stringify({ shots: shots.length, errors: logs.length, logs: logs.slice(0, 8) }, null, 1));
await browser.close();
