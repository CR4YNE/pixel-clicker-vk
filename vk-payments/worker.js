// Куча Пряников: сервер платежей ВКонтакте и Одноклассников (Cloudflare Worker).
// VK присылает запросы на корень адреса: get_item и order_status_change. ОК — на адрес /ok.
// Секреты храните в переменных окружения: APP_SECRET (ВК) и OK_SECRET (ОК). В коде их нет.
// Перед публикацией сверьте форматы ответов с документацией VK и OK (раздел «Платежи»).

// Цены товаров в голосах: id товара (как в игре) -> цена
const PRICES = {
  double: 6, triple: 10, autoclick: 4, bundle: 30, discount: 6, noads: 14, skins_all: 5,
  reb1: 1, reb2: 2, reb5: 4, reb10: 7,
  skin_royal: 1, skin_ghost: 1, skin_neontube: 1, skin_crystal: 1, skin_volcano: 1,
  skin_solar: 1, skin_starry: 1, skin_caramel: 1, skin_gzhel: 1, skin_rainbow: 1,
  skin_neon: 1, skin_sea: 1, skin_halloween: 1, skin_easter: 1, skin_zefir: 1, skin_newyear: 1,
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const params = {};
    for (const [k, v] of url.searchParams) params[k] = v;
    if (request.method === 'POST') {
      const form = await request.formData().catch(() => null);
      if (form) for (const [k, v] of form) params[k] = String(v);
    }

    // Одноклассники: отдельный адрес /ok и свой секретный ключ (OK_SECRET)
    if (url.pathname === '/ok') return handleOk(params, env);

    // проверка параметров запуска игры (п. 1.2.2 Правил): адрес /launch?vk_...&sign=...
    if (url.pathname === '/launch') return handleLaunch(url, env);
    // покупки игрока: список подтверждённых заказов, только по подписанным параметрам запуска
    if (url.pathname === '/purchases') return handlePurchases(url, env);

    if (!(await validSig(params, env.APP_SECRET))) return json({ error: { error_code: 10, error_msg: 'bad signature' } });

    const type = params.notification_type;
    const itemId = params.item_id || params.item || '';   // the item id from the game
    const price = PRICES[itemId];

    if (type === 'get_item') {
      if (price === undefined) return json({ error: { error_code: 20, error_msg: 'unknown item' } });
      return json({ response: { title: 'Куча Пряников: ' + itemId, price, item_id: itemId, photo_url: '' } });
    }
    if (type === 'get_item_test') return json({ response: { title: 'test', price: 1, item_id: itemId, photo_url: '' } });
    // тестовая покупка от VK (голоса не списываются): записываем, чтобы игра могла проверить весь путь покупки
    if (type === 'order_status_change_test') {
      const order_id = params.order_id;
      const date = Math.floor(Date.now() / 1000);
      await recordPurchase(env, params.user_id, { order_id: String(order_id), item: itemId, date });
      return json({ response: { order_id, app_order_id: order_id, date } });
    }
    if (type === 'order_status_change' && params.status === 'chargeable') {
      if (price === undefined) return json({ error: { error_code: 20, error_msg: 'unknown item' } });
      const order_id = params.order_id;
      const date = Math.floor(Date.now() / 1000);
      // запись покупки: игра забирает её через /purchases (подпись запуска проверяется)
      await recordPurchase(env, params.user_id, { order_id: String(order_id), item: itemId, date });
      return json({ response: { order_id, app_order_id: order_id, date } });
    }
    return json({ error: { error_code: 11, error_msg: 'unknown notification' } });
  },
};

// Одноклассники: проверяем подпись OK_SECRET и отвечаем по формату OK (callbacks.payment / getItem)
async function handleOk(params, env) {
  if (!(await validSig(params, env.OK_SECRET))) return okJson({ error_code: 104, error_msg: 'PARAM_SIGNATURE' });
  const method = params.method || '';
  const itemId = params.item || '';
  const price = PRICES[itemId];
  if (method === 'callbacks.payment.getItem' || method === 'getItem') {
    if (price === undefined) return okJson({ error_code: 1002, error_msg: 'unknown item' });
    return okJson({ success: true, item_id: itemId, price, title: 'Куча Пряников: ' + itemId });
  }
  if (method === 'callbacks.payment' || method === 'payment') {
    if (price === undefined) return okJson({ error_code: 1002, error_msg: 'unknown item' });
    // здесь записываем покупку по transaction_id, чтобы не выдать товар дважды
    return okJson({ success: true, transaction_id: params.transaction_id || '' });
  }
  return okJson({ error_code: 3001, error_msg: 'unknown method' });
}

// Параметры запуска: берём все vk_* параметры, сортируем по имени, склеиваем «имя=значение» через «&»,
// считаем HMAC-SHA256 секретным ключом приложения и кодируем в base64url. Совпадение с sign — параметры настоящие.
// Возвращает user id игрока, если подпись верна, иначе null.
async function verifyLaunch(url, env) {
  const sign = url.searchParams.get('sign') || '';
  const pairs = [];
  for (const [k, v] of url.searchParams) if (k.startsWith('vk_')) pairs.push([k, v]);
  if (!env.APP_SECRET || !sign || pairs.length === 0) return null;
  pairs.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  const base = pairs.map(([k, v]) => k + '=' + v).join('&');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.APP_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(base)));
  const b64 = btoa(String.fromCharCode(...mac)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  if (b64 !== sign) return null;
  return url.searchParams.get('vk_user_id') || null;
}

async function handleLaunch(url, env) {
  const headers = { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' };
  const uid = await verifyLaunch(url, env);
  return new Response(JSON.stringify({ ok: uid !== null }), { status: uid !== null ? 200 : 403, headers });
}

// список подтверждённых покупок игрока (по подписанным параметрам запуска)
async function handlePurchases(url, env) {
  const headers = { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' };
  const uid = await verifyLaunch(url, env);
  if (uid === null) return new Response(JSON.stringify({ ok: false }), { status: 403, headers });
  const list = (await env.PURCHASES.get('u:' + uid, 'json')) || [];
  return new Response(JSON.stringify({ ok: true, purchases: list }), { status: 200, headers });
}

// записываем покупку один раз (повторное уведомление VK не даёт второй записи)
async function recordPurchase(env, userId, purchase) {
  if (!userId) return;
  const key = 'u:' + userId;
  const list = (await env.PURCHASES.get(key, 'json')) || [];
  if (list.some((p) => p.order_id === purchase.order_id)) return;
  list.push(purchase);
  await env.PURCHASES.put(key, JSON.stringify(list));
}

function okJson(obj) {
  return new Response(JSON.stringify(obj), { headers: { 'content-type': 'application/json; charset=utf-8' } });
}

function json(obj) {
  return new Response(JSON.stringify(obj), { headers: { 'content-type': 'application/json; charset=utf-8' } });
}

// подпись: md5 от «ключ=значение» по алфавиту (без sig) + секретный ключ
async function validSig(params, secret) {
  if (!secret || !params.sig) return false;
  const keys = Object.keys(params).filter((k) => k !== 'sig').sort();
  const base = keys.map((k) => k + '=' + params[k]).join('') + secret;
  return md5(base) === params.sig;
}

// md5 (для подписи; Web Crypto не умеет md5)
function md5(str) {
  const bytes = new TextEncoder().encode(str);
  const K = new Uint32Array(64), S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
  for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) >>> 0;
  const len = bytes.length;
  const padded = new Uint8Array(((len + 8) >> 6 << 6) + 64);
  padded.set(bytes); padded[len] = 0x80;
  const bits = len * 8;
  const dv = new DataView(padded.buffer);
  dv.setUint32(padded.length - 8, bits >>> 0, true);
  dv.setUint32(padded.length - 4, Math.floor(bits / 4294967296), true);
  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  for (let off = 0; off < padded.length; off += 64) {
    const M = new Uint32Array(16);
    for (let i = 0; i < 16; i++) M[i] = dv.getUint32(off + i * 4, true);
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F, g;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      F = (F + A + K[i] + M[g]) >>> 0;
      A = D; D = C; C = B;
      B = (B + ((F << S[i]) | (F >>> (32 - S[i])))) >>> 0;
    }
    a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
  }
  const out = new Uint8Array(16);
  const od = new DataView(out.buffer);
  od.setUint32(0, a0, true); od.setUint32(4, b0, true); od.setUint32(8, c0, true); od.setUint32(12, d0, true);
  return [...out].map((b) => b.toString(16).padStart(2, '0')).join('');
}
