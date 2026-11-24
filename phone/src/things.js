// the moving things of the kitchen (stage 5 of the living bakery) and their queue. One factory for the computer and the phone
// (phone/src/things.js is a copy made by docs/living-bakery/build_kitchen.py); kitchen.js calls it.
// Every thing is drawn from E (the moment) only: E.play[id] = seconds since a short scene began, undefined = it is not playing.
// back(): behind the cook; front(): before the table; shine(): after the light of the hour.
window.KITCHEN_THINGS = function (tools, layout, cakeAt) {
'use strict';
const { clamp, smooth, hx, mixc, css, rnd, disc, ramp, K, on, bevel, shadowBox, text, cv } = tools;
const PC = layout === 'pc', HOUR_S = 30, BAKE_S = 77;                // BAKE_S: one baking of the cook, for the first look of the jars
let G = null;
const R = (x, y, w, h, col) => { G.fillStyle = col; G.fillRect(Math.round(x), Math.round(y), w, h); };
const DUR = { sign: 3.4, clock: 3, moth: 12, pans: 3, mouse: 5, jarLid: 1, jarFill: 4, kettle: 8, fridge: 5, note: 3, petal: 5, piesHop: 3.6, cherryTap: .9, egg: 9, glare: 1.3 };
const P = (E, id) => E.play[id];
const has = (E, id) => E.play[id] !== undefined;
function steam(x, y, time, a, h, n = 4) { for (let i = 0; i < n; i++) { const k = (time * .32 + i / n) % 1; R(x + Math.sin(time * 1.5 + i * 2 + k * 5) * 1.8, y - k * h, k > .4 ? 2 : 1, k > .6 ? 2 : 1, `rgba(255,250,244,${(a * (1 - k) * Math.min(1, k * 6)).toFixed(2)})`); } }
const puff = (x, y, s, a) => { x = Math.round(x); y = Math.round(y); R(x, y + 1, s, s, `rgba(150,166,196,${(a * .55).toFixed(2)})`); R(x, y, s, s, `rgba(255,255,255,${a.toFixed(2)})`); };
const damp = (t, f, d, a) => Math.round(Math.sin(t * f) * Math.exp(-t * d) * a);

// the sign on the chains
function sign(E) {
  const d = has(E, 'sign') ? damp(P(E, 'sign'), 5.2, .75, 2.6) : 0;
  G.save(); if (E.layout === 'phone') G.translate(36, 0);
  for (const x of [46, 85]) for (let y = 23, i = 0; y < 30; y += 2, i++) R(x + Math.round(d * i / 3), y, 1, 1, K.dsteel[1]);
  G.translate(d, 0);
  shadowBox(36, 30, 60, 16); bevel(36, 30, 60, 16, K.dwood); bevel(38, 32, 56, 12, K.wood, 1); for (const x of [39, 92]) R(x, 33, 1, 1, K.gold[3]);
  text('ПЕКАРНЯ', 67, 35, '#5a3424'); text('ПЕКАРНЯ', 66, 34, '#ffe9b4');
  G.restore();
}
// the clock swings a little on its nail
function clock(E) {
  const c = E.c, d = has(E, 'clock') ? damp(P(E, 'clock'), 7, .5, 1.6) : 0;
  G.save(); G.translate(d, 0);
  shadowBox(215, 88, 13, 12); disc(G, 221, 93, 7, K.dwood[2]); disc(G, 221, 93, 6, K.cream[2]); disc(G, 221, 92, 5, K.cream[4]);
  for (let i = 0; i < 12; i += 3) R(221 + Math.round(Math.sin(i * Math.PI / 6) * 5), 93 - Math.round(Math.cos(i * Math.PI / 6) * 5), 1, 1, K.dwood[2]);
  const ln = (a, l, col) => { for (let k = 0; k <= l; k += .5) R(221 + Math.sin(a) * k, 93 - Math.cos(a) * k, 1, 1, col); };
  ln((c.h % 12) / 12 * 6.2832, 2.6, '#3a2a30'); ln((c.h % 1) * 6.2832, 4.6, '#3a2a30'); R(221, 93, 1, 1, K.red[2]);
  G.restore();
}
// the paper ribbons of the vent
function ribbon(E) {
  const t = E.time;
  [[25, K.red[2], K.red[3], 8], [30, K.cream[3], K.cream[4], 6]].forEach(([x, a, b, n], i) => {
    for (let y = 0; y < n; y++) { const w = Math.round(Math.sin(t * 4.2 - y * .7 + i * 1.7) * Math.min(1, y * .3) * 1.1); R(x + w, 58 + y, 2, 1, y & 1 ? a : b); }
  });
}
// the hood draws the steam in; its lamps and a green light
function hood(E) {
  const k = E.hoodK; if (k <= .02) return;
  for (let i = 0; i < 10; i++) {
    const q = (E.time * .75 + i / 10) % 1, x0 = 46 + rnd(i * 3.3) * 40, x = x0 + (66 - x0) * q * q * .75, y = 108 - q * 22;
    puff(x + Math.sin(E.time * 3 + i) * .8, y, q < .25 ? 1 : 2, .9 * k * Math.min(1, q * 5) * (1 - q * .4));
  }
  for (const x of [52, 65, 78]) R(x, 84, 3, 1, '#ffffff');
  R(46, 81, 2, 1, '#7dff9a');
}
// the pans
function pans(E) {
  const t = P(E, 'pans'), s0 = t === undefined ? 0 : damp(t, 6, .8, 1.7);
  [[116, K.black], [127, K.copper]].forEach(([x, q], i) => {
    const s = i ? -s0 : s0; R(x + 3 + Math.sign(s) * (Math.abs(s) > 1 ? 1 : 0), 83, 1, 2, K.steel[1]); disc(G, x + 3 + s, 88, 4, q[2]);
    R(x + s, 86, 2, 1, q[4]); R(x + 1 + s, 85, 2, 1, q[4]); R(x + 5 + s, 90, 2, 1, q[0]); R(x + 2 + s, 92, 3, 1, q[0]);
    if (t !== undefined && t > .5 + i * .5 && t < 1.3 + i * .5) { const f = (t - .5 - i * .5) / .8 * 8 - 4, yy = Math.round(88 - f * .5), ww = Math.round(x + 3 + s + f); if (Math.abs(f) < 3.6) { R(ww, yy - 2, 1, 4, q[4]); R(ww, yy - 1, 1, 2, '#fff6e6'); } }
  });
}
// the apron and the towel breathe
function cloth(E) {
  const t = E.time, s = Math.round(Math.sin(t * .9) * .7), s2 = Math.round(Math.sin(t * 1.1 + 1) * .7);
  R(245, 80, 1, 2, K.dsteel[1]); shadowBox(240, 82, 11, 15); R(240, 82, 11, 10, K.cream[3]); R(240, 82, 11, 2, K.red[2]); R(240 + s, 92, 11, 5, K.cream[3]); R(240 + s, 96, 11, 1, K.red[2]); R(243, 88, 5, 4, K.cream[2]); R(243, 88, 5, 1, K.cream[0]); R(249, 84, 1, 8, K.cream[1]);
  R(222, 102, 8, 1, K.dwood[2]); for (let y = 0; y < 10; y++) R(223 + (y > 5 ? s2 : 0), 103 + y, 5, 1, y % 3 ? K.cream[3] : K.red[2]);
}
// the mouse in the upper right door of the cabinet
function mouse(E) {
  const t = P(E, 'mouse'); if (t === undefined) return;
  const gap = Math.round(8 * Math.min(smooth(.1, .7, t), 1 - smooth(3.9, 4.5, t))); if (!gap) return;
  R(21, 87, 17, 25, K.green[2]); R(22, 88, 15, 23, '#2a2430'); R(22, 97, 15, 1, '#463a40'); R(24, 94, 5, 3, '#6d4a3a'); R(24, 94, 5, 1, '#8d6348'); R(31, 92, 4, 5, '#c9a24a'); R(22, 110, 15, 1, '#463a40');
  const up = Math.round(9 * Math.min(smooth(.9, 1.3, t), 1 - smooth(3.2, 3.5, t))), my = 111 - up, tw = t > 1.5 && t < 3.1 && Math.floor(t * 4) & 1, look = t > 2.1 && t < 2.8 ? 1 : 0;
  G.save(); G.beginPath(); G.rect(22, 98, gap, 13); G.clip();
  if (up > 0) {                                                        // a grey mouse comes up from below, moves its nose and hides
    const m = ramp('#b4acb6'); for (const ex of [21, 26]) { R(ex, my - 3, 3, 3, m[2]); R(ex + 1, my - 2, 1, 2, '#f0a8b0'); }
    R(22, my, 7, 6, m[2]); R(22, my, 7, 1, m[3]); R(28, my + 1, 1, 5, m[1]); R(23, my + 6, 5, 4, m[1]); R(23 + look, my + 2, 1, 1, '#1c1420'); R(26 + look, my + 2, 1, 1, '#1c1420'); R(24 + look, my + 4 - (tw ? 1 : 0), 2, 1, '#e86a80'); R(23, my + 5, 5, 1, m[4]);
  }
  G.restore();
  const x = 21 + gap, w = 17 - gap; bevel(x, 87, w, 25, K.green); R(x + 1, 89, Math.max(1, w - 4), 21, K.green[1]); R(x + 2, 90, Math.max(1, w - 6), 19, K.green[2]); R(x, 97, 2, 4, K.gold[2]); R(x, 97, 1, 2, K.gold[4]); R(x - 1, 87, 1, 25, K.green[0]);
}
// the jars: the food goes down with every baking and comes back in the morning; the lid hops
const JARS = [[45, '#f2e6cc', '#c8404a'], [57, '#6fb9c9', '#4d7fb4'], [69, '#c2453f', '#e0ac4c'], [81, '#e6b04a', '#5f9a68']].map(([x, a, b]) => [x, ramp(a), ramp(b), css(mixc(hx(a), hx('#dfeef2'), .55))]);
function jars(E) {
  const fill = P(E, 'jarFill'), lid = P(E, 'jarLid');
  JARS.forEach(([x, q, c2, glass], i) => {
    let lv = E.jars[i], lift = 0;
    if (fill !== undefined) { lv += (1 - lv) * smooth(.3 + i * .6, 1.5 + i * .6, fill); if (fill > .1 + i * .6 && fill < 1.6 + i * .6) lift = 2; }
    if (lid !== undefined && E.lidOf === i) lift = Math.round(Math.abs(Math.sin(Math.min(1, lid) * Math.PI * 2)) * (lid < .5 ? 3 : 1.5));
    const h = Math.max(1, Math.round(lv * (8 - (i & 1))));
    R(x, 93, 10, 11, glass); R(x, 104 - h, 10, h, q[2]); R(x, 104 - h, 10, 1, q[4]); R(x + 9, 94, 1, 10, q[1]); R(x, 103, 10, 1, q[0]); R(x + 1, 94, 1, 8, '#ffffff'); R(x + 2, 94, 1, 3, 'rgba(255,255,255,.6)'); R(x + 3, 98, 5, 4, K.cream[3]); R(x + 4, 99, 3, 1, q[0]);
    if (lift) R(x + 1, 92, 8, 1, '#3a2a40');
    R(x + 1 + (lift > 1 ? 1 : 0), 90 - lift, 8, 3, c2[2]); R(x + 1 + (lift > 1 ? 1 : 0), 90 - lift, 8, 1, c2[4]); R(x + 1 + (lift > 1 ? 1 : 0), 92 - lift, 8, 1, c2[0]);
    if (fill !== undefined) { const k = (fill - .4 - i * .6) / 1.1; if (k > 0 && k < 1) for (let n = 0; n < 4; n++) R(x + 4 + (n & 1), 88 + ((k * 22 + n * 4) % 14), 1, 2, q[3]); }
  });
}
// the kettle on the right burner
function kettle(E) {
  const t = P(E, 'kettle'), boil = t === undefined ? 0 : Math.min(smooth(1.2, 3, t), 1 - smooth(6.6, 7.8, t)), fire = t !== undefined && t > .3 && t < 6.8, q = K.copper;
  const hop = boil > .6 ? (Math.floor(E.time * 9) % 3 === 0 ? 1 : 0) : 0;
  if (fire) for (let i = 0; i < 4; i++) { const f = Math.floor(E.time * 8 + i * 1.7) & 1; R(76 + i * 2, 109 - f, 1, 1 + f, i & 1 ? '#8fd0ff' : '#4f9af0'); }
  R(77, 104, 9, 5, q[2]); R(76, 105, 11, 3, q[2]); R(78, 103, 7, 1, q[3]); R(78, 104, 3, 1, q[4]); R(77, 105, 1, 2, q[4]); R(85, 105, 2, 3, q[1]); R(77, 108, 9, 1, q[0]);
  R(74, 104, 2, 1, q[3]); R(75, 105, 2, 1, q[2]);                               // the spout
  R(79, 102 - hop, 5, 1, q[3]); R(81, 101 - hop, 1, 1, K.black[2]);             // the lid
  R(77, 100, 1, 3, K.black[2]); R(85, 100, 1, 3, K.black[2]); R(78, 99, 7, 1, K.black[2]); R(78, 99, 3, 1, K.black[4]);   // the handle
  if (boil > 0) { for (let i = 0; i < 6; i++) { const k = (E.time * 1.1 + i / 6) % 1; puff(73 - k * 5 + Math.sin(E.time * 4 + i) * .6, 102 - k * 16, k > .3 ? 2 : 1, .95 * boil * (1 - k * .8)); } if (hop) R(80 + (Math.floor(E.time * 4) & 3), 100, 1, 1, '#ffffff'); }
}
// the fridge: the door at night, the note; the magnets stand still
function fridge(E) {
  const t = P(E, 'fridge'), op = t === undefined ? 0 : Math.min(smooth(.2, .9, t), 1 - smooth(4, 4.7, t)), nt = P(E, 'note');
  if (op > .08) {
    // inside: the light, two shelves, milk, cheese, eggs
    R(269, 82, 34, 26, '#dfeef6'); R(269, 82, 34, 1, '#ffffff'); R(269, 82, 1, 26, '#b4cbdc'); R(302, 82, 1, 26, '#b4cbdc'); R(270, 94, 32, 1, '#9db8cc'); R(270, 95, 32, 1, '#c6dbe8'); R(269, 107, 34, 1, '#9db8cc');
    R(284, 82, 5, 1, '#fffbe0');
    R(273, 86, 5, 8, '#f8f8fc'); R(273, 86, 5, 1, '#ffffff'); R(274, 85, 3, 1, '#4d7fb4'); R(273, 90, 5, 2, '#82add8'); R(277, 87, 1, 7, '#cdd4e4');
    R(282, 90, 9, 4, '#f2c84a'); R(282, 90, 9, 1, '#ffe48a'); R(284, 92, 1, 1, '#c89a28'); R(288, 91, 1, 1, '#c89a28'); R(290, 91, 1, 3, '#d0a430');
    for (let i = 0; i < 4; i++) { R(273 + i * 4, 104, 3, 3, '#fff0dc'); R(273 + i * 4, 104, 2, 1, '#ffffff'); }
    R(292, 101, 7, 6, '#c8404a'); R(292, 101, 7, 1, '#e87a80'); R(294, 99, 3, 2, '#f1e6d2'); R(295, 89, 4, 5, '#6fb06a'); R(295, 89, 3, 1, '#a0d89a');
    const w = Math.max(3, Math.round(34 * (1 - op) * .6)), x = 269;     // the door is turned to us by its edge, the hinges are on the left
    if (op > .75) { R(261, 80, 8, 30, K.blue[1]); R(261, 80, 2, 30, K.blue[4]); R(263, 81, 4, 28, '#e6f0f6'); R(264, 88, 3, 1, '#b4cbdc'); R(264, 98, 3, 1, '#b4cbdc'); R(264, 84, 2, 4, '#c8404a'); R(264, 93, 2, 5, '#f2c84a'); R(260, 89, 1, 14, K.steel[3]); }
    else { R(x, 80, w, 28, K.blue[2]); R(x, 80, w, 1, K.blue[4]); R(x + w - 1, 80, 1, 28, K.blue[0]); R(x + w - 3, 89, 2, 14, K.steel[4]); }
  } else {
    const fl = nt === undefined ? 0 : Math.round(Math.sin(nt * 7) * Math.sin(nt / 3 * Math.PI) * 1.6);
    R(287, 90, 8, 6, K.cream[3]); R(287 + (fl > 0 ? 1 : 0), 96, 8, 3, K.cream[3]); if (fl) { R(287 + (fl > 0 ? 1 : 0), 98, 8, 1, K.cream[4]); R(287 + (fl > 0 ? 1 : 0), 99, 8, 1, 'rgba(60,30,50,.25)'); if (Math.abs(fl) > 1) { R(293, 97, 3, 2, K.cream[4]); R(293, 99, 2, 1, K.cream[1]); } }
    R(289, 92, 4, 1, K.steel[1]); R(289, 94, 5, 1, K.steel[1]); R(289 + (fl > 0 ? 1 : 0), 96, 3, 1, K.steel[1]); R(290, 89, 2, 2, K.red[2]);
    R(275, 93, 4, 4, K.red[2]); R(275, 93, 3, 1, K.red[4]); R(281, 100, 4, 4, '#5f9a68'); R(281, 100, 3, 1, '#a0d0a0'); R(276, 102, 3, 3, K.gold[3]);
  }
}
// a petal of the geranium (only the computer has the flower)
function petal(E) {
  const t = P(E, 'petal'); if (t === undefined) return;
  const k = clamp(t / 3); if (t > 4.6) return;
  R(287 - k * 6 + Math.sin(t * 4) * 2 * (1 - k), 51 + k * 28, 2, 2, K.red[3]); R(287 - k * 6 + Math.sin(t * 4) * 2 * (1 - k), 51 + k * 28, 1, 1, '#ffd0d4');
}
// the pies: the steam and the hop one after another
function board(E) {
  const t = P(E, 'piesHop'), q = ramp('#c47c36');
  G.save(); if (E.layout === 'phone') G.translate(-121, 0);
  R(207, 163, 54, 8, K.wood[1]); R(207, 163, 54, 1, K.wood[4]); R(207, 171, 54, 4, K.dwood[2]); R(207, 175, 54, 1, K.dwood[0]); R(261, 165, 5, 8, K.wood[1]); R(261, 165, 5, 1, K.wood[3]); R(262, 168, 3, 2, K.dwood[0]);
  [211, 227, 243].forEach((bx, i) => {
    let d = 0; if (t !== undefined) { const u = (t - i * .35) % 1.2; if (t > i * .35 && u > 0 && u < .34) d = Math.round(Math.sin(u / .34 * Math.PI) * 2.2); }
    R(bx + (d ? 1 : 0), 172, 14 - (d ? 2 : 0), 1, 'rgba(60,30,30,.5)'); const y = -d; R(bx + 1, 165 + y, 12, 7, q[2]); R(bx, 166 + y, 14, 5, q[2]); R(bx + 2, 164 + y, 10, 1, q[3]); R(bx + 2, 165 + y, 8, 2, q[4]); R(bx + 1, 167 + y, 2, 2, q[3]); R(bx + 1, 171 + y, 12, 1, q[0]); R(bx + 13, 167 + y, 1, 4, q[1]); R(bx + 4, 167 + y, 2, 1, q[0]); R(bx + 6, 168 + y, 3, 1, q[0]); R(bx + 9, 167 + y, 2, 1, q[1]);
  });
  if (E.anim) { steam(218, 163, E.time, .3, 8); steam(250, 163, E.time + 2, .26, 8); }
  G.restore();
}
// the cake: the picture is the same, only the cherry moves
let cakeCv = null, cherryCv = null;                                 // the cake without the cherry; the cherry alone
function splitCake(im) {
  const [a, g] = cv(46, 24), [b, h] = cv(46, 24); g.drawImage(im, 0, 0);
  const d = g.getImageData(0, 0, 46, 24), e = h.createImageData(46, 24);
  for (let y = 3; y < 13; y++) for (let x = 17; x < 29; x++) {
    const o = (y * 46 + x) * 4, [r, gg, bb, al] = d.data.slice(o, o + 4); if (!al) continue;
    const red = r > 110 && gg < 110 && y >= 6, stem = y < 7 && !(r > 180 && gg > 150), shine = y >= 6 && y <= 8 && x >= 20 && x <= 25;
    if (!(red || stem || shine)) continue;
    for (let i = 0; i < 4; i++) e.data[o + i] = d.data[o + i];
    if (y < 7) d.data[o + 3] = 0; else { const s = (Math.min(23, y) * 46 + (x < 23 ? 17 : 29)) * 4; for (let i = 0; i < 3; i++) d.data[o + i] = d.data[s + i]; }
  }
  g.putImageData(d, 0, 0); h.putImageData(e, 0, 0); cakeCv = a; cherryCv = b;
}
function cake(E) {
  if (!cakeAt || !cakeAt.img.complete || !cakeAt.img.naturalWidth) return;
  const { img: im, x, y } = cakeAt, t = P(E, 'cherryTap'); if (!cakeCv) splitCake(im);
  if (t === undefined) G.drawImage(im, x, y);
  else {
    const d = Math.round(Math.cos(t * 17) * Math.exp(-t * 3.2) * 2.4); G.drawImage(cakeCv, x, y);
    if (d > 0) { G.drawImage(cherryCv, 17, 0, 12, 13, x + 16, y + d, 14, 13 - Math.min(1, d)); } else G.drawImage(cherryCv, x, y + d);
  }
}
// the flour prints of the cook
function prints(E) { for (let i = 0; i < E.prints; i++) { const x = 72 + i * 5.2, y = 148 + (i & 1) * 2; if (E.sweepX !== null && x > E.sweepX - 14) continue; R(x, y, 3, 1, '#f3eef0'); R(x + 1, y + 1, 2, 1, '#d8d4e2'); } }
// the egg that fell from the table
function egg(E) {
  const t = P(E, 'egg'); if (t === undefined) return; const x = E.layout === 'phone' ? 216 : 93, top = 119;
  if (t < .9) { const k = t / .9; R(x + 8 - k * 8, top, 3, 4, '#fff0dc'); R(x + 8 - k * 8 + (Math.floor(t * 8) & 1), top, 1, 2, '#ffffff'); R(x + 10 - k * 8, top + 1, 1, 3, '#e0c8a8'); }
  else if (t < 1.25) { const k = (t - .9) / .35; R(x, top + k * k * 33, 3, 4, '#fff0dc'); R(x, top + k * k * 33, 2, 1, '#ffffff'); }
  else { const w = t < 1.4 ? 5 : 9, f = t > 7.4 ? Math.floor((t - 7.4) / .5) : 0; if (f > 2) return; const ww = w - f * 3; R(x - ww / 2 + 1, 155, ww, 2, '#f6f2ec'); R(x - ww / 2 + 2, 154, ww - 2, 1, '#ffffff'); R(x, 154, 3, 2, '#f2b02c'); R(x, 154, 1, 1, '#ffe08a'); if (w > 5 && !f) { R(x - 5, 154, 2, 1, '#fff0dc'); R(x + 6, 155, 2, 2, '#fff0dc'); R(x + 6, 156, 2, 1, '#d0b898'); } }
}
// the moth, after the light
function moth(E) {
  const t = P(E, 'moth'); if (t === undefined) return; const lx = E.mothLamp || 221; let x, y, sit = false;
  if (t < 1.5) { const k = t / 1.5; x = lx - 26 + k * 18; y = 58 + k * 20 + Math.sin(t * 9) * 2; }
  else if (t > 10.5) { const k = (t - 10.5) / 1.5; x = lx + 8 + k * 22; y = 78 - k * 24 + Math.sin(t * 9) * 2; }
  else if (t > 5.5 && t < 8) { x = lx + 5; y = 75; sit = true; }
  else { const a = t * 2.3; x = lx + Math.sin(a) * 10 + Math.sin(a * 2.7) * 2; y = 79 + Math.cos(a * 1.3) * 5; }
  x = Math.round(x); y = Math.round(y); const f = sit ? 0 : Math.floor(E.time * 11) & 1;
  R(x, y, 1, 2, '#8a6a48'); if (f) { R(x - 2, y - 1, 2, 1, '#fff2cc'); R(x + 1, y - 1, 2, 1, '#fff2cc'); R(x - 1, y, 1, 1, '#e8cf98'); R(x + 1, y, 1, 1, '#e8cf98'); } else { R(x - 1, y, 1, 2, '#fff2cc'); R(x + 1, y, 1, 2, '#e8cf98'); }
}
function shine(E) {
  moth(E);
  const t = P(E, 'fridge');
  if (t !== undefined) { const op = Math.min(smooth(.2, .9, t), 1 - smooth(4, 4.7, t)), dark = 1 - E.c.dayK; if (op > .3 && dark > .05) { G.globalCompositeOperation = 'lighter'; G.globalAlpha = op * dark; R(269, 82, 34, 26, 'rgb(90,86,60)'); for (let i = 0; i < 6; i++) R(262 - i * 3, 110 + i * 7, 48 + i * 6, 7, `rgba(120,130,130,${(.16 - i * .022).toFixed(3)})`); G.globalAlpha = 1; G.globalCompositeOperation = 'source-over'; } }
}
const at = (g, fn) => { const keep = G; G = g; on(g, fn); G = keep; };

// ---- the cookie's glare: a gold edge and a white middle run over the icing of any skin
const glazes = new WeakMap();
function glazeOf(frame) {
  if (glazes.has(frame)) return glazes.get(frame);
  const w = frame.width, h = frame.height, d = frame.alpha, lum = (o) => d[o] * .3 + d[o + 1] * .59 + d[o + 2] * .11, out = [], all = [];
  // the icing is the lightest part of the picture: near white, or (on a skin without white) the lightest sixth of it
  for (let i = 0; i < w * h; i++) if (d[i * 4 + 3] > 127) all.push(lum(i * 4));
  all.sort((x, y) => y - x);
  const white = all.filter((v) => v > 222).length > all.length * .05 ? 222 : all[Math.floor(all.length * .17)] || 0;
  for (let i = 0; i < w * h; i++) {
    const o = i * 4; if (d[o + 3] <= 127) continue;
    const r = d[o], g = d[o + 1], b = d[o + 2], ice = lum(o) >= white;
    const candy = !ice && Math.max(r, g, b) > 150 && (b > r || g > r || (r > 200 && g < 110) || (r > 225 && b < 90 && g > 170));
    if (ice || candy) out.push([i % w, Math.floor(i / w), ice]);
  }
  const near = (x, y) => out.filter((q) => q[2]).reduce((m, q) => { const l = (q[0] - x) ** 2 + (q[1] - y) ** 2; return l < m[0] ? [l, q] : m; }, [1e9, null])[1];
  const res = { px: out, stars: [[.2, .27, .28], [.81, .3, .72], [.49, .86, .86]].map(([x, y, s]) => [near(x * w, y * h), s]).filter((q) => q[0]) };
  glazes.set(frame, res);
  return res;
}
function drawGlare(g, frame, x, y) {
  const t = E.play.glare; if (t === undefined || !frame.alpha) return;
  const { px, stars } = glazeOf(frame), p = -14 + t / DUR.glare * (frame.width + frame.height + 28);
  for (const [xx, yy, ice] of px) { const b = xx + yy - p; if (b < 0 || b > 18) continue; g.fillStyle = ice ? (b < 4 || b > 14 ? '#ffd27a' : b < 7 || b > 11 ? '#ffeab0' : '#ffffff') : `rgba(255,255,255,${b < 4 || b > 14 ? .2 : .45})`; g.fillRect(x + xx, y + yy, 1, 1); }
  g.fillStyle = '#ffffff';                                            // a small star where the light leaves the icing
  for (const [q, s0] of stars) { const k = (t - s0) / .3; if (k < 0 || k > 1) continue; const n = k < .3 || k > .7 ? 1 : 2; g.fillRect(x + q[0] - n, y + q[1], n * 2 + 1, 1); g.fillRect(x + q[0], y + q[1] - n, 1, n * 2 + 1); }
}

// ---- the queue: one noticeable scene at a time, 4-9 s between them
// [name, weight, when it may play]; what the phone does not show never waits in its queue. null = a pause, so that the rare scenes stay rare
const QUEUE = [['pans', 5, () => true], ['mouse', 1.2, () => PC], ['note', 1.5, () => PC], ['petal', 3, (c) => PC && c.ydf > 10 && c.ydf < 24], ['moth', 3, (c) => c.dayK < .15 && c.season !== 3], ['fridge', 1.5, (c) => PC && c.dayK < .15], [null, 5.4, () => true]];
const SMALL = ['cherryTap', 'jarLid', 'piesHop'], big = (id) => !SMALL.includes(id);
const E = { layout, c: null, time: 0, anim: true, play: {}, jars: [1, 1, 1, 1], lidOf: 0, hoodK: 0, prints: 0, sweepX: null, mothLamp: 221 };
const api = { guest: false, appetite: false, busy: false, canEgg: () => true, onEgg() {} };   // what the game tells (before every frame) and is told
let next = 4, last = '', glareIn = 14, step = -1, bakes = 0, pending = null, was = null;
const busyNow = (b) => !!b.doing || Object.keys(E.play).some(big);
const DAY = (t) => ((t % 24) + 24) % 24;
// a loaded save or a set clock: the jars and the prints are as the hour needs them (they are not saved)
function settle(t) {
  const n = Math.floor(DAY(t - 7) * HOUR_S / BAKE_S);
  E.jars = [0, 1, 2, 3].map((i) => Math.max(.15, 1 - .08 * n - (n ? i * .02 : 0))); E.prints = Math.min(6, n); E.play = {}; pending = null;
}
return Object.assign(api, {
  E,
  // once a frame; t = game hours, time = seconds of the animation, c = the calendar, b = the cook
  step(dt, t, time, anim, c, b) {
    if (was === null || Math.abs(t - was) >= .9) { settle(t); was = t; }
    const before = was; was = t; E.c = c; E.anim = anim; E.time = anim ? time : 0;
    const crossed = (h) => { const a = DAY(before), n = DAY(t); return t > before && (h === 0 ? n < a : a < h && n >= h); };
    if (!anim) {                                                      // nothing moves; the jars are filled in silence
      E.play = {}; E.hoodK = 0; E.sweepX = null; step = -1; pending = null;
      if (crossed(7)) E.jars = [1, 1, 1, 1];
      return;
    }
    for (const id of Object.keys(E.play)) {
      const p = E.play[id]; E.play[id] = p + dt;
      if (id === 'egg' && p < 1.2 && p + dt >= 1.2) api.onEgg();
      if (p + dt > DUR[id]) { delete E.play[id]; if (id === 'jarFill') E.jars = [1, 1, 1, 1]; }
    }
    // the clock and the cooking
    if (crossed(12) || crossed(0)) E.play.clock = 0;
    for (let h = 1.5; h < 24; h += 3) if (crossed(h)) E.play.kettle = 0;
    if (crossed(7)) { E.play.jarFill = 0; if (E.prints) pending = 'sweep'; }
    if (crossed(20)) pending = 'wash';
    const st = b.state.step - 1;
    if (st !== step && !b.doing) {
      const from = step; step = st;
      if (from === 11 && st === 0 && pending && !(pending === 'wash' && api.guest)) { b.act(pending); pending = null; step = 11; }
      else if (from >= 0) {
        const jar = { 0: 0, 1: 3, 5: 1, 10: 2 }[st];
        if (jar !== undefined) { E.lidOf = jar; E.play.jarLid = 0; E.jars[jar] = Math.max(.15, E.jars[jar] - .08); }
        if (st === 1 && ++bakes >= 10 && api.canEgg()) { bakes = 0; E.play.egg = 0; }
        if (st === 9) E.prints = Math.min(6, E.prints + 1);
      }
    }
    if (api.appetite && E.play.piesHop === undefined) E.play.piesHop = 0;
    if ((glareIn -= dt) < 0) { glareIn = 20 + Math.random() * 10; if (!api.busy && !busyNow(b)) E.play.glare = 0; }
    // the queue waits until everything noticeable is over
    if (busyNow(b) || api.guest) next = Math.max(next, 4);
    else if ((next -= dt) < 0) {
      next = 4 + Math.random() * 5;
      const can = QUEUE.filter((q) => (q[0] === null || q[0] !== last) && q[2](c));
      let w = Math.random() * can.reduce((a, q) => a + q[1], 0);
      for (const q of can) { w -= q[1]; if (w <= 0) { last = q[0]; if (q[0]) api.start(q[0]); break; } }
    }
    const a = b.doing; E.sweepX = null;
    if (a && a.name === 'sweep') { if (a.t < 5) E.sweepX = b.place[0] - 8; else E.prints = 0; }
    const kt = E.play.kettle; E.hoodK = Math.max(b.oven.open, kt === undefined ? 0 : Math.min(smooth(1.5, 3, kt), 1 - smooth(6.6, 7.8, kt)));
  },
  start(id) { if (id === 'moth') E.mothLamp = Math.random() < .5 ? 99 : 221; E.play[id] = 0; },
  guestComes() { if (E.anim) E.play.sign = 0; },
  cherry() { if (E.anim) E.play.cherryTap = 0; },
  click() { glareIn = 20 + Math.random() * 10; delete E.play.glare; },  // a tap on the cookie ends the quiet
  back(g) { at(g, () => { sign(E); ribbon(E); hood(E); pans(E); cloth(E); clock(E); mouse(E); jars(E); kettle(E); fridge(E); petal(E); prints(E); }); },
  front(g) { at(g, () => { board(E); cake(E); egg(E); }); },
  shine(g) { at(g, () => shine(E)); },
  drawGlare,
  // for the checks
  state: () => ({ play: { ...E.play }, next, last, glareIn, pending, bakes, prints: E.prints, jars: E.jars.map((v) => +v.toFixed(2)), hood: E.hoodK, step }),
  set(o) { if (o.bakes !== undefined) bakes = o.bakes; if (o.pending !== undefined) pending = o.pending; if (o.prints !== undefined) E.prints = o.prints; if (o.jars) E.jars = o.jars; },
});
};
