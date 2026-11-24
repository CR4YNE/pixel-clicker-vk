// the customers alive: the 17 people of people.js; they breathe, blink and shift their feet; the umbrella and the hat are added after the drawing
window.KITCHEN_GUESTS = (function () {
'use strict';
const P = window.KUCHA_PEOPLE, { ramp, cv, rnd } = window.KITCHEN.tools;
const SKIN = ['#e3bd9c', '#c99a7c', '#a97c62', '#8a6450'], HATS = ['#b0464e', '#4f7fae', '#6a8f5c', '#8a6aa0', '#c8913c'], UMB = ['#c8404a', '#3f78b8', '#4f9a68', '#8a62b0', '#d89a34'];
const cache = {};
function base(k) { if (!cache[k]) { const [c, g] = cv(40, 64); P.draw(g, k, 12, 62); cache[k] = c; } return cache[k]; }
// o: { t, wet, winter, anim }
function draw(g, k, x, feet, o) {
  const D = P.KINDS[k], A = P.AGE[D.age], im = base(k), top = 62 - A.H, hx = (A.w - A.hw) / 2, ey = Math.round((A.head - 1) * .45) + 1, cut = top + A.head + A.torso - 1;
  const t = o.anim ? o.t : 0, R = (a, b, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(a), Math.round(b), w, h); };
  const br = o.anim && Math.sin(t * 1.95) > .25 ? 1 : 0, ph = t % 7, sh = o.anim && ph > 4.6 && ph < 6.2 ? 1 : 0;     // the breath and the shift of the weight
  const X = x - 12, Y = feet - 62;
  // the legs stand; with the weight on the other foot the left heel is up by a pixel
  g.drawImage(im, 0, cut, 40, 64 - cut, X, Y + cut, 40, 64 - cut);
  if (sh) { R(x + Math.round(A.w / 2) - 5, feet - 1, 3, 1, 'rgba(60,50,80,.55)'); }
  g.drawImage(im, 0, 0, 40, cut, X + sh, Y + br, 40, cut);
  const px = x + sh, py = feet - A.H + br, skin = ramp(SKIN[D.skin]);
  if (o.anim && t % 3.7 < .16) for (const a of [hx + 2, hx + A.hw - 3]) { R(px + a, py + ey, 1, 1, skin[2]); R(px + a, py + ey + 1, 1, 1, skin[1]); }
  if (o.winter) {
    const melt = o.t > 12 ? 2 : o.t > 6 ? 1 : 0;
    if (!D.cap) {                                                     // a knitted hat for those who came without one
      const q = ramp(HATS[k % 5]); R(px + hx - 1, py - 1, A.hw + 2, 4, q[2]); R(px + hx, py - 2, A.hw, 1, q[2]); R(px + hx, py - 2, A.hw - 3, 1, q[3]); R(px + hx + A.hw - 2, py - 1, 2, 3, q[1]); R(px + hx - 1, py + 2, A.hw + 2, 1, q[4]); for (let i = 0; i < A.hw + 2; i += 2) R(px + hx - 1 + i, py + 2, 1, 1, q[3]); R(px + A.w / 2 - 1, py - 4, 3, 2, '#f0ece6'); R(px + A.w / 2 - 1, py - 4, 2, 1, '#ffffff');
    }
    const ht = D.cap ? py - 1 : py - 2;
    if (melt < 2) { R(px + hx + 1, ht, A.hw - 4 - melt * 2, 1, '#ffffff'); R(px + 1, py + A.head, 4 - melt, 1, '#ffffff'); R(px + A.w - 5 + melt, py + A.head, 4 - melt, 1, '#eef2fb'); if (!melt) { R(px, py + A.head + 1, 2, 1, '#ffffff'); R(px + A.w - 2, py + A.head + 1, 2, 1, '#dfe6f4'); } }
    if (melt) { const f = (t * .7) % 1; if (o.anim) R(px + 2, py + A.head + 2 + f * 12, 1, 1, '#d4e8f8'); R(x - 1, feet + 1, 4 + melt * 3, 1, 'rgba(180,215,240,.8)'); }
  } else if (o.wet) {
    const q = ramp(UMB[k % 5]), ux = px + A.w + 1, uy = feet - 22;      // a folded wet umbrella with the tip on the floor
    R(ux + 1, uy - 5, 1, 5, '#6a4a36'); R(ux, uy - 6, 2, 1, '#8a6244'); R(ux - 1, uy - 6, 1, 2, '#8a6244');
    R(ux, uy, 3, 4, q[2]); R(ux - 1, uy + 3, 5, 9, q[2]); R(ux, uy + 12, 3, 5, q[2]); R(ux + 1, uy + 17, 1, 4, '#8a8498'); R(ux - 1, uy + 3, 1, 8, q[4]); R(ux + 1, uy + 1, 1, 15, q[1]); R(ux + 3, uy + 4, 1, 8, q[0]);
    R(ux, uy + 5, 1, 2, '#ffffff'); R(ux + 2, uy + 10, 1, 1, '#d8f0ff');
    R(px + A.w - 1, uy - 3, 3, 3, skin[2]); R(px + A.w - 1, uy - 3, 2, 1, skin[3]);   // the hand on the handle
    if (o.anim) { const f = (t * .8) % 1; R(ux + 1, feet - 2 + f * 3, 1, 1, '#bfe2f6'); }
    const w = Math.min(9, 3 + o.t * .8); R(ux + 1 - w / 2, feet + 1, Math.round(w), 1, 'rgba(150,200,236,.85)'); R(ux + 2 - w / 2, feet + 2, Math.max(1, Math.round(w) - 3), 1, 'rgba(120,170,214,.6)');
  }
}
return { draw, top: (k, feet) => feet - P.AGE[P.KINDS[k].age].H };
})();
