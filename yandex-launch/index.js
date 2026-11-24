// Куча Пряников: сервер на Яндекс Облаке (облачная функция pryanik-launch).
// Работает без VPN. Что делает:
//  1) проверка параметров запуска ВКонтакте: /?vk_...&sign=... (как раньше);
//  2) список покупок игрока: ?op=purchases&vk_...&sign=... (только по подписанному запуску);
//  3) уведомления ВКонтакте о платежах (get_item, order_status_change) — подпись md5 с APP_SECRET.
// Покупки хранятся в Object Storage (S3-совместимом бакете), один файл на игрока: purchases/<vk_user_id>.json
// Переменные окружения функции:
//   APP_SECRET            — защищённый ключ приложения ВКонтакте (для запуска и для уведомлений)
//   BUCKET                — имя бакета
//   STORAGE_KEY_ID        — ID ключа сервисного аккаунта (доступ к бакету)
//   STORAGE_KEY_SECRET    — секрет ключа сервисного аккаунта
const crypto = require('crypto');
// картинка товара для окна оплаты ВК (публичная ссылка, без входа)
const PHOTO_URL = 'https://raw.githubusercontent.com/CR4YNE/pixel-clicker-vk/main/art/logo-c-transparent.png';

// цены товаров в голосах (та же таблица, что на сервере раньше)
const PRICES = {
  double: 6, triple: 10, autoclick: 4, bundle: 30, discount: 6, noads: 14, skins_all: 5,
  rebirth2: 6, reb1: 1, reb2: 2, reb5: 4, reb10: 7,
  skin_royal: 1, skin_ghost: 1, skin_neontube: 1, skin_crystal: 1, skin_volcano: 1,
  skin_solar: 1, skin_starry: 1, skin_caramel: 1, skin_gzhel: 1, skin_rainbow: 1,
  skin_neon: 1, skin_sea: 1, skin_halloween: 1, skin_easter: 1, skin_zefir: 1, skin_newyear: 1,
};

const HEADERS = { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' };
function reply(statusCode, body) {
  return { statusCode, headers: HEADERS, body: JSON.stringify(body) };
}

module.exports.handler = async function (event) {
  const q = Object.assign({}, event.queryStringParameters || {});
  // параметры уведомлений ВКонтакте могут прийти формой в теле запроса
  if (event.body) {
    const buf = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : Buffer.from(event.body, 'utf8');
    const headers = event.headers || {};
    const ct = headers['Content-Type'] || headers['content-type'] || '';
    if (ct.includes('multipart/form-data')) {
      // ВКонтакте может присылать уведомления как multipart — разбираем и такой формат
      const form = await new Request('http://localhost/', { method: 'POST', headers: { 'content-type': ct }, body: buf }).formData();
      for (const [k, v] of form) q[k] = String(v);
    } else {
      for (const [k, v] of new URLSearchParams(buf.toString('utf8'))) q[k] = v;
    }
  }

  // 1) уведомления ВКонтакте (есть notification_type и sig)
  if (q.notification_type) return vkNotification(q);

  // 2) список покупок
  if (q.op === 'purchases') {
    const uid = await verifyLaunch(q);
    if (!uid) return reply(403, { ok: false });
    const list = await loadPurchases(uid);
    return reply(200, { ok: true, purchases: list });
  }

  // 3) проверка запуска
  const uid = await verifyLaunch(q);
  return reply(uid ? 200 : 403, { ok: uid !== null });
};

// подпись запуска: vk_* параметры по алфавиту, «имя=значение» через «&», HMAC-SHA256 ключом APP_SECRET, base64url
async function verifyLaunch(q) {
  const secret = process.env.APP_SECRET || '';
  const sign = q.sign || '';
  const keys = Object.keys(q).filter((k) => k.startsWith('vk_')).sort();
  if (!secret || !sign || keys.length === 0) return null;
  const base = keys.map((k) => k + '=' + q[k]).join('&');
  const mac = crypto.createHmac('sha256', secret).update(base).digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  if (mac !== sign) return null;
  return q.vk_user_id || null;
}

// подпись уведомлений ВКонтакте: md5 от «ключ=значение» по алфавиту (без sig) + APP_SECRET
function validNotifSig(q) {
  const secret = process.env.APP_SECRET || '';
  if (!secret || !q.sig) return false;
  const keys = Object.keys(q).filter((k) => k !== 'sig').sort();
  const base = keys.map((k) => k + '=' + q[k]).join('') + secret;
  return crypto.createHash('md5').update(base, 'utf8').digest('hex') === q.sig;
}

async function vkNotification(q) {
  if (!validNotifSig(q)) return reply(200, { error: { error_code: 10, error_msg: 'bad signature' } });
  const type = q.notification_type;
  const itemId = q.item_id || q.item || '';
  const price = PRICES[itemId];

  if (type === 'get_item') {
    if (price === undefined) return reply(200, { error: { error_code: 20, error_msg: 'unknown item' } });
    return reply(200, { response: { title: 'Куча Пряников: ' + itemId, price, item_id: itemId, photo_url: PHOTO_URL } });
  }
  if (type === 'get_item_test') return reply(200, { response: { title: 'test', price: 1, item_id: itemId, photo_url: PHOTO_URL } });
  if (type === 'order_status_change_test') {
    const date = Math.floor(Date.now() / 1000);
    await recordPurchase(q.user_id, { order_id: String(q.order_id), item: itemId, date });
    return reply(200, { response: { order_id: q.order_id, app_order_id: q.order_id, date } });
  }
  if (type === 'order_status_change' && q.status === 'chargeable') {
    if (price === undefined) return reply(200, { error: { error_code: 20, error_msg: 'unknown item' } });
    const date = Math.floor(Date.now() / 1000);
    await recordPurchase(q.user_id, { order_id: String(q.order_id), item: itemId, date });
    return reply(200, { response: { order_id: q.order_id, app_order_id: q.order_id, date } });
  }
  return reply(200, { error: { error_code: 11, error_msg: 'unknown notification' } });
}

// ---------- хранилище: Object Storage (S3, подпись AWS Signature V4) ----------
const STORAGE_HOST = 'storage.yandexcloud.net';
const REGION = 'ru-central1';

function sha256hex(s) { return crypto.createHash('sha256').update(s, 'utf8').digest('hex'); }
function hmac(key, s) { return crypto.createHmac('sha256', key).update(s, 'utf8').digest(); }

async function s3(method, key, body) {
  const bucket = process.env.BUCKET;
  const path = '/' + bucket + '/' + key;
  const payload = body || '';
  const payloadHash = sha256hex(payload);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');   // 20261120T180000Z
  const dateStamp = amzDate.slice(0, 8);
  const headers = { host: STORAGE_HOST, 'x-amz-content-sha256': payloadHash, 'x-amz-date': amzDate };
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const canonicalHeaders = 'host:' + STORAGE_HOST + '\nx-amz-content-sha256:' + payloadHash + '\nx-amz-date:' + amzDate + '\n';
  const canonicalRequest = [method, encodeURI(path), '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const scope = dateStamp + '/' + REGION + '/s3/aws4_request';
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256hex(canonicalRequest)].join('\n');
  const kDate = hmac('AWS4' + process.env.STORAGE_KEY_SECRET, dateStamp);
  const kRegion = hmac(kDate, REGION);
  const kService = hmac(kRegion, 's3');
  const kSigning = hmac(kService, 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign, 'utf8').digest('hex');
  const auth = 'AWS4-HMAC-SHA256 Credential=' + process.env.STORAGE_KEY_ID + '/' + scope +
    ', SignedHeaders=' + signedHeaders + ', Signature=' + signature;
  return fetch('https://' + STORAGE_HOST + encodeURI(path), {
    method,
    headers: { 'x-amz-content-sha256': payloadHash, 'x-amz-date': amzDate, authorization: auth, ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body || undefined,
  });
}

async function loadPurchases(uid) {
  const r = await s3('GET', 'purchases/' + encodeURIComponent(uid) + '.json');
  if (r.status === 404) return [];
  if (!r.ok) throw new Error('storage ' + r.status);
  return JSON.parse(await r.text());
}

// записываем покупку один раз: повторное уведомление ВКонтакте не даёт второй записи
async function recordPurchase(uid, purchase) {
  if (!uid) return;
  const list = await loadPurchases(uid);
  if (list.some((p) => p.order_id === purchase.order_id)) return;
  list.push(purchase);
  const r = await s3('PUT', 'purchases/' + encodeURIComponent(uid) + '.json', JSON.stringify(list));
  if (!r.ok) throw new Error('storage ' + r.status);
}
