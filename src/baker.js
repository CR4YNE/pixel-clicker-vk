// the cook of the living bakery: one baking is 73 seconds and 12 steps; the oven, the table and the plate with the finished gingerbread.
// It was made from the approved preview (docs/living-bakery/cook.js, cook_draw.js); the arms are set by hand in every pose.
// One file for the computer and the phone (phone/src/baker.js is a copy made by docs/living-bakery/build_kitchen.py).
// Nothing here changes the income: the game only tells about taps, customers, sales and the cooking minute.
window.KITCHEN_BAKER = function (tools, layout, base, table) {
'use strict';
const { clamp, smooth, hx, mixc, css, ramp, K, WARM, T_Y } = tools;
let G = null;
const R = (x, y, w, h, col) => { G.fillStyle = col; G.fillRect(Math.round(x), Math.round(y), w, h); };
const picture = (name) => { const im = new Image(); im.src = base + name; return im; }, ready = (im) => im.complete && im.naturalWidth > 0;
const sheet = picture('cook-sheet.png?v=1');                         // 40x70 cells: 0 the legs, 1 the body, 2 the back, 3-6 the steps from the side
const waves = Array.from({ length: 8 }, (_, i) => picture('cook-d' + i + '.png?v=1'));   // the wave with the spoon
const HOME = 107, AT = layout === 'phone' ? 79 : 66;                 // his place at the table; the middle of the oven (on the phone, of the part of it that is on the screen)
const WAVE_S = 2, REST_STATE = { i: -1, u: 0, k: 0, name: 'СТОИТ' };
let act = null;                                                     // {name, t}: he washes the bowl or sweeps; the clock of the cooking stands
let t = 0, pile = 1, st = REST_STATE, waving = false, waveT = 0, waveAsked = 0, hot = 0, quiet = 99, taps = [], clock = 0;
function steam(x, y, time, a, h, n = 4) { for (let i = 0; i < n; i++) { const k = (time * .32 + i / n) % 1; R(x + Math.sin(time * 1.5 + i * 2 + k * 5) * 1.8, y - k * h, k > .4 ? 2 : 1, k > .6 ? 2 : 1, `rgba(255,250,244,${(a * (1 - k) * Math.min(1, k * 6)).toFixed(2)})`); } }
const STEPS = [['МУКА', 5], ['ЯЙЦА И МЁД', 5], ['ЗАМЕС', 8], ['ТЕСТО НА СТОЛ', 3], ['МЕСИТ', 8], ['РАСКАТЫВАЕТ', 7], ['ВЫРЕЗАЕТ', 7], ['НЕСЁТ В ПЕЧЬ', 5], ['ПЕКУТСЯ', 10], ['ДОСТАЁТ', 5], ['ГЛАЗУРЬ', 7], ['ГОТОВО!', 3]];
const CYCLE = STEPS.reduce((a, s) => a + s[1], 0);
function cookState(t) { let u = ((t % CYCLE) + CYCLE) % CYCLE; for (let i = 0; i < STEPS.length; i++) { if (u < STEPS[i][1]) return { i, u, k: u / STEPS[i][1], name: STEPS[i][0] }; u -= STEPS[i][1]; } return { i: 0, u: 0, k: 0, name: '' }; }
// an arm: shoulder, elbow and hand are given by the pose (pixels of the 40x70 sprite); three pixels thick all the way
const SLV = ['#f6f0ee', '#e6dddf', '#cfc5cf', '#9c90a4'], SKN = ['#f0d4b0', '#dcb58a', '#b98a70'];
function arm(ox, oy, S, E, Hn, o = {}) {
  const m = new Map(), line = (a, b, tag) => {
    const n = Math.max(1, Math.round(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) * 2));
    for (let i = 0; i <= n; i++) {
      const x = Math.round(a[0] + (b[0] - a[0]) * i / n), y = Math.round(a[1] + (b[1] - a[1]) * i / n);
      for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) m.set((x + xx) + ',' + (y + yy), tag);
    }
  };
  const L = Math.hypot(Hn[0] - E[0], Hn[1] - E[1]) || 1, u = [(Hn[0] - E[0]) / L, (Hn[1] - E[1]) / L];
  const W1 = [Hn[0] - u[0] * 2.4, Hn[1] - u[1] * 2.4], W0 = [Hn[0] - u[0] * 3.4, Hn[1] - u[1] * 3.4];
  line(S, E, 's'); if (L > 2.5) { line(E, W1, 's'); line(W0, W1, 'c'); }
  m.delete((Math.round(S[0]) + (o.flip ? 1 : -1)) + ',' + (Math.round(S[1]) - 1));                // a round shoulder
  const hk = new Set(), hxp = Math.round(Hn[0]), hy = Math.round(Hn[1]);
  for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) hk.add((hxp + xx) + ',' + (hy + yy));
  const all = (x, y) => m.has(x + ',' + y) || hk.has(x + ',' + y);
  // a thin shade where the arm lies over the coat, so it reads as an arm
  if (!o.noEdge) for (const key of [...m.keys(), ...hk]) {
    const [x, y] = key.split(',').map(Number);
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, 1]]) { const nx = x + dx, ny = y + dy; if (!all(nx, ny) && nx >= 24 && nx <= 35 && ny > 33 && ny < 58) R(ox + nx, oy + ny, 1, 1, SLV[3]); }
  }
  for (const [key, tag] of m) {
    const [x, y] = key.split(',').map(Number), up = !all(x, y - 1), lf = !all(x - 1, y), dn = !all(x, y + 1), rt = !all(x + 1, y);
    R(ox + x, oy + y, 1, 1, tag === 'c' ? (dn || rt ? SLV[2] : SLV[0]) : dn || rt ? SLV[2] : up || lf ? SLV[0] : SLV[1]);
  }
  for (const key of hk) { const [x, y] = key.split(',').map(Number); R(ox + x, oy + y, 1, 1, y > hy && x > hxp ? SKN[2] : x <= hxp && y < hy ? SKN[0] : SKN[1]); }
}
const SL = [23, 35], SR = [37, 35], lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const REST = { l: [[22, 41], [24, 45]], r: [[38, 41], [36, 45]] };
// ---- the extras of the cook: he points at the glowing food, yawns at night, bakes with the icing of the season, is in flour in the cooking minute,
// looks at the customer and hands the gingerbread over. bit: what he does now instead of the work ('point' | 'yawn' | 'give'), u: its seconds
let bit = null, season = 0, floury = false, guest = false, buyerX = 232, treat = 0, treatWas = 0, treatNext = 0, yawnIn = 60, giveAsked = 0, gave = false;
const BITS = { point: 2.4, yawn: 2.6, give: 4.6 };
const ICE = [
  { top: ['#ffb3d1', '#ffd84a'], pal: { p: '#ff9ec4', y: '#ffd84a', q: '#e56a9c' }, s: ['.p.p.', 'ppqpp', '.qyq.', 'ppqpp', '.p.p.'], t: ['p.p', '.y.', 'p.p'] },      // spring: a flower
  { top: ['#fff6ea', '#e0303e'], pal: { r: '#e0303e', h: '#ff8a8a', g: '#4fa33a', d: '#9c1c30' }, s: ['.g.g.', '.ggg.', '.rhr.', 'rrrrd', '.rrd.'], t: ['.g.', 'rhr', '.r.'] },   // summer: a berry
  { top: ['#ffdf9a', '#e0742a'], pal: { o: '#e8762a', y: '#ffc23c', b: '#8a4a20' }, s: ['..o..', 'o.y.o', 'ooyoo', '.oyo.', '..b..'], t: ['.o.', 'oyo', '.b.'] },      // autumn: a leaf
  { top: ['#eef8ff', '#8fd0f4'], pal: { w: '#ffffff', c: '#8fd0f4' }, s: ['w.c.w', '.cwc.', 'cwwwc', '.cwc.', 'w.c.w'], t: ['c.c', '.w.', 'c.c'] },                    // winter: a snowflake
];
const spr = (p, pal, x, y) => p.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (pal[r[i]]) R(x + i, y + j, 1, 1, pal[r[i]]); });
// a gingerbread on the tray is 5 pixels wide: the glaze and the sign of the season, 3x3
function iceTop(x, y) { const I = ICE[season]; R(x, y, 5, 1, I.top[0]); spr(I.t, I.pal, x + 1, y - 2); }
// the raised gingerbread, 11x11, with the sign inside the letter
const BIG_C = ['..#######..', '.#+++++++#.', '#++#####++#', '#+#.....#+#', '#+#......##', '#+#........', '#+#......##', '#+#.....#+#', '#++#####++#', '.#+++++++#.', '..#######..'];
function bigC(x, y) {
  const I = ICE[season];
  BIG_C.forEach((r, j) => { for (let i = 0; i < 11; i++) if (r[i] === '#') R(x + i, y + j, 1, 1, j === 0 || i === 0 ? '#d99a55' : j > 8 || i > 9 ? '#7c4620' : '#a8622c'); else if (r[i] === '+') R(x + i, y + j, 1, 1, I.top[0]); });
  spr(I.s, I.pal, x + 3, y + 3);
}
// which way he looks: 0 to us, 1 right, -1 left
function turned() { return bit ? bit.name === 'point' ? bit.dir : bit.name === 'give' && bit.u > 1.9 ? 1 : 0 : guest && st.i >= 0 ? 1 : 0; }
// the head: as it is or three quarters (the face moves by 2 pixels, the hat stays)
function head(ox, y, turn) {
  if (!turn) { G.drawImage(sheet, 40, 0, 40, 32, ox, y, 40, 32); if (bit && bit.name === 'yawn') yawnFace(ox, y); return; }
  G.save(); if (turn < 0) { G.translate(2 * (ox + 30), 0); G.scale(-1, 1); }
  G.drawImage(sheet, 40, 0, 40, 19, ox, y, 40, 19);
  G.drawImage(sheet, 64, 19, 2, 8, ox + 24, y + 19, 2, 8);                             // the near temple and the ear
  G.drawImage(sheet, 65, 19, 1, 8, ox + 26, y + 19, 1, 8); G.drawImage(sheet, 64, 19, 1, 5, ox + 27, y + 19, 1, 5); R(ox + 27, y + 24, 1, 3, '#e0b885');
  G.drawImage(sheet, 66, 19, 8, 8, ox + 28, y + 19, 8, 8);                             // the face
  G.drawImage(sheet, 65, 27, 10, 5, ox + 26, y + 27, 10, 5); R(ox + 25, y + 27, 1, 2, '#837c8c');   // the beard
  R(ox + 36, y + 25, 1, 1, '#e8cc9a'); R(ox + 36, y + 26, 1, 1, '#bf9676');            // the nose
  G.restore();
}
function yawnFace(ox, y) {
  const o = smooth(.3, .7, bit.u) * (1 - smooth(1.9, 2.3, bit.u));
  if (o > .2) { R(ox + 27, y + 24, 2, 1, SKN[2]); R(ox + 31, y + 24, 2, 1, SKN[2]); R(ox + 27, y + 23, 2, 1, SKN[1]); R(ox + 31, y + 23, 2, 1, SKN[1]); const h = Math.round(1 + o * 3); R(ox + 28, y + 28, 4, h, '#4a1c24'); R(ox + 29, y + 28, 2, 1, '#fff0ea'); if (h > 3) R(ox + 29, y + 30, 2, 1, '#c85a5a'); }
}
// the arms of a bit: set by hand, as everywhere
function bitArms(ox, by) {
  const u = bit.u;
  if (bit.name === 'point') {
    const a = smooth(0, .3, u) * (1 - smooth(2.1, 2.4, u)), j = Math.max(0, Math.sin(u * 7)) * a, d = bit.dir, rest = d > 0 ? REST.r : REST.l;
    const E = lerp2(rest[0], d > 0 ? [43, 37] : [17, 37], a), Hn = lerp2(rest[1], d > 0 ? [48 + j * 2, 34 + j] : [12 - j * 2, 34 + j], a);
    if (d > 0) { arm(ox, by, SL, REST.l[0], REST.l[1]); arm(ox, by, SR, E, Hn, { flip: true }); } else { arm(ox, by, SR, REST.r[0], REST.r[1], { flip: true }); arm(ox, by, SL, E, Hn); }
    if (a > .7) { const x = Math.round(ox + Hn[0]) + d * 2, y = Math.round(by + Hn[1]); R(x, y, 1, 1, SKN[0]); R(x + d, y + 1, 1, 1, SKN[0]); R(x + d * 2, y + 1, 1, 1, SKN[1]); R(x + d * 3, y + 2, 1, 1, SKN[1]); }
  } else if (bit.name === 'yawn') {
    const a = smooth(.2, .7, u) * (1 - smooth(1.9, 2.4, u)), s = smooth(.5, 1.1, u) * (1 - smooth(1.7, 2.2, u));
    arm(ox, by, SR, lerp2(REST.r[0], [43, 36], s), lerp2(REST.r[1], [45, 28], s), { flip: true }); arm(ox, by, SL, lerp2(REST.l[0], [18, 37], a), lerp2(REST.l[1], [26, 31], a));
    if (u > 1.2) for (let n = 0; n < 3; n++) { const q = (u - 1.2) / 1.4 - n * .18; if (q > 0 && q < 1) R(ox + 37 + q * 6 + n, by + 25 - q * 9, 1, 1, `rgba(225,235,255,${(.8 * (1 - q)).toFixed(2)})`); }
  } else {
    // 0-1.4 he fills the bag, 1.4-2 ties it, 2-2.6 pushes it along the table, then waves after it
    const push = smooth(2, 2.5, u), tie = u > 1.4, b = Math.sin(u * 9) * (tie ? 1.5 : .6);
    if (u < 2) { arm(ox, by, SL, [20, 40], [25 + (tie ? b : 0), tie ? 35 : 41]); arm(ox, by, SR, [40, 40], [36 - (tie ? b : 0), tie ? 35 : 41], { flip: true }); }
    else { arm(ox, by, SL, REST.l[0], REST.l[1]); if (u < 3.2) arm(ox, by, SR, lerp2([40, 40], [43, 38], push), lerp2([36, 41], [49, 42], push), { flip: true }); else arm(ox, by, SR, [43, 37], [46 + Math.sin(u * 9) * 1.5, 28], { flip: true }); }
  }
}
function bag(x, y, full, tied) {                                                       // a paper bag 10x10, x is the middle, y the bottom
  x = Math.round(x); y = Math.round(y);
  R(x - 5, y - 9, 10, 9, '#d9b483'); R(x - 5, y - 9, 2, 9, '#ecd0a4'); R(x + 4, y - 9, 1, 9, '#a9825a'); R(x - 5, y - 1, 10, 1, '#a9825a'); R(x - 1, y - 5, 3, 3, '#c23138'); R(x, y - 4, 2, 1, '#d9b483');
  if (tied) { R(x - 3, y - 11, 6, 2, '#c99f6c'); R(x - 5, y - 9, 10, 1, '#c23138'); R(x - 2, y - 11, 2, 2, '#e0483e'); R(x + 1, y - 11, 2, 2, '#e0483e'); R(x, y - 10, 1, 1, '#8c1c2c'); }
  else { R(x - 5, y - 10, 10, 1, '#f4dfba'); R(x - 4, y - 10, 8, 1, '#8a6440'); for (let n = 0; n < full; n++) { R(x - 4 + n * 2, y - 11 - (n & 1), 2, 2, '#a8622c'); R(x - 4 + n * 2, y - 11 - (n & 1), 2, 1, ICE[season].top[0]); } }
}
// the bag on the table: filled, tied and pushed to the customer; it passes behind the big gingerbread
function drawBag() {
  const u = bit.u, yT = T_Y + 2;
  if (u < 2) bag(HOME, yT, Math.min(4, Math.floor(u * 3.5)), u > 1.5);
  else if (u <= 3.1) bag(HOME + (Math.min(205, buyerX - 9) - HOME) * smooth(2.1, 3.1, u), yT, 4, true);
}
// the pile that is left while he takes it
const pileNow = () => bit && bit.name === 'give' ? Math.max(0, pile - Math.floor(bit.u / .35 + (bit.u > .05 ? 1 : 0))) : pile;
// the plate with the finished gingerbread on the counter in front, in the scale of the pies and the cake: one more row with every baking
const PLATE_X = layout === 'phone' ? 167 : 118;
function drawPlate() {
  const cx = PLATE_X, y = 175, I = ICE[season], rows = Math.min(4, pileNow());
  R(cx - 19, y + 2, 38, 1, 'rgba(40,20,30,.35)'); R(cx - 20, y - 2, 40, 2, '#fbf6ee'); R(cx - 18, y, 36, 1, '#d8cfdc'); R(cx - 14, y + 1, 28, 1, '#a99cb0'); R(cx - 20, y - 2, 6, 1, '#ffffff'); R(cx - 15, y - 1, 30, 1, '#e7a3a8');
  for (let r = 0; r < rows; r++) for (let n = 0; n < 4 - r; n++) {
    const x = Math.round(cx - (4 - r) * 4.5 + n * 9), yy = y - 6 - r * 4;
    R(x, yy, 8, 4, '#a8622c'); R(x, yy, 8, 1, '#d99a55'); R(x, yy + 3, 8, 1, '#7c4620'); R(x + 7, yy + 1, 1, 3, '#7c4620');
    R(x + 1, yy + 1, 6, 1, I.top[0]); R(x + 2, yy + 2, 1, 1, I.top[0]); R(x + 5, yy + 2, 1, 1, I.top[0]); R(x + 3, yy + 1, 2, 1, I.top[1]);
    if (r === rows - 1) spr(I.t, I.pal, x + 2, yy - 2);
  }
  // the gingerbread jumps from the plate into the bag
  if (bit && bit.name === 'give') for (let n = 0; n < pile; n++) { const q = (bit.u - n * .28) / .45; if (q > 0 && q < 1) { const x = Math.round(cx + (HOME - cx) * q), yy = Math.round(168 + (T_Y - 10 - 168) * q - Math.sin(q * Math.PI) * 12); R(x - 2, yy - 1, 5, 3, '#a8622c'); R(x - 2, yy - 1, 5, 1, I.top[0]); } }
}
// the cooking minute: the table, the coat, the hat, the cheeks and the air are in flour
function drawFlour(time, ox, by, view, turn) {
  for (let n = 0; n < 34; n++) R(92 + noise(n) * 40, T_Y + noise(n + 50) * 4, noise(n + 9) > .6 ? 2 : 1, 1, n % 3 ? '#fffaf0' : '#e9dcc8');
  if (view === 'front') {
    FLOUR.forEach(([x, y, w], n) => R(ox + x, by + y, w, 1, n < 7 ? '#f3c4bd' : n < 11 ? '#ffffff' : '#fffaf0'));
    if (!turn) { R(ox + 26, by + 27, 3, 1, '#fff6ea'); R(ox + 33, by + 27, 1, 1, '#fff6ea'); }
  }
  for (let n = 0; n < 9; n++) {
    const q = (time * (.5 + noise(n) * .3) + n / 9) % 1, x = 88 + noise(n + 3) * 44 + Math.sin(time + n) * 2, y = T_Y - 2 - q * 22, a = (.95 * (1 - q) * Math.min(1, q * 5)).toFixed(2), w = 3 + Math.round(q * 6);
    R(x - w / 2, y, w, Math.max(2, w - 3), `rgba(255,250,240,${a})`); R(x - w / 2 + 1, y - 1, Math.max(1, w - 2), 1, `rgba(255,255,255,${a})`);
  }
  for (let n = 0; n < 16; n++) { const q = (time * .9 + noise(n + 20)) % 1; R(90 + noise(n + 70) * 42, T_Y - 24 + q * 26, 1, 1, `rgba(255,255,255,${(.9 * (1 - q)).toFixed(2)})`); }
}
const noise = (n) => { const v = Math.sin(n * 127.1) * 43758.5; return v - Math.floor(v); };
const FLOUR = [[23, 10, 2], [24, 11, 2], [24, 9, 1], [33, 9, 2], [34, 10, 1], [26, 16, 2], [27, 15, 1], [23, 37, 2], [24, 38, 1], [36, 39, 2], [35, 40, 1], [27, 41, 3], [28, 42, 2], [32, 45, 3], [33, 44, 2]];
// what he wants to do besides the work: hand the gingerbread over first, then point, then yawn
function waitGive(dt) { if (giveAsked > 0) { giveAsked = Math.max(0, giveAsked - dt); if (!giveAsked) pile = 0; } }   // he could not come in time: the plate is just empty
function stepBits(dt, night) {
  waitGive(dt); treatNext = Math.max(0, treatNext - dt); if (treat !== treatWas) { treatWas = treat; treatNext = 0; }
  yawnIn = night ? Math.max(0, yawnIn - dt) : Math.min(yawnIn, 20);                    // the first yawn 20 s after dark, then once a minute
  if (bit) {
    bit.u += dt;
    if (bit.name === 'give' && bit.u > 3.6) gave = true;
    if (bit.u >= BITS[bit.name]) { if (bit.name === 'give') pile = 0; bit = null; }
  } else if (!waving && canWave()) {
    if (giveAsked > 0) { bit = { name: 'give', u: 0 }; giveAsked = 0; waveAsked = 0; }
    else if (treat && treatNext <= 0 && waveAsked <= 0) { bit = { name: 'point', u: 0, dir: treat }; treatNext = 8; }
    else if (night && yawnIn <= 0 && !floury && !guest && waveAsked <= 0) { bit = { name: 'yawn', u: 0 }; yawnIn = 60; }
  }
  return !!bit;
}
// ---- the oven
function ovenState(st) {
  const gate = (k, a, b) => Math.min(smooth(a, a + .08, k), 1 - smooth(b - .08, b, k));
  const open = st.i === 7 ? gate(st.k, .52, .94) : st.i === 9 ? gate(st.k, .1, .56) : 0;
  const bake = st.i === 8 ? st.k : st.i === 9 && st.k < .34 ? 1 : st.i === 7 && st.k > .74 ? 0 : -1;
  return { open, bake };
}
function drawOven(time) {
  const { open, bake } = ovenState(st);
  R(48, 120, 36, 18, K.black[0]); R(49, 121, 34, 16, '#3a1c1c');
  for (let x = 0; x < 34; x++) { const hgt = 2 + Math.abs(Math.sin(x * .9 + time * 7) + Math.sin(x * .37 - time * 5)) * 1.7; for (let k = 0; k < hgt; k++) R(49 + x, 136 - k, 1, 1, k < 1 ? '#fff0b0' : k < 2.2 ? '#ffb347' : '#ff6a2a'); }
  for (let i = 0; i < 4; i++) R(50 + i, 121 + i, 34 - i * 2 - 2, 1, 'rgba(255,120,50,.12)');
  R(49, 131, 34, 1, '#7a6a6a');
  if (bake >= 0) { const col = mixc(hx('#f0d6a4'), hx('#a8622c'), smooth(.1, .95, bake)), rise = Math.round(1 + bake * 2); R(52, 130, 28, 1, K.steel[1]); for (let i = 0; i < 4; i++) { R(54 + i * 7, 130 - rise, 5, rise, css(col)); R(54 + i * 7, 130 - rise, 4, 1, css(mixc(col, WARM, .4))); } }
  if (open > 0) { R(47, 136 + open * 2, 38, 2 + Math.round(open * 5), K.dsteel[1]); R(48, 137 + open * 2, 36, 2, K.dsteel[3]); R(50, 138 + Math.round(open * 2), 32, Math.round(open * 3), 'rgba(255,150,70,.5)'); steam(60, 122, time * 2.4, .75, 22, 6); steam(74, 122, time * 2.4 + 2, .75, 22, 6); }
  else { R(47, 119, 38, 2, K.steel[2]); R(47, 119, 38, 1, K.steel[4]); R(47, 119, 1, 20, K.dsteel[1]); R(84, 119, 1, 20, K.dsteel[0]); R(47, 137, 38, 2, K.dsteel[1]); R(52, 119, 28, 1, '#ffffff'); for (let i = 0; i < 7; i++) R(52 + i, 133 - i * 2, 1, 2, 'rgba(255,255,255,.16)'); }
  // the timer on the panel
  if (st.i === 8) R(64, 116, Math.max(1, Math.round(4 * (1 - st.k))), 1, '#7dff9a'); else R(64, 116, 1, 1, Math.sin(time * 4) > 0 ? '#ff9a6a' : '#5a3434');
}
// where he stands and which way he is turned: front (to us), left, right, back (to the oven)
function place() {
  if (act) return actPlace();
  const { i, k } = st; let X = HOME, view = 'front';
  if (i === 7) { X = HOME + (AT - HOME) * smooth(.1, .46, k); view = k < .08 ? 'front' : k < .48 ? 'left' : 'back'; }
  else if (i === 8) {
    if (k < .04) { X = AT; view = 'back'; } else if (k < .26) { X = AT + (HOME - AT) * smooth(.04, .24, k); view = 'right'; }
    else if (k > .78) { X = HOME + (AT - HOME) * smooth(.78, .96, k); view = k > .97 ? 'back' : 'left'; }
  } else if (i === 9) { if (k < .58) { X = AT; view = 'back'; } else { X = AT + (HOME - AT) * smooth(.6, .95, k); view = k < .97 ? 'right' : 'front'; } }
  return [X, view];
}
// ---- the cook, the table and everything on it
// the cook washes the bowl (once a day) and sweeps the flour off the floor (in the morning). The arms are set by hand, as in every pose of baker.js
const ACTS = { wash: 11, sweep: 9 }, SINK = 222;
const WIPE = (x, k) => Math.abs(x - 112) > (k < .26 ? -1 : (k - .26) / .2 * 18);            // the flour on the table goes away from the cloth outwards
function actPlace() {
  const u = act.t;
  if (act.name === 'wash') return u < 3 ? [HOME + (SINK - HOME) * smooth(0, 3, u), 'right'] : u < 8 ? [SINK, 'back'] : [SINK + (HOME - SINK) * smooth(8, 11, u), 'left'];
  return u < 5 ? [HOME + (70 - HOME) * u / 5, 'left'] : [70 + (HOME - 70) * smooth(5, 8.6, u), u < 8.7 ? 'right' : 'front'];
}
function drawAct(X, view, time) {
  const ox = Math.round(X) - 30, u = act.t, lx = (x) => ox + x;
  const bowl = (x, y) => { R(x, y, 12, 2, K.steel[3]); R(x, y, 12, 1, K.steel[4]); R(x + 1, y + 2, 10, 2, K.steel[2]); R(x + 3, y + 4, 6, 1, K.steel[1]); R(x + 9, y + 1, 2, 3, K.steel[0]); R(x + 2, y + 2, 2, 1, '#ffffff'); };
  if (view === 'front') { G.drawImage(sheet, 0, 0, 80, 70, -1000, 0, 80, 70); G.drawImage(sheet, 0, 0, 40, 70, ox, 78, 40, 70); G.drawImage(sheet, 40, 0, 40, 61, ox, 78, 40, 61); arm(ox, 78, SL, REST.l[0], REST.l[1]); arm(ox, 78, SR, REST.r[0], REST.r[1], { flip: true }); }
  else if (view === 'back') {
    // at the sink: the bowl turns under the water, the bubbles fly up
    const y = 78, s = Math.round(Math.sin(u * 5) * 1);
    arm(ox, y, SL, [19, 40], [19, 44], { noEdge: true });
    R(239, 109, 2, 7, '#bfe2f6'); R(240, 109, 1, 7, '#eaf7ff'); if (Math.floor(u * 10) & 1) R(239, 112, 1, 1, '#ffffff');
    bowl(235 + s, 115); R(238, 115, 4, 1, '#d9effa'); R(236 + s, 114, 3, 1, '#ffffff'); R(241 + s, 114, 3, 1, '#ffffff');
    for (let n = 0; n < 3; n++) { const q = (u * 1.4 + n / 3) % 1; R(236 + n * 5 + s, 119 + q * 3, 1, 1, '#d9effa'); }
    for (let n = 0; n < 5; n++) { const q = (u * .4 + n / 5) % 1, b = q < .5 ? 2 : 1; R(234 + n * 3 + Math.sin(u * 2 + n) * 2, 114 - q * 14, b, b, `rgba(236,248,255,${(.9 * (1 - q)).toFixed(2)})`); }
    arm(ox, y, SR, [42, 39], [43 + s, 41], { noEdge: true, flip: true });
    G.drawImage(sheet, 80, 0, 40, 56, ox, y, 40, 56); G.drawImage(sheet, 80, 56, 40, 14, ox, 134, 40, 14);
  } else {
    const f = Math.floor(u * (act.name === 'wash' ? 8 : 5)) & 3, y = 78 + (f & 1 ? -1 : 0), wash = act.name === 'wash';
    G.save(); if (view === 'right') { G.translate(2 * (ox + 30), 0); G.scale(-1, 1); }
    if (wash) arm(ox, y, [28, 36], [25, 41], [19, 42], { noEdge: true });
    else arm(ox, y, [28, 36], [26, 41], [20, 45], { noEdge: true });
    G.drawImage(sheet, (3 + f) * 40, 0, 40, 70, ox, y, 40, 70);
    if (wash) bowl(lx(10), y + 38);
    else {
      // the broom: a straight stick and the bristles on the floor
      const b = view === 'left' ? Math.round(Math.sin(u * 6)) : 0, y0 = y + 32, y1 = 143;
      for (let yy = y0; yy < y1; yy++) { const q = (yy - y0) / (y1 - y0), xx = Math.round(lx(22) + (lx(12) + b - lx(22)) * q); R(xx, yy, 2, 1, K.wood[2]); R(xx, yy, 1, 1, K.wood[4]); }
      R(lx(9) + b, 143, 7, 1, K.red[2]); R(lx(8) + b, 144, 8, 4, K.gold[2]); R(lx(8) + b, 144, 8, 1, K.gold[4]); for (let n = 0; n < 8; n += 2) R(lx(8) + b + n, 145, 1, 3, K.gold[1]); R(lx(7) + b, 148, 8, 1, K.gold[0]);
      if (view === 'left') for (let n = 0; n < 4; n++) { const q = (u * 1.3 + n / 4) % 1; R(lx(7) - q * 6, 148 - q * 5 + (n & 1), q > .5 ? 2 : 1, 1, `rgba(246,242,248,${(.8 * (1 - q)).toFixed(2)})`); }
    }
    if (wash) arm(ox, y, [30, 36], [30, 42], [22, 44]);
    else arm(ox, y, [30, 36], [29, 41], [21, 40]);
    G.restore();
  }
  G.drawImage(table, 0, 0);
}
function drawCook(time) {
  const { i, u, k } = st;
  const [X, view] = place();
  const ox = Math.round(X) - 30, TB = T_Y, RAW = '#e8c88c', DONE = '#a8622c';
  const push = i === 4 ? Math.max(0, Math.sin(u * 4.2)) : 0, roll = i === 5 ? Math.sin(u * 3.2) : 0;
  const bob = i === 4 ? Math.round(push * 1.2) : i === 2 && Math.sin(u * 8) > .5 ? 1 : 0;
  const lx = (x) => ox + x, ly = (y) => 78 + y;                      // sprite to scene
  const tray = (tx, ty, col, ice, w = 28) => {
    const n = Math.floor(w / 7);
    R(tx - w / 2, ty, w, 2, K.steel[1]); R(tx - w / 2, ty, w, 1, K.steel[3]); R(tx - w / 2, ty + 2, w, 1, K.dsteel[0]);
    for (let q = 0; q < n; q++) {
      const px = tx - w / 2 + 1 + q * 7; R(px, ty - 2, 5, 2, col); R(px, ty - 2, 4, 1, css(mixc(hx('#ffffff'), hx('#c98a4a'), .35)));
      if (ice > q) iceTop(px, ty - 3);
    }
  };

  if (act) drawAct(X, view, time);
  else if (view === 'left' || view === 'right') {
    // walking: seen from the side, the head and the body look where he goes
    const right = view === 'right', f = Math.floor(t * 7) & 3, y = 78 + (f & 1 ? -1 : 0), load = i === 7 || i === 9, col = i === 7 ? RAW : DONE;
    G.save(); if (right) { G.translate(2 * (ox + 30), 0); G.scale(-1, 1); }
    if (load) arm(ox, y, [28, 36], [25, 41], [19, 42], { noEdge: true });                                      // the far arm
    G.drawImage(sheet, (3 + f) * 40, 0, 40, 70, ox, y, 40, 70);
    if (load) { tray(lx(15), y + 44, col, 0, 15); arm(ox, y, [30, 36], [30, 42], [22, 44]); if (i === 9) { steam(lx(11), y + 40, time * 1.6, .7, 14); steam(lx(18), y + 40, time * 1.6 + 1, .7, 14); } }
    else { const sw = [3, 0, -3, 0][f]; arm(ox, y, [30, 36], [30 - sw * .5, 41], [30 + sw, 46]); }
    G.restore(); G.drawImage(table, 0, 0);
  } else if (view === 'back') {
    // at the oven: his back is to us, the tray and the hands are in front of him
    const reach = i === 7 ? smooth(.64, .74, k) * (1 - smooth(.84, .9, k)) : i === 9 ? smooth(.2, .32, k) * (1 - smooth(.36, .46, k)) : 0, dn = Math.round(reach * 2), y = 78 + dn;
    const has = i === 7 ? k < .74 : i === 9 ? k > .34 : false, hyy = Math.round(44 - reach * 4), w = has || reach > .3 ? 14 : 11;
    if (has) tray(lx(30), y + hyy - 1, i === 7 ? RAW : DONE, 0, 35);
    arm(ox, y, SL, [19, 40], [30 - w, hyy], { noEdge: true }); arm(ox, y, SR, [41, 40], [30 + w, hyy], { noEdge: true, flip: true });
    G.drawImage(sheet, 80, 0, 40, 56, ox, y, 40, 56); G.drawImage(sheet, 80, 56, 40, 14, ox, 134, 40, 14);
    if (has && i === 9) { steam(lx(18), y + 40, time * 1.8, .7, 18); steam(lx(43), y + 40, time * 1.8 + 1, .7, 18); }
    G.drawImage(table, 0, 0);
  } else {
    const by = 78 + bob, hb = by + (i < 7 || i === 10 ? 1 : 0);
    if (waving) G.drawImage(waves[Math.floor(waveT * 8) & 7], HOME - 30, 78);   // the cook with the spoon instead of the working one
    else {
      G.drawImage(sheet, 0, 0, 40, 70, ox, 78, 40, 70);
      G.drawImage(sheet, 40, 51, 40, 10, ox, 129, 40, 10); G.drawImage(sheet, 40, 32, 40, 19, ox, by + 32, 40, 19);
      const turn = turned(), yawn = bit && bit.name === 'yawn';
      head(ox, hb - (yawn && bit.u > .5 && bit.u < 2.2 ? 1 : 0), turn);
      if (!yawn && time % 4.1 < .14) { R(lx(27 + turn * 2), hb + 24, 2, 1, SKN[1]); R(lx(31 + turn * 2), hb + 24, 2, 1, SKN[1]); }
      if (i === 11) R(lx(29 + turn), hb + 29, 3, 1, '#fff0ea');
    }
    G.drawImage(table, 0, 0);
  }

  const icePlace = (k) => { const icK = k * 4.2, icN = Math.min(3, Math.floor(icK)); return { icing: icK < 4 ? icN + (icK - icN > .75 ? 1 : 0) : 4, off: Math.round(15 - 7 * (Math.max(0, icN - 1) + (icN ? smooth(0, .3, icK - icN) : 0))) }; };
  const pin = (q) => { R(lx(22) + q, ly(40), 16, 4, K.wood[3]); R(lx(22) + q, ly(40), 16, 1, K.wood[4]); R(lx(22) + q, ly(43), 16, 1, K.wood[1]); R(lx(18) + q, ly(41), 4, 2, K.dwood[3]); R(lx(38) + q, ly(41), 4, 2, K.dwood[3]); };
  // the food and the tools: they stay on the table even when he is away
  const B = (x) => HOME - 30 + x, dq = ramp('#eccf98');
  const steel = (x, y) => { R(x, y + 1, 14, 2, K.steel[3]); R(x, y + 1, 14, 1, K.steel[4]); R(x + 1, y + 3, 12, 3, K.steel[2]); R(x + 3, y + 6, 8, 1, K.steel[1]); R(x + 11, y + 2, 2, 3, K.steel[0]); R(x + 2, y + 3, 2, 2, '#ffffff'); };
  if (i >= 3 && i <= 8) for (let n = 0; n < 12; n++) if (i < 8 || WIPE(96 + (n * 7) % 30, k)) R(96 + (n * 7) % 30, TB + 1 + (n % 3), 1, 1, '#fff6ea');
  const lift = i === 3 ? Math.round(smooth(0, .2, k) * 5 * (1 - smooth(.6, .85, k))) : 0, slide = i === 3 ? smooth(.4, .85, k) : 0;
  const bwx = B(18) + Math.round(slide * 22), bwy = TB - 7 - lift;
  if (i === 2) { R(bwx + 1, bwy - 1, 12, 2, dq[2]); R(bwx + 1 + (Math.floor(u * 8) % 6), bwy - 1, 4, 1, dq[4]); }
  else if (i === 0) { if (k > .25) R(bwx + 2, bwy, 10, 1, '#fff6ea'); }
  else if (i === 1) { R(bwx + 1, bwy, 12, 1, '#fff6ea'); if (k > .45) R(bwx + 4, bwy - 1, 3, 1, '#ffc23c'); if (k > .95) R(bwx + 8, bwy - 1, 3, 1, '#ffc23c'); }
  if (i === 3 && k > .18) {
    const y = TB - 5 - Math.round((1 - smooth(.18, .34, k)) * 4), sq = k > .34 && k < .46 ? 1 : 0;
    const dx = B(21) + Math.round(slide * 4); R(dx - sq, y + sq, 10 + sq * 2, 6 - sq, dq[2]); R(dx + 1, y + sq, 7, 1, dq[4]); R(dx + 9, y + 2, 1, 4 - sq, dq[1]); R(dx, TB, 10, 1, dq[0]);
    if (sq) for (let n = 0; n < 6; n++) R(B(16) + n * 4, TB - 2 - (n % 3), 1, 1, '#ffffff');
  }
  if (i <= 3) steel(bwx, bwy); else if (i < 10) steel(B(44), TB - 7);
  if (i === 4) {
    const sq = Math.round(push * 3), w = 12 + sq * 2;
    R(B(30) - w / 2, TB - 6 + sq, w, 7 - sq, dq[2]); R(B(30) - w / 2 + 1, TB - 6 + sq, w - 3, 1, dq[4]); R(B(30) + w / 2 - 1, TB - 4 + sq, 1, 5 - sq, dq[1]); R(B(30) - w / 2, TB, w, 1, dq[0]);
    if (push > .9) for (let n = 0; n < 5; n++) R(B(21) + n * 4, TB - 1 - (n % 2), 1, 1, '#ffffff');
  }
  if (i === 5) { const w = Math.round(14 + 14 * smooth(0, .9, k)), h = Math.round(4 - 2 * smooth(0, .8, k)); R(B(30) - w / 2, TB + 1 - h, w, h + 1, dq[2]); R(B(30) - w / 2, TB + 1 - h, w, 1, dq[4]); R(B(30) - w / 2, TB + 2, w, 1, dq[0]); }
  const cut = [17, 23, 37, 43];
  if (i === 6) { R(B(13), TB, 34, 3, dq[2]); R(B(13), TB, 34, 1, dq[4]); R(B(13), TB + 2, 34, 1, dq[0]); const n = Math.min(4, Math.floor((u + .9) / 1.75)); for (let q = 0; q < n; q++) { R(B(cut[q]) - 3, TB, 6, 3, dq[1]); R(B(cut[q]) - 2, TB, 4, 2, '#f3dcae'); } }

  if (view === 'front' && (waving || bit)) {
    // what he has put down for the wave
    if (i === 0) { const x = B(10), y = TB; R(x - 4, y - 9, 9, 9, '#efe2c8'); R(x - 4, y - 9, 9, 1, '#fff8e8'); R(x - 4, y - 9, 1, 9, '#fff8e8'); R(x + 4, y - 8, 1, 8, '#c2ad8c'); R(x - 2, y - 6, 5, 3, K.red[2]); }
    if (i === 5) pin(Math.round(roll * 3));
    if (i === 10) tray(B(30) + icePlace(k).off, TB - 1, DONE, icePlace(k).icing);
    if (bit) bitArms(ox, 78 + bob);
  } else if (view === 'front') {
    const by = 78 + bob; let L = REST.l, Q = REST.r, cutN = -1, cloth = false, sweat = false;
    const { icing, off } = icePlace(k);
    if (i < 0) { /* he rests */ }
    else if (i === 0) { const tl = smooth(.1, .25, k) * (1 - smooth(.82, .95, k)); L = [[18, 40 - tl * 2], lerp2([15, 42], [13, 30], tl)]; Q = [[38, 41], [33, 43]]; }
    else if (i === 1) { const c = (k % .5) / .5; L = [[20, 40], [19, c < .35 ? 38 - Math.abs(Math.sin(c * 18)) * 3 : 34]]; Q = [[39, 41], [33, 43]]; }
    else if (i === 2) { L = [[20, 40], [18, 43]]; Q = [[39, 40], [30 + Math.cos(u * 8) * 2, 36 + Math.sin(u * 8)]]; }
    else if (i === 3) { const hl = 43 - lift; L = [lerp2([20, 40], [22, 41], slide), lerp2([18, hl], [24, 45], slide)]; Q = [[39, 40], lerp2([33, hl], [43, 43], slide)]; }
    else if (i === 4) { const y = 38 + push * 3; L = [[20, 40], [26, y]]; Q = [[40, 40], [34, y]]; }
    else if (i === 5) { L = [[20 + roll, 40], [18 + roll * 3, 42]]; Q = [[40 + roll, 40], [42 + roll * 3, 42]]; }
    else if (i === 6) { cutN = Math.min(3, Math.floor(u / 1.75)); const y = 37 + Math.max(0, Math.sin((u % 1.75) / 1.75 * Math.PI * 2 - .6)) * 4; if (cutN < 2) { L = [[20, 40], [cut[cutN], y]]; } else Q = [[40, 40], [cut[cutN], y]]; }
    else if (i === 7 || i === 9) { L = [[20, 41], [18, 44]]; Q = [[40, 41], [42, 44]]; tray(lx(30), ly(44), i === 7 ? RAW : DONE, 0); }
    else if (i === 8) {
      if (k < .46 || k > .66) { Q = [[39, 41], [36 + Math.sin(u * 4.5) * 3, 44]]; cloth = true; }
      else { const tl = smooth(.46, .5, k) * (1 - smooth(.62, .66, k)); L = [lerp2([22, 41], [17, 34], tl), lerp2([24, 45], [23 + Math.sin(u * 6) * tl, 22], tl)]; sweat = tl > .8; }
    } else if (i === 10) { Q = [[40, 40], [36 + Math.sin(u * 6) * .8, 37]]; L = [[21, 41], [Math.max(17, Math.min(24, 14 + off)), 44]]; }
    else { L = [[17, 37], [13, 28 + Math.sin(u * 6)]]; Q = [[42, 40], [38, 45]]; }
    if (i === 10) tray(B(30) + off, TB - 1, DONE, icing);
    if (i === 5) pin(Math.round(roll * 3));
    const hl = [Math.round(lx(L[1][0])), Math.round(by + L[1][1])], hr = [Math.round(lx(Q[1][0])), Math.round(by + Q[1][1])];
    if (i === 0) { const [x, y] = hl; R(x - 4, y - 9, 9, 9, '#efe2c8'); R(x - 4, y - 9, 9, 1, '#fff8e8'); R(x - 4, y - 9, 1, 9, '#fff8e8'); R(x + 4, y - 8, 1, 8, '#c2ad8c'); R(x - 2, y - 6, 5, 3, K.red[2]); }
    if (i === 1) { const [x, y] = hl, c = (k % .5) / .5; if (c < .45) { R(x, y - 3, 3, 4, '#fff0dc'); R(x, y - 3, 2, 1, '#ffffff'); } else { R(x - 1, y - 3, 2, 3, '#fff0dc'); R(x + 3, y - 3, 2, 3, '#fff0dc'); const f = clamp((c - .45) * 4); if (f < 1) R(x + 3, y + f * 5, 2, 2, '#ffc23c'); } }
    if (i === 2) { const [x, y] = hr; for (let n = 0; n < 4; n++) R(x - 1 - Math.round(n * .7), y + 2 + n, 1, 1, K.steel[4]); R(x - 5, y + 4, 4, 2, K.steel[2]); R(x - 5, y + 4, 4, 1, K.steel[4]); }
    if (cutN >= 0) { const [x, y] = cutN < 2 ? hl : hr; R(x - 3, y + 1, 6, 2, K.gold[3]); R(x - 3, y + 1, 6, 1, K.gold[4]); R(x - 3, y + 3, 6, 1, K.gold[0]); }
    if (i === 10) { const x = hr[0] - 2, y = hr[1]; R(x - 1, y - 4, 4, 7, '#fff6ea'); R(x + 2, y - 4, 1, 7, '#d8cbd0'); R(x - 1, y - 4, 4, 1, K.red[2]); R(x, y + 3, 2, 1, K.gold[2]); if (icing < 4) R(x, y + 4, 1, Math.max(1, TB - 4 - y - 4), '#fff6ea'); }
    arm(ox, by, SL, L[0], L[1]); arm(ox, by, SR, Q[0], Q[1], { flip: true });
    if (i === 0 && k > .25 && k < .8) {
      const x = hl[0] + 6; R(x - 1, hl[1] - 1, 3, 2, '#d8c8a8');
      for (let n = 0; n < 12; n++) R(x + (n % 3), hl[1] + 1 + ((time * 26 + n * 3) % 9), 1, 2, '#fffaf0');
      for (let n = 0; n < 7; n++) { const q = (time * .8 + n / 7) % 1; R(B(22) + (n - 3) * 2.6 * (1 + q), TB - 8 - q * 8, q > .5 ? 2 : 1, 1, `rgba(255,250,240,${(.75 * (1 - q)).toFixed(2)})`); }
    }
    if (cloth) { R(hr[0] - 3, TB - 1, 7, 2, K.cream[3]); R(hr[0] - 3, TB, 7, 1, K.red[3]); }
    if (sweat) R(lx(37), 78 + 20 + (u * 8 % 7), 1, 2, '#a8dcf4');
    if (i === 11) { bigC(hl[0] - 5, hl[1] - 12); for (let n = 0; n < 5; n++) { const q = u * 3 + n * 1.26; if (Math.sin(u * 9 + n) > 0) R(hl[0] + Math.cos(q) * 6, hl[1] - 4 + Math.sin(q) * 6, 1, 1, '#fff2a0'); } }
  }
  if (bit && bit.name === 'give') drawBag();
  if (floury && !act) drawFlour(time, ox, 78 + bob, view, turned());
}

// the wave stops his work for 2 seconds; he waves only when he stands face to us with nothing in the air
function canWave() { const [x, view] = place(); return st.i >= 0 && ![3, 7, 9, 11].includes(st.i) && view === 'front' && x === HOME && waves.every(ready); }
// quick taps: up to two times faster (from 2 taps a second, the whole from 7); after 3 seconds of silence the usual speed
function tempo(minute) { return minute ? 3 : 1 + hot * (1 - smooth(1.5, 3, quiet)); }
return {
  // once a frame
  // o: season, night (the calendar), guest (a customer waits), x (his middle)
  step(dt, anim, minute, o) {
    season = o.season; guest = o.guest; buyerX = o.x; floury = minute && anim;
    if (act) { waitGive(dt); act.t += dt; if (!anim || act.t >= ACTS[act.name]) { act = null; st = cookState(t); } else return; }
    clock += dt; quiet += dt; waveAsked = Math.max(0, waveAsked - dt);
    while (taps.length && clock - taps[0] > 1.5) taps.shift();
    const want = clamp((taps.length / 1.5 - 2) / 5); hot = want > hot ? Math.min(want, hot + dt * 2) : Math.max(want, hot - dt * (quiet > 3 ? 9 : .3));
    if (!anim) { st = REST_STATE; waving = false; waveAsked = 0; if (bit && bit.name === 'give' || giveAsked > 0) pile = 0; bit = null; giveAsked = 0; return; }
    if (stepBits(dt, o.night)) return;                               // the clock of the cooking stands
    if (waving) { waveT += dt; if (waveT >= WAVE_S) waving = false; }
    if (!waving) {
      const was = cookState(t).i; t = (t + dt * tempo(minute)) % CYCLE; st = cookState(t);
      if (st.i === 11 && was !== 11) pile = Math.min(4, pile + 1);   // one more baking is on the plate
      if (waveAsked > 0 && canWave()) { waving = true; waveT = 0; waveAsked = 0; }
    }
  },
  ready: () => ready(sheet),
  draw(g, time) { if (!ready(sheet)) { g.drawImage(table, 0, 0); return; } G = g; drawCook(time); },
  drawOven(g, time) { G = g; drawOven(time); },
  get oven() { return ovenState(st); },
  get mixing() { return st.i === 2 && !waving && !bit; },
  get place() { return place(); },
  get state() { return { step: st.i + 1, name: st.name, k: st.k, t, pile, waving, bit: bit && bit.name, tempo: tempo(false) }; },
  tap() { quiet = 0; taps.push(clock); if (taps.length > 30) taps.shift(); },
  wave(wait) { waveAsked = wait; },                                  // wait: for how many seconds he may put it off
  poke() { if (!taps.length) waveAsked = Math.max(waveAsked, 4); },    // a tap on him; in a row of quick taps they are meant for the cookie
  // the gingerbread is sold: he packs the pile and hands it over as soon as his hands are free (12 s at most, then the plate is just empty)
  give(anim) { gave = false; if (anim) giveAsked = 12; else pile = 0; },
  get giving() { return giveAsked > 0 || !!bit && bit.name === 'give'; },
  // the bag on its way from the table into the hands of the customer, over him; x: his middle, top: of his head, feet
  drawGift(g, x, top, feet) {
    G = g; const held = feet - Math.round((feet - top) * .36), u = bit && bit.name === 'give' ? bit.u : 9;
    if (u > 3.1 && u < 9) { const k = clamp((u - 3.1) / .5), x0 = Math.min(205, x - 9), y0 = T_Y + 2; bag(x0 + (x - x0) * k, y0 + (held - y0) * k - Math.sin(k * Math.PI) * 10, 4, true); } else if (u === 9 && gave) bag(x, held, 4, true);
    if (u > 3.6 && u < 9) { const q = clamp((u - 3.6) / .9); ['.#.#.', '#####', '.###.', '..#..'].forEach((r, j) => { for (let i = 0; i < 5; i++) if (r[i] === '#') R(x - 2 + i, top - 7 - q * 6 + j, 1, 1, `rgba(255,90,110,${(1 - q * .6).toFixed(2)})`); }); }
  },
  treat(dir) { treat = dir; },                                       // the glowing food: 1 on the right of him, -1 on the left, 0 nothing
  drawPlate(g) { G = g; drawPlate(); },
  get plateKey() { return season + ',' + pileNow(); },
  // 'wash' or 'sweep'; null = he leaves it at once
  act(name, at) { if (name === null) { act = null; st = cookState(t); } else { act = { name, t: at || 0 }; st = { i: 11, u: 0, k: 0, name }; } },
  get doing() { return act; },
  // for the checks
  set(o) { if (o.t !== undefined) { t = o.t; st = cookState(t); } if (o.pile !== undefined) pile = o.pile; if (o.wave !== undefined) { waving = o.wave >= 0; waveT = o.wave; } if (o.bit !== undefined) bit = o.bit; if (o.yawn !== undefined) yawnIn = o.yawn; },
};
};
