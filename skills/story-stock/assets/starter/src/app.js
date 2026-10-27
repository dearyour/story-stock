/* 장면 런타임 — 주장 하나 = 화면 전체를 쓰는 캔버스 장면 하나. 그림은 진행률 p(스크롤)의 함수로 그리고,
   시간(Engine.t)은 떨림 · 입자 같은 배경 생명에만 쓴다(동작 줄이기에서는 멈춘다).
   캡션은 쉬운 말 한두 문장 + 그 아래 원문 인용. 숫자는 data.js, 문장은 CLAIMS(claims.js)에서만 읽는다.
   장면 정의는 scenes.js(scene({...}) 호출), 더 많은 장면 레시피는 스킬의 references/scene-library.js. */

const C_ = {
  c: "#ff9466", // Claude
  g: "#38e0b4", // GPT
  ink: "#f3efe4",
  ink2: "#c8c2b0",
  ink3: "#8f8a7c",
  line: "rgba(243,239,228,0.10)",
  line2: "rgba(243,239,228,0.22)",
  hot: "#ff4a4a",
  amber: "#ffc24a",
  bull: "#ffd166",
  bear: "#ff5a6e",
};
const SANS = '"Pretendard Variable", Pretendard, -apple-system, "Apple SD Gothic Neo", sans-serif';
const MONO = '"JetBrains Mono", ui-monospace, Menlo, monospace';
const RUNC = { claude: C_.c, gpt: C_.g };
const fmt2 = (v) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt0 = (v) => v.toLocaleString("en-US");
const runTag = (run) => `<span class="rt rt-${run}"><i></i>${RUNS[run].name}</span>`;
const qHtml = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");

/** 주장 찾기: (실행, 에이전트, 원문 앞부분) → { run, agent, q }. 못 찾으면 바로 멈춘다(원문만 인용하기 위해). */
function Q(run, agent, head) {
  const it = CLAIMS[run][agent].items.find((x) => x.q.startsWith(head));
  if (!it) throw new Error(`claim not found: ${run}/${agent}/${head}`);
  return { run, agent, q: it.q };
}

/* ── 그리기 도구 ── */
const D = {
  font(g, px, w = 700, fam = SANS) {
    g.ctx.font = `${w} ${Math.max(13, px)}px ${fam}`;
  },
  text(g, s, x, y, o = {}) {
    const c = g.ctx;
    c.save();
    D.font(g, o.px ?? 15, o.w ?? 650, o.fam === "mono" ? MONO : SANS);
    c.fillStyle = o.color ?? C_.ink;
    c.textAlign = o.align ?? "left";
    c.textBaseline = o.base ?? "alphabetic";
    c.globalAlpha *= o.alpha ?? 1;
    if (o.glow) {
      c.shadowColor = o.glowColor ?? o.color ?? C_.ink;
      c.shadowBlur = o.glow;
    }
    if (o.stroke) {
      c.lineWidth = o.stroke;
      c.strokeStyle = "rgba(4,4,5,0.92)";
      c.lineJoin = "round";
      c.strokeText(s, x, y);
    }
    c.fillText(s, x, y);
    c.restore();
  },
  line(g, x1, y1, x2, y2, o = {}) {
    const c = g.ctx;
    c.save();
    c.strokeStyle = o.color ?? C_.line2;
    c.lineWidth = o.w ?? 1;
    c.globalAlpha *= o.alpha ?? 1;
    if (o.dash) c.setLineDash(o.dash);
    if (o.glow) {
      c.shadowColor = o.color;
      c.shadowBlur = o.glow;
    }
    c.lineCap = o.cap ?? "round";
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();
    c.restore();
  },
  /** 점들을 이은 선의 앞쪽 k(0..1)만 그린다. 머리 위치를 돌려준다. */
  poly(g, pts, k = 1, o = {}) {
    if (pts.length < 2) return pts[0];
    const c = g.ctx;
    const segs = [];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      segs.push(l);
      total += l;
    }
    let left = total * clamp(k);
    c.save();
    c.strokeStyle = o.color ?? C_.ink;
    c.lineWidth = o.w ?? 2;
    c.lineJoin = "round";
    c.lineCap = "round";
    c.globalAlpha *= o.alpha ?? 1;
    if (o.dash) c.setLineDash(o.dash);
    if (o.glow) {
      c.shadowColor = o.color;
      c.shadowBlur = o.glow;
    }
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    let head = pts[0];
    for (let i = 1; i < pts.length; i++) {
      if (left <= 0) break;
      const f = Math.min(1, left / (segs[i - 1] || 1));
      const x = lerp(pts[i - 1][0], pts[i][0], f);
      const y = lerp(pts[i - 1][1], pts[i][1], f);
      c.lineTo(x, y);
      head = [x, y];
      left -= segs[i - 1];
    }
    c.stroke();
    c.restore();
    return head;
  },
  dot(g, x, y, r, o = {}) {
    const c = g.ctx;
    c.save();
    c.globalAlpha *= o.alpha ?? 1;
    if (o.glow) {
      c.shadowColor = o.color ?? C_.ink;
      c.shadowBlur = o.glow;
    }
    c.beginPath();
    c.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2);
    if (o.fill !== false) {
      c.fillStyle = o.color ?? C_.ink;
      c.fill();
    }
    if (o.ring) {
      c.lineWidth = o.ringW ?? 2;
      c.strokeStyle = o.ring;
      c.stroke();
    }
    c.restore();
  },
  rect(g, x, y, w, h, o = {}) {
    const c = g.ctx;
    c.save();
    c.globalAlpha *= o.alpha ?? 1;
    if (o.glow) {
      c.shadowColor = o.color ?? C_.ink;
      c.shadowBlur = o.glow;
    }
    const r = Math.min(o.r ?? 0, Math.abs(w) / 2, Math.abs(h) / 2);
    c.beginPath();
    if (c.roundRect) c.roundRect(Math.min(x, x + w), Math.min(y, y + h), Math.abs(w), Math.abs(h), r);
    else c.rect(Math.min(x, x + w), Math.min(y, y + h), Math.abs(w), Math.abs(h));
    if (o.color) {
      c.fillStyle = o.color;
      c.fill();
    }
    if (o.stroke) {
      c.lineWidth = o.sw ?? 1;
      c.strokeStyle = o.stroke;
      if (o.dash) c.setLineDash(o.dash);
      c.stroke();
    }
    c.restore();
  },
  arrow(g, x1, y1, x2, y2, o = {}) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const hs = o.head ?? 14;
    D.line(g, x1, y1, x2 - Math.cos(a) * hs * 0.6, y2 - Math.sin(a) * hs * 0.6, o);
    const c = g.ctx;
    c.save();
    c.fillStyle = o.color ?? C_.ink;
    c.globalAlpha *= o.alpha ?? 1;
    if (o.glow) {
      c.shadowColor = o.color;
      c.shadowBlur = o.glow;
    }
    c.beginPath();
    c.moveTo(x2, y2);
    c.lineTo(x2 - Math.cos(a - 0.45) * hs, y2 - Math.sin(a - 0.45) * hs);
    c.lineTo(x2 - Math.cos(a + 0.45) * hs, y2 - Math.sin(a + 0.45) * hs);
    c.closePath();
    c.fill();
    c.restore();
  },
  /** 장면 공통 바닥: 가는 격자. */
  grid(g, alpha = 1) {
    const { G } = g;
    const step = g.m ? 40 : 64;
    for (let x = G.x; x <= G.x + G.w + 1; x += step) D.line(g, x, G.y, x, G.y + G.h, { color: C_.line, alpha: 0.5 * alpha });
    for (let y = G.y; y <= G.y + G.h + 1; y += step) D.line(g, G.x, y, G.x + G.w, y, { color: C_.line, alpha: 0.5 * alpha });
  },
  /** 시간 기반 떨림(동작 줄이기에서는 0). */
  shake(g, amp, f = 1) {
    if (Engine.reduce || amp <= 0) return 0;
    const t = g.t * f;
    return amp * (Math.sin(t * 37.1) * 0.5 + Math.sin(t * 23.7 + 1.3) * 0.35 + Math.sin(t * 61.3 + 0.7) * 0.15);
  },
};

/** 날짜·값 → 화면 좌표. */
function chart(rect, d0, d1, v0, v1) {
  const t0 = Date.parse(d0);
  const t1 = Date.parse(d1);
  return {
    X: (d) => rect.x + ((Date.parse(d) - t0) / (t1 - t0)) * rect.w,
    Y: (v) => rect.y + (1 - (v - v0) / (v1 - v0)) * rect.h,
  };
}
const lineLabel = (g, txt, x, y, color, o = {}) =>
  D.text(g, txt, x, y - 8, { px: o.px ?? (g.m ? 13 : 15), w: 700, fam: "mono", color, align: o.align ?? "right", stroke: 5, ...o });

/* ── 장면 정의 ── */
const SCENES = [];
const scene = (def) => SCENES.push(def);

