// the kitchen of the living bakery: the game time, the room, the sky in the window and the light of the hour.
// One file for the computer and the phone (phone/src/kitchen.js is a copy made by docs/living-bakery/build_kitchen.py).
// The room itself is drawn once; the clock, the lamps and the light are refreshed 4 times a second, the fire and the view in the window (src/view.js) 10 times, the cook (src/baker.js) 20 times a second, the moving things (src/things.js) 14.
window.KITCHEN = (function () {
'use strict';
const W = 320, H = 180, FLOOR = 146;
const HOUR_S = 30;                                                   // one game hour = 30 s; a day 12 min, a season 10 days, a year 40 days
const T_Y = 123;                                                     // the top of the work table
const START = 4 * 24 + 10;                                           // a new game: spring, day 5, 10:00
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const hx = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mixc = (a, b, t) => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t));
const css = (c, a) => a === undefined ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const rnd = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + .5) / 16);

let WEATHER = 'auto';                                                // the test address can force 'clear' or 'wet'
// t: game hours since the first spring midnight
function calendar(t) {
  const day = Math.floor(t / 24), yd = ((day % 40) + 40) % 40, h = ((t % 24) + 24) % 24, ydf = yd + h / 24;
  const len = 12 + 5 * Math.cos((yd + .5 - 15) / 40 * 2 * Math.PI);  // one length for the whole day: 17 h in the middle of summer, 7 h in the middle of winter
  const sr = 12.5 - len / 2, ss = 12.5 + len / 2;
  // the weather of the day: about one day in three has rain or snow for a part of it
  const from = 6 + rnd(day + 9) * 8, to = from + 4 + rnd(day + 2) * 6;
  let wet = rnd(day * 3.7 + 5) < .36 && h > from && h < to ? Math.min(smooth(from, from + 1, h), 1 - smooth(to - 1, to, h)) : 0;
  if (WEATHER === 'clear') wet = 0; if (WEATHER === 'wet') wet = 1;
  return {
    t, day, yd, ydf, h, sr, ss, len, season: Math.floor(yd / 10), dawn: h < 12, dayOfSeason: yd % 10 + 1,
    dayK: smooth(sr - 1, sr + 1, h) * (1 - smooth(ss - 1, ss + 1, h)),                          // 0 night, 1 day
    glowK: clamp(Math.max(1 - Math.abs(h - sr) / 1.3, 1 - Math.abs(h - ss) / 1.3)),             // the colours of the sunrise and the sunset
    warm: (1 + Math.cos((ydf - 15) / 40 * 2 * Math.PI)) / 2,                                    // 1 midsummer, 0 midwinter
    wet,                                                                                        // 0 dry, 1 rain, a shower or snow
    moonPhase: ((yd % 10 + (h - 12) / 24 + 10) % 10) / 10,                                      // 8 phases, one circle in a season
  };
}
const DARK = hx('#2a2040'), WARM = hx('#fff2d8');
const ramp = (h) => { const c = hx(h); return [mixc(c, DARK, .45), mixc(c, DARK, .22), c, mixc(c, WARM, .24), mixc(c, WARM, .48)].map((q) => css(q)); };
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; };
let G = null;                                                        // the current context
const on = (g, fn) => { const keep = G; G = g; fn(); G = keep; };
const R = (x, y, w, h, col) => { G.fillStyle = col; G.fillRect(Math.round(x), Math.round(y), w, h); };
function disc(g, cx, cy, r, col) {
  g.fillStyle = col;
  for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r + r * .6 - y * y)); g.fillRect(cx - w, cy + y, w * 2 + 1, 1); }
}

const WIN = { pc: [196, 25, 112, 41], phone: [201, 27, 40, 39] };    // the window: frame rectangle
const K = { wall: ramp('#d8a98e'), tile: ramp('#e4cbb2'), trim: ramp('#b5624e'), wood: ramp('#b47b4c'), dwood: ramp('#7c5038'), green: ramp('#6f9a7c'), mint: ramp('#7fb8a8'), steel: ramp('#aeb7c4'), dsteel: ramp('#56657a'), blue: ramp('#a9c8de'), cream: ramp('#f1e6d2'), red: ramp('#c8404a'), gold: ramp('#e0ac4c'), lilac: ramp('#a593cf'), floorA: ramp('#b4b4c9'), floorB: ramp('#a0a3bf'), copper: ramp('#b9683f'), black: ramp('#3d3a48') };
function bevel(x, y, w, h, r, b = 2) { R(x, y, w, h, r[b]); R(x, y, w, 1, r[b + 1]); R(x, y, 1, h, r[b + 1]); R(x, y + h - 1, w, 1, r[b - 1]); R(x + w - 1, y, 1, h, r[b - 1]); }
function shadowBox(x, y, w, h, a = .22) { R(x + 2, y + h, w - 1, 2, `rgba(60,30,50,${a})`); R(x + w, y + 2, 1, h, `rgba(60,30,50,${a * .8})`); }


const GROUT = css(mixc(hx('#e4cbb2'), hx('#8f6a66'), .24)), TLITE = css(mixc(hx('#e4cbb2'), hx('#fff2d8'), .34)), TDARK = css(mixc(hx('#e4cbb2'), hx('#8f6a66'), .1));
function drawStatic(layout) {
  // the upper wall: calm plaster with a faint diamond pattern, so the counter is easy to read on it
  R(0, 0, W, 74, K.wall[2]);
  for (let y = 0; y < 74; y++) for (let x = 0; x < W; x++) { const a = (x + y) % 16, b = (x - y + 320) % 16; if (a === 0 && b === 0) { R(x, y - 1, 1, 3, K.wall[3]); R(x - 1, y, 3, 1, K.wall[3]); } else if ((x + 8) % 16 === 0 && (y + 8) % 16 === 0) R(x, y, 1, 1, K.wall[1]); }
  for (let y = 0; y < 22; y++) R(0, y, W, 1, `rgba(70,34,60,${(.16 * (1 - y / 22)).toFixed(3)})`);
  // the border row and the glazed tiles under it
  R(0, 74, W, 5, K.trim[2]); R(0, 74, W, 1, K.trim[4]); R(0, 78, W, 1, K.trim[0]);
  for (let x = 0; x < W; x += 8) { R(x + 3, 75, 2, 3, K.trim[4]); R(x + 2, 76, 4, 1, K.trim[4]); R(x, 75, 1, 3, K.trim[1]); }
  for (let y = 79; y < FLOOR; y += 8) for (let x = -8; x < W; x += 8) {
    const alt = rnd(x * 3.1 + y * 7.7), q = alt < .12 ? css(mixc(hx('#e4cbb2'), hx('#fff2d8'), .16)) : alt > .9 ? css(mixc(hx('#e4cbb2'), hx('#c88f74'), .14)) : K.tile[2];
    R(x, y, 8, 8, GROUT); R(x, y, 7, 7, q); R(x, y, 7, 1, TLITE); R(x, y, 1, 7, TLITE); R(x + 1, y + 6, 6, 1, TDARK); R(x + 6, y + 1, 1, 6, TDARK);
  }
  R(0, 140, W, 6, K.dwood[2]); R(0, 140, W, 1, K.dwood[4]); R(0, 145, W, 1, K.dwood[0]);
  // the floor: tiles get taller towards the viewer
  for (let row = 0, y = FLOOR; y < 166; row++) { const h = 4 + row * 1; for (let x = -8; x < W; x += 16) { const f = (row & 1) * 8; const pair = [K.floorA, K.floorB]; for (let k = 0; k < 2; k++) { const q = pair[k], px = x + f + k * 8; R(px, y, 8, h, q[2]); R(px, y, 8, 1, q[3]); R(px, y + h - 1, 8, 1, 'rgba(70,64,110,.16)'); R(px + 7, y, 1, h, 'rgba(70,64,110,.16)'); } } y += h; }
  R(0, FLOOR, W, 2, 'rgba(50,40,80,.25)');
  // the counter at the bottom edge
  R(0, 165, W, 15, K.wood[2]); R(0, 165, W, 1, K.wood[4]); R(0, 166, W, 1, K.wood[3]); for (let y = 168; y < 176; y += 2) for (let x = (y * 37) % 31; x < W; x += 34 + (y % 5) * 3) R(x, y, 12 + (x % 9), 1, K.wood[1]);
  for (let x = 40; x < W; x += 80) { R(x, 167, 1, 9, K.wood[0]); R(x + 1, 167, 1, 9, K.wood[3]); }
  if (layout === 'phone') { G.save(); G.beginPath(); G.rect(0, 165, W, 15); G.clip(); G.translate(0, 165); drawCounter(W); G.restore(); }   // on the phone the wood goes on down to the buttons
  else { R(0, 176, W, 1, K.wood[4]); R(0, 177, W, 3, K.dwood[1]); R(0, 179, W, 1, K.dwood[0]); }
  // the sign, the clock, the pans, the jars, the apron, the towel, the kettle, the board with the pies, the cake, the note and the magnets: things.js
  // vent, books, tins
  shadowBox(8, 50, 28, 9); bevel(8, 50, 28, 9, K.steel); for (let y = 52; y < 58; y += 2) { R(10, y, 24, 1, K.dsteel[2]); R(10, y + 1, 24, 1, K.steel[3]); }
  // hood
  R(63, 48, 6, 24, K.steel[2]); R(63, 48, 1, 24, K.steel[4]); R(64, 48, 1, 24, K.steel[3]); R(68, 48, 1, 24, K.steel[0]); R(61, 47, 10, 2, K.steel[1]);
  for (let i = 0; i < 8; i++) R(60 - i * 2.4, 72 + i * .9, 12 + i * 4.8, 1, K.steel[3]);
  bevel(41, 78, 50, 6, K.steel); R(43, 79, 40, 1, K.steel[4]); R(41, 84, 50, 1, K.dsteel[1]); R(44, 80, 5, 2, K.dsteel[2]); for (const x of [52, 65, 78]) { R(x, 84, 3, 1, '#fff0b0'); }
  R(41, 85, 50, 2, 'rgba(60,30,50,.2)');
  // cabinet
  shadowBox(0, 82, 40, 60); bevel(0, 82, 40, 64, K.green); R(0, 82, 40, 2, K.green[4]); R(0, 84, 40, 1, K.green[0]);
  for (const y of [87, 115]) for (const x of [2, 21]) { bevel(x, y, 17, 25, K.green); R(x + 2, y + 2, 13, 21, K.green[1]); R(x + 3, y + 3, 11, 19, K.green[2]); R(x + 3, y + 3, 11, 1, K.green[1]); R(x + 3, y + 21, 11, 1, K.green[3]); R(x + 4, y + 5, 1, 14, K.green[3]); }
  for (const [x, y] of [[17, 97], [21, 97], [17, 125], [21, 125]]) { R(x, y, 2, 4, K.gold[2]); R(x, y, 1, 2, K.gold[4]); }
  R(0, 142, 40, 4, K.green[0]);
  R(4, 73, 19, 3, K.cream[2]); R(4, 73, 19, 1, K.cream[4]); R(5, 76, 17, 3, '#4d7fb4'); R(5, 76, 17, 1, '#82add8'); R(8, 77, 4, 1, K.gold[3]); R(4, 79, 18, 3, K.red[2]); R(4, 79, 18, 1, K.red[4]); R(16, 80, 3, 1, K.gold[3]);
  bevel(25, 74, 7, 8, K.gold); R(26, 77, 5, 3, K.cream[3]); bevel(32, 71, 7, 11, K.copper); R(33, 75, 5, 4, K.cream[3]); R(34, 70, 3, 1, K.copper[1]);
  // shelf
  R(40, 104, 56, 2, K.wood[3]); R(40, 106, 56, 1, K.wood[0]); R(43, 107, 2, 4, K.dwood[1]); R(90, 107, 2, 4, K.dwood[1]); R(41, 108, 54, 1, 'rgba(60,30,50,.2)');
  // pans on the rail
  R(114, 82, 24, 1, K.dsteel[1]); R(114, 81, 24, 1, K.steel[3]);
  // stove body (the inside of the oven is drawn every frame)
  shadowBox(44, 112, 44, 30); bevel(44, 111, 44, 35, K.dsteel); R(44, 111, 44, 2, K.steel[2]); R(44, 111, 44, 1, K.steel[4]);
  for (const x of [48, 62, 76]) { R(x, 109, 8, 2, K.black[1]); R(x + 1, 109, 6, 1, K.black[3]); }
  R(46, 114, 40, 5, K.dsteel[1]); for (const x of [49, 56, 73, 80]) { R(x, 115, 3, 3, K.cream[2]); R(x, 115, 2, 1, K.cream[4]); R(x + 1, 116, 1, 2, K.black[2]); } R(63, 115, 6, 3, '#1f2a30');
  R(46, 141, 40, 3, K.dsteel[1]); R(60, 142, 12, 1, K.steel[2]);
  // sink
  shadowBox(212, 122, 42, 20); bevel(212, 122, 42, 24, K.mint); for (const x of [214, 234]) { bevel(x, 126, 18, 18, K.mint); R(x + 2, 128, 14, 14, K.mint[1]); R(x + 3, 129, 12, 12, K.mint[2]); R(x + 3, 141, 12, 1, K.mint[3]); } R(229, 133, 1, 4, K.gold[3]); R(236, 133, 1, 4, K.gold[3]);
  R(210, 118, 46, 4, K.cream[2]); R(210, 118, 46, 1, '#ffffff'); R(210, 121, 46, 1, K.cream[0]); R(219, 118, 28, 2, K.steel[1]); R(220, 119, 26, 1, K.dsteel[1]);
  R(233, 104, 2, 14, K.steel[2]); R(233, 104, 1, 14, K.steel[4]); R(233, 103, 8, 2, K.steel[3]); R(239, 105, 2, 4, K.steel[2]); R(230, 115, 3, 2, K.steel[2]); R(230, 115, 1, 1, K.red[3]);
  // fridge: rounded, with a seam, hinges and a plinth
  shadowBox(268, 82, 36, 60); bevel(268, 81, 36, 65, K.blue); R(269, 80, 34, 1, K.blue[4]); R(270, 83, 2, 58, K.blue[4]); R(272, 83, 1, 58, K.blue[3]); R(300, 83, 3, 60, K.blue[1]); R(268, 108, 36, 1, K.blue[0]); R(268, 109, 36, 1, K.blue[4]); R(268, 142, 36, 4, K.blue[0]); for (const y of [89, 114]) { R(297, y, 2, 14, K.steel[4]); R(299, y + 1, 1, 14, K.dsteel[1]); }
}

function text(s, cx, y, col) {
  let w = 0; for (const ch of s) w += (FONT[ch] ? FONT[ch].rows[0].length : 3) + 1; let x = Math.round(cx - w / 2);
  for (const ch of s) { const g = FONT[ch]; if (g) { g.rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === '#') R(x + i, y + j - g.above, 1, 1, col); }); x += g.rows[0].length + 1; } else x += 4; }
}

// the wooden counter of the phone: W x 35, scene rows 165-199 (the last 20 rows are the strip between the scene and the menu)
function drawCounter(w) {
  const q = K.wood, d = K.dwood, TONE = [0, .1, -.1, .05, -.05, .14, -.14];
  const base = hx('#b47b4c'), shade = (v) => (v >= 0 ? mixc(base, WARM, v) : mixc(base, DARK, -v));
  R(0, 0, w, 35, q[2]); R(0, 0, w, 1, q[4]); R(0, 1, w, 1, q[3]);
  const ROWS = [2, 4, 8, 13, 19, 26, 32];
  for (let r = 0; r < 6; r++) {
    const y = ROWS[r], h = ROWS[r + 1] - y;
    for (let x = -Math.floor(rnd(r * 5.3) * 40), n = 0; x < w; n++) {
      const len = 38 + Math.floor(rnd(r * 11.7 + n * 3.1) * 44), k = r * 17.3 + n * 7.9, t = TONE[Math.floor(rnd(k) * 7)] - r * .012;
      R(x, y, len, h, css(shade(t)));
      const lo = css(shade(t - .14)), lo2 = css(shade(t - .24)), hi = css(shade(t + .12));
      R(x, y, len, 1, hi); R(x, y + h - 1, len, 1, lo2); R(x, y, 1, h, hi); R(x + len - 1, y, 1, h, css(shade(-.42)));
      for (let yy = 1; yy < h - 1; yy++) for (let gx = 2 + Math.floor(rnd(k + yy) * 8), m = 0; gx < len - 4; m++) {   // the grain: long soft strokes
        const gl = 4 + Math.floor(rnd(k + yy * 3.3 + m) * 13); R(x + gx, y + yy, Math.min(gl, len - 3 - gx), 1, rnd(k + yy + m * 9) > .62 ? hi : rnd(k + m * 4 + yy * 2) > .75 ? lo2 : lo); gx += gl + 5 + Math.floor(rnd(k + m * 5.1) * 12);
      }
      if (h > 4 && rnd(k + 2) > .45) {                                                                                  // a knot with its rings
        const kx = x + 9 + Math.floor(rnd(k + 5) * (len - 20)), ky = y + (h >> 1);
        R(kx - 4, ky - 1, 9, 3, css(shade(t - .08))); R(kx - 3, ky - 2, 7, 1, lo); if (h > 5) R(kx - 3, ky + 2, 7, 1, lo); R(kx - 5, ky, 1, 1, lo); R(kx + 5, ky, 1, 1, lo); R(kx - 3, ky - 1, 1, 3, lo); R(kx + 3, ky - 1, 1, 3, lo);
        R(kx - 1, ky - 1, 3, 3, lo2); R(kx - 1, ky, 3, 1, d[1]); R(kx, ky, 1, 1, d[0]); R(kx - 1, ky - 1, 1, 1, hi);
      }
      if (h > 4) { R(x + 2, y + (h >> 1), 1, 1, d[0]); R(x + len - 4, y + (h >> 1), 1, 1, d[0]); R(x + 2, y + (h >> 1) - 1, 1, 1, hi); }   // the pegs
      x += len;
    }
    R(0, y + h - 1, w, 1, 'rgba(42,32,64,.28)');
  }
  for (const [x, y, n] of [[92, 10, 6], [148, 16, 8], [203, 7, 5], [126, 23, 7], [232, 21, 6], [178, 12, 5]]) for (let i = 0; i < n; i++) R(x + i, y - (i >> 1), 1, 1, i & 1 ? q[4] : q[1]);   // scratches of the knives
  for (const [cx, cy, rw] of [[104, 6, 15], [157, 9, 18], [141, 20, 9], [236, 12, 12]]) for (let i = 0; i < rw * 4; i++) {            // traces of flour
    const a = rnd(cx + i) * 6.28, f = Math.sqrt(rnd(cy + i * 3.7)); R(cx + Math.cos(a) * rw * f, cy + Math.sin(a) * rw * .24 * f, f < .4 ? 2 : 1, 1, f < .5 ? 'rgba(255,246,228,.45)' : 'rgba(255,246,228,.25)');
  }
  R(0, 32, w, 1, q[4]); R(0, 33, w, 1, d[3]); R(0, 34, w, 1, d[0]);   // the rounded front edge
  for (let x = 5; x < w; x += 13) { R(x, 33, 5 + (x % 4), 1, d[2]); R(x + 2, 32, 4, 1, q[3]); }
}

function drawTable() {
  const q = K.wood, d = K.dwood;
  R(88, T_Y, 122, 1, q[4]); R(88, T_Y + 1, 122, 4, q[3]);
  for (let x = 88, n = 0; x < 210; n++) { const l = Math.min(210 - x, 14 + (n * 7) % 11); if (n & 1) R(x, T_Y + 1, l, 4, css(mixc(hx('#b47b4c'), WARM, .13))); R(x + 2, T_Y + 2 + n % 2, Math.max(0, l - 6), 1, q[2]); R(x + 5, T_Y + 3, Math.max(0, l - 9), 1, q[4]); R(x + l - 1, T_Y + 1, 1, 4, q[1]); x += l; }
  R(88, T_Y + 4, 122, 1, q[1]);
  R(88, T_Y + 5, 122, 10, d[2]); R(88, T_Y + 5, 122, 1, d[0]); R(88, T_Y + 6, 122, 1, d[1]); R(88, T_Y + 14, 122, 1, d[0]);
  for (let x = 88, n = 0; x < 210; x += 30, n++) { R(x, T_Y + 6, 1, 8, d[0]); R(x + 1, T_Y + 6, 1, 8, d[3]); for (let y = 8; y < 14; y += 2) R(x + 4 + (y * 5 + n * 3) % 7, T_Y + y, Math.max(0, Math.min(12, 198 - x)), 1, y % 4 ? d[1] : d[3]); }
  for (const x of [112, 183]) { R(x, T_Y + 9, 4, 3, d[1]); R(x + 1, T_Y + 10, 2, 1, d[0]); }
  bevel(136, T_Y + 7, 24, 6, K.dwood); R(147, T_Y + 9, 3, 1, K.gold[3]);
  for (const x of [91, 203]) { R(x, 138, 5, 8, K.dwood[2]); R(x, 138, 1, 8, K.dwood[4]); R(x + 4, 138, 1, 8, K.dwood[0]); R(x - 1, 146, 8, 1, 'rgba(50,40,80,.35)'); }
}

// it hangs to the right of the hood's pipe: at its old place the appearance button covered a half of it
const CAL_X = 73, CAL_Y = 54;
function drawCalendar(c, anim) {
  const col = ['#5faf62', '#e7b53c', '#d9722f', '#4f8fd0'][c.season], q = ramp(col), flip = anim && c.h < .1 ? 1 - c.h * 10 : 0;   // at midnight the sheet turns over (3 s)
  G.save(); G.translate(CAL_X - 6, CAL_Y - 61);
  shadowBox(6, 61, 24, 12); R(6, 61, 24, 12, K.cream[3]); R(6, 61, 24, 4, q[2]); R(6, 61, 24, 1, q[4]); R(6, 72, 24, 1, K.cream[1]); for (const x of [10, 18, 26]) R(x, 60, 1, 2, K.steel[1]);
  for (let i = 0; i < 10; i++) { const x = 8 + (i % 5) * 4 + 1, y = 66 + Math.floor(i / 5) * 3; R(x, y, 2, 2, i + 1 < c.dayOfSeason ? K.steel[2] : i + 1 === c.dayOfSeason ? q[2] : K.cream[1]); }
  if (flip > 0) R(6, 65 - flip * 4, 24, Math.round(8 * flip), K.cream[4]);
  G.restore();
}
const LAMPS = [99, 221];
const lampK = (c) => clamp(1 - smooth(.25, .8, c.dayK) + c.wet * .35);
function drawLamps(c) {
  const k = lampK(c);
  for (const cx of LAMPS) {
    R(cx - 1, 67, 3, 4, K.gold[1]); R(cx - 1, 67, 1, 4, K.gold[3]); R(cx - 4, 71, 9, 1, K.gold[0]);
    for (let i = 0; i < 6; i++) { const w = 3 + Math.round(i * .6), col = mixc(hx('#e9dcb8'), hx('#fff3b0'), k); R(cx - w, 72 + i, w * 2 + 1, 1, css(col)); R(cx - w, 72 + i, 1, 1, css(mixc(col, hx('#b9683f'), .55))); R(cx + w, 72 + i, 1, 1, css(mixc(col, hx('#7c5038'), .6))); }
    R(cx - 6, 78, 13, 1, K.gold[1]); if (k > .3) R(cx - 1, 79, 3, 1, '#fffbe0');
  }
}
function drawMixer(time, spin) {
  shadowBox(198, 112, 12, 12); R(198, 120, 12, 4, K.lilac[1]); R(198, 120, 12, 1, K.lilac[3]); R(206, 108, 4, 12, K.lilac[2]); R(209, 108, 1, 12, K.lilac[0]); R(197, 104, 13, 6, K.lilac[2]); R(197, 104, 12, 1, K.lilac[4]); R(197, 109, 13, 1, K.lilac[0]); R(204, 106, 2, 2, K.gold[3]);
  const f = spin ? Math.floor(time * 14) % 3 : 0; R(199 + (f === 1 ? 1 : f === 2 ? 2 : 0), 110, 1, 5, K.steel[3]); R(201 - (f === 1 ? 1 : 0), 110, 1, 5, K.steel[1]);   // the whisks
  R(197, 114, 8, 6, K.steel[2]); R(197, 114, 8, 1, K.steel[4]); R(204, 115, 1, 5, K.steel[0]); R(198, 119, 6, 1, K.steel[0]);
}
// ---- the window: the colours of the sky; the view itself is in src/view.js
const DAYSKY = [['#5fa8e0', '#cfe9ee'], ['#3f97e2', '#b4e2f4'], ['#7a9cbc', '#e6d3b0'], ['#93aecb', '#e3ecf3']];
function skyColors(c) {
  const k = (c.ydf % 10) / 10, i = c.season, j = (i + (k > .5 ? 1 : 3)) % 4, b = Math.abs(k - .5);
  const top = mixc(hx(DAYSKY[i][0]), hx(DAYSKY[j][0]), b), bot = mixc(hx(DAYSKY[i][1]), hx(DAYSKY[j][1]), b);
  let T = mixc(hx('#121738'), top, c.dayK), B = mixc(hx('#2c3466'), bot, c.dayK);
  T = mixc(T, hx(c.dawn ? '#6f7fb8' : '#54488e'), c.glowK * .75); B = mixc(B, hx(c.dawn ? '#ffb489' : '#ff8a5c'), c.glowK * .9);
  if (c.wet) { const g = mixc(hx('#23263f'), hx('#8b94a4'), c.dayK); T = mixc(T, g, c.wet * .7); B = mixc(B, g, c.wet * .55); }
  return [T, B];
}
function gradDither(g, im, w, h, T, B, n) {
  const cols = []; for (let k = 0; k <= n; k++) cols.push(mixc(T, B, k / n));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = y / (h - 1) * n, k = Math.max(0, Math.min(n, Math.floor(v + (BAYER[(y & 3) * 4 + (x & 3)] - .5) * .9 + .5))), c = cols[k], o = (y * w + x) * 4;
    im.data[o] = c[0]; im.data[o + 1] = c[1]; im.data[o + 2] = c[2]; im.data[o + 3] = 255;
  }
  g.putImageData(im, 0, 0);
}
// the frame, the curtains and the geranium: everything of the window that hangs over the glass
// snow: there is snow on the sill; wv(yy, side): the wave of the curtains; sw: the sway of the flower
function drawWindowOver(rect, bloom, snow, wv, sw) {
  const [x, y, w, h] = rect, ih = h - 6, wide = w > 80, fr = ramp('#f0e7d6');
  R(x, y, w, 2, fr[2]); R(x, y, w, 1, fr[4]); R(x, y, 2, h - 4, fr[2]); R(x, y, 1, h - 4, fr[3]); R(x + w - 2, y, 2, h - 4, fr[1]); R(x, y + h - 4, w, 1, fr[1]);
  if (wide) { const m = x + Math.round(w / 2) - 1; R(m, y + 2, 2, ih, fr[2]); R(m + 1, y + 2, 1, ih, fr[1]); }
  const sl = wide ? 2 : 0; R(x - sl, y + h - 3, w + sl * 2, 3, fr[3]); R(x - sl, y + h - 3, w + sl * 2, 1, fr[4]); R(x - sl, y + h - 1, w + sl * 2, 1, fr[0]);
  if (snow) { R(x + 2, y + h - 5, w - 4, 1, 'rgba(244,248,255,.9)'); for (let i = 0; i < w - 6; i += 5) R(x + 3 + i, y + h - 6, 3, 1, 'rgba(244,248,255,.8)'); }
  const cq = ramp('#d87f86');
  R(x - 7, y - 3, w + 13, 2, K.dwood[2]); R(x - 7, y - 3, w + 13, 1, K.dwood[4]);
  for (const [cx, d] of [[x - 3, 1], [x + w - 6, -1]]) for (let yy = 0; yy < h + 1; yy++) {
    const tie = Math.abs(yy - 24) < 1, ww = !wide ? (tie ? 4 : 5) : yy < 24 ? 9 - Math.round(yy / 9) : 6 + Math.round((yy - 24) / 10), ox = !wide ? (d > 0 ? x - 5 + (tie ? 1 : 0) : x + w) : (d > 0 ? cx : cx + 9 - ww) + wv(yy, d);
    for (let i = 0; i < ww; i++) { const f = (i + (d > 0 ? 0 : 1)) % 3; R(ox + i, y - 1 + yy, 1, 1, tie ? K.gold[1] : yy > h - 2 ? cq[0] : f === 0 ? cq[1] : f === 1 ? cq[3] : cq[2]); }
  }
  if (!wide) return;                                                 // the phone shows only one leaf of the window, without the flower
  const px = x + w - 24, py = y + h - 4, gq = ramp('#4f9a5a');
  for (const [ax, ay, s] of [[0, -8, 4], [-4, -6, 4], [4, -7, 4], [-1, -11, 4], [3, -11, 3]]) { R(px + ax + sw - 1, py + ay, s, s - 1, gq[2]); R(px + ax + sw, py + ay - 1, s - 2, s + 1, gq[2]); R(px + ax + sw - 1, py + ay, s - 2, 1, gq[4]); R(px + ax + sw + s - 2, py + ay + 1, 1, s - 2, gq[0]); }
  for (const [ax, ay] of [[-3, -8], [1, -13], [5, -9], [4, -12], [-1, -10]].slice(0, bloom)) { R(px + ax + sw, py + ay, 2, 2, K.red[3]); R(px + ax + sw, py + ay, 1, 1, '#ffd0d4'); }
  R(px - 3, py - 4, 9, 5, K.copper[2]); R(px - 4, py - 5, 11, 2, K.copper[3]); R(px - 4, py - 5, 11, 1, K.copper[4]); R(px + 5, py - 3, 1, 4, K.copper[0]);
}
// ---- a soft round pool of light in chunky steps, drawn once and then only added
function makePool(rx, ry, col, a) {
  const [c, g] = cv(rx * 2, ry * 2), N = 14;
  g.globalCompositeOperation = 'lighter'; g.fillStyle = css(col, (a / N).toFixed(4));
  for (let i = 0; i < N; i++) { const k = 1 - i / N; for (let yy = -ry * k; yy <= ry * k; yy += 2) { const ww = Math.floor(Math.sqrt(Math.max(0, 1 - (yy * yy) / (ry * k * ry * k))) * rx * k / 2) * 2; g.fillRect(rx - ww, Math.round(ry + yy), ww * 2, 2); } }
  return c;
}

const TOOLS = { clamp, smooth, hx, mixc, css, rnd, disc, gradDither, skyColors, ramp, K, WARM, T_Y, on, bevel, shadowBox, text, cv };

const OX = 42, OY = 96, OW = 48, OH = 52, BX = 30, BY = 70, BW = 236, BH = 82;   // the pictures of the oven and of the cook with the table (up to the sink, where he washes the bowl)
// ---- the kitchen of one screen. layout: 'pc' or 'phone'; cake: the picture and its place; base: the folder of the pictures
function make(layout, cake, base) {
  const rect = WIN[layout], [wx, wy, ww, wh] = rect, gx = wx + 2, gy = wy + 2, gw = ww - 4, gh = wh - 6;
  const [still, stillG] = cv(W, H), [room, roomG] = cv(W, H), [lit, litG] = cv(W, H), [oven, ovenG] = cv(OW, OH), [glow, glowG] = cv(34, 4), [cook, cookG] = cv(BW, BH), [table, tableG] = cv(W, H), [over, overG] = cv(W, H), [mask, maskG] = cv(gw, gh), [view, viewG] = cv(gw, gh), [win, winG] = cv(ww + 20, wh + 6), [back, backG] = cv(W, H), [front, frontG] = cv(W, H), drawView = window.KITCHEN_VIEW(TOOLS);
  on(tableG, drawTable);
  const baker = window.KITCHEN_BAKER(TOOLS, layout, base || 'art/', table), things = window.KITCHEN_THINGS(TOOLS, layout, cake);
  const wox = wx - 10, woy = wy - 4;                                // the window's picture with the curtains starts here
  const lampPool = makePool(74, 66, hx('#ffb45e'), .95), hoodPool = makePool(40, 30, hx('#ffe0a0'), .5), firePool = makePool(46, 34, hx('#ff7a2a'), 1);
  on(stillG, () => {
    drawStatic(layout); shadowBox(wx, wy, ww, wh - 1);
  });
  let c = calendar(START), overKey = '', nextSlow = 0, nextFire = 0, nextCook = 0, nextThings = 0, sun = 0, animWas = null, timeWas = null, cookKey = '';
  // the frame, the curtains and the flower are drawn again only when something of them has moved or changed
  function windowOver(time) {
    const bl = clamp(Math.min(smooth(8, 12, c.ydf), 1 - smooth(21, 25, c.ydf))), bloom = bl > .2 ? Math.round(bl * 5) : 0, snow = c.ydf > 31 && c.ydf < 38.5, sw = Math.round(Math.sin(time * 1.3) * .6);
    const wv = (yy, d) => ww > 80 ? Math.round(Math.sin(time * 1.2 + yy * .14 + d) * (.6 + c.wet) * (yy > 25 ? 1 : .3)) : 0;
    let key = bloom + ',' + snow + ',' + sw; for (let yy = 0; yy < wh + 1; yy += 3) key += wv(yy, 1) + '' + wv(yy, -1);
    if (key === overKey) return;
    overKey = key;
    overG.clearRect(0, 0, W, H); on(overG, () => drawWindowOver(rect, bloom, snow, wv, sw));
    maskG.globalCompositeOperation = 'source-over'; maskG.fillStyle = '#fff'; maskG.fillRect(0, 0, gw, gh);   // the glass is not darkened by the light of the room
    maskG.globalCompositeOperation = 'destination-out'; for (const d of ww > 80 ? [-1, 0, 1] : [0]) maskG.drawImage(over, d - gx, -gy);   // a pixel more where the curtains move
  }
  function drawWindow(time) {
    windowOver(time);
    drawView(viewG, gw, gh, c, time);
    on(viewG, () => { for (let k = 0; k < 2; k++) for (let i = 0; i < 8; i++) R(ww - 18 + i - k * 4, 10 - i + k * 2, 1, k ? 1 : 2, `rgba(255,255,255,${(.16 * c.dayK + .04).toFixed(2)})`); });   // the light on the glass
    winG.clearRect(0, 0, ww + 20, wh + 6); winG.drawImage(view, gx - wox, gy - woy); winG.drawImage(over, -wox, -woy);
  }
  function drawRoomLayer(time, anim) {
    on(roomG, () => {
      G.drawImage(still, 0, 0);
      drawCalendar(c, anim); drawLamps(c);
    });
  }
  function drawLightLayer(time) {
    const g = litG;
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    const dayCol = [hx('#f3efe6'), hx('#fff4df'), hx('#f2dfc8'), hx('#e4e6f0')][c.season];
    let A = mixc(hx('#6f6a9a'), dayCol, c.dayK); A = mixc(A, hx(c.dawn ? '#f2bfae' : '#f0a284'), c.glowK * .4); if (c.wet) A = mixc(A, hx('#8d92a8'), c.wet * .35 * c.dayK + .05 * c.wet);
    g.fillStyle = css(A); g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgb(246,242,250)';
    for (let i = 0; i < 4; i++) { const k = 4 + i * 7; g.fillRect(0, 0, k, H); g.fillRect(W - k, 0, k, H); }
    g.globalCompositeOperation = 'lighter';
    const k = lampK(c), pool = (im, x, y, a) => { if (a > .02) { g.globalAlpha = Math.min(1, a); g.drawImage(im, x - im.width / 2, y - im.height / 2); } };
    for (const x of LAMPS) pool(lampPool, x, 88, k * (.985 + Math.sin(time * 7) * .015));
    if (layout === 'phone') for (const x of LAMPS) pool(lampPool, x, 180, k * .3);   // the lamps and the oven on the counter
    pool(hoodPool, 66, 98, k);
    const ov = baker.oven, fire = .18 + (ov.open + Math.max(0, ov.bake) * .5 + .2) * .4;   // an open door and a baking shine more
    pool(firePool, 66, 130, fire * (.6 + .4 * k) * (1 + Math.sin(time * 11) * .05));
    if (layout === 'phone') pool(firePool, 74, 176, fire * .4);
    g.globalAlpha = 1;
    // the sun falls from the window: the spot on the floor moves against the sun; by night there is a spot of the moon
    const p = (c.h - c.sr) / (c.ss - c.sr); sun = c.dayK * (1 - c.wet) * smooth(0, .1, p) * (1 - smooth(.9, 1, p));
    if (sun > .02) {
      const col = mixc(hx('#ffd9a0'), hx('#ffb070'), c.glowK), off = (.5 - p) * 150, len = 14 + 14 * (1 - c.warm), n = ww > 80 ? 2 : 1, pw = (ww - 8) / n;
      for (let q = 0; q < n; q++) for (let yy = 0; yy < len + 6; yy++) { const f = yy / len; g.fillStyle = css(col, (.22 * sun).toFixed(3)); g.fillRect(Math.round(wx + 4 + q * pw + off * (.5 + f * .5)), 148 + yy, Math.round(pw - 5), 1); }
      for (let yy = 0; yy < 40; yy++) { const f = yy / 40; g.fillStyle = css(col, (.1 * sun * (1 - f)).toFixed(3)); g.fillRect(Math.round(wx + off * f * .5), 70 + yy, ww, 1); }
    } else {
      const moon = (1 - smooth(0, .2, c.dayK)) * (1 - c.wet), q = ((c.h - c.ss + 24) % 24) / (24 - c.len), off = (.5 - q) * 120;
      if (moon > .02) { g.fillStyle = `rgba(120,150,230,${(.13 * moon).toFixed(3)})`; for (let yy = 0; yy < 18; yy++) g.fillRect(Math.round(wx + 6 + off * (.5 + yy / 36)), 148 + yy, ww - 12, 1); }
    }
    g.globalCompositeOperation = 'source-over'; g.drawImage(mask, gx, gy);
  }
  return {
    // once a frame: t = game hours, time = seconds of the animation, anim = the "animated background" switch, minute = the cooking minute; test: a moment of the cooking (for the checks)
    update(t, time, anim, minute, test) {
      const now = performance.now();
      if (anim !== animWas) { animWas = anim; nextSlow = nextFire = nextCook = nextThings = 0; }
      const dt = timeWas === null ? 0 : clamp(time - timeWas, 0, .25); timeWas = time;
      baker.step(dt, anim, minute, { season: c.season, night: c.dayK < .1, guest: !!things.guest, x: things.guestX || 237 });
      if (test) { baker.set(test); nextSlow = nextFire = nextCook = 0; }
      const at = anim ? time : 0;                                    // with the switch off everything that moves by itself stands still; the time goes on
      const jump = Math.abs(t - c.t) >= .2;                          // a jump of the clock (a loaded save) is shown at once
      const slow = jump || now >= nextSlow;
      if (slow) { nextSlow = now + 250; c = calendar(t); }
      if (jump || now >= nextFire) {
        nextFire = anim ? now + 100 : Infinity;
        ovenG.setTransform(1, 0, 0, 1, 0, 0); ovenG.clearRect(0, 0, OW, OH); ovenG.setTransform(1, 0, 0, 1, -OX, -OY); baker.drawOven(ovenG, at);
        drawWindow(at);
      } else if (slow && !anim) drawWindow(0);
      const key = baker.ready() + ',' + baker.state.pile;             // with the switch off the cook is drawn again only when something has changed
      if (now >= nextCook || key !== cookKey) {
        nextCook = anim ? now + 50 : Infinity; cookKey = key;
        cookG.setTransform(1, 0, 0, 1, 0, 0); cookG.clearRect(0, 0, BW, BH); cookG.setTransform(1, 0, 0, 1, -BX, -BY);
        baker.draw(cookG, at); on(cookG, () => { G.save(); if (baker.mixing) G.translate(Math.floor(at * 12) & 1, 0); drawMixer(at, baker.mixing); R(207, 121, 1, 1, baker.mixing ? '#7dff9a' : '#6a5a88'); G.restore(); });
        // the bright fire behind the glass: only with the door shut, and never over the cook in front of it
        glowG.clearRect(0, 0, 34, 4);
        if (baker.oven.open === 0) { on(glowG, () => { for (let x = 0; x < 34; x++) { const q = Math.ceil(1 + Math.abs(Math.sin(x * .9 + at * 7)) * 1.6); R(x, 4 - q, 1, q, 'rgba(255,170,70,.55)'); } }); if (baker.place[0] < 107) { glowG.globalCompositeOperation = 'destination-out'; glowG.drawImage(cook, BX - 49, BY - 133); glowG.globalCompositeOperation = 'source-over'; } }
      }
      if (slow) { drawRoomLayer(at, anim); drawLightLayer(at); }
      things.step(dt, t, time, anim, c, baker);
      if (jump || now >= nextThings) {
        nextThings = now + (anim ? 70 : 250);
        backG.clearRect(0, 0, W, H); things.back(backG); frontG.clearRect(0, 0, W, H); things.front(frontG); baker.drawPlate(frontG, at);
      }
    },
    drawRoom(g) { g.drawImage(room, 0, 0); g.drawImage(win, wox, woy); g.drawImage(back, 0, 0); g.drawImage(oven, OX, OY); g.drawImage(cook, BX, BY); g.drawImage(front, 0, 0); },
    // the light over everything drawn so far; the things that shine by themselves stay bright after it
    drawLight(g, time, anim) {
      g.globalCompositeOperation = 'multiply'; g.drawImage(lit, 0, 0); g.globalCompositeOperation = 'source-over';
      on(g, () => {
        const k = lampK(c);
        if (k > .02) for (const x of LAMPS) { R(x - 3, 73, 7, 2, `rgba(255,243,176,${(.8 * k).toFixed(2)})`); R(x - 4, 75, 9, 2, `rgba(255,243,176,${(.8 * k).toFixed(2)})`); }
        G.drawImage(glow, 49, 133);
        if (anim && sun > .4) { const p = (c.h - c.sr) / (c.ss - c.sr); for (let i = 0; i < 9; i++) { const q = (time * .05 + rnd(i)) % 1; R(wx + rnd(i * 3) * ww + (.5 - p) * 60 + Math.sin(time * .7 + i) * 4, 76 + q * 60, 1, 1, `rgba(255,240,200,${(.55 * Math.sin(q * 3.14) * sun).toFixed(2)})`); } }
      });
      things.shine(g);
    },
    lit,                                                             // the picture of the light (for the things drawn outside the room)
    strip() { const [c2, g2] = cv(W, 20); on(g2, () => { G.save(); G.translate(0, -15); drawCounter(W); G.restore(); }); return c2; },   // the lower 20 rows of the counter
    wood: K.wood[2],                                                 // the colour of the table front
    baker, things,
    get now() { return c; },
  };
}
return { tools: TOOLS, START, HOUR_S, calendar, make, weather(v) { WEATHER = v; } };
})();
