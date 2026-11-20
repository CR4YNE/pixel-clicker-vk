// Куча Пряников: проверка параметров запуска ВКонтакте на Яндекс Облаке (облачная функция).
// Та же логика, что в vk-payments/worker.js (/launch): подпись vk_* параметров HMAC-SHA256 ключом APP_SECRET.
// APP_SECRET задаётся в настройках функции (переменная окружения), в коде его нет.
const crypto = require('crypto');

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'access-control-allow-origin': '*',
};

function reply(statusCode, body) {
  return { statusCode, headers: HEADERS, body: JSON.stringify(body) };
}

module.exports.handler = async function (event) {
  const q = event.queryStringParameters || {};
  const secret = process.env.APP_SECRET || '';
  const sign = q.sign || '';

  // берём все vk_* параметры, сортируем по имени и склеиваем «имя=значение» через «&»
  const keys = Object.keys(q).filter((k) => k.startsWith('vk_')).sort();
  if (!secret || !sign || keys.length === 0) return reply(403, { ok: false });

  const base = keys.map((k) => k + '=' + q[k]).join('&');
  const mac = crypto.createHmac('sha256', secret).update(base).digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  if (mac !== sign) return reply(403, { ok: false });
  return reply(200, { ok: true });
};
