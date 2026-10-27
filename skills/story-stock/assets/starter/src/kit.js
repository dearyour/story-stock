/* Kit — 변경 감지 DOM 쓰기와 작은 도구. 매 프레임 불러도 바뀐 것이 없으면 레이아웃을 건드리지 않는다.
   engine.js가 clamp · lerp · seg · $ · $$ · E(곡선) · Engine을 준다. */

const el = (html) => {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const toggle = (node, cls, on) => {
  if (node && node.classList.contains(cls) !== Boolean(on)) node.classList.toggle(cls, Boolean(on));
};
const setText = (node, text) => {
  if (node && node.textContent !== text) node.textContent = text;
};
const setHTML = (node, html) => {
  if (node && node.__html !== html) {
    node.__html = html;
    node.innerHTML = html;
  }
};
/** 진행률 p가 지난 마지막 박자의 번호. */
const stepOf = (p, stops) => {
  let i = 0;
  for (let k = 0; k < stops.length; k++) if (p >= stops[k]) i = k;
  return i;
};
