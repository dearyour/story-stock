/* 예시 장면 — 보고서 두 편(같은 종목 · 같은 날 · 다른 모델)에서 고른 주장 여섯 개. 장면 하나 = 주장 하나.
   새 장면은 scene({ id, len, name, beats:[{at, tag, plain, q}], draw(g, p) })로 더한다. 레시피 전체는
   스킬의 references/scene-library.js(17개)와 references/scenes.md. */

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
    { at: 0, tag: "TradingAgents · SNDK · 기준일 2026-10-26", plain: "같은 질문을 두 AI에게 따로 물었어요. 종목, 날짜, 에이전트 11명, 데이터 창구까지 모두 같아요.", q: { text: "보고서 머리말 — 분석 기준일 2026-10-26 · 분석가: 시장, 뉴스, 재무 · 리서치 토론 1라운드, 리스크 토론 1라운드" } },
    { at: 0.64, tag: "최종 등급", plain: "Claude는 '보유 유지', GPT는 '비중 축소'로 결론이 갈렸어요. AI가 만든 분석이고, 투자 권유가 아니에요.", q: { text: "최종 등급 — Claude: 보유 유지 · Hold / GPT: 비중 축소 · Underweight" } },
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

/* 02 — 미끄러짐: 가격선이 화면을 가로질러 그려지고, 10일 · 50일 평균선이 천장처럼 내려와 머리 위에 걸린다. */
scene({
  id: "s-slide", len: 300, name: "천장 아래로",
  beats: [
    { at: 0, tag: "Claude · 시장 분석가", plain: "한 달 남짓 만에 가격이 1,887에서 1,255.58까지 미끄러졌어요.", q: Q("claude", "market", "9월 22일 종가 1,887.04") },
    { at: 0.52, tag: "GPT · 시장 분석가", plain: "두 AI 모두 추세가 약하다고 봤어요. 단기(10일)·중기(50일) 평균선이 모두 가격보다 위에 있어요.", q: Q("gpt", "market", "2026-10-26 SNDK 종가는") },
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
    { at: 0, tag: "Claude · 시장 분석가", plain: "RSI가 9월 말 50대에서 30 근처까지 떨어졌어요. RSI는 최근 오른 힘과 내린 힘을 0~100으로 재요.", q: Q("claude", "market", "RSI 32.12: 10월 16일") },
    { at: 0.56, tag: "GPT · 시장 분석가", plain: "30 아래는 많이 팔렸다는 신호예요. 그래도 두 AI 모두 바닥은 아니라고 했어요.", q: Q("gpt", "market", "검증된 RSI는 32.12") },
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

/* 05 — 흔들림: 가격 1,255.58을 감싼 ±93.48 띠가 떨고, 1,229 손절선은 그 띠 안에 묻힌다. */
scene({
  id: "s-shake", len: 300, name: "하루 흔들림",
  beats: [
    { at: 0, tag: "Claude · 시장 분석가", plain: "이 주식은 하루에 평균 93.48(가격의 약 7.4%)씩 흔들려요.", q: Q("claude", "market", "ATR 93.48: 종가 대비") },
    { at: 0.5, tag: "Claude · 약세 연구원", plain: "그래서 1,229(약 2% 아래)에 손절을 걸면 평범한 하루에도 걸린다고 반박했어요.", q: Q("claude", "bear", "종가 1,255에서 1,229까지") },
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

/* 13 — 인계철선: 줄이는 크기는 같은 50%. GPT는 지금 줄이고, Claude는 1,135에 줄을 쳐 둔다. */
scene({
  id: "s-wire", len: 340, name: "1,135 인계철선",
  beats: [
    { at: 0, tag: "GPT · 리서치 매니저", plain: "줄이는 크기는 둘 다 평소 몫(표준 비중)의 약 50%예요. GPT는 지금 줄여요.", q: Q("gpt", "manager", "SNDK 보유분은 표준 배분의 약 50%") },
    { at: 0.34, tag: "Claude · 리서치 매니저", plain: "Claude는 1,135에 줄을 쳐 뒀어요. 지금은 그대로 둬요.", q: Q("claude", "manager", "종가가 1,135를 이탈하면") },
    { at: 0.66, tag: "Claude · 포트폴리오 매니저", plain: "종가가 그 줄 아래로 떨어지면 Claude도 50%로 줄여요. 장이 줄 아래에서 시작해도 바로 줄여요.", q: Q("claude", "pm", "종가가 1,135를 밑돌면") },
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
        const note = run === "gpt" ? "지금 줄여요" : ghost > 0.98 ? "줄을 넘으면 줄여요" : "지금은 그대로 둬요";
        D.text(g, note, bx, byy + 34, { px: 15, w: 800, color: C_.ink2 });
      }
    });
  },
});

/* 15 — 착지: 두 궤적이 다섯 칸 위로 날아와 한 칸 차이로 내려앉는다. */
const TIER = SCALE.map((s) => s.ko);
scene({
  id: "s-land", len: 280, name: "한 칸 차이",
  beats: [
    { at: 0, tag: "최종 등급", plain: "다섯 칸 중 딱 한 칸 차이예요.", q: { text: "등급 척도 — 매수(Buy) · 비중 확대(Overweight) · 보유 유지(Hold) · 비중 축소(Underweight) · 매도(Sell)" } },
    { at: 0.5, tag: "GPT · 포트폴리오 매니저", plain: "Claude는 그대로 두고(종가 1,135 아래면 50%), GPT는 평소 몫의 약 50%로 줄여요. 둘 다 전부 팔라는 말은 아니에요.", q: Q("gpt", "pm", "SNDK는 전량 매도보다") },
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
