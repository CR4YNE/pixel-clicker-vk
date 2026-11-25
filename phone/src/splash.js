// The New Year start screen: the tools and the things. Built from docs/splash-newyear (kit.js, scene.js) by port.py.
// Each material has five tones: the shadows are cold, the lights are warm. window.SPLASH.start() picks one of the three scenes at random.
(() => {
let G = null;
const hx = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const mix = (a, b, t) => { const A = hx(a), B = hx(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const ramp = (c, d = '#1a1446', w = '#fff2cc') => [mix(c, d, .55), mix(c, d, .28), c, mix(c, w, .3), mix(c, w, .62)];
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const rnd = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const R = (x, y, w, h, c) => { G.fillStyle = c; G.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; };
const on = (g, f) => { const o = G; G = g; f(); G = o; };
const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], dith = (x, y) => (BAY[(y & 3) * 4 + (x & 3)] + .5) / 16;
const SNOW = ['#4a5aa0', '#7f95d0', '#b6cbf0', '#e2edff', '#fffdf2'], RED = ramp('#d0323e'), GREEN = ramp('#2f7d52'), GOLD = ramp('#f0b83a'), WOOD = ramp('#8a5634'), BRICK = ramp('#a8584a'),
  STONE = ramp('#77789a'), DOUGH = ramp('#c47a3a'), CHOC = ramp('#7a3a2a'), ICING = ['#b9a2d8', '#d8c8ee', '#f3e8f6', '#fff6f2', '#ffffff'], IRON = ramp('#3c3f62'), WARM = ['#a8482e', '#e07a38', '#ffb054', '#ffd683', '#fff2c0'];
const LAMPS = ['#ff5a52', '#ffd84a', '#5fe07a', '#59b8ff', '#ff7fe0'];
function grad(x, y, w, h, cols) { for (let j = 0; j < h; j++) { const f = j / Math.max(1, h - 1) * (cols.length - 1); for (let i = 0; i < w; i++) R(x + i, y + j, 1, 1, cols[Math.min(cols.length - 1, Math.floor(f + dith(x + i, y + j)))]); } }
// a lit ball: five tones, the light from the upper left
function ball(cx, cy, r, p) { for (let y = -Math.ceil(r); y <= r; y++) for (let x = -Math.ceil(r); x <= r; x++) { const u = x / r, v = y / r, d = u * u + v * v; if (d > 1.02) continue; const l = (-u * .55 - v * .7) + Math.sqrt(Math.max(0, 1 - d)) * .55 + (dith(cx + x, cy + y) - .5) * (r > 5 ? .22 : 0); R(cx + x, cy + y, 1, 1, p[l > .95 ? 4 : l > .55 ? 3 : l > .1 ? 2 : l > -.35 ? 1 : 0]); } }
// a pool of light as a picture: flat rings with a dither between them
function pool(rx, ry, col, a = .5) { const [c, g] = cv(rx * 2, ry * 2), [r, q, b] = hx(col), N = 6; for (let y = 0; y < ry * 2; y++) for (let x = 0; x < rx * 2; x++) { const d = Math.hypot((x - rx + .5) / rx, (y - ry + .5) / ry); if (d >= 1) continue; const k = Math.floor((1 - d) * N + dith(x, y)) / N; g.fillStyle = `rgba(${r},${q},${b},${(k * k * a).toFixed(3)})`; g.fillRect(x, y, 1, 1); } return c; }
const put = (map, x, y, pal) => map.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const c = pal[row[i]]; if (c) R(x + i, y + j, 1, 1, c); } });
function text(s, x, y, col, sc = 1) { for (const ch of s) { const g = ch !== ' ' && FONT[ch]; if (g) g.rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === '#') R(x + i * sc, y + (j - g.above) * sc, sc, sc, col); }); x += ((g ? g.rows[0].length : 3) + 1) * sc; } }
const tw = (s, sc = 1) => { let w = 0; for (const ch of s) w += ((ch !== ' ' && FONT[ch] ? FONT[ch].rows[0].length : 3) + 1) * sc; return w - sc; };
// snow lying on a straight edge, with uneven lumps
function snowTop(x, y, w, t = 3, seed = 1) { for (let i = 0; i < w; i++) { const e = Math.min(1, Math.min(i, w - 1 - i) / 2), h = Math.max(1, Math.round((t - 1 + Math.sin(i * .55 + seed) * .8 + Math.sin(i * .21 + seed * 3) * .9) * e + .6)); R(x + i, y - h, 1, h, SNOW[3]); R(x + i, y - h, 1, 1, SNOW[4]); R(x + i, y, 1, 1, (i + seed) % 5 < 3 ? SNOW[2] : SNOW[1]); if (rnd(i + seed) > .72 && i > 2 && i < w - 3) R(x + i, y + 1, 1, 1, SNOW[2]); } }
function icicles(x, y, w, seed, max = 7) { for (let i = 1; i < w - 1; i += 2 + Math.floor(rnd(i + seed) * 3)) { const l = 2 + Math.floor(rnd(i * 2.3 + seed) * max); if (l > 4) R(x + i - 1, y, 1, l >> 1, '#8fb4e8'); R(x + i, y, 1, l, '#cfe6ff'); R(x + i, y, 1, 1, '#ffffff'); R(x + i + 1, y, 1, Math.max(1, l >> 1), '#7a98d6'); R(x + i, y + l - 1, 1, 1, '#ffffff'); } }
// a slope of snow: the top line is a wave; the light comes from the left, the hollows are blue
function drift(x0, x1, bot, f, pal = SNOW, seed = 1) { for (let x = x0; x < x1; x++) { const y = Math.round(f(x)), s = f(x + 2) - f(x - 2); for (let j = y; j < bot; j++) { const d = j - y; let k = 3.1 - d * .1 + (s < 0 ? .55 : -.55) * Math.max(0, 1 - d / 14) + Math.sin(x * .07 + j * .31 + seed) * .35; if (d === 0) k = s <= 0 ? 4.6 : 3.4; R(x, j, 1, 1, pal[clamp(Math.floor(k + dith(x, j) - .3), 0, 4)]); } } }
function stars(w, h, n) { for (let i = 0; i < n; i++) R(rnd(i * 3.1) * w, Math.pow(rnd(i * 7.7), 1.3) * h, 1, 1, ['#8f9be0', '#c6d0ff', '#ffffff', '#ffe9b8'][i % 4]); }
function moon(x, y, r, pal = ['#8d8fc8', '#c4c3e2', '#ece6e4', '#fbf4dc', '#fffdf0']) { ball(x, y, r, pal); for (const [a, b, q] of [[.3, -.25, .2], [-.25, .3, .24], [.2, .45, .13], [-.5, -.25, .12], [.6, .15, .1]]) { const cr = Math.max(1, Math.round(r * q * (r > 30 ? .55 : 1))); for (let j = -cr; j <= cr; j++) for (let i = -cr; i <= cr; i++) if (i * i + j * j <= cr * cr) R(x + a * r + i, y + b * r + j, 1, 1, i + j > 0 ? pal[3] : pal[1]); } }
function ridge(w, y0, amp, seed, pal, bot) { const f = (x) => y0 - Math.abs(Math.sin(x * .021 + seed)) * amp - Math.abs(Math.sin(x * .057 + seed * 2)) * amp * .45 - rnd(Math.floor(x / 3) + seed) * 2; for (let x = 0; x < w; x++) { const y = Math.round(f(x)), lit = f(x + 4) - f(x - 4) < 0; for (let j = y; j < bot; j++) { const cap = j - y < amp * .42 + Math.sin(x * .9 + seed) * 2 + rnd(x + seed) * 3; R(x, j, 1, 1, cap ? (lit ? pal[4] : pal[2]) : dith(x, j) < (j - y) / 40 ? pal[1] : lit ? pal[1] : pal[0]); } } }
// a small fir of the far forest
function fir(x, base, h, p) { for (let j = 0; j < h; j++) { const q = (j % 5) / 5, w = Math.max(0, Math.round(j * .26 + q * 2 - 1)); for (let i = -w; i <= w; i++) R(x + i, base - h + j, 1, 1, i < -w * .3 ? p[2] : i > w * .4 ? p[0] : p[1]); if (j % 5 > 2 && w > 0) { R(x - w, base - h + j, Math.ceil(w * .9), 1, p[4]); if (w > 2) R(x + 1, base - h + j, w - 2, 1, p[3]); } } R(x, base, 1, 2, p[0]); }
function hut(x, base, w, h, lit) { const p = ramp('#54406a'); R(x, base - h, w, h, p[2]); R(x, base - h, 2, h, p[3]); R(x + w - 2, base - h, 2, h, p[1]); for (let j = 0; j < h * .8; j++) R(x - 2 + j, base - h - j, w + 4 - j * 2, 1, j < 1 ? SNOW[1] : j > h * .5 ? SNOW[3] : SNOW[2]); R(x + w - 4, base - h * 2, 2, 4, p[1]); R(x + w - 4, base - h * 2 - 1, 2, 1, SNOW[3]); for (const X of w > 8 ? [x + 2, x + w - 4] : [x + 2]) { lit.push([X, base - h + 2]); R(X, base - h + 2, 2, 2, '#2a2352'); } }
// the big dressed fir; gives back the places of its lamps
function bigTree(cx, base, h, o = {}) {
  const p = o.pal || GREEN, n = Math.max(3, Math.round(h / 17)), bulbs = [], W2 = h * (o.wide || .36), s0 = cx * .37;
  R(cx - 3, base - 6, 7, 8, WOOD[1]); R(cx - 3, base - 6, 2, 8, WOOD[3]); R(cx + 2, base - 6, 2, 8, WOOD[0]); R(cx, base - 5, 1, 6, WOOD[2]);
  for (let t = n - 1; t >= 0; t--) {
    const y0 = base - h + t * (h - 4) / n * .96, hh = (h - 4) / n * 1.36, wa = t ? W2 * t / n * .42 : .5, wb = W2 * (t + 1.1) / (n + .1);
    const edge = (x) => hh * (.86 + .1 * Math.sin(x * 1.25 + t * 2 + s0) + .06 * Math.sin(x * .6 + t) - .1 * Math.abs(x) / wb);
    for (let x = -Math.ceil(wb); x <= wb; x++) { const lo = edge(x); for (let j = 0; j < lo; j++) {
      const f = j / hh, w = lerp(wa, wb, Math.pow(f, .85)) + Math.sin(j * 1.9 + t) * .7; if (Math.abs(x) > w) continue;
      const u = x / wb, e = lo - j, sn = Math.sin(x * .8 + t * 1.7 + s0) + Math.sin(x * .31 + t * 4);
      const k = 2.1 - u * 1.5 + (rnd(x * 3.3 + j * 7.1 + t) - .5) * 1.1 - (f < .24 && t ? 1 : 0) - (e < 2 ? 1.2 : 0) + ((x + j * 2 + t) % 7 === 0 ? .6 : 0);
      let c = p[clamp(Math.round(k), 0, 4)];
      if (o.snow !== 0 && e < 5 && e >= 1.6 && sn > .25) c = e > 3.6 || u < -.3 ? SNOW[u > .45 ? 3 : 4] : SNOW[u > .3 ? 1 : 2];
      R(cx + x, Math.round(y0) + j, 1, 1, c); } }
  }
  for (let t = 0; t < n; t++) { const y0 = base - h + t * (h - 4) / n * .96, hh = (h - 4) / n * 1.36, w = W2 * (t + .75) / (n + .1), m = Math.max(2, Math.round(w / 4.2));
    for (let i = 0; i <= m; i++) { const u = i / m * 2 - 1; bulbs.push([Math.round(cx + u * w * .86), Math.round(y0 + hh * .5 + (1 - u * u) * 4 + u * 2), LAMPS[(i * 2 + t) % 5]]); }
    const b = Math.round(w / 6.5); if (t) for (let i = 0; i < b; i++) { const u = (i + .5 + rnd(t + i) * .3) / b * 2 - 1; ball(Math.round(cx + u * w * .78), Math.round(y0 + hh * .78 + (rnd(i * 3 + t) - .5) * 4), h > 70 && (i + t) % 2 ? 2 : 1.5, [RED, GOLD, ramp('#4d8fe0'), ramp('#b45ad8')][(i + t) % 4]); } }
  return { bulbs: bulbs.sort((a, b) => b[1] - a[1]), star: [cx, Math.round(base - h) - 1] };
}
function star(x, y, k, t) { const p = k > .5 ? ['#b06a1c', '#e89a2c', '#ffd24a', '#ffee9a', '#fffdf0'] : ['#4a3a4e', '#6e5654', '#94785c', '#b0946c', '#c8b088']; put(['....4....', '....3....', '...343...', '333343322', '.1233221.', '..12321..', '..23132..', '.22...11.', '.1.....0.'], x - 4, y - 5, p); if (k > .5) { const l = 2 + Math.round(1 + Math.sin(t * 7)); R(x, y - 6 - l, 1, l, '#fff2b0'); R(x - 5 - l, y - 1, l, 1, '#fff2b0'); R(x + 6, y - 1, l, 1, '#fff2b0'); } }
function snowman(x, base, big = 1) {
  const r = big ? [9, 7, 5] : [7, 5, 4]; R(x - r[0], base - 1, r[0] * 2 + 5, 2, 'rgba(50,50,120,.35)'); const y = base - r[0], y2 = y - r[0] - r[1] + 4, y3 = y2 - r[1] - r[2] + 3; ball(x, y, r[0], SNOW); ball(x, y2, r[1], SNOW); ball(x, y3, r[2], SNOW);
  for (const b of [y2 - 2, y2 + 2, y]) { R(x, b, 2, 2, IRON[0]); R(x, b, 1, 1, IRON[3]); }
  R(x - 2, y3 - 2, 1, 2, '#1a1638'); R(x + 2, y3 - 2, 1, 2, '#1a1638'); R(x, y3, 2, 2, '#f08a2c'); R(x + 2, y3, 2, 1, '#ffb45a'); R(x + 4, y3 + 1, 1, 1, '#c8601c'); for (let i = -2; i <= 2; i++) R(x + i, y3 + 3 - (Math.abs(i) > 1 ? 1 : 0), 1, 1, '#3a3462');
  const q = r[2], sy = y3 + q - 1; R(x - q, sy, q * 2 + 1, 3, RED[2]); R(x - q, sy, q * 2, 1, RED[3]); for (let i = -q; i < q; i += 3) R(x + i, sy, 1, 3, RED[4]); R(x + 3, sy + 3, 3, 6, RED[1]); R(x + 3, sy + 3, 1, 6, RED[2]); R(x + 3, sy + 6, 3, 1, RED[4]);
  const hy = y3 - q; R(x - q - 1, hy + 1, q * 2 + 3, 2, IRON[1]); R(x - q - 1, hy + 1, q * 2 + 2, 1, IRON[3]); R(x - 3, hy - 6, 7, 7, IRON[1]); R(x - 3, hy - 6, 2, 7, IRON[3]); R(x + 3, hy - 6, 1, 7, IRON[0]); R(x - 3, hy - 1, 7, 2, RED[2]); R(x - 3, hy - 1, 2, 1, RED[4]); snowTop(x - 3, hy - 6, 7, 2, 2);
  for (let i = 0; i < 8; i++) { R(x - r[1] - i, y2 - Math.round(i * .6), 1, 1, WOOD[i < 4 ? 1 : 2]); R(x + r[1] + i, y2 - Math.round(i * .9), 1, 1, WOOD[1]); } R(x - r[1] - 6, y2 - 6, 1, 2, WOOD[2]); R(x + r[1] + 6, y2 - 8, 1, 2, WOOD[1]);
}
function gift(x, base, w, h, c, rib) {
  const p = ramp(c), q = ramp(rib), s = 3; R(x + 1, base, w + 3, 1, 'rgba(40,36,100,.4)'); R(x, base - h, w, h, p[2]); R(x, base - h, 1, h, p[4]); R(x, base - 1, w, 1, p[1]); for (let i = 0; i < s; i++) { R(x + w + i, base - h - i, 1, h, p[i > 1 ? 0 : 1]); R(x + i, base - h - i, w, 1, p[i === s - 1 ? 4 : 3]); } for (let j = 2; j < h - 1; j += 3) for (let i = 1 + (j % 2); i < w - 1; i += 4) R(x + i, base - h + j, 1, 1, p[3]);
  const m = x + (w >> 1) - 1, t = base - h - s; R(m, base - h, 3, h, q[2]); R(m, base - h, 1, h, q[4]); R(m + 2, base - h, 1, h, q[1]); R(m + 1, t, 3, s, q[3]); R(m - 3, t - 3, 3, 3, q[2]); R(m - 2, t - 2, 1, 1, q[0]); R(m - 3, t - 3, 2, 1, q[4]); R(m + 3, t - 3, 3, 3, q[1]); R(m + 4, t - 2, 1, 1, q[0]); R(m + 3, t - 3, 2, 1, q[3]); R(m, t - 1, 3, 2, q[3]);
}
function cane(x, base, h) { const rr = [RED[4], RED[2], RED[2], RED[1]], ss = [SNOW[4], SNOW[3], SNOW[2], SNOW[1]]; for (let j = 5; j < h; j++) for (let k = 0; k < 4; k++) R(x + k, base - h + j, 1, 1, (j + k * 2) % 6 < 3 ? rr[k] : ss[k]); for (let a = 0; a <= 20; a++) for (let k = 0; k < 4; k++) { const t = Math.PI * a / 20, r = 6 - k; R(x + 5.5 - Math.cos(t) * r, base - h + 5 - Math.sin(t) * r, 1, 1, Math.floor(a / 3) % 2 ? rr[k] : ss[k]); } for (let k = 0; k < 4; k++) R(x + 8 + k, base - h + 5, 1, 2, ss[k]); }
const MAN = ['...0000...', '..022220..', '.02322210.', '.0W2W2210.', '.022222R0.', '..0WWW20..', '.00222100.', '0222W22220', '3W22222W21', '.0022W200.', '..022220..', '..0222210.', '.02220210.', '.0W20.0W0.', '.000...00.'];
const MAN2 = MAN.map((r, j) => (j === 7 ? '.022W22220' : j === 8 ? '..22222W21' : r));
const manC = {};
function man(x, base, wave, t = 0) { const key = wave ? (Math.sin(t * 9) > 0 ? 1 : 2) : 0; if (!manC[key]) { const [c, g] = cv(14, 18); manC[key] = c; on(g, () => manDraw(3, 17, key, key === 1 ? .1 : .5)); } G.drawImage(manC[key], Math.round(x) - 3, Math.round(base) - 17); }
function manDraw(x, base, wave, t) { const p = { 0: DOUGH[0], 1: DOUGH[1], 2: DOUGH[2], 3: DOUGH[4], W: '#fff6ee', R: '#ff8f9a' }; put(wave ? MAN2 : MAN, x, base - 15, p); if (wave) { const k = Math.sin(t * 9) > 0 ? -1 : 0; R(x - 1, base - 10, 2, 3, DOUGH[2]); R(x - 1 + k, base - 13, 2, 3, DOUGH[2]); R(x - 1 + k, base - 13, 2, 1, '#fff6ee'); R(x - 1 + k, base - 12, 1, 2, DOUGH[4]); } R(x + 4, base - 15, 2, 1, DOUGH[3]); }
function wreath(x, y, r) { for (let a = 0; a < 40; a++) { const t = a / 40 * 6.283, q = r + (a % 3 === 0 ? 1 : 0); R(x + Math.cos(t) * q, y + Math.sin(t) * q, 2, 2, GREEN[a % 3 + (Math.sin(t) < 0 ? 1 : 0)]); } for (let a = 0; a < 6; a++) { const t = a / 6 * 6.283 + .4; R(x + Math.cos(t) * r, y + Math.sin(t) * r, 1, 1, a % 2 ? RED[3] : GOLD[3]); } R(x - 2, y + r - 1, 2, 3, RED[2]); R(x + 1, y + r - 1, 3, 3, RED[1]); R(x, y + r, 2, 2, RED[4]); }
function lamp(x, base, h) { const y = base - h; R(x - 3, base - 3, 7, 3, IRON[1]); R(x - 3, base - 3, 7, 1, IRON[3]); R(x - 1, y, 3, h - 3, IRON[2]); R(x - 1, y, 1, h - 3, IRON[4]); R(x + 1, y, 1, h - 3, IRON[0]); R(x - 2, base - h * .55, 5, 2, IRON[3]); R(x - 5, y - 1, 11, 2, IRON[2]); R(x - 5, y - 1, 11, 1, IRON[4]); R(x - 4, y - 10, 9, 9, '#4a456e'); R(x - 4, y - 10, 1, 9, IRON[3]); R(x + 4, y - 10, 1, 9, IRON[0]); R(x, y - 10, 1, 9, IRON[1]); R(x - 5, y - 12, 11, 2, IRON[2]); R(x - 3, y - 14, 7, 2, IRON[1]); snowTop(x - 5, y - 12, 11, 4, 2); snowTop(x - 3, base - 3, 7, 2, 1); wreath(x, base - Math.round(h * .62), 4); return [x, y - 6]; }
function lampLit(x, y) { R(x - 3, y - 4, 7, 9, WARM[3]); R(x - 2, y - 3, 5, 7, WARM[4]); R(x - 1, y - 2, 3, 4, '#ffffff'); R(x, y - 4, 1, 2, WARM[2]); }
// a wire with lamps between two points
function wire(x0, y0, x1, y1, sag, n, col = '#1c3a34') { const out = [], N = Math.max(8, Math.abs(x1 - x0)); for (let i = 0; i <= N; i++) { const t = i / N; R(lerp(x0, x1, t), lerp(y0, y1, t) + Math.sin(t * Math.PI) * sag, 1, 1, col); } for (let i = 0; i < n; i++) { const t = (i + .5) / n; out.push([Math.round(lerp(x0, x1, t)), Math.round(lerp(y0, y1, t) + Math.sin(t * Math.PI) * sag) + 1, LAMPS[i % 5]]); } return out; }
const HOT = {}, OFF = {}; for (const c of LAMPS) { HOT[c] = ramp(c)[3]; OFF[c] = [mix(c, '#1c1848', .62), mix(c, '#1c1848', .4)]; }
const LIT = {}, UNLIT = {};
for (const c of LAMPS) { const [a, g] = cv(6, 6), [b, q] = cv(2, 2); on(g, () => { G.globalAlpha = .22; R(0, 1, 6, 4, c); R(1, 0, 4, 6, c); G.globalAlpha = 1; R(2, 2, 2, 2, HOT[c]); R(2, 2, 1, 1, '#ffffff'); }); on(q, () => { R(0, 0, 2, 2, OFF[c][0]); R(0, 0, 1, 1, OFF[c][1]); }); LIT[c] = a; UNLIT[c] = b; }
function bulb(x, y, col, lit) { if (lit) G.drawImage(LIT[col], x - 2, y - 2); else G.drawImage(UNLIT[col], x, y); }
function branch(x, y, len, dir, seed) { const Y = (i) => y + Math.round(i * .28 + Math.sin(i * .1) * 2); for (let i = 0; i < len; i++) { const bx = x + dir * i, by = Y(i), l = Math.round((1 - i / len) * 9 + 4); R(bx, by, 1, 2, WOOD[0]); if (i % 2 === 0) for (let k = 0; k < l; k++) { const c = k < l * .35 ? 0 : k < l * .75 ? 1 : 2; R(bx + dir * k * .7, by + k, 1, 1, GREEN[c]); if (k < l * .6) R(bx + dir * k * .8, by - k * .6, 1, 1, GREEN[Math.min(3, c + 1)]); } } for (let i = 0; i < len; i++) if (Math.sin(i * .33 + seed) > -.1) { const by = Y(i); R(x + dir * i, by - 2, 1, 2, SNOW[3]); R(x + dir * i, by - 3, 1, 1, SNOW[4]); R(x + dir * i, by, 1, 1, SNOW[1]); } }
function bauble(x, y, l, r, c) { R(x, y, 1, l, GOLD[1]); R(x - 1, y + l - 1, 3, 1, GOLD[3]); ball(x, y + l + r, r, ramp(c)); R(x - 1, y + l + r, 3, 1, '#fff3d8'); }
// the team far away
const DEER = ramp('#8a5a3e');
function sled(x, y, t) {
  const b = DEER; for (let d = 0; d < 3; d++) { const dx = x + 22 + d * 12, dy = Math.round(y + Math.sin(t * 9 + d)), f = Math.sin(t * 14 + d * 1.4) > 0; R(dx - 6, dy + 1, 6, 1, '#3a2438'); R(dx, dy, 7, 3, b[2]); R(dx, dy, 7, 1, b[4]); R(dx + 1, dy + 2, 5, 1, b[1]); R(dx + 6, dy - 2, 2, 3, b[3]); R(dx + 7, dy - 3, 3, 2, b[3]); R(dx + 10, dy - 2, 1, 1, d === 2 ? '#ff4a4a' : b[0]); R(dx + 7, dy - 5, 1, 2, WOOD[3]); R(dx + 6, dy - 6, 1, 1, WOOD[4]); R(dx + 8, dy - 6, 1, 2, WOOD[3]); R(dx - 1, dy, 1, 1, '#fff'); if (f) { R(dx - 1, dy + 3, 2, 1, b[1]); R(dx + 6, dy + 3, 2, 1, b[1]); R(dx + 8, dy + 2, 1, 1, b[0]); } else { R(dx + 1, dy + 3, 1, 2, b[1]); R(dx + 5, dy + 3, 1, 2, b[1]); } }
  R(x, y + 1, 13, 4, RED[2]); R(x, y + 1, 13, 1, GOLD[3]); R(x, y + 4, 13, 1, RED[1]); R(x - 1, y - 1, 3, 4, RED[2]); R(x - 1, y - 1, 1, 3, RED[4]); R(x - 2, y + 6, 16, 1, GOLD[2]); R(x + 14, y + 5, 1, 1, GOLD[3]); R(x + 2, y + 5, 1, 1, GOLD[1]); R(x + 10, y + 5, 1, 1, GOLD[1]); R(x + 6, y - 3, 4, 4, RED[3]); R(x + 7, y - 5, 3, 2, '#f0c8a0'); R(x + 8, y - 4, 2, 2, '#fff'); R(x + 6, y - 7, 4, 2, RED[2]); R(x + 5, y - 6, 1, 2, '#fff'); R(x + 1, y - 4, 4, 5, '#4f9a5a'); R(x + 1, y - 4, 4, 1, '#8fd08a'); R(x + 3, y - 4, 1, 5, GOLD[3]);
  for (let i = 0; i < 12; i++) { const k = (t * 1.6 + i / 12) % 1; G.globalAlpha = 1 - k; R(x - 4 - k * 30, y + 4 + Math.sin(i * 5) * 3 + k * 5, 1, 1, i % 2 ? '#ffe9a0' : '#fff'); } G.globalAlpha = 1;
}
// the hat on the cookie: the fur lies along the arc (the slope a), the soft tip hangs down to the left with a pompon
function hat(ox, oy, a = -.84) {
  const c = Math.cos(a), q = Math.sin(a), N = 26, spine = []; for (let i = 0; i <= N; i++) { const t = i / N; spine.push([-Math.pow(t, 2.1) * 11, Math.sin(t * Math.PI * .72) * 13, lerp(8.6, 2.4, Math.pow(t, .8))]); }
  const at = (u, v) => [ox + u * c + v * q, oy + u * q - v * c];
  for (let y = oy - 30; y < oy + 26; y++) for (let x = ox - 34; x < ox + 20; x++) { const dx = x - ox, dy = y - oy, u = dx * c + dy * q, v = dx * q - dy * c; let best = -1, bi = 0, bd = null; spine.forEach(([pu, pv, pr], n) => { const m = pr - Math.hypot(u - pu, v - pv); if (m > best || (best < 0 && m > best)) { best = m; bi = n; bd = [u - pu, v - pv, pr]; } }); if (best < 0 || v < -1) continue;
    const sx = (bd[0] * c + bd[1] * q) / bd[2], sy = (bd[0] * q - bd[1] * c) / bd[2], l = -sx * .55 - sy * .75 + .1 + (dith(x, y) - .5) * .25 - (v < 3 ? .3 : 0) - (Math.abs(((bi * 1.1 + u * .35) % 7)) < .7 && bi > 5 ? .25 : 0); R(x, y, 1, 1, best < .7 && l < .1 ? RED[0] : RED[l > .72 ? 4 : l > .4 ? 3 : l > -.05 ? 2 : l > -.45 ? 1 : 0]); }
  for (let y = oy - 18; y < oy + 18; y++) for (let x = ox - 18; x < ox + 18; x++) { const dx = x - ox, dy = y - oy, u = dx * c + dy * q, v = dx * q - dy * c, m = 10.5 + Math.sin(v * 2) * .5, h = 3.1 + Math.sin(u * 1.5) * .55; if (Math.abs(u) > m) continue; const e = Math.abs(u) > 8 ? h * (1 - (Math.abs(u) - 8) / 4.5) : h; if (Math.abs(v + .6) > e) continue; const l = (v + .6) / h - u * .02 + (rnd(x * 3 + y * 7) - .5) * .5; R(x, y, 1, 1, l > .1 ? '#fffdf2' : l > -.35 ? '#e6ebfa' : l > -.75 ? '#c2cbea' : '#9aa4d2'); }
  const p = at(spine[N][0], spine[N][1]); ball(Math.round(p[0]), Math.round(p[1] + 2), 3, ['#9aa4d2', '#c2cbea', '#e6ebfa', '#fffdf2', '#ffffff']);
}
// a small hat on Боня and a fur band with a pompon on the cook's hat: their own pictures are not changed
const ready = (im) => im && im.complete && im.naturalWidth > 0;
function bonya(im, X, Y, cell) { if (!ready(im)) return; G.drawImage(im, cell % 10 * 48, Math.floor(cell / 10) * 40, 48, 40, X, Y, 48, 40); R(X + 28, Y + 16, 7, 2, RED[2]); R(X + 27, Y + 15, 6, 1, RED[2]); R(X + 26, Y + 14, 5, 1, RED[1]); R(X + 25, Y + 13, 4, 1, RED[1]); R(X + 28, Y + 15, 3, 1, RED[4]); R(X + 29, Y + 16, 2, 1, RED[3]); R(X + 33, Y + 17, 2, 1, RED[0]); R(X + 22, Y + 13, 3, 3, '#fffdf2'); R(X + 22, Y + 15, 3, 1, '#b8c2e6'); R(X + 27, Y + 18, 10, 2, '#fffdf2'); R(X + 27, Y + 19, 10, 1, '#d6dcf2'); R(X + 36, Y + 18, 1, 2, '#a6b0da'); }
let hatC = null; const puffs = {};
function cookHat(X, Y) { if (!hatC) { const [c, g] = cv(16, 20); hatC = c; on(g, () => { const x = -22, y = -2; R(x + 23, y + 15, 14, 2, '#fffdf2'); R(x + 23, y + 17, 14, 1, '#c4cdec'); for (let i = 0; i < 14; i += 3) R(x + 23 + i, y + 14, 2, 1, '#fffdf2'); ball(x + 30, y + 6, 2, SNOW); R(x + 33, y + 14, 2, 2, GREEN[2]); R(x + 35, y + 14, 1, 1, GREEN[3]); R(x + 34, y + 16, 1, 1, RED[3]); }); } G.drawImage(hatC, X + 22, Y + 2); }
function puff(x, y, r, a) { if (!puffs[r]) { const [c, g] = cv(r * 2 + 2, r * 2 + 2); puffs[r] = c; on(g, () => ball(r + 1, r + 1, r, ['#6a70b0', '#8f97cc', '#b6bee2', '#d4daf0', '#eef0fa'])); } G.globalAlpha = a; G.drawImage(puffs[r], Math.round(x) - r - 1, Math.round(y) - r - 1); G.globalAlpha = 1; }
// ПЕКАРНЯ: the house with the window, the door, the awning and the snowy roof. Gives back the places of the lights.
function bakery(x, gy, chim = 78) {
  const L = { win: [x + 12, gy - 41, 46, 31], bulbs: [] }, e = gy - 60, SH = 'rgba(26,20,70,.5)';
  R(x + 6, e, 92, 60, BRICK[2]); for (let j = 0; j < 60; j += 4) for (let i = -4; i < 92; i += 8) { const X = x + 6 + i + (j % 8 ? 4 : 0), q = rnd(i * 3 + j * 7.3), a = Math.max(X, x + 6), w = Math.min(X + 7, x + 98) - a; if (w > 0) { R(a, e + j, w, 3, BRICK[q < .2 ? 1 : q > .85 ? 3 : 2]); R(a, e + j, w, 1, BRICK[q > .6 ? 3 : 2]); } } for (let j = 3; j < 60; j += 4) R(x + 6, e + j, 92, 1, BRICK[1]);
  for (const c of [x + 6, x + 94]) { R(c, e, 4, 60, WOOD[1]); R(c, e, 1, 60, WOOD[3]); R(c + 3, e, 1, 60, WOOD[0]); } R(x + 6, e, 92, 5, SH); R(x + 90, e, 4, 60, 'rgba(26,20,70,.25)');
  for (let i = 0; i < 12; i++) { const X = x + 4 + i * 8; R(X, gy - 7, 8, 7, STONE[2]); R(X, gy - 7, 7, 1, STONE[4]); R(X, gy - 7, 1, 6, STONE[3]); R(X + 7, gy - 7, 1, 7, STONE[0]); R(X, gy - 1, 8, 1, STONE[1]); }
  // the roof under the snow
  const rh = 32; for (let j = 0; j < rh; j++) { const y = e - j, a = x - 2 + Math.round(j * .62), b = x + 106 - Math.round(j * .62); for (let X = a; X < b; X++) { const v = Math.sin(X * .16 + j * .1) + Math.sin(X * .05 - j * .22), bare = j > 2 && j < rh - 5 && v > 1.15, k = 3.2 - (X - x) / 70 + Math.sin(X * .11 + j * .35) * .5 + (j > rh - 4 ? .8 : 0); R(X, y, 1, 1, bare ? (j % 5 === 0 || (X + (Math.floor(j / 5) % 2) * 4) % 8 === 0 ? '#4a3560' : '#6d4a6e') : SNOW[clamp(Math.floor(k + dith(X, y)), 1, 4)]); } R(a, y, 1, 1, SNOW[4]); R(b - 1, y, 1, 1, SNOW[1]); }
  R(x - 2, e + 1, 108, 3, WOOD[1]); R(x - 2, e + 1, 108, 1, WOOD[2]); R(x - 2, e + 3, 108, 1, WOOD[0]); snowTop(x - 3, e + 1, 110, 4, 5); icicles(x - 2, e + 4, 108, x + 3, 7);
  // the chimney
  const cx = x + chim, cy = e - 42; R(cx, cy, 13, 26, BRICK[2]); R(cx, cy, 2, 26, BRICK[3]); R(cx + 10, cy, 3, 26, BRICK[0]); for (let j = 2; j < 26; j += 4) { R(cx, cy + j, 13, 1, BRICK[1]); R(cx + 3 + (j % 8 ? 4 : 0), cy + 1 + j, 1, 3, BRICK[1]); } R(cx - 2, cy - 3, 17, 4, BRICK[1]); R(cx - 2, cy - 3, 17, 1, BRICK[3]); snowTop(cx - 2, cy - 3, 17, 4, 2); snowTop(cx - 2, e - 16, 17, 3, 6); L.smoke = [cx + 6, cy - 7];
  // the dormer with a round window
  for (let j = 0; j < 13; j++) R(x + 30 - j, e - 24 + j, 2 + j * 2, 1, WOOD[j < 2 ? 3 : 2]); R(x + 18, e - 11, 26, 8, WOOD[2]); R(x + 18, e - 11, 1, 8, WOOD[4]); R(x + 42, e - 11, 2, 8, WOOD[0]); for (let j = 0; j < 15; j++) { R(x + 29 - j, e - 26 + j, 3, 2, SNOW[4]); R(x + 31 + j, e - 26 + j, 3, 2, SNOW[2]); R(x + 29 - j, e - 24 + j, 2, 1, SNOW[2]); } ball(x + 31, e - 11, 6, WOOD); L.round = [x + 31, e - 11]; ball(x + 31, e - 11, 4, ['#1c1848', '#221c50', '#2a2352', '#332a60', '#4a4080']);
  // the sign
  R(x + 9, e - 1, 56, 14, SH); R(x + 8, e - 2, 56, 13, WOOD[2]); R(x + 8, e - 2, 56, 1, WOOD[4]); R(x + 8, e + 10, 56, 1, WOOD[0]); R(x + 8, e - 2, 1, 13, WOOD[3]); R(x + 63, e - 2, 1, 13, WOOD[0]); R(x + 11, e + 9, 40, 1, WOOD[1]); const sx = x + 36 - (tw('ПЕКАРНЯ') >> 1); text('ПЕКАРНЯ', sx, e + 1, WOOD[0]); text('ПЕКАРНЯ', sx, e, '#ffe9b8'); snowTop(x + 7, e - 2, 58, 3, 8);
  // the awning, the frame of the window
  for (let i = 0; i < 52; i++) { const c = Math.floor(i / 4) % 2 ? RED : SNOW, t = i % 4; R(x + 9 + i, e + 13, 1, 5, c[t === 0 ? 4 : t === 3 ? 2 : 3]); R(x + 9 + i, e + 17, 1, t === 0 || t === 3 ? 1 : 2, c[1]); } snowTop(x + 9, e + 13, 52, 2, 3);
  const [wx, wy, ww, wh] = L.win; R(wx - 3, wy - 2, ww + 6, wh + 5, WOOD[1]); R(wx - 3, wy - 2, 1, wh + 5, WOOD[3]); R(wx + ww + 2, wy - 2, 1, wh + 5, WOOD[0]); R(wx - 1, wy - 1, ww + 2, wh + 2, WOOD[0]); R(wx, wy, ww, wh, '#2a2352'); for (let i = 0; i < 10; i++) R(wx + 6 + i, wy + 14 - i, 2, 1, '#3f3a76');
  // the door
  R(x + 66, gy - 42, 24, 42, WOOD[0]); R(x + 67, gy - 41, 22, 41, WOOD[1]); R(x + 67, gy - 41, 1, 41, WOOD[3]); R(x + 69, gy - 39, 18, 39, GREEN[1]); R(x + 69, gy - 39, 1, 39, GREEN[3]); R(x + 86, gy - 39, 1, 39, GREEN[0]); for (const X of [x + 74, x + 81]) R(X, gy - 39, 1, 39, GREEN[0]); R(x + 71, gy - 12, 14, 8, GREEN[0]); R(x + 72, gy - 11, 13, 7, GREEN[2]); R(x + 72, gy - 11, 13, 1, GREEN[3]); R(x + 84, gy - 19, 2, 4, GOLD[3]); R(x + 84, gy - 19, 1, 1, GOLD[4]); L.door = [x + 72, gy - 37, 12, 10]; R(x + 71, gy - 38, 14, 12, WOOD[0]); R(x + 72, gy - 37, 12, 10, '#2a2352'); snowTop(x + 65, gy - 42, 26, 3, 4);
  R(x + 62, gy - 3, 32, 4, STONE[2]); R(x + 62, gy - 3, 32, 1, STONE[4]); R(x + 62, gy, 32, 1, STONE[0]); snowTop(x + 62, gy - 3, 32, 2, 7); wreath(x + 78, gy - 21, 5);
  L.bulbs = wire(x - 2, e + 5, x + 52, e + 5, 6, 9).concat(wire(x + 52, e + 5, x + 106, e + 5, 6, 9)); return L;
}
function windowBake(L, cx) {
  const [x, y, w, h] = L.win, [room, rg] = cv(w + 8, h + 8), [fr, fg] = cv(w + 8, h + 8); rg.translate(4 - x, 4 - y); fg.translate(4 - x, 4 - y);
  on(rg, () => { R(x, y, w, h, WARM[2]); R(x, y, w, 8, WARM[3]); R(x + 8, y, w - 20, 5, WARM[4]); R(x, y + h - 9, w, 9, WARM[1]); R(x, y, 3, h, WARM[1]); R(x + w - 3, y, 3, h, WARM[1]);
    for (const [a, b, l] of [[0, 9, 10], [w - 12, 9, 12], [0, 19, 8], [w - 11, 19, 11]]) R(x + a, y + b, l, 1, WOOD[1]);
    for (const [a, b, c] of [[1, 6, DOUGH], [6, 6, RED], [w - 11, 6, DOUGH], [w - 5, 6, GREEN], [1, 16, RED], [w - 10, 16, GREEN], [w - 5, 16, DOUGH]]) { R(x + a, y + b, 4, 3, c[2]); R(x + a, y + b, 4, 1, c[4]); R(x + a + 3, y + b, 1, 3, c[1]); } });
  on(fg, () => { R(x, y + h - 4, w, 4, WOOD[2]); R(x, y + h - 4, w, 1, WOOD[4]); for (const [a, c] of [[3, DOUGH], [9, RED], [w - 14, DOUGH], [w - 7, GOLD]]) ball(x + a + 2, y + h - 5, 2, c);
    R(x + cx + 11, y, 1, h, WOOD[1]); R(x + cx - 28 > x + 3 ? x + cx - 28 : x + 4, y, 1, h, WOOD[1]); R(x, y, w, 1, WOOD[0]);
    for (const s of [0, 1]) for (const [a, b] of [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [0, 2], [0, h - 1], [1, h - 1], [2, h - 1], [3, h - 1], [0, h - 2], [1, h - 2], [0, h - 3]]) R(s ? x + w - 1 - a : x + a, y + b, 1, 1, SNOW[3]);
    snowTop(x - 3, y + h + 1, w + 6, 2, 4); });
  L.room = room; L.frame = fr; L.cx = cx;
}
function windowLit(L, k, im) { const [x, y, w, h] = L.win; G.globalAlpha = k; G.drawImage(L.room, x - 4, y - 4); if (ready(im)) { G.save(); G.beginPath(); G.rect(x, y, w, h - 4); G.clip(); G.drawImage(im, x + L.cx - 30, y - 4); cookHat(x + L.cx - 30, y - 4); G.restore(); } G.drawImage(L.frame, x - 4, y - 4); G.globalAlpha = 1; }
// the gingerbread house: dough, icing, sweets
function ginger(x, gy) {
  const L = { win: [x + 13, gy - 35, 44, 30], bulbs: [] }, e = gy - 46; for (let j = 0; j < 46; j++) for (let i = 0; i < 86; i++) R(x + 8 + i, e + j, 1, 1, DOUGH[clamp(Math.round(2.4 - i / 60 + (rnd(i * 5.1 + j * 3.3) - .5) * .9 - (j < 6 ? 1 : 0)), 0, 3)]);
  for (const c of [x + 8, x + 90]) for (let j = 0; j < 46; j++) for (let k = 0; k < 4; k++) R(c + k, e + j, 1, 1, (j + k * 2) % 6 < 3 ? RED[k ? 3 - k : 4] : SNOW[4 - k]);
  const rh = 44; for (let j = 0; j < rh; j++) { const a = x + Math.round(j * 1.13) - 2, b = x + 104 - Math.round(j * 1.13); for (let X = a; X < b; X++) { const row = Math.floor(j / 6), tx = (X + row * 5) % 10, ty = j % 6; R(X, e - j, 1, 1, ty === 0 ? ICING[2] : tx === 0 ? DOUGH[0] : DOUGH[clamp(3 - Math.floor((X - x) / 40) - (ty === 1 ? 1 : 0), 0, 3)]); } }
  for (let j = 0; j < rh + 2; j++) { const a = x + Math.round(j * 1.13) - 4, b = x + 101 - Math.round(j * 1.13), q = Math.round(Math.sin(j * .7)); R(a, e - j, 5 + q, 1, ICING[3]); R(a, e - j, 1, 1, ICING[4]); R(a + 4 + q, e - j, 1, 1, ICING[1]); R(b - q, e - j, 5 + q, 1, ICING[2]); R(b + 4, e - j, 1, 1, ICING[0]); }
  for (let i = 0; i < 7; i++) { const c = ramp(['#ff5f7a', '#ffd84a', '#5fd88a', '#59b8ff', '#c07aff'][i % 5]); ball(x - 1 + Math.round(i * 7.1), e - 1 - Math.round(i * 6.3), 2, c); ball(x + 104 - Math.round(i * 7.1), e - 1 - Math.round(i * 6.3), 2, c); }
  for (let i = 0; i < 108; i++) { const h = 3 + Math.round(Math.abs(Math.sin(i * .28)) * 4 + Math.sin(i * .9)); R(x - 4 + i, e, 1, h, ICING[3]); R(x - 4 + i, e, 1, 1, ICING[4]); R(x - 4 + i, e + h - 1, 1, 1, ICING[1]); }
  ball(x + 51, e - 19, 8, ramp('#ff8fa8')); for (let a = 0; a < 46; a++) R(x + 51 + Math.cos(a * .42) * a * .15, e - 19 + Math.sin(a * .42) * a * .15, 1, 1, '#fff6f2'); ball(x + 51, e - rh - 1, 4, RED); R(x + 49, e - rh - 3, 2, 1, RED[4]);
  for (let j = 0; j < 22; j++) R(x + 76, e - 40 + j, 10, 1, j % 6 < 3 ? RED[2] : SNOW[3]); R(x + 76, e - 40, 2, 22, 'rgba(255,255,255,.4)'); R(x + 83, e - 40, 3, 22, 'rgba(40,20,90,.35)'); R(x + 74, e - 42, 14, 3, ICING[3]); R(x + 74, e - 42, 14, 1, ICING[4]); R(x + 75, e - 39, 2, 2, ICING[2]); R(x + 82, e - 39, 2, 3, ICING[2]); L.smoke = [x + 81, e - 46];
  const [wx, wy, ww, wh] = L.win; R(wx - 3, wy - 3, ww + 6, wh + 6, ICING[2]); R(wx - 3, wy - 3, ww + 6, 1, ICING[4]); R(wx + ww + 2, wy - 3, 1, wh + 6, ICING[0]); for (let i = 0; i < ww + 4; i += 6) ball(wx - 1 + i, wy - 3, 1.5, ramp(LAMPS[(i / 6) % 5])); R(wx, wy, ww, wh, '#3a2352');
  R(x + 64, gy - 34, 22, 34, ICING[2]); R(x + 64, gy - 34, 22, 1, ICING[4]); R(x + 66, gy - 32, 18, 32, CHOC[2]); R(x + 66, gy - 32, 2, 32, CHOC[4]); for (const j of [gy - 30, gy - 16]) { R(x + 69, j, 13, 12, CHOC[1]); R(x + 70, j + 1, 12, 11, CHOC[3]); R(x + 70, j + 1, 11, 10, CHOC[2]); } ball(x + 82, gy - 16, 1.5, GOLD); wreath(x + 75, gy - 25, 4); for (let i = 0; i < 30; i++) { R(x + 60 + i, gy - 3, 1, 4, ICING[3]); R(x + 60 + i, gy - 3, 1, 1, ICING[4]); }
  L.bulbs = wire(x - 2, e + 7, x + 50, e + 7, 4, 8, '#7a3a5a').concat(wire(x + 50, e + 7, x + 104, e + 7, 4, 8, '#7a3a5a')); return L;
}
function lolly(x, base, h, r, c) { R(x, base - h, 2, h, SNOW[3]); R(x, base - h, 1, h, SNOW[4]); R(x + 1, base - h, 1, h, SNOW[1]); ball(x + 1, base - h, r, ramp(c)); for (let a = 0; a < r * 7; a++) R(x + 1 + Math.cos(a * .4) * a / 7.6, base - h + Math.sin(a * .4) * a / 7.6, 1, 1, '#fff6f2'); R(x - 2, base - h + r, 6, 2, RED[2]); R(x, base - h + r, 2, 2, RED[4]); }
function gum(x, base, r, c) { ball(x, base - r + 1, r, ramp(c)); for (let i = 0; i < r * 3; i++) R(x - r + 1 + rnd(i + x) * (r * 2 - 2), base - r * 1.6 + rnd(i * 3 + x) * r * 1.4, 1, 1, 'rgba(255,255,255,.6)'); R(x - r, base + 1, r * 2, 1, 'rgba(60,30,110,.35)'); }
window.SK = { ready, R, P: { SNOW, RED, GREEN, GOLD, WOOD, BRICK, STONE, DOUGH, ICING, IRON, WARM }, LAMPS, mix, ramp, clamp, lerp, rnd, cv, on, dith, grad, ball, pool, put, text, tw, snowTop, icicles, drift, stars, moon, ridge, fir, hut, bigTree, star, snowman, gift, cane, man, lamp, lampLit, wreath, wire, bulb, branch, bauble, sled, hat, bonya, cookHat, puff, bakery, windowBake, windowLit, ginger, lolly, gum, get g() { return G; } };
})();
// three scenes: A the street, B the kitchen, C the gingerbread house. make(variant, layout, A).draw(g, el): el = seconds from the start, 0..2.5
(() => {
const { ready, R, P, LAMPS, mix, ramp, clamp, lerp, rnd, cv, on, dith, grad, ball, pool, put, text, tw, snowTop, icicles, drift, stars, moon, ridge, fir, hut, bigTree, star, snowman, gift, cane, man, lamp, lampLit, wreath, wire, bulb, branch, bauble, sled, hat, bonya, cookHat, puff, bakery, windowBake, windowLit, ginger, lolly, gum } = SK;
const { SNOW, RED, GREEN, GOLD, WOOD, ICING } = P, T = 2.5, TAU = Math.PI * 2;
const up = (el, t0, d = .25) => clamp((el - t0) / d);
function flakes(n, w, h, v, size, col, seed) {
  const a = []; for (let i = 0; i < n; i++) a.push([rnd(i + seed) * w, rnd(i * 2.7 + seed) * h, v * (.8 + rnd(i * 5.1) * .4), rnd(i * 9) * TAU]);
  return (t) => { const g = SK.g, at = (f) => [Math.round((f[0] + Math.sin(t * 1.4 + f[3]) * 3 + t * v * .22) % w), Math.round((f[1] + f[2] * t) % (h + 8)) - 4];
    for (let q = 0; q < col.length; q++) { g.fillStyle = col[q]; for (let i = q; i < n; i += col.length) { const [x, y] = at(a[i]); if (size === 3) { g.fillRect(x, y - 1, 1, 3); g.fillRect(x - 1, y, 3, 1); } else if (size === 4) { g.fillRect(x - 2, y, 5, 1); g.fillRect(x, y - 2, 1, 5); g.fillRect(x - 1, y - 1, 3, 3); } else g.fillRect(x, y, size, size); } } };
}
// the letters of the title: the colour of the game, an edge, a frosty shine, a snow cap with drops
function letters(lines, sc, accent) {
  const p = ramp(accent), out = [];
  for (const [s, x0, y0] of lines) { let x = x0; for (const ch of s) { const G = ch !== ' ' && FONT[ch], w = G ? G.rows[0].length : 3; if (G) {
    const [c, g] = cv(w * sc + 8, 8 * sc + 14); on(g, () => {
      const at = (i, j) => j >= 0 && j < 8 && G.rows[j][i] === '#', ox = 4, oy = 6;
      for (const [dx, dy, q] of [[0, 3, '#0c0a26'], [1, 3, '#0c0a26'], [-1, 3, '#0c0a26'], [2, 2, '#0c0a26'], [-2, 0, '#1b1746'], [2, 0, '#1b1746'], [0, -2, '#1b1746'], [0, 2, '#1b1746'], [-1, -1, '#1b1746'], [1, -1, '#1b1746'], [-2, 1, '#1b1746'], [2, 1, '#1b1746'], [1, 2, '#1b1746'], [-1, 2, '#1b1746'], [-2, 2, '#1b1746']]) for (let j = 0; j < 8; j++) for (let i = 0; i < w; i++) if (at(i, j)) R(ox + i * sc + dx, oy + j * sc + dy, sc, sc, q);
      for (let j = 0; j < 8 * sc; j++) for (let i = 0; i < w * sc; i++) { const gi = Math.floor(i / sc), gj = Math.floor(j / sc); if (!at(gi, gj)) continue; let k = 3.6 - j / (8 * sc) * 2.5 + (dith(i, j) - .5) * .5; if (i % sc === 0 && !at(gi - 1, gj)) k += 1; if (i % sc === sc - 1 && !at(gi + 1, gj)) k -= 1; if (j % sc === sc - 1 && !at(gi, gj + 1)) k -= 1; R(ox + i, oy + j, 1, 1, rnd(i * 3 + j * 11 + x) > .94 ? '#ffffff' : p[clamp(Math.round(k), 0, 4)]); }
      for (let i = 0; i < w * sc; i++) { const gi = Math.floor(i / sc); let top = 0; while (top < 8 && !at(gi, top)) top++; if (top > 1) continue; const l = at(gi - 1, top) || i % sc, r = at(gi + 1, top) || i % sc < sc - 1, h = (l && r ? 2 : 1) + (Math.sin((i + x) * .8) > .3 ? 1 : 0); R(ox + i, oy + top * sc - h + 1, 1, h, SNOW[3]); R(ox + i, oy + top * sc - h + 1, 1, 1, '#ffffff'); R(ox + i, oy + top * sc + 1, 1, 1, SNOW[2]); if (rnd(i * 7 + x) > .74) { const dl = 1 + Math.floor(rnd(i + x) * sc); R(ox + i, oy + top * sc + 2, 1, dl, SNOW[3]); } if (!l) R(ox + i - 1, oy + top * sc, 1, 1, SNOW[3]); if (!r) R(ox + i + 1, oy + top * sc, 1, 1, SNOW[1]); }
      for (let i = 1; i < w * sc - 1; i++) if (at(Math.floor(i / sc), 7) && rnd(i * 3.7 + x) > .72) { const l = 2 + Math.floor(rnd(i + x * 2) * 3); R(ox + i, oy + 8 * sc, 1, l, '#cfe6ff'); R(ox + i, oy + 8 * sc, 1, 1, '#ffffff'); }
    }); out.push([c, x - 4, y0 - 6]); } else out.push(null); x += (w + 1) * sc; } }
  return out;
}
function make(variant, layout, A) {
  const ph = layout === 'phone', W = ph ? 180 : 320, H = ph ? 320 : 180, cx = W >> 1, accent = A.accent || '#ffd84a';
  const [backC, backG] = cv(W, H), [midC, midG] = cv(W, H), [foreC, foreG] = cv(W, H), [darkC, darkG] = cv(W, H);
  const big = variant === 'C', LS = big ? 148 : 74;
  let late = null, L = {}, tree = null, huts = [], lamps = [], extra = null, glows = [], smokeA = null, sm = null, logo, title, devY, bar, snowFar, snowMid, snowNear, snowClose, bon = null, men = [], cookAt = null, shine = [];
  const dark = '#0c0a26';
  // where the words, the cookie and the bar are
  if (!ph) { title = [['КУЧА ПРЯНИКОВ', cx - (tw('КУЧА ПРЯНИКОВ', 2) >> 1), big ? 119 : 8]]; logo = big ? [cx - 74, 1] : [cx - 37, 42]; devY = big ? 140 : 28; bar = [cx - 62, big ? 164 : 165, 124]; }
  else { title = [['КУЧА', cx - (tw('КУЧА', 3) >> 1), 12], ['ПРЯНИКОВ', cx - (tw('ПРЯНИКОВ', 3) >> 1), 44]]; logo = big ? [cx - 74, 71] : [cx - 37, 92]; devY = big ? 279 : 75; bar = [cx - 62, 303, 124]; }
  const word = letters(title, ph ? 3 : 2, accent);

  if (variant === 'A') {
    const gy = ph ? 244 : 140, hz = ph ? 218 : 122;
    on(backG, () => {
      grad(0, 0, W, hz + 10, ['#0b0f3a', '#141a55', '#23267a', '#3a3798', '#5c4cae', '#8a66b8', '#b482b4']);
      for (let x = 0; x < W; x++) { const f = Math.sin(x * .03 + 1) * 9 + Math.sin(x * .011) * 10, y0 = (ph ? 112 : 58) + f, l = 18 + Math.sin(x * .13) * 7; for (let j = 0; j < l; j++) if (dith(x, y0 + j | 0) < .34 * (1 - j / l) * (.6 + .4 * Math.sin(x * .09))) R(x, y0 + j, 1, 1, j < 5 ? '#6fe0c0' : j < 11 ? '#4aa8c8' : '#5a6ad0'); }
      stars(W, hz - 20, ph ? 150 : 170); moon(ph ? 154 : 220, ph ? 106 : 56, 13);
      ridge(W, hz - 2, ph ? 42 : 34, 1.4, ['#3d3f8e', '#4d52a4', '#7f88cc', '#a6b2e6', '#d6def8'], hz + 12);
      ridge(W, hz + 4, ph ? 22 : 17, 4.1, ['#333a86', '#424a9a', '#6a78c0', '#92a4de', '#c2d2f4'], hz + 12);
      for (let i = 0; i < W / 4; i++) fir(i * 4 + rnd(i) * 3, hz + 6 + Math.sin(i * .4) * 2, 8 + rnd(i * 3) * 8, ['#262a6c', '#303a82', '#3f4e98', '#7388cc', '#a4b8ea']);
    });
    on(midG, () => {
      drift(0, W, H, (x) => hz + 7 + Math.sin(x * .03 + 2) * 3, ['#46559e', '#6a80c4', '#8ea6de', '#b4c8f0', '#dfe9ff'], 2);
      for (const [x, b, w, h] of ph ? [[112, 220, 11, 7], [160, 222, 13, 8], [98, 224, 8, 6]] : [[118, 127, 12, 7], [136, 130, 10, 6], [166, 127, 13, 8], [186, 131, 9, 6], [207, 128, 11, 7]]) hut(x, b, w, h, huts);
      for (const [x, b, h] of ph ? [[128, 228, 20], [174, 236, 26], [104, 232, 16]] : [[112, 136, 22], [153, 132, 16], [200, 137, 20], [316, 142, 34], [224, 136, 18]]) fir(x, b, h, ['#173a52', '#20525e', '#2f7266', SNOW[2], SNOW[4]]);
      drift(0, W, H, (x) => gy - 1 + Math.sin(x * .025 + .5) * 2.5 - (x > W * .6 ? (x - W * .6) * .03 : 0), SNOW, 1);
      // the fence with snow
      const fx0 = ph ? 108 : 106, fx1 = ph ? 180 : 232, fy = gy + 2; for (let x = fx0; x < fx1; x += 7) { const y = fy + Math.round(Math.sin(x * .05) * 2); R(x, y - 9, 3, 10, WOOD[2]); R(x, y - 9, 1, 10, WOOD[4]); R(x + 2, y - 9, 1, 10, WOOD[0]); R(x - 1, y - 11, 5, 2, SNOW[3]); R(x, y - 12, 3, 1, SNOW[4]); R(x + 3, y - 6, 4, 2, WOOD[1]); R(x + 3, y - 7, 4, 1, SNOW[3]); R(x + 3, y - 2, 4, 1, WOOD[1]); }
      L = bakery(2, gy, ph ? 5 : 78); smokeA = L.smoke;
      tree = bigTree(ph ? 146 : 258, ph ? 264 : 152, ph ? 108 : 112, { wide: ph ? .3 : .35 });
      drift(0, W, H, (x) => gy + (ph ? 26 : 14) + Math.sin(x * .032) * 3 + Math.sin(x * .011 + 2) * 4, SNOW, 3);
      // the swept way to the door, the footprints
      const dx = 80; for (let j = 0; j < (ph ? 30 : 17); j++) { const w = 9 + j * .6, x = dx + j * (ph ? .5 : 1.2) + Math.sin(j * .3) * 2; R(x - w, gy + j, w * 2, 1, j % 5 === 4 ? '#a7b7e4' : '#c3d0f0'); R(x - w, gy + j, 2, 1, SNOW[4]); R(x + w - 1, gy + j, 1, 1, SNOW[1]); if (j % 4 === 2) R(x - 3 + (j % 8 ? 4 : 0), gy + j, 2, 1, SNOW[0]); }
      lamps.push(lamp(ph ? 106 : 207, ph ? 256 : 152, ph ? 40 : 46));
      const t = tree.star[0], b = ph ? 268 : 157; gift(t - 26, b, 13, 10, '#d0323e', '#ffd84a'); gift(t + 12, b - 1, 11, 13, '#4d8fe0', '#fff2cc'); gift(t - 9, b + 4, 16, 8, '#7a4ac0', '#5fe07a'); gift(t + 25, b + 3, 9, 8, '#2f9a6a', '#ff7f9a');
      snowman(ph ? 20 : 307, ph ? 282 : 162);
      drift(0, W, H, (x) => (ph ? 284 : 163) + Math.sin(x * .04 + 1) * 3 + Math.sin(x * .09) * 1.2, ['#5a6cb4', '#86a0da', '#a9c2ee', '#cfe0fb', '#fffdf2'], 5);
      for (let i = 0; i < 60; i++) R(rnd(i) * W, gy + 6 + rnd(i * 3) * (H - gy), 1, 1, SNOW[4]);
    });
    bon = ph ? [62, 252] : [130, 124]; men = [];
    glows = [[pool(54, 18, '#ffb054', .55), ph ? 35 : 37, gy + 8, .35], [pool(34, 30, '#ffb054', .38), ph ? 37 : 37, gy - 26, .35], [pool(38, 38, '#ffd98a', .5), lamps[0][0], lamps[0][1], .7], [pool(40, 12, '#ffd98a', .5), lamps[0][0], ph ? 258 : 154, .7], [pool(50, 16, '#ffcf7a', .34), tree.star[0], ph ? 264 : 155, 1.2]];
    extra = { sled: ph ? 86 : 40, moon: [ph ? 154 : 220, ph ? 106 : 56] };
  } else if (variant === 'B') {
    const oy = ph ? 118 : 0, ox = ph ? -70 : 0, im = A.kit;
    // the room itself is a picture: it is painted when it has loaded
    late = () => { if (!ready(im)) { backG.fillStyle = '#4a3350'; backG.fillRect(0, 0, W, H); return; } late = null;
      if (ph) { for (let y = 0; y < oy; y++) backG.drawImage(im, 70, y % 16, 180, 1, 0, y, 180, 1); backG.drawImage(im, 70, 0, 180, 180, 0, oy, 180, 180); for (let y = 298; y < 320; y++) backG.drawImage(im, 70, 168 + (y % 6), 180, 1, 0, y, 180, 1); }
      else backG.drawImage(im, 0, 0); };
    on(midG, () => {
      // the beam under the ceiling with garlands of fir
      R(0, 0, W, 4, WOOD[1]); R(0, 3, W, 1, WOOD[0]); for (let i = 0; i < W; i += 23) R(i, 1, 14, 1, WOOD[2]);
      const seg = ph ? 60 : 64; for (let s = 0; s * seg < W; s++) for (let i = 0; i <= seg; i++) { const x = s * seg + i, y = 2 + Math.round(Math.sin(i / seg * Math.PI) * 7); for (let k = -2; k <= 2; k++) { R(x, y + k + (i % 3) - 1, 1, 1, GREEN[clamp(2 - k + (x * 7 % 3) - 1, 0, 4)]); } if (i % 11 === 5) R(x, y + 2, 2, 2, i % 2 ? RED[2] : GOLD[3]); }
      for (let s = 0; s <= W / seg; s++) { const x = s * seg; R(x - 4, 3, 4, 4, RED[2]); R(x + 1, 3, 4, 4, RED[1]); R(x - 4, 3, 3, 1, RED[4]); R(x + 1, 3, 3, 1, RED[3]); R(x - 1, 4, 2, 3, RED[4]); R(x - 2, 7, 2, 5, RED[2]); R(x + 1, 7, 2, 6, RED[1]); ball(x, 9, 1.5, GOLD); }
      // tinsel along the border of the tiles, stockings, the window in lamps
      const ty = oy + 79; for (let x = 0; x < W; x++) { const y = ty + Math.round(Math.abs(Math.sin(x * .098)) * -4 + 3); R(x, y, 1, 2, GOLD[x % 4]); R(x, y - 1, 1, 1, GOLD[(x * 3) % 5]); if (x % 3 === 0) R(x, y + 2, 1, 2, GOLD[(x >> 1) % 4]); }
      const wn = ph ? [125, oy + 24, 53, 42] : [193, 22, 120, 45]; L.winB = ph ? [133, oy + 29, 36, 33] : [200, 27, 103, 34];
      L.bulbs = wire(wn[0], wn[1], wn[0] + (wn[2] >> 1), wn[1], 6, ph ? 5 : 9).concat(wire(wn[0] + (wn[2] >> 1), wn[1], wn[0] + wn[2], wn[1], 6, ph ? 5 : 9));
      for (const [i, c] of [[0, RED], [1, GREEN], [2, RED]]) { const x = (ph ? 24 : 100) + i * 11, y = oy + 130; R(x, y, 6, 8, c[2]); R(x, y, 1, 8, c[4]); R(x + 5, y, 1, 8, c[1]); R(x, y + 7, 9, 4, c[2]); R(x + 1, y + 10, 8, 1, c[0]); R(x - 1, y - 2, 8, 3, '#fffdf2'); R(x - 1, y, 8, 1, '#b8c2e6'); R(x + 7, y + 8, 2, 2, c[4]); R(x + 2, y + 4, 2, 2, GOLD[3]); }
      wreath(ph ? 33 : 49, ph ? oy + 60 : 52, 5); if (ph) { L.bulbs = wire(-6, oy - 40, 90, oy - 40, 16, 12).concat(wire(90, oy - 40, 186, oy - 40, 16, 12), L.bulbs); } else wreath(286, 96, 4);
      // a garland over the stove and the hood
      L.bulbs = L.bulbs.concat(wire(ph ? -28 : 42, oy + 86, ph ? 20 : 90, oy + 86, 5, 8));
      tree = bigTree(ph ? 116 : 190, oy + 160, ph ? 76 : 66, { wide: .34, snow: 0 });
      const t = tree.star[0], b = oy + 164; gift(t - 22, b, 12, 9, '#4d8fe0', '#fff2cc'); gift(t + 9, b - 2, 11, 12, '#d0323e', '#ffd84a'); gift(t - 6, b + 2, 15, 7, '#2f9a6a', '#ff8fa8');
      // the counter: gingerbread men on a plate, a candle, a cane jar
      const cy = ph ? 290 : 168, pX = ph ? 16 : 24; R(pX - 4, cy + 1, 42, 2, '#cfd6ee'); R(pX - 2, cy + 3, 38, 1, '#8a92c0'); man(pX, cy + 2); man(pX + 12, cy + 2); man(pX + 23, cy + 2);
      const jx = ph ? 150 : 63; for (let i = 0; i < 3; i++) cane(jx + i * 5, cy - 2, 20 + i % 2 * 3); R(jx - 2, cy - 11, 18, 14, 'rgba(190,220,255,.45)'); R(jx - 2, cy - 11, 1, 14, '#ffffff'); R(jx + 15, cy - 11, 1, 14, '#7a8cc8'); R(jx - 2, cy + 2, 18, 1, '#8fa0d8'); R(jx - 2, cy - 7, 18, 2, RED[2]); R(jx - 2, cy - 7, 18, 1, RED[4]);
      extra = { candles: ph ? [[7, cy - 3], [136, cy - 3]] : [[12, cy - 3], [88, cy - 3]], flakes: ph ? [[12, 30, 9], [168, 34, 9], [8, 84, 6], [172, 88, 6], [150, 22, 5]] : [[16, 24, 8], [44, 14, 6], [110, 50, 6], [262, 14, 5], [302, 14, 7]], crop: [ph ? 20 : 88, oy + 122, ph ? 122 : 124, 17] };
      for (const [x, y] of extra.candles) { R(x - 2, y - 8, 5, 12, '#f3e8e0'); R(x - 2, y - 8, 1, 12, '#ffffff'); R(x + 2, y - 8, 1, 12, '#b8a2c8'); R(x - 4, y + 3, 9, 2, GOLD[2]); R(x - 4, y + 3, 9, 1, GOLD[4]); R(x - 1, y - 6, 1, 4, '#ffffff'); R(x, y - 10, 1, 2, '#3a2438'); for (let k = 0; k < 4; k++) R(x - 4 + k * 3, y + 1, 2, 2, GREEN[1 + k % 2]); R(x - 2, y + 2, 1, 1, RED[3]); R(x + 3, y + 2, 1, 1, RED[3]); }
    });
    // frost in the corners of the screen
    on(foreG, () => { for (const [X, Y, sx, sy] of [[0, H, 1, -1], [W - 1, H, -1, -1]]) for (let i = 0; i < 60; i++) for (let j = 0; j < 46; j++) { const d = i / 60 + j / 46, n = Math.sin(i * .7 + j * .3) * .12 + Math.sin(i * .23 - j * .6) * .12 + rnd(i * 3 + j * 17) * .22; if (d + n < .52) R(X + sx * i, Y + sy * j - 1, 1, 1, rnd(i + j * 9) > .55 ? 'rgba(226,240,255,.75)' : 'rgba(160,190,240,.4)'); } });
    bon = ph ? [46, oy + 124] : [130, 126]; cookAt = ph ? [4, oy + 77] : [82, 77];
    glows = [[pool(46, 46, '#ffb868', .3), tree.star[0], tree.star[1] + 36, .9]].concat(extra.candles.map((c) => [pool(22, 22, '#ffb054', .55), c[0], c[1] - 11, .4]));
  } else {
    const gy = ph ? 262 : 138, hz = ph ? 228 : 120, icing = ['#8d7cc4', '#bba6e0', '#e2cdf0', '#fbe6f2', '#ffffff'];
    on(backG, () => {
      grad(0, 0, W, hz + 14, ['#2a1258', '#42197a', '#6a2a94', '#9a3fa4', '#cc5fae', '#ee8ab4', '#ffbcbe']);
      stars(W, hz * .7, 120); const mx = cx, my = ph ? 146 : 70, mr = ph ? 84 : 72; backG.globalAlpha = .28; backG.drawImage(pool(mr + 40, mr + 40, '#ffd9ea', .9), mx - mr - 40, my - mr - 40); backG.globalAlpha = 1; moon(mx, my, mr, ['#a870b8', '#d8a0cc', '#f4cbdc', '#fde6e2', '#fff8ec']);
      for (const [x, y, w] of ph ? [[4, 96, 30], [140, 120, 36], [10, 176, 26], [150, 196, 24]] : [[8, 50, 44], [250, 34, 46], [60, 84, 34], [226, 92, 30], [290, 70, 30]]) for (let k = 0; k < 5; k++) { const r = 4 + (k % 3) * 2; ball(x + k * w / 5, y - r / 2, r, ['#8a4aa8', '#b066bc', '#d68acc', '#f2b4dc', '#ffdcea']); }
      ridge(W, hz + 2, ph ? 34 : 28, 2.2, ['#7a3a52', '#96505a', '#c48a9a', '#f3cbd4', '#fff2f2'], hz + 14);
      for (let i = 0; i < W / 9; i++) lolly(i * 9 + rnd(i) * 4, hz + 12, 10 + rnd(i * 3) * 9, 3, ['#d86aa8', '#9a6ad0', '#6aa0e0', '#e8a05a'][i % 4]);
      for (let i = 0; i < W / 5; i++) fir(i * 5 + rnd(i) * 3, hz + 12, 6 + rnd(i * 7) * 7, ['#5a2a7a', '#74408e', '#9460a8', '#dcb2dc', '#ffe6f4']);
    });
    on(midG, () => {
      drift(0, W, H, (x) => hz + 11 + Math.sin(x * .04) * 3, ['#7a68b8', '#a490d4', '#ceb6e6', '#efd4ee', '#fff0f6'], 4);
      L = ginger(ph ? -10 : -8, gy); smokeA = L.smoke;
      tree = bigTree(ph ? 146 : 278, ph ? 272 : 148, ph ? 92 : 100, { wide: .33, pal: ramp('#3a9a74') });
      drift(0, W, H, (x) => gy - 1 + Math.sin(x * .03 + 1) * 3 + (ph ? 8 : 4), icing, 2);
      // the way of sweets, candy canes instead of lamps, sweets in the icing
      for (let j = 0; j < 34; j++) { const w = 8 + j * .7, x = (ph ? 64 : 68) + j * 1.5; for (let i = -w; i < w; i++) { const c = ['#ff9ab0', '#ffe28a', '#9ae0b4', '#9ac8ff', '#d8a8ff'][((Math.floor((i + j) / 4) + Math.floor(j / 3) * 2) % 5 + 5) % 5]; R(x + i, gy + 3 + j, 1, 1, (j % 3 === 2 || Math.floor(i + j) % 4 === 0) ? '#e8cfe6' : c); } }
      for (const [x, b, h] of ph ? [[88, 266, 30], [108, 284, 22]] : [[96, 152, 34], [214, 152, 34]]) cane(x, b, h);
      for (const [x, b, h, r, c] of ph ? [[172, 290, 22, 6, '#ff7fa8'], [12, 294, 22, 5, '#8a7aff']] : [[238, 154, 26, 6, '#ff7fa8'], [308, 166, 24, 6, '#8a7aff'], [112, 166, 18, 5, '#5fd8a0']]) lolly(x, b, h, r, c);
      const t = tree.star[0], b = ph ? 278 : 154; gift(t - 24, b, 13, 10, '#d0323e', '#fff2cc'); gift(t + 10, b, 12, 13, '#8a5ae0', '#ffd84a'); gift(t - 8, b + 4, 15, 8, '#3aa0d8', '#ff8fb0');
      drift(0, W, H, (x) => (ph ? 292 : 160) + Math.sin(x * .045) * 3, ['#9a8ad0', '#c2b0e6', '#e0ccf2', '#f6e2f6', '#ffffff'], 6);
      for (let i = 0; i < (ph ? 12 : 20); i++) gum(6 + rnd(i * 3) * (W - 12), (ph ? 296 : 168) + rnd(i * 7) * 18, 2 + (i % 3), ['#ff6a8a', '#ffd84a', '#5fd88a', '#59b8ff', '#c07aff'][i % 5]);
    });
    men = ph ? [[6, 317, 1], [163, 317, 1], [100, 278, 0]] : [[74, 170, 1], [236, 168, 1], [254, 174, 0], [56, 177, 0], [300, 172, 1]]; bon = ph ? [40, 238] : [2, 137];
    glows = [[pool(50, 16, '#ffb054', .55), ph ? 25 : 27, gy + 8, .35], [pool(32, 28, '#ffc07a', .4), ph ? 25 : 27, gy - 20, .35], [pool(46, 14, '#ffe09a', .4), tree.star[0], ph ? 274 : 152, 1.2]]; extra = { sled: ph ? 96 : 20 };
  }
  // fir branches with snow and baubles in the upper corners: the nearest plan
  if (variant !== 'B') on(foreG, () => { const l = ph ? 34 : 62, y = -3; branch(0, y, l, 1, 1); branch(W - 1, y, l, -1, 2.5); branch(0, y + (ph ? 6 : 10), l * .55, 1, 4); branch(W - 1, y + (ph ? 6 : 10), l * .55, -1, 5); });
  on(darkG, () => { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.max(Math.abs(x - cx) / cx, Math.abs(y - H / 2) / (H / 2)); const q = Math.floor(clamp((d - .86) / .14) * 4 + (dith(x, y) - .5) * .5); if (q > 0) R(x, y, 1, 1, `rgba(12,8,40,${(q * .07).toFixed(2)})`); } });
  const hang = variant === 'B' ? [] : ph ? [[8, 8, 7, 3, '#d0323e'], [172, 8, 9, 3, '#4d8fe0'], [22, 6, 12, 2, '#f0b83a'], [158, 6, 9, 2, '#d0323e']] : [[12, 12, 14, 5, '#d0323e'], [34, 12, 9, 4, '#f0b83a'], [306, 12, 16, 5, '#4d8fe0'], [284, 12, 9, 4, '#d0323e'], [54, 10, 6, 3, '#b45ad8']];
  const hangC = hang.map(([, , l, r, c]) => { const [q, g] = cv(r * 2 + 3, l + r * 2 + 2); on(g, () => bauble(r + 1, 0, l, r, c)); return q; });
  const sc = [['#7f92d8', '#a4b4ea'], ['#d6e2ff', '#ffffff'], ['#ffffff', '#e8f0ff'], ['#ffffff']], pink = variant === 'C';
  snowFar = flakes(ph ? 70 : 80, W, H, 12, 1, pink ? ['#d8a0dc', '#f0c4e4'] : sc[0], 1); snowMid = flakes(ph ? 46 : 54, W, H, 24, 1, sc[1], 5); snowNear = flakes(16, W, H, 40, 2, sc[2], 9); snowClose = flakes(variant === 'B' ? 5 : 8, W, H, 62, 3, sc[3], 13); sm = flakes(variant === 'B' ? 0 : 3, W, H, 80, 4, ['rgba(255,255,255,.85)'], 17);
  if (L.win) windowBake(L, variant === 'A' ? 29 : 28);
  // a wide halo behind the cookie: one picture, only its strength changes
  const halo = pool(big ? 96 : 60, big ? 96 : 60, '#ffdc78', .62), haloR = big ? 96 : 60;
  const [devC, devG] = cv(tw('РАЗРАБОТЧИК: CR4YNE') + 4, 14); on(devG, () => { for (const [a, b] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, 1], [0, 2], [-1, -1], [1, -1]]) text('РАЗРАБОТЧИК: CR4YNE', 2 + a, 3 + b, '#14103a'); text('РАЗРАБОТЧИК: CR4YNE', 2, 3, '#e2e6ff'); });
  const [bx, by, bw] = bar, [barC, barG] = cv(bw + 14, 24), [fillC, fillG] = cv(bw + 8, 12); barG.translate(7 - bx, 7 - by);
  on(barG, () => { const x = bx, y = by, w = bw;
    if (variant === 'A') { R(x - 3, y - 3, w + 6, 12, dark); R(x - 2, y - 2, w + 4, 10, '#4a5aa0'); R(x - 2, y + 7, w + 4, 1, '#2c3878'); R(x, y, w, 6, '#1b1746'); snowTop(x - 3, y - 2, w + 6, 3, 4); icicles(x - 2, y + 8, w + 4, 3, 2); }
    else if (variant === 'B') { R(x - 5, y - 4, w + 10, 13, dark); R(x - 4, y - 3, w + 8, 11, WOOD[1]); R(x - 4, y - 3, w + 8, 1, WOOD[4]); R(x - 4, y + 7, w + 8, 1, WOOD[0]); R(x - 2, y - 1, w + 4, 7, '#1b1746'); for (let i = 0; i < w; i++) R(x + i, y + 1 - Math.round(Math.abs(Math.sin(i / w * Math.PI * 9))), 1, 1, GREEN[1]); }
    else { R(x - 3, y, w + 6, 12, dark); R(x - 2, y + 1, w + 4, 10, P.DOUGH[1]); R(x - 2, y + 1, w + 4, 1, P.DOUGH[4]); R(x - 2, y + 10, w + 4, 1, P.DOUGH[0]); R(x, y + 3, w, 6, '#4a2030'); } });
  on(fillG, () => { for (let i = 0; i < bw + 8; i++) { if (variant === 'A') for (let j = 0; j < 6; j++) { const q = [4, 3, 2, 2, 1, 1][j]; R(i, j, 1, 1, (i + j) % 8 < 4 ? RED[q] : SNOW[Math.max(1, q)]); } else { R(i, 0, 1, 1, '#ffffff'); R(i, 1, 1, 3, ICING[3]); R(i, 4, 1, 1, ICING[1]); if (i % 5 < 2) R(i, 5, 1, 1, ICING[1]); if (i % 7 === 3) R(i, 2, 2, 1, ['#ff6a8a', '#ffb02a', '#3fb87a', '#4098e8'][(i / 7 | 0) % 4]); } } });
  const dim = LAMPS.map((c) => [mix(c, '#1b1746', .72), mix(c, '#1b1746', .4), mix(c, '#1b1746', .5)]);
  function drawBar(el) {
    const g = SK.g, p = Math.min(1, el / T), x = bx, y = by, f = Math.round(bw * p); g.drawImage(barC, x - 7, y - 7);
    if (variant === 'A') { if (f > 0) { g.drawImage(fillC, 7 - Math.floor(el * 10) % 8, 0, f, 6, x, y, f, 6); R(x + f - 1, y, 1, 6, '#ffffff'); } }   // a candy cane lying in the snow
    else if (variant === 'B') for (let i = 0, N = 18; i < N; i++) {   // the garland lights up lamp by lamp
      const lit = p >= (i + .6) / N, X = x + 2 + Math.round(i * (bw - 6) / (N - 1)), c = LAMPS[i % 5], d = dim[i % 5]; R(X, y, 3, 1, GOLD[lit ? 3 : 0]);
      if (lit) { R(X - 1, y + 1, 5, 4, d[2]); R(X, y + 1, 3, 4, c); R(X, y + 1, 1, 2, '#ffffff'); R(X + 1, y + 5, 1, 1, c); } else { R(X, y + 1, 3, 4, d[0]); R(X, y + 1, 1, 1, d[1]); } }
    else { if (f > 0) g.drawImage(fillC, 0, 0, f, 6, x, y + 3, f, 6); man(x + f - 6, y + 4 - Math.round(Math.abs(Math.sin(el * 14)) * 3), 1, el * 1.6); }   // the gingerbread man runs along the icing
  }
  return { W, H, draw(g, el) { on(g, () => {
    const t = el + 3, img = A.cookie, p = Math.min(1, el / T), win = up(el, .35), wk = win < 1 && win > .3 && Math.floor(el * 30) % 3 === 0 ? win * .5 : win;
    if (late) late(); g.imageSmoothingEnabled = false; g.globalAlpha = 1; g.drawImage(backC, 0, 0);
    if (variant !== 'B') { for (let i = 0; i < 16; i++) { const k = Math.sin(t * 3 + i * 1.7); if (k > .5) { const x = Math.round(rnd(i * 3.1) * W), y = Math.round(rnd(i * 7.7) * H * .36); R(x - 1, y, 3, 1, '#ffffff'); R(x, y - 1, 1, 3, '#ffffff'); } }
      if (variant === 'A') { const [mx, my] = extra.moon; g.globalAlpha = .16 + .04 * Math.sin(t * 2); g.drawImage(moonGlow, mx - 34, my - 34); g.globalAlpha = 1; }
      sled(Math.round(lerp(-70, W + 30, el / 2.4)), Math.round(extra.sled + Math.sin(el * 2) * 5 - el * 3), t); snowFar(t); }
    if (variant === 'B' && cookAt) { const [bx, by, bw, bh] = extra.crop, f = Math.floor(el * 10) % 14, im = A.cook[f > 7 ? 14 - f : f]; if (ready(im)) { g.drawImage(im, cookAt[0], cookAt[1]); cookHat(cookAt[0], cookAt[1]); } g.drawImage(backC, bx, by, bw, bh, bx, by, bw, bh); const [x, y, w, h] = L.winB; for (let i = 0; i < 16; i++) R(x + (rnd(i) * w + Math.sin(t + i) * 3 + w) % w, y + (rnd(i * 5) * h + t * (9 + i % 4 * 3)) % h, 1, 1, i % 3 ? '#ffffff' : '#b6cbf0'); }
    if (smokeA) for (let i = 0; i < 7; i++) { const k = (t * .28 + i / 7) % 1; puff(smokeA[0] + Math.sin(k * 5 + i) * 3 + k * 16, smokeA[1] - k * 30, 2 + Math.round(k * 4), (1 - k) * .75); }
    g.drawImage(midC, 0, 0);
    for (const [x, y] of huts) if (up(el, .2 + rnd(x) * .8) > .5) { R(x, y, 2, 2, '#ffd27a'); R(x, y, 1, 1, '#fff2c0'); }
    if (L.win) { if (wk > .02) { windowLit(L, wk, up(el, .5) > 0 ? A.cook[[1, 2, 3, 4, 3, 2][Math.floor(el * 10) % 6]] : null); if (variant === 'A') { g.globalAlpha = wk; const [a, b, c, d] = L.door; R(a, b, c, d, '#ffb054'); R(a, b, c, 4, '#ffd683'); R(a + 5, b, 2, d, WOOD[0]); R(a, b + 5, c, 1, WOOD[0]); R(L.round[0] - 3, L.round[1] - 3, 7, 7, '#ffb054'); R(L.round[0] - 2, L.round[1] - 2, 4, 4, '#ffe0a0'); R(L.round[0], L.round[1] - 4, 1, 9, WOOD[0]); R(L.round[0] - 4, L.round[1], 9, 1, WOOD[0]); g.globalAlpha = 1; } } }
    const lk = up(el, .7, .3), fl = lk < 1 && Math.floor(el * 24) % 2 ? .35 : lk; for (const [x, y] of lamps) if (fl > .1) { g.globalAlpha = fl; lampLit(x, y); g.globalAlpha = 1; }
    for (const [im, x, y, t0] of glows) { const k = up(el, t0, .4); if (k > 0) { g.globalAlpha = k * (.92 + .08 * Math.sin(t * 5 + x)); g.drawImage(im, x - im.width / 2, y - im.height / 2); } } g.globalAlpha = 1;
    // the lamps light up one after another as the game loads
    const n = L.bulbs.length; L.bulbs.forEach(([x, y, c], i) => bulb(x, y, c, p * 1.25 > (i + 1) / n && (p < .85 || Math.sin(t * 6 + i * 2.1) > -.7)));
    const m = tree.bulbs.length; tree.bulbs.forEach(([x, y, c], i) => bulb(x, y, c, p * 1.2 > .12 + (i / m) * .85 && Math.sin(t * 5 + i * 1.3) > -.75));
    const sk = p > .8 ? 1 : 0; star(tree.star[0], tree.star[1], sk, t); if (sk) { const q = clamp((p - .8) / .14); if (q < 1) for (let a = 0; a < 12; a++) R(tree.star[0] + Math.cos(a / 12 * TAU) * q * 16, tree.star[1] + Math.sin(a / 12 * TAU) * q * 16, 1, 1, a % 2 ? '#fff2b0' : '#ffffff'); }
    if (variant === 'B') { for (const [x, y] of extra.candles) { const f = Math.floor(t * 9 + x) % 3; R(x - 1, y - 14 + (f === 1 ? 1 : 0), 3, 5, '#ffb054'); R(x, y - 15 + f, 1, 6, '#ffe9a0'); R(x, y - 11, 1, 2, '#ffffff'); R(x + (f - 1), y - 15, 1, 1, '#ff7a2a'); }
      extra.flakes.forEach(([x, l, r], i) => { const s = Math.round(Math.sin(t * 1.5 + i) * 1.5), y = l + 8; R(x, 4, 1, y - r - 4, '#8a90c0'); for (let k = -r; k <= r; k++) { const q = Math.abs(k); R(x + s + k, y, 1, 1, '#ffffff'); R(x + s, y + k, 1, 1, '#ffffff'); if (q < r * .75) { R(x + s + k, y + k, 1, 1, '#dfe9ff'); R(x + s + k, y - k, 1, 1, '#c2d0f4'); } } const e = Math.round(r * .6); for (const [a, b] of [[-e, -1], [-e, 1], [e, -1], [e, 1], [-1, -e], [1, -e], [-1, e], [1, e]]) R(x + s + a, y + b, 1, 1, '#ffffff'); }); }
    for (const [x, y, w] of men) man(x, y - Math.round(Math.abs(Math.sin(el * 5 + x)) * (w ? 1 : 2)), w, t);
    if (bon) bonya(A.bonya, bon[0], bon[1], [0, 0, 0, 1, 0, 0, 2, 0][Math.floor(el * 4) % 8]);
    if (variant !== 'B') snowMid(t);
    g.drawImage(darkC, 0, 0);
    // the cookie drops in with a bounce, as before
    const drop = el < .5 ? Math.pow(1 - el / .5, 2) * -70 : Math.sin((el - .5) * 9) * Math.max(0, 1 - (el - .5)) * 4, lx = logo[0], ly = Math.round(logo[1] + drop), s = LS / 74;
    g.globalAlpha = .55 + .35 * Math.sin(el * 8) * .5; g.drawImage(halo, lx + LS / 2 - haloR, ly + LS / 2 - haloR); g.globalAlpha = 1;
    if (img && img.complete && img.naturalWidth) g.drawImage(img, lx, ly, LS, LS);
    g.drawImage(hatC, lx + (11 - 34) * s, ly + (13 - 28) * s, 52 * s, 48 * s);   // the fur lies on the edge of the cookie
    if (el > .5 && el < .95) { const q = (el - .5) / .45; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI; R(lx + LS / 2 + Math.cos(a) * LS * .5 * (.8 + q * .5), ly + LS * .95 - Math.sin(a) * 8 * q, 2, 2, i % 2 ? '#ffffff' : SNOW[2]); } }
    if (variant === 'B') { snowNear(t); } else { g.drawImage(foreC, 0, 0); snowNear(t); hang.forEach(([x, y, l, r], i) => g.drawImage(hangC[i], x - r - 1 + Math.round(Math.sin(t * 1.6 + i * 1.3)), y)); }
    if (variant === 'B') g.drawImage(foreC, 0, 0);
    // the title, letter by letter
    const shown = Math.floor(Math.max(0, el - .3) / .07); word.forEach((l, i) => { if (!l || i >= shown) return; const a = el - .3 - (i + 1) * .07, d = a < .22 ? Math.round(-9 * Math.pow(1 - a / .22, 2)) : a < .4 ? Math.round(Math.sin((a - .22) / .18 * Math.PI) * 2) : 0; g.drawImage(l[0], l[1], l[2] + d); if (a > .1 && a < .4) for (let k = 0; k < 4; k++) R(l[1] + 4 + k * 5, l[2] + l[0].height - 6 + (a - .1) * 40 + k % 2 * 2, 1, 1, '#ffffff'); });
    if (el > 1.35) { const q = ((el - 1.35) * 1.1) % 1.4, i = Math.floor(q / 1.4 * word.length), l = word[i]; if (l) { const x = l[1] + 8, y = l[2] + 9; R(x - 2, y, 5, 1, '#ffffff'); R(x, y - 2, 1, 5, '#ffffff'); } }
    if (el > .8) { g.globalAlpha = up(el, .8, .2); g.drawImage(devC, cx - (devC.width >> 1), devY - 3); g.globalAlpha = 1; }
    drawBar(el); snowClose(t); sm(t);
  }); } };
}
const moonGlow = pool(34, 34, '#dfe6ff', 1), [hatC, hatG] = cv(52, 48); on(hatG, () => hat(34, 28));
// the start of the game: one scene of the three at random (or the named one), the cookie is always the New Year one
function start(layout, accent, want) {
  const v = want || 'ABC'[Math.floor(Math.random() * 3)], pic = (n) => { const i = new Image(); i.src = 'art/' + n; return i; };
  const sc = make(v, layout, { accent, cookie: pic('cookie-newyear.png?v=7'), bonya: pic('bonya-day.png?v=2'), cook: Array.from({ length: 8 }, (_, i) => pic('cook-d' + i + '.png?v=1')), kit: v === 'B' ? pic('splash-kitchen.png?v=1') : null });
  const [c, g] = cv(sc.W, sc.H);
  return { v, frame(el) { sc.draw(g, el); return c; } };
}
window.SPLASH = { make, start, T };
})();
