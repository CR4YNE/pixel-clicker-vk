// the customers: 17 kinds, sized against the cook (48 px from hair to boot soles)
window.KUCHA_PEOPLE = (function () {
  const SKINS = ['#e3bd9c', '#c99a7c', '#a97c62', '#8a6450'];
  const KINDS = [
    { name: 'ДЕВОЧКА С КОСИЧКАМИ', age: 'kid', skin: 0, hair: '#6e4a32', style: 'braids', top: '#b98b8b', bottom: '#b98b8b', dress: true, blush: true, extra: 'dots' },
    { name: 'МАЛЬЧИК В КЕПКЕ', age: 'kid', skin: 1, hair: '#3e2f26', style: 'cap', cap: '#8c5a52', top: '#7d8fa3', bottom: '#4f566b', blush: true, extra: 'stripe' },
    { name: 'ШКОЛЬНИК С РЮКЗАКОМ', age: 'kid', skin: 2, hair: '#2f2722', style: 'short', top: '#7f9a86', bottom: '#4a5160', bag: '#9a7a58', blush: true },
    { name: 'ДЕВОЧКА С ХВОСТИКАМИ', age: 'kid', skin: 1, hair: '#3a2a22', style: 'pigtails', bow: '#b07a8a', top: '#c2b07e', bottom: '#5a6478', blush: true, extra: 'collar' },
    { name: 'МАЛЫШ В УШАНКЕ', age: 'kid', skin: 0, hair: '#8a6a48', style: 'ushanka', cap: '#6f6a80', fur: '#c9bfae', top: '#9a6f5e', bottom: '#4f566b', blush: true, extra: 'scarf', scarf: '#8a9a7a' },
    { name: 'ДЕВОЧКА В ПАНАМКЕ', age: 'kid', skin: 3, hair: '#2a2220', style: 'panama', cap: '#d0c49a', flower: '#c48a8a', top: '#86a0a6', bottom: '#86a0a6', dress: true, blush: true, extra: 'hem' },
    { name: 'БАБУШКА В ОЧКАХ', age: 'old', skin: 0, hair: '#b8b4ac', style: 'bun', glasses: true, top: '#8f7f9c', bottom: '#6b5f70', dress: true, extra: 'shawl', shawl: '#a89a7a' },
    { name: 'ДЕДУШКА С УСАМИ', age: 'old', skin: 1, hair: '#a9a59d', style: 'bald', mustache: true, top: '#8a8770', bottom: '#5b5a4e', extra: 'buttons', belt: true },
    { name: 'БАБУШКА В ПЛАТКЕ', age: 'old', skin: 1, hair: '#a9a59d', style: 'scarf', cap: '#9c6f6f', top: '#7f8a6e', bottom: '#5f5a52', dress: true, extra: 'apron', apron: '#c9bfae' },
    { name: 'ДЕДУШКА С ТРОСТЬЮ', age: 'old', skin: 2, hair: '#bdb8ae', style: 'flatcap', cap: '#6e6658', cane: true, top: '#7a6e86', bottom: '#4e4a56', extra: 'buttons', belt: true },
    { name: 'ДЕВУШКА В ШАПКЕ', age: 'adult', skin: 0, hair: '#8a5a3a', style: 'hat', cap: '#7a8f9e', pom: '#d8d2c4', top: '#a6907a', bottom: '#5d5866', blush: true, extra: 'scarf', scarf: '#9c6f6f' },
    { name: 'ПОЧТАЛЬОН', age: 'adult', skin: 2, hair: '#2a2420', style: 'short', beard: true, top: '#6f7e95', bottom: '#3f4656', bag: '#8c6c4a', belt: true, extra: 'pocket' },
    { name: 'СПОРТСМЕН', age: 'adult', skin: 3, hair: '#221c1a', style: 'headband', band: '#b06a5a', top: '#8aa08a', bottom: '#55606e', extra: 'sport' },
    { name: 'СТРОИТЕЛЬ', age: 'adult', skin: 1, hair: '#4a3a2e', style: 'helmet', cap: '#c9a85a', top: '#a3805a', bottom: '#4f5a6a', vest: '#d8cfb8', belt: true },
    { name: 'ДЕЛОВАЯ ЖЕНЩИНА', age: 'adult', skin: 2, hair: '#3a2620', style: 'long', top: '#5e6478', bottom: '#4a4e5e', collar: '#d8d2c4', blush: true, extra: 'buttons' },
    { name: 'ПАРЕНЬ В НАУШНИКАХ', age: 'adult', skin: 0, hair: '#5a4636', style: 'phones', top: '#9a7f9a', bottom: '#3f4656', extra: 'hoodie' },
    { name: 'РЫЖАЯ С КУДРЯМИ', age: 'adult', skin: 0, hair: '#a8653e', style: 'curly', top: '#7f9a9a', bottom: '#6a5e58', dress: true, blush: true, freckles: true, extra: 'dots' },
  ];
  // head top to feet: adults 48 (= the cook without his hat and floor shadow), old people 42, children 34
  // legs = H - head - torso - 2 (shoes): adults 14, old 10, children 8
  const AGE = {
    kid: { H: 34, head: 11, torso: 13, w: 12, hw: 10 },
    old: { H: 42, head: 12, torso: 18, w: 14, hw: 12 },
    adult: { H: 48, head: 12, torso: 20, w: 14, hw: 12 },
  };
  // tones: shadows lean to a cool violet, highlights to a warm cream (hue shift gives the colour depth)
  function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function mix(a, b, t) { const A = hexRgb(a), B = hexRgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); }
  const DARK = '#2a2040', WARM = '#fff2d8';
  // a 5-step ramp for one material: [deep shadow, shadow, base, light, highlight]
  function ramp(c) { return [mix(c, DARK, 0.45), mix(c, DARK, 0.22), c, mix(c, WARM, 0.18), mix(c, WARM, 0.36)]; }

  let pctx = null;
  function fr(x, y, w, h, col) { pctx.fillStyle = col; pctx.fillRect(x, y, w, h); }
  // draws the kind k on the context c, its left edge at x and its soles on the line feet; returns the row of the top of the head
  function person(c, k, x, feet) {
    pctx = c;
    const K = KINDS[k], A = AGE[K.age], o = '#2a2230';
    const S = ramp(SKINS[K.skin]), T = ramp(K.top), B = ramp(K.bottom), Hh = ramp(K.hair);
    const top = feet - A.H, W = A.w, hw = A.hw, hx = (W - hw) / 2;
    const r = (a, b, w, h, c) => fr(x + a, top + b, w, h, c);
    const px = (a, b, c) => fr(x + a, top + b, 1, 1, c);
    const bodyY = A.head, legY = A.head + A.torso, legH = A.H - legY - 2, lw = Math.max(3, Math.round(W / 4));
    const lx1 = Math.round(W / 2) - lw - 1, lx2 = Math.round(W / 2) + 1;
    const armH = Math.round(A.torso * 0.7);

    // ---- legs: the left leg in the light, the right one a step darker; a dark inner edge
    const L = K.dress ? S : B;
    r(lx1, legY, lw, legH, L[2]); r(lx1, legY, 1, legH, L[3]); r(lx1 + lw - 1, legY, 1, legH, L[1]);
    r(lx2, legY, lw, legH, L[1]); r(lx2 + lw - 1, legY, 1, legH, L[0]);
    if (!K.dress) { r(lx1, legY, lw, 1, L[0]); r(lx2, legY, lw, 1, L[0]); }          // shade under the jacket
    // shoes: dark with a light toe and a sole line
    const shoe = ramp('#4a3e4e');
    [[lx1 - 1], [lx2]].forEach(([sx]) => {
      r(sx, A.H - 2, lw + 1, 2, shoe[1]); r(sx, A.H - 1, lw + 1, 1, shoe[0]); px(sx + (sx === lx2 ? lw : 0), A.H - 2, shoe[3]);
    });

    // ---- body: highlight column on the left, two shadow columns on the right, folds
    const th = K.dress ? A.torso + 3 : A.torso;
    r(1, bodyY, W - 2, th, T[2]);
    r(1, bodyY, 1, th, T[3]); r(W - 3, bodyY + 1, 1, th - 1, T[1]); r(W - 2, bodyY + 1, 1, th - 1, T[0]);
    r(2, bodyY, W - 5, 1, T[4]);                                                     // light on the shoulders
    if (K.dress) {
      r(0, legY, W, 3, T[2]); r(0, legY, 1, 3, T[3]); r(W - 2, legY, 2, 3, T[0]);
      r(0, legY + 2, W, 1, T[1]);                                                      // hem
      px(4, legY, T[1]); px(8, legY + 1, T[1]);                                        // folds in the skirt
    } else {
      r(1, legY - 2, W - 2, 2, B[2]); r(W - 3, legY - 2, 2, 2, B[0]); r(1, legY - 2, 1, 2, B[3]);
      px(5, bodyY + Math.round(A.torso / 2), T[1]);                                    // a fold
    }
    r(1, bodyY + 1, W - 2, 1, T[1]);                                                   // shadow under the chin
    if (K.belt) { const bl = ramp('#4a3a34'); r(1, legY - 3, W - 2, 1, bl[1]); r(W / 2 - 1, legY - 3, 2, 1, '#c9a85a'); }

    // ---- arms: the left one lit, the right one in shadow; cuffs and hands with a shaded edge
    r(-1, bodyY + 1, 2, armH, T[2]); px(-1, bodyY + 1, T[4]); r(-1, bodyY + 2, 1, armH - 1, T[3]);
    r(W - 1, bodyY + 1, 2, armH, T[1]); r(W, bodyY + 2, 1, armH - 1, T[0]);
    r(-1, bodyY + armH, 2, 1, T[0]); r(W - 1, bodyY + armH, 2, 1, T[0]);              // cuffs
    r(-1, bodyY + 1 + armH, 2, 2, S[2]); px(-1, bodyY + 2 + armH, S[1]);
    r(W - 1, bodyY + 1 + armH, 2, 2, S[1]); px(W, bodyY + 2 + armH, S[0]);

    // ---- clothing details
    const ex = K.extra;
    if (ex === 'buttons') for (let i = 3; i < A.torso - 2; i += 4) px(W / 2 - 1, bodyY + i, T[0]);
    if (ex === 'pocket') { r(2, bodyY + 4, 3, 3, T[1]); r(2, bodyY + 4, 3, 1, T[0]); }
    if (ex === 'stripe') { r(1, bodyY + 5, W - 2, 1, mix(K.top, WARM, 0.45)); r(W - 3, bodyY + 5, 2, 1, T[2]); }
    if (ex === 'sport') { r(1, bodyY + 3, 1, armH, '#d8d2c4'); r(W - 2, bodyY + 3, 1, armH, '#b8b2a4'); r(W / 2 - 2, bodyY + 5, 3, 4, mix(K.top, WARM, 0.5)); px(W / 2 - 1, bodyY + 6, T[0]); }
    if (ex === 'hoodie') { r(W / 2 - 3, bodyY, 6, 2, T[1]); px(W / 2 - 2, bodyY + 2, '#d8d2c4'); px(W / 2 + 1, bodyY + 2, '#d8d2c4'); px(W / 2 - 2, bodyY + 3, '#d8d2c4'); px(W / 2 + 1, bodyY + 3, '#d8d2c4'); r(3, bodyY + A.torso - 6, W - 6, 3, T[1]); }
    if (ex === 'dots') for (let j = bodyY + 3; j < bodyY + th; j += 3) for (let i = 2 + (j % 2); i < W - 2; i += 3) px(i, j, T[4]);
    if (ex === 'collar') { r(W / 2 - 3, bodyY, 2, 2, '#e8e2d4'); r(W / 2 + 1, bodyY, 2, 2, '#d8d2c4'); }
    if (ex === 'hem') { r(0, legY + 1, W, 1, mix(K.top, WARM, 0.5)); }
    if (ex === 'scarf') { const sc = ramp(K.scarf); r(1, bodyY, W - 2, 2, sc[2]); r(W - 3, bodyY, 2, 2, sc[0]); r(2, bodyY + 2, 2, 4, sc[2]); px(2, bodyY + 5, sc[1]); px(3, bodyY + 5, sc[0]); }
    if (ex === 'shawl') { const sh = ramp(K.shawl); r(0, bodyY, W, 3, sh[2]); r(0, bodyY, W, 1, sh[3]); r(W - 2, bodyY, 2, 3, sh[0]); r(W / 2 - 2, bodyY + 3, 4, 2, sh[1]); px(W / 2 - 1, bodyY + 5, sh[0]); }
    if (ex === 'apron') { const ap = ramp(K.apron); r(3, bodyY + 4, W - 6, th - 4, ap[2]); r(W - 4, bodyY + 5, 1, th - 5, ap[1]); r(3, bodyY + 4, W - 6, 1, ap[3]); r(4, bodyY + 9, 3, 2, ap[1]); }
    if (K.vest) { const v = ramp(K.vest); r(2, bodyY + 1, 2, A.torso - 3, v[2]); r(W - 4, bodyY + 1, 2, A.torso - 3, v[1]); r(1, bodyY + A.torso - 7, W - 2, 1, v[2]); r(W - 3, bodyY + A.torso - 7, 2, 1, v[0]); }
    if (K.collar) { r(W / 2 - 3, bodyY, 2, 2, '#e8e2d4'); r(W / 2 + 1, bodyY, 2, 2, '#c8c2b4'); r(W / 2 - 1, bodyY + 1, 2, A.torso - 4, T[0]); }
    if (K.cane) { const c = ramp('#6b4a2a'); r(W + 1, bodyY + armH, 1, A.H - bodyY - armH, c[2]); r(W - 1, bodyY + armH, 3, 1, c[3]); px(W + 1, A.H - 1, c[0]); }
    if (K.bag && K.age === 'kid') {
      const bg = ramp(K.bag);
      r(3, bodyY, 1, A.torso - 1, bg[2]); r(W - 4, bodyY, 1, A.torso - 1, bg[1]);
      r(1, bodyY - 1, 2, 2, bg[3]); r(W - 3, bodyY - 1, 2, 2, bg[1]);                 // the top of the backpack behind the shoulders
    }
    if (K.bag && K.age !== 'kid') {
      const bg = ramp(K.bag), n = A.torso - 6;
      for (let i = 0; i < n; i++) px(2 + Math.floor(i * (W - 6) / n), bodyY + i, bg[2]);
      r(W - 7, legY - 7, 6, 5, bg[2]); r(W - 7, legY - 7, 6, 1, bg[3]); r(W - 2, legY - 6, 1, 4, bg[0]); r(W - 7, legY - 3, 6, 1, bg[1]);
      r(W - 6, legY - 8, 3, 1, '#e8e2d4');                                              // a letter sticking out
    }

    // ---- head: lit from the left, shaded on the right, chin shadow, ears
    const ey = Math.round((A.head - 1) * 0.45) + 1, mx = hx + hw / 2 - 1;
    r(hx, 1, hw, A.head - 1, S[2]);
    r(hx, 1, 1, A.head - 2, S[3]); r(hx + hw - 1, 2, 1, A.head - 3, S[1]); r(hx + 1, A.head - 1, hw - 2, 1, S[1]);
    px(hx + 1, ey + 1, S[4]);                                                           // light on the left cheek
    r(hx - 1, ey, 1, 2, S[2]); px(hx - 1, ey + 1, S[1]); r(hx + hw, ey, 1, 2, S[1]);   // ears
    // eyes with a light spot, brows, nose and mouth
    r(hx + 2, ey, 1, 2, o); r(hx + hw - 3, ey, 1, 2, o);
    if (K.age === 'kid') { px(hx + 2, ey, '#6a6080'); px(hx + hw - 3, ey, '#6a6080'); }
    const brow = K.age === 'old' ? Hh[1] : Hh[0];
    r(hx + 1, ey - 2, 2, 1, brow); r(hx + hw - 3, ey - 2, 2, 1, brow);
    px(mx + 1, ey + 2, S[1]);                                                           // nose
    r(mx, ey + 3, 2, 1, '#9a5a4e'); px(mx + 1, ey + 3, '#7e4a42');
    if (K.blush) { px(hx + 1, ey + 2, mix(SKINS[K.skin], '#c46a6a', 0.35)); px(hx + hw - 2, ey + 2, mix(SKINS[K.skin], '#c46a6a', 0.45)); }
    if (K.freckles) { px(hx + 3, ey + 2, S[1]); px(hx + hw - 4, ey + 2, S[1]); }
    if (K.age === 'old') { px(hx + 1, ey - 1, S[1]); px(hx + hw - 2, ey - 1, S[1]); px(mx - 1, ey + 4, S[1]); px(mx + 2, ey + 4, S[1]); }   // wrinkles
    if (K.glasses) { const g = '#5a5060'; r(hx + 1, ey - 1, 3, 4, g); r(hx + 2, ey, 1, 2, o); px(hx + 3, ey, '#8a8098'); r(hx + hw - 4, ey - 1, 3, 4, g); r(hx + hw - 3, ey, 1, 2, o); px(hx + hw - 2, ey, '#8a8098'); r(hx + 4, ey, hw - 8, 1, g); }
    if (K.mustache) { r(mx - 1, ey + 2, 4, 1, Hh[2]); px(mx - 1, ey + 2, Hh[3]); px(mx + 2, ey + 2, Hh[1]); }
    if (K.beard) { r(hx, ey + 2, hw, A.head - ey - 2, Hh[2]); r(hx + hw - 2, ey + 2, 2, A.head - ey - 2, Hh[1]); px(hx, ey + 2, Hh[3]); r(mx, ey + 3, 2, 1, '#9a5a4e'); }

    // ---- hair and hats (each with light, base and shadow tones)
    const h = Hh, hl = (a, b, w) => r(a, b, w, 1, h[4]);
    const cp = K.cap ? ramp(K.cap) : null;
    switch (K.style) {
      case 'braids':
        r(hx, 0, hw, 3, h[2]); hl(hx + 2, 0, 3); r(hx + hw - 3, 1, 3, 2, h[1]);
        r(hx - 1, 1, 1, ey, h[2]); r(hx + hw, 1, 1, ey, h[1]);
        r(hx - 2, ey, 2, 7, h[2]); r(hx + hw, ey, 2, 7, h[1]);
        for (let j = ey + 1; j < ey + 6; j += 2) { px(hx - 2, j, h[1]); px(hx + hw + 1, j, h[0]); }
        r(hx - 2, ey + 6, 2, 1, T[3]); r(hx + hw, ey + 6, 2, 1, T[2]); break;
      case 'cap':
        r(hx, 0, hw, 3, cp[2]); hl(hx + 1, 0, 0); r(hx + 1, 0, 4, 1, cp[3]); r(hx + hw - 2, 0, 2, 3, cp[1]);
        r(hx + hw - 4, 2, 6, 1, cp[1]); r(hx + hw - 2, 2, 4, 1, cp[0]); px(hx + hw / 2, 0, cp[4]);
        r(hx, 3, 1, 2, h[2]); r(hx + hw - 1, 3, 1, 2, h[1]); break;
      case 'bun':
        r(hx, 0, hw, 3, h[2]); r(hx + hw - 3, 0, 3, 3, h[1]); r(hx + 3, -3, hw - 6, 3, h[2]); r(hx + 4, -3, 3, 1, h[4]); px(hx + hw - 4, -2, h[1]);
        r(hx - 1, 2, 1, ey, h[2]); r(hx + hw, 2, 1, ey, h[1]); hl(hx + 2, 1, 2); break;
      case 'bald':
        r(hx - 1, 3, 2, ey, h[2]); r(hx + hw - 1, 3, 2, ey, h[1]); r(hx + 2, 1, hw - 4, 1, S[4]); px(hx + 3, 2, S[4]); break;
      case 'short':
        r(hx, 0, hw, 3, h[2]); r(hx + hw - 3, 0, 3, 3, h[1]); hl(hx + 2, 0, 3); px(hx + 4, 2, h[1]);
        r(hx - 1, 1, 1, ey - 1, h[2]); r(hx + hw, 1, 1, ey - 1, h[1]); break;
      case 'hat':
        r(hx - 1, -1, hw + 2, 4, cp[2]); r(hx - 1, -1, 4, 1, cp[3]); r(hx + hw - 2, -1, 3, 4, cp[1]);
        for (let i = hx; i < hx + hw; i += 2) px(i, 0, cp[1]);                          // knit ribs
        r(hx - 1, 2, hw + 2, 1, cp[0]);
        const pm = ramp(K.pom); r(hx + hw / 2 - 1, -3, 2, 2, pm[2]); px(hx + hw / 2 - 1, -3, pm[4]); px(hx + hw / 2, -2, pm[1]);
        r(hx - 1, 3, 1, ey + 3, h[2]); r(hx + hw, 3, 1, ey + 3, h[1]); break;
      case 'pigtails':
        r(hx, 0, hw, 3, h[2]); r(hx + hw - 3, 0, 3, 3, h[1]); hl(hx + 2, 0, 3);
        r(hx - 1, 1, 1, 3, h[2]); r(hx + hw, 1, 1, 3, h[1]);
        r(hx - 4, 0, 3, 5, h[2]); px(hx - 4, 0, h[4]); r(hx - 4, 4, 3, 1, h[1]);
        r(hx + hw + 1, 0, 3, 5, h[1]); r(hx + hw + 1, 4, 3, 1, h[0]);
        const bw = ramp(K.bow); r(hx - 2, 1, 1, 2, bw[3]); r(hx + hw + 1, 1, 1, 2, bw[1]); break;
      case 'ushanka': {
        const fu = ramp(K.fur);
        r(hx - 1, -1, hw + 2, 4, cp[2]); r(hx - 1, -1, 4, 1, cp[3]); r(hx + hw - 2, -1, 3, 3, cp[1]);
        r(hx - 1, 2, hw + 2, 1, fu[2]); for (let i = hx; i < hx + hw; i += 2) px(i, 2, fu[3]);
        r(hx - 1, 3, 2, 6, cp[2]); r(hx + hw - 1, 3, 2, 6, cp[1]); px(hx - 1, 3, cp[3]);
        r(hx - 1, 8, 2, 1, fu[2]); r(hx + hw - 1, 8, 2, 1, fu[1]); break;
      }
      case 'panama':
        r(hx + 1, -1, hw - 2, 3, cp[2]); r(hx + 1, -1, 3, 1, cp[4]); r(hx + hw - 3, -1, 2, 3, cp[1]);
        r(hx + 1, 1, hw - 2, 1, cp[0]);                                                // band
        r(hx - 2, 2, hw + 4, 1, cp[2]); r(hx + hw - 1, 2, 3, 1, cp[1]); r(hx - 2, 2, 2, 1, cp[3]);
        { const fl = ramp(K.flower); px(hx + 2, 0, fl[3]); px(hx + 3, 1, fl[1]); px(hx + 1, 1, fl[2]); px(hx + 2, 1, '#e8d890'); }
        r(hx - 1, 3, 1, ey + 2, h[2]); r(hx + hw, 3, 1, ey + 2, h[1]); break;
      case 'scarf':
        r(hx - 1, -1, hw + 2, 4, cp[2]); r(hx - 1, -1, 4, 1, cp[3]); r(hx + hw - 2, -1, 3, 4, cp[1]);
        for (let i = hx + 1; i < hx + hw; i += 3) px(i, 1, cp[4]);                       // a small pattern
        r(hx - 1, 3, 1, ey + 3, cp[2]); r(hx + hw, 3, 1, ey + 3, cp[1]); r(hx, 3, hw, 1, h[2]);
        r(mx, A.head, 2, 2, cp[1]); px(mx, A.head, cp[3]); break;
      case 'flatcap':
        r(hx - 1, 3, 2, ey, h[2]); r(hx + hw - 1, 3, 2, ey, h[1]);
        r(hx, 0, hw, 3, cp[2]); r(hx, 0, 4, 1, cp[3]); r(hx + hw - 3, 0, 3, 3, cp[1]);
        r(hx - 1, 2, hw + 3, 1, cp[1]); r(hx + hw - 1, 2, 3, 1, cp[0]); break;
      case 'headband': {
        const bd = ramp(K.band);
        r(hx, 0, hw, 3, h[2]); r(hx + hw - 3, 0, 3, 3, h[1]); hl(hx + 2, 0, 3);
        r(hx - 1, 1, 1, ey - 1, h[2]); r(hx + hw, 1, 1, ey - 1, h[1]);
        r(hx - 1, 2, hw + 2, 1, bd[2]); r(hx - 1, 2, 3, 1, bd[3]); r(hx + hw - 1, 2, 2, 1, bd[1]); break;
      }
      case 'helmet':
        r(hx - 1, -1, hw + 2, 4, cp[2]); r(hx, -1, 3, 1, cp[4]); r(hx + hw - 2, -1, 3, 4, cp[1]);
        r(hx + hw / 2 - 1, -1, 2, 3, cp[3]);                                            // the ridge
        r(hx - 2, 2, hw + 4, 1, cp[2]); r(hx + hw, 2, 2, 1, cp[0]); r(hx - 2, 3, hw + 4, 1, cp[0]);
        r(hx - 1, 4, 1, ey - 3, h[2]); r(hx + hw, 4, 1, ey - 3, h[1]); break;
      case 'long':
        r(hx, 0, hw, 3, h[2]); r(hx + hw - 3, 0, 3, 3, h[1]); hl(hx + 2, 0, 3); px(hx + 5, 1, h[1]);
        r(hx - 1, 1, 1, A.head + 3, h[2]); r(hx + hw, 1, 1, A.head + 3, h[1]);
        r(hx - 2, A.head - 2, 2, 6, h[2]); px(hx - 2, A.head + 3, h[1]); r(hx + hw, A.head - 2, 2, 6, h[1]); px(hx + hw + 1, A.head + 3, h[0]); break;
      case 'phones': {
        const ph = ramp('#4a4650');
        r(hx, 0, hw, 3, h[2]); r(hx + hw - 3, 0, 3, 3, h[1]); hl(hx + 2, 0, 3);
        r(hx - 1, 1, 1, ey - 1, h[2]); r(hx + hw, 1, 1, ey - 1, h[1]);
        r(hx, -1, hw, 1, ph[2]); px(hx + 2, -1, ph[4]); r(hx - 1, 0, 1, ey - 1, ph[2]); r(hx + hw, 0, 1, ey - 1, ph[1]);
        r(hx - 2, ey - 1, 2, 4, ph[2]); px(hx - 2, ey - 1, ph[4]); r(hx + hw, ey - 1, 2, 4, ph[1]); px(hx + hw + 1, ey + 2, ph[0]); break;
      }
      case 'curly':
        r(hx - 1, -1, hw + 2, 4, h[2]); r(hx - 2, 0, 1, ey + 5, h[2]); r(hx + hw + 1, 0, 1, ey + 5, h[1]);
        r(hx - 1, 3, 1, ey + 4, h[2]); r(hx + hw, 3, 1, ey + 4, h[1]);
        for (let i = 0; i < hw + 2; i += 2) { px(hx - 1 + i, -1, h[0]); px(hx + i, 0, h[4]); }
        for (let j = 1; j < ey + 5; j += 2) { px(hx - 2, j, h[3]); px(hx + hw + 1, j, h[0]); }
        break;
    }
    return top;
  }
  return { KINDS, AGE, draw: person };
})();
