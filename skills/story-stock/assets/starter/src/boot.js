/* Boot — 장면(SCENES)마다 섹션 · 캔버스 · 캡션을 만들고 스크롤 엔진에 건다. 그다음 부록(ch-read)을 붙이고
   레일 · HUD · grain을 연결한다. CHAPTERS는 build.mjs가 page.html의 <!--ch-x-->에서 만든다(여기서는 부록 하나). */

const CHAPTERS = [
/*__CHAPTERS__*/
].filter(([id, mod]) => mod && document.getElementById(id));

const host = $("#scenes");
const total = SCENES.length + CHAPTERS.length;
const two = (n) => String(n).padStart(2, "0");

/** 캡션 한 박자를 그린다. */
function fillCap(cap, beat) {
  const q = beat.q || {};
  const run = q.run;
  cap.style.setProperty("--qc", run ? RUNC[run] : "var(--line2)");
  const tagDot = run ? "<i></i>" : "";
  setHTML($(".cap-tag", cap), `${tagDot}${esc(beat.tag)}`);
  setHTML($(".cap-plain", cap), esc(beat.plain));
  if (!Engine.reduce) {
    cap.classList.remove("is-swap");
    void cap.offsetWidth;
    cap.classList.add("is-swap");
  }
}

const marks = [];
SCENES.forEach((def, idx) => {
  const sec = el(`<section class="sc" id="${def.id}" style="--len:${def.len}" aria-label="${two(idx + 1)} ${esc(def.name)}">
      <div class="st">
        <canvas aria-hidden="true"></canvas>
        <div class="cap"><p class="cap-tag"></p><p class="cap-plain"></p></div>
        <div class="sr-only">${def.beats.map((b) => `<p>${esc(b.plain)}</p>`).join("")}</div>
      </div>
    </section>`);
  host.appendChild(sec);
  const cv = $("canvas", sec);
  const cap = $(".cap", sec);
  const g = { ctx: cv.getContext("2d"), W: 1, H: 1, m: false, G: { x: 0, y: 0, w: 1, h: 1 }, t: 0, dpr: 1 };
  let beatNow = -1;
  const size = () => {
    const W = innerWidth;
    const H = Engine.vh || innerHeight;
    const dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    g.W = W;
    g.H = H;
    g.dpr = dpr;
    g.m = W < 820;
    if (g.m) {
      const top = 70;
      const bottom = H - Math.max(300, H * 0.44);
      g.G = { x: 16, y: top, w: W - 32, h: Math.max(220, bottom - top) };
    } else {
      const gut = Math.max(24, Math.min(80, W * 0.05));
      const top = 92;
      const bottom = H - Math.max(250, H * 0.33);
      g.G = { x: gut, y: top, w: W - gut - 120, h: Math.max(260, bottom - top) };
    }
    beatNow = -1;
  };
  const s = Engine.add({
    id: def.id,
    resize: size,
    update(p, sc) {
      // 동작 줄이기: 박자 안에서는 그 박자의 완성 상태를 보여 준다.
      const bi = stepOf(p, def.beats.map((b) => b.at));
      const pe = Engine.reduce ? Math.min(0.999, (def.beats[bi + 1]?.at ?? 1) - 0.001) : p;
      if (bi !== beatNow) {
        beatNow = bi;
        fillCap(cap, def.beats[bi]);
        hudSync();
      }
      g.t = Engine.reduce ? 0 : Engine.t;
      const c = g.ctx;
      c.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
      c.clearRect(0, 0, g.W, g.H);
      // 장면 사이: 나가는 그림은 무대가 밀려 올라가기 시작하면 빠르게 사라지고, 들어오는 그림은 무대가 거의 다 들어온 뒤 켜진다.
      const fade = Engine.reduce ? 1 : clamp((sc.enter - 0.5) / 0.45) * (1 - clamp(sc.exit * 2.5));
      c.globalAlpha = fade;
      def.draw(g, pe, bi);
      c.globalAlpha = 1;
    },
  });
  marks.push({ id: def.id, num: two(idx + 1), name: def.name, s });
});

for (const [id, mod] of CHAPTERS) {
  mod.build?.();
  const s = Engine.add({ id, update: (p, sc) => mod.update?.(p, sc), resize: (sc) => mod.resize?.(sc), hide: (sc) => mod.hide?.(sc) });
  marks.push({ id, num: two(marks.length + 1), name: "원문 번역", s });
}

/* 레일 · HUD */
const rail = $("#rail");
rail.innerHTML = marks.map((m, i) => `<li><a href="#${m.id}" data-i="${i}"><span>${m.num} ${esc(m.name)}</span><i></i></a></li>`).join("");
const railLinks = $$("a", rail);
const jump = (id) => {
  const s = Engine.scenes.find((x) => x.id === id);
  if (!s) return;
  scrollTo({ top: s.top + 2, behavior: Engine.reduce ? "auto" : "smooth" });
};
rail.addEventListener("click", (e) => {
  const a = e.target.closest("a");
  if (!a) return;
  e.preventDefault();
  jump(marks[Number(a.dataset.i)].id);
});
document.addEventListener("click", (e) => {
  const a = e.target.closest("[data-jump]");
  if (!a) return;
  e.preventDefault();
  jump(a.dataset.jump);
});
$("#hudTotal").textContent = two(total);
let cur = -1;
function hudSync() {
  const mid = Engine.y + Engine.vh * 0.5;
  let ci = 0;
  marks.forEach((m, i) => {
    if (mid >= m.s.top) ci = i;
  });
  if (ci === cur) return;
  cur = ci;
  $("#hudNum").textContent = marks[ci].num;
  $("#hudName").textContent = marks[ci].name;
  railLinks.forEach((a, i) => (i === ci ? a.setAttribute("aria-current", "step") : a.removeAttribute("aria-current")));
}

/* grain */
(() => {
  const c = document.createElement("canvas");
  c.width = c.height = 180;
  const x = c.getContext("2d");
  const img = x.createImageData(180, 180);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  $("#grain").style.backgroundImage = `url(${c.toDataURL()})`;
})();
let grainT = 0;
Engine.on((E2) => {
  hudSync();
  if (!E2.reduce && E2.t - grainT > 0.09) {
    grainT = E2.t;
    $("#grain").style.backgroundPosition = `${(Math.random() * 180) | 0}px ${(Math.random() * 180) | 0}px`;
  }
});

Engine.start();
