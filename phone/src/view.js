// the view behind the window of the living bakery: the sun, the moon with its phases, the stars, the clouds, the hills, the houses,
// the apple tree that changes every day, the weather and everything that lives there. It comes from docs/living-bakery/sky.js (the approved preview).
// kitchen.js calls it 10 times a second; tools are its own helpers. One file for both screens (phone/src/view.js is a copy made by build_kitchen.py).
window.KITCHEN_VIEW = function (tools) {
'use strict';
const { clamp, smooth, hx, mixc, css, rnd, disc, gradDither, skyColors } = tools;
// ---- the tree: branches and leaf clumps in their places; each clump has its own turn to appear and to fall
const BR = [[0, 0, 0, -11, 3], [0, -9, -7, -17, 2], [0, -10, 7, -18, 2], [0, -11, 1, -22, 2], [-5, -14, -11, -16, 1], [-6, -16, -8, -23, 1], [5, -15, 11, -17, 1], [6, -17, 9, -24, 1], [1, -18, -3, -26, 1], [1, -19, 4, -27, 1], [-9, -16, -13, -20, 1], [9, -17, 13, -21, 1]];
const LEAVES = [];
(() => {
  let n = 0;
  for (let k = 0; k < 500 && LEAVES.length < 80; k++) {
    const a = rnd(k * 2.1) * 6.283, r = Math.sqrt(rnd(k * 5.3 + 1)), x = Math.cos(a) * r * 14.5, y = -20.5 + Math.sin(a) * r * 9.5 + Math.abs(x) * .12;
    if (y > -11.5) continue;
    LEAVES.push({ x: Math.round(x), y: Math.round(y), s: rnd(k + 7) < .55 ? 3 : 4, o: rnd(n * 3.3 + .4), c: rnd(n * 1.7 + 8), f: rnd(n * 9.1 + 2) });
    n++;
  }
  LEAVES.sort((a, b) => (b.y + b.x * .4) - (a.y + a.x * .4));
})();
function drawTree(g, X, Y, c, time, P) {
  const y = c.ydf, R = (x, yy, w, h, col) => { g.fillStyle = col; g.fillRect(x, yy, w, h); };
  const sway = (dy) => Math.round(Math.sin(time * (1.1 + c.wet) + dy * .12) * clamp((-dy - 12) / 16) * (.7 + c.wet));
  const snow = y >= 30 ? Math.min(smooth(30, 32.5, y), 1 - smooth(38.4, 40, y)) : 0;
  for (const [x0, y0, x1, y1, w] of BR) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) {
      const px = Math.round(x0 + (x1 - x0) * i / n), py = Math.round(y0 + (y1 - y0) * i / n), s = w === 1 ? sway(py) : 0, lx = X + px + s - (w > 2 ? 1 : 0);
      R(lx, Y + py, w, 1, css(P('#6b4a38')));
      if (w > 1) { R(lx, Y + py, 1, 1, css(P('#93694b'))); if (w > 2) R(lx + 2, Y + py, 1, 1, css(P('#4b3230'))); }
      if (snow > .25 && Math.abs(x1 - x0) >= 3 && w < 3 && rnd(px * 3 + py) < snow + .1) R(X + px + s, Y + py - 1, w, 1, css(P('#f4f8ff')));
    }
  }
  R(X - 2, Y - 1, 5, 2, css(P('#5a3d32')));
  const grow = y < 10 ? smooth(1, 8.5, y) : 1, fall = y >= 20 ? smooth(24, 29.6, y) : 0;
  const bloom = y < 10 ? Math.min(smooth(2.2, 4, y), 1 - smooth(6.6, 8.8, y)) : 0;
  if (y < 30) for (const L of LEAVES) {
    if (!(L.o < grow && L.f >= fall)) continue;
    const s = sway(L.y), young = y < 10 ? 1 - smooth(5, 10, y) : 0;
    let col = mixc(hx('#57a64f'), hx('#2f7a45'), L.c); col = mixc(col, hx('#a7d35e'), young * .85);
    if (y >= 18) { const a = smooth(19.5 + L.f * 4, 22.5 + L.f * 4, y), au = L.c < .34 ? '#f0c23e' : L.c < .68 ? '#e8862f' : '#c9452f'; col = mixc(col, hx(au), a); }
    const fl = bloom > 0 && L.o < bloom * .85; if (fl) col = mixc(hx('#ffd9e6'), hx('#f7a9c4'), L.c);
    const lite = mixc(col, hx('#fff2c8'), .3), dark = mixc(col, hx('#1f2a4a'), .3), sz = y < 10 ? Math.max(2, Math.round(L.s * (.55 + grow * .5))) : L.s;
    const x = X + L.x + s - 1, yy = Y + L.y - 1;
    R(x, yy, sz, sz, css(P(col))); R(x + sz - 1, yy + 1, 1, sz - 1, css(P(dark))); R(x, yy + sz - 1, sz - 1, 1, css(P(dark)));
    R(x, yy, Math.max(1, sz - 2), 1, css(P(lite))); R(x, yy + 1, 1, 1, css(P(lite)));
    if (fl && L.f > .5) R(x + 1, yy + 1, 1, 1, css(P('#fff6d8')));
  }
  // apples: green from the middle of summer, red by its end, gathered in the first days of autumn
  if (y > 12.5 && y < 24) LEAVES.filter((L, i) => i % 8 === 3).forEach((L, i) => {
    if (y > 21 + i * .35) return;
    const a = smooth(14.5 + i * .25, 18 + i * .2, y), x = X + L.x + sway(L.y);
    R(x, Y + L.y + 1, 2, y > 14 ? 2 : 1, css(P(mixc(hx('#b9d65a'), hx('#d83a3a'), a))));
    R(x, Y + L.y + 1, 1, 1, css(P(mixc(hx('#e2f09a'), hx('#ff9a86'), a))));
  });
}
function groundCol(c) {
  const y = c.ydf, pts = [[0, '#9a9a6a'], [3, '#8fb866'], [9, '#6fb058'], [15, '#5fa24f'], [19, '#7fa24b'], [23, '#b39a4a'], [28, '#97774a'], [30, '#8d7a62'], [32, '#e6edf6'], [37.6, '#e9f0f8'], [40, '#9a9a6a']];
  for (let i = 1; i < pts.length; i++) if (y <= pts[i][0]) return mixc(hx(pts[i - 1][1]), hx(pts[i][1]), (y - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
  return hx('#9a9a6a');
}
function house(g, x, y, c, time, P, night, small) {
  const R = (a, b, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(a), Math.round(b), w, h); }, s = small ? 7 : 10, hh = small ? 4 : 5;
  const snow = c.ydf >= 31.2 && c.ydf < 39;
  R(x, y - hh, s, hh + 3, css(P(small ? '#cfae92' : '#e2c39d'))); R(x + s - 2, y - hh, 2, hh + 3, css(P(small ? '#a98674' : '#b99478')));
  for (let k = 0; k < s / 2; k++) R(x - 1 + k, y - hh - k, s + 2 - 2 * k, 1, css(P(hx(snow ? (k ? '#f2f6fd' : '#cbd8ea') : k ? '#a8503f' : '#7f3a38'))));
  const on = night > .4 && (c.h > 15 ? c.h < 23 : c.h > 5.5);
  R(x + 2, y - 2, 2, 2, on ? '#ffd56a' : css(P('#6f8fb0'))); if (!small) R(x + 6, y - 2, 2, 2, on ? '#ffd56a' : css(P('#6f8fb0')));
  R(x + s - 3, y - hh - (small ? 4 : 5), 2, 3, css(P('#7a5548')));
  if (c.season > 1 || night > .5) for (let i = 0; i < 4; i++) { const k = (time * .3 + i * .25) % 1; R(x + s - 3 + Math.sin(time + i * 2) * 1.5 + k * 3, y - hh - 6 - k * 8, k > .5 ? 2 : 1, 1, css(P('#e8ecf4'), (.6 * (1 - k)).toFixed(2))); }
}
function moonLit(x, y, ph) {
  const wd = Math.sqrt(Math.max(0, 11.5 - y * y));
  return ph < .5 ? x > wd * Math.cos(ph * 2 * Math.PI) - .3 : x < -wd * Math.cos(ph * 2 * Math.PI) + .3;
}
// time: seconds of the animation; 0 = the animated background is off, then nothing moves by itself
const sky = { key: '', im: null };
function drawView(g, w, h, c, time) {
  const [T, B] = skyColors(c), key = T + ',' + B + ',' + w;
  if (key !== sky.key) { sky.key = key; if (!sky.im || sky.im.width !== w || sky.im.height !== h) sky.im = g.createImageData(w, h); gradDither(g, sky.im, w, h, T, B, 9); } else g.putImageData(sky.im, 0, 0);
  const night = 1 - c.dayK, R = (x, y, ww, hh, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), ww, hh); };
  const hor = h - 9;
  const amb = mixc(mixc([86, 94, 150], [255, 255, 255], c.dayK), hx(c.dawn ? '#ffc8a8' : '#ff9f78'), c.glowK * .4);
  const P = (col) => (Array.isArray(col) ? col : hx(col)).map((v, i) => Math.round(v * amb[i] / 255));
  // stars, and a shooting star from time to time
  for (let i = 0; i < 34; i++) {
    const a = (night - .35) * 1.5 * (.55 + .45 * Math.sin(time * (1.2 + rnd(i) * 2) + i * 2)) * (1 - c.wet);
    if (a > .05) R(rnd(i + .3) * w, rnd(i * 2.7 + 1) * (hor - 4), 1, 1, `rgba(255,250,225,${a.toFixed(2)})`);
  }
  const sh = (time % 17) / 17 * 24;
  if (time && night > .9 && sh < 1 && !c.wet) for (let k = 0; k < 6; k++) R(w * .75 - sh * 26 + k * 2, 3 + sh * 9 - k, 2, 1, `rgba(255,255,240,${(.8 - k * .13).toFixed(2)})`);
  // the sun: high in summer, low in winter; left (east) in the morning, right (west) in the evening
  const p = (c.h - c.sr) / (c.ss - c.sr);
  if (p > -.06 && p < 1.06) {
    const up = Math.sin(Math.PI * clamp(p)), sx = Math.round(-2 + p * (w + 4)), sy = Math.round(hor + 1 - up * (hor - 4) * (.45 + .55 * c.warm) + (p < 0 || p > 1 ? 4 : 0));
    const core = mixc(hx('#fff3b0'), hx('#ff9a4a'), smooth(.35, 1, 1 - up)), a = 1 - c.wet * .85;
    for (const [r, al] of [[9, .1], [7, .16], [5, .3]]) disc(g, sx, sy, r, css(core, al * a));
    disc(g, sx, sy, 3, css(core, a)); R(sx - 1, sy - 2, 2, 1, css(mixc(core, [255, 255, 255], .6), a));
    if (c.dayK > .8 && !c.wet) for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4 + Math.floor(time * 2) * .2, r = 6 + (Math.floor(time * 2 + i) & 1); R(sx + Math.cos(an) * r, sy + Math.sin(an) * r, 1, 1, css(core, .8)); }
  }
  // the moon: high in winter, low in summer; a full cycle of phases takes one season
  const q = ((c.h - c.ss + 24) % 24) / (24 - c.len);
  if (q < 1 && night > .05) {
    const mx = Math.round(-2 + q * (w + 4)), my = Math.round(hor - Math.sin(Math.PI * q) * (hor - 5) * (.5 + .5 * (1 - c.warm))), a = smooth(.1, .7, night) * (1 - c.wet * .8), ph = c.moonPhase;
    disc(g, mx, my, 7, `rgba(210,220,255,${.1 * a})`); disc(g, mx, my, 5, `rgba(210,220,255,${.12 * a})`);
    for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) if (x * x + y * y <= 11) R(mx + x, my + y, 1, 1, moonLit(x, y, ph) ? `rgba(246,242,218,${a})` : `rgba(70,78,122,${a * .55})`);
    for (const [x, y] of [[-1, -1], [1, 1], [0, 2]]) if (moonLit(x, y, ph)) R(mx + x, my + y, 1, 1, `rgba(206,200,180,${a})`);
  }
  // clouds
  for (let i = 0; i < 4; i++) {
    const cw = 12 + (i % 3) * 5, x = ((time * (1.1 + i * .5) + i * 41 + c.t * .54) % (w + 40)) - 22, y = 4 + (i * 7) % 15;
    const cc = css(mixc(P(mixc([255, 255, 255], [150, 158, 172], c.wet)), B, .15)), cd = css(mixc(P(mixc([214, 224, 238], [120, 128, 146], c.wet)), B, .2));
    R(x + 2, y - 2, cw - 7, 2, cc); R(x, y, cw, 2, cc); R(x + cw * .3, y - 3, 4, 1, cc); R(x + 1, y + 2, cw - 2, 1, cd);
  }
  // hills, houses, the meadow
  const G = groundCol(c), far = mixc(mixc(G, T, .5), [150, 170, 190], .2);
  for (let x = 0; x < w; x++) {
    const hh = Math.round(4 + 2.6 * Math.sin(x * .07 + 1) + 1.6 * Math.sin(x * .17));
    R(x, hor - hh + 1, 1, hh + 9, css(P(mixc(far, B, .18)))); if (x % 3 === 0) R(x, hor - hh + 1, 1, 1, css(P(mixc(far, [255, 255, 255], .2))));
  }
  if (w > 80) house(g, Math.round(w * .78), hor - 1, c, time, P, night); if (w > 80) house(g, Math.round(w * .58), hor - 2, c, time + 5, P, night, true);
  for (let x = 0; x < w; x++) {
    const hh = Math.round(1.2 * Math.sin(x * .11));
    R(x, hor + 3 + hh, 1, 10, css(P(G))); R(x, hor + 3 + hh, 1, 1, css(P(mixc(G, [255, 250, 210], .28))));
    if (rnd(x * 1.3) < .3) R(x, hor + 5 + Math.floor(rnd(x) * 4), 1, 1, css(P(mixc(G, [40, 50, 80], .16))));
  }
  if (c.ydf > 3 && c.ydf < 19) for (let i = 0; i < 12; i++) R(rnd(i * 3) * w, hor + 5 + rnd(i) * 4, 1, 1, css(P(['#ffffff', '#ffd84a', '#f48ab0', '#b98af4'][i % 4])));
  const tx = w > 80 ? 26 : Math.round(w / 2);
  drawTree(g, tx, h - 4, c, time, P);
  // leaves and petals on the grass and in the air
  if (c.ydf > 23 && c.ydf < 31) for (let i = 0; i < 26 * smooth(23, 29, c.ydf) * (1 - smooth(30, 31, c.ydf)); i++) R(tx - 17 + rnd(i * 2) * 36, h - 4 + Math.floor(rnd(i * 5) * 4), 1, 1, css(P(['#f0c23e', '#e8862f', '#c9452f'][i % 3])));
  const fly = c.ydf > 23.5 && c.ydf < 30 ? ['#f0c23e', '#e8862f', '#c9452f'] : c.ydf > 4.5 && c.ydf < 8.6 ? ['#ffd9e6', '#f7a9c4', '#ffffff'] : null;
  if (fly) for (let i = 0; i < 5; i++) { const k = (time * .16 + i * .21) % 1; R(tx - 10 + i * 5 + Math.sin(time * 2 + i * 2) * 3 + k * 10, h - 26 + k * 24, (Math.floor(time * 4 + i) & 1) ? 2 : 1, 1, css(P(fly[i % 3]))); }
  // living things of the season
  if (c.dayK > .6 && !c.wet) {
    if (c.season === 1) for (let i = 0; i < 2; i++) { const bx = w * .5 + Math.sin(time * .5 + i * 3) * w * .3, by = hor + 1 + Math.sin(time * 1.3 + i) * 4, f = Math.floor(time * 6 + i) & 1; R(bx - f, by, 1, 1, css(P(i ? '#ffd84a' : '#f48ab0'))); R(bx + f, by, 1, 1, css(P(i ? '#ffd84a' : '#f48ab0'))); }
    if (c.season === 0 || c.season === 2) {
      const k = (time % 14) / 9, d = c.season === 2 ? 1 : -1;
      if (k < 1) for (let i = 0; i < 5; i++) { const bx = d > 0 ? -8 + k * (w + 26) - Math.abs(i - 2) * 4 : w + 8 - k * (w + 26) + Math.abs(i - 2) * 4, by = 8 + (i - 2) * 2 + Math.sin(time + i) * .6, f = Math.floor(time * 5 + i) & 1; R(bx, by, 1, 1, css(P('#39324a'))); R(bx - 1, by - f, 1, 1, css(P('#39324a'))); R(bx + 1, by - f, 1, 1, css(P('#39324a'))); }
    }
    if (c.season === 3) { const bx = tx + 8, by = h - 24, hop = Math.sin(time * 3) > .9 ? 1 : 0; R(bx, by - hop, 3, 3, css(P('#e0483e'))); R(bx, by - 1 - hop, 2, 1, css(P('#2a2838'))); R(bx + 2, by - hop, 2, 2, css(P('#6c7486'))); R(bx + 3, by + 2 - hop, 1, 1, css(P('#2a2838'))); }
  }
  if (c.season === 1 && night > .7 && !c.wet) for (let i = 0; i < 6; i++) { const a = .5 + .5 * Math.sin(time * 1.6 + i * 2); if (a > .3) R(w * .15 + i * w * .13 + Math.sin(time * .6 + i) * 4, hor + 2 + Math.sin(time * .8 + i * 2) * 4, 1, 1, `rgba(226,255,120,${a.toFixed(2)})`); }
  // rain, snow, a flash of summer lightning
  if (c.wet > 0) {
    const n = Math.round(w * .5 * c.wet);
    for (let i = 0; i < n; i++) {
      if (c.season === 3) R((rnd(i) * w + Math.sin(time + i) * 3 + w) % w, (rnd(i * 3) * h + time * (7 + i % 4 * 2)) % h, 1, 1, 'rgba(255,255,255,.92)');
      else R((rnd(i) * w - (time * 9) % w + w) % w, (rnd(i * 3) * h + time * 62) % h, 1, 3, css(P('#c9dcf2'), .55));
    }
  }
  if (c.season === 1 && c.wet > .5 && time && (time % 7) < .12) { g.fillStyle = 'rgba(240,244,255,.55)'; g.fillRect(0, 0, w, h); }
  // frost on the glass in winter, drops in the rain
  if (c.season === 3) {
    const f = .35 + .65 * (1 - c.warm);
    for (let i = 0; i < 90 * f; i++) { const e = rnd(i * 7), side = i % 4, a = rnd(i * 3) * (side < 2 ? h : w), d = e * e * 6; R(side === 0 ? d : side === 1 ? w - 1 - d : a, side === 2 ? d : side === 3 ? h - 1 - d : a, 1, 1, `rgba(240,248,255,${(.7 - d * .1).toFixed(2)})`); }
  } else if (c.wet > .2) for (let i = 0; i < 9; i++) { const k = (time * .12 * (1 + i % 3) + rnd(i)) % 1; R(rnd(i * 4) * w, k * h, 1, 2, 'rgba(230,242,255,.6)'); }
}
return drawView;
};
