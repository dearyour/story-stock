/* story-stock 장면 라이브러리 — 실제 페이지에서 쓴 장면 17개 전체. 복사해서 starter/src/scenes.js에 붙이고
   data.js 값 · Q(…) 인용 · 캡션을 그 보고서에 맞게 바꿔 쓴다. 런타임(D · chart · Q · scene)은 starter/src/app.js.
   PX · FIN은 예시 보고서(SNDK, 기준일 2026-10-26)의 숫자다. 다른 보고서에서는 반드시 그 보고서의 값으로 바꾼다. */

/* 00 — 두 갈래: 같은 출발점에서 나온 두 실행의 궤적이 에이전트 11개 관문을 지나며 벌어진다. */
const GATES = ["시장", "뉴스", "재무", "강세", "약세", "매니저", "트레이더", "공격", "보수", "중립", "최종"];
const GATE_OUT = {
  claude: ["보유 유지", "보유 유지", "보유 유지", "매수", "매도", "보유 유지", "보유 유지", "보유 유지", "보유 유지", "보유 유지", "보유 유지"],
  gpt: ["약세", "중립", "등급 없음", "강세", "약세", "비중 축소", "매도", "약세", "약세", "중립", "비중 축소"],
};
const SPREAD = [0.3, 0.2, 0.14, 0.1, 0.1, 0.62, 0.74, 0.82, 0.88, 0.94, 1];
scene({
  id: "s-open", len: 360, name: "두 갈래",
  beats: [
    { at: 0, tag: "TradingAgents · SNDK · 기준일 2026-10-26", plain: "같은 질문을 두 AI에게 따로 물었습니다. 종목, 날짜, 에이전트 11명, 데이터 창구까지 모두 같게.", q: { text: "보고서 머리말 — 분석 기준일 2026-10-26 · 분석가: 시장, 뉴스, 재무 · 리서치 토론 1라운드, 리스크 토론 1라운드" } },
    { at: 0.64, tag: "최종 등급", plain: "결론은 갈렸습니다. Claude는 '보유 유지', GPT는 '비중 축소'. AI가 만든 분석이며 투자 권유가 아닙니다.", q: { text: "최종 등급 — Claude: 보유 유지 · Hold / GPT: 비중 축소 · Underweight" } },
  ],
  draw(g, p) {
    const { G, m } = g;
    const head = Engine.reduce ? (p < 0.64 ? 0.62 : 1) : E.inOut(seg(p, 0.04, 0.62));
    // 축: 데스크톱은 왼쪽 → 오른쪽, 모바일은 위 → 아래.
    const A0 = m ? G.y + 30 : G.x + 70;
    const A1 = m ? G.y + G.h - 40 : G.x + G.w - 180;
    const mid = m ? G.x + G.w / 2 : G.y + G.h / 2;
    const span = m ? G.w * 0.36 : G.h * 0.4;
    const gA = (i) => lerp(A0 + (A1 - A0) * 0.08, A1, i / 10);
    const P = (a, c) => (m ? [c, a] : [a, c]);
    // 관문
    GATES.forEach((name, i) => {
      const a = gA(i);
      const passed = head * (A1 - A0) + A0 >= a - 2;
      const [x1, y1] = P(a, mid - span - 26);
      const [x2, y2] = P(a, mid + span + 26);
      D.line(g, x1, y1, x2, y2, { color: passed ? C_.line2 : C_.line, dash: [3, 6] });
      const [lx, ly] = m ? [G.x + 2, a + 4] : [a, G.y + G.h + 4];
      D.text(g, name, lx, ly, { px: 13, w: 700, fam: "mono", color: passed ? C_.ink2 : C_.ink3, align: m ? "left" : "center", base: m ? "middle" : "top" });
    });
    // 궤적
    const path = (run) => {
      const s = run === "claude" ? -1 : 1;
      const pts = [P(A0, mid)];
      const N = 18;
      let prevA = A0;
      let prevO = 0;
      SPREAD.forEach((sp, i) => {
        const a = gA(i);
        const o = s * sp * span;
        for (let k = 1; k <= N; k++) {
          const f = k / N;
          const e = (1 - Math.cos(Math.PI * f)) / 2;
          pts.push(P(lerp(prevA, a, f), mid + lerp(prevO, o, e)));
        }
        prevA = a;
        prevO = o;
      });
      return pts;
    };
    for (const run of ["claude", "gpt"]) {
      const pts = path(run);
      const col = RUNC[run];
      D.poly(g, pts, 1, { color: col, w: 1, alpha: 0.12 });
      const hd = D.poly(g, pts, head, { color: col, w: m ? 3 : 4, glow: 18 });
      // 꼬리 입자
      if (!Engine.reduce) {
        for (let i = 0; i < 26; i++) {
          const f = clamp(head - i * 0.006);
          const idx = Math.floor(f * (pts.length - 1));
          const pt = pts[idx];
          const j = Math.sin(g.t * 3 + i * 1.7) * (2 + i * 0.3);
          D.dot(g, pt[0] + (m ? j : 0), pt[1] + (m ? 0 : j), 2.2 - i * 0.07, { color: col, alpha: 0.6 - i * 0.02 });
        }
      }
      D.dot(g, hd[0], hd[1], m ? 6 : 8, { color: col, glow: 26 });
      // 지나간 관문의 등급
      SPREAD.forEach((sp, i) => {
        const a = gA(i);
        if (head * (A1 - A0) + A0 < a - 2) return;
        const s = run === "claude" ? -1 : 1;
        const o = s * sp * span;
        const [x, y] = P(a, mid + o);
        D.dot(g, x, y, 4, { color: col });
        if (!m || i >= 5) {
          const lab = GATE_OUT[run][i];
          const off = m ? -s * 12 : s * 16;
          D.text(g, lab, m ? x + off : x, m ? y + 4 : y + off + (s > 0 ? 12 : 0), {
            px: 13, w: 700, color: col, align: m ? (s < 0 ? "left" : "right") : "center", stroke: 4, alpha: i < 5 && !m ? 0.85 : 1,
          });
        }
      });
    }
    // 출발점
    const [sx, sy] = P(A0, mid);
    D.dot(g, sx, sy, 10, { color: C_.ink, glow: 24 });
    D.text(g, "SNDK · 2026-10-26", sx + (m ? 14 : 0), sy + (m ? 5 : -20), { px: m ? 14 : 16, w: 800, align: m ? "left" : "center", stroke: 5 });
    // 끝의 두 결론
    const v = Engine.reduce ? (p >= 0.64 ? 1 : 0) : E.out(seg(p, 0.6, 0.72));
    if (v > 0) {
      for (const run of ["claude", "gpt"]) {
        const s = run === "claude" ? -1 : 1;
        const [x, y] = P(A1, mid + s * span);
        const big = m ? 30 : 58;
        const tx = m ? (s < 0 ? G.x + 2 : G.x + G.w - 2) : x + 24;
        const ty = m ? y + 40 : y + (s < 0 ? -6 : 24);
        D.text(g, RUNS[run].rating, tx, ty, { px: big, w: 900, color: RUNC[run], alpha: v, glow: 30, align: m ? (s < 0 ? "left" : "right") : "left" });
        D.text(g, `${RUNS[run].name} · ${RUNS[run].ratingEn}`, tx, ty + (m ? 22 : 30), { px: m ? 13 : 16, w: 700, fam: "mono", color: C_.ink2, alpha: v, align: m ? (s < 0 ? "left" : "right") : "left" });
      }
    }
  },
});

/* 01 — 같은 가격표: 두 실행이 받은 스냅샷 숫자가 두 줄로 떨어져 같은 값끼리 '=' 로 이어진다. */
const SNAP = [
  ["종가", "1,255.58", "1,255.58"],
  ["10일 평균(EMA)", "1,355.00", "1,355.00"],
  ["50일 평균(SMA)", "1,585.74", "1,585.74"],
  ["RSI", "32.12", "32.12"],
  ["MACD", "-102.91", "-102.909"],
  ["ATR", "93.48", "93.48"],
];
scene({
  id: "s-same", len: 240, name: "같은 가격표",
  beats: [
    { at: 0, tag: "Claude · 시장 분석가", plain: "두 시장 분석가는 똑같은 가격표(검증 스냅샷)를 받았습니다.", q: Q("claude", "market", "모든 수치는 검증 스냅샷") },
    { at: 0.6, tag: "GPT · 시장 분석가", plain: "MACD만 소수 자리 표기가 다를 뿐, 숫자는 같습니다. 여기까지 입력은 같습니다.", q: Q("gpt", "market", "MACD는 -102.909") },
  ],
  draw(g, p) {
    const { G, m } = g;
    const rows = SNAP.length;
    const rh = G.h / rows;
    const colX = m ? [G.x + G.w * 0.3, G.x + G.w * 0.98] : [G.x + G.w * 0.46, G.x + G.w * 0.86];
    const labX = G.x + (m ? 0 : G.w * 0.04);
    D.text(g, "Claude", colX[0], G.y - 12, { px: 14, w: 800, fam: "mono", color: C_.c, align: "right" });
    D.text(g, "GPT", colX[1], G.y - 12, { px: 14, w: 800, fam: "mono", color: C_.g, align: "right" });
    SNAP.forEach(([k, a, b], i) => {
      const y = G.y + rh * (i + 0.7);
      const f = Engine.reduce ? 1 : E.stamp(seg(p, 0.03 + i * 0.07, 0.15 + i * 0.07));
      const drop = (1 - f) * -rh * 0.7;
      D.text(g, k, labX, y - (m ? 22 : 0), { px: m ? 13 : 16, w: 700, color: C_.ink3, alpha: f, fam: m ? "mono" : SANS });
      const px = m ? 24 : Math.min(54, rh * 0.62);
      D.text(g, a, colX[0], y + drop, { px, w: 900, color: C_.ink, alpha: f, align: "right" });
      D.text(g, b, colX[1], y + drop * 1.15, { px, w: 900, color: C_.ink, alpha: f, align: "right" });
      const eq = Engine.reduce ? 1 : seg(p, 0.12 + i * 0.07, 0.2 + i * 0.07);
      const ex = (colX[0] + colX[1]) / 2 - (m ? 50 : 40);
      const hot = i === 4 && p >= 0.6;
      D.text(g, hot ? "≈" : "=", m ? G.x + G.w * 0.52 : ex, y, { px: px * 0.8, w: 800, color: hot ? C_.amber : C_.ink3, alpha: eq, align: "center", glow: hot ? 16 : 0 });
      D.line(g, G.x, y + 14, G.x + G.w, y + 14, { color: C_.line, alpha: f });
      if (hot) D.rect(g, G.x - 8, y - px * 0.95, G.w + 16, px * 1.35, { stroke: C_.amber, sw: 2, r: 10, alpha: 0.9 });
    });
  },
});

/* 02 — 미끄러짐: 가격선이 화면을 가로질러 그려지고, 10일 · 50일 평균선이 천장처럼 내려와 머리 위에 걸린다. */
scene({
  id: "s-slide", len: 300, name: "천장 아래로",
  beats: [
    { at: 0, tag: "Claude · 시장 분석가", plain: "한 달 남짓 사이 가격이 1,887에서 1,255.58까지 미끄러졌습니다.", q: Q("claude", "market", "9월 22일 종가 1,887.04") },
    { at: 0.52, tag: "GPT · 시장 분석가", plain: "단기(10일)·중기(50일) 평균선이 모두 머리 위에 있습니다. 두 AI 모두 '추세는 약하다'고 봤습니다.", q: Q("gpt", "market", "2026-10-26 SNDK 종가는") },
  ],
  draw(g, p) {
    const { G, m } = g;
    D.grid(g);
    const R = { x: G.x + (m ? 6 : 20), y: G.y + 10, w: G.w - (m ? 70 : 230), h: G.h - 20 };
    const { X, Y } = chart(R, "2026-09-22", "2026-10-26", 1080, 1950);
    // 가격
    const pts = PX.closes.map((c) => [X(c.d), Y(c.v)]);
    const k = Engine.reduce ? 1 : E.inOut(seg(p, 0.02, 0.46));
    const hd = D.poly(g, pts, k, { color: C_.ink, w: m ? 3 : 5, glow: 22 });
    PX.closes.forEach((c, i) => {
      const passed = k >= i / (PX.closes.length - 1) - 0.01;
      if (!passed) return;
      const col = c.src === "both" ? C_.ink : RUNC[c.src];
      D.dot(g, pts[i][0], pts[i][1], 6, { color: col, glow: 14 });
      if (!m || i === 0 || i === 4) {
        const up = i === 0 || i === 1 || i === 4;
        D.text(g, `${c.d.slice(5)} ${fmt2(c.v)}`, pts[i][0] + (i === 4 ? -10 : 10), pts[i][1] + (up ? -14 : 26), { px: m ? 13 : 15, w: 700, fam: "mono", color: col, align: i === 4 ? "right" : "left", stroke: 5 });
      }
    });
    D.dot(g, hd[0], hd[1], 7, { color: C_.ink, glow: 30 });
    // 천장 두 개
    const ceil = [
      { v: PX.sma50, lab: "50일 평균 1,585.74", at: 0.54 },
      { v: PX.ema10, lab: "10일 평균 1,355.00", at: 0.62 },
    ];
    ceil.forEach((cl) => {
      const f = Engine.reduce ? (p >= 0.52 ? 1 : 0) : E.stamp(seg(p, cl.at, cl.at + 0.1));
      if (f <= 0) return;
      const yT = Y(cl.v);
      const y = lerp(G.y - 40, yT, f) + D.shake(g, 3 * (1 - seg(p, cl.at + 0.1, cl.at + 0.2)));
      D.rect(g, R.x, y - 6, R.w, 12, { color: "rgba(243,239,228,0.10)", r: 3 });
      D.line(g, R.x, y, R.x + R.w, y, { color: C_.ink2, w: 2 });
      for (let x = R.x + 10; x < R.x + R.w; x += 22) D.line(g, x, y - 6, x - 8, y - 14, { color: C_.ink3, alpha: 0.5 });
      D.text(g, cl.lab, m ? R.x + 4 : R.x + R.w + 12, m ? y - 10 : y + 5, { px: m ? 13 : 16, w: 800, fam: "mono", color: C_.ink, align: "left", stroke: m ? 5 : 0, alpha: f });
      if (!m) D.text(g, "천장", R.x + R.w + 12, y + 26, { px: 14, w: 700, color: C_.ink3, alpha: f });
    });
    if (p >= 0.66 && !m) {
      const end = pts[pts.length - 1];
      const a = Engine.reduce ? 1 : seg(p, 0.66, 0.74);
      D.arrow(g, end[0] - 30, end[1] - 14, end[0] - 30, Y(PX.ema10) + 16, { color: C_.amber, w: 2, alpha: a, head: 10 });
      D.text(g, "머리 위", end[0] - 40, (end[1] + Y(PX.ema10)) / 2, { px: 14, w: 800, color: C_.amber, align: "right", alpha: a, stroke: 4 });
    }
  },
});

/* 03 — RSI 바늘: 9월 말 50대에서 과매도 구간(30) 문턱까지 가라앉는다. */
scene({
  id: "s-rsi", len: 260, name: "RSI 바늘",
  beats: [
    { at: 0, tag: "Claude · 시장 분석가", plain: "RSI는 최근 오른 힘과 내린 힘을 0~100으로 잰 바늘입니다. 9월 말 50대에서 30 근처까지 떨어졌습니다.", q: Q("claude", "market", "RSI 32.12: 10월 16일") },
    { at: 0.56, tag: "GPT · 시장 분석가", plain: "30 아래는 '많이 팔렸다'는 구간. 하지만 두 AI 모두 '바닥이라는 뜻은 아니다'라고 했습니다.", q: Q("gpt", "market", "검증된 RSI는 32.12") },
  ],
  draw(g, p) {
    const { G, m } = g;
    const cx = G.x + G.w / 2;
    const cy = G.y + G.h * (m ? 0.86 : 0.96);
    // 바깥 라벨(눈금 숫자 · '9월 말 53~57')까지 HUD 아래, 화면 안에 들어오게 반지름을 잡는다.
    const R = Math.max(80, Math.min(G.w * (m ? 0.4 : 0.36), cy - G.y - (m ? 56 : 72)));
    const ang = (v) => Math.PI + (v / 100) * Math.PI;
    const c = g.ctx;
    const arc = (v0, v1, color, w, alpha = 1) => {
      c.save();
      c.strokeStyle = color;
      c.lineWidth = w;
      c.globalAlpha *= alpha;
      c.beginPath();
      c.arc(cx, cy, R, ang(v0), ang(v1));
      c.stroke();
      c.restore();
    };
    arc(0, 100, "rgba(243,239,228,0.12)", m ? 18 : 30);
    arc(0, 30, "rgba(255,74,74,0.55)", m ? 18 : 30);
    arc(70, 100, "rgba(130,151,255,0.45)", m ? 18 : 30);
    arc(PX.rsiSep[0], PX.rsiSep[1], "rgba(243,239,228,0.55)", m ? 18 : 30, 0.8);
    [0, 30, 50, 70, 100].forEach((v) => {
      const a = ang(v);
      D.line(g, cx + Math.cos(a) * (R - 26), cy + Math.sin(a) * (R - 26), cx + Math.cos(a) * (R + 22), cy + Math.sin(a) * (R + 22), { color: C_.ink3 });
      D.text(g, String(v), cx + Math.cos(a) * (R + 38), cy + Math.sin(a) * (R + 38) + 5, { px: 14, w: 700, fam: "mono", color: C_.ink3, align: "center" });
    });
    D.text(g, "과매도", cx + Math.cos(ang(14)) * (R - 52), cy + Math.sin(ang(14)) * (R - 52), { px: m ? 13 : 16, w: 800, color: C_.hot, align: "center" });
    const sepA = ang(55);
    D.text(g, "9월 말 53~57", cx + Math.cos(sepA) * (R + (m ? 44 : 60)) + (m ? 30 : 0), cy + Math.sin(sepA) * (R + (m ? 44 : 60)) - 6, { px: 13, w: 700, fam: "mono", color: C_.ink2, align: "center" });
    // 바늘: 57 → 29.69 → 32.12
    let v;
    if (Engine.reduce) v = PX.rsi;
    else {
      const a1 = E.reveal(seg(p, 0.06, 0.4));
      const a2 = E.out(seg(p, 0.42, 0.56));
      v = lerp(lerp(PX.rsiSep[1], PX.rsi1016, a1), PX.rsi, a2);
    }
    const a = ang(v);
    const low = v < 30.5;
    D.line(g, cx, cy, cx + Math.cos(a) * (R - 8), cy + Math.sin(a) * (R - 8), { color: low ? C_.hot : C_.ink, w: m ? 4 : 6, glow: 24 });
    D.dot(g, cx, cy, m ? 10 : 14, { color: C_.ink, glow: 12 });
    D.text(g, "32.12", cx + R * 0.3, cy - R * (m ? 0.06 : 0.16), { px: m ? 40 : 96, w: 900, color: C_.ink, align: "center", glow: 20 });
    D.text(g, "지금(10-26)", cx + R * 0.3, cy - R * (m ? 0.06 : 0.16) + (m ? 22 : 34), { px: m ? 13 : 15, w: 700, fam: "mono", color: C_.ink3, align: "center" });
    if (p >= 0.56) {
      const f = Engine.reduce ? 1 : seg(p, 0.56, 0.66);
      [[PX.rsi1016, "10-16 29.69"], [PX.rsi1023, "10-23 30.35"]].forEach(([val, lab], i) => {
        const aa = ang(val);
        D.dot(g, cx + Math.cos(aa) * R, cy + Math.sin(aa) * R, 6, { color: C_.amber, alpha: f, glow: 10 });
        D.text(g, lab, cx + Math.cos(aa) * (R - 46) + 8, cy + Math.sin(aa) * (R - 46) + (i ? 24 : 2), { px: 13, w: 700, fam: "mono", color: C_.amber, alpha: f, align: "left", stroke: 4 });
      });
    }
  },
});

/* 04 — MACD 낙하: 막대가 0선 아래로 내리꽂히고, 그다음 히스토그램이 짧아진다. */
scene({
  id: "s-macd", len: 260, name: "MACD 낙하",
  beats: [
    { at: 0, tag: "Claude · 시장 분석가", plain: "MACD는 단기 흐름에서 장기 흐름을 뺀 값. 10월 9일 +10.01에서 0 아래로 꺾여 -102.91까지 내려갔습니다.", q: Q("claude", "market", "MACD -102.91 / 시그널") },
    { at: 0.56, tag: "Claude · 시장 분석가", plain: "그래도 Claude는 '내려가는 속도는 줄고 있다'고 봤습니다. 히스토그램이 -49.06에서 -31.47로 짧아졌습니다.", q: Q("claude", "market", "히스토그램은 10월 16일") },
  ],
  draw(g, p) {
    const { G, m } = g;
    const z = G.y + G.h * 0.2;
    const s = (G.h * 0.74) / 110;
    const Yv = (v) => z - v * s;
    D.line(g, G.x, z, G.x + G.w, z, { color: C_.ink, w: 2 });
    D.text(g, "0", G.x, z - 10, { px: 14, w: 700, fam: "mono", color: C_.ink2 });
    const bw = m ? 46 : Math.min(120, G.w * 0.1);
    const xs = m ? [0.12, 0.3, 0.5].map((f) => G.x + G.w * f) : [0.1, 0.26, 0.44].map((f) => G.x + G.w * f);
    PX.macd.forEach((b, i) => {
      const f = Engine.reduce ? 1 : E.stamp(seg(p, i * 0.13 - 0.08, 0.04 + i * 0.13));
      const h = b.v * s * f;
      const col = b.v >= 0 ? "#7ee0a1" : C_.hot;
      D.rect(g, xs[i] - bw / 2, z, bw, -h, { color: col, r: 4, glow: i === 2 ? 26 : 8 });
      D.text(g, b.d, xs[i], z - 14 - Math.max(0, h), { px: 13, w: 700, fam: "mono", color: C_.ink3, align: "center" });
      if (f > 0.3) D.text(g, (b.v > 0 ? "+" : "") + b.v.toFixed(2), xs[i], z - h + (b.v < 0 ? 26 : -30), { px: i === 2 ? (m ? 18 : 30) : 15, w: 900, fam: "mono", color: col, align: "center", stroke: 5 });
      if (i === 2 && !Engine.reduce) {
        const imp = seg(p, 0.29, 0.36);
        if (imp > 0 && imp < 1) D.dot(g, xs[i], z - h, 20 + imp * 120, { fill: false, ring: C_.hot, ringW: 3, alpha: 1 - imp });
      }
    });
    // 시그널
    const sf = Engine.reduce ? 1 : seg(p, 0.34, 0.44);
    if (sf > 0) {
      D.line(g, xs[0] - bw, Yv(PX.signal), lerp(xs[0] - bw, xs[2] + bw, sf), Yv(PX.signal), { color: C_.amber, w: 2, dash: [8, 6] });
      D.text(g, "시그널 -71.44", xs[2] + bw * 0.7, Yv(PX.signal) - 8, { px: 14, w: 700, fam: "mono", color: C_.amber, alpha: sf, stroke: 4 });
    }
    // 히스토그램이 짧아진다
    const hf = Engine.reduce ? (p >= 0.56 ? 1 : 0) : seg(p, 0.56, 0.66);
    if (hf > 0) {
      const hx = m ? [0.74, 0.92] : [0.72, 0.86];
      const shrink = Engine.reduce ? 1 : E.inOut(seg(p, 0.64, 0.82));
      const hv = [PX.hist[0].v, lerp(PX.hist[0].v, PX.hist[1].v, shrink)];
      hv.forEach((v, i) => {
        const x = G.x + G.w * hx[i];
        D.rect(g, x - bw * 0.4, z, bw * 0.8, -v * s, { color: i ? "rgba(255,194,74,0.85)" : "rgba(255,194,74,0.35)", r: 4, alpha: hf });
        D.text(g, `${PX.hist[i].d}`, x, z - 12, { px: 13, w: 700, fam: "mono", color: C_.ink3, align: "center", alpha: hf });
        D.text(g, PX.hist[i].v.toFixed(2), x, z - v * s + 24, { px: m ? 14 : 18, w: 900, fam: "mono", color: C_.amber, align: "center", alpha: i ? hf * clamp(shrink * 2 - 1) : hf, stroke: 4 });
      });
      D.text(g, "히스토그램", G.x + G.w * ((hx[0] + hx[1]) / 2), z - 40, { px: 14, w: 800, color: C_.amber, align: "center", alpha: hf });
      if (shrink > 0.5) {
        const x = G.x + G.w * hx[1] + bw * 0.6;
        D.arrow(g, x, Yv(PX.hist[0].v), x, Yv(PX.hist[1].v), { color: C_.amber, w: 2, head: 10, alpha: seg(shrink, 0.5, 1) });
      }
    }
  },
});

/* 05 — 흔들림: 가격 1,255.58을 감싼 ±93.48 띠가 떨고, 1,229 손절선은 그 띠 안에 묻힌다. */
scene({
  id: "s-shake", len: 300, name: "하루 흔들림",
  beats: [
    { at: 0, tag: "Claude · 시장 분석가", plain: "이 주식은 하루 평균 93.48(가격의 약 7.4%)씩 흔들립니다.", q: Q("claude", "market", "ATR 93.48: 종가 대비") },
    { at: 0.5, tag: "Claude · 약세 연구원", plain: "그래서 1,229에 손절을 걸면(약 2% 아래) 평범한 하루에도 걸린다는 반박이 나왔습니다.", q: Q("claude", "bear", "종가 1,255에서 1,229까지") },
  ],
  draw(g, p) {
    const { G, m } = g;
    D.grid(g, 0.6);
    const v0 = 1100;
    const v1 = 1410;
    const Y = (v) => G.y + (1 - (v - v0) / (v1 - v0)) * G.h;
    const x0 = G.x + (m ? 0 : 20);
    const x1 = G.x + G.w - (m ? 0 : 230);
    const amp = Engine.reduce ? 0 : 2 + 6 * seg(p, 0.05, 0.3);
    const bt = Y(PX.close + PX.atr) + D.shake(g, amp, 1);
    const bb = Y(PX.close - PX.atr) + D.shake(g, amp, 1.3);
    const bf = Engine.reduce ? 1 : E.out(seg(p, 0.02, 0.18));
    D.rect(g, x0, bt, (x1 - x0) * bf, bb - bt, { color: "rgba(255,194,74,0.13)" });
    D.line(g, x0, bt, x0 + (x1 - x0) * bf, bt, { color: C_.amber, w: 2, alpha: 0.9 });
    D.line(g, x0, bb, x0 + (x1 - x0) * bf, bb, { color: C_.amber, w: 2, alpha: 0.9 });
    D.text(g, "+93.48", x1 + (m ? -4 : 12), bt + 5, { px: m ? 14 : 18, w: 800, fam: "mono", color: C_.amber, align: m ? "right" : "left", stroke: m ? 4 : 0 });
    D.text(g, "-93.48", x1 + (m ? -4 : 12), bb + 5, { px: m ? 14 : 18, w: 800, fam: "mono", color: C_.amber, align: m ? "right" : "left", stroke: m ? 4 : 0 });
    if (!m) D.text(g, "하루 평균 흔들림 · 가격의 약 7.4%", x1 + 12, (bt + bb) / 2 + 30, { px: 14, w: 700, color: C_.ink2 });
    // 종가 선
    D.line(g, x0, Y(PX.close), x1, Y(PX.close), { color: C_.ink, w: 2, dash: [2, 6] });
    lineLabel(g, "종가 1,255.58", x1 - 4, Y(PX.close), C_.ink, { align: "right" });
    // 예시 흔들림 선(데이터가 아님): 띠 안에서 움직인다
    const runK = Engine.reduce ? 1 : seg(p, 0.1, 0.92);
    const N = 160;
    const pts = [];
    let below = [];
    for (let i = 0; i <= N; i++) {
      const f = i / N;
      const w = Math.sin(f * 19.3) * 0.55 + Math.sin(f * 41.7 + 1.1) * 0.3 + Math.sin(f * 7.1 + 2.3) * 0.35;
      const v = PX.close + w * PX.atr * 0.62;
      pts.push([x0 + f * (x1 - x0), Y(v)]);
      if (v < PX.stopBull) below.push(i);
    }
    D.poly(g, pts, runK, { color: C_.ink2, w: 2, alpha: 0.9 });
    D.text(g, "평범한 하루의 흔들림(예시)", x0 + 6, bt - 12, { px: 13, w: 600, color: C_.ink3 });
    // 1,229 손절선과 1,135
    const sf = Engine.reduce ? (p >= 0.5 ? 1 : 0) : seg(p, 0.5, 0.58);
    if (sf > 0) {
      const ys = Y(PX.stopBull);
      D.line(g, x0, ys, x1, ys, { color: C_.hot, w: 3, alpha: sf, glow: 14 });
      lineLabel(g, "강세 측 손절 1,229", x0 + 8, ys + 24, C_.hot, { align: "left", alpha: sf });
      const yb = Y(PX.bollLo);
      D.line(g, x0, yb, x1, yb, { color: C_.ink3, w: 1, dash: [6, 6], alpha: sf });
      lineLabel(g, "볼린저 하단 1,135.47", x0 + 8, yb + 24, C_.ink2, { align: "left", alpha: sf });
      // 걸리는 순간들
      let last = -9;
      below.forEach((i) => {
        if (i / N > runK || i - last < 6) return;
        last = i;
        const [x, y] = pts[i];
        const pulse = Engine.reduce ? 0 : (Math.sin(g.t * 6 + i) + 1) / 2;
        D.dot(g, x, y, 6 + pulse * 4, { color: C_.hot, alpha: sf, glow: 16 });
        D.text(g, "손절", x, y + 26, { px: 13, w: 800, color: C_.hot, align: "center", alpha: sf, stroke: 4 });
      });
    }
  },
});

/* 06 — 바닥: Claude만 그은 200일 평균선이 매일 올라오고, 가격이 그 위에 아슬아슬하게 선다. */
scene({
  id: "s-floor", len: 300, name: "200일선 바닥",
  beats: [
    { at: 0, tag: "Claude · 시장 분석가", plain: "Claude는 선을 하나 더 그었습니다. 매일 올라오는 200일 평균선. 가격이 바로 그 위(약 15p)에 서 있습니다.", q: Q("claude", "market", "200일 SMA 1,240.94") },
    { at: 0.55, tag: "Claude · 시장 분석가", plain: "장중에는 1,229까지 밀려 선 아래를 찍었지만 종가는 다시 위로. Claude는 이 자리를 '결정 구간'이라 불렀습니다. GPT는 이 선을 보지 않았습니다.", q: Q("claude", "market", "10월 26일 저가 1,229.00") },
  ],
  draw(g, p) {
    const { G, m } = g;
    D.grid(g, 0.6);
    const R = { x: G.x + (m ? 0 : 20), y: G.y, w: G.w - (m ? 0 : 230), h: G.h };
    const { X, Y } = chart(R, "2026-09-28", "2026-10-27", 1080, 1330);
    const fk = Engine.reduce ? 1 : E.inOut(seg(p, 0.03, 0.3));
    const fl = PX.sma200.map((s) => [X(s.d), Y(s.v)]);
    // 바닥 판: 선 아래를 채운다
    const c = g.ctx;
    c.save();
    c.beginPath();
    c.moveTo(fl[0][0], R.y + R.h);
    fl.forEach(([x, y]) => c.lineTo(x, y));
    c.lineTo(fl[fl.length - 1][0], R.y + R.h);
    c.closePath();
    const grd = c.createLinearGradient(0, R.y + R.h * 0.4, 0, R.y + R.h);
    grd.addColorStop(0, "rgba(255,148,102,0.30)");
    grd.addColorStop(1, "rgba(255,148,102,0)");
    c.fillStyle = grd;
    c.globalAlpha = fk;
    c.fill();
    c.restore();
    D.poly(g, fl, fk, { color: C_.c, w: m ? 5 : 8, glow: 26 });
    lineLabel(g, "200일 평균 1,115 → 1,240.94", fl[0][0] + 8, fl[0][1] - 4, C_.c, { align: "left", alpha: fk });
    D.text(g, "바닥 · Claude만 그은 선", R.x + R.w * 0.42, Y(1180) + 34, { px: m ? 14 : 18, w: 800, color: C_.c, alpha: fk, stroke: 5 });
    // 가격 점 세 개
    const pk = Engine.reduce ? 1 : E.inOut(seg(p, 0.2, 0.45));
    const pts = PX.closes.slice(2).map((cl) => [X(cl.d), Y(cl.v)]);
    D.poly(g, pts, pk, { color: C_.ink, w: 3, glow: 14 });
    PX.closes.slice(2).forEach((cl, i) => {
      if (pk < i / 2 - 0.01) return;
      D.dot(g, pts[i][0], pts[i][1], 6, { color: C_.ink });
      if (i < 2) D.text(g, `${cl.d.slice(5)} ${fmt2(cl.v)}`, pts[i][0] - 8, pts[i][1] - 14, { px: 13, w: 700, fam: "mono", color: C_.ink2, align: "right", stroke: 4 });
    });
    // 마지막 점: 장중 1,229로 빠졌다가 종가 1,255.58로
    const end = pts[2];
    const wick = Engine.reduce ? (p >= 0.55 ? 1 : 0) : seg(p, 0.55, 0.85);
    if (pk >= 1) {
      const dip = wick > 0 ? Math.sin(Math.PI * clamp(wick * 1.4)) : 0;
      const yNow = lerp(end[1], Y(PX.low1026), dip);
      if (wick > 0) {
        D.line(g, end[0], end[1], end[0], Y(PX.low1026), { color: C_.ink2, w: 2, dash: [3, 4], alpha: clamp(wick * 3) });
        D.text(g, "장중 저가 1,229.00", end[0] - 12, Y(PX.low1026) + 22, { px: 13, w: 700, fam: "mono", color: C_.hot, align: "right", alpha: clamp(wick * 3), stroke: 4 });
      }
      const under = yNow > Y(1240.94);
      D.dot(g, end[0], yNow, m ? 9 : 12, { color: under ? C_.hot : C_.ink, glow: 28 });
      D.text(g, "1,255.58", end[0] + 14, yNow - 10, { px: m ? 16 : 22, w: 900, fam: "mono", color: C_.ink, stroke: 5 });
      // 약 15p
      const gx = end[0] + (m ? -16 : 18);
      D.line(g, gx, Y(PX.close), gx, Y(1240.94), { color: C_.amber, w: 2 });
      D.text(g, "약 15p", gx + (m ? -6 : 8), (Y(PX.close) + Y(1240.94)) / 2 + 5, { px: 14, w: 800, color: C_.amber, align: m ? "right" : "left", stroke: 4 });
    }
  },
});

/* 07 — 다른 선 하나: 같은 가격을 Claude는 '바닥 위'로, GPT는 '천장 셋 아래'로 본다. */
scene({
  id: "s-split", len: 300, name: "다른 선 하나",
  beats: [
    { at: 0, tag: "GPT · 시장 분석가", plain: "GPT는 대신 거래량 평균선(VWMA 1,417.67)을 그었습니다. 가격 위에 천장이 하나 더 생겼습니다.", q: Q("gpt", "market", "VWMA는 1,417.67") },
    { at: 0.52, tag: "Claude · 시장 분석가", plain: "같은 숫자, 다른 선 하나. Claude는 '결정 구간 · 보유 유지', GPT는 '모든 평균 아래 · 약세'로 첫 등급부터 갈렸습니다.", q: Q("claude", "market", "가격은 상승 중인 200SMA") },
  ],
  draw(g, p) {
    const { G, m } = g;
    const halves = m
      ? [{ x: G.x, y: G.y, w: G.w, h: G.h / 2 - 10 }, { x: G.x, y: G.y + G.h / 2 + 10, w: G.w, h: G.h / 2 - 10 }]
      : [{ x: G.x, y: G.y, w: G.w / 2 - 30, h: G.h }, { x: G.x + G.w / 2 + 30, y: G.y, w: G.w / 2 - 30, h: G.h }];
    const runs = ["claude", "gpt"];
    halves.forEach((H, i) => {
      const run = runs[i];
      const col = RUNC[run];
      const Y = (v) => H.y + 28 + (1 - (v - 1180) / (1660 - 1180)) * (H.h - 40);
      D.rect(g, H.x, H.y, H.w, H.h, { stroke: C_.line2, r: 14 });
      D.text(g, `${RUNS[run].name}가 그은 선`, H.x + 16, H.y + 24, { px: 14, w: 800, fam: "mono", color: col });
      const lines = [
        { v: PX.sma50, lab: "50일 1,585.74", col: C_.ink2 },
        { v: PX.ema10, lab: "10일 1,355.00", col: C_.ink2 },
      ];
      if (run === "gpt") lines.push({ v: PX.vwma, lab: "VWMA 1,417.67", col: C_.g, drop: true });
      if (run === "claude") lines.push({ v: 1240.94, lab: "200일 1,240.94", col: C_.c, floor: true });
      lines.forEach((ln) => {
        let f = 1;
        if (ln.drop) f = Engine.reduce ? 1 : E.stamp(seg(p, 0.08, 0.2));
        const y = ln.drop ? lerp(H.y - 20, Y(ln.v), f) + D.shake(g, 4 * (1 - seg(p, 0.2, 0.3))) : Y(ln.v);
        if (f <= 0) return;
        D.line(g, H.x + 14, y, H.x + H.w - 14, y, { color: ln.col, w: ln.drop || ln.floor ? 4 : 2, glow: ln.drop || ln.floor ? 18 : 0 });
        const below = run === "gpt" && ln.v === PX.ema10;
        D.text(g, ln.lab, H.x + H.w - 16, below ? y + 18 : y - 8, { px: 13, w: 700, fam: "mono", color: ln.col, align: "right", stroke: 4 });
      });
      const px = H.x + H.w * 0.42;
      D.dot(g, px, Y(PX.close), m ? 8 : 11, { color: C_.ink, glow: 26 });
      D.text(g, "1,255.58", px - 14, Y(PX.close) + 5, { px: m ? 14 : 16, w: 800, fam: "mono", align: "right", stroke: 4 });
      // 판정 도장
      const sf = Engine.reduce ? (p >= 0.52 ? 1 : 0) : E.stamp(seg(p, 0.55 + i * 0.08, 0.65 + i * 0.08));
      if (sf > 0) {
        const lab = run === "claude" ? "보유 유지" : "약세";
        const sub = run === "claude" ? "결정 구간 · 바닥 위" : "모든 평균 아래";
        const bx = m ? H.x + 18 : H.x + H.w * 0.42 + 30;
        const by = m ? H.y + 82 : H.y + H.h * 0.72;
        const scale = 1.3 - 0.3 * sf;
        g.ctx.save();
        g.ctx.translate(bx, by);
        g.ctx.scale(scale, scale);
        D.rect(g, -6, -38, (m ? 120 : 190), m ? 52 : 64, { color: "rgba(4,4,5,0.85)", stroke: col, sw: 2, r: 10, alpha: sf });
        D.text(g, lab, 8, m ? -10 : -6, { px: m ? 20 : 30, w: 900, color: col, alpha: sf });
        D.text(g, sub, 8, m ? 8 : 18, { px: 13, w: 700, color: C_.ink2, alpha: sf });
        g.ctx.restore();
      }
    });
  },
});

/* 08 — 실적 폭발: 분기 매출 기둥이 솟고, 이익률 고리가 채워진다. */
scene({
  id: "s-boom", len: 260, name: "실적 폭발",
  beats: [
    { at: 0, tag: "Claude · 재무 분석가", plain: "회사 실적은 폭발했습니다. 분기 매출이 2,308 → 3,025 → 5,950(백만 달러).", q: Q("claude", "fundamentals", "매출이 2025-10 분기") },
    { at: 0.52, tag: "Claude · 재무 분석가", plain: "100을 팔면 69가 이익으로 남는 수준. 두 AI 모두 이 숫자는 그대로 인정했습니다.", q: Q("claude", "fundamentals", "매출총이익률 22~30%대에서") },
  ],
  draw(g, p) {
    const { G, m } = g;
    const base = G.y + G.h;
    const max = 5950;
    const bw = m ? 64 : Math.min(160, G.w * 0.13);
    const xs = (m ? [0.18, 0.5, 0.82] : [0.14, 0.32, 0.5]).map((f) => G.x + G.w * f);
    FIN.rev.forEach((r, i) => {
      const f = Engine.reduce ? 1 : E.stamp(seg(p, 0.04 + i * 0.1, 0.18 + i * 0.1));
      const h = (r.v / max) * G.h * (m ? 0.6 : 0.82) * f;
      const col = i === 2 ? "rgba(255,90,42,0.95)" : "rgba(243,239,228,0.85)";
      D.rect(g, xs[i] - bw / 2, base, bw, -h, { color: col, r: 6, glow: i === 2 ? 30 : 0 });
      D.text(g, r.q, xs[i], base + 22, { px: 13, w: 700, fam: "mono", color: C_.ink3, align: "center" });
      D.text(g, fmt0(r.v), xs[i], base - h - 14, { px: m ? 20 : 34, w: 900, fam: "mono", color: C_.ink, align: "center", alpha: clamp(f) });
      if (i === 2 && f > 0.6 && !Engine.reduce) {
        for (let k = 0; k < 18; k++) {
          const a = -Math.PI / 2 + Math.sin(k * 2.1) * 0.9;
          const life = (g.t * 0.6 + k * 0.13) % 1;
          D.dot(g, xs[i] + Math.cos(a) * life * 90, base - h + Math.sin(a) * life * 90, 2.4 * (1 - life), { color: "#ff8a5c", alpha: 1 - life });
        }
      }
    });
    // 이익률 고리
    const rf = Engine.reduce ? (p >= 0.52 ? 1 : 0) : seg(p, 0.52, 0.62);
    if (rf > 0) {
      const vals = [29.8, 50.9, 78.4];
      const cx0 = m ? null : G.x + G.w * 0.66;
      vals.forEach((v, i) => {
        const r = m ? 30 : 46;
        const cx = m ? xs[i] : cx0 + i * (r * 2 + 24);
        const cy = m ? G.y + 40 : G.y + G.h * 0.28;
        const fill = Engine.reduce ? 1 : E.out(seg(p, 0.54 + i * 0.06, 0.68 + i * 0.06));
        const c = g.ctx;
        c.save();
        c.lineWidth = m ? 7 : 10;
        c.strokeStyle = "rgba(243,239,228,0.12)";
        c.beginPath();
        c.arc(cx, cy, r, 0, Math.PI * 2);
        c.stroke();
        c.strokeStyle = i === 2 ? "#ff8a5c" : C_.ink2;
        c.shadowColor = c.strokeStyle;
        c.shadowBlur = i === 2 ? 18 : 0;
        c.beginPath();
        c.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (v / 100) * fill);
        c.stroke();
        c.restore();
        D.text(g, FIN.gm3[i], cx, cy + 6, { px: m ? 13 : 17, w: 900, fam: "mono", align: "center", alpha: rf });
      });
      if (!m) {
        D.text(g, "매출총이익률", cx0 - 46, G.y + G.h * 0.28 - 70, { px: 14, w: 700, color: C_.ink3, alpha: rf });
        D.text(g, `영업이익률 ${FIN.opm}`, cx0 - 46, G.y + G.h * 0.62, { px: 44, w: 900, color: "#ff8a5c", alpha: rf, glow: 20 });
        D.text(g, "100을 팔면 69가 남는다", cx0 - 46, G.y + G.h * 0.62 + 34, { px: 16, w: 700, color: C_.ink2, alpha: rf });
      } else {
        D.text(g, `영업이익률 ${FIN.opm}`, G.x + G.w / 2, G.y + 104, { px: 22, w: 900, color: "#ff8a5c", align: "center", alpha: rf });
      }
    }
  },
});

/* 09 — 산맥과 분화구: 8개 분기 이익률이 산이 되고, 꼭대기 78.4%가 경고등처럼 깜박인다. */
scene({
  id: "s-cycle", len: 260, name: "꼭대기 경고",
  beats: [
    { at: 0, tag: "Claude · 재무 분석가", plain: "메모리는 값이 치솟았다 무너지기를 반복하는 산업. 78%는 업계에서도 이례적인 높이입니다.", q: Q("claude", "fundamentals", "주의: 78% 수준의") },
    { at: 0.52, tag: "Claude · 약세 연구원", plain: "2025년 3월 분기에는 영업손실 1,881을 냈던 회사입니다. 둘 다 '지금이 꼭대기일 수 있다'고 경고했습니다.", q: Q("claude", "bear", "이 종목은 2025-03 분기에") },
  ],
  draw(g, p) {
    const { G, m } = g;
    const n = FIN.gm.length;
    const X = (i) => (m ? G.x + 28 + (i / (n - 1)) * (G.w - 76) : G.x + (i / (n - 1)) * G.w * 0.78);
    const top = G.y + 30;
    const zero = G.y + G.h * 0.66;
    const Ym = (v) => zero - (v / 80) * (zero - top);
    const k = Engine.reduce ? 1 : E.inOut(seg(p, 0.03, 0.42));
    const pts = FIN.gm.map((q, i) => [X(i), Ym(q.v)]);
    const c = g.ctx;
    c.save();
    c.beginPath();
    c.moveTo(pts[0][0], zero);
    const lim = pts[0][0] + (pts[n - 1][0] - pts[0][0]) * k;
    pts.forEach(([x, y]) => {
      if (x <= lim + 0.5) c.lineTo(x, y);
    });
    c.lineTo(Math.min(lim, pts[n - 1][0]), zero);
    c.closePath();
    const grd = c.createLinearGradient(0, top, 0, zero);
    grd.addColorStop(0, "rgba(255,138,92,0.55)");
    grd.addColorStop(1, "rgba(255,138,92,0.04)");
    c.fillStyle = grd;
    c.fill();
    c.restore();
    D.poly(g, pts, k, { color: "#ff8a5c", w: 3, glow: 16 });
    D.line(g, G.x, zero, G.x + G.w * (m ? 1 : 0.78), zero, { color: C_.line2 });
    FIN.gm.forEach((q, i) => {
      if (X(i) > lim + 1) return;
      D.text(g, `${q.v}%`, X(i), Ym(q.v) - 12, { px: 13, w: 700, fam: "mono", color: i === n - 1 ? "#ff8a5c" : C_.ink2, align: "center", stroke: 4 });
      if (!m || i % 2 === 1 || i === n - 1) D.text(g, q.q, X(i), zero + 20, { px: 13, w: 600, fam: "mono", color: C_.ink3, align: "center" });
    });
    if (k >= 1) {
      const [px, py] = pts[n - 1];
      const pulse = Engine.reduce ? 0.5 : (Math.sin(g.t * 5) + 1) / 2;
      D.dot(g, px, py, 10 + pulse * 18, { fill: false, ring: C_.amber, ringW: 2, alpha: 1 - pulse * 0.6 });
      D.dot(g, px, py, 7, { color: C_.amber, glow: 24 });
      if (!m) D.text(g, "78.4% · 이례적인 꼭대기", px + 22, py + 5, { px: 18, w: 900, color: C_.amber });
      // 되돌아올 수 있는 길(점선)
      D.poly(g, [[px, py], [px + (m ? 0 : G.w * 0.1), lerp(py, zero, 0.5)], [px + (m ? 0 : G.w * 0.2), lerp(py, zero, 0.8)]], 1, { color: C_.amber, w: 2, dash: [6, 8], alpha: m ? 0 : 0.7 });
    }
    // 영업이익 분화구
    const cf = Engine.reduce ? (p >= 0.52 ? 1 : 0) : seg(p, 0.52, 0.66);
    if (cf > 0) {
      const scale = (G.y + G.h - zero - 30) / 1881;
      FIN.gm.forEach((q, i) => {
        if (q.op >= 0) return;
        const h = -q.op * scale * cf;
        D.rect(g, X(i) - 14, zero + 30, 28, h, { color: q.op < -1000 ? C_.hot : "rgba(255,74,74,0.45)", r: 3, glow: q.op < -1000 ? 20 : 0 });
        if (q.op < -1000) D.text(g, `영업손실 ${fmt0(q.op)}`, X(i) + 22, zero + 30 + h * 0.7, { px: m ? 14 : 18, w: 900, fam: "mono", color: C_.hot, alpha: cf, stroke: 4 });
      });
    }
  },
});

/* 10 — 부풀어 오른 빚: 한 분기 사이 총부채 기둥은 두 배로, 현금 기둥은 조금만 자란다. */
scene({
  id: "s-debt", len: 240, name: "두 배가 된 빚",
  beats: [
    { at: 0, tag: "Claude · 재무 분석가", plain: "그런데 2026-07 분기, 빚이 한 분기 만에 두 배가 됐습니다.", q: Q("claude", "fundamentals", "2026-07 분기 총부채가") },
    { at: 0.52, tag: "Claude · 보수적 리스크 분석가", plain: "빚은 3,473 늘었는데 현금은 1,027 늘었을 뿐. 왜 늘었는지는 두 AI 모두 데이터로 확인하지 못했습니다.", q: Q("claude", "conservative", "총부채는 3,298에서") },
  ],
  draw(g, p) {
    const { G, m } = g;
    const base = G.y + G.h;
    const max = 6771;
    const H = G.h * (m ? 0.72 : 0.84);
    const bw = m ? 70 : Math.min(170, G.w * 0.14);
    const grow = Engine.reduce ? 1 : E.inOut(seg(p, 0.08, 0.4));
    const items = [
      { lab: "총부채", a: FIN.debt[0], b: FIN.debt[1], col: C_.hot, x: G.x + G.w * (m ? 0.28 : 0.26) },
      { lab: "현금", a: FIN.cash[0], b: FIN.cash[1], col: C_.ink, x: G.x + G.w * (m ? 0.72 : 0.5) },
    ];
    items.forEach((it) => {
      const v = lerp(it.a, it.b, grow);
      const h = (v / max) * H;
      const h0 = (it.a / max) * H;
      D.rect(g, it.x - bw / 2, base, bw, -h0, { stroke: C_.line2, sw: 1, r: 6, dash: [4, 4] });
      D.rect(g, it.x - bw / 2, base, bw, -h, { color: it.col === C_.hot ? "rgba(255,74,74,0.75)" : "rgba(243,239,228,0.75)", r: 6, glow: it.col === C_.hot ? 22 : 0 });
      D.text(g, it.lab, it.x, base + 24, { px: 15, w: 800, color: C_.ink2, align: "center" });
      D.text(g, fmt0(grow >= 1 ? it.b : it.a), it.x, base - h - 14, { px: m ? 20 : 32, w: 900, fam: "mono", color: it.col, align: "center", alpha: grow > 0 && grow < 1 ? 0.35 : 1 });
      D.text(g, `2026-04 ${fmt0(it.a)}`, it.x, base - h0 + 18, { px: 13, w: 700, fam: "mono", color: C_.ink3, align: "center", alpha: grow > 0.3 ? 1 : 0 });
    });
    const df = Engine.reduce ? (p >= 0.52 ? 1 : 0) : E.stamp(seg(p, 0.52, 0.64));
    if (df > 0) {
      if (!m) {
        D.text(g, `+${fmt0(FIN.debtUp)}`, G.x + G.w * 0.72, G.y + G.h * 0.36, { px: 68, w: 900, fam: "mono", color: C_.hot, alpha: df, glow: 24 });
        D.text(g, "빚이 늘어난 만큼", G.x + G.w * 0.72, G.y + G.h * 0.36 + 32, { px: 15, w: 700, color: C_.ink2, alpha: df });
        D.text(g, `+${fmt0(FIN.cashUp)}`, G.x + G.w * 0.72, G.y + G.h * 0.66, { px: 48, w: 900, fam: "mono", color: C_.ink, alpha: df });
        D.text(g, "현금은 이만큼만", G.x + G.w * 0.72, G.y + G.h * 0.66 + 28, { px: 15, w: 700, color: C_.ink2, alpha: df });
      } else {
        D.text(g, `빚 +${fmt0(FIN.debtUp)}  ·  현금 +${fmt0(FIN.cashUp)}`, G.x + G.w / 2, G.y + 18, { px: 17, w: 900, fam: "mono", color: C_.hot, align: "center", alpha: df });
      }
      const pulse = Engine.reduce ? 0 : Math.sin(g.t * 4) * 4;
      D.text(g, "왜?", items[0].x, base - (FIN.debt[1] / max) * H - (m ? 46 : 64) + pulse, { px: m ? 22 : 34, w: 900, color: C_.amber, align: "center", alpha: df });
    }
  },
});

/* 11 — 힘 겨루기: 1,255.58 판을 강세 화살표가 밀어 올리고 약세 화살표가 눌러 내리다, 위아래 ±20%가 같은 길이로 맞선다. */
scene({
  id: "s-forces", len: 340, name: "강세 대 약세",
  beats: [
    { at: 0, tag: "Claude · 강세 연구원", plain: "강세: '실적이 폭발하는 동안 주가는 33% 빠졌다. 지금이 기회다.'", q: Q("claude", "bull", "실적과 현금흐름이 폭증하던") },
    { at: 0.34, tag: "Claude · 약세 연구원", plain: "약세: '가장 좋았던 한 분기를 평소 이익으로 착각하지 마라.'", q: Q("claude", "bear", "단일 분기 EPS 23.03") },
    { at: 0.66, tag: "Claude · 약세 연구원", plain: "결정타: 오를 폭(1,508, 약 +20%)과 내릴 폭(998, 약 -20%)이 똑같다. 걸 이유가 없다.", q: Q("claude", "bear", "강세론의 상방 목표") },
  ],
  draw(g, p) {
    const { G, m } = g;
    const cx = G.x + G.w * (m ? 0.5 : 0.42);
    const cy = G.y + G.h / 2;
    const bw = m ? G.w * 0.7 : G.w * 0.46;
    const bullF = Engine.reduce ? (p >= 0 ? 1 : 0) : seg(p, 0.03, 0.3);
    const bearF = Engine.reduce ? (p >= 0.34 ? 1 : 0) : seg(p, 0.36, 0.62);
    const symF = Engine.reduce ? (p >= 0.66 ? 1 : 0) : E.out(seg(p, 0.68, 0.86));
    const tilt = (0.08 * bullF - 0.08 * bearF) * (1 - symF);
    const lift = (-26 * bullF + 26 * bearF) * (1 - symF);
    // 판
    g.ctx.save();
    g.ctx.translate(cx, cy + lift + D.shake(g, 1.5 * (1 - symF)));
    g.ctx.rotate(-tilt);
    D.rect(g, -bw / 2, -9, bw, 18, { color: "rgba(243,239,228,0.92)", r: 9, glow: 20 });
    D.text(g, "1,255.58", 0, -20, { px: m ? 18 : 26, w: 900, fam: "mono", align: "center" });
    g.ctx.restore();
    const BULL = ["주가 약 33% 하락 = 기회", "200일선 위 종가", "FCF 약 44억 달러"];
    const BEAR = ["정점 분기를 영구 이익으로", "부채 두 배", "손절 2% < 흔들림 7.4%"];
    if (symF < 1) {
      BULL.forEach((t, i) => {
        const f = clamp(bullF * 3 - i) * (1 - symF);
        if (f <= 0) return;
        const x = cx + (i - 1) * bw * 0.36;
        D.arrow(g, x, cy + G.h * (m ? 0.34 : 0.44), x, cy + 26 + lift, { color: C_.bull, w: m ? 4 : 6, glow: 14, alpha: f, head: 18 });
        D.text(g, t, m ? G.x + G.w / 2 : x, cy + G.h * (m ? 0.34 : 0.44) + 20 + (m ? i * 18 : 0), { px: m ? 13 : 15, w: 800, color: C_.bull, align: "center", alpha: f, stroke: 4 });
      });
      BEAR.forEach((t, i) => {
        const f = clamp(bearF * 3 - i) * (1 - symF);
        if (f <= 0) return;
        const x = cx + (i - 1) * bw * 0.36;
        D.arrow(g, x, cy - G.h * (m ? 0.34 : 0.44), x, cy - 30 + lift, { color: C_.bear, w: m ? 4 : 6, glow: 14, alpha: f, head: 18 });
        D.text(g, t, m ? G.x + G.w / 2 : x, cy - G.h * (m ? 0.34 : 0.44) - 10 - (m ? (2 - i) * 18 : 0), { px: m ? 13 : 15, w: 800, color: C_.bear, align: "center", alpha: f, stroke: 4 });
      });
    }
    if (symF > 0) {
      const L = G.h * 0.4 * symF;
      const ax = cx + bw / 2 + (m ? -20 : 60);
      D.arrow(g, ax, cy - 12, ax, cy - 12 - L, { color: C_.bull, w: 5, glow: 16, head: 18 });
      D.arrow(g, ax, cy + 12, ax, cy + 12 + L, { color: C_.bear, w: 5, glow: 16, head: 18 });
      const tx = ax + (m ? -14 : 18);
      D.text(g, "1,508 · 약 +20%", tx, cy - 12 - L + 6, { px: m ? 14 : 20, w: 900, fam: "mono", color: C_.bull, align: m ? "right" : "left", alpha: symF, stroke: 4 });
      D.text(g, "998 · 약 -20%", tx, cy + 12 + L + 6, { px: m ? 14 : 20, w: 900, fam: "mono", color: C_.bear, align: m ? "right" : "left", alpha: symF, stroke: 4 });
      if (!m) D.text(g, "같은 길이 = 걸 이유가 없다", ax + 18, cy + 6, { px: 18, w: 900, color: C_.ink, alpha: symF });
    }
  },
});

/* 12 — 두 저울: 둘 다 약세 쪽으로 기울고, Claude 저울은 잠기고 GPT 저울은 더 기운다. */
scene({
  id: "s-scales", len: 320, name: "두 매니저",
  beats: [
    { at: 0, tag: "Claude · 리서치 매니저", plain: "두 매니저 모두 약세 쪽으로 조금 기울었습니다.", q: Q("claude", "manager", "다만 최근 추세와") },
    { at: 0.36, tag: "Claude · 리서치 매니저", plain: "Claude: '실적이 며칠 뒤 나온다. 그 전에 움직이면 정보가 아니라 이벤트에 거는 것.' 그래서 멈춤.", q: Q("claude", "manager", "그 전에 어느 쪽으로든") },
    { at: 0.68, tag: "GPT · 리서치 매니저", plain: "GPT: '지속될지 확인되기 전에는 노출을 줄인다.' 그래서 지금 줄임.", q: Q("gpt", "manager", "펀더멘털 개선을 부정하거나") },
  ],
  draw(g, p) {
    const { G, m } = g;
    const lean = Engine.reduce ? 1 : E.out(seg(p, 0.04, 0.3));
    const lock = Engine.reduce ? (p >= 0.36 ? 1 : 0) : seg(p, 0.38, 0.5);
    const more = Engine.reduce ? (p >= 0.68 ? 1 : 0) : E.out(seg(p, 0.7, 0.86));
    const runs = ["claude", "gpt"];
    runs.forEach((run, i) => {
      const col = RUNC[run];
      const cx = m ? G.x + G.w / 2 : G.x + G.w * (i ? 0.72 : 0.28);
      const cy = m ? G.y + G.h * (i ? 0.72 : 0.22) : G.y + G.h * 0.36;
      const half = m ? G.w * 0.36 : G.w * 0.17;
      const a = (run === "claude" ? 0.12 : 0.16) * lean + (run === "gpt" ? 0.16 * more : 0) + (run === "claude" ? D.shake(g, 0.004 * (1 - lock)) : 0);
      // 기둥
      D.line(g, cx, cy, cx, cy + (m ? 70 : G.h * 0.48), { color: C_.ink3, w: 4 });
      D.text(g, RUNS[run].name, cx, cy + (m ? 92 : G.h * 0.48 + 26), { px: m ? 15 : 18, w: 900, fam: "mono", color: col, align: "center" });
      // 대
      const lx = cx - Math.cos(a) * half;
      const ly = cy - Math.sin(a) * half;
      const rx = cx + Math.cos(a) * half;
      const ry = cy + Math.sin(a) * half;
      D.line(g, lx, ly, rx, ry, { color: col, w: m ? 5 : 7, glow: 18 });
      D.dot(g, cx, cy, 8, { color: C_.ink });
      const pan = (x, y, lab, colr) => {
        D.line(g, x, y, x - 22, y + 40, { color: C_.ink3 });
        D.line(g, x, y, x + 22, y + 40, { color: C_.ink3 });
        D.rect(g, x - 34, y + 40, 68, 8, { color: colr, r: 4 });
        D.text(g, lab, x, y + 68, { px: 14, w: 800, color: colr, align: "center" });
      };
      pan(lx, ly, "강세", C_.bull);
      pan(rx, ry, "약세", C_.bear);
      if (run === "claude" && lock > 0) {
        D.rect(g, cx - 64, cy - 66, 128, 36, { color: "rgba(4,4,5,0.9)", stroke: C_.c, sw: 2, r: 18, alpha: lock });
        D.text(g, "멈춤 · 증거 부족", cx, cy - 42, { px: 14, w: 900, color: C_.c, align: "center", alpha: lock });
      }
      if (run === "gpt" && more > 0) {
        const bx = cx + half * 0.2;
        D.rect(g, bx - 70, cy - 70, 150, 36, { color: "rgba(4,4,5,0.9)", stroke: C_.g, sw: 2, r: 18, alpha: more });
        D.text(g, "지금 줄인다", bx + 5, cy - 46, { px: 14, w: 900, color: C_.g, align: "center", alpha: more });
      }
    });
  },
});

/* 13 — 인계철선: 줄이는 크기는 같은 50%. GPT는 지금 줄이고, Claude는 1,135에 줄을 쳐 둔다. */
scene({
  id: "s-wire", len: 340, name: "1,135 인계철선",
  beats: [
    { at: 0, tag: "GPT · 리서치 매니저", plain: "줄이는 크기는 같습니다. 평소 몫(표준 비중)의 약 50%. GPT는 지금 줄입니다.", q: Q("gpt", "manager", "SNDK 보유분은 표준 배분의 약 50%") },
    { at: 0.34, tag: "Claude · 리서치 매니저", plain: "Claude는 1,135에 줄을 쳐 두었습니다. 지금은 그대로 둡니다.", q: Q("claude", "manager", "종가가 1,135를 이탈하면") },
    { at: 0.66, tag: "Claude · 포트폴리오 매니저", plain: "종가가 그 줄 아래로 떨어지는 순간 Claude도 50%로. 시작부터 줄 아래로 열려도 바로 실행합니다.", q: Q("claude", "pm", "종가가 1,135를 밑돌면") },
  ],
  draw(g, p) {
    const { G, m } = g;
    const halves = m
      ? [{ x: G.x, y: G.y, w: G.w, h: G.h / 2 - 8 }, { x: G.x, y: G.y + G.h / 2 + 8, w: G.w, h: G.h / 2 - 8 }]
      : [{ x: G.x, y: G.y, w: G.w / 2 - 24, h: G.h }, { x: G.x + G.w / 2 + 24, y: G.y, w: G.w / 2 - 24, h: G.h }];
    const cut = Engine.reduce ? 1 : E.out(seg(p, 0.08, 0.24));
    const wire = Engine.reduce ? (p >= 0.34 ? 1 : 0) : seg(p, 0.36, 0.46);
    const ghost = Engine.reduce ? (p >= 0.66 ? 1 : 0) : E.inOut(seg(p, 0.68, 0.84));
    ["claude", "gpt"].forEach((run, i) => {
      const H = halves[i];
      const col = RUNC[run];
      D.rect(g, H.x, H.y, H.w, H.h, { stroke: C_.line2, r: 14 });
      D.text(g, RUNS[run].name, H.x + 16, H.y + 26, { px: 15, w: 900, fam: "mono", color: col });
      // 가격 축(오른쪽 일부)
      const ax = { x: H.x + H.w * 0.52, y: H.y + 40, w: H.w * 0.44, h: H.h - (m ? 56 : 120) };
      const Y = (v) => ax.y + (1 - (v - 1060) / (1320 - 1060)) * ax.h;
      // 공 위치
      let pv = PX.close;
      if (run === "claude" && ghost > 0) pv = lerp(PX.close, 1100, ghost);
      const by = Y(pv) + (run === "claude" && wire > 0 ? 0 : D.shake(g, 1));
      // 인계철선
      if (run === "claude" && wire > 0) {
        const yw = Y(PX.trigger);
        const crossed = pv < PX.trigger;
        const flick = Engine.reduce ? 1 : 0.75 + 0.25 * Math.sin(g.t * 30);
        D.line(g, ax.x - 10, yw, ax.x + ax.w, yw, { color: C_.hot, w: crossed ? 5 : 3, glow: crossed ? 34 : 18, alpha: wire * flick });
        D.text(g, "종가 1,135", ax.x - 16, yw + 5, { px: m ? 13 : 16, w: 900, fam: "mono", color: C_.hot, align: "right", alpha: wire, stroke: 4 });
      }
      D.dot(g, ax.x + ax.w * 0.5, by, m ? 9 : 13, { color: run === "claude" && ghost > 0 ? (pv < PX.trigger ? C_.hot : C_.ink) : C_.ink, glow: 26, alpha: run === "claude" && ghost > 0 ? 0.85 : 1 });
      D.text(g, run === "claude" && ghost > 0.05 ? "만약" : "1,255.58", ax.x + ax.w * 0.5 + 18, by + 5, { px: 14, w: 800, fam: "mono", color: run === "claude" && ghost > 0.05 ? C_.amber : C_.ink, stroke: 4 });
      // 보유 비중 막대
      const bx = H.x + 16;
      const bw = H.w * 0.4;
      const byy = H.y + H.h - (m ? 30 : 60);
      let share = 1;
      if (run === "gpt") share = 1 - 0.5 * cut;
      if (run === "claude") share = 1 - 0.5 * clamp((PX.trigger - pv) / 10);
      D.text(g, "표준 비중", bx, byy - (m ? 22 : 30), { px: 13, w: 700, color: C_.ink3 });
      D.rect(g, bx, byy - 14, bw, 20, { stroke: C_.line2, r: 6 });
      D.rect(g, bx, byy - 14, bw * share, 20, { color: col, r: 6, glow: 16 });
      D.text(g, share > 0.75 ? "100%" : run === "gpt" ? "약 50%" : "50%", bx + bw + 10, byy + 2, { px: m ? 16 : 22, w: 900, fam: "mono", color: col });
      if (!m) {
        const note = run === "gpt" ? "지금 줄인다" : ghost > 0.98 ? "줄을 넘는 순간 줄인다" : "지금은 그대로";
        D.text(g, note, bx, byy + 34, { px: 15, w: 800, color: C_.ink2 });
      }
    });
  },
});

/* 14 — 갭: 실적 다음 날 가격이 줄을 건너뛰어 아래에서 시작하는 위험, 그리고 리스크 셋의 숫자. */
scene({
  id: "s-gap", len: 340, name: "갭과 리스크 셋",
  beats: [
    { at: 0, tag: "Claude · 보수적 리스크 분석가", plain: "보수파의 걱정: 실적 다음 날 주가가 1,000 근처에서 시작하면, 1,135 규칙은 돌기도 전에 약 20%를 잃습니다.", q: Q("claude", "conservative", "1,135 종가 이탈 시") },
    { at: 0.36, tag: "Claude · 포트폴리오 매니저", plain: "Claude 쪽 리스크 셋은 서로 다른 숫자를 냈고, 최종 결정은 가운데(80~90%)였습니다.", q: Q("claude", "pm", "그래서 실적 전에 비중을") },
    { at: 0.68, tag: "GPT · 보수적 리스크 분석가", plain: "GPT 쪽 리스크 셋은 모두 '약 50% 축소'로 모였습니다.", q: Q("gpt", "conservative", "공격적 분석가의 핵심 판단") },
  ],
  draw(g, p) {
    const { G, m } = g;
    const gapF = Engine.reduce ? (p < 0.36 ? 1 : 0.35) : seg(p, 0.06, 0.3) * (1 - 0.65 * seg(p, 0.34, 0.42));
    // 갭(왼쪽/위)
    const A = m ? { x: G.x, y: G.y, w: G.w, h: G.h * 0.42 } : { x: G.x, y: G.y, w: G.w * 0.4, h: G.h };
    const Y = (v) => A.y + 20 + (1 - (v - 960) / (1300 - 960)) * (A.h - 40);
    const x1 = A.x + A.w * 0.25;
    const x2 = A.x + A.w * 0.72;
    D.line(g, A.x, Y(PX.trigger), A.x + A.w, Y(PX.trigger), { color: C_.hot, w: 3, glow: 14, alpha: 0.4 + 0.6 * gapF });
    D.text(g, "1,135", A.x + 4, Y(PX.trigger) - 8, { px: 14, w: 900, fam: "mono", color: C_.hot, alpha: 0.4 + 0.6 * gapF });
    D.dot(g, x1, Y(PX.close), m ? 8 : 11, { color: C_.ink, glow: 20, alpha: 0.4 + 0.6 * gapF });
    D.text(g, "오늘 1,255.58", x1, Y(PX.close) - 16, { px: 13, w: 700, fam: "mono", color: C_.ink2, align: "center", alpha: 0.4 + 0.6 * gapF });
    if (gapF > 0) {
      const appear = Engine.reduce ? 1 : seg(p, 0.14, 0.24);
      D.rect(g, x1 + 20, Y(PX.close), x2 - x1 - 40, Y(PX.gapOpen) - Y(PX.close), { color: "rgba(255,74,74,0.12)", stroke: "rgba(255,74,74,0.5)", dash: [5, 5], r: 6, alpha: gapF });
      D.text(g, "갭", (x1 + x2) / 2, (Y(PX.close) + Y(PX.gapOpen)) / 2, { px: m ? 20 : 32, w: 900, color: C_.hot, align: "center", alpha: gapF });
      D.text(g, "이 사이에서는 팔 수 없다", (x1 + x2) / 2, (Y(PX.close) + Y(PX.gapOpen)) / 2 + 24, { px: 13, w: 700, color: C_.ink2, align: "center", alpha: gapF });
      D.dot(g, x2, Y(PX.gapOpen), m ? 8 : 11, { color: C_.hot, glow: 24, alpha: appear * gapF });
      D.text(g, "다음 날 1,000 근처 · 약 -20%", x2 + (m ? -10 : 0), Y(PX.gapOpen) + 26, { px: m ? 13 : 15, w: 800, fam: "mono", color: C_.hot, align: m ? "right" : "center", alpha: appear * gapF, stroke: 4 });
    }
    // 리스크 셋(오른쪽/아래)
    const B = m ? { x: G.x, y: G.y + G.h * 0.48, w: G.w, h: G.h * 0.52 } : { x: G.x + G.w * 0.48, y: G.y, w: G.w * 0.52, h: G.h };
    const rf = Engine.reduce ? (p >= 0.36 ? 1 : 0) : seg(p, 0.36, 0.5);
    const gf = Engine.reduce ? (p >= 0.68 ? 1 : 0) : seg(p, 0.68, 0.8);
    if (rf > 0) {
      const X = (v) => B.x + (m ? 104 : 120) + (v / 100) * (B.w - (m ? 160 : 180));
      const rows = [
        { run: "claude", who: "공격적", lo: 100, hi: 100, lab: "100% 이하" },
        { run: "claude", who: "보수적", lo: 50, hi: 70, lab: "50~70%" },
        { run: "claude", who: "중립 · 채택", lo: 80, hi: 90, lab: "80~90%", pick: true },
        { run: "gpt", who: "공격적", lo: 50, hi: 50, lab: "약 50%" },
        { run: "gpt", who: "보수적", lo: 50, hi: 50, lab: "약 50%" },
        { run: "gpt", who: "중립", lo: 50, hi: 50, lab: "약 50%" },
      ];
      const rh = B.h / 7.4;
      [0, 50, 100].forEach((v) => {
        D.line(g, X(v), B.y + rh * 0.3, X(v), B.y + rh * 6.9, { color: C_.line, dash: [3, 5] });
        D.text(g, `${v}%`, X(v), B.y + rh * 0.2, { px: 13, w: 700, fam: "mono", color: C_.ink3, align: "center" });
      });
      rows.forEach((r, i) => {
        const f = r.run === "claude" ? rf : gf;
        if (f <= 0) return;
        const y = B.y + rh * (i + 1 + (i > 2 ? 0.4 : 0));
        const col = RUNC[r.run];
        D.text(g, `${RUNS[r.run].name} ${r.who}`, B.x, y + 5, { px: 13, w: 800, color: col, alpha: f });
        const w = Math.max(10, X(r.hi) - X(r.lo));
        const xStart = r.lo === r.hi ? X(0) : X(r.lo);
        const xEnd = r.lo === r.hi ? X(r.hi) : X(r.hi);
        D.rect(g, xStart, y - 9, (xEnd - xStart) * E.out(f), 18, { color: r.lo === r.hi ? col : "rgba(0,0,0,0)", stroke: col, sw: 2, r: 5, alpha: r.lo === r.hi ? 0.85 : 1, glow: r.pick ? 18 : 0 });
        if (r.lo !== r.hi) D.rect(g, xStart, y - 9, w * E.out(f), 18, { color: col, r: 5, alpha: 0.35 });
        D.text(g, r.lab, xEnd + 10, y + 5, { px: 13, w: 800, fam: "mono", color: C_.ink, alpha: f });
      });
    }
  },
});

/* 15 — 착지: 두 궤적이 다섯 칸 위로 날아와 한 칸 차이로 내려앉는다. */
const TIER = SCALE.map((s) => s.ko);
scene({
  id: "s-land", len: 280, name: "한 칸 차이",
  beats: [
    { at: 0, tag: "최종 등급", plain: "다섯 칸 중 한 칸 차이.", q: { text: "등급 척도 — 매수(Buy) · 비중 확대(Overweight) · 보유 유지(Hold) · 비중 축소(Underweight) · 매도(Sell)" } },
    { at: 0.5, tag: "GPT · 포트폴리오 매니저", plain: "Claude는 지금 가진 만큼 둡니다(종가 1,135 아래면 50%). GPT는 평소 몫의 약 50%로 줄입니다. 둘 다 '전부 팔라'는 아닙니다.", q: Q("gpt", "pm", "SNDK는 전량 매도보다") },
  ],
  draw(g, p) {
    const { G, m } = g;
    const n = 5;
    const tw = m ? G.w : G.w / n - 12;
    const th = m ? G.h / n - 8 : G.h * 0.5;
    const tile = (i) => (m ? { x: G.x, y: G.y + i * (th + 8), w: tw, h: th } : { x: G.x + i * (tw + 12), y: G.y + G.h - th, w: tw, h: th });
    const target = { claude: 2, gpt: 3 };
    for (let i = 0; i < n; i++) {
      const t = tile(i);
      const picked = i === 2 || i === 3;
      D.rect(g, t.x, t.y, t.w, t.h, { color: picked ? "rgba(243,239,228,0.07)" : "rgba(243,239,228,0.03)", stroke: picked ? C_.line2 : C_.line, r: 12 });
      D.text(g, TIER[i], t.x + t.w / 2, t.y + t.h / 2 + (m ? 6 : 0), { px: m ? 18 : 26, w: 900, color: picked ? C_.ink : C_.ink3, align: "center" });
      if (!m) D.text(g, SCALE[i].en, t.x + t.w / 2, t.y + t.h / 2 + 28, { px: 14, w: 700, fam: "mono", color: C_.ink3, align: "center" });
    }
    ["claude", "gpt"].forEach((run, k) => {
      const t = tile(target[run]);
      const f = Engine.reduce ? 1 : E.inOut(seg(p, 0.04 + k * 0.08, 0.36 + k * 0.08));
      const tx = m ? t.x + t.w - 40 : t.x + t.w / 2;
      const ty = m ? t.y + t.h / 2 : t.y - 30;
      const sx = m ? G.x - 40 : G.x - 60;
      const sy = m ? G.y - 30 : G.y + (k ? G.h * 0.3 : 0);
      const cx = lerp(sx, tx, f);
      const cy = lerp(sy, ty, f) - Math.sin(Math.PI * f) * (m ? 30 : 80);
      const col = RUNC[run];
      for (let j = 0; j < 22; j++) {
        const ff = clamp(f - j * 0.012);
        const px = lerp(sx, tx, ff);
        const py = lerp(sy, ty, ff) - Math.sin(Math.PI * ff) * (m ? 30 : 80);
        D.dot(g, px, py, 5 - j * 0.2, { color: col, alpha: (0.7 - j * 0.03) * (f < 1 ? 1 : 0.3) });
      }
      D.dot(g, cx, cy, m ? 9 : 13, { color: col, glow: 30 });
      if (f >= 1) {
        D.text(g, RUNS[run].name, cx + (m ? -16 : 0), cy + (m ? 5 : -22), { px: m ? 14 : 18, w: 900, fam: "mono", color: col, align: m ? "right" : "center" });
      }
    });
    const bf = Engine.reduce ? 1 : seg(p, 0.46, 0.56);
    if (bf > 0 && !m) {
      const a = tile(2);
      const b = tile(3);
      const y = a.y - 80;
      D.line(g, a.x + a.w / 2, y, b.x + b.w / 2, y, { color: C_.amber, w: 2, alpha: bf });
      D.text(g, "한 칸", (a.x + a.w / 2 + b.x + b.w / 2) / 2, y - 12, { px: 22, w: 900, color: C_.amber, align: "center", alpha: bf });
    }
  },
});

/* 16 — 다음에 볼 줄: 가격 위아래로 두 실행이 걸어 둔 조건선이 맥박친다. */
scene({
  id: "s-next", len: 260, name: "다음에 볼 줄",
  beats: [
    { at: 0, tag: "Claude · 포트폴리오 매니저", plain: "이번 주 실적이 나오면, 가격이 어느 줄을 먼저 건드리는지로 두 결론을 다시 맞대 볼 수 있습니다.", q: Q("claude", "pm", "1단계: 가이던스가 견조하고") },
  ],
  draw(g, p) {
    const { G, m } = g;
    const Y = (v) => G.y + 10 + (1 - (v - 960) / (1400 - 960)) * (G.h - 20);
    const x0 = G.x;
    const x1 = G.x + G.w - (m ? 0 : 200);
    const gates = [
      { v: PX.ema10, lab: "1,355 · 10일 평균 회복 → 늘리기 검토", who: "both" },
      { v: PX.gptLow, lab: "1,238.03 · 종가 이탈 시 추가 축소 검토", who: "gpt" },
      { v: PX.trigger, lab: "1,135 · 종가 이탈 시 50%로", who: "claude" },
      { v: 1007, lab: "998~1,016 · 이탈 시 추가 축소", who: "claude", band: PX.julyLow },
    ];
    gates.forEach((gt, i) => {
      const f = Engine.reduce ? 1 : seg(p, 0.05 + i * 0.08, 0.15 + i * 0.08);
      const col = gt.who === "both" ? C_.ink : RUNC[gt.who];
      const pulse = Engine.reduce ? 0 : (Math.sin(g.t * 3 + i) + 1) / 2;
      if (gt.band) D.rect(g, x0, Y(gt.band[1]), (x1 - x0) * f, Y(gt.band[0]) - Y(gt.band[1]), { color: "rgba(255,148,102,0.18)" });
      else D.line(g, x0, Y(gt.v), x0 + (x1 - x0) * f, Y(gt.v), { color: col, w: 2 + pulse * 2, glow: 10 + pulse * 14, alpha: f });
      const who = gt.who === "both" ? "둘 다" : RUNS[gt.who].name;
      D.text(g, `${who} · ${gt.lab}`, m ? x1 - 2 : x1 + 12, Y(gt.v) + (m ? -8 : 5), { px: m ? 13 : 15, w: 800, color: col, alpha: f, align: m ? "right" : "left", stroke: m ? 4 : 0 });
    });
    const bx = G.x + G.w * (m ? 0.3 : 0.35);
    const breathe = Engine.reduce ? 0 : Math.sin(g.t * 1.6) * 3;
    D.dot(g, bx, Y(PX.close) + breathe, m ? 10 : 14, { color: C_.ink, glow: 30 });
    D.text(g, "지금 1,255.58", bx + (m ? 0 : 22), Y(PX.close) + breathe + (m ? -18 : 6), { px: m ? 15 : 20, w: 900, fam: "mono", stroke: 4, align: m ? "center" : "left" });
  },
});
