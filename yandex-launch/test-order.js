// Проверка записи покупки: тестовое подтверждение order_status_change_test на функции pryanik-launch.
// Ключ берётся из переменной окружения APP_SECRET на вашем компьютере, в файл и в чат он не попадает.
// Запуск (PowerShell):  $env:APP_SECRET = "ваш ключ"; node test-order.js
// Скрипт записывает одну тестовую покупку для пользователя 1 в бакет (в игру она не попадает).
const crypto = require('crypto');

const URL_FN = 'https://functions.yandexcloud.net/d4e8ajlqi4mjo1lgs395';
const secret = process.env.APP_SECRET || '';
if (!secret) {
  console.log('APP_SECRET не задан. Задайте переменную и запустите снова.');
  process.exit(1);
}

const params = {
  notification_type: 'order_status_change_test',
  item_id: 'double',
  user_id: '1',
  order_id: 'test-' + Date.now(),
  app_id: '54907536',
  receiver_id: '1',
  status: 'chargeable',
  lang: 'ru',
};
// подпись ВКонтакте: md5 от «ключ=значение» по алфавиту (без sig) + ключ приложения
const keys = Object.keys(params).sort();
const base = keys.map((k) => k + '=' + params[k]).join('') + secret;
params.sig = crypto.createHash('md5').update(base, 'utf8').digest('hex');

(async () => {
  const body = new URLSearchParams(params).toString();
  const started = Date.now();
  const r = await fetch(URL_FN, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  console.log('HTTP', r.status, 'за', Date.now() - started, 'мс');
  console.log(await r.text());
})().catch((e) => console.log('Ошибка запроса:', e.message));
