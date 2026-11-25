// «Куча Монет: Кликер» — step 2: economy and the shop panel.
// Canvas 320x180 in game pixels, shown at an integer scale with no smoothing.
// Coins are BigInt (full digits, no abbreviations).
(function () {
  'use strict';

  const VERSION = '1.1.0-PHONE';   // capitals only: the font has no lowercase letters
  const W = 320;
  const H = 180;
  const SCENE_CROP_X = (W - 180) / 2;   // the phone screen shows the middle 180 px of the scene
  const SCENE_UP = 20;          // the scene moves up by this much: the empty wall at its top is cut off; the menu stays
  const COIN_R = 42;            // radius used for the shadow and the layout
  const HIT_R = 67;             // click zone: cookie half-width (37) + 30 px margin = 134 px across
  const COIN_Y = 104;           // cookie centre (moved down to make room under the counter)
  const COIN_X_CLOSED = 160;
  const COIN_X_OPEN = 160;      // the cookie stays in the middle: the shop is a sheet under it
  const COUNTER_LABEL_Y = 28;   // «ПРЯНИКОВ» cap line (5 px below the shop button)
  const COUNTER_NUM_Y = 38;     // big number cap line
  const COUNTER_AUTO_Y = 58;    // small line: automatic coins per second
  const FLOOR_Y = 160;          // the bottom strip is now only 20 px tall
  // top row: НАСТРОЙКИ | ПРОГРЕСС | УРОВЕНЬ N | МАГАЗИН
  // 4 px from the screen edges and 4 px between buttons, 19 px tall, widths fitted to the text
  const TOP_Y0 = 3, TOP_Y1 = 21, TOP_GAP = 3, TOP_MARGIN = 3;   // 18 px tall; 1 px less from the top, the sides and between buttons
  const TOP_BUTTONS = [
    { id: 'settings', w: 70 },
    { id: 'achievements', w: 79 },
    { id: 'level', w: 93 },
    { id: 'shop', w: 63 },   // stretched so its right edge is 3 px from the screen edge, like the settings button on the left
  ];
  // phone: the four buttons sit under the scene, in two rows of two (rows at y 180 and 200)
  const PHONE_ROW_Y = [182, 204], PHONE_BTN_W = 85, PHONE_BTN_H = 18;   // the first row starts 4 px under the table: 2 px moved down
  function topRect(id) {
    const i = TOP_BUTTONS.findIndex((b) => b.id === id);
    if (i < 0) return null;
    const col = i % 2, row = Math.floor(i / 2);
    const x = SCENE_CROP_X + TOP_MARGIN + col * (PHONE_BTN_W + TOP_GAP);   // inside the visible 180 px of the scene
    return [x, x + PHONE_BTN_W, PHONE_ROW_Y[row], PHONE_ROW_Y[row] + PHONE_BTN_H];
  }
  const [BTN_X0, BTN_X1, BTN_Y0, BTN_Y1] = topRect('shop');
  const PX0 = 72;               // the shop sheet: the same frame as the other sheets (2 px from the visible edges)
  const PX1 = 248;              // panel right edge
  const LIST_TOP_BASE = 38;     // below the two tab rows (y 4 and 20)
  // the premium tab has 4 section buttons (2 rows) above its list
  const listTop = () => (tab === 'premium' ? 66 : LIST_TOP_BASE);
  // the tabs with the buy-amount row (КЛИК, ТЕХНИКА) keep the close button higher; the other tabs get it lower and a bigger list
  const hasBuyRow = () => tab === 'click' || tab === 'tech';
  const closeY = () => 124;     // the close button: the same level as the close button of the other menus
  // the list ends above the buy row (107) where there is one; without it (прокачки, премиум) the list takes the space down to the close button
  const listBottom = () => (tab === 'premium' ? 122 : hasBuyRow() ? 105 : 123);   // the other tabs get 1 px more of the list
  const ROW_TEXT_W = 160;       // the room for the text in a row
  const rowH = () => (tab === 'premium' ? 20 : 30);   // premium rows have two lines, the machines and the prokachki three
  const PANEL_SPEED = 7;        // 1 = full slide per ~0.15 s
  const MACHINE_GROWTH = 1.10;  // the price of every next machine of the same kind
  const TAP_BASE = 15, TAP_GROWTH = 1.12;   // the price of the next tap purchase
  const STAR_EVERY = 25;        // every 25 machines of one kind (and every 25 tap purchases): x2
  const LEVEL_BASE = 200, LEVEL_GROWTH = 3.45;   // the bakery level: what has to be earned in all time

  // the Latin letters of the e-mails: added to the game's pixel font in the same 6 by 8 style
  const LATIN_GLYPHS = {
    '@': ["..####", "##....", "##..##", "##..##", "##..##", "##....", "..####", "......"],
    'G': ["..####", "##....", "##....", "##..##", "##..##", "##..##", "##..##", "..####"],
    'A': ["..##..", "##..##", "##..##", "######", "##..##", "##..##", "##..##", "##..##"],
    'I': ["######", "..##..", "..##..", "..##..", "..##..", "..##..", "..##..", "######"],
    'L': ["##....", "##....", "##....", "##....", "##....", "##....", "##....", "######"],
    'B': ["####..", "##..##", "##..##", "####..", "##..##", "##..##", "##..##", "####.."],
    'K': ["##..##", "##..##", "####..", "##....", "####..", "##..##", "##..##", "##..##"],
    'D': ["####..", "##..##", "##..##", "##..##", "##..##", "##..##", "##..##", "####.."],
    'Z': ["######", "....##", "..##..", "..##..", "..##..", "##....", "######", "......"],
    'O': ["..##..", "##..##", "##..##", "##..##", "##..##", "##..##", "##..##", "..##.."],
    'S': ["..####", "##....", "##....", "..##..", "....##", "....##", "####..", "......"],
    'M': ["##..##", "######", "######", "##..##", "##..##", "##..##", "##..##", "##..##"],
    'V': ["##..##", "##..##", "##..##", "##..##", "##..##", "##..##", "..##..", "..##.."],
    'P': ["####..", "##..##", "##..##", "####..", "##....", "##....", "##....", "##...."],
    'T': ["######", "..##..", "..##..", "..##..", "..##..", "..##..", "..##..", "..##.."],
    'U': ["##..##", "##..##", "##..##", "##..##", "##..##", "##..##", "##..##", "..##.."],
    'H': ["##..##", "##..##", "##..##", "######", "##..##", "##..##", "##..##", "##..##"],
    '_': ["......", "......", "......", "......", "......", "......", "......", "######"]
  };
  for (const k of Object.keys(LATIN_GLYPHS)) if (!FONT[k]) FONT[k] = { rows: LATIN_GLYPHS[k], above: 0, below: 0 };
  const COL = {
    bg: '#221e40',
    floor: '#2e2854',
    shadow: '#141228',
    outline: '#6b3e12',
    gold: '#ffd84a',
    rim: '#fff3a0',
    rimDark: '#b8860b',
    ring: '#e2b028',
    emblem: '#d6a01e',
    text: '#fff6d6',
    hint: '#aaa0dc',
    btnFrame: '#e6e8ef',        // light silver frame
    btnFrameDk: '#9ea3b5',      // its shadow edge
    btnFill: '#2a2650',
    btnHi: '#3d3775',
    btnText: '#f4f5fa',
    dim: '#8a80b8',
    panel: '#1e1a38',
    panelEdge: '#6e64a0',
    row: '#2c2650',
    rowHi: '#3a3264',
    tabOn: '#5c5096',
    tabOff: '#282248',
    track: '#141228',
    thumb: '#6e64a0',
  };

  // ---------- data (docs/economy-v6.md) ----------
  // the machines in the form "10 ..."
  const FIVE = {
    'МИКСЕР': 'МИКСЕРОВ', 'ПЕЧЬ': 'ПЕЧЕЙ', 'ХОЛОДИЛЬНИК': 'ХОЛОДИЛЬНИКОВ', 'ПЛИТА': 'ПЛИТ', 'КОФЕМАШИНА': 'КОФЕМАШИН',
    'КОНВЕКТОМАТ': 'КОНВЕКТОМАТОВ', 'ШОКОЛАДНЫЙ ФОНТАН': 'ФОНТАНОВ', 'ТЕСТОМЕС': 'ТЕСТОМЕСОВ', 'КОНВЕЙЕР': 'КОНВЕЙЕРОВ', 'ФАБРИКА ПРЯНИКОВ': 'ФАБРИК',
  };
  const fiveOf = (name) => FIVE[name] || name;
  // ТЕХНИКА: each gives `rate` gingerbread per second for every bought one; it opens at the bakery level `level`
  const TECHNIKA = [
    { name: 'МИКСЕР', base: 10, rate: 0.3, level: 1 },
    { name: 'ПЕЧЬ', base: 150, rate: 2, level: 3, she: true },
    { name: 'ХОЛОДИЛЬНИК', base: 2000, rate: 12, level: 5 },
    { name: 'ПЛИТА', base: 25000, rate: 70, level: 7, she: true },
    { name: 'КОФЕМАШИНА', base: 3e5, rate: 400, level: 9, she: true },
    { name: 'КОНВЕКТОМАТ', base: 3.5e6, rate: 2400, level: 11 },
    { name: 'ШОКОЛАДНЫЙ ФОНТАН', base: 4e7, rate: 15000, level: 13, short: 'ФОНТАН' },
    { name: 'ТЕСТОМЕС', base: 4.5e8, rate: 95000, level: 15 },
    { name: 'КОНВЕЙЕР', base: 5e9, rate: 6e5, level: 17 },
    { name: 'ФАБРИКА ПРЯНИКОВ', base: 6e10, rate: 4e6, level: 19, she: true, short: 'ФАБРИКА' },
  ];
  // ПРОКАЧКИ: 4 for each machine, each one makes it x2. It appears with this many machines and costs 5 machines of that price
  const PROK_NEED = [10, 50, 100, 200];
  const PROK_NAMES = [
    ['СЕРЕБРЯНЫЙ ВЕНЧИК', 'ЗОЛОТОЙ ВЕНЧИК', 'ПЛАТИНОВЫЙ ВЕНЧИК', 'ТИТАНОВЫЙ ВЕНЧИК'],
    ['СЕРЕБРЯНЫЙ ПРОТИВЕНЬ', 'ЗОЛОТОЙ ПРОТИВЕНЬ', 'ПЛАТИНОВЫЙ ПРОТИВЕНЬ', 'ТИТАНОВЫЙ ПРОТИВЕНЬ'],
    ['СЕРЕБРЯНЫЙ ХЛАДАГЕНТ', 'ЗОЛОТОЙ ХЛАДАГЕНТ', 'ПЛАТИНОВЫЙ ХЛАДАГЕНТ', 'ТИТАНОВЫЙ ХЛАДАГЕНТ'],
    ['СЕРЕБРЯНАЯ ЗАЖИГАЛКА', 'ЗОЛОТАЯ ЗАЖИГАЛКА', 'ПЛАТИНОВАЯ ЗАЖИГАЛКА', 'ТИТАНОВАЯ ЗАЖИГАЛКА'],
    ['СЕРЕБРЯНЫЙ ФИЛЬТР', 'ЗОЛОТОЙ ФИЛЬТР', 'ПЛАТИНОВЫЙ ФИЛЬТР', 'ТИТАНОВЫЙ ФИЛЬТР'],
    ['СЕРЕБРЯНЫЙ ВЕНТИЛЯТОР', 'ЗОЛОТОЙ ВЕНТИЛЯТОР', 'ПЛАТИНОВЫЙ ВЕНТИЛЯТОР', 'ТИТАНОВЫЙ ВЕНТИЛЯТОР'],
    ['СЕРЕБРЯНАЯ НАСАДКА', 'ЗОЛОТАЯ НАСАДКА', 'ПЛАТИНОВАЯ НАСАДКА', 'ТИТАНОВАЯ НАСАДКА'],
    ['СЕРЕБРЯНЫЙ КРЮК', 'ЗОЛОТОЙ КРЮК', 'ПЛАТИНОВЫЙ КРЮК', 'ТИТАНОВЫЙ КРЮК'],
    ['СЕРЕБРЯНЫЙ РОЛИК', 'ЗОЛОТОЙ РОЛИК', 'ПЛАТИНОВЫЙ РОЛИК', 'ТИТАНОВЫЙ РОЛИК'],
    ['СЕРЕБРЯНЫЙ СТАНОК', 'ЗОЛОТОЙ СТАНОК', 'ПЛАТИНОВЫЙ СТАНОК', 'ТИТАНОВЫЙ СТАНОК'],
  ];
  const PROKACHKI = [];
  for (let k = 0; k < 4; k++) {
    for (let j = 0; j < TECHNIKA.length; j++) {
      PROKACHKI.push({
        name: PROK_NAMES[j][k],
        tech: j,
        need: PROK_NEED[k],
        cost: BigInt(Math.round(5 * TECHNIKA[j].base * Math.pow(MACHINE_GROWTH, PROK_NEED[k]))),
      });
    }
  }
  // ПРЕМИУМ (ян, пока без оплаты: кнопки заглушки) и бусты за рекламу (10 минут)
  const PREMIUM_ITEMS = [
    { kind: 'premium', id: 'double', name: '2Х ДОХОД', line: 'НАВСЕГДА', price: '6 ГОЛОСОВ' },
    { kind: 'premium', id: 'level2', name: '2Х БОНУС УРОВНЯ', line: 'НАВСЕГДА', price: '6 ГОЛОСОВ' },
    { kind: 'premium', id: 'discount', name: 'СКИДКА 50% НА ВСЕ', line: 'КРОМЕ ПРЕМИУМА', price: '6 ГОЛОСОВ' },
    { kind: 'premium', id: 'triple', name: '3Х ДОХОД', line: 'НАВСЕГДА', price: '10 ГОЛОСОВ' },
    { kind: 'premium', id: 'autoclick', name: 'АВТО-КЛИК', line: '10 В СЕКУНДУ', price: '4 ГОЛОСА' },
    { kind: 'premium', id: 'bundle', name: 'ПАКЕТ ВСЁ ВМЕСТЕ', line: 'НАВСЕГДА', price: '30 ГОЛОСОВ' },
    { kind: 'premium', id: 'noads', name: 'ОТКЛЮЧЕНИЕ РЕКЛАМЫ', line: 'НАВСЕГДА', price: '14 ГОЛОСОВ' },
    { kind: 'premium', id: 'hours1', hours: 1, name: 'ПРЯНИКИ ЗА 1 ЧАС', line: '', price: '2 ГОЛОСА' },
    { kind: 'premium', id: 'hours3', hours: 3, name: 'ПРЯНИКИ ЗА 3 ЧАСА', line: '', price: '4 ГОЛОСА' },
    { kind: 'premium', id: 'hours8', hours: 8, name: 'ПРЯНИКИ ЗА 8 ЧАСОВ', line: '', price: '10 ГОЛОСОВ' },
    { kind: 'premium', id: 'hours24', hours: 24, name: 'ПРЯНИКИ ЗА 24 ЧАСА', line: '', price: '25 ГОЛОСОВ' },
    { kind: 'ad', id: 'double', name: '2Х ДОХОД', line: '10 МИНУТ', price: 'РЕКЛАМА' },
    { kind: 'ad', id: 'discount', name: 'СКИДКА 50% НА ВСЕ', line: '10 МИНУТ', price: 'РЕКЛАМА' },
    { kind: 'premium', id: 'skin_royal', name: 'КОРОЛЕВСКИЙ', line: 'ЗОЛОТО И КОРОНА', price: '1 ГОЛОС' },
    { kind: 'premium', id: 'skin_ghost', name: 'ПРИЗРАЧНЫЙ', line: 'ДУХИ И ТУМАН', price: '1 ГОЛОС' },
    { kind: 'premium', id: 'skin_neontube', name: 'НЕОНОВЫЙ', line: 'ТРУБКА И СВЕЧЕНИЕ', price: '1 ГОЛОС' },
    { kind: 'premium', id: 'skin_crystal', name: 'КРИСТАЛЛ', line: 'ЛЁД И СНЕЖИНКИ', price: '1 ГОЛОС' },
    { kind: 'premium', id: 'skin_volcano', name: 'ВУЛКАНИЧЕСКИЙ', line: 'ЛАВА И ИСКРЫ', price: '1 ГОЛОС' },
    { kind: 'premium', id: 'skin_solar', name: 'СОЛНЕЧНАЯ СИСТЕМА', line: '8 ПЛАНЕТ ВОКРУГ', price: '1 ГОЛОС' },
    { kind: 'premium', id: 'skin_starry', name: 'ЗВЁЗДНАЯ НОЧЬ', line: 'ЗВЁЗДЫ И ЛУНА', price: '1 ГОЛОС' },
    { kind: 'premium', id: 'skin_caramel', name: 'КАРАМЕЛЬНЫЙ', line: 'КАПЛИ И ЛУЖИЦА', price: '1 ГОЛОС' },
    { kind: 'premium', id: 'skin_gzhel', name: 'ГЖЕЛЬ', line: 'СИНИЕ УЗОРЫ', price: '1 ГОЛОС' },
    { kind: 'premium', id: 'skin_rainbow', name: 'РАДУЖНЫЙ', line: 'ДУГА И КОНФЕТТИ', price: '1 ГОЛОС' },
    { kind: 'premium', id: 'skin_neon', name: 'КОСМИЧЕСКИЙ', line: 'ЗВЁЗДЫ И ИСКРЫ', price: '1 ГОЛОС' },
    { kind: 'premium', id: 'skin_sea', name: 'МОРСКОЙ', line: 'ПУЗЫРИ И РЫБКА', price: '1 ГОЛОС' },
    { kind: 'premium', id: 'skin_halloween', name: 'ХЭЛЛОУИН', line: 'ЛЕТУЧИЕ МЫШИ', price: '1 ГОЛОС' },
    { kind: 'premium', id: 'skin_easter', name: 'ПАСХАЛЬНЫЙ', line: 'ЯЙЦА И ЛЕПЕСТКИ', price: '1 ГОЛОС' },
    { kind: 'premium', id: 'skin_zefir', name: 'ЗЕФИРНЫЙ', line: 'ОБЛАКО И СЕРДЦА', price: '1 ГОЛОС' },
    { kind: 'premium', id: 'skin_newyear', name: 'НОВОГОДНИЙ', line: 'ЁЛКА И САНИ', price: '1 ГОЛОС' },
    { kind: 'premium', id: 'skins_all', name: 'ВСЕ СКИНЫ', line: 'СЕЙЧАС: 1 СКИН', price: '5 ГОЛОСОВ' },
  ];
  // the units after a million, each a thousand times the one before; after the last one the number is written as 1.23Е48
  const UNITS = ['М', 'МЛД', 'ТРЛ', 'КВДР', 'КВНТ', 'СКСТ', 'СПТ', 'ОКТ', 'НОН', 'ДЕЦ', 'УНД', 'ДУОД', 'ТРЕД'];
  const COUNTER_MAX_W = 150;
  const AD_BOOST_SECONDS = 600;
  // which skin each premium shop item shows in its purchase preview (a new skin: add it here too)
  const PREMIUM_SKIN_OF = { skin_solar: 'solar', skin_neon: 'neon', skin_volcano: 'volcano', skin_neontube: 'neontube', skin_crystal: 'crystal', skin_royal: 'royal', skin_ghost: 'ghost', skin_rainbow: 'rainbow', skin_starry: 'starry', skin_newyear: 'newyear', skin_zefir: 'zefir', skin_caramel: 'caramel', skin_gzhel: 'gzhel', skin_halloween: 'halloween', skin_easter: 'easter', skin_sea: 'sea', skins_all: 'neon' };
  // every premium skin in SKINS (including the ones added later) becomes owned with the bundle
  function unlockAllPremiumSkins() {
    for (const k of SKINS) if (k.premium) skinOwned[k.id] = true;
  }
  // every premium skin: the bundle needs all of them
  const PREMIUM_SKIN_IDS = ['royal', 'ghost', 'neontube', 'crystal', 'volcano', 'solar', 'starry', 'caramel', 'gzhel', 'rainbow', 'neon', 'sea', 'halloween', 'easter', 'zefir', 'newyear'];
  // what each premium purchase does, for the confirmation and the "purchased" windows
  const PREMIUM_INFO = {
    double: { name: '2Х ДОХОД', lines: ['ДВОЙНОЙ ДОХОД ПРЯНИКОВ', 'УМНОЖАЕТСЯ С 3Х, НАВСЕГДА'] },
    noads: { name: 'ОТКЛЮЧЕНИЕ РЕКЛАМЫ', lines: ['В ИГРЕ НЕТ НИКАКОЙ РЕКЛАМЫ. ВСЕ НАГРАДЫ ЗА РЕКЛАМУ ДАЮТСЯ СРАЗУ ПО НАЖАТИЮ (НО НЕ ЧАЩЕ РАЗА В МИНУТУ)', 'НАВСЕГДА'] },
    bundle: { name: 'ПАКЕТ ВСЁ ВМЕСТЕ', lines: ['2Х, 3Х, АВТО-КЛИК, СКИДКА, БЕЗ РЕКЛАМЫ, 2Х БОНУС УРОВНЯ', 'НАВСЕГДА'] },
    triple: { name: '3Х ДОХОД', lines: ['ТРОЙНОЙ ДОХОД', 'УМНОЖАЕТСЯ С 2Х, НАВСЕГДА'] },
    autoclick: { name: 'АВТО-КЛИК', lines: ['10 В СЕКУНДУ', 'НАВСЕГДА'] },
    level2: { name: '2Х БОНУС УРОВНЯ', lines: ['КАЖДЫЙ УРОВЕНЬ ПЕКАРНИ ДАЁТ +20% ДОХОДА ВМЕСТО +10%', 'НАВСЕГДА'] },
    discount: { name: 'СКИДКА 50% НА ВСЕ', lines: ['ВСЕ УЛУЧШЕНИЯ ДЕШЕВЛЕ ВДВОЕ', 'КРОМЕ ПРЕМИУМА, НАВСЕГДА'] },
    skin_neon: { name: 'КОСМИЧЕСКИЙ', lines: ['ЗВЁЗДЫ И ИСКРЫ', 'НАВСЕГДА'] },
    skin_volcano: { name: 'ВУЛКАНИЧЕСКИЙ', lines: ['ЛАВА И ИСКРЫ', 'НАВСЕГДА'] },
    skin_neontube: { name: 'НЕОНОВЫЙ', lines: ['ТРУБКА И СВЕЧЕНИЕ', 'НАВСЕГДА'] },
    skin_crystal: { name: 'КРИСТАЛЛ', lines: ['ЛЁД И СНЕЖИНКИ', 'НАВСЕГДА'] },
    skin_royal: { name: 'КОРОЛЕВСКИЙ', lines: ['ЗОЛОТО И КОРОНА', 'НАВСЕГДА'] },
    skin_ghost: { name: 'ПРИЗРАЧНЫЙ', lines: ['ДУХИ И ТУМАН', 'НАВСЕГДА'] },
    skin_rainbow: { name: 'РАДУЖНЫЙ', lines: ['ДУГА И КОНФЕТТИ', 'НАВСЕГДА'] },
    skin_starry: { name: 'ЗВЁЗДНАЯ НОЧЬ', lines: ['ЗВЁЗДЫ И ЛУНА', 'НАВСЕГДА'] },
    skin_newyear: { name: 'НОВОГОДНИЙ', lines: ['ЁЛКА И САНИ', 'НАВСЕГДА'] },
    skin_zefir: { name: 'ЗЕФИРНЫЙ', lines: ['ОБЛАКО И СЕРДЦА', 'НАВСЕГДА'] },
    skin_caramel: { name: 'КАРАМЕЛЬНЫЙ', lines: ['КАПЛИ И ЛУЖИЦА', 'НАВСЕГДА'] },
    skin_gzhel: { name: 'ГЖЕЛЬ', lines: ['СИНИЕ УЗОРЫ', 'НАВСЕГДА'] },
    skin_halloween: { name: 'ХЭЛЛОУИН', lines: ['ЛЕТУЧИЕ МЫШИ', 'НАВСЕГДА'] },
    skin_easter: { name: 'ПАСХАЛЬНЫЙ', lines: ['ЯЙЦА И ЛЕПЕСТКИ', 'НАВСЕГДА'] },
    skin_solar: { name: 'СОЛНЕЧНАЯ СИСТЕМА', lines: ['8 ПЛАНЕТ ВОКРУГ', 'НАВСЕГДА'] },
    skin_sea: { name: 'МОРСКОЙ', lines: ['ПУЗЫРИ И РЫБКА', 'НАВСЕГДА'] },
    skins_all: { name: 'ВСЕ СКИНЫ', lines: ['ВЕСЬ АССОРТИМЕНТ СКИНОВ', 'НАВСЕГДА'] },   // the count of premium skins is shown in the purchase window
  };
  const canvas = document.getElementById('game');
  // phone: the screen is 180 x 320; the 320 x 180 scene is drawn into a buffer, and its middle 180 px show at the top
  const PHONE_W = 180, PHONE_H = 320;
  canvas.width = PHONE_W;
  canvas.height = PHONE_H;
  const screenCtx = canvas.getContext('2d');
  const sceneCanvas = document.createElement('canvas');
  sceneCanvas.width = W;
  sceneCanvas.height = 320;   // the whole phone screen: the scene on top, the buttons panel below
  let ctx = sceneCanvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  // the appearance button is drawn on its own small picture and put on the screen 4 px above НАСТРОЙКИ
  const skinBtnCanvas = document.createElement('canvas');
  skinBtnCanvas.width = W;
  skinBtnCanvas.height = 20;
  const skinBtnCtx = skinBtnCanvas.getContext('2d');

  // ---------- pixel font ----------
  function glyphWidth(ch) {
    return ch === ' ' || !FONT[ch] ? FONT_SPACE_W : FONT[ch].rows[0].length;   // a missing letter is a space, not a crash
  }
  function textWidth(str, sc) {
    let total = 0;
    for (const ch of str) total += glyphWidth(ch) * sc + sc;
    return total - sc;
  }
  // small 5 px pixel font (3 px wide glyphs) for the small counter line: digits, +, В, С, Е, К and space
  const SMALL_FONT = {
    '0': ['###', '#.#', '#.#', '#.#', '###'],
    '1': ['.#.', '##.', '.#.', '.#.', '###'],
    '2': ['###', '..#', '###', '#..', '###'],
    '3': ['###', '..#', '###', '..#', '###'],
    '4': ['#.#', '#.#', '###', '..#', '..#'],
    '5': ['###', '#..', '###', '..#', '###'],
    '6': ['###', '#..', '###', '#.#', '###'],
    '7': ['###', '..#', '..#', '..#', '..#'],
    '8': ['###', '#.#', '###', '#.#', '###'],
    '9': ['###', '#.#', '###', '..#', '###'],
    '+': ['...', '.#.', '###', '.#.', '...'],
    'В': ['##.', '#.#', '##.', '#.#', '##.'],
    'С': ['.##', '#..', '#..', '#..', '.##'],
    'Е': ['###', '#..', '##.', '#..', '###'],
    'К': ['#.#', '#.#', '##.', '#.#', '#.#'],
    ' ': ['..', '..', '..', '..', '..'],
    // the letters of the units (М, МЛД, ТРЛ, КВДР...) and the point
    '.': ['.', '.', '.', '.', '#'],
    'М': ['#...#', '##.##', '#.#.#', '#...#', '#...#'],
    'Л': ['.##', '#.#', '#.#', '#.#', '#.#'],
    'Д': ['..##.', '.#.#.', '.#.#.', '#####', '#...#'],
    'Т': ['###', '.#.', '.#.', '.#.', '.#.'],
    'Р': ['##.', '#.#', '##.', '#..', '#..'],
    'Н': ['#.#', '#.#', '###', '#.#', '#.#'],
    'П': ['###', '#.#', '#.#', '#.#', '#.#'],
    'О': ['###', '#.#', '#.#', '#.#', '###'],
    'Ц': ['#.#.', '#.#.', '#.#.', '####', '...#'],
    'У': ['#.#', '#.#', '.##', '..#', '##.'],
    'Ш': ['#.#.#', '#.#.#', '#.#.#', '#.#.#', '#####'],
    '[': ['##', '#.', '#.', '#.', '##'],
    ']': ['##', '.#', '.#', '.#', '##'],
  };
  function smallTextWidth(str) {
    let w = 0;
    for (const ch of str) w += SMALL_FONT[ch][0].length + 1;
    return w - 1;
  }
  function drawSmallText(str, cx, y, color) {
    const x0 = cx - Math.floor(smallTextWidth(str) / 2);
    ctx.fillStyle = color;
    let x = x0;
    for (const ch of str) {
      const rows = SMALL_FONT[ch];
      for (let j = 0; j < rows.length; j++) {
        for (let i = 0; i < rows[j].length; i++) {
          if (rows[j][i] === '#') ctx.fillRect(x + i, y + j, 1, 1);
        }
      }
      x += rows[0].length + 1;
    }
  }

  // centres a string inside the box [x0,x1) x [y0,y1) using the real glyph widths and cap height
  function drawTextBox(str, sc, x0, x1, y0, y1, color) {
    const left = x0 + Math.floor((x1 - x0 - textWidth(str, sc)) / 2);
    const top = y0 + Math.floor((y1 - y0 - 8 * sc) / 2);
    drawText(str, sc, left, top, color, 'left');
  }

  // align: 'center' (x is the middle) or 'left' (x is the left edge)
  function drawText(str, sc, x, yCap, color, align) {
    const total = textWidth(str, sc);
    // whole pixels only: a half-pixel start (e.g. a centre at 273.5) blurs every glyph edge
    let cx = Math.round(align === 'left' ? x : x - Math.floor(total / 2));
    yCap = Math.round(yCap);
    ctx.fillStyle = color;
    for (const ch of str) {
      if (ch !== ' ' && FONT[ch]) {   // a letter the font does not have is skipped
        const g = FONT[ch];
        for (let j = 0; j < g.rows.length; j++) {
          const row = g.rows[j];
          const gy = yCap + (j - g.above) * sc;
          for (let i = 0; i < row.length; i++) {
            if (row[i] === '#') ctx.fillRect(cx + i * sc, gy, sc, sc);
          }
        }
      }
      cx += glyphWidth(ch) * sc + sc;
    }
  }

  // a text with a dark edge, so it can be read on the light wall
  const EDGE = '#4a2c38', EDGE_AT = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1], [0, 2]];
  function drawTextO(str, sc, x, y, color) {
    for (const [dx, dy] of EDGE_AT) drawText(str, sc, x + dx, y + dy, EDGE, 'center');
    drawText(str, sc, x, y, color, 'center');
  }
  // the counter with its edge: drawn into its own picture only when the numbers change
  const CNT_W = 240, CNT_H = 48;
  const cntCv = [0, 1].map(() => { const c = document.createElement('canvas'); c.width = CNT_W; c.height = CNT_H; return c; });
  let cntKey = '';
  function drawCounter(cx) {
    const num = coinsText(), auto = '+' + rateText(autoPerSec()) + ' В СЕК', key = num + '|' + auto, top = COUNTER_LABEL_Y - 6;
    if (key !== cntKey) {
      cntKey = key;
      const main = ctx, [a, b] = cntCv.map((c) => c.getContext('2d'));
      ctx = a;                                     // the letters
      a.clearRect(0, 0, CNT_W, CNT_H);
      drawText('ПРЯНИКОВ', 1, CNT_W / 2, COUNTER_LABEL_Y - top, COL.text, 'center');
      drawText(num, 2, CNT_W / 2, COUNTER_NUM_Y - top, COL.text, 'center');
      drawSmallText(auto, CNT_W / 2, COUNTER_AUTO_Y - top, '#ffffff');
      ctx = main;
      b.globalCompositeOperation = 'source-over';
      b.clearRect(0, 0, CNT_W, CNT_H);
      for (const [dx, dy] of EDGE_AT) b.drawImage(cntCv[0], dx, dy);
      b.globalCompositeOperation = 'source-in';   // the edge takes one dark colour
      b.fillStyle = EDGE; b.fillRect(0, 0, CNT_W, CNT_H);
      b.globalCompositeOperation = 'source-over';
      b.drawImage(cntCv[0], 0, 0);
    }
    ctx.drawImage(cntCv[1], cx - CNT_W / 2, top);
  }

  // ---------- coin sprite ----------
  function pointInPoly(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i];
      const [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-9) + xi) inside = !inside;
    }
    return inside;
  }
  // rx, ry: radii in game pixels. Returns an offscreen canvas with the coin.
  function makeCoin(rx, ry, withStar) {
    const size = Math.ceil(Math.max(rx, ry) * 2);
    const cv = document.createElement('canvas');
    cv.width = size;
    cv.height = size;
    const g = cv.getContext('2d');
    const c = (size - 1) / 2;
    const squash = ry / rx;
    const outer = rx * 0.38;
    const innerR = outer * 0.45;
    const star = [];
    for (let k = 0; k < 10; k++) {
      const r = k % 2 === 0 ? outer : innerR;
      const a = -Math.PI / 2 + (k * Math.PI) / 5;
      star.push([c + r * Math.cos(a), c + r * Math.sin(a) * squash]);
    }
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = (x - c) / rx;
        const dy = (y - c) / ry;
        if (dx * dx + dy * dy > 1) continue;
        const ix = (x - c) / (rx - 2);
        const iy = (y - c) / (ry - 2);
        let col;
        if (ix * ix + iy * iy > 1) {
          col = COL.outline;
        } else {
          const light = (c - x) * 0.6 + (c - y) * 0.8;
          if (light > rx * 0.55) col = COL.rim;
          else if (light < -rx * 0.45) col = COL.rimDark;
          else col = COL.gold;
          const rxx = (x - c) / (rx * 0.72);
          const ryy = (y - c) / (ry * 0.72);
          const ring = rxx * rxx + ryy * ryy;
          if (ring >= 0.9 && ring <= 1.1) col = COL.ring;
          if (withStar && pointInPoly(x, y, star)) col = COL.emblem;
        }
        g.fillStyle = col;
        g.fillRect(x, y, 1, 1);
      }
    }
    return cv;
  }
  // the clickable object is the plain gingerbread C (original colours); three frames
  const COOKIE_SIZE = 74;
  let cookieImg = null;
  let FRAME = null;
  function makeFrames() {
    const scaled = (w, h) => {
      const cv = document.createElement('canvas');
      cv.width = w;
      cv.height = h;
      const g = cv.getContext('2d');
      g.imageSmoothingEnabled = false;
      g.drawImage(cookieImg, 0, 0, w, h);
      // measure the visible pixels so the drawn C is centred, not its empty sprite box
      const a = g.getImageData(0, 0, w, h).data;
      let minx = w, maxx = -1, miny = h, maxy = -1;
      for (let yy = 0; yy < h; yy++) {
        for (let xx = 0; xx < w; xx++) {
          if (a[(yy * w + xx) * 4 + 3] > 0) {
            if (xx < minx) minx = xx;
            if (xx > maxx) maxx = xx;
            if (yy < miny) miny = yy;
            if (yy > maxy) maxy = yy;
          }
        }
      }
      cv.shiftX = (minx + maxx + 1) / 2 - w / 2;
      cv.shiftY = (miny + maxy + 1) / 2 - h / 2;
      cv.alpha = a;   // the cookie's own shape, for hiding things behind it
      return cv;
    };
    return {
      rest: scaled(COOKIE_SIZE, COOKIE_SIZE),
      squash: scaled(80, 66),   // squashed on click
      bounce: scaled(76, 76),   // springs back
    };
  }
  // skins: the gingerbread image for each skin; the chosen one is loaded and the frames rebuilt
  const SKINS = [
    { id: 'classic', name: 'КЛАССИЧЕСКИЙ', src: 'art/cookie-plain.png', ready: true },
    { id: 'banana', name: 'БАНАНОВЫЙ', src: 'art/cookie-banana.png', ready: true },
    { id: 'chocolate', name: 'ШОКОЛАДНЫЙ', src: 'art/cookie-chocolate.png', ready: true },
    { id: 'vanilla', name: 'ВАНИЛЬНЫЙ', src: 'art/cookie-vanilla.png', ready: true },
    { id: 'strawberry', name: 'КЛУБНИЧНЫЙ', src: 'art/cookie-strawberry.png', ready: true },
    { id: 'mint', name: 'МЯТНЫЙ', src: 'art/cookie-mint.png', ready: true },
    { id: 'ice', name: 'ЛЕДЯНОЙ', src: 'art/cookie-ice.png', ready: true },
    { id: 'gold', name: 'ЗОЛОТОЙ', src: 'art/cookie-gold.png', ready: true },
    { id: 'royal', name: 'КОРОЛЕВСКИЙ', src: 'art/cookie-royal.png?v=1', ready: true, premium: true },
    { id: 'ghost', name: 'ПРИЗРАЧНЫЙ', src: 'art/cookie-ghost.png?v=1', ready: true, premium: true },
    { id: 'neontube', name: 'НЕОНОВЫЙ', src: 'art/cookie-neontube.png?v=1', ready: true, premium: true },
    { id: 'crystal', name: 'КРИСТАЛЛ', src: 'art/cookie-crystal.png?v=1', ready: true, premium: true },
    { id: 'volcano', name: 'ВУЛКАНИЧЕСКИЙ', src: 'art/cookie-volcano.png?v=1', ready: true, premium: true },
    { id: 'solar', name: 'СОЛНЕЧНАЯ СИСТЕМА', src: 'art/cookie-solar.png?v=1', ready: true, premium: true },
    { id: 'starry', name: 'ЗВЁЗДНАЯ НОЧЬ', src: 'art/cookie-starry.png?v=1', ready: true, premium: true },
    { id: 'caramel', name: 'КАРАМЕЛЬНЫЙ', src: 'art/cookie-caramel.png?v=2', ready: true, premium: true },
    { id: 'gzhel', name: 'ГЖЕЛЬ', src: 'art/cookie-gzhel.png?v=2', ready: true, premium: true },
    { id: 'rainbow', name: 'РАДУЖНЫЙ', src: 'art/cookie-rainbow.png?v=3', ready: true, premium: true },
    { id: 'neon', name: 'КОСМИЧЕСКИЙ', src: 'art/cookie-neon.png?v=1', ready: true, premium: true },
    { id: 'sea', name: 'МОРСКОЙ', src: 'art/cookie-sea.png?v=1', ready: true, premium: true },
    { id: 'halloween', name: 'ХЭЛЛОУИН', src: 'art/cookie-halloween.png?v=2', ready: true, premium: true },
    { id: 'easter', name: 'ПАСХАЛЬНЫЙ', src: 'art/cookie-easter.png?v=2', ready: true, premium: true },
    { id: 'zefir', name: 'ЗЕФИРНЫЙ', src: 'art/cookie-zefir.png?v=1', ready: true, premium: true },
    { id: 'newyear', name: 'НОВОГОДНИЙ', src: 'art/cookie-newyear.png?v=7', ready: true, premium: true },
  ];
  // skins are owned: the plain one from the start, the others come from the daily reward (day 1 gives skin 2, day 2 skin 3, ...)
  const skinOwned = { classic: true };
  const skinAdViews = {};        // ads watched towards each skin (3 for a usual skin, 8 for a premium one)
  const skinAdNeed = (k) => (k.premium ? 8 : 3);
  const skinThumbs = {};
  SKINS.forEach((k) => { if (k.src) { const im = new Image(); im.src = k.src; skinThumbs[k.id] = im; } });
  let skinId = 'classic';
  function loadSkin(id) {
    const skin = SKINS.find((k) => k.id === id);
    if (!skin || !skin.ready || !skinOwned[id]) return;
    skinId = id;
    const img = new Image();
    img.onload = () => { if (skinId === id) { cookieImg = img; FRAME = makeFrames(); } };   // a late older image must not replace the chosen skin
    img.src = skin.src;
  }
  loadSkin('classic');

  // ---------- economy ----------
  let coins = 0n;
  let tapLv = 0;                 // how many times the tap was bought (saved)
  let techOwned = TECHNIKA.map(() => 0);
  let prokOwned = PROKACHKI.map(() => false);
  let premiumOwned = { double: false, triple: false, autoclick: false, level2: false, discount: false, noads: false };   // kept apart from the progress
  let adBoost = { double: 0, discount: 0 };   // seconds left
  // the time left of a free ad in minutes and seconds, updated every frame
  const adTimeLeft = (id) => { const s = Math.ceil(adBoost[id]); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const noticeLines = () => (typeof noticeWin.lines === 'function' ? noticeWin.lines() : noticeWin.lines);
  let progWin = null;            // progress window: {tab: 'stats' | 'ach' | 'top'}
  let shopReturn = false;        // the shop was open when another menu opened: it comes back when that menu closes
  let skinWin = false;           // the appearance window (ВНЕШНИЙ ВИД)
  let totalEarned = 0n;          // coins earned in all time (saved)
  let resetAt = 0;               // when the progress was last reset (ms, saved): a save with a later reset always wins the cloud comparison
  let playerClicks = 0;          // taps on the cookie by the player (saved)
  let playSec = 0;               // seconds played (saved)
  // counters of the achievements (saved)
  let custServed = 0;            // customers served
  let questsDone = 0;            // quests done
  let treatsEaten = 0;           // ПОПРОБУЙ! dishes eaten
  let minutesSeen = 0;           // cooking minutes
  let bonyaWoken = 0;            // times Боня was woken up
  let offlineTaken = 0;          // times the income of an absence was taken
  let bestPerSec = 0;            // the highest income per second ever
  // daily reward: 7 days in a row, one claim per Moscow day, needs 5 minutes played that day
  let dailyDay = 0;              // the day number claimed last (0 = never; 1..7)
  let dailyDate = '';            // the Moscow date of the last claim (YYYY-MM-DD)
  let dailySec = 0;              // seconds played on dailySecDate
  let dailySecDate = '';
  const DAILY_NEED = 300;        // 5 minutes
  let dailyPreview = null;       // the day (1..7) whose skin is shown in the preview, or null for the grid
  let totalBought = 0;           // all the purchases for gingerbread (saved)
  let premiumWin = null;         // premium purchase window: {mode: 'confirm' | 'pending' | 'done' | 'error', idx, msg}
  let autoAcc = 0;               // fractional coins from technika
  let tapAcc = 0;                // fractional coins from taps

  // every gingerbread comes through here: the bakery level grows from all that was ever earned
  function earn(n) { coins += n; totalEarned += n; }

  // ---------- the bakery level: from level L to L+1 it takes 200 x 3.45^(L-1) earned in all time ----------
  let bakeryLevel = 1;           // counted from totalEarned
  let lvlPending = null;         // {from}: a new level whose window is not shown yet (it waits for the other windows)
  let lvlWin = null;             // {level, gained, opened, t} while the window of a new level is open
  const levelNeed = (L) => LEVEL_BASE * Math.pow(LEVEL_GROWTH, L - 1);
  function levelFor(earned) {
    const e = Number(earned);
    let L = 1;
    while (L < 500 && e >= levelNeed(L)) L++;
    return L;
  }
  // how much of the way to the next level is done, 0..1
  function levelProgress() {
    const from = bakeryLevel === 1 ? 0 : levelNeed(bakeryLevel - 1), to = levelNeed(bakeryLevel);
    return Math.max(0, Math.min(1, (Number(totalEarned) - from) / (to - from)));
  }
  const levelPercent = () => (premiumOwned.level2 ? 20 : 10);   // each level adds this much to the whole income
  function levelMult() { return (100 + levelPercent() * (bakeryLevel - 1)) / 100; }
  function updateLevel() {
    if (Number(totalEarned) >= levelNeed(bakeryLevel)) {
      if (!lvlPending) lvlPending = { from: bakeryLevel };
      bakeryLevel = levelFor(totalEarned);
      saveGame();
    }
    if (!lvlPending || lvlWin) return;
    // the window waits until every other window is closed (the shop does not stop it)
    if (custMenuOpen() || premiumWin || skinOffer || resetWin || noticeWin || offlineWin || consentOpen || splashT > 0 || loadingLeft > 0 || sale || (cust && cust.sold) || rewardAdOpen || launchState !== 'ok') return;
    const from = lvlPending.from;
    lvlPending = null;
    lvlWin = { level: bakeryLevel, gained: bakeryLevel - from, opened: TECHNIKA.filter((m) => m.level > from && m.level <= bakeryLevel), t: 0 };
    startSalute();
    sfxLevel();
  }

  // stars of one machine (and of the tap): one for every 25
  const starsOf = (owned) => Math.floor(owned / STAR_EVERY);
  // how many times a machine's output is multiplied: x2 for each star and for each of its prokachki
  function techMult(j) {
    let m = Math.pow(2, starsOf(techOwned[j]));
    PROKACHKI.forEach((p, i) => { if (p.tech === j && prokOwned[i]) m *= 2; });
    return m;
  }
  // everything that multiplies the whole income: the level, premium 2x and 3x, the ad 2x, the quest 2x
  function incomeMult() {
    const premiumMult = (premiumOwned.double ? 2 : 1) * (premiumOwned.triple ? 3 : 1);   // 2x and 3x stack: both give 6x
    return premiumMult * (adBoost.double > 0 ? 2 : 1) * (questBoost > 0 ? 2 : 1) * levelMult();
  }
  function discountOn() {
    return premiumOwned.discount || adBoost.discount > 0;
  }
  // what one kind of machines brings per second (one machine when none is bought yet)
  function machineIncome(j) {
    return TECHNIKA[j].rate * Math.max(1, techOwned[j]) * techMult(j) * incomeMult() * (glazeTech > 0 ? 2 : 1);
  }
  function autoPerSec() {
    let r = 0;
    TECHNIKA.forEach((t, j) => { if (techOwned[j] > 0) r += t.rate * techOwned[j] * techMult(j); });
    return r * incomeMult() * (glazeTech > 0 ? 2 : 1);
  }
  // one tap with the tap bought `lv` times: its own value, plus 3% of the technika income for every 10 purchases (at most 15%)
  function tapValue(lv) {
    const own = (1 + lv) * Math.pow(2, starsOf(lv)) * incomeMult();
    return (own + autoPerSec() * 0.03 * Math.min(5, Math.floor(lv / 10))) * (glazeClick > 0 ? 2 : 1);
  }
  function clickGain() {
    return BigInt(Math.floor(tapValue(tapLv)));
  }
  // pays one tap (the fractions are not lost: they add up); returns the sum to show
  function payTap() {
    const v = tapValue(tapLv), whole = Math.floor(v);
    tapAcc += v - whole;
    let n = BigInt(whole);
    if (tapAcc >= 1) { tapAcc -= 1; n += 1n; }
    earn(n);
    return BigInt(whole);
  }
  function priceOf(base, growth, owned) {
    const p = base * Math.pow(growth, owned);
    return Number.isFinite(p) ? BigInt(Math.floor(p + 1e-6)) : 10n ** 400n;
  }
  // price after the 50% discount (premium items never get it)
  function finalPrice(price) {
    return discountOn() ? price / 2n : price;
  }
  // a machine opens at its bakery level
  function listLocked(j) {
    return bakeryLevel < TECHNIKA[j].level;
  }
  function prokUnlocked(i) {
    const p = PROKACHKI[i];
    return techOwned[p.tech] >= p.need;
  }
  // the prokachki that can be bought now (not bought yet), the cheapest first
  function prokList() {
    return PROKACHKI.filter((p, i) => !prokOwned[i] && prokUnlocked(i)).sort((a, b) => (a.cost < b.cost ? -1 : a.cost > b.cost ? 1 : 0));
  }
  // the price of the k-th purchase from now (0 = the next one)
  function priceAhead(tab, index, k) {
    if (tab === 'click') return finalPrice(priceOf(TAP_BASE, TAP_GROWTH, tapLv + k));
    if (tab === 'tech') return finalPrice(priceOf(TECHNIKA[index].base, MACHINE_GROWTH, techOwned[index] + k));
    return finalPrice(PROKACHKI[index].cost);
  }
  const priceNow = (tab, index) => priceAhead(tab, index, 0);
  function buy(tab, index) {
    if (tab === 'click' || tab === 'tech') {
      if (tab === 'tech' && listLocked(index)) return false;   // a locked machine cannot be bought, not even in bulk
      // 1Х, 10Х, 100Х: only when the coins pay for the whole amount; МАКС: as many as the coins pay for
      if (!plan(tab, index).can) return false;
      const limit = buyMode === 'max' ? BUY_MAX_STEPS : buyMode;
      let bought = 0;
      for (let k = 0; k < limit; k++) {
        const cost = priceNow(tab, index);
        if (coins < cost) break;
        coins -= cost;
        if (tab === 'click') tapLv += 1;
        else techOwned[index] += 1;
        bought++;
        totalBought++;
      }
      if (bought > 0) sfxBuy();
      return bought > 0;
    }
    if (tab === 'premium' || tab === 'ad') {
      // the rewarded ad: asked first (ДА), then shown by VK; without VK nothing is shown
      const it = PREMIUM_ITEMS[index];
      if (it.kind === 'ad') {
        // the reward comes after the ad is shown (in VK); outside VK it comes at once
        askAd(it.id === 'double' ? '2Х ДОХОД 10 МИН' : 'СКИДКА 50% 10 МИН', () => showRewardAd(() => { adBoost[it.id] = AD_BOOST_SECONDS; sfxBuy(); }));
        return true;
      }
      return false;
    }
    if (!prokUnlocked(index) || prokOwned[index]) return false;
    const cost = priceNow(tab, index);
    if (coins < cost) return false;
    coins -= cost;
    prokOwned[index] = true;
    totalBought++;
    sfxBuy();
    clampScroll();   // the bought one leaves the list
    return true;
  }

  // ---------- UI state ----------
  let tab = 'click';            // 'click' | 'tech' | 'prok' | 'premium'
  let panelOpen = false;
  let settingsOpen = false;
  const settings = { sound: 0.8, music: 0.5, colorblind: false, animBg: true, shake: false, skin: 'classic' };   // sound: no effects yet; music: 0..1
  let resetWin = null;         // the reset window: {stage}: 1 what is lost and what stays, 2 and 3 the two confirmations
  let sliderDrag = null;       // 'sound' | 'music' while a slider is held
  let panelT = 0;               // 0 = closed, 1 = open (animated)
  let scroll = 0;               // list scroll in game px
  let wheelPending = 0;         // wheel distance not yet scrolled
  let skinWheelPending = 0, docsWheelPending = 0;   // the same for the skin grid and the document reader
  let drag = null;              // {y0, s0, moved, tab}
  let docsDrag = null;          // {y0, s0, moved} while the documents are dragged by the finger

  let animT = 1;                // seconds since last coin click
  let everTapped = false;       // the player has tapped the cookie at least once
  let shakeT = 0;
  const popups = [];
  const sparks = [];
  const SPARKS_ON = false;   // no flying pixels on the phone: they load the phone (the +N popups stay)

  function coinX() {
    return COIN_X_CLOSED + (COIN_X_OPEN - COIN_X_CLOSED) * panelT;
  }

  function spawnClick(gx, gy) {
    sfxClick();
    const gain = payTap();
    playerClicks += 1;
    kitchen.things.click();       // the quiet is over: the glare on the cookie waits again
    kitchen.baker.tap();          // quick taps make the cook work up to two times faster (the income stays the same)
    if (ev && ev.type === 'quest' && !ev.done) {   // every tap on the cookie counts for the quest
      ev.taps += 1;
      if (ev.taps >= 250) questWon();   // 250 taps in time: the result comes at once
    }
    animT = 0;
    everTapped = true;
    if (settings.shake) shakeT = 0.12;   // screen shake is off unless the player turns it on
    popups.push({ x: gx, y: gy - 10, t: 0, text: '+' + fmt(gain) });   // at the tapped pixel, 10 px above it
    for (let k = 0; k < 8; k++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 80;
      if (SPARKS_ON) sparks.push({ x: gx, y: gy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, t: 0 });
    }
  }

  // ---------- shop tabs: four equal tabs across the panel (35 px each, 2 px apart) ----------
  // two rows of two full-width tabs: КЛИК | ТЕХНИКА, ПРОКАЧКИ | ПРЕМИУМ
  const TABS = [
    { id: 'click', label: 'КЛИК' },
    { id: 'tech', label: 'ТЕХНИКА' },
    { id: 'prok', label: 'ПРОКАЧКИ' },
    { id: 'premium', label: 'ПРЕМИУМ' },
  ];
  // only one menu is open at a time: opening one closes the others, so nothing old reopens later
  function closeMenus(except) {
    if (except !== 'skin') { skinWin = false; skinPreview = null; }
    if (except !== 'shop') { if (panelOpen) shopReturn = true; panelOpen = false; }
    if (except !== 'settings') { settingsOpen = false; resetWin = null; }
    if (except !== 'progress') { progWin = null; dailyPreview = null; }
    if (except !== 'premium') premiumWin = null;
  }
  // ---------- random events: every 4-7 minutes one of three ----------
  // 1. appetite (АППЕТИТ): pies on the left of the counter, cake on the right. One of them glows for 30 s;
  //    tapping the glowing one gives an effect for 30 s: pies = clicks x2, cake = technika x2.
  // 2. quest: tap 250 times in 60 s, then all income x2 for 1 minute.
  // 3. cooking minute: the cookie clicks by itself 25 times a second for 60 s (no window).
  let ev = null;                 // current event with a window or a glow (appetite / quest)
  let evTimer = 240 + Math.random() * 180;
  let glazeClick = 0, glazeTech = 0, glazeName = '';   // effects from appetite, seconds left
  let questBoost = 0;            // seconds of x2 income from the quest
  let autoTapAcc = 0;            // fractional taps of the auto-click bonus
  let minuteAcc = 0;             // fractional coins from the cooking minute
  let minuteLeft = 0;            // seconds left of the cooking minute
  const APPETITE_T = 30;         // how long the glowing plate stays
  const PIE_BOX = [topRect('settings')[0] + 13, 160, topRect('settings')[0] + 13 + 59, 178];   // the pies board: centred over the appearance button, right above the menu
  const CAKE_BOX = [188, 154, 234, 178];   // on the right: the same 16 px from the right wall as the pies board from the left one  // the cake on the table, between the pies board and Bonya (2 px lower than before)
  function spawnEvent() {
    const r = Math.random();
    if (r < 1 / 3) ev = { type: 'appetite', t: 0, pies: Math.random() < 0.5 };
    else if (r < 2 / 3) ev = { type: 'quest', t: 60, taps: 0, done: null };
    else startMinute();
  }
  function startMinute() { minuteLeft = 60; minutesSeen += 1; }
  function questWon() { ev.done = 'win'; questBoost = 60; questsDone += 1; }
  function tryHitAppetite(gx, gy) {
    if (!ev || ev.type !== 'appetite') return false;
    const box = ev.pies ? PIE_BOX : CAKE_BOX;
    // the tap zone is wider than the dish: the frame, the words ПОПРОБУЙ! and a margin around, 8 px below it too (in screen rows);
    // the two buttons under the table keep their own taps
    const y = lastRawY;
    if (!inZone(gx, y, box[0] - 8, box[1] - SCENE_UP - 12, box[2] + 8, box[3] - SCENE_UP + 8)) return false;
    if (inRect(gx, y, SKIN_BTN[0], SKIN_BTN[1], SKIN_BTN[2], SKIN_BTN[3]) || inRect(gx, y, MENU_BTN_X, MENU_BTN_Y[0], MENU_BTN_X + MENU_BTN_W, MENU_BTN_Y[1])) return false;
    if (ev.pies) { glazeClick = 30; glazeName = 'ПИРОЖКИ'; }
    else { glazeTech = 30; glazeName = 'ТОРТ'; }
    ev = null;
    treatsEaten += 1;
    sfxBuy();
    return true;
  }
  function updateEvents(dt) {
    glazeClick = Math.max(0, glazeClick - dt);
    glazeTech = Math.max(0, glazeTech - dt);
    questBoost = Math.max(0, questBoost - dt);
    updateMinute(dt);
    if (!ev) {
      evTimer -= dt;
      // the appetite event waits until every menu (the shop too) is closed
      const inMenu = settingsOpen || panelOpen || !!progWin || skinWin || !!premiumWin || !!lvlWin;
      if (evTimer <= 0 && !inMenu) {
        spawnEvent();
        evTimer = 240 + Math.random() * 180;
      }
      return;
    }
    if (ev.type === 'appetite') {
      ev.t += dt;
      if (ev.t >= APPETITE_T) ev = null;
      return;
    }
    if (ev.done) { ev.doneT = (ev.doneT || 0) + dt; if (ev.doneT > 2.5) ev = null; return; }
    ev.t -= dt;
    if (ev.t <= 0) {
      ev.t = 0;
      if (ev.taps >= 250) questWon(); else ev.done = 'fail';
    }
  }
  // cooking minute: the cookie clicks by itself 25 times a second. No window, the player can keep buying.
  // These virtual clicks are not counted as player clicks; they only show crumbs and "+N" popups.
  function updateMinute(dt) {
    minuteLeft = Math.max(0, minuteLeft - dt);
    if (premiumOwned.autoclick) {
      // the auto-click bonus: ten taps a second, each one paying out like a tap of the player
      autoTapAcc += 10 * dt;
      while (autoTapAcc >= 1) {
        autoTapAcc -= 1;
        const pay = payTap();
        popups.push({ x: coinX() + (Math.random() * 60 - 30), y: 96, t: 0, text: '+' + fmt(pay) });   // every auto tap shows its +N
        const sa = Math.random() * Math.PI * 2;
        if (SPARKS_ON) sparks.push({ x: coinX(), y: COIN_Y, vx: Math.cos(sa) * 50, vy: Math.sin(sa) * 50 - 30, t: 0 });
      }
    }
    minuteAcc += minuteLeft > 0 ? 25 * dt : 0;   // the cooking minute only                             // 25 virtual presses a second
    while (minuteAcc >= 1) {
      // every virtual press pays out, shows its own "+N" and crumbs
      minuteAcc -= 1;
      const perClick = payTap();
      popups.push({ x: coinX() + (Math.random() * 60 - 30), y: 96, t: 0, text: '+' + fmt(perClick) });   // middle of the screen, away from the counter
      const a = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 60;
      if (SPARKS_ON) sparks.push({ x: coinX(), y: COIN_Y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30, t: 0 });
    }
    if (minuteLeft <= 0) minuteAcc = 0;
  }
  // the glowing dish: a blinking frame around all of it and the words СЪЕШЬ МЕНЯ above it
  function drawAppetite() {
    const box = ev.pies ? PIE_BOX : CAKE_BOX;
    if (Math.sin(cookT * 8) > 0) {
      const [x0, y0, x1, y1] = [box[0] - 2, box[1] - 2, box[2] + 2, box[3] + 2];
      fillRect(x0, y0, x1 - x0, 1, COL.gold);
      fillRect(x0, y1 - 1, x1 - x0, 1, COL.gold);
      fillRect(x0, y0, 1, y1 - y0, COL.gold);
      fillRect(x1 - 1, y0, 1, y1 - y0, COL.gold);
    }
    drawTextO('ПОПРОБУЙ!', 1, (box[0] + box[2]) / 2, box[1] - 10, COL.gold);
  }
  // temporary boosts: the far left corner of the floor strip, vertically centred in it
  // the bonuses that go into the menu: every active one, with its time left (except the 10-minute ad bonus and the shop bonuses)
  function menuLabels() {
    const out = [];
    if (ev && ev.type === 'quest') {
      out.push(ev.done ? 'КВЕСТ: ' + (ev.done === 'win' ? 'ГОТОВО!' : 'НЕ УСПЕЛИ') : 'КВЕСТ ' + ev.taps + '/250 ' + Math.ceil(ev.t) + 'С');
    }
    if (questBoost > 0) out.push('ДОХОД 2Х ЗА КВЕСТ ' + Math.ceil(questBoost) + 'С');
    if (glazeClick > 0) out.push('КЛИК ПРЯНИКА 2Х ' + Math.ceil(glazeClick) + 'С');
    if (glazeTech > 0) out.push(glazeName + ' ТЕХНИКА 2Х ' + Math.ceil(glazeTech) + 'С');
    if (minuteLeft > 0) out.push('КУЛИНАРНАЯ МИНУТА ' + Math.ceil(minuteLeft) + 'С');
    return out;
  }
  // the 10-minute 2x ad bonus, with its countdown
  function adLabel() {
    const s = Math.ceil(adBoost.double), ss = s % 60;
    return '2Х ДОХОД ' + Math.floor(s / 60) + ':' + (ss < 10 ? '0' : '') + ss;
  }
  // everything the menu window lists, each one on its own line (the multiplier on the row is the product of these)
  function windowList() {
    const list = menuLabels();
    if (premiumOwned.double) list.push('2Х ДОХОД НАВСЕГДА');
    if (premiumOwned.triple) list.push('3Х ДОХОД НАВСЕГДА');
    if (adBoost.double > 0) list.push((premiumOwned.noads ? '2Х ДОХОД ' : '2Х ДОХОД ЗА РЕКЛАМУ ') + adLabel().replace('2Х ДОХОД ', ''));
    if (adBoost.discount > 0) { const s = Math.ceil(adBoost.discount), ss = s % 60; list.push((premiumOwned.noads ? 'СКИДКА 50% ' : 'СКИДКА 50% ЗА РЕКЛАМУ ') + Math.floor(s / 60) + ':' + (ss < 10 ? '0' : '') + ss); }   // the free 50% discount, with its time left
    return list;
  }
  // the bonus row at the height of КЛИКАЙ, centred under it: the framed button with the number of active bonuses (0 when none),
  // then one multiplier for the premium 2x and 3x and the 10-minute ad 2x, multiplied together (for example Х12)
  const MENU_BTN_W = 18, MENU_BTN_Y = [160, 178];   // right above ПРОГРЕСС (4 px above its row), drawn on the screen
  const MENU_BTN_X = topRect('achievements')[1] - MENU_BTN_W;   // the right edge of ПРОГРЕСС, at the right wall
  function multiplierBonus() {
    // every 2x that runs now: the ad (from the shop or from Боня), the quest, the treat (pies or cake count once: they double different things)
    return (premiumOwned.double ? 2 : 1) * (premiumOwned.triple ? 3 : 1) * (adBoost.double > 0 ? 2 : 1) * (questBoost > 0 ? 2 : 1) * (glazeClick > 0 || glazeTech > 0 ? 2 : 1);
  }
  // drawn on its own picture: the rows y0..y1 of it; the multiplier text stands to the left of the button
  function drawBoostLine(y0, y1) {
    const n = windowList().length;
    const mult = multiplierBonus();
    const multText = mult > 1 ? 'Х' + mult : '';
    drawTopButton(String(n), MENU_BTN_X, MENU_BTN_X + MENU_BTN_W, y0, y1);   // the same frame as the top buttons
  }
  // the menu that opens on that button; a tap anywhere closes it
  let boostMenuOpen = false;
  function drawBoostMenu() {
    const list = windowList();
    fillRect(0, 0, W, H, 'rgba(10, 8, 24, 0.6)');
    fillRect(WIN_X0, WIN_Y0, WIN_X1 - WIN_X0, WIN_Y1 - WIN_Y0, COL.panel);
    fillRect(WIN_X0, WIN_Y0, WIN_X1 - WIN_X0, 1, COL.panelEdge);
    fillRect(WIN_X0, WIN_Y1 - 1, WIN_X1 - WIN_X0, 1, COL.panelEdge);
    fillRect(WIN_X0, WIN_Y0, 1, WIN_Y1 - WIN_Y0, COL.panelEdge);
    fillRect(WIN_X1 - 1, WIN_Y0, 1, WIN_Y1 - WIN_Y0, COL.panelEdge);
    drawTextBox('АКТИВНЫЕ БОНУСЫ', 1, WIN_X0, WIN_X1, WIN_Y0 + 6, WIN_Y0 + 16, COL.text);
    let ly = 40;
    list.forEach((t) => { ly = drawWrapped(t, 1, 74, ly, 172, accent()) + 4; });   // long lines wrap inside the frame
    settingsButton(74, 124, 246, 136, 'ЗАКРЫТЬ');   // inside the frame, like the other sheets
  }

  // ---------- quest window ----------
  function drawEventWin() {
    fillRect(0, 0, W, H, 'rgba(10, 8, 24, 0.6)');
    fillRect(WIN_X0, WIN_Y0, WIN_X1 - WIN_X0, WIN_Y1 - WIN_Y0, COL.panel);
    fillRect(WIN_X0, WIN_Y0, WIN_X1 - WIN_X0, 1, COL.panelEdge);
    fillRect(WIN_X0, WIN_Y1 - 1, WIN_X1 - WIN_X0, 1, COL.panelEdge);
    fillRect(WIN_X0, WIN_Y0, 1, WIN_Y1 - WIN_Y0, COL.panelEdge);
    fillRect(WIN_X1 - 1, WIN_Y0, 1, WIN_Y1 - WIN_Y0, COL.panelEdge);
    if (ev.type === 'quest') {
      drawTextBox('КВЕСТ', 1, WIN_X0, WIN_X1, WIN_Y0 + 6, WIN_Y0 + 16, COL.text);
      if (ev.done) {
        drawTextBox(ev.done === 'win' ? 'ГОТОВО!' : 'НЕ УСПЕЛИ', 1, 60, 260, 40, 52, accent());
        drawText(ev.done === 'win' ? 'ДОХОД 2Х НА 1 МИНУТУ' : 'ПОПРОБУЙТЕ ЕЩЁ РАЗ', 1, 60, 70, COL.text, 'left');
        settingsButton(60, 156, 260, 170, 'ОК');
        return;
      }
      drawText('НАЖМИ 250 РАЗ ЗА МИНУТУ', 1, 60, 26, COL.text, 'left');
      drawText('ОСТАЛОСЬ: ' + Math.ceil(ev.t) + ' СЕК', 1, 60, 40, dimTone(), 'left');
      drawText('НАЖАТИЙ: ' + ev.taps + ' / 250', 1, 60, 52, accent(), 'left');
      settingsButton(60, 70, 260, 116, 'ЖМИ СЮДА');
      return;
    }
    drawTextBox('КУЛИНАРНАЯ МИНУТА', 1, WIN_X0, WIN_X1, WIN_Y0 + 6, WIN_Y0 + 16, COL.text);
    if (ev.done) {
      drawText('ПЕЧЕНЬКА ЗАКОНЧИЛА', 1, 60, 40, COL.text, 'left');
      settingsButton(60, 156, 260, 170, 'ОК');
      return;
    }
    drawText('ПЕЧЕНЬКА САМА НАЖИМАЕТСЯ', 1, 60, 26, COL.text, 'left');
    drawText('25 РАЗ В СЕКУНДУ', 1, 60, 36, COL.text, 'left');
    drawText('ОСТАЛОСЬ: ' + Math.ceil(ev.t) + ' СЕК', 1, 60, 52, accent(), 'left');
  }

  // Payment goes through the VK platform; until it is connected, payProduct() reports that it is not available.
  // TEST MODE for checks: on the local copy every premium item is free at the address ?free
  const TEST_FREE_PREMIUM = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]free\b/.test(location.search);   // only on the local copy, with ?free in the address
  const VK_APP_ID = 54907536;
  function payProduct(id) {
    if (TEST_FREE_PREMIUM) return Promise.resolve({ ok: true });
    // the same VK payment form as on the desktop: the purchase is made in votes, the server confirms it
    if (!window.vkBridge) return Promise.resolve({ ok: false, msg: 'ОПЛАТА ТОЛЬКО В ВК' });
    return vkBridge.send('VKWebAppShowOrderBox', { type: 'item', item: id })
      .then((data) => (data && data.success ? { ok: true } : { ok: false, msg: 'ОПЛАТА НЕ ПРОШЛА', code: 'НЕТ' }))
      .catch((e) => ({ ok: false, msg: 'ОПЛАТА НЕ ПРОШЛА', code: vkErrorCode(e) }));
  }
  // the code VK gives for a refused payment, so the player can tell us what happened
  function vkErrorCode(e) {
    const c = e && e.error_data && e.error_data.error_code;
    if (c !== undefined) return String(c);
    return e && e.error_type ? String(e.error_type).toUpperCase() : 'НЕТ';
  }
  // the purchases the server has confirmed for this player (VK tells the server about every paid order)
  const PURCHASES_URL = 'https://functions.yandexcloud.net/d4e8ajlqi4mjo1lgs395';   // Яндекс Облако: список покупок (op=purchases)
  let grantedOrders = [];   // order ids already applied (saved): each paid order gives its item once
  // ПРЯНИКИ ЗА N ЧАСОВ: the technika income of that time at once, without the temporary bonuses (the 10-minute ad, the quest, the cake)
  let pendingHours = 0;            // paid hours not given yet (saved): they wait while there is no technika
  let hoursAt = 0;                 // when the paid hours last changed (ms): the newer number wins between devices
  let lastHoursN = 0n;             // the sum given last, for the window КУПЛЕНО
  function hoursSum(h) { return BigInt(Math.floor(offlineRate() * 3600 * h)); }
  function grantHours() {
    const n = hoursSum(pendingHours);
    if (n <= 0n) return;
    pendingHours = 0;
    hoursAt = Date.now();
    lastHoursN = n;
    earn(n);
    popups.push({ x: coinX(), y: 96, t: 0, text: '+' + fmt(n) });
  }
  function premiumInfo(it) {
    if (!it.hours) return PREMIUM_INFO[it.id] || { name: it.name, lines: [it.line, it.price] };   // a safe fallback: an item without a text never breaks the window
    const bought = premiumWin && premiumWin.mode === 'done';
    return { name: it.name, lines: ['+' + fmt(bought ? lastHoursN : hoursSum(it.hours)) + ' ПРЯНИКОВ СРАЗУ: ДОХОД ТЕХНИКИ ЗА ' + it.name.slice(11), 'МОЖНО КУПИТЬ ЕЩЁ'] };
  }
  // gives one bought item (the same whether it was bought in the game or in the VK form)
  function applyItem(id) {
    const it = PREMIUM_ITEMS.find((x) => x.id === id);
    if (!it) return;
    if (it.hours) { pendingHours += it.hours; hoursAt = Date.now(); grantHours(); }   // can be bought any number of times
    else premiumOwned[it.id] = true;
    // the bundle gives everything in it at once
    if (it.id === 'bundle') for (const k of ['double', 'triple', 'autoclick', 'discount', 'noads', 'level2']) premiumOwned[k] = true;
    if (it.id === 'skins_all') unlockAllPremiumSkins();
    else if (it.id.startsWith('skin_')) skinOwned[it.id.slice(5)] = true;
  }
  // asks the server for the confirmed purchases; each new one is applied once. Resolves with how many were new
  function syncPurchases() {
    if (!/[?&]vk_/.test(location.search)) return Promise.resolve(0);   // outside VK there are no purchases
    return fetch(PURCHASES_URL + location.search + '&op=purchases')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j || !j.ok) return 0;
        let added = 0;
        for (const p of j.purchases) {
          if (grantedOrders.includes(p.order_id)) continue;
          applyItem(p.item);
          grantedOrders.push(p.order_id);
          added++;
        }
        if (added > 0) saveGame();
        return added;
      })
      .catch(() => 0);
  }
  function finishBuy(it) {
    saveGame();
    premiumWin = { mode: 'done', idx: 0 };
    premiumWin.idx = PREMIUM_ITEMS.findIndex((x) => x.kind === 'premium' && x.id === it.id);
    sfxBuy();
  }
  // after the VK payment form the purchase arrives from the server: ask a few times
  function waitForPurchase(it, left) {
    syncPurchases().then((added) => {
      if (added > 0) finishBuy(it);
      else if (left > 1) setTimeout(() => waitForPurchase(it, left - 1), 2000);
      else premiumWin = { mode: 'error', idx: PREMIUM_ITEMS.findIndex((x) => x.kind === 'premium' && x.id === it.id), msg: 'ПОКУПКА НЕ ПОДТВЕРЖДЕНА' };
    });
  }
  function startPremiumPurchase() {
    const it = PREMIUM_ITEMS[premiumWin.idx];
    premiumWin = { mode: 'pending', idx: premiumWin.idx };
    payProduct(it.id).then((res) => {
      if (!res.ok) {
        premiumWin = { mode: 'error', idx: PREMIUM_ITEMS.findIndex((x) => x.kind === 'premium' && x.id === it.id), msg: res.msg, code: res.code };
        return;
      }
      if (TEST_FREE_PREMIUM) { applyItem(it.id); finishBuy(it); return; }   // test mode: no payment, the item is given at once
      waitForPurchase(it, 10);
    });
  }
  function handlePremiumWinDown(gx, gy) {
    const m = premiumWin.mode;
    if (m === 'confirm') {
      if (inRect(gx, gy, 74, 112, 246, 124)) startPremiumPurchase();
      else if (inRect(gx, gy, 74, 126, 246, 138)) premiumWin = null;
      return;
    }
    if (m === 'done' || m === 'error') {
      if (inRect(gx, gy, 74, 126, 246, 138)) {
        const bought = PREMIUM_ITEMS[premiumWin.idx];
        premiumWin = null;
        if (m === 'done' && bought && bought.id.startsWith('skin_')) offerSkin(bought.id.slice(5));
      }
    }
  }
  // splits a text into lines that fit the width; returns the y under the last line
  function wrapText(str, sc, maxW) {
    const lines = [];
    let cur = '';
    for (const w of str.split(' ')) {
      const t = cur ? cur + ' ' + w : w;
      if (textWidth(t, sc) <= maxW || !cur) cur = t;
      else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    return lines;
  }
  function drawWrapped(str, sc, x, y, maxW, color, step = 10) {
    for (const line of wrapText(str, sc, maxW)) {
      drawText(line, sc, x, y, color, 'left');
      y += step;
    }
    return y;
  }
  // the purchase window: a sheet in the frame, the picture on the left and the text beside it
  // the premium skins in the order of the appearance window; the picture changes every 3 seconds
  function premiumSkinCycle() {
    const list = SKINS.filter((k) => k.premium).map((k) => k.id);
    return list[Math.floor(performance.now() / 3000) % list.length];
  }
  function drawPremiumWin() {
    fillRect(0, 0, W, H, 'rgba(10, 8, 24, 0.6)');
    fillRect(WIN_X0, WIN_Y0, WIN_X1 - WIN_X0, WIN_Y1 - WIN_Y0, COL.panel);
    fillRect(WIN_X0, WIN_Y0, WIN_X1 - WIN_X0, 1, COL.panelEdge);
    fillRect(WIN_X0, WIN_Y1 - 1, WIN_X1 - WIN_X0, 1, COL.panelEdge);
    fillRect(WIN_X0, WIN_Y0, 1, WIN_Y1 - WIN_Y0, COL.panelEdge);
    fillRect(WIN_X1 - 1, WIN_Y0, 1, WIN_Y1 - WIN_Y0, COL.panelEdge);
    const it = PREMIUM_ITEMS[premiumWin.idx];
    const info = premiumInfo(it);
    const m = premiumWin.mode;
    if (m === 'confirm' || m === 'pending') {
      // the skin effects stay inside the window: the picture is clipped to the inner frame
      ctx.save(); ctx.beginPath(); ctx.rect(WIN_X0 + 2, WIN_Y0 + 2, WIN_X1 - WIN_X0 - 4, WIN_Y1 - WIN_Y0 - 4); ctx.clip();
      drawTextBox('ПОКУПКА', 1, WIN_X0, WIN_X1, 10, 20, COL.text);
      const previewSkin = it.id === 'skins_all' ? premiumSkinCycle() : PREMIUM_SKIN_OF[it.id];   // the bundle cycles through all premium skins
      const isSkin = !!previewSkin;
      // a skin item shows the skin itself on the left: the neon one glows, pulsing
      const tx = isSkin ? 152 : 76;
      if (isSkin) {
        const thumb = skinThumbs[previewSkin];
        const glow = 0.5 + 0.5 * Math.sin(cookT * 3);
        ctx.save();
        // the glow of the previewed skin: orange for the volcanic one, pink for the neon one
        ctx.shadowColor = skinGlow(previewSkin, (0.55 + 0.4 * glow).toFixed(2));
        ctx.shadowBlur = previewSkin === 'volcano' ? 6 + 10 * glow : 4 + 6 * glow;
        if (thumb && thumb.complete && thumb.naturalWidth) ctx.drawImage(thumb, 74, 24, 74, 74);
        ctx.restore();
        fxMask = thumbMask(thumb, 74, 24);
        drawSkinFxAt(previewSkin, 111, 61, 40, 33);   // the same effects as the appearance preview
        fxMask = null;
      }
      // the text wraps inside the frame: beside the picture it is 94 px wide, otherwise 172 px
      const maxW = 246 - tx;
      // the lines of the text are 4 px apart (a 7 px line and a 4 px gap: the step is 11)
      const st = !isSkin && wrapText(info.lines[0], 1, maxW).length > 4 ? 10 : 11;   // a long text: the lines closer, so НАВСЕГДА stays under it
      let y = drawWrapped(info.name, 1, tx, 26, maxW, accent(), st);
      y = drawWrapped(isSkin && it.id !== 'skins_all' ? 'ЭФФЕКТЫ:' : 'ЧТО ДАЁТ:', 1, tx, y, maxW, dimTone(), st);
      const line0 = info.lines[0];   // the whole range of skins
      y = drawWrapped(line0, 1, tx, y, maxW, COL.text, st);
      if (info.lines[2]) drawWrapped(info.lines[2], 1, tx, y, maxW, COL.text, 11);   // a third line, right under the first one
      drawText(info.lines[1], 1, tx, st === 10 ? Math.max(93, y + 2) : 93, accent(), 'left');
      // НАВСЕГДА: yellow, about where the white line is (above the buy button, which starts at 112)
      if (m === 'confirm') {
        settingsButton(74, 112, 246, 124, 'КУПИТЬ ЗА ' + it.price);   // right above ОТМЕНА
        settingsButton(74, 126, 246, 138, 'ОТМЕНА');
      } else {
        drawTextBox('ОПЛАТА...', 1, 74, 246, 112, 124, COL.text);
      }
      ctx.restore();
      return;
    }
    if (m === 'done') {
      drawTextBox('КУПЛЕНО', 1, WIN_X0, WIN_X1, 10, 20, accent());
      drawText('НАЗВАНИЕ:', 1, 76, 26, dimTone(), 'left');
      drawText(info.name, 1, 76, 36, COL.text, 'left');
      drawText('ДЕЙСТВИЕ:', 1, 76, 48, dimTone(), 'left');
      let yd = drawWrapped(info.lines[0], 1, 76, 58, 168, COL.text);   // a long text wraps inside the window
      yd = drawWrapped(info.lines[1], 1, 76, yd, 168, COL.text);
      drawText(it.hours ? 'ПРЯНИКИ НАЧИСЛЕНЫ' : 'ТЕПЕРЬ У ВАС НАВСЕГДА', 1, 76, Math.max(84, yd + 4), accent(), 'left');
      settingsButton(74, 126, 246, 138, 'ОК');
      return;
    }
    // error
    drawTextBox('ОШИБКА', 1, WIN_X0, WIN_X1, 10, 20, COL.text);
    drawText(info.name, 1, 76, 26, COL.text, 'left');
    drawText(premiumWin.msg || 'ПОКУПКА НЕ ПРОШЛА', 1, 76, 46, COL.text, 'left');
    drawText(premiumWin.code ? 'КОД VK: ' + premiumWin.code : 'ПОПРОБУЙТЕ ПОЗЖЕ', 1, 76, 58, dimTone(), 'left');
    settingsButton(74, 126, 246, 138, 'ОК');
  }

  // ---------- appearance window (ВНЕШНИЙ ВИД): choose the gingerbread skin ----------
  // the button at the bottom: a framed button like the top row, with 2 px between the letters and the frame
  const SKIN_BTN_LABEL = 'ВНЕШНИЙ ВИД';
  const SKIN_BTN_W = textWidth(SKIN_BTN_LABEL, 1) + 2 * (2 + 2);
  const SKIN_BTN_X0 = 160 - Math.floor(SKIN_BTN_W / 2);   // whole pixels, so the frame is as sharp as the top buttons
  const SKIN_BTN = [topRect('settings')[0], 160, topRect('settings')[1], 178];   // drawn at the screen rows 160-177: scene rows 180-197 after the shift   // right above НАСТРОЙКИ: the same left and right edges, 4 px above the top row (the same gap as between the rows)   // 18 px tall; 3 px to the bottom edge, like the top buttons have at the top
  // the appearance window: a list of skins; tapping a skin opens its preview (its look and name), where it can be worn
  let skinPreview = null;        // id of the skin shown in the preview, or null for the list
  function handleSkinDown(gx, gy) {
    if (skinPreview) {
      const k = SKINS.find((s) => s.id === skinPreview);
      if (k && !skinOwned[k.id]) {
        if (k.premium && inRect(gx, gy, 74, 110, 155, 122)) { watchSkinAd(k.id); return; }     // ЗА 8 РЕКЛАМ
        if (k.premium && inRect(gx, gy, 165, 110, 246, 122)) {                                  // В МАГАЗИНЕ
          closeMenus('shop');
          skinWin = false;
          skinPreview = null;
          tab = 'premium';
          premiumSection = 'skins';
          scroll = 0;
          panelOpen = true;
          shopReturn = false;
          // straight to this skin's purchase window
          const pi = PREMIUM_ITEMS.findIndex((x) => x.id === 'skin_' + k.id);
          if (pi >= 0) premiumWin = { mode: 'confirm', idx: pi };
          return;
        }
        if (!k.premium && inRect(gx, gy, 74, 110, 155, 122)) { watchSkinAd(k.id); return; }    // ЗА 3 РЕКЛАМЫ
        // В НАГРАДАХ opens the rewards on this skin's day
        const day = SKINS.indexOf(k);
        if (!k.premium && day >= 1 && day <= 7 && inRect(gx, gy, 165, 110, 246, 122)) {
          closeMenus('progress');
          skinWin = false;
          skinPreview = null;
          progWin = { tab: 'daily' };
          dailyPreview = day;
          return;
        }
      }
      if (k && skinOwned[k.id] && inRect(gx, gy, 74, 110, 246, 122)) {       // НАДЕТЬ
        settings.skin = k.id;
        loadSkin(k.id);
        saveGame();
        skinPreview = null;
        return;
      }
      if (inRect(gx, gy, 74, 124, 246, 136)) skinPreview = null;            // НАЗАД to the list
      return;
    }
    if (inRect(gx, gy, 74, 124, 246, 136)) {                                                      // ЗАКРЫТЬ
      skinWin = false;
      skinPreview = null;
      panelOpen = shopReturn;
      shopReturn = false;
      return;
    }
    if (inZone(gx, gy, 238, SKIN_TOP, 246, SKIN_BOT)) { skinDrag = { y0: lastRawY, s0: skinScroll }; return; }   // the slider (raw screen rows)
    SKINS.forEach((k, i) => {
      if (!inZone(gx, gy, 74, SKIN_TOP, 238, SKIN_BOT)) return;
      const [cx, cy] = skinCellXY(i);
      if (inRect(gx, gy, cx - 2, cy - 2, cx + SKIN_CELL + 2, cy + SKIN_CELL + 2)) { skinPreview = k.id; if (k.id === 'ghost') ghostTimer = 0.5; }
    });
  }
  // an ad for a skin: the ad SDK is not connected yet, so the view counts right away
  // the reward ad: in VK it is shown by VK Bridge, and the reward comes only if the ad was shown;
  // outside VK (testing) the reward comes at once
  // the reward ad that the player chooses: one per minute (the cooldown), with the ad-free purchase too
  let rewardAdReadyAt = 0;
  let lastAdAt = 0;                // when the last ad of any kind was on the screen (a customer comes at least a minute after it)
  function showCooldown() {
    const word = premiumOwned.noads ? 'НАГРАДА ЧЕРЕЗ ' : 'РЕКЛАМА ЧЕРЕЗ ';
    showNotice(() => [word + Math.max(0, Math.ceil((rewardAdReadyAt - Date.now()) / 1000)) + ' С']);
  }
  function showRewardAd(onReward, onFail) {
    const now = Date.now();
    if (now < rewardAdReadyAt) { showCooldown(); return; }
    rewardAdReadyAt = now + 60000;
    lastAdAt = now;
    if (premiumOwned.noads || !window.vkBridge) { onReward(); return; }   // with the ad-free purchase the reward comes at once, once a minute
    rewardAdOpen = true;
    vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'reward', use_waterfall: true })
      .then((data) => {
        rewardAdOpen = false;
        lastAdAt = Date.now();
        if (data && data.result) onReward();
        else { rewardAdReadyAt = 0; if (onFail) onFail(); showNotice(['РЕКЛАМЫ НЕТ']); }
      })
      .catch((e) => { rewardAdOpen = false; lastAdAt = Date.now(); rewardAdReadyAt = 0; if (onFail) onFail(); showNotice(['РЕКЛАМА НЕ ДОСТУПНА', 'ДО ПРОВЕРКИ МОДЕРАЦИИ']); });
  }
  let rewardAdOpen = false;        // a rewarded ad is on the screen now
  const NOTICE_DIM = 'rgba(10, 8, 24, 0.6)';   // the rest of the screen under a message
  // a message in the middle of the screen with an OK button (the ad messages use it)
  let noticeWin = null;            // {lines} while it is open
  // onYes: the window asks a question (ДА / НЕТ); without it the window has one button (ОК)
  function showNotice(lines, onYes) { noticeWin = { lines, onYes: onYes || null }; }
  // a rewarded ad starts only after the player's own YES, and the message names the reward
  function askAd(reward, go) {
    if (premiumOwned.noads || Date.now() < rewardAdReadyAt) go();   // no ad with the ad-free purchase; a cooldown message comes from go
    else showNotice(['СМОТРЕТЬ РЕКЛАМУ?', reward], go);
  }
  function drawNotice() {
    fillRect(0, 0, W, 320, NOTICE_DIM);
    fillRect(84, 46, 152, 50, COL.panel);
    fillRect(84, 46, 152, 1, COL.panelEdge); fillRect(84, 95, 152, 1, COL.panelEdge);
    fillRect(84, 46, 1, 50, COL.panelEdge); fillRect(235, 46, 1, 50, COL.panelEdge);
    // the text is centred between the top edge and the OK button (the centre is at y 66)
    const n = noticeLines().length, y0 = Math.round(66 - (10 * (n - 1) + 8) / 2);
    noticeLines().forEach((t, i) => drawTextBox(t, 1, 85, 235, y0 + i * 10, y0 + i * 10 + 8, noticeWin.onYes && i > 0 ? accent() : COL.text));   // in a question the reward is golden
    if (noticeWin.onYes) {   // a question: two buttons, ДА and НЕТ, on the bottom edge
      settingsButton(85, 86, 159, 95, 'ДА');
      settingsButton(161, 86, 235, 95, 'НЕТ');
    } else {
      settingsButton(85, 86, 235, 95, 'ОК');   // full width, on the bottom edge of the window
    }
  }
  let loadingLeft = 0;             // seconds the loading screen stays up
  let loadingLabel = '';           // its title
  function drawLoading() {
    fillRect(0, 0, W, H, 'rgba(10, 8, 24, 0.85)');
    drawTextBox(loadingLabel, 1, 0, W, H / 2 - 16, H / 2 - 6, COL.text);
    const p = Math.min(1, (2.5 - loadingLeft) / 2.5);
    fillRect(W / 2 - 60, H / 2 + 6, 120, 4, COL.btnFrame);
    fillRect(W / 2 - 60, H / 2 + 6, Math.round(120 * p), 4, accent());
  }
  // ---------- income while the game was closed: the technika only, for the first 30 minutes ----------
  // the window comes after an absence of a minute or more; the sum is credited at once, the ad adds the same sum again
  const OFF_MIN = 60, OFF_MAX = 1800;
  const OFF_X = 84, OFF_Y = 50, OFF_W = 152, OFF_H = 100;   // the window, in scene pixels
  let offlineFrom = 0, offlineUntil = 0;   // the absence not yet paid for (ms)
  let hiddenAt = 0;                // when the game was hidden (ms): a hidden game stands still, so it counts as closed
  let offlineWin = null;           // {n, mins, doubled}
  function goHidden() { if (!hiddenAt) hiddenAt = Date.now(); }
  function goShown() {
    if (hiddenAt && !rewardAdOpen) { offlineFrom = hiddenAt; offlineUntil = Date.now(); }   // the time of an ad does not count
    hiddenAt = 0;
  }
  // the technika without the temporary bonuses (the 10-minute ad, the quest, the cake)
  function offlineRate() {
    return autoPerSec() / ((adBoost.double > 0 ? 2 : 1) * (questBoost > 0 ? 2 : 1) * (glazeTech > 0 ? 2 : 1));
  }
  function updateOffline() {
    if (!offlineFrom || lvlWin || splashT > 0 || consentOpen || launchState !== 'ok' || noticeWin || loadingLeft > 0 || sale || rewardAdOpen || offlineWin) return;
    const sec = Math.min(OFF_MAX, (offlineUntil - offlineFrom) / 1000);
    offlineFrom = 0;
    if (!(sec >= OFF_MIN)) return;
    const n = BigInt(Math.floor(offlineRate() * sec));
    if (n <= 0n) return;
    offlineWin = { n, mins: Math.floor(sec / 60), doubled: premiumOwned.noads };
    earn(n);
    if (offlineWin.doubled) earn(n);      // with the ad-free purchase it is doubled at once
    saveGame();
  }
  function minutesWord(m) {
    const a = m % 10, b = m % 100;
    return a === 1 && b !== 11 ? ' МИНУТУ' : a >= 2 && a <= 4 && (b < 12 || b > 14) ? ' МИНУТЫ' : ' МИНУТ';
  }
  function drawOffline() {
    const x1 = OFF_X + OFF_W, y1 = OFF_Y + OFF_H, cx = OFF_X + OFF_W / 2;
    fillRect(0, 0, W, 320, 'rgba(10, 8, 24, 0.6)');
    fillRect(OFF_X, OFF_Y, OFF_W, OFF_H, COL.panel);
    fillRect(OFF_X, OFF_Y, OFF_W, 1, COL.panelEdge); fillRect(OFF_X, y1 - 1, OFF_W, 1, COL.panelEdge);
    fillRect(OFF_X, OFF_Y, 1, OFF_H, COL.panelEdge); fillRect(x1 - 1, OFF_Y, 1, OFF_H, COL.panelEdge);
    drawText('ПОКА ВАС НЕ БЫЛО', 1, cx, OFF_Y + 8, COL.text, 'center');
    drawText('ПЕКАРНЯ ИСПЕКЛА', 1, cx, OFF_Y + 19, COL.text, 'center');
    drawText('+' + fmt(offlineWin.doubled ? offlineWin.n * 2n : offlineWin.n), 2, cx, OFF_Y + 33, accent(), 'center');
    drawText('ЗА ' + offlineWin.mins + minutesWord(offlineWin.mins) + (offlineWin.doubled ? ', УДВОЕНО' : ''), 1, cx, OFF_Y + 54, dimTone(), 'center');
    if (!offlineWin.doubled) {
      fillRect(OFF_X + 1, y1 - 30, OFF_W - 2, 14, COL.row);
      fillRect(OFF_X + 1, y1 - 30, OFF_W - 2, 1, COL.btnHi);
      drawTextBox('УДВОИТЬ ЗА РЕКЛАМУ', 1, OFF_X + 1, x1 - 1, y1 - 30, y1 - 16, accent());
    }
    settingsButton(OFF_X + 1, y1 - 15, x1 - 1, y1 - 1, 'ЗАБРАТЬ');
  }
  function handleOfflineDown(gx, gy) {
    const x1 = OFF_X + OFF_W, y1 = OFF_Y + OFF_H;
    if (inRect(gx, gy, OFF_X, y1 - 15, x1, y1)) { offlineWin = null; offlineTaken += 1; saveGame(); return; }
    if (!offlineWin.doubled && inRect(gx, gy, OFF_X, y1 - 30, x1, y1 - 16)) {
      const n = offlineWin.n;
      showRewardAd(() => {
        earn(n);
        offlineWin = null;
        offlineTaken += 1;
        sfxBuy();
        popups.push({ x: coinX(), y: 96, t: 0, text: '+' + custNum(n * 2n) });   // the whole sum: the first half came with the window
        saveGame();
      });
    }
  }
  // ---------- customers: the first after 5 minutes of play, then every 15 minutes; he comes to the counter and waits 20 s ----------
  // he buys gingerbread for N = 400 taps + 150 s of the technika, counted once, when he comes; the sale is a rewarded ad
  const CUST_FIRST = 300, CUST_EVERY = 900, CUST_WAIT = 20, CUST_AD_GAP = 60000, CUST_FADE = 0.3;
  const CUST_X = 220, CUST_FEET = 146;   // on the screen: x 150, the soles at y 126 (the scene is moved left and up)
  // on the local copy the address ?customer brings the first one 5 s after the start (for checks)
  const CUST_TEST = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]customer\b/.test(location.search);
  let custGap = CUST_FIRST;        // seconds of play until the next customer (saved)
  let cust = null;                 // {k, n, left, t, out, top, wet, winter}: out = seconds since he started to leave (null while he waits)
  let custLastKind = -1;           // the same kind never comes twice in a row
  let sale = null;                 // {n, t, done} while the selling screen is up: done = null, 'win' or 'fail'
  function custMenuOpen() {
    return (anyMenuOpenNow() && !panelOpen) || supportOpen || docsListOpen || docsOpen >= 0;   // the shop does not stop him
  }
  function custComes(kind) {
    const P = window.KUCHA_PEOPLE;
    let k = kind;
    if (!(k >= 0 && k < P.KINDS.length)) do { k = Math.floor(Math.random() * P.KINDS.length); } while (k === custLastKind);
    custLastKind = k;
    const top = window.KITCHEN_GUESTS.top(k, CUST_FEET), c = kitchen.now;
    cust = { k, n: BigInt(Math.floor(tapValue(tapLv) * 400 + autoPerSec() * 150)), left: CUST_WAIT, t: 0, out: null, top, wet: c.season !== 3 && c.wet > 0.3, winter: c.season === 3 };   // in the rain with an umbrella, in winter in a hat
    custGap = CUST_EVERY;
    kitchen.things.guestComes();     // the sign on the chains swings
    kitchen.baker.wave(CUST_WAIT);   // the cook waves to him with the spoon when his hands are free
  }
  function updateCustomers(dt) {
    if (sale) {
      sale.t += dt;
      // the selling screen waits for the ad (at most 2 minutes, so that a lost answer never locks the game)
      if (!sale.done && sale.t < 120) loadingLeft = Math.max(loadingLeft, 0.05);
      else if (loadingLeft <= 0) {
        if (sale.done === 'win') { kitchen.baker.give(settings.animBg); if (cust) cust.sold = true; sfxBuy(); popups.push({ x: coinX(), y: 96, t: 0, text: '+' + custNum(sale.n) }); }
        sale = null;
        if (cust && !cust.sold) cust.out = 0;
      }
      return;
    }
    if (cust && cust.out !== null) {
      cust.out += dt;
      if (cust.out >= CUST_FADE) cust = null;
      return;
    }
    if (cust) cust.t += dt;
    if (cust && cust.sold) { if (!kitchen.baker.giving) cust.out = 0; return; }   // he waits for his bag and leaves with it
    // the clock and his waiting stand still while a menu, a message, an ad or the start screen is up
    if (rewardAdOpen || noticeWin || offlineWin || lvlWin || consentOpen || splashT > 0 || loadingLeft > 0 || launchState !== 'ok' || custMenuOpen()) return;
    const adJust = Date.now() - lastAdAt < CUST_AD_GAP;
    if (cust) {
      if (adJust) { cust.out = 0; custGap = 0; return; }   // another ad was watched meanwhile: he comes back when the minute is over
      cust.left -= dt;
      if (cust.left <= 0) cust.out = 0;
      return;
    }
    custGap = Math.max(0, custGap - dt);
    if (custGap <= 0 && !adJust) custComes();
  }
  // 48200 -> 48 200; from a million on the short form
  function custNum(n) {
    return n < 1000000n ? String(n).replace(/\B(?=(\d{3})+$)/g, ' ') : fmt(n);
  }
  function custLabel() { return '+' + custNum(cust.n); }
  function tapCustomer(gx, gy) {
    if (!cust || cust.out !== null || cust.sold || sale) return false;
    const [x0, y0, x1, y1] = custBubbleBox();
    if (!inZone(gx, gy, CUST_X - 4, cust.top - 6, CUST_X + 18, CUST_FEET + 2) && !inZone(gx, gy, x0, y0, x1, y1)) return false;
    if (Date.now() < rewardAdReadyAt) { showCooldown(); return true; }   // the sale never starts during the cooldown
    askAd(custLabel() + ' ПРЯНИКОВ', startSale);
    return true;
  }
  // the selling screen: the ad runs on it (with the ad-free purchase there is no ad)
  function startSale() {
    if (!cust) return;
    const s = { n: cust.n, t: 0, done: null };
    sale = s;
    loadingLabel = 'ПРОДАЁМ ПРЯНИКИ...';
    loadingLeft = 2.5;
    showRewardAd(() => {
      s.done = 'win';
      earn(s.n);
      custServed += 1;
      saveGame();
    }, () => { s.done = 'fail'; if (sale === s) loadingLeft = 0; });
  }
  function custAlpha() {
    return cust.out !== null ? Math.max(0, 1 - cust.out / CUST_FADE) : Math.min(1, cust.t / CUST_FADE);
  }
  function drawCustomer() {
    ctx.globalAlpha = custAlpha();
    window.KITCHEN_GUESTS.draw(ctx, cust.k, CUST_X, CUST_FEET, { t: cust.t, anim: settings.animBg, wet: cust.wet, winter: cust.winter });
    if (cust.sold) kitchen.baker.drawGift(ctx, CUST_X + 6, cust.top, CUST_FEET);   // the bag in his hands
    ctx.globalAlpha = 1;
  }
  function custFrame(x0, y0, x1, y1) {
    fillRect(x0, y0, x1 - x0, y1 - y0, COL.panel);
    fillRect(x0, y0, x1 - x0, 1, accent());
    fillRect(x0, y1 - 1, x1 - x0, 1, accent());
    fillRect(x0, y0, 1, y1 - y0, accent());
    fillRect(x1 - 1, y0, 1, y1 - y0, accent());
  }
  // one line; its right frame is the last pixel column of the screen
  function custBubbleBox() {
    const w = textWidth(custLabel(), 1) + 10, x1 = SCENE_CROP_X + PHONE_W;
    return [x1 - w, 80, x1, 94];
  }
  function drawCustomerBubble() {
    const [x0, y0, x1, y1] = custBubbleBox();
    custFrame(x0, y0, x1, y1);
    drawText(custLabel(), 1, (x0 + x1) / 2, y0 + 3, accent(), 'center');
    fillRect(CUST_X + 6, y1, 2, Math.max(1, cust.top - 3 - y1), accent());
  }
  function watchSkinAd(id) {
    askAd('ПРОГРЕСС К СКИНУ', () => showRewardAd(() => grantSkinView(id)));
  }
  function grantSkinView(id) {   // with the ad-free purchase one tap counts as all the views
    const k = SKINS.find((s) => s.id === id);
    if (!k || skinOwned[id]) return;
    skinAdViews[id] = premiumOwned.noads ? skinAdNeed(k) : (skinAdViews[id] || 0) + 1;
    if (skinAdViews[id] >= skinAdNeed(k)) { skinOwned[id] = true; skinAdViews[id] = 0; sfxBuy(); offerSkin(id); }
    saveGame();
  }
  // a fir tree with three tiers: each tier has a dark edge, snow along its lower edge, and ornaments
  // a fir tree from a pixel map, 15 px wide and 19 px tall: a pointed top, three stepped tiers that widen downwards,
  // dark green edges, snow on the branch tips, red / blue / gold ornaments, a blinking star, and a trunk
  const TREE_MAP = [
    '       s       ',
    '       G       ',
    '      GGG      ',
    '     GGWGG     ',
    '    GGGGGWG    ',
    '     GGGGG     ',
    '    GGOGGGG    ',
    '   GGGGGGGGG   ',
    '  GGGGGGGGGGG  ',
    '   GGGBGGGGG   ',
    ' GGGGGGGGGGGGG ',
    'GGWGGGGGGGGGWGG',
    'GGGGGGGGGGGGGGG',
    '     TTTTT     ',
    '     TTTTT     ',
  ];
  const TREE_COL = { G: '#2E8B3E', D: '#1F5A2A', W: '#FFFFFF', O: '#FF3A3A', B: '#4AB8FF', Y: '#FFD84A', T: '#6B4A2A' };
  function drawTree(tx, base) {
    const top = base - TREE_MAP.length;
    TREE_MAP.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        let ch = row[x];
        if (ch === ' ') continue;
        if (ch === 's') {
          if (Math.sin(cookT * 6) > 0) fillRect(tx - 7 + x, top + y, 1, 1, '#FFD84A');   // the star blinks
          continue;
        }
        if (ch === 'G' && (x === 0 || row[x - 1] === ' ')) ch = 'D';                    // dark edge on the left of each tier
        fillRect(tx - 7 + x, top + y, 1, 1, TREE_COL[ch]);
      }
    });
  }
  // one painted egg, centred on (x, y): pastel with a white stripe
  function drawEgg(x, y, col) {
    const im = fxArt('egg' + col, 9, 11, (P) => {
      const c = [1, 3, 5].map((k) => parseInt(col.substr(k, 2), 16)), t = (to, k) => 'rgb(' + c.map((v, i) => Math.round(v + (to[i] - v) * k)).join(',') + ')';
      const T = [t([28, 26, 74], 0.5), t([28, 26, 74], 0.22), col, t([255, 250, 225], 0.4), t([255, 250, 225], 0.8)];
      for (let yy = 0; yy < 11; yy++) for (let xx = 0; xx < 9; xx++) {
        const u = (xx - 4) / (yy < 5 ? 2.6 + yy * 0.3 : 4.2), v = (yy - 5.5) / 5.4; if (u * u + v * v > 1) continue;
        let k = Math.max(0, Math.min(4, Math.floor((0.55 - u * 0.36 - v * 0.34) * 5)));
        if (yy === 5 || (yy === 4 && xx % 3 === 0)) P(xx, yy, k > 1 ? '#FFFFFF' : '#C8C4E0'); else if (yy === 8 && xx % 2) P(xx, yy, '#FFF6A0'); else P(xx, yy, T[k]);
      }
    });
    ctx.drawImage(im, x - 4, y - 5);
  }
  // a carved pumpkin standing on the floor at (px, base); its face glows when the candle is lit
  function drawPumpkin(px, base, s, lit) {
    const R = (v) => Math.round(v * s);
    const top = base - R(9);
    for (let y = 0; y < R(9); y++) for (let x = -R(6); x <= R(6); x++) {
      const ex = x / R(6), ey = (y - R(4.5)) / R(4.5);
      if (ex * ex + ey * ey <= 1) {
        const rib = x % 3 === 0 && Math.abs(ex) > 0.3;
        fillRect(px + x, top + y, 1, 1, rib ? '#B84E0C' : ey > 0.3 ? '#D9701A' : '#FF8A2A');
      }
    }
    fillRect(px, top - 2, 1, 2, '#3A7A2A');                 // stem
    fillRect(px + 1, top - 2, 2, 1, '#4E9A3A');             // leaf
    const face = lit ? '#FFD84A' : '#2A1200';
    fillRect(px - R(3), top + R(3), 2, 2, face);            // eyes
    fillRect(px + R(2), top + R(3), 2, 2, face);
    fillRect(px - R(3), top + R(6), R(6), 1, face);         // mouth
    fillRect(px - R(2), top + R(7), 1, 1, face);            // teeth
    fillRect(px + 1, top + R(7), 1, 1, face);
    if (lit) {
      ctx.globalAlpha = 0.4;
      fillRect(px - R(4), top + R(2), R(8), R(6), '#FFE27A');   // the light through the face
      ctx.globalAlpha = 1;
    }
  }
  // a snowman, drawn at (sx, base); big or small
  function drawSnowman(sx, base, big) {
    const s = big ? 1 : 0.75;
    const R = (v) => Math.round(v * s);
    fillRect(sx - R(4), base - R(6), R(9), R(6), '#FFFFFF');
    fillRect(sx - R(3), base - R(11), R(7), R(5), '#FFFFFF');
    fillRect(sx - R(2), base - R(15), R(5), R(4), '#FFFFFF');
    fillRect(sx - R(3), base - R(17), R(7), R(2), '#2A2A2A');       // hat brim
    fillRect(sx - R(2), base - R(22), R(5), R(5), '#2A2A2A');       // hat
    fillRect(sx - 1, base - R(13), 1, 1, '#2A2A2A');                 // eyes
    fillRect(sx + 1, base - R(13), 1, 1, '#2A2A2A');
    fillRect(sx - 1, base - R(9), 1, 1, '#2A2A2A');                  // buttons
    fillRect(sx + 2, base - R(11), 2, 1, '#FF8A1A');                 // carrot nose
    const wave = Math.round(Math.sin(cookT * 4));
    fillRect(sx - R(3), base - R(14) + 3, R(7), 1, '#D83A3A');        // scarf (3 px lower)
    fillRect(sx + R(3) + wave, base - R(13) + 3, 2, 2, '#D83A3A');    // the scarf end waves (3 px lower)
  }
  // the fish: swim from one end of the cookie to the other, wobbling, then fade away; three shapes
  function drawFishes() {
    for (const f of fishes) {
      const k = f.t / 2.2;
      // from one end of the cookie to the other, in the direction of its swim
      const u = k * 2 - 1;
      const px_ = Math.round(f.ax + u * f.dir * f.rx * 1.1), py_ = Math.round(f.ay + f.dy + Math.sin(f.t * 7) * 1.5);
      const alpha = Math.min(1, f.t / 0.3) * Math.min(1, (2.2 - f.t) / 0.3);
      ctx.globalAlpha = Math.max(0, alpha);
      const P = (lx, ly) => [px_ + lx * f.dir, py_ + ly];
      const put = (lx, ly, w, h, col) => { const [x, y] = P(lx, ly); fillRect(f.dir > 0 ? x : x - w + 1, y, w, h, col); };
      const tw = Math.round(Math.sin(f.t * 12));
      if (f.type === 0) {
        // round fish: a short oval body and a small tail
        put(-4 + tw, -1, 2, 3, f.col);
        put(-2, -2, 5, 5, f.col);
        put(-1, 2, 3, 1, '#FFFFFF');
        put(1, -1, 1, 1, '#1A1A2A');
      } else if (f.type === 1) {
        // long fish: a slim body and a forked tail that wiggles
        put(-6 + tw, -2, 2, 1, f.col);
        put(-6 + tw, 2, 2, 1, f.col);
        put(-5, -1, 1, 3, f.col);
        put(-4, -1, 8, 3, f.col);
        put(-2, 1, 6, 1, '#FFFFFF');
        put(2, -1, 1, 1, '#1A1A2A');
      } else {
        // angelfish: a tall body with long fins on the top and bottom
        put(-5 + tw, -1, 2, 3, f.col);
        put(-3, -4, 4, 9, f.col);
        put(-1, -6, 2, 2, f.col);
        put(-1, 4, 2, 2, f.col);
        put(0, 1, 1, 1, '#1A1A2A');
        put(-2, -2, 1, 5, '#FFFFFF');
      }
    }
    ctx.globalAlpha = 1;
  }
  // the sleigh of Santa with two reindeer: in the game it flies across the whole screen, in the preview it fades in and out
  function drawDeers() {
    const D = ['...........a..a..a.', '...........aa.aaa..', '............aaaa...', '............bab....', '...........ebBBb...', '............bBkBB..', '...........bbBBBBn.', '...........bBbbww..', 'w.........RRBb.....', 'wbbBBBBBBBRYbb.....', '.bBBBBBBBBRBbb.....', '.bBBBBBBBBRBbb.....', '.bbbbwwwwwbRb......'];
    const L = [['.bb.bb....bb.bb....', 'bb...bb..bb...bb...', 'k.....k..k.....k...'], ['..bbb......bbb.....', '...bb......bb......', '...kk.....kk.......']];
    const pal = { a: '#E8C890', b: '#8A4E24', B: '#B87038', e: '#6A381C', k: '#2A1620', w: '#FFF0D8', n: '#FF4040', R: '#D82A40', Y: '#FFD860' };
    const SL = ['..........RRR.............', '.........LRRRr............', '........LRRRRrr...........', '.......WWWWWWW............', '...gG..WSSkSSn............', '..gGGg..SSSSS.............', '.GBBBBg.WWWWWW............', 'GBBYBBBgWWWWWWR...........', 'BBBYBBbLRWWWWRRrMM........', 'BBYYYBbRRRWWRRrrMM........', 'bBBYBBbRRRKKRRr...........', 'YYYYYYYYYYYYYYYYYYYY...YY.', '.RLLLLLLLLLLLRRRRRRR..YY.Y', '.RRYRRRYRRRYRRRYRRRRRRR..Y', '..RRRRRRRRRRRRRRRRRrrr....', '...rrrrrrrrrrrrrrrrrr.....', '.....y....y.....y..y......', 'y...yyyyyyyyyyyyyyyyyyy...', '.yyyyyyyyyyyyyyyyyyyyyyyy.'];
    const sp = { R: '#D82A40', L: '#FF7A70', r: '#8A1030', W: '#FFFFFF', S: '#F4C49A', k: '#2A1620', n: '#E88A78', g: '#8A5A24', G: '#E0B070', B: '#A8743C', b: '#6A4424', Y: '#FFD860', M: '#3A8A54', K: '#2A1620', y: '#E8A830' };
    for (const d of deers) {
      const prev = d.ax === 160 && d.ay === 67, T = 7, k = d.t / T, span = prev ? 60 : 250;
      const x0 = Math.round(160 + (k * 2 - 1) * span - 38), y0 = Math.round(d.ay - (prev ? 6 : 34) + d.dy * 0.35 - Math.sin(k * Math.PI) * 10);
      const alpha = prev ? Math.max(0, Math.min(1, d.t / 0.8, (T - d.t) / 0.8)) : 1;
      for (let i = 0; i < 26; i++) {                                              // the golden dust behind the sleigh
        const q = (cookT * 0.9 + i / 26) % 1, r = Math.sin(i * 47.3) * 99.7, v = r - Math.floor(r);
        ctx.globalAlpha = alpha * (1 - q) * 0.95; const sx = Math.round(x0 - 2 - q * (prev ? 24 : 46)), sy = Math.round(y0 + 15 + (v - 0.5) * 12 * (0.3 + q) + q * 7);
        fillRect(sx, sy, q < 0.4 && (i & 1) ? 2 : 1, 1, ['#FFFFFF', '#FFE27A', '#F4B428'][i % 3]); if (i % 7 === 0) fxStar(sx, sy, (1 - q) * 0.9, '#FFFFFF', '#FFE27A');
      }
      ctx.globalAlpha = alpha;
      const bob = (n) => Math.round(Math.sin(d.t * 5 + n * 1.1) * 1.4);
      ctx.drawImage(fxMap('nySleigh', SL, sp), x0, y0 + bob(0));
      fillRect(x0 + 18, y0 + 9 + bob(0), 45, 1, '#7C4410');                       // the reins
      for (let n = 0; n < 2; n++) {
        const f = (Math.floor(d.t * 7) + n) & 1, dx = x0 + 28 + n * 23, dy = y0 - 1 + bob(n + 1);
        ctx.drawImage(fxMap('nyDeer' + f, D.concat(L[f]), pal), dx, dy);
        if (n) { fillRect(dx + 16, dy + 5, 3, 3, 'rgba(255, 70, 60, ' + (0.3 + 0.25 * Math.sin(cookT * 8)).toFixed(2) + ')'); fillRect(dx + 17, dy + 6, 1, 1, '#FF5048'); }
      }
      ctx.globalAlpha = 1;
    }
  }
  // the new year snow: falls over the whole background, drifting from side to side
  function drawSnowFull() {
    // three depths: small far flakes, middle ones, and big near flakes of six rays; every flake has its own column, so the whole width is even
    const big = fxMap('nyFlake', ['..x..', 'x.x.x', '.xox.', 'x.x.x', '..x..'], { x: '#FFFFFF', o: '#CFE8FF' });
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();   // the phone's canvas is taller than the scene
    const layer = (n, sp, f) => { for (let i = 0; i < n; i++) { const r = Math.sin(i * 91.7 + n) * 4758.5, q = r - Math.floor(r), v = sp * (0.8 + q * 0.5); f(Math.round((i + q) * W / n + Math.sin(cookT * (0.6 + q) + i * 2.1) * (sp / 4)), Math.round((cookT * v + q * 977 + i * 61) % (H + 10)) - 5, i); } };
    layer(90, 13, (x, y) => { ctx.globalAlpha = 0.75; fillRect(x, y, 1, 1, '#E4EEFF'); });
    ctx.globalAlpha = 0.95;
    layer(60, 21, (x, y, i) => { fillRect(x + 1, y + 1, 2, 2, 'rgba(52, 48, 100, 0.3)'); fillRect(x, y, 2, 2, '#FFFFFF'); if (i & 1) fillRect(x + 1, y + 1, 1, 1, '#CFE0FA'); });
    layer(14, 30, (x, y) => { fillRect(x, y + 1, 5, 4, 'rgba(52, 48, 100, 0.18)'); ctx.drawImage(big, x - 1, y - 1); });
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  // the ghosts of the ghost skin: a 9x9 pixel ghost, see-through, rising and wobbling as it fades out
  function drawGhosts() {
    for (const gh of ghostSprites) {
      const T = 2.6;
      const k = gh.t / T;
      // it orbits the cookie, a little closer and then further out, and rises slowly
      const ang = gh.ang0 + gh.dir * gh.t * gh.spin;
      const r = 40;
      const size = gh.big ? 11 : 9;
      // a small sideways sway of 2 px on top of the orbit
      const sway = Math.round(Math.sin(gh.t * 12) * 2);
      const x = Math.round(gh.ax + Math.cos(ang) * r - size / 2) + sway, y = Math.round(gh.ay + Math.sin(ang) * r * 0.7 - size / 2 - k * 8);
      const fade = Math.min(1, gh.t / 0.3) * Math.max(0, 1 - Math.max(0, gh.t - (T - 0.6)) / 0.6);
      ctx.globalAlpha = fade * 0.6;
      const col = gh.col || '#E6FFF0';
      // the body: a round top and a wavy hem that flutters
      const w = size, h = size - 3;
      fillRect(x + 2, y, w - 4, 1, col);
      fillRect(x + 1, y + 1, w - 2, h - 2, col);
      fillRect(x, y + 2, w, h - 3, col);
      const flutter = Math.floor(gh.t * 8) % 2;
      for (let i = 0; i < w; i += 2) fillRect(x + i + (flutter && i % 4 === 0 ? 1 : 0), y + h - 1, 1, 2, col);
      // the eyes: open, and a blink now and then; a little mouth "o" when it is excited
      const blink = Math.floor(gh.t * 2.5) % 7 === 6;
      const ey = y + Math.round(h / 2) - 1;
      if (blink) {
        fillRect(x + 2, ey + 1, 2, 1, '#1B3B2A');
        fillRect(x + w - 4, ey + 1, 2, 1, '#1B3B2A');
      } else {
        fillRect(x + 2, ey, 2, 2, '#1B3B2A');
        fillRect(x + w - 4, ey, 2, 2, '#1B3B2A');
      }
      if (gh.big) fillRect(x + Math.floor(w / 2) - 1, ey + 3, 2, 1, '#1B3B2A');
      // sparkles trail behind it
      if (flutter) fillRect(x + w + 2, y + 1, 1, 1, '#B8FFC8');
    }
    ctx.globalAlpha = 1;
  }
  // a real feather, drawn pixel by pixel along its angle: a pale shaft, vanes that bulge and taper, and a flame colour
  // a feather: a pale shaft curved towards (tx, ty) by `bend` px in the middle, with vanes that swell and taper.
  // It is drawn with fine steps and every pixel only once, so no empty pixels slip through.
  function drawFeather(x0, y0, ang, L, alpha, tx, ty, bend) {
    // a fluffy flaming feather: a pale shaft curved towards (tx, ty), wide vanes with barbs that flicker,
    // colours from red at the base through orange to yellow at the tip, and small flames flicking off the edges
    const dx = Math.cos(ang), dy = Math.sin(ang), px_ = -dy, py_ = dx;
    const seen = new Set();
    ctx.globalAlpha = alpha;
    const put = (x, y, col) => {
      const key = x + ',' + y;
      if (seen.has(key)) return;
      seen.add(key);
      fillRect(x, y, 1, 1, col);
    };
    for (let t = 0; t <= L; t += 0.5) {
      const f = t / L;
      const bow = Math.sin(Math.PI * f) * bend;
      const cxp = x0 - dx * L / 2 + dx * t + tx * bow;
      const cyp = y0 - dy * L / 2 + dy * t + ty * bow;
      // fluffy: the vanes are wide in the middle and their barbs make notches that move with time
      const notch = ((Math.floor(t * 2) + Math.floor(cookT * 10)) % 3 === 0) ? 1 : 0;
      const w = Math.sin(Math.PI * f) * 7 + notch * 0.5;
      const flick = Math.sin(cookT * 14 + t * 1.3) > 0;
      for (let j = -w; j <= w; j += 0.5) {
        const x = Math.round(cxp + px_ * j), y = Math.round(cyp + py_ * j);
        const side = j < 0 ? -1 : 1;
        let col;
        if (Math.abs(j) < 0.5) col = '#FFF6C8';                                  // the shaft
        else if (f < 0.35) col = side < 0 ? '#E0301A' : '#FF5A1A';                // red at the base
        else if (f < 0.7) col = flick ? '#FF8A1A' : '#FF6A1A';                  // orange through the middle
        else col = flick ? '#FFE27A' : '#FFD04A';                               // yellow at the tip
        put(x, y, col);
      }
      // small flames flicking off the outer edge of the vanes
      if (f > 0.4 && Math.sin(cookT * 11 + t * 2.1) > 0.4) {
        const fx = Math.round(cxp + px_ * (w + 1)), fy = Math.round(cyp + py_ * (w + 1));
        put(fx, fy - 1, '#FFD04A');
      }
    }
    ctx.globalAlpha = 1;
  }
  // the shape of the cookie on screen, so a planet on the far side of its orbit disappears exactly behind it
  let fxMask = null;   // {data, w, h, ox, oy}: the cookie's alpha and where it sits on screen
  function maskHit(x, y) {
    const lx = x - fxMask.ox, ly = y - fxMask.oy;
    if (lx < 0 || ly < 0 || lx >= fxMask.w || ly >= fxMask.h) return false;
    return fxMask.data[(ly * fxMask.w + lx) * 4 + 3] > 0;
  }
  const thumbMaskCache = new Map();
  function thumbMask(img, ox, oy) {
    if (!img || !img.complete || !img.naturalWidth) return null;
    let data = thumbMaskCache.get(img);
    if (!data) {
      const cv = document.createElement('canvas');
      cv.width = 74; cv.height = 74;
      const c2 = cv.getContext('2d');
      c2.drawImage(img, 0, 0, 74, 74);
      data = c2.getImageData(0, 0, 74, 74).data;
      thumbMaskCache.set(img, data);
    }
    return { data, w: 74, h: 74, ox, oy };
  }
  // the main colour of each cookie, used for the +N popups
  function skinMainColor(id) {
    const map = {
      classic: '#C5763A', banana: '#F6D454', chocolate: '#7A4A2A', vanilla: '#F0D8A0', strawberry: '#E6829A',
      mint: '#96D2B4', ice: '#AADCF5', gold: '#F0BE3C', neon: '#8A5AC8', neontube: '#00E6D0', volcano: '#FF7A14',
      crystal: '#96E6FF', royal: '#FFCD3C', ghost: '#AAE6BE', starry: '#9AA6FF', newyear: '#B42828', solar: '#FFC850',
      sea: '#3C8CD2', zefir: '#FFB4D0', caramel: '#DC8C28', gzhel: '#2A5AC8', halloween: '#E0802A', easter: '#F7B6D2',
    };
    if (id === 'rainbow') return 'hsl(' + Math.round((cookT * 60) % 360) + ', 90%, 65%)';
    return map[id] || '#C5763A';
  }
  // the glow colour of each premium skin (a and the strength of it)
  function skinGlow(id, a) {
    if (id === 'volcano') return 'rgba(255, 130, 20, ' + a + ')';
    if (id === 'neontube') return 'rgba(0, 255, 230, ' + a + ')';
    if (id === 'crystal') return 'rgba(120, 220, 255, ' + a + ')';
    if (id === 'royal') return 'rgba(255, 205, 60, ' + a + ')';
    if (id === 'ghost') return 'rgba(140, 255, 170, ' + a + ')';
    if (id === 'rainbow') return 'hsla(' + Math.round((cookT * 60) % 360) + ', 100%, 60%, ' + a + ')';
    if (id === 'starry') return 'rgba(150, 170, 255, ' + a + ')';
    if (id === 'newyear') return 'rgba(255, 210, 120, ' + a + ')';
    if (id === 'solar') return 'rgba(255, 210, 90, ' + a + ')';
    if (id === 'zefir') return 'rgba(255, 150, 200, ' + a + ')';
    if (id === 'caramel') return 'rgba(255, 170, 40, ' + a + ')';
    if (id === 'gzhel') return 'rgba(60, 110, 220, ' + a + ')';
    if (id === 'halloween') return 'rgba(255, 120, 30, ' + a + ')';
    if (id === 'easter') return 'rgba(255, 170, 210, ' + a + ')';
    if (id === 'sea') return 'rgba(60, 160, 255, ' + a + ')';
    return 'rgba(255, 60, 220, ' + a + ')';
  }
  // the effects of the new skins, drawn around a picture at (cx, cy); echo() draws a faded copy of the picture (ghost)
  const NEW_FX_IDS = ['solar', 'crystal', 'royal', 'ghost', 'rainbow', 'starry', 'newyear', 'zefir', 'caramel', 'sea', 'gzhel', 'halloween', 'easter'];
  // small pictures of the skin effects, drawn once and kept
  const fxPics = {};
  function fxArt(key, w, h, draw) {
    if (fxPics[key]) return fxPics[key];
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d');
    draw((x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); });
    return (fxPics[key] = c);
  }
  function fxMap(key, rows, pal) {
    return fxPics[key] || fxArt(key, rows[0].length, rows.length, (P) => rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (pal[r[x]]) P(x, y, pal[r[x]]); }));
  }
  // a twinkle with soft rays; k: 0..1, its strength
  function fxStar(x, y, k, core, ray) {
    x = Math.round(x); y = Math.round(y);
    const L = Math.round(k * 3), a = ctx.globalAlpha;
    if (k <= 0) return;
    ctx.globalAlpha = a * Math.min(1, k * 0.8);
    if (L > 0) { fillRect(x - L, y, L * 2 + 1, 1, ray); fillRect(x, y - L, 1, L * 2 + 1, ray); }
    ctx.globalAlpha = a * Math.min(1, k * 1.5);
    fillRect(x, y, 1, 1, core);
    if (L > 1) { fillRect(x - 1, y, 3, 1, core); fillRect(x, y - 1, 1, 3, core); }
    ctx.globalAlpha = a;
  }
  // a shaded ball of five tones, the light from the top left
  function fxBall(key, r, tones) {
    return fxArt(key, r * 2 + 1, r * 2 + 1, (P) => { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { const d = x * x + y * y; if (d > r * r + 0.8) continue; const v = 0.5 - (x + y) / (r * 2.6 + 0.8) + (((x + y) & 1) ? 0.06 : -0.06); P(x + r, y + r, tones[Math.max(0, Math.min(4, Math.floor(v * 5)))]); } });
  }
  // additions of the other premium skins: the same in the game, in the preview and in the purchase window
  function drawSkinPlus(id, cx, cy, rx, ry) {
    if (id === 'neontube') {
      // two bright runs of current go round the tube and leave a trail; sparks fly off at the arc
      for (let n = 0; n < 2; n++) for (let k = 0; k < 12; k++) {
        const a = (n ? -1.5 : 1.8) * (cookT - k * 0.028) + n * 2;
        ctx.globalAlpha = 1 - k / 12;
        fillRect(Math.round(cx + Math.cos(a) * rx * (n ? 0.98 : 1.06)), Math.round(cy + Math.sin(a) * ry * (n ? 0.98 : 1.06)), k < 3 ? 2 : 1, k < 3 ? 2 : 1, k < 2 ? '#FFFFFF' : n ? '#FF6AE0' : '#4AF4FF');
      }
      const ph = cookT % 2.2, a0 = Math.floor(cookT / 2.2) * 2.39 + 0.6;
      if (ph < 0.6) for (let i = 0; i < 8; i++) { const a = a0 + (i - 3.5) * 0.22, d = ph * (22 + i * 4 % 13); ctx.globalAlpha = 1 - ph / 0.6; fillRect(Math.round(cx + Math.cos(a) * (rx + d)), Math.round(cy + Math.sin(a) * (ry + d) + ph * ph * 40), 1, 1, i % 2 ? '#FFFFFF' : '#FFF07A'); }
      ctx.globalAlpha = 1;
    } else if (id === 'neon') {
      // a spiral of star dust, a ringed planet and a rocket with a flame on its orbit
      for (let i = 0; i < 26; i++) { const a = cookT * 0.35 + i * 0.5, d = 1.02 + (i % 7) * 0.05; ctx.globalAlpha = 0.35 + 0.5 * Math.abs(Math.sin(cookT * 1.8 + i)); fillRect(Math.round(cx + Math.cos(a) * rx * d), Math.round(cy + Math.sin(a) * ry * d), 1, 1, ['#FFFFFF', '#C87AFF', '#7DF9FF', '#FF8AE0'][i % 4]); }
      ctx.globalAlpha = 1;
      const px = Math.round(cx - rx * 1.2), py = Math.round(cy - ry * 0.95 + Math.sin(cookT) * 2);
      fillRect(px - 8, py + 1, 4, 1, '#F0C8FF'); ctx.drawImage(fxBall('spaceball', 5, ['#3A1060', '#6A20A0', '#A83AC8', '#E86AE0', '#FFC4F4']), px - 5, py - 5); fillRect(px - 7, py + 2, 15, 1, '#D890F0'); fillRect(px - 5, py + 3, 11, 1, '#8A48C0'); fillRect(px + 5, py, 4, 1, '#F0C8FF');
      const a = cookT * 0.8, x = Math.round(cx + Math.cos(a) * rx * 1.25), y = Math.round(cy + Math.sin(a) * ry * 1.15);
      for (let k = 1; k < 9; k++) { const b = a - k * 0.05; ctx.globalAlpha = 1 - k / 9; fillRect(Math.round(cx + Math.cos(b) * rx * 1.25), Math.round(cy + Math.sin(b) * ry * 1.15), k < 4 ? 2 : 1, k < 4 ? 2 : 1, k < 3 ? '#FFF3A0' : k < 6 ? '#FF9A3A' : '#B04AE0'); }
      ctx.globalAlpha = 1;
      fillRect(x - 2, y - 2, 4, 4, '#E8ECFF'); fillRect(x - 2, y - 2, 4, 1, '#FFFFFF'); fillRect(x + 1, y - 1, 1, 3, '#8A90C0'); fillRect(x - 1, y - 1, 1, 1, '#3AA0FF'); fillRect(x - 1, y - 3, 2, 1, '#FF4A6A');
    } else if (id === 'volcano') {
      // heavy smoke of three tones, cooling lava drops on arcs, and heat shining from below
      for (let i = 0; i < 6; i++) {
        const life = (cookT * 0.22 + i / 6) % 1, r = 1 + Math.round(life * 3), x = Math.round(cx - rx * 0.5 + (i * 0.618 % 1) * rx + Math.sin(cookT + i * 2) * 3 + life * 6), y = Math.round(cy - ry * 0.85 - life * 22);
        ctx.globalAlpha = 0.6 * (1 - life);
        fillRect(x - r, y - r + 1, r * 2 + 1, r * 2 - 1, '#4A3C48'); fillRect(x - r + 1, y - r, r * 2 - 1, r * 2 + 1, '#4A3C48'); fillRect(x - r + 1, y - r, r, r, '#7A6870'); if (life < 0.35) fillRect(x - r + 1, y + r - 1, r * 2 - 1, 1, '#E8702A');
      }
      for (let i = 0; i < 7; i++) {
        const life = (cookT * 0.5 + i * 0.143) % 1, dir = i & 1 ? 1 : -1, x = Math.round(cx + dir * (rx * 0.3 + life * rx * (0.5 + i * 0.07))), y = Math.round(cy - ry * 0.8 - Math.sin(life * 3.14) * (14 + i * 2) + life * life * ry * 1.6);
        ctx.globalAlpha = Math.min(1, (1 - life) * 3);
        fillRect(x, y, 2, 2, life < 0.3 ? '#FFF3A0' : life < 0.6 ? '#FFB02E' : life < 0.85 ? '#E8501A' : '#7A2414'); fillRect(x - dir, y - 1, 1, 1, '#FF8A2A');
      }
      for (let i = 0; i < 12; i++) { const a = 0.35 + i * 0.22; ctx.globalAlpha = 0.35 + 0.35 * Math.sin(cookT * 5 + i * 2); fillRect(Math.round(cx + Math.cos(a) * rx * 1.04), Math.round(cy + Math.sin(a) * ry * 1.06), 2, 1, i & 1 ? '#FFB02E' : '#FF6A1A'); }
      ctx.globalAlpha = 1;
    }
  }
  // ---- the New Year skin: the fir tree, the snowman and the gifts at the sides of the cookie
  const nyTree = () => fxArt('nyTree', 27, 39, (P) => {
    const T = ['#06201E', '#0C3428', '#165036', '#247048', '#46985A', '#86C474'], rnd = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5; return v - Math.floor(v); };
    for (let y = 33; y < 38; y++) for (let x = 11; x < 16; x++) P(x, y, ['#93694B', '#7C5238', '#6B4030', '#55302A', '#3C2024'][x - 11]);
    [[4, 13, 7], [10, 23, 10], [18, 35, 13]].forEach(([y0, y1, w], n) => {
      for (let y = y0; y < y1; y++) {
        const q = (y - y0) / (y1 - y0), half = Math.min(13, Math.round(1 + q * (w - 1)));
        for (let x = -half; x <= half; x++) {
          if (y === y1 - 1 && rnd(x, n) < 0.35) continue;
          let v = 3.2 - (x / w) * 1.6 - q * 1.3 + (rnd(x, y) - 0.5) * 1.6; if (Math.abs(x) >= half) v = x < 0 ? 1.6 : 0;
          P(13 + x, y, T[Math.max(0, Math.min(5, Math.round(v)))]);
        }
        if (q < 0.45) for (let x = -half; x < 0; x++) if (rnd(x, y + 40) < 0.45 - q * 0.6) P(13 + x, y, x < -half + 2 ? '#FFFFFF' : '#DCE8FA');   // the snow on the branches
      }
    });
    [[10, 11], [15, 18], [8, 20], [18, 29], [11, 27], [5, 32], [14, 33], [21, 33]].forEach(([x, y], i) => { const c = [['#FFC0B8', '#E83048', '#8A1030'], ['#FFF6C8', '#F4B428', '#A86018'], ['#C8E8FF', '#3A86F0', '#1C3C9C']][i % 3]; P(x, y, c[0]); P(x + 1, y, c[1]); P(x, y + 1, c[1]); P(x + 1, y + 1, c[2]); });
    for (const [x, y, c] of [[13, 0, '#FFF6C8'], [13, 1, '#FFE27A'], [12, 2, '#FFE27A'], [13, 2, '#FFFFFF'], [14, 2, '#F0A828'], [11, 2, '#FFE27A'], [15, 2, '#F0A828'], [12, 3, '#FFD84A'], [13, 3, '#FFD84A'], [14, 3, '#F0A828'], [12, 4, '#F0A828'], [14, 4, '#C87A1C']]) P(x, y, c);
  });
  const nyMan = () => fxArt('nyMan', 23, 29, (P) => {
    const T = ['#7C8CC4', '#A8B8E4', '#D0DCF6', '#F0F5FF', '#FFFFFF'];
    const ball = (cx, cy, r) => { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { const d = x * x + y * y; if (d > r * r + 1) continue; const v = 0.62 - (x + y) / (r * 2.9) + ((x + y) & 1 ? 0.05 : -0.05) + (d > r * r - r && x + y > r * 0.6 ? 0.12 : 0); P(cx + x, cy + y, T[Math.max(0, Math.min(4, Math.floor(v * 5)))]); } };
    ball(11, 21, 7); ball(11, 11, 5);
    for (let i = 0; i < 5; i++) { P(3 - (i >> 1), 18 - i, '#5A3A24'); P(19 + (i >> 1), 18 - i, '#7A5034'); } P(0, 15, '#5A3A24'); P(22, 15, '#7A5034');
    for (const [x, y] of [[9, 10], [13, 10]]) { P(x, y, '#1C1A2A'); P(x, y + 1, '#1C1A2A'); }
    for (const [x, y, c] of [[11, 11, '#FFB04C'], [12, 11, '#F0841E'], [13, 12, '#D0661E'], [12, 12, '#F0841E'], [8, 12, '#FFB4C0'], [14, 13, '#F8B0C0'], [10, 14, '#4A4468'], [11, 14, '#4A4468'], [12, 14, '#4A4468']]) P(x, y, c);
    for (let x = 6; x < 17; x++) { P(x, 15, x < 10 ? '#FF7A70' : x < 14 ? '#E03A48' : '#B81C34'); P(x, 16, x & 1 ? '#FFF2E0' : '#B81C34'); }
    for (let y = 17; y < 22; y++) for (let x = 14; x < 17; x++) P(x, y, y === 21 ? (x & 1 ? '#FFF2E0' : '#B81C34') : x === 14 ? '#E03A48' : x === 15 ? '#C8283C' : '#8A1030');
    for (const y of [19, 23]) { P(10, y, '#3A3454'); P(11, y, '#1C1A2A'); }
    for (let x = 6; x < 17; x++) { P(x, 6, x < 14 ? '#FFFFFF' : '#D0DCF6'); P(x, 7, x < 12 ? '#F0F5FF' : '#B8C8EC'); }
    for (let y = 1; y < 6; y++) for (let x = 7 + (y < 3 ? 2 : 0) + (y < 2 ? 1 : 0); x < 16 + (y < 4 ? 1 : 0); x++) P(x, y, x < 10 ? '#FF7A70' : x < 13 ? '#E03A48' : x < 15 ? '#B81C34' : '#7C0E28');
    for (const [x, y, c] of [[17, 3, '#FFFFFF'], [18, 3, '#F0F5FF'], [17, 4, '#F0F5FF'], [18, 4, '#B8C8EC']]) P(x, y, c);
  });
  const nyGift = (w, h, c, r) => fxArt('nyGift' + w + h + c[0], w + 2, h + 4, (P) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) P(x + 1, y + 4, x === w - 1 || y === h - 1 ? c[2] : x === 0 || y === 2 ? c[0] : c[1]);
    for (let x = 0; x < w + 2; x++) { P(x, 4, c[0]); P(x, 5, x > w - 1 ? c[2] : c[1]); if (x && x < w + 1) P(x, 6, c[2]); }
    const m = (w >> 1) + 1; for (let y = 4; y < h + 4; y++) { P(m, y, r[1]); P(m - 1, y, r[0]); }
    for (const [x, y, q] of [[-3, 2, 1], [-3, 1, 0], [-2, 1, 0], [-2, 3, 1], [-1, 2, 0], [-1, 3, 1], [0, 3, 1], [1, 2, 0], [2, 1, 0], [2, 3, 1], [1, 3, 1], [-2, 2, 2], [2, 2, 1]]) P(m + x, y, r[q]);
  });
  function nyScene(cx, base) {
    const T = cx + 46, M = cx - 70, RD = ['#FF7A70', '#E03A48', '#8A1030'], GD = ['#FFF2B0', '#F4B428', '#A86018'], BL = ['#8AC0FF', '#3A7AD8', '#1C3C8C'], GR = ['#8ADCA0', '#38A05C', '#1C5C3C'], WH = ['#FFFFFF', '#E4ECFA', '#A8B8E0'];
    for (const [x0, x1] of [[-76, -30], [30, 78]]) for (let x = x0; x <= x1; x++) { const e = Math.min(1, (x - x0) / 8, (x1 - x) / 8), q = Math.round(e * (2.2 + Math.sin(x * 0.31) + Math.sin(x * 0.13 + 1) * 0.8)); if (q > 0) { fillRect(cx + x, base - q + 1, 1, q, '#E6EEFC'); fillRect(cx + x, base - q + 1, 1, 1, '#FFFFFF'); fillRect(cx + x, base + 1, 1, 1, '#9CB0DC'); } }
    ctx.drawImage(nyTree(), T, base - 37);
    [[8, 13], [17, 14], [12, 17], [6, 25], [19, 24], [14, 29], [9, 32], [22, 31]].forEach(([x, y], i) => { const a = Math.sin(cookT * 3 + i * 1.7); if (a > 0) { const c = ['255, 90, 90', '255, 216, 74', '90, 224, 255'][i % 3]; fillRect(T + x - 1, base - 38 + y, 3, 3, 'rgba(' + c + ', ' + (a * 0.4).toFixed(2) + ')'); fillRect(T + x, base - 37 + y, 1, 1, a > 0.6 ? '#FFFFFF' : 'rgb(' + c + ')'); } });
    fxStar(T + 13, base - 35, 0.6 + 0.4 * Math.sin(cookT * 4), '#FFFFFF', '#FFE27A');
    ctx.drawImage(nyMan(), M, base - 27);
    for (const [g, x] of [[nyGift(9, 8, RD, GD), -47], [nyGift(7, 6, BL, WH), -37], [nyGift(8, 7, GD, RD), 36], [nyGift(7, 5, GR, WH), 68]]) ctx.drawImage(g, cx + x, base + 1 - g.height);
  }
  function drawNewFx(id, cx, cy, rx, ry, echo) {
    if (id === 'crystal') {
      // a glint runs round the rim; faceted crystals of five tones grow out of it; ice dust falls
      [[-1.9, 12, 4], [-1.25, 14, 5], [-1.55, 9, 3], [1.1, 10, 4], [2.2, 8, 3]].forEach(([ang, L0, W0], i) => {
        const sh = Math.sin(cookT * 1.6 + i * 1.3);
        const im = fxArt('cr' + i, 40, 40, (P) => {
          const dx = Math.cos(ang), dy = Math.sin(ang);
          for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) {
            const s = (x - 20) * dx + (y - 20) * dy, j = -(x - 20) * dy + (y - 20) * dx, half = s < 0 ? -1 : s < L0 * 0.55 ? W0 * (0.7 + s / L0 * 0.55) : W0 * (L0 - s) / (L0 * 0.45);
            if (Math.abs(j) > half || s > L0) continue;
            const l = j * dy * -1 + j * dx * 0.4;
            P(x, y, Math.abs(j) > half - 1 ? (j * (dx - dy) < 0 ? '#F4FFFF' : '#2C6AA8') : Math.abs(j) < 0.6 ? '#E8FAFF' : l > 0 ? (s > L0 * 0.55 ? '#D8F6FF' : '#A4DCF6') : (s > L0 * 0.55 ? '#78B8E8' : '#4C90CC'));
          }
        });
        ctx.drawImage(im, Math.round(cx + Math.cos(ang) * rx * 0.85) - 20, Math.round(cy + Math.sin(ang) * ry * 0.85) - 20);
        if (sh > 0.75) fxStar(cx + Math.cos(ang) * (rx * 0.85 + L0 * 0.6), cy + Math.sin(ang) * (ry * 0.85 + L0 * 0.6), (sh - 0.75) * 4, '#FFFFFF', '#BDEFFF');
      });
      const ga = cookT * 3.9;
      for (let k = 0; k < 7; k++) { ctx.globalAlpha = 1 - k / 7; fillRect(Math.round(cx + Math.cos(ga - k * 0.07) * rx * 0.95), Math.round(cy + Math.sin(ga - k * 0.07) * ry * 0.95), k < 2 ? 2 : 1, k < 2 ? 2 : 1, k < 3 ? '#FFFFFF' : '#9FE0FF'); }
      for (let i = 0; i < 9; i++) {
        const life = (cookT * (0.14 + (i % 3) * 0.05) + i * 0.137) % 1;
        const fx = Math.round(cx - rx * 1.3 + (i * 0.618 % 1) * rx * 2.6 + Math.sin(cookT * 1.3 + i * 2) * 3), fy = Math.round(cy - ry * 1.3 + life * ry * 2.6);
        ctx.globalAlpha = Math.sin(life * Math.PI);
        if (i % 3 === 0) { fillRect(fx - 2, fy, 5, 1, '#D8F4FF'); fillRect(fx, fy - 2, 1, 5, '#D8F4FF'); fillRect(fx, fy, 1, 1, '#FFFFFF'); }
        else fillRect(fx, fy, i % 3, i % 3, '#E8FAFF');
      }
      ctx.globalAlpha = 1;
    } else if (id === 'royal') {
      // a jewelled crown with a velvet lining bobs above; gold dust floats up; a golden ring of light every 4 s
      const bob = Math.round(Math.sin(cookT * 2.4) * 1.6);
      const crown = fxMap('crown', ['...........R...........', '..........RrR..........', '.B.........G.........B.', 'BbB.......GGG.......BbB', '.G....W...GLG...W....G.', '.GG..WGW.GGLGG.WGW..GG.', '.GLG..G..GLLLG..G..GLD.', '.GLLGGLGGLLLLGGGLGGLGD.', '.GLLLLLVVLLLLLVVLLLLGD.', '.GGLLVVVVVLLVVVVVGGGGD.', '..GGGGGGGGGGGGGGGGGDD..', '..LWLRrLWLBbLWLEeLWLD..', '..GGGGGGGGGGGGGGGGDDD..', '...DDDDDDDDDDDDDDDDD...'], { R: '#E0364A', r: '#FFB0B8', B: '#3A7AE0', b: '#CDE4FF', E: '#2FAE68', e: '#A8F5C8', G: '#E8AC26', L: '#FFDF66', W: '#FFFAD8', D: '#9A5A14', V: '#7A2AA8' });
      ctx.drawImage(crown, Math.round(cx - 11), Math.round(cy - ry - 13 + bob));
      const cg = (cookT * 0.5) % 1.6;
      if (cg < 0.5) fxStar(cx - 9 + cg * 36, cy - ry - 4 + bob, Math.sin(cg * 2 * Math.PI), '#FFFFFF', '#FFF0A0');
      for (let i = 0; i < 10; i++) {
        const life = (cookT * 0.22 + i * 0.1) % 1, a = i * 2.4;
        ctx.globalAlpha = Math.sin(life * Math.PI);
        fillRect(Math.round(cx + Math.cos(a) * rx * 1.12 + Math.sin(cookT + i) * 2), Math.round(cy + Math.sin(a) * ry * 0.9 + 10 - life * 24), i % 4 ? 1 : 2, i % 4 ? 1 : 2, i % 2 ? '#FFE27A' : '#FFF8D0');
      }
      const ph = cookT % 4;
      if (ph < 0.9) {
        const t = ph / 0.9, e = 1 - (1 - t) * (1 - t);
        for (let n = 0; n < 2; n++) for (let k = 0; k < 24; k++) {
          const a = (k + n * 0.5) * Math.PI / 12, rr = rx * (0.85 + e * (0.5 - n * 0.14));
          ctx.globalAlpha = (1 - t) * (n ? 0.5 : 1);
          fillRect(Math.round(cx + Math.cos(a) * rr), Math.round(cy + Math.sin(a) * rr * 0.87), n ? 1 : 2, n ? 1 : 2, n ? '#C878FF' : '#FFE27A');
        }
      }
      ctx.globalAlpha = 1;
    } else if (id === 'ghost') {
      // two faded echoes drift, little ghosts circle (they pass behind the cookie), wisps curl up
      if (echo) { ctx.globalAlpha = 0.13; echo(Math.round(5 + Math.sin(cookT * 1.8) * 2)); echo(-Math.round(5 + Math.sin(cookT * 1.8) * 2)); ctx.globalAlpha = 1; }
      const gh = fxMap('ghost', ['...WWWW...', '..WLLLLW..', '.WLLLLLMM.', '.WLDLLDMM.', 'WWLDLLDMMM', 'WLLLLLLLMS', 'WLLLDDLMMS', '.LLLLLLMS.', '.LLMLMMMS.', '.LM.MM.MS.', '..M..M..S.'], { W: '#FFFFFF', L: '#E0FFEC', M: '#A8E0C4', S: '#6CB09C', D: '#1C4048' });
      for (let i = 0; i < 3; i++) {
        const a = cookT * 0.7 + i * 2.094, x = Math.round(cx + Math.cos(a) * rx * 1.28) - 5, y = Math.round(cy + Math.sin(a) * ry * 0.55 + Math.sin(cookT * 2.2 + i) * 3) - 5;
        ctx.globalAlpha = 0.45 + 0.35 * (Math.sin(a) * 0.5 + 0.5);
        ctx.drawImage(gh, x, y);
      }
      for (let i = 0; i < 5; i++) {
        const life = (cookT * 0.3 + i * 0.2) % 1;
        for (let s = 0; s < 6; s++) {
          ctx.globalAlpha = Math.sin(life * Math.PI) * (0.6 - s * 0.09);
          fillRect(Math.round(cx - rx + i * rx * 0.5 + Math.sin(cookT * 2 + i - s * 0.5) * 3), Math.round(cy + ry * 0.9 - life * ry * 2 + s * 2), s < 2 ? 2 : 1, 2, s < 2 ? '#E8FFF0' : '#A8E8C8');
        }
      }
      ctx.globalAlpha = 1;
    } else if (id === 'rainbow') {
      // an arch of seven bands with clouds at its ends, turning sparks and confetti ribbons
      const arch = fxArt('arch' + rx, 160, 70, (P) => {
        const cols = ['#E8506A', '#F0904A', '#FFDC5A', '#6ED47A', '#54B8F0', '#6A78E8', '#B06AE0'];
        for (let y = 0; y < 70; y++) for (let x = 0; x < 160; x++) { const d = Math.hypot(x - 80, (y - 62) * 1.08), k = Math.floor((rx + 13 - d) / 1.6); if (k >= 0 && k < 7 && y < 58) P(x, y, cols[k]); }
      });
      ctx.globalAlpha = 0.75 + 0.1 * Math.sin(cookT * 1.5);
      const sw = 160, ax = Math.round(cx) - 80, ay = Math.round(cy - ry * 0.35) - 62;
      ctx.drawImage(arch, 0, 0, sw, 44, ax, ay, sw, 44);
      ctx.globalAlpha = 1;
      const cl = fxMap('cloud', ['.....WWW......', '...WWWWWWW....', '.WWWWWWWWWWW..', 'WWWWWWLLWWWWWL', 'WWWLLLLLLWLLLL', '.LLMMMLLLMMMM.', '...MM....MM...'], { W: '#FFFFFF', L: '#E4ECFF', M: '#B4C0EC' });
      const cb = Math.round(Math.sin(cookT * 1.2));
      const cw = Math.round(Math.sqrt(Math.max(0, (rx + 9) * (rx + 9) - 400)));
      ctx.drawImage(cl, Math.round(cx - cw) - 8, ay + 40 + cb); ctx.drawImage(cl, Math.round(cx + cw) - 6, ay + 40 - cb);
      for (let i = 0; i < 10; i++) {
        const a = i * 0.628 + cookT * 0.6, tw = Math.sin(cookT * 4 + i * 2);
        if (tw > 0) fxStar(cx + Math.cos(a) * (rx + 4), cy + Math.sin(a) * (ry + 4), tw, '#FFFFFF', 'hsl(' + Math.round((i * 36 + cookT * 60) % 360) + ', 95%, 70%)');
      }
      for (let i = 0; i < 12; i++) {
        const life = (cookT * 0.3 + i / 12) % 1, a = i * 2.4, d = 6 + life * 26, w = Math.abs(Math.sin(cookT * 5 + i)) > 0.5 ? 2 : 1;
        ctx.globalAlpha = 1 - life;
        fillRect(Math.round(cx + Math.cos(a) * (rx * 0.75 + d)), Math.round(cy + Math.sin(a) * (ry * 0.7 + d) + life * life * 10), w, 3 - w, 'hsl(' + (i * 67 % 360) + ', 90%, 66%)');
      }
      ctx.globalAlpha = 1;
    } else if (id === 'starry') {
      // swirls of the night wind, a shaded moon with a halo, stars with soft rays and a shooting star
      const sp = [[-rx - 4, -ry + 4], [rx + 2, -ry - 2], [-rx + 6, ry + 4], [rx + 6, ry - 6], [-rx - 8, 2], [rx + 10, 6], [-rx - 2, -ry - 6], [rx - 6, ry + 8]];
      for (let n = 0; n < 3; n++) {
        const ox = cx + [-rx - 9, rx + 8, -rx * 0.2][n], oy = cy + [ry * 0.4, ry * 0.15, -ry - 7][n];
        for (let k = 0; k < 18; k++) {
          const a = k * 0.5 + cookT * (n === 1 ? -0.8 : 0.8), d = 1 + k * 0.5;
          ctx.globalAlpha = 0.65 * (1 - k / 20);
          fillRect(Math.round(ox + Math.cos(a) * d), Math.round(oy + Math.sin(a) * d * 0.7), k < 5 ? 2 : 1, 1, k % 3 ? '#7C9CE8' : '#D0E0FF');
        }
      }
      ctx.globalAlpha = 1;
      for (let i = 0; i < sp.length; i++) { const tw = 0.5 + 0.5 * Math.sin(cookT * 2 + i * 2.1); fxStar(cx + sp[i][0], cy + sp[i][1], tw, '#FFFFFF', i % 2 ? '#FFE28A' : '#A9C4FF'); }
      const st = cookT % 5;
      if (st < 0.9) {
        const hx = cx - rx - 14 + st * 90, hy = cy - ry - 14 + st * 46;
        for (let s = 0; s < 16; s++) { ctx.globalAlpha = (1 - s / 16) * Math.sin(Math.min(1, st / 0.9) * Math.PI); fillRect(Math.round(hx - s * 2), Math.round(hy - s), s < 3 ? 2 : 2, s < 3 ? 2 : 1, s < 3 ? '#FFFFFF' : s < 8 ? '#D8E6FF' : '#7C9CE8'); }
        ctx.globalAlpha = 1;
      }
      const moon = fxArt('moon', 21, 21, (P) => {
        for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) {
          const u = x - 10, v = y - 10, d = u * u + v * v, cut = (u - 3) * (u - 3) + (v + 1) * (v + 1);
          if (d <= 42 && cut > 26) P(x, y, d > 34 && u + v < 0 ? '#FFFDE8' : u + v < -5 ? '#FFF3B0' : u + v < 1 ? '#FFE07A' : u + v < 5 ? '#E0A84A' : '#A87858');
          else if (d <= 90 && ((x + y) & 1) && d > 42) P(x, y, 'rgba(255, 240, 170, ' + (0.28 * (1 - d / 92)).toFixed(2) + ')');
        }
      });
      ctx.drawImage(moon, Math.round(cx + rx * 0.75) - 10, Math.round(cy - ry - 9 + Math.sin(cookT * 0.5) * 2) - 10);
    } else if (id === 'newyear') {
      // the lamps on the spruce blink, the snow twinkles; a fir tree, a snowman and gifts stand at the sides
      const m = fxMask, k = m ? m.w / 74 : 1, kh = m ? m.h / 74 : 1, ox = m ? m.ox : cx - 37, oy = m ? m.oy : cy - 37;
      const LC = [['#FF5A5A', '255, 90, 90'], ['#FFD84A', '255, 216, 74'], ['#5AE0FF', '90, 224, 255'], ['#FF8AE4', '255, 138, 228']];
      if (ry === 40 || cx === 160) nyScene(cx, Math.round(cy + ry + 7));   // no room for it beside the text of the purchase window
      [[65, 50], [60, 58], [53, 63], [45, 67], [36, 68], [27, 67], [19, 63], [12, 58], [7, 50], [5, 42], [4, 33], [63, 20]].forEach(([lx, ly], i) => {
        const on = Math.sin(cookT * 2.6 + (i % 4) * 1.57), x = Math.round(ox + lx * k), y = Math.round(oy + ly * kh), c = LC[i % 4][1];
        if (on <= 0) { ctx.globalAlpha = Math.min(1, -on * 1.2) * 0.65; fillRect(x, y, 2, 2, '#2A1636'); ctx.globalAlpha = 1; return; }
        fillRect(x - 2, y, 6, 2, 'rgba(' + c + ', ' + (0.35 * on).toFixed(2) + ')'); fillRect(x, y - 2, 2, 6, 'rgba(' + c + ', ' + (0.35 * on).toFixed(2) + ')'); fillRect(x - 1, y - 1, 4, 4, 'rgba(' + c + ', ' + (0.45 * on).toFixed(2) + ')');
        fillRect(x, y, 2, 2, LC[i % 4][0]); if (on > 0.5) fillRect(x, y, 1, 1, '#FFFFFF');
      });
      [[25, 4], [44, 3], [56, 8], [46, 44], [14, 20], [34, 64], [11, 35]].forEach(([sx, sy], i) => { const tw = Math.sin(cookT * 1.9 + i * 2.2); if (tw > 0.45) fxStar(ox + sx * k, oy + sy * kh, (tw - 0.45) * 1.8, '#FFFFFF', i > 3 ? '#FFE9A0' : '#CFE8FF'); });
} else if (id === 'solar') {
      // a sun in the middle, and eight planets orbiting it on tilted tracks: each one moves at its own speed
      const PL = [
        { r: 1.2, s: 2.2, c: '#A9A9A9', n: 1 },                          // Mercury
        { r: 1.32, s: 1.7, c: '#F3E1A0', n: 1 },                         // Venus
        { r: 1.46, s: 1.4, c: '#3A8CFF', n: 1, g: '#4CD67A' },            // Earth
        { r: 1.6, s: 1.1, c: '#E0553A', n: 1 },                          // Mars
        { r: 1.8, s: 0.6, c: '#E9A46A', n: 3, bands: true },              // Jupiter
        { r: 2.0, s: 0.45, c: '#E8D08A', n: 2, ring: true },             // Saturn
        { r: 2.2, s: 0.3, c: '#7FE8F0', n: 2 },                          // Uranus
        { r: 2.4, s: 0.22, c: '#3A5AE0', n: 2 },                         // Neptune
      ];
      const PT = [['#4A4660', '#78768A', '#A9A9A9', '#CFCFCF', '#F0F0F0'], ['#8A5A3A', '#C8965A', '#F3D890', '#FBEAB8', '#FFFBE0'], ['#14245A', '#2256B0', '#3A8CFF', '#7AB8FF', '#D0ECFF'], ['#58182A', '#9A3028', '#E0553A', '#F08A5C', '#FFC8A0'], ['#6A3430', '#B06A48', '#E9A46A', '#F6C890', '#FFECC8'], ['#6A4A30', '#B08A50', '#E8D08A', '#F6E4AC', '#FFF8DC'], ['#1C5A7A', '#42A8C0', '#7FE8F0', '#B0F6F8', '#F0FFFF'], ['#141A5A', '#2438A0', '#3A5AE0', '#6C90F4', '#C0D4FF']];   // five tones of each planet
      PL.forEach((pl, i) => {
        const ax = rx * pl.r, ay = ry * pl.r * 0.42;
        // the track, a faint dotted ellipse
        ctx.globalAlpha = 0.15;
        for (let k = 0; k < 48; k += 2) {
          const t = (k / 48) * 2 * Math.PI;
          fillRect(Math.round(cx + Math.cos(t) * ax), Math.round(cy + Math.sin(t) * ay), 1, 1, '#FFFFFF');
        }
        ctx.globalAlpha = 1;   // the track was faint; the planets are solid
        // the planet, on its track; on the far side of its orbit it passes behind the cookie
        const a = cookT * pl.s + i * 0.8;
        const px2 = Math.round(cx + Math.cos(a) * ax), py2 = Math.round(cy + Math.sin(a) * ay);
        const behind = Math.sin(a) < 0;
        const pp = (x, y, col) => {
          if (behind) {
            const hidden = fxMask ? maskHit(x, y) : (((x - cx) / (rx * 0.92)) ** 2 + ((y - cy) / (ry * 0.92)) ** 2 <= 1);
            if (hidden) return;
          }
          fillRect(x, y, 1, 1, col);
        };
        const pr = [1, 2, 2, 2, 4, 3, 3, 3][i], ball = fxBall('pl' + i, pr, PT[i]);
        if (!behind) {
          ctx.drawImage(ball, px2 - pr, py2 - pr);
        } else if (!(fxMask ? maskHit(px2, py2) || maskHit(px2 - pr, py2) || maskHit(px2 + pr, py2) : ((px2 - cx) / (rx * 0.92)) ** 2 + ((py2 - cy) / (ry * 0.92)) ** 2 <= 1)) {
          ctx.globalAlpha = 0.75; ctx.drawImage(ball, px2 - pr, py2 - pr); ctx.globalAlpha = 1;
        }
        if (pl.g) { pp(px2 - 1, py2, '#4CD67A'); pp(px2, py2 - 1, '#9AF0B0'); pp(px2 + 1, py2 + 1, '#2A9A5A'); }
        if (pl.bands) { for (let dx = -3; dx <= 3; dx++) { pp(px2 + dx, py2 - 1, '#C77A4A'); pp(px2 + dx, py2 + 2, '#A85A38'); } pp(px2 + 1, py2 + 1, '#E0503A'); }
        if (pl.ring) for (let dx = -6; dx <= 6; dx++) { pp(px2 + dx, py2 + Math.round(dx / 6), Math.abs(dx) > 4 ? '#FFF0B8' : '#C8A868'); }
      });
      ctx.globalAlpha = 1;
    } else if (id === 'zefir') {
      // marshmallows of five shapes, bigger and shaded (a white shine, a deeper pink on the shadow side), all running round the rim the same way
      const SHAPES = {
        bigRound: ['...XXXXX...', '..XXXXXXX..', '.XXXXXXXXX.', 'XXXXXXXXXXX', 'XXXXXXXXXXX', 'XXXXXXXXXXX', 'XXXXXXXXXXX', '.XXXXXXXXX.', '..XXXXXXX..', '...XXXXX...'],
        round: ['..XXXXX..', '.XXXXXXX.', 'XXXXXXXXX', 'XXXXXXXXX', 'XXXXXXXXX', 'XXXXXXXXX', '.XXXXXXX.', '..XXXXX..'],
        tube: ['XXXXX', 'XXXXX', 'XXXXX', 'XXXXX', 'XXXXX', 'XXXXX', 'XXXXX', 'XXXXX', 'XXXXX', 'XXXXX'],
        pillow: ['.XXXXXXX.', 'XXXXXXXXX', 'XXXXXXXXX', 'XXXXXXXXX', 'XXXXXXXXX', 'XXXXXXXXX', 'XXXXXXXXX', '.XXXXXXX.'],
        heart: ['..XXX...XXX..', '.XXXXX.XXXXX.', 'XXXXXXXXXXXXX', 'XXXXXXXXXXXXX', '.XXXXXXXXXXX.', '..XXXXXXXXX..', '...XXXXXXX...', '....XXXXX....', '.....XXX.....', '......X......'],
        star: ['...X...', '...X...', 'XXXXXXX', '.XXXXX.', '..XXX..', '.XX.XX.', 'XX...XX'],
      };
      // where each marshmallow starts: an angle along the rim (0 = right, -PI/2 = top) and its shape
      const PLACES = [
        ['bigRound', -1.75], ['round', -1.15], ['heart', -0.25], ['pillow', 0.45],
        ['star', 2.2], ['heart', Math.PI], ['round', -2.5],
      ];
      const puffs = [];
      PLACES.forEach(([kind], i) => {
        // all of them run round the rim in the same direction, at equal distances from each other
        const t = -Math.PI / 2 + i * (Math.PI * 2 / PLACES.length) + cookT * 0.6;
        const rows = SHAPES[kind];
        const mh = rows.length, mw = rows[0].length;
        const px = Math.round(cx + Math.cos(t) * rx * 0.97 - mw / 2);
        const py = Math.round(cy + Math.sin(t) * ry * 0.97 - mh / 2);
        const on = (x, y) => y >= 0 && y < mh && x >= 0 && x < rows[y].length && rows[y][x] === 'X';
        for (let y = 0; y < mh; y++) for (let x = 0; x < rows[y].length; x++) {
          if (!on(x, y)) continue;
          const edge = !on(x - 1, y) || !on(x + 1, y) || !on(x, y - 1) || !on(x, y + 1);
          let col = '#FFD6EA';
          if (edge) col = x + y < (mw + mh) * 0.45 ? '#FFC0DC' : '#D070A4';
          else if (x <= mw * 0.35 && y <= mh * 0.35) col = '#FFFFFF';   // the shine, top left
          else if (x + y >= (mw + mh) * 0.68) col = '#E890BC';            // the cold shadow side, bottom right
          else if (x + y >= (mw + mh) * 0.52) col = '#FFB8D8';
          else if (x + y <= (mw + mh) * 0.32) col = '#FFEFF7';
          fillRect(px + x, py + y, 1, 1, col);
        }
        puffs.push([px, py, mw, mh]);
      });
      // hearts float up out of the round marshmallows
      for (const i of [0, 1, 6]) {
        const [px, py, mw] = puffs[i];
        const life = (cookT * 0.3 + i * 0.17) % 1;
        const hx = px + Math.floor(mw / 2) - 1, hy = Math.round(py - 2 - life * 22);
        ctx.globalAlpha = 1 - life;
        fillRect(hx, hy, 1, 1, '#FF5FA8'); fillRect(hx + 2, hy, 1, 1, '#FF5FA8');
        fillRect(hx, hy + 1, 3, 1, '#FF5FA8'); fillRect(hx + 1, hy + 2, 1, 1, '#FF5FA8');
        ctx.globalAlpha = 1;
      }
      // sugar sparkles twinkle round the rim
      for (let i = 0; i < 5; i++) {
        const t = i * 1.26 + 0.4;
        const tw = Math.sin(cookT * 4 + i * 2.1);
        if (tw > 0.2) {
          const sx = Math.round(cx + Math.cos(t) * rx * 1.08), sy = Math.round(cy + Math.sin(t) * ry * 1.08);
          ctx.globalAlpha = (tw - 0.2) / 0.8;
          fillRect(sx, sy, 1, 1, '#FFFFFF');
          fillRect(sx - 1, sy, 1, 1, '#FFD6EA'); fillRect(sx + 1, sy, 1, 1, '#FFD6EA');
          fillRect(sx, sy - 1, 1, 1, '#FFD6EA'); fillRect(sx, sy + 1, 1, 1, '#FFD6EA');
          ctx.globalAlpha = 1;
        }
      }
      // soft drips of melted marshmallow run down the bottom edge
      for (let i = 0; i < 4; i++) {
        const a = Math.PI * (0.3 + i * 0.13);
        const sx = Math.round(cx + Math.cos(a) * rx * 0.85), sy = Math.round(cy + Math.sin(a) * ry * 0.85);
        const phase = (cookT * 0.18 + i * 0.27) % 1;
        const len = 1 + Math.round(phase * 7);
        ctx.globalAlpha = 1 - phase * 0.4;
        for (let y = 0; y < len; y++) fillRect(sx, sy + y, 1, 1, y === len - 1 ? '#FFFFFF' : '#FFE4F0');
        if (phase > 0.7) fillRect(sx - 1, sy + len, 3, 1, '#FFD6EA');
        ctx.globalAlpha = 1;
      }
      // pink fluff drifts up and away from the cookie
      for (let i = 0; i < 4; i++) {
        const life = (cookT * 0.25 + i * 0.25) % 1;
        const t = -Math.PI / 2 + i * 1.57 + Math.sin(cookT + i) * 0.3;
        const fx = Math.round(cx + Math.cos(t) * (rx + life * 10)), fy = Math.round(cy + Math.sin(t) * (ry + life * 14) - life * 6);
        ctx.globalAlpha = (1 - life) * 0.8;
        fillRect(fx, fy, 2, 2, '#FFD6EA');
        ctx.globalAlpha = 1;
      }
    } else if (id === 'easter') {
      // painted eggs roll round the rim, and little petals drift down past the cookie
      const EG = ['#FF9EC4', '#9EE6C8', '#FFE27A', '#C6B4FF'];
      // sixteen eggs travel round the cookie: four rings, each one tilted at its own angle, turning at its own speed and way round
      const EGG_RINGS = [
        { a: 1.06, b: 0.92, rot: 0.2, sp: 0.55, dir: 1 },
        { a: 1.28, b: 1.07, rot: -0.7, sp: 0.42, dir: -1 },
        { a: 1.5, b: 1.2, rot: 1.1, sp: 0.36, dir: 1 },
        { a: 1.72, b: 1.32, rot: -1.5, sp: 0.3, dir: -1 },
      ];
      const eggPts = [];
      EGG_RINGS.forEach((ring, r) => {
        for (let k = 0; k < 4; k++) {
          const t = cookT * ring.sp * ring.dir + k * (Math.PI / 2) + r * 0.6;
          const x0 = Math.cos(t) * rx * ring.a, y0 = Math.sin(t) * ry * ring.b;
          eggPts.push({ x: x0 * Math.cos(ring.rot) - y0 * Math.sin(ring.rot), y: x0 * Math.sin(ring.rot) + y0 * Math.cos(ring.rot), col: EG[(r * 4 + k) % EG.length] });
        }
      });
      // if two eggs ever meet, they are pushed apart so they never overlap
      for (let i = 0; i < eggPts.length; i++) for (let j = i + 1; j < eggPts.length; j++) {
        const a = eggPts[i], b = eggPts[j];
        const dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy);
        if (dist < 11 && dist > 0.001) {
          const nx = dx / dist, ny = dy / dist, push = (11 - dist) / 2;
          a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
        }
      }
      for (const egg of eggPts) drawEgg(Math.round(cx + egg.x), Math.round(cy + egg.y), egg.col);
      for (let i = 0; i < 6; i++) {
        const life = (cookT * 0.2 + i / 6) % 1;
        const px = Math.round(cx + Math.sin(cookT * 1.3 + i * 2) * rx * 0.9), py = Math.round(cy - ry + life * (ry * 2 + 20));
        ctx.globalAlpha = 1 - life * 0.6;
        fillRect(px, py, 2, 1, '#FFD6EA');
        fillRect(px, py + 1, 1, 1, '#FF9CC8');
        ctx.globalAlpha = 1;
      }
    } else if (id === 'halloween') {
      // pumpkins with glowing faces stand on the floor, a moon glows above, and bats fly round the cookie
      const base = Math.round(cy + ry + 3);
      const glow = Math.sin(cookT * 7) > -0.2;   // the candles inside flicker
      drawPumpkin(Math.round(cx - rx * 1.45), base, 0.75, glow);
      drawPumpkin(Math.round(cx - rx * 0.95), base, 1, !glow);
      drawPumpkin(Math.round(cx + rx * 1.0), base, 1, glow);
      drawPumpkin(Math.round(cx + rx * 1.5), base, 0.75, !glow);
      // the moon: a crescent that glows and breathes
      const mx = Math.round(cx + rx * 1.15), my = Math.round(cy - ry - 14);
      const mg = 0.6 + 0.4 * Math.sin(cookT * 2);
      for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) {
        if (x * x + y * y <= 36 && (x - 3) * (x - 3) + (y + 1) * (y + 1) > 25) {
          ctx.globalAlpha = mg;
          fillRect(mx + x, my + y, 1, 1, '#FFF3B0');
        }
      }
      ctx.globalAlpha = 1;   // the moon's pulsing glow must not fade everything drawn after it (the menus and text)
      // four bats flap round the cookie, with tiny orange eyes
      for (let i = 0; i < 4; i++) {
        const t = cookT * (0.6 + i * 0.15) + i * 1.6;
        const bx = Math.round(cx + Math.cos(t) * (rx + 16)), by = Math.round(cy + Math.sin(t) * (ry + 12) * 0.7 - 8);
        const wing = Math.floor(cookT * 9 + i * 1.3) % 4, pose = wing === 3 ? 1 : wing;
        const BAT = [['P...........P', 'LPP..D.D..PPL', '.LPPPDDDPPPL.', '..LPPYDYPPL..', '....PDDDP....', '......D......'], ['.............', '.....D.D.....', 'LPPPPDDDPPPPL', 'PPLPPYDYPPLPP', 'P...PDDDP...P', '......D......'], ['.............', '.....D.D.....', '...PPDDDPP...', '.LPPPYDYPPPL.', 'LPPPPDDDPPPPL', 'P..P..D..P..P']];
        ctx.drawImage(fxMap('bat' + pose, BAT[pose], { P: '#30203C', L: '#6A5084', D: '#1A1024', Y: '#FFB02E' }), bx - 6, by - 3);
      }
    } else if (id === 'gzhel') {
      // painted flowers open and close round the rim; a brush stroke runs along it; cobalt petals drift
      const fl = fxMap('gzf', ['...CC.CC...', '..CBBCBBC..', '.CBLLBLLBC.', '.CBLLBLLBC.', '..CBBWBBC..', '.CBBWYWBBC.', 'CBLLBWBLLBC', 'CBLLBCBLLBC', '.CBBC.CBBC.', '..CC...CC..'], { C: '#14307C', B: '#2C5CC8', L: '#7CA8F0', W: '#FFFFFF', Y: '#CFE0FF' });
      for (let i = 0; i < 4; i++) {
        const a = -2.5 + i * 1.571 + cookT * 0.12;
        ctx.drawImage(fl, Math.round(cx + Math.cos(a) * rx * 1.1) - 5, Math.round(cy + Math.sin(a) * ry * 1.1 + Math.sin(cookT * 1.6 + i)) - 5);
        for (const d of [-1, 1]) for (let k = 0; k < 7; k++) { const b = a + d * (0.17 + k * 0.045), w = k > 1 && k < 5 ? 2 : 1; fillRect(Math.round(cx + Math.cos(b) * (rx * 1.1 + Math.sin(k * 0.6) * 3)), Math.round(cy + Math.sin(b) * (ry * 1.1 + Math.sin(k * 0.6) * 3)), w, w, k < 2 ? '#14307C' : k < 5 ? '#2C5CC8' : '#7CA8F0'); }
      }
      const ba = cookT * 1.3;
      for (let k = 0; k < 14; k++) { ctx.globalAlpha = 1 - k / 14; fillRect(Math.round(cx + Math.cos(ba - k * 0.05) * rx * 0.99), Math.round(cy + Math.sin(ba - k * 0.05) * ry * 0.99), k < 4 ? 2 : 1, k < 4 ? 2 : 1, k < 2 ? '#FFFFFF' : k < 7 ? '#7CA8F0' : '#2C5CC8'); }
      for (let i = 0; i < 6; i++) {
        const life = (cookT * 0.16 + i / 6) % 1;
        ctx.globalAlpha = Math.sin(life * Math.PI);
        const x = Math.round(cx - rx * 1.2 + (i * 0.618 % 1) * rx * 2.4 + Math.sin(cookT * 1.5 + i * 2) * 4), y = Math.round(cy - ry * 1.2 + life * ry * 2.4);
        fillRect(x, y, 3, 1, '#2C5CC8'); fillRect(x + 1, y - 1, 2, 1, '#9CC0F8'); fillRect(x, y + 1, 1, 1, '#14307C');
      }
      ctx.globalAlpha = 1;
    } else if (id === 'caramel') {
      // the caramel runs from the very edge of the cookie: the drips grow, stretch and fall into the pool right under it
      const m = fxMask, sx0 = m ? m.ox : Math.round(cx - 37), sy0 = m ? m.oy : Math.round(cy - 37), mw = m ? m.w : 74, mh = m ? m.h : 74;
      const solid = (x, y) => m ? x >= 0 && y >= 0 && x < mw && y < mh && m.data[(y * mw + x) * 4 + 3] > 0 && m.data[(y * mw + x) * 4] > 40 : false;
      // the pool is a flat blob: on the floor in the game, right under the cookie in the preview windows
      const rows = 7, py = ry === 40 ? cy + 48 : sy0 + mh + 1, mid = Math.round(cx) - (ry === 40 ? 1 : 3), pw = 31, my = (rows - 1) / 2, top = py + Math.round(my);
      const edge = (y, side) => { const t = (y - my) / (my + 0.4), w = 1 - t * t; return w <= 0 ? -1 : Math.round(pw * Math.pow(w, 0.42) + Math.sin(y * 1.3 + side * 2.2)); };
      const row = (y, d, col, dy) => { const l = edge(y, 1) - d, r = edge(y, 2) - d; if (l + r >= 0) fillRect(mid - l, py + y + (dy || 0), l + r + 1, 1, col); };
      for (let y = 0; y < rows; y++) row(y, 0, 'rgba(42, 20, 40, 0.35)', 1);
      for (let y = 0; y < rows; y++) row(y, 0, y < my * 0.5 ? '#F4B84A' : y < my * 1.4 ? '#C87A1C' : '#8A4612');               // the rim: lit at the far side, dark at the near one
      for (let y = 1; y < rows - 1; y++) row(y, 2, y < my * 0.6 ? '#E8A030' : y < my * 1.3 ? '#D88C24' : y < my * 1.7 ? '#C87A1C' : '#B0661A');
      for (let k = 0; k < 2; k++) {                                                                                           // the rings of the drops
        const q = (cookT * 0.5 + k * 0.5) % 1, a = pw * 0.62 * q, b = my * 0.62 * q, ox = k ? Math.round(pw * 0.2) : -Math.round(pw * 0.2);
        ctx.globalAlpha = (1 - q) * 0.8; for (let n = 0; n < 40; n++) { const u = n * 0.157; fillRect(Math.round(mid + ox + Math.cos(u) * a), Math.round(top + Math.sin(u) * b), 1, 1, '#FFE09A'); }
      }
      ctx.globalAlpha = 1;
      fillRect(mid - Math.round(pw * 0.7), py + 2, 5, 1, '#FFF4CC');
      // [the column of the cookie in 74ths, 1: a drip of the upper arm into the hole]
      [[13, 0], [20, 0], [27, 0], [35, 0], [42, 0], [49, 0], [56, 0], [28, 1], [38, 1], [46, 1], [59, 1]].forEach(([u, inner], i) => {
        const ux = Math.round(u * mw / 74); let uy = inner ? Math.round(mh * 0.1) : mh - 1;
        if (inner) { while (uy < mh && !solid(ux, uy)) uy++; while (uy < mh && solid(ux, uy)) uy++; uy--; } else while (uy > 0 && !solid(ux, uy)) uy--;
        if (uy <= 0 || (uy >= mh - 1 && inner)) return;
        let floor = top; if (inner) { let f = uy + 5; while (f < mh && !solid(ux, f)) f++; if (f >= mh) return; floor = sy0 + f + 1; }
        const sx = sx0 + ux, sy = sy0 + uy - 1;
        const ph = (cookT * 0.2 + i * 0.37) % 1, grow = Math.min(1, ph / 0.7), max = Math.min(9, Math.max(3, floor - sy - 3)), len = 2 + Math.round(grow * grow * (max - 2));
        const D = ph > 0.7 ? Math.max(2, Math.round(len * (1 - (ph - 0.7) * 2.6))) : len;
        fillRect(sx - 1, sy, 4, 2, '#D4841F');
        fillRect(sx, sy, 2, D, '#E89A2C'); fillRect(sx, sy, 1, D, '#FFD070'); fillRect(sx + 1, sy + 1, 1, D, '#A45A14');
        const by = ph > 0.7 ? sy + len + Math.round((ph - 0.7) * (ph - 0.7) * 420) : sy + D;
        if (by < floor - 1 && ph > 0.2) { fillRect(sx - 1, by, 4, 3, '#E89A2C'); fillRect(sx, by - 1, 2, 5, '#E89A2C'); fillRect(sx - 1, by, 1, 2, '#FFD070'); fillRect(sx, by, 1, 1, '#FFFFFF'); fillRect(sx + 2, by + 1, 1, 2, '#A45A14'); fillRect(sx, by + 3, 2, 1, '#A45A14'); }
      });
      [[10, 24], [24, 7], [52, 9], [9, 48], [36, 66], [58, 58]].forEach(([u, v], i) => { const tw = Math.sin(cookT * 2.4 + i * 1.7); if (tw > 0) fxStar(sx0 + u * mw / 74, sy0 + v * mh / 74, tw, '#FFFFFF', '#FFE09A'); });
} else if (id === 'sea') {
      // seaweed sways below, two shoals swim round (behind and in front), bubbles with a rim and a shine rise
      const base = Math.round(cy + ry + 6);
      for (let i = 0; i < 6; i++) {
        const bx = cx + [-1.25, -1.08, -0.85, 0.85, 1.05, 1.25][i] * rx, hgt = 10 + (i * 5) % 9;
        for (let s = 0; s < hgt; s++) { const x = Math.round(bx + Math.sin(cookT * 1.6 + i + s * 0.35) * s * 0.18); fillRect(x, base - s, s > hgt - 3 ? 1 : 2, 1, s > hgt - 4 ? '#A8F0B0' : s & 2 ? '#3AA878' : '#1E7068'); if (s % 4 === 2) fillRect(x + (s & 4 ? -2 : 2), base - s, 2, 1, '#58C890'); }
      }
      for (let i = 0; i < 4; i++) {
        const a = cookT * (i < 2 ? 0.55 : -0.42) + i * 2.6, back = Math.sin(a) < 0, dir = -Math.sin(a) * (i < 2 ? 1 : -1) > 0 ? 1 : -1;
        const x = Math.round(cx + Math.cos(a) * rx * 1.35), y = Math.round(cy + Math.sin(a) * ry * 0.5 + Math.sin(cookT * 3 + i));
        const pal = i & 1 ? { O: '#FFD84A', L: '#FFF3A8', D: '#C88A1C', W: '#FFFFFF', K: '#1C1A4A' } : { O: '#FF8A3A', L: '#FFC27A', D: '#B84A1C', W: '#FFFFFF', K: '#1C1A4A' };
        const fish = fxMap('fish' + (i & 1) + dir, (() => { const t = Math.floor(0); const m = ['D...LLL....', 'DD.LLOWOL..', 'DODOOWOOKL.', 'DOOOOWOOOOO', 'DD.DOWOOD..', 'D...DDD....']; return dir > 0 ? m : m.map((r) => r.split('').reverse().join('')); })(), pal);
        if (back) ctx.globalAlpha = 0.5;
        if (!(back && Math.abs(x - cx) < rx * 0.95)) ctx.drawImage(fish, x - 5, y - 3);
        ctx.globalAlpha = 1;
      }
      const bub = [5, 4, 3].map((n) => fxArt('bub' + n, n + 2, n + 2, (P) => { const c = (n + 1) / 2; for (let y = 0; y < n + 2; y++) for (let x = 0; x < n + 2; x++) { const d = Math.hypot(x - c, y - c); if (d > n / 2 + 0.3) continue; P(x, y, d > n / 2 - 0.7 ? (x + y < n ? '#E6FAFF' : '#6CC0EC') : 'rgba(170, 230, 255, 0.35)'); } P(Math.round(c) - 1, Math.round(c) - 1, '#FFFFFF'); }));
      for (let i = 0; i < 10; i++) {
        const life = (cookT * (0.16 + (i % 3) * 0.06) + i * 0.11) % 1;
        ctx.globalAlpha = Math.min(1, (1 - life) * 2.5);
        ctx.drawImage(bub[i % 3], Math.round(cx - rx * 1.1 + ((i * 29) % Math.round(rx * 2.2)) + Math.sin(cookT * 2 + i) * 2), Math.round(cy + ry - life * ry * 2.5));
      }
      ctx.globalAlpha = 1;
    }
  }
  // the premium effects around a picture (the same look as in the game, a little smaller)
  function drawSkinFxAt(id, cx, cy, rx, ry) {
    if (NEW_FX_IDS.includes(id)) { drawNewFx(id, cx, cy, rx, ry, null); return; }
    drawSkinPlus(id, cx, cy, rx, ry);
    if (id === 'neontube') {
      const arcT = cookT % 2.2;
      if (arcT < 0.15) {
        const a0 = Math.floor(cookT / 2.2) * 2.39;
        for (let k = 0; k < 9; k++) {
          const a = a0 + k * 0.14;
          const off = k % 2 ? 2.5 : -1.5;
          fillRect(Math.round(cx + Math.cos(a) * (rx - 4 + off)), Math.round(cy + Math.sin(a) * (ry - 3 + off)), 2, 2, k % 3 ? '#FFFFFF' : '#7DF9FF');
        }
      }
      return;
    }
    if (id === 'neon') {
      const cols = ['#FF5FDC', '#7DF9FF', '#FFFFFF'];
      for (let i = 0; i < 6; i++) {
        const a = cookT * 1.4 + (i * 2 * Math.PI) / 6;
        fillRect(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), 2, 2, cols[i % 3]);
      }
      for (let i = 0; i < 4; i++) {
        if (Math.sin(cookT * 4 + i * 1.7) > 0.3) {
          const tx = Math.round(cx + [-rx - 6, rx + 4, -rx + 2, rx - 2][i]), ty = Math.round(cy + [-ry - 4, -ry + 2, ry + 2, ry + 4][i]);
          fillRect(tx, ty, 3, 1, '#FFFFFF');
          fillRect(tx + 1, ty - 1, 1, 3, '#FFFFFF');
        }
      }
    } else if (id === 'volcano') {
      for (let i = 0; i < 6; i++) {
        const life = ((cookT * 0.8 + i * 0.167) % 1);
        const ex = Math.round(cx - rx + i * (2 * rx / 5) + Math.sin(cookT * 5 + i * 2) * 2);
        const ey = Math.round(cy + ry - life * ry * 2);
        fillRect(ex, ey, i % 3 === 0 ? 2 : 1, i % 3 === 0 ? 2 : 1, i % 2 ? '#FFD35A' : '#FF6A1A');
      }
      for (let i = 0; i < 3; i++) {
        const life = ((cookT * 0.35 + i * 0.33) % 1);
        ctx.globalAlpha = 0.5 * (1 - life);
        fillRect(Math.round(cx - 12 + i * 12 + life * 4), Math.round(cy - ry - 2 - life * 16), 3, 2, '#6B5E66');
        ctx.globalAlpha = 1;
      }
    }
  }
  // the ad button shows how many ads are still left for this skin, and counts down with each view
  function adButtonLabel(k) {
    if (premiumOwned.noads) return 'ПОЛУЧИТЬ';   // no ads to watch: the skin comes at once
    const left = Math.max(0, skinAdNeed(k) - (skinAdViews[k.id] || 0));
    const word = left === 1 ? 'РЕКЛАМУ' : left >= 2 && left <= 4 ? 'РЕКЛАМЫ' : 'РЕКЛАМ';
    return 'ЗА ' + left + ' ' + word;
  }
  function drawSkinPreview() {
    const k = SKINS.find((s) => s.id === skinPreview);
    drawTextBox(k.name, 1, WIN_X0, WIN_X1, WIN_Y0 + 6, WIN_Y0 + 16, accent());
    const thumb = skinThumbs[k.id];
    const fx = k.id === 'neon' || k.id === 'volcano' || k.id === 'neontube' || NEW_FX_IDS.includes(k.id);
    if (fx) {
      // the glow of the picture: pink for the neon, orange for the volcanic one, pulsing
      const pulse = 0.5 + 0.5 * Math.sin(cookT * (k.id === 'volcano' ? 9 : 3));
      ctx.save();
      ctx.shadowColor = skinGlow(k.id, (0.5 + 0.4 * pulse).toFixed(2));
      ctx.shadowBlur = 4 + 8 * pulse;
    }
    const pSway = k.id === 'ghost' ? Math.round(Math.sin(cookT * 1.8) * 2) : 0;   // the same 2 px sway in the preview
    if (thumb && thumb.complete && thumb.naturalWidth) ctx.drawImage(thumb, 160 - 37 + pSway, 20, 74, 74);
    if (fx) { ctx.restore(); fxMask = thumbMask(thumb, 123, 20); drawSkinFxAt(k.id, 160, 57, 40, 33); fxMask = null; }
    if (k.id === 'ghost') drawGhosts();
    if (k.id === 'newyear') drawDeers();
    if (k.id === 'sea') drawFishes();
    const owned = !!skinOwned[k.id];
    if (owned) {
      drawText(settings.skin === k.id ? 'СЕЙЧАС НАДЕТ' : 'ПОЛУЧЕН', 1, 160, 101, COL.text, 'center');
      if (settings.skin !== k.id) settingsButton(74, 110, 246, 122, 'НАДЕТЬ');
    } else {
      drawText('НЕТ СКИНА, ПОЛУЧИТЬ:', 1, 160, 101, dimTone(), 'center');
      if (k.premium) {
        // the same two buttons as a daily skin: watch the ads, or buy it in the shop
        settingsButton(74, 110, 155, 122, adButtonLabel(k));
        settingsButton(165, 110, 246, 122, 'В МАГАЗИНЕ');
      } else {
        settingsButton(74, 110, 155, 122, adButtonLabel(k));
        settingsButton(165, 110, 246, 122, 'В НАГРАДАХ');
      }
    }
    settingsButton(74, 124, 246, 136, 'НАЗАД');
  }
  // the skin pictures grid: 4 across, 32 px pictures; the rows scroll inside their area, with a slider on the right
  const SKIN_CELL = 32, SKIN_COLS = 4, SKIN_ROW_H = 38;
  const SKIN_TOP = 24, SKIN_BOT = 118;   // the visible part of the grid, in window coordinates
  let skinScroll = 0;                    // how far the grid is scrolled, in px
  let skinDrag = null;                   // {y0, s0} while the slider is held
  const skinRows = () => Math.ceil(SKINS.length / SKIN_COLS);
  const skinMaxScroll = () => Math.max(0, skinRows() * SKIN_ROW_H - (SKIN_ROW_H - SKIN_CELL) - (SKIN_BOT - SKIN_TOP));
  const clampSkinScroll = (v) => Math.max(0, Math.min(skinMaxScroll(), v));
  const skinThumbH = () => Math.max(12, Math.round(((SKIN_BOT - SKIN_TOP) * (SKIN_BOT - SKIN_TOP)) / (skinRows() * SKIN_ROW_H - (SKIN_ROW_H - SKIN_CELL))));
  function skinCellXY(i) {
    const col = i % SKIN_COLS, row = Math.floor(i / SKIN_COLS);
    return [80 + col * 40, SKIN_TOP + row * SKIN_ROW_H - skinScroll];
  }
  function drawSkinWin() {
    fillRect(0, 0, W, H, 'rgba(10, 8, 24, 0.6)');
    fillRect(WIN_X0, WIN_Y0, WIN_X1 - WIN_X0, WIN_Y1 - WIN_Y0, COL.panel);
    fillRect(WIN_X0, WIN_Y0, WIN_X1 - WIN_X0, 1, COL.panelEdge);
    fillRect(WIN_X0, WIN_Y1 - 1, WIN_X1 - WIN_X0, 1, COL.panelEdge);
    fillRect(WIN_X0, WIN_Y0, 1, WIN_Y1 - WIN_Y0, COL.panelEdge);
    fillRect(WIN_X1 - 1, WIN_Y0, 1, WIN_Y1 - WIN_Y0, COL.panelEdge);
    if (skinPreview) { drawSkinPreview(); return; }
    drawTextBox('ВНЕШНИЙ ВИД', 1, WIN_X0, WIN_X1, WIN_Y0 + 6, WIN_Y0 + 16, COL.text);
    // the skins as pictures, 4 across; they scroll inside their area; the worn one has a gold frame
    ctx.save();
    ctx.beginPath();
    ctx.rect(74, SKIN_TOP - 3, 164, SKIN_BOT - SKIN_TOP + 6);
    ctx.clip();
    SKINS.forEach((k, i) => {
      const [cx, cy] = skinCellXY(i);
      if (cy + SKIN_CELL < SKIN_TOP || cy > SKIN_BOT) return;
      const chosen = settings.skin === k.id;
      const owned = !!skinOwned[k.id];
      if (chosen) fillRect(cx - 2, cy - 2, SKIN_CELL + 4, SKIN_CELL + 4, accent());
      fillRect(cx - 1, cy - 1, SKIN_CELL + 2, SKIN_CELL + 2, COL.tabOff);
      const thumb = skinThumbs[k.id];
      if (thumb && thumb.complete && thumb.naturalWidth) {
        ctx.globalAlpha = owned ? 1 : 0.28;                 // not owned: dim
        ctx.drawImage(thumb, cx, cy, SKIN_CELL, SKIN_CELL);
        ctx.globalAlpha = 1;
      }
    });
    ctx.restore();
    // the slider on the right: the bar, and the thumb that shows where the grid is
    fillRect(241, SKIN_TOP, 3, SKIN_BOT - SKIN_TOP, COL.tabOff);
    const maxS = skinMaxScroll();
    if (maxS > 0) {
      const th = skinThumbH();
      const ty = SKIN_TOP + Math.round((SKIN_BOT - SKIN_TOP - th) * (skinScroll / maxS));
      fillRect(241, ty, 3, th, accent());
    }
    settingsButton(74, 124, 246, 136, 'ЗАКРЫТЬ');
  }

  // a new skin: the offer window asks to try it on now or to do it later
  let skinOffer = null;   // {id} while the offer is open
  function offerSkin(id) {
    if (!id || settings.skin === id) return;
    skinOffer = { id };
  }
  function drawSkinOffer() {
    const k = SKINS.find((s) => s.id === skinOffer.id);
    fillRect(0, 0, W, H, 'rgba(10, 8, 24, 0.6)');
    fillRect(WIN_X0, WIN_Y0, WIN_X1 - WIN_X0, WIN_Y1 - WIN_Y0, COL.panel);
    fillRect(WIN_X0, WIN_Y0, WIN_X1 - WIN_X0, 1, COL.panelEdge);
    fillRect(WIN_X0, WIN_Y1 - 1, WIN_X1 - WIN_X0, 1, COL.panelEdge);
    fillRect(WIN_X0, WIN_Y0, 1, WIN_Y1 - WIN_Y0, COL.panelEdge);
    fillRect(WIN_X1 - 1, WIN_Y0, 1, WIN_Y1 - WIN_Y0, COL.panelEdge);
    drawTextBox('НОВЫЙ СКИН', 1, WIN_X0, WIN_X1, WIN_Y0 + 6, WIN_Y0 + 16, accent());
    const thumb = skinThumbs[k.id];
    if (thumb && thumb.complete && thumb.naturalWidth) ctx.drawImage(thumb, 160 - 37, 22, 74, 74);
    drawTextBox(k.name, 1, WIN_X0, WIN_X1, 99, 107, COL.text);
    settingsButton(74, 112, 246, 122, 'ПРИМЕРИТЬ');
    settingsButton(74, 126, 246, 138, 'ПОЗЖЕ');
  }
  function handleSkinOfferDown(gx, gy) {
    const id = skinOffer.id;
    if (inRect(gx, gy, 74, 112, 246, 122)) { settings.skin = id; loadSkin(id); saveGame(); skinOffer = null; return; }
    if (inRect(gx, gy, 74, 126, 246, 138)) { skinOffer = null; return; }
  }

  // ---------- progress window: statistics, achievements, leaderboards (VK) ----------
  // the 100 achievements (docs/achievements-v6.md), in groups: each has a progress value and a goal
  const ACH_X0 = 74, ACH_X1 = 239, ACH_TOP = 30, ACH_BOT = 112, ACH_COUNT_Y = 115, ACH_TWO = true;   // the list of achievements; ACH_TWO: the progress under the name
  const ACH = [];
  const ACH_GROUPS = [];         // {title, from}: the headings, by the index of the first achievement under them
  const achGroup = (title) => ACH_GROUPS.push({ title, from: ACH.length });
  const addAch = (name, value, goal) => ACH.push({ name, value, goal });
  // 1 ЗВЕЗДУ, 3 ЗВЕЗДЫ, 5 ЗВЁЗД
  const plural = (n, one, few, many) => (n % 10 === 1 && n % 100 !== 11 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? few : many);
  const spaced = (n) => custNum(BigInt(n));
  const sumOf = (list) => list.reduce((a, b) => a + b, 0);
  const starsTotal = () => techOwned.reduce((a, n) => a + starsOf(n), 0);
  const prokTotal = () => prokOwned.filter(Boolean).length;
  const A_TAPS = (g) => addAch('СДЕЛАТЬ ' + spaced(g) + ' ТАПОВ', () => playerClicks, g);
  const A_TAPLV = (g) => addAch('КУПИТЬ ' + g + ' УЛУЧШЕНИЙ ТАПА', () => tapLv, g);
  const A_MACH = (g) => addAch(g === 1 ? 'КУПИТЬ ПЕРВУЮ МАШИНУ' : 'КУПИТЬ ' + spaced(g) + ' МАШИН', () => sumOf(techOwned), g);
  const A_STARS = (g) => addAch(g === 1 ? 'ПОЛУЧИТЬ ПЕРВУЮ ЗВЕЗДУ' : 'ПОЛУЧИТЬ ' + g + plural(g, ' ЗВЕЗДУ', ' ЗВЕЗДЫ', ' ЗВЁЗД'), starsTotal, g);
  const A_PROK = (g) => addAch(g === 1 ? 'КУПИТЬ ПЕРВУЮ ПРОКАЧКУ' : 'КУПИТЬ ' + g + plural(g, ' ПРОКАЧКУ', ' ПРОКАЧКИ', ' ПРОКАЧЕК'), prokTotal, g);
  const A_LEVEL = (g) => addAch('ПЕКАРНЯ ' + g + ' УРОВНЯ', () => bakeryLevel, g);
  const A_EARN = (g) => addAch('ЗАРАБОТАТЬ ' + fmt(BigInt(g)), () => Number(totalEarned), g);
  const A_RATE = (g) => addAch('ДОХОД ' + spaced(g) + ' В СЕКУНДУ', () => bestPerSec, g);
  const A_CUST = (g) => addAch(g === 1 ? 'ПРОДАТЬ ПРЯНИКИ ПОКУПАТЕЛЮ' : 'ОБСЛУЖИТЬ ' + g + ' ПОКУПАТЕЛЕЙ', () => custServed, g);
  achGroup('ТАПЫ');
  [100, 500, 1000, 2500, 5000, 10000, 20000, 30000].forEach(A_TAPS);
  achGroup('СИЛА ТАПА');
  [10, 25, 50, 60, 70, 80, 90].forEach(A_TAPLV);
  achGroup('ВСЕГО МАШИН');
  [1, 50, 100, 200, 300, 400, 500, 600].forEach(A_MACH);
  achGroup('НОВЫЕ МАШИНЫ');
  ['ПЕЧЬ', 'ХОЛОДИЛЬНИК', 'ПЛИТУ', 'КОФЕМАШИНУ', 'КОНВЕКТОМАТ', 'ШОКОЛАДНЫЙ ФОНТАН', 'ТЕСТОМЕС', 'КОНВЕЙЕР', 'ФАБРИКУ ПРЯНИКОВ'].forEach((name, i) =>
    addAch('КУПИТЬ ' + name, () => Math.min(1, techOwned[i + 1]), 1));
  achGroup('МАШИНЫ ОДНОГО ВИДА');
  [25, 50, 75, 100, 125].forEach((g) => addAch(g + ' МАШИН ОДНОГО ВИДА', () => Math.max(...techOwned), g));
  achGroup('ЗВЁЗДЫ');
  [1, 3, 5, 8, 10, 15, 18, 20].forEach(A_STARS);
  achGroup('ПРОКАЧКИ');
  [1, 3, 5, 8, 10, 12, 15].forEach(A_PROK);
  achGroup('ПЕКАРНЯ');
  [3, 5, 7, 10, 12, 14, 16, 18, 20].forEach(A_LEVEL);
  achGroup('ПРЯНИКИ');
  [1e6, 1e8, 1e9, 1e10, 1e11, 1e12].forEach(A_EARN);
  achGroup('ДОХОД');
  [1000, 1e6, 1e8].forEach(A_RATE);
  achGroup('ПОКУПАТЕЛИ');
  [1, 3, 5, 10, 15].forEach(A_CUST);
  achGroup('СОБЫТИЯ');
  addAch('ВЫПОЛНИТЬ КВЕСТ', () => questsDone, 1);
  addAch('СЪЕСТЬ УГОЩЕНИЕ', () => treatsEaten, 1);
  addAch('ЗАСТАТЬ КУЛИНАРНУЮ МИНУТУ', () => minutesSeen, 1);
  achGroup('БОНЯ И ПРОЧЕЕ');
  addAch('РАЗБУДИТЬ БОНЮ', () => bonyaWoken, 1);
  addAch('ЗАБРАТЬ ДОХОД ЗА ОТСУТСТВИЕ', () => offlineTaken, 1);
  achGroup('СЛОЖНЫЕ');
  A_LEVEL(22); A_TAPLV(100); A_MACH(900); A_STARS(30); A_PROK(23); A_TAPS(75000); A_EARN(1e14); A_TAPLV(120); A_LEVEL(24); A_CUST(60);
  A_STARS(40); A_MACH(1200); A_TAPS(150000); A_TAPLV(135);
  addAch('ПО 75 МАШИН КАЖДОГО ВИДА', () => Math.min(...techOwned), 75);
  A_LEVEL(26); A_CUST(100); A_PROK(28); A_MACH(1350); A_EARN(3e15);
  // the scrolling list of achievements: headings of the groups, under them the rows with a bar
  let achScroll = 0;             // how far the list is scrolled, in px
  let achDrag = null;            // {y0, s0, thumb} while the list or its slider is held
  let achWheel = 0;              // wheel distance not yet scrolled
  let achItems = null;           // the rows and the headings with their places, counted once
  function achLayout() {
    if (achItems) return achItems;
    achItems = [];
    let y = 0;
    ACH_GROUPS.forEach((g, n) => {
      const to = n + 1 < ACH_GROUPS.length ? ACH_GROUPS[n + 1].from : ACH.length;
      achItems.push({ head: g.title, list: ACH.slice(g.from, to), y, h: 13 });
      y += 13;
      for (let i = g.from; i < to; i++) {
        const lines = ACH_TWO ? wrapText(ACH[i].name, 1, ACH_X1 - ACH_X0 - 8) : [ACH[i].name];
        const h = ACH_TWO ? lines.length * 9 + 14 : 17;
        achItems.push({ a: ACH[i], lines, y, h });
        y += h + 1;
      }
    });
    achItems.total = y;
    return achItems;
  }
  const achMaxScroll = () => Math.max(0, achLayout().total - (ACH_BOT - ACH_TOP));
  const achThumbH = () => Math.max(12, Math.round(((ACH_BOT - ACH_TOP) * (ACH_BOT - ACH_TOP)) / achLayout().total));
  function achScrollTo(v) { achScroll = Math.max(0, Math.min(achMaxScroll(), v)); }
  const achDone = (a) => a.value() >= a.goal;
  function drawAchList() {
    ctx.save();
    ctx.beginPath();
    ctx.rect(ACH_X0, ACH_TOP, ACH_X1 - ACH_X0, ACH_BOT - ACH_TOP);
    ctx.clip();
    for (const it of achLayout()) {
      const y = ACH_TOP + it.y - Math.round(achScroll), w = ACH_X1 - ACH_X0;
      if (y + it.h < ACH_TOP || y > ACH_BOT) continue;
      if (it.head) {
        const got = it.list.filter(achDone).length + '/' + it.list.length;
        drawText(it.head, 1, ACH_X0 + 2, y + 3, accent(), 'left');
        drawText(got, 1, ACH_X1 - 4 - textWidth(got, 1), y + 3, accent(), 'left');
        continue;
      }
      const a = it.a, v = Math.min(a.goal, a.value()), done = achDone(a);
      const prog = done ? 'ГОТОВО' : custNum(BigInt(Math.floor(v))) + '/' + custNum(BigInt(a.goal));
      fillRect(ACH_X0, y, w, it.h, done ? COL.rowHi : COL.row);
      if (done) fillRect(ACH_X0, y, 2, it.h, accent());
      it.lines.forEach((t, i) => drawText(t, 1, ACH_X0 + 5, y + 3 + i * 9, COL.text, 'left'));
      const py = y + 3 + (ACH_TWO ? it.lines.length * 9 : 0);
      drawText(prog, 1, ACH_X1 - 4 - textWidth(prog, 1), py, done ? accent() : dimTone(), 'left');
      const bx = ACH_X0 + 5, bw = ACH_TWO ? w - 9 - textWidth(prog, 1) - 6 : w - 9, by = ACH_TWO ? py + 2 : y + 13;
      fillRect(bx, by, bw, ACH_TWO ? 4 : 2, COL.track);
      fillRect(bx, by, Math.round(bw * Math.min(1, v / a.goal)), ACH_TWO ? 4 : 2, accent());
    }
    ctx.restore();
    const trackH = ACH_BOT - ACH_TOP, th = achThumbH();
    fillRect(ACH_X1 + 2, ACH_TOP, 3, trackH, COL.track);
    fillRect(ACH_X1 + 2, ACH_TOP + Math.round((trackH - th) * (achScroll / Math.max(1, achMaxScroll()))), 3, th, COL.thumb);
    drawText('ПОЛУЧЕНО ' + ACH.filter(achDone).length + ' ИЗ ' + ACH.length, 1, W / 2, ACH_COUNT_Y, accent(), 'center');
  }
  // the pointer y in screen rows: where the list or its slider is held
  function achGrab(gx, gy, y) {
    if (!inZone(gx, gy, ACH_X0, ACH_TOP, ACH_X1 + 8, ACH_BOT)) return false;
    achDrag = { y0: y, s0: achScroll, thumb: gx >= ACH_X1 };
    return true;
  }
  function achMove(y) {
    const dy = y - achDrag.y0;
    achScrollTo(achDrag.s0 + (achDrag.thumb ? dy * (achMaxScroll() / Math.max(1, ACH_BOT - ACH_TOP - achThumbH())) : -dy));
  }
  function updateAchWheel(dt) {
    if (achWheel === 0) return;
    const step = achWheel * Math.min(1, dt * 14), want = achScroll + step;
    achWheel -= step;
    achScrollTo(want);
    if (Math.abs(achWheel) < 0.05 || achScroll !== want) achWheel = 0;
  }
  const PROG_TABS = ['stats', 'ach', 'top', 'daily'];
  // the progress window is wider than the others, so the three tab names fit on one row
  const PROG_X0 = 72, PROG_X1 = 248, PROG_Y1 = 140;   // the same frame as the settings sheet
  const PROG_TAB_X = [74, 117, 160, 203];   // four tabs across the frame, 2 px in from its edges
  const PROG_TAB_W = [41, 41, 41, 41];
  function progTabRect(i) {
    return [PROG_TAB_X[i], 16, PROG_TAB_X[i] + PROG_TAB_W[i], 27];
  }
  function fmtTime(sec) {
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), x = Math.floor(sec % 60);
    return h > 0 ? h + 'Ч ' + m + 'М' : m + 'М ' + x + 'С';
  }
  // opens the VK leaderboard with the player's result (time in the game, in minutes); needs the VK bridge of the platform
  function openVkLeaderboard() {
    const mins = Math.max(1, Math.floor(playSec / 60));
    try {
      if (window.vkBridge && window.vkBridge.send) window.vkBridge.send('VKWebAppShowLeaderBoardBox', { user_result: mins });
    } catch (err) {
      // outside VK the bridge is missing: nothing happens
    }
  }
  function handleProgDown(gx, gy) {
    for (let i = 0; i < PROG_TABS.length; i++) {
      const [x0, y0, x1, y1] = progTabRect(i);
      if (inRect(gx, gy, x0, y0, x1, y1)) { progWin.tab = PROG_TABS[i]; dailyPreview = null; return; }
    }
    if (progWin.tab === 'top' && inRect(gx, gy, 74, 84, 246, 98)) { openVkLeaderboard(); return; }   // the table tab ('top')
    if (progWin.tab === 'daily') {
      if (dailyPreview) {
        // in the preview only НАЗАД works here; the window's ЗАКРЫТЬ below still closes it
        if (inRect(gx, gy, 74, 126, 158, 138, [74, 124, 158, 136])) { dailyPreview = null; return; }
        if (inRect(gx, gy, 162, 124, 246, 136)) { progWin = null; panelOpen = shopReturn; shopReturn = false; return; }   // the preview's own ЗАКРЫТЬ
      } else {
        const cellW = 22, cellGap = 1, x0 = Math.round((W - (7 * cellW + 6 * cellGap)) / 2);
        for (let k = 1; k <= 7; k++) {
          const cx = x0 + (k - 1) * (cellW + cellGap);
          if (inRect(gx, gy, cx, 32, cx + cellW, 68)) { dailyPreview = k; return; }   // tap a day: its skin and its day number
        }
        if (dailyCanClaim() && inRect(gx, gy, 100, 84, 220, 96)) { dailyClaim(); return; }
      }
    }
    if (progWin.tab === 'ach' && achGrab(gx, gy, lastRawY)) return;
    if (inRect(gx, gy, 74, 126, 246, 138, [74, 124, 246, 136])) { progWin = null; panelOpen = shopReturn; shopReturn = false; }   // back to the shop only if it was open before
  }
  // ---------- daily reward ----------
  // the Moscow date (UTC+3) as YYYY-MM-DD, with an optional shift in days
  function mskDate(shiftDays) {
    return new Date(Date.now() + 3 * 3600e3 + (shiftDays || 0) * 86400e3).toISOString().slice(0, 10);
  }
  // the day that the next claim gives: the streak goes on if yesterday was claimed, else it starts again at 1
  function dailyNext() {
    const today = mskDate(), yesterday = mskDate(-1);
    if (dailyDate === today) return { next: dailyDay, claimed: true };
    if (dailyDate === yesterday) return { next: (dailyDay % 7) + 1, claimed: false };
    return { next: 1, claimed: false };
  }
  function dailyCanClaim() {
    const s = dailyNext();
    return !s.claimed && dailySecDate === mskDate() && dailySec >= DAILY_NEED;
  }
  function dailyClaim() {
    if (!dailyCanClaim()) return;
    const s = dailyNext();
    const skin = SKINS[s.next];                  // day 1 gives skin 2 in the list, ..., day 7 gives skin 8
    if (skin && !skinOwned[skin.id]) { skinOwned[skin.id] = true; offerSkin(skin.id); }   // already owned: nothing to give
    dailyDay = s.next;
    dailyDate = mskDate();
    saveGame();
  }
  // the preview of one day: its skin, the day number and whether it is already owned
  function drawDailyPreview() {
    const k = dailyPreview, s = dailyNext();
    const skin = SKINS[k];
    if (!skin) return;
    const have = !!skinOwned[skin.id];
    drawText(skin.name, 1, 160, 32, accent(), 'center');
    drawText('НА ' + k + ' ДЕНЬ', 1, 160, 41, dimTone(), 'center');
    // the skin picture at full size, in the space between the title and the buttons
    const thumb = skinThumbs[skin.id];
    if (thumb && thumb.complete && thumb.naturalWidth) ctx.drawImage(thumb, 160 - 37, 48, 74, 74);
    // the two buttons at the very bottom of the window: НАЗАД on the left, ЗАКРЫТЬ on the right
    settingsButton(74, 124, 158, 136, 'НАЗАД');
    settingsButton(162, 124, 246, 136, 'ЗАКРЫТЬ');
  }
  function drawDaily() {
    if (dailyPreview) { drawDailyPreview(); return; }
    // a day whose skin is already owned has nothing to give: it passes by itself, with no offer
    if (dailyCanClaim() && skinOwned[(SKINS[dailyNext().next] || {}).id]) dailyClaim();
    const s = dailyNext();
    const cellW = 22, cellGap = 1, x0 = Math.round((W - (7 * cellW + 6 * cellGap)) / 2);   // seven cells across the frame
    for (let k = 1; k <= 7; k++) {
      const cx = x0 + (k - 1) * (cellW + cellGap);
      const skin = SKINS[k];
      const have = !!(skin && skinOwned[skin.id]);
      const done = k < s.next || (s.claimed && k === s.next);
      const current = k === s.next;
      fillRect(cx, 32, cellW, 36, current ? COL.tabOn : COL.tabOff);
      drawText(String(k), 1, cx + cellW / 2, 34, have ? COL.text : dimTone(), 'center');
      const thumb = skin && skinThumbs[skin.id];
      if (thumb && thumb.complete && thumb.naturalWidth) {
        ctx.globalAlpha = have ? 1 : 0.4;
        ctx.drawImage(thumb, cx + 3, 43, 16, 16);
        ctx.globalAlpha = 1;
      }
      if (done) fillRect(cx, 32, cellW, 1, dimTone());
    }
    const mins = Math.max(0, Math.ceil((DAILY_NEED - (dailySecDate === mskDate() ? dailySec : 0)) / 60));
    if (s.claimed) drawText('ПРИХОДИ ЗАВТРА', 1, 160, 74, dimTone(), 'center');
    else if (dailyCanClaim()) drawText('НАГРАДА ГОТОВА', 1, 160, 74, accent(), 'center');
    else drawText('ИГРАЙ ЕЩЁ ' + mins + ' МИН', 1, 160, 74, COL.text, 'center');
    if (dailyCanClaim()) settingsButton(100, 84, 220, 96, 'ЗАБРАТЬ');
    const next = SKINS[s.next];
    if (next) {
      const line = 'ДЕНЬ ' + s.next + ': ' + next.name;
      drawText(line, 1, 160, 104, dimTone(), 'center');
    }
  }
  function drawProgWin() {
    fillRect(0, 0, W, H, 'rgba(10, 8, 24, 0.6)');          // dim the game behind
    fillRect(PROG_X0, WIN_Y0, PROG_X1 - PROG_X0, PROG_Y1 - WIN_Y0, COL.panel);
    fillRect(PROG_X0, WIN_Y0, PROG_X1 - PROG_X0, 1, COL.panelEdge);
    fillRect(PROG_X0, PROG_Y1 - 1, PROG_X1 - PROG_X0, 1, COL.panelEdge);
    fillRect(PROG_X0, WIN_Y0, 1, PROG_Y1 - WIN_Y0, COL.panelEdge);
    fillRect(PROG_X1 - 1, WIN_Y0, 1, PROG_Y1 - WIN_Y0, COL.panelEdge);
    drawTextBox('ПРОГРЕСС', 1, PROG_X0, PROG_X1, WIN_Y0 + 1, WIN_Y0 + 11, COL.text);
    const labels = ['СТАТ.', 'ДОСТ.', 'ТАБЛ.', 'НАГР.'];   // short names, so they fit the frame
    labels.forEach((label, i) => {
      const [x0, y0, x1, y1] = progTabRect(i);
      fillRect(x0, y0, x1 - x0, y1 - y0, progWin.tab === PROG_TABS[i] ? COL.tabOn : COL.tabOff);
      drawTextBox(label, 1, x0, x1, y0, y1, COL.text);
      if (PROG_TABS[i] === 'daily' && dailyCanClaim() && Math.sin(cookT * 6) > 0) blinkDot(x1 - 6, y0 + 2);
    });
    const tab = progWin.tab;
    if (tab === 'stats') {
      const rows = [
        ['ЗАРАБОТАНО', custNum(totalEarned)],
        ['УРОВЕНЬ ПЕКАРНИ', String(bakeryLevel)],
        ['КЛИКОВ', spaced(playerClicks)],
        ['ПОКУПОК', spaced(totalBought)],
        ['ТЕХНИКИ КУПЛЕНО', spaced(sumOf(techOwned))],
        ['ПРОКАЧЕК', String(prokTotal())],
        ['ЗА КЛИК', custNum(clickGain())],
        ['В СЕК', rateText(autoPerSec())],
        ['ИТОГО', 'Х' + multText()],
        ['ВРЕМЯ', fmtTime(playSec)],
      ];
      rows.forEach(([name, value], i) => {
        const y = 32 + i * 9;   // one row per 9 px, all ten above the close button
        drawText(name, 1, 74, y, dimTone(), 'left');
        drawText(value, 1, 246 - textWidth(value, 1), y, COL.text, 'left');
      });
    } else if (tab === 'ach') {
      drawAchList();
    } else if (tab === 'daily') {
      drawDaily();
    } else {
      // the VK leaderboard: the time in the game, in whole minutes (the server is not there yet, so the table is opened from here)
      const mins = Math.max(1, Math.floor(playSec / 60));
      drawText('ТАБЛИЦА ВК', 1, 74, 46, COL.text, 'left');
      drawText('ВРЕМЯ, МИН', 1, 74, 60, dimTone(), 'left');
      drawText(String(mins), 1, 246 - textWidth(String(mins), 1), 60, accent(), 'left');
      settingsButton(74, 84, 246, 98, 'ОТКРЫТЬ ТАБЛИЦУ');
    }
    if (!(progWin.tab === 'daily' && dailyPreview)) settingsButton(74, 124, 246, 136, 'ЗАКРЫТЬ');
  }

  const WIN_X0 = 72, WIN_X1 = 248, WIN_Y0 = 4, WIN_Y1 = 140;   // the sheet frame: 2 px from the visible edges
  const LVL_X = 84, LVL_Y = 50, LVL_W = 152, LVL_DIM_H = 320;   // the window of a new level: over the scene, like the other messages
  const SALUTE_AT = [[96, 60], [224, 60], [160, 40]];
  // ---------- the button УРОВЕНЬ N with its bar, and the window of a new level ----------
  function drawLevelButton() {
    const [x0, x1, y0, y1] = topRect('level');
    fillRect(x0, y0, x1 - x0, y1 - y0, COL.btnFrame);
    fillRect(x0 + 2, y0 + 2, x1 - x0 - 4, y1 - y0 - 4, COL.btnFill);
    fillRect(x0 + 2, y0 + 2, Math.round((x1 - x0 - 4) * levelProgress()), y1 - y0 - 4, COL.tabOn);
    fillRect(x0 + 2, y0 + 2, x1 - x0 - 4, 1, COL.btnHi);
    drawTextBox('УРОВЕНЬ ' + bakeryLevel, 1, x0, x1, y0, y1, COL.btnText);
  }
  // a tap on it: the bonus of the level, what is left to the next one, and the next machine
  function tapLevelButton() {
    const next = TECHNIKA.find((m) => m.level > bakeryLevel), lines = ['ДОХОД +' + levelPercent() * (bakeryLevel - 1) + '%'];
    lines.push('ДО УРОВНЯ ' + (bakeryLevel + 1) + ': ' + custNum(BigInt(Math.ceil(levelNeed(bakeryLevel) - Number(totalEarned)))));
    if (next) lines.push('НА ' + next.level + ': ' + (next.short || next.name));
    showNotice(lines);
  }
  // the salute: three bursts of paper squares
  let salute = [];
  const SALUTE_COLS = ['#FFD84A', '#FF5FDC', '#7DF9FF', '#8CFF7A', '#FF8A3D'];
  function startSalute() {
    salute = [];
    SALUTE_AT.forEach(([x, y], b) => {
      for (let k = 0; k < 22; k++) {
        const a = (k / 22) * Math.PI * 2, sp = 34 + (k % 3) * 22;
        salute.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20, t: -b * 0.35, col: SALUTE_COLS[(k + b) % SALUTE_COLS.length] });
      }
    });
  }
  function updateSalute(dt) {
    if (salute.length === 0) return;
    for (const s of salute) {
      s.t += dt;
      if (s.t < 0) continue;
      s.vy += 90 * dt; s.x += s.vx * dt; s.y += s.vy * dt;
    }
    salute = salute.filter((s) => s.t < 1.3);
  }
  function drawSalute() {
    for (const s of salute) if (s.t >= 0) {
      ctx.globalAlpha = Math.max(0, 1 - s.t / 1.3);
      fillRect(Math.round(s.x), Math.round(s.y), 2, 2, s.col);
    }
    ctx.globalAlpha = 1;
  }
  // what the level has opened: one machine by its name, several by their number
  function levelOpened() {
    const o = lvlWin.opened;
    if (o.length === 0) return '';
    if (o.length > 1) return 'ОТКРЫТО МАШИН: ' + o.length;
    const word = o[0].she ? 'ОТКРЫТА: ' : 'ОТКРЫТ: ';
    return textWidth(word + o[0].name, 1) <= LVL_W - 8 ? word + o[0].name : word + o[0].short;
  }
  function drawLevelWin() {
    const x0 = LVL_X, x1 = LVL_X + LVL_W, y0 = LVL_Y, y1 = LVL_Y + 100, cx = LVL_X + LVL_W / 2;
    fillRect(0, 0, W, LVL_DIM_H, 'rgba(10, 8, 24, 0.6)');
    drawSalute();
    fillRect(x0, y0, x1 - x0, y1 - y0, COL.panel);
    fillRect(x0, y0, x1 - x0, 1, accent()); fillRect(x0, y1 - 1, x1 - x0, 1, accent());
    fillRect(x0, y0, 1, y1 - y0, accent()); fillRect(x1 - 1, y0, 1, y1 - y0, accent());
    drawText('УРОВЕНЬ ' + lvlWin.level + '!', 2, cx, y0 + 10, accent(), 'center');
    drawText('ПЕКАРНЯ ВЫРОСЛА', 1, cx, y0 + 34, COL.text, 'center');
    const opened = levelOpened();
    if (opened) drawText(opened, 1, cx, y0 + 50, COL.text, 'center');
    drawText('ДОХОД +' + levelPercent() * lvlWin.gained + '% НАВСЕГДА', 1, cx, y0 + (opened ? 62 : 56), accent(), 'center');
    fillRect(x0 + 2, y1 - 18, x1 - x0 - 4, 16, COL.row);
    drawTextBox('ОТЛИЧНО', 1, x0 + 2, x1 - 2, y1 - 18, y1 - 2, COL.text);
  }
  function handleLevelDown(gx, gy) {
    if (lvlWin.t < 0.5) return;   // a tap meant for the cookie must not close the window at once
    if (inRect(gx, gy, LVL_X, LVL_Y + 80, LVL_X + LVL_W, LVL_Y + 100)) { lvlWin = null; salute = []; }
  }

  // an income per second: the small ones with one digit after the point (0.3), the big ones like every other number
  function rateText(v) {
    if (v < 100 && Math.round(v * 10) % 10 !== 0) return (Math.round(v * 10) / 10).toFixed(1);
    return custNum(BigInt(Math.floor(v + 1e-6)));
  }
  // the total multiplier without needless zeros: 1, 1.6, 13.2
  function multText() {
    return String(Math.round(incomeMult() * 100) / 100);
  }

  // short form for the shop: from millions 1.01М, billions МЛД, trillions ТРЛ. The top counter is not shortened.
  function fmt(v) {
    const n = BigInt(v);
    if (n < 1000000n) return n.toString();
    const digits = n.toString();
    const u = Math.floor((digits.length - 1) / 3) - 2;          // 0 = a million
    if (u >= UNITS.length) return digits[0] + '.' + digits.slice(1, 3) + 'Е' + (digits.length - 1);
    const whole = digits.length - (u + 2) * 3;
    return digits.slice(0, whole) + '.' + digits.slice(whole, whole + 2) + UNITS[u];   // cut, not rounded: never 1000.00М
  }
  // the big counter: all the digits while they fit, then the short form
  function coinsText() {
    const t = String(coins);
    return textWidth(t, 2) <= COUNTER_MAX_W ? t : fmt(coins);
  }

  // ---------- buy amount: 1, 10, 100 or МАКС (only for КЛИК and ТЕХНИКА, which can be bought many times) ----------
  let buyMode = 1;              // 1 | 10 | 100 | 'max'
  const BUY_MODES = [
    { mode: 1, label: '1Х' },
    { mode: 10, label: '10Х' },
    { mode: 100, label: '100Х' },
    { mode: 'max', label: 'МАКС' },
  ];
  const BUY_MAX_STEPS = 5000;   // safety cap for МАКС
  function buyRect(i) {
    const x = PX0 + 2 + i * 43;   // four buttons across the frame
    return [x, 108, x + 40, 120];   // 1 px lower, for symmetry
  }
  // what one tap buys in a repeatable tab: how many (n) and the total price; can = the coins pay for all of it
  function plan(tab, i) {
    if (tab === 'tech' && listLocked(i)) return { n: 0, cost: 0n, can: false };
    const limit = buyMode === 'max' ? BUY_MAX_STEPS : buyMode;
    const first = priceAhead(tab, i, 0);
    let n = 0, sum = 0n;
    for (let k = 0; k < limit; k++) {
      const p = priceAhead(tab, i, k);
      if (buyMode === 'max' && coins < sum + p) break;   // МАКС: stop at what the coins can pay
      sum += p;
      n++;
    }
    if (n === 0) return { n: 1, cost: first, can: false };   // МАКС with too few coins: the price of one
    return { n, cost: sum, can: coins >= sum };
  }

  // the blinking dot: a tab has something new to buy (never bought and affordable), or, for ПРЕМИУМ,
  // some rewarded ad is still not watched
  // at least one ad of БЕСПЛАТНО can be watched now: its bonus is not running and the minute after the last ad is over
  function freeAdReady() {
    if (Date.now() < rewardAdReadyAt) return false;
    return adBoost.double <= 0 || (adBoost.discount <= 0 && !premiumOwned.discount);
  }
  function tabHasNew(id) {
    if (id === 'click') return tapLv === 0 && coins >= priceNow('click', 0);
    if (id === 'tech') return TECHNIKA.some((t, j) => techOwned[j] === 0 && !listLocked(j) && coins >= priceNow('tech', j));
    if (id === 'prok') return prokList().length > 0;   // something to improve is there
    if (id === 'premium') return freeAdReady();
    return false;
  }
  function tabRect(i) {
    const col = i % 2, row = Math.floor(i / 2);
    const x = PX0 + 2 + col * 87;
    const y = 6 + row * 16;   // 2 px under the top frame line (y 4)
    return [x, y, x + 85, y + 14];
  }

  // ---------- list helpers ----------
  // premium tab sections: adverts, permanent bonuses, skins, backgrounds (not yet)
  const PREMIUM_SECTIONS = [
    { id: 'ads', label: 'БЕСПЛАТНО' },
    { id: 'bonus', label: 'БОНУСЫ' },
    { id: 'skins', label: 'СКИНЫ' },
    { id: 'bg', label: 'ФОНЫ' },
  ];
  let premiumSection = 'bonus';
  function premiumItemsFor(sec) {
    if (sec === 'ads') return PREMIUM_ITEMS.filter((x) => x.kind === 'ad');
    // the bonuses from the cheapest to the most expensive, top to bottom
    if (sec === 'bonus') return PREMIUM_ITEMS.filter((x) => x.kind === 'premium' && ['double', 'triple', 'level2', 'discount', 'autoclick', 'bundle', 'hours1', 'hours3', 'hours8', 'hours24', 'noads'].includes(x.id)).sort((a, b) => {
      // the bonuses by price, then the bundle, then the hours packs by price
      const grp = (x) => (x.hours ? 2 : x.id === 'bundle' ? 1 : 0);
      return grp(a) - grp(b) || parseInt(a.price, 10) - parseInt(b.price, 10);
    });
    // the bundle of all premium skins always comes first
    if (sec === 'skins') {
      // after the bundle nothing is left to buy: the section is empty ("ТОВАРОВ НЕТ")
      if (premiumOwned.skins_all) return [];
      // a bought skin leaves the shop
      // an owned skin (bought, won or opened in the appearance list) also leaves the shop
      return PREMIUM_ITEMS.filter((x) => x.id === 'skins_all' || (x.id.startsWith('skin_') && !premiumOwned[x.id] && !skinOwned[x.id.slice(5)]))
        .sort((a, b) => (a.id === 'skins_all' ? -1 : b.id === 'skins_all' ? 1 : 0));
    }
    return [{ kind: 'soon', id: 'bg', name: 'НОВЫЕ ФОНЫ', line: 'ПОЯВЯТСЯ ПОЗЖЕ', price: '' }];
  }
  function sectionRect(i) {
    const col = i % 2, row = Math.floor(i / 2);
    const x0 = PX0 + 2 + col * 87;
    const y0 = 38 + row * 14;
    return [x0, y0, x0 + 85, y0 + 12];
  }
  function items() {
    if (tab === 'click') return [];   // this tab has its own three blocks
    if (tab === 'tech') return TECHNIKA;
    if (tab === 'prok') return prokList();
    return premiumItemsFor(premiumSection);
  }
  function maxScroll() {
    const content = items().length * rowH();
    return Math.max(0, content - (listBottom() - listTop()));
  }
  // list pixels per thumb pixel, so the thumb reaches the end of the track when the list reaches its end
  function thumbRatio() {
    const trackH = listBottom() - listTop();
    const content = items().length * rowH();
    const thumbH = Math.max(12, Math.round((trackH * trackH) / content));
    return maxScroll() / Math.max(1, trackH - thumbH);
  }
  function clampScroll() {
    scroll = Math.min(maxScroll(), Math.max(0, scroll));
  }

  // ---------- settings ----------
  // «НАСТРОЙКИ» is the first button of the top row
  const [GEAR_X0, GEAR_X1, GEAR_Y0, GEAR_Y1] = topRect('settings');
  const SET_X0 = 72, SET_Y0 = 4, SET_X1 = 248, SET_Y1 = 138;   // the window: 2 px from the edges of the visible 180 px   // window coordinates: 136 px tall
  // phone: menus open as sheets from the bottom: the window's top is at y 182, its bottom at y 318
  const SHEET_TOP = 182, SHEET_DY = 178;   // the sheet starts 2 px under the line under the kitchen: the window's top at y 182, 2 px above the bottom
  function inSheet(draw) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, SHEET_TOP, W, 320 - SHEET_TOP);
    ctx.clip();
    ctx.translate(0, SHEET_DY);
    draw();
    ctx.restore();
  }

  // plain top-row button (same style as the shop button)
  // a blinking 4x4 gold dot: something is ready to take
  function blinkDot(x, y) {
    fillRect(x + 1, y, 2, 4, COL.gold);
    fillRect(x, y + 1, 4, 2, COL.gold);
  }
  function drawTopButton(label, x0, x1, y0, y1) {
    fillRect(x0, y0, x1 - x0, y1 - y0, COL.btnFrame);
    fillRect(x0 + 2, y0 + 2, x1 - x0 - 4, y1 - y0 - 4, COL.btnFill);
    fillRect(x0 + 2, y0 + 2, x1 - x0 - 4, 1, COL.btnHi);
    drawTextBox(label, 1, x0, x1, y0, y1, COL.btnText);
  }

  function drawSettingsButton() {
    const x = GEAR_X0, y = GEAR_Y0, w = GEAR_X1 - GEAR_X0, h = GEAR_Y1 - GEAR_Y0;
    fillRect(x, y, w, h, COL.btnFrame);                 // 2 px silver border, symmetric
    fillRect(x + 2, y + 2, w - 4, h - 4, COL.btnFill);
    fillRect(x + 2, y + 2, w - 4, 1, COL.btnHi);
    drawTextBox('НАСТРОЙКИ', 1, x, x + w, y, y + h, COL.btnText);
  }

  // the track spans exactly the width of the buttons below (x 76..244), label above it
  const SLIDER_X0 = 124, SLIDER_W = 120;   // the slider bar: to the right of its label
  function sliderRow(y, label, v) {
    drawText(label, 1, 74, y, COL.text, 'left');                         // the label, 2 px from the window's left frame
    fillRect(SLIDER_X0, y + 2, SLIDER_W, 2, COL.track);                  // the bar on the right
    fillRect(SLIDER_X0, y + 2, Math.round(SLIDER_W * v), 2, settings.colorblind ? '#4DA3FF' : COL.emblem);
    fillRect(SLIDER_X0 + Math.round(SLIDER_W * v) - 1, y - 1, 3, 8, COL.btnText);   // the knob
  }

  function settingsButton(x0, y0, x1, y1, label) {
    fillRect(x0, y0, x1 - x0, y1 - y0, COL.row);
    fillRect(x0, y0, x1 - x0, 1, COL.btnHi);
    drawTextBox(label, 1, x0, x1, y0, y1, COL.text);
  }

  function drawSettings() {
    fillRect(0, 0, W, H, 'rgba(10, 8, 24, 0.6)');          // dim the sheet area behind
    fillRect(SET_X0, SET_Y0, SET_X1 - SET_X0, SET_Y1 - SET_Y0, COL.panel);
    // straight 1 px border on all four sides
    fillRect(SET_X0, SET_Y0, SET_X1 - SET_X0, 1, COL.panelEdge);
    fillRect(SET_X0, SET_Y1 - 1, SET_X1 - SET_X0, 1, COL.panelEdge);
    fillRect(SET_X0, SET_Y0, 1, SET_Y1 - SET_Y0, COL.panelEdge);
    fillRect(SET_X1 - 1, SET_Y0, 1, SET_Y1 - SET_Y0, COL.panelEdge);
    drawTextBox('НАСТРОЙКИ', 1, SET_X0, SET_X1, 10, 20, COL.text);
    // the version on the left and the developer on the right, on the same line as the title
    // the version is the current one; both texts start and end on the same margins as the settings rows (x 80 and x 240)
    const verText = VERSION.replace('-PHONE', ''), verW = textWidth(verText, 1), devW = textWidth('CR4YNE', 1);   // the version is always the current one; the right edge is 4 px from the frame
    drawTextBox(verText, 1, 74, 74 + verW, 10, 20, dimTone());
    drawTextBox('CR4YNE', 1, 246 - devW, 246, 10, 20, dimTone());
    // one row each: the label on the left, the slider or the toggle on the right; rows are 16 px apart
    sliderRow(22, 'ЗВУК', settings.sound);
    sliderRow(38, 'МУЗЫКА', settings.music);
    // full screen: the toggle sits in the free row between the sliders and the colour-blind row
    drawText('НА ВЕСЬ ЭКРАН', 1, 74, 54, COL.text, 'left');
    const fsOn = !!document.fullscreenElement;
    fillRect(202, 53, 44, 10, fsOn ? '#5c5096' : COL.track);
    fillRect(fsOn ? 238 : 204, 54, 8, 8, COL.btnText);
    drawText('АНИМИРОВАННЫЙ ФОН', 1, 74, 68, COL.text, 'left');
    fillRect(202, 67, 44, 10, settings.animBg ? '#5c5096' : COL.track);
    fillRect(settings.animBg ? 238 : 204, 68, 8, 8, COL.btnText);
    drawText('ТРЯСКА ЭКРАНА', 1, 74, 82, COL.text, 'left');
    fillRect(202, 81, 44, 10, settings.shake ? '#5c5096' : COL.track);
    fillRect(settings.shake ? 238 : 204, 82, 8, 8, COL.btnText);
    settingsButton(74, 96, 246, 108, 'СБРОС ПРОГРЕССА');
    // the support and documents tabs, and the close button under them
    settingsButton(74, 110, 160, 122, 'ПОДДЕРЖКА');
    settingsButton(164, 110, 246, 122, 'ДОКУМЕНТЫ');
    settingsButton(74, 124, 246, 136, 'ЗАКРЫТЬ');
  }

  // ---------- support and documents: the e-mails are copied, the documents are read in the game ----------
  let supportOpen = false, docsListOpen = false, docsOpen = -1, docsScroll = 0;
  let docsFromConsent = false;   // the reader was opened from the first-launch window
  // ---------- the first launch: the documents are read and accepted with the tick box before the game ----------
  const CONSENT_KEY = 'kucha-pryanikov-consent-v1';
  function consentAccepted() {
    try { return localStorage.getItem(CONSENT_KEY) === '1'; } catch (err) { return false; }
  }
  let consentOpen = !consentAccepted();
  let consentChecked = false;
  const CX0 = SET_X0 + 2, CX1 = SET_X1 - 2;
  const CON = { t1: 24, b1: [35, 57], b2: [60, 82], box: [88, 0], info: 102, go: [123, 134] };
  // a button with two centred lines of text (the long document names do not fit on one line of the phone window)
  function labelButton(x0, y0, x1, y1, l1, l2) {
    fillRect(x0, y0, x1 - x0, y1 - y0, COL.row);
    fillRect(x0, y0, x1 - x0, 1, COL.btnHi);
    const cx = Math.round((x0 + x1) / 2);
    drawText(l1, 1, cx, y0 + 4, COL.text, 'center');
    drawText(l2, 1, cx, y0 + 13, COL.text, 'center');
  }
  function drawConsent() {
    drawSupportFrame('ПЕРЕД ИГРОЙ');
    drawText('ПРОЧТИТЕ ДОКУМЕНТЫ ИГРЫ', 1, Math.round((SET_X0 + SET_X1) / 2), CON.t1, dimTone(), 'center');
    labelButton(CX0, CON.b1[0], CX1, CON.b1[1], 'ПОЛЬЗОВАТЕЛЬСКОЕ', 'СОГЛАШЕНИЕ');
    labelButton(CX0, CON.b2[0], CX1, CON.b2[1], 'ПОЛИТИКА', 'КОНФИДЕНЦИАЛЬНОСТИ');
    // the tick box: a frame and a tick inside it when ticked
    fillRect(CX0, CON.box[0], 10, 10, COL.panelEdge);
    fillRect(CX0 + 1, CON.box[0] + 1, 8, 8, COL.row);
    if (consentChecked) fillRect(CX0 + 3, CON.box[0] + 3, 4, 4, COL.emblem);
    drawText('ПРИНИМАЮ ДОКУМЕНТЫ', 1, CX0 + 16, CON.box[0] + 1, COL.text, 'left');
    // the version, the age rating and the developer, centred under the tick box (they were in the launch window before)
    const info = ['ВЕРСИЯ: ' + VERSION.replace('-PHONE', '') + '  ВОЗРАСТ: 0+', 'РАЗРАБОТЧИК: CR4YNE'];
    info.forEach((t, i) => drawText(t, 1, Math.round((SET_X0 + SET_X1) / 2), CON.info + i * 10, dimTone(), 'center'));
    // the continue button: lit only after the tick box
    fillRect(CX0, CON.go[0], CX1 - CX0, CON.go[1] - CON.go[0], consentChecked ? COL.btnFrame : COL.panelEdge);
    fillRect(CX0 + 2, CON.go[0] + 2, CX1 - CX0 - 4, CON.go[1] - CON.go[0] - 4, consentChecked ? COL.btnFill : COL.row);
    drawTextBox('ПРОДОЛЖИТЬ', 1, CX0, CX1, CON.go[0], CON.go[1], consentChecked ? COL.btnText : dimTone());
  }
  function handleConsentDown(gx, gy) {
    if (docsOpen >= 0) {
      if (inRect(gx, gy, 74, 124, 246, 136)) { docsOpen = -1; docsFromConsent = false; }
      return;
    }
    if (inRect(gx, gy, CX0, CON.b1[0], CX1, CON.b1[1])) { docsOpen = 0; docsFromConsent = true; docsScroll = 0; return; }
    if (inRect(gx, gy, CX0, CON.b2[0], CX1, CON.b2[1])) { docsOpen = 1; docsFromConsent = true; docsScroll = 0; return; }
    if (inRect(gx, gy, CX0, CON.box[0], CX1, CON.box[0] + 10, [CX0, CON.box[0], CX0 + 10, CON.box[0] + 10])) { consentChecked = !consentChecked; return; }
    if (consentChecked && inRect(gx, gy, CX0, CON.go[0], CX1, CON.go[1])) {
      try { localStorage.setItem(CONSENT_KEY, '1'); } catch (err) { /* storage blocked: the window shows again next time */ }
      consentOpen = false;
    }
  }

  const SUPPORT_EMAILS = ['CR4YNEGAMES@GMAIL.COM', 'BILLKAMIKADZE@GMAIL.COM'];
  const DOC_TOP = 22, DOC_BOTTOM = 120, DOC_X = 80, DOC_W = 160;
  // the copy button: a thin 1 px frame in the same colour as the menu's borders, and the inside of the card
  function copyButton(x0, y0, x1, y1, label) {
    fillRect(x0, y0, x1 - x0, y1 - y0, COL.panelEdge);
    fillRect(x0 + 1, y0 + 1, x1 - x0 - 2, y1 - y0 - 2, COL.row);
    drawTextBox(label, 1, x0, x1, y0, y1, COL.text);
  }
  // the copy button turns into СКОПИРОВАНО for 5 seconds after a copy
  let copiedUntil = [0, 0];
  function copyEmail(i) {
    try { navigator.clipboard.writeText(SUPPORT_EMAILS[i].toLowerCase()).catch(() => {}); } catch (err) { /* the browser refused */ }
    copiedUntil[i] = Date.now() + 5000;
  }
  function drawSupportFrame(title) {
    fillRect(SET_X0, SET_Y0, SET_X1 - SET_X0, SET_Y1 - SET_Y0, COL.panel);
    fillRect(SET_X0, SET_Y0, SET_X1 - SET_X0, 1, COL.panelEdge);
    fillRect(SET_X0, SET_Y1 - 1, SET_X1 - SET_X0, 1, COL.panelEdge);
    fillRect(SET_X0, SET_Y0, 1, SET_Y1 - SET_Y0, COL.panelEdge);
    fillRect(SET_X1 - 1, SET_Y0, 1, SET_Y1 - SET_Y0, COL.panelEdge);
    drawTextBox(title, 1, SET_X0, SET_X1, 10, 20, COL.text);
  }
  function drawSupport() {
    drawSupportFrame('ПОДДЕРЖКА');
    drawTextBox('ПОЧТА ДЛЯ ОБРАЩЕНИЙ', 1, SET_X0, SET_X1, 26, 34, dimTone());
    // one card per e-mail: the address on top, the copy button under it
    SUPPORT_EMAILS.forEach((e, i) => {
      const y = 40 + i * 36;
      fillRect(74, y, 172, 30, COL.panelEdge);
      fillRect(75, y + 1, 170, 28, COL.row);
      drawTextBox(e, 1, 74, 246, y + 4, y + 12, COL.text);
      copyButton(120, y + 16, 200, y + 28, Date.now() < copiedUntil[i] ? 'СКОПИРОВАНО' : 'КОПИРОВАТЬ');
    });
    drawTextBox('ОТВЕТИМ В ТЕЧЕНИЕ 7 ДНЕЙ', 1, SET_X0, SET_X1, 112, 120, dimTone());
    settingsButton(74, 124, 246, 136, 'НАЗАД');
  }
  function drawDocsList() {
    drawSupportFrame('ДОКУМЕНТЫ');
    labelButton(74, 50, 246, 74, 'ПОЛЬЗОВАТЕЛЬСКОЕ', 'СОГЛАШЕНИЕ');
    labelButton(74, 78, 246, 102, 'ПОЛИТИКА', 'КОНФИДЕНЦИАЛЬНОСТИ');
    settingsButton(74, 124, 246, 136, 'НАЗАД');
  }
  function docHeight(body) {
    let y = 0;
    body.split('\n').forEach((p) => {
      if (p.trim() === '') { y += 11; return; }
      y += wrapText(p, 1, DOC_W).length * 11 + 4;
    });
    return y;
  }
  function docMaxScroll(doc) { return Math.max(0, docHeight(doc.body) - (DOC_BOTTOM - DOC_TOP)); }
  function drawDocReader() {
    const doc = DOCS[docsOpen];
    drawSupportFrame(docsOpen === 0 ? 'СОГЛАШЕНИЕ' : 'ПОЛИТИКА');
    ctx.save();
    ctx.beginPath();
    ctx.rect(DOC_X - 2, DOC_TOP, DOC_W + 4, DOC_BOTTOM - DOC_TOP);
    ctx.clip();
    let y = DOC_TOP - docsScroll;
    doc.body.split('\n').forEach((p) => {
      if (p.trim() === '') { y += 11; return; }
      y = drawWrapped(p, 1, DOC_X, y, DOC_W, COL.text, 11) + 4;
    });
    ctx.restore();
    settingsButton(74, 124, 246, 136, 'НАЗАД');
  }
  function handleInfoDown(gx, gy) {
    if (supportOpen) {
      if (inRect(gx, gy, 120, 56, 200, 68)) { copyEmail(0); return; }
      if (inRect(gx, gy, 120, 92, 200, 104)) { copyEmail(1); return; }
      if (inRect(gx, gy, 74, 124, 246, 136)) supportOpen = false;
      return;
    }
    if (docsListOpen) {
      if (inRect(gx, gy, 74, 50, 246, 74)) { docsListOpen = false; docsOpen = 0; docsScroll = 0; return; }
      if (inRect(gx, gy, 74, 78, 246, 102)) { docsListOpen = false; docsOpen = 1; docsScroll = 0; return; }
      if (inRect(gx, gy, 74, 124, 246, 136)) docsListOpen = false;
      return;
    }
    if (docsOpen >= 0 && inRect(gx, gy, 74, 124, 246, 136)) { docsOpen = -1; docsListOpen = true; }
  }
  function setSlider(name, gx) {
    const v = Math.max(0, Math.min(1, (gx - SLIDER_X0) / SLIDER_W));
    settings[name] = Math.round(v * 20) / 20;
    if (name === 'music' && musicGain) musicGain.gain.value = settings.music;
    if (name === 'sound' && sfxGain) sfxGain.gain.value = settings.sound;
    saveGame();   // the volume is kept on this device (and in the VK cloud save)
  }

  // the reset window (in the sheet): what is lost and what stays, then two confirmations (three steps in all)
  function drawResetWin() {
    fillRect(76, 8, 168, 126, COL.panel);
    fillRect(76, 8, 168, 1, COL.panelEdge); fillRect(76, 133, 168, 1, COL.panelEdge);
    fillRect(76, 8, 1, 126, COL.panelEdge); fillRect(243, 8, 1, 126, COL.panelEdge);
    if (resetWin.stage === 1) {
      drawTextBox('СБРОС ПРОГРЕССА', 1, 76, 244, 14, 22, accent());
      const lines = ['ПРОПАДЕТ:', 'ПРЯНИКИ, ТАП, ТЕХНИКА', 'ПРОКАЧКИ И УРОВЕНЬ', 'БОНУСЫ ЗА РЕКЛАМУ', 'СТАТИСТИКА И ДОСТИЖЕНИЯ', 'ОСТАНЕТСЯ:', 'ПОКУПКИ ЗА ГОЛОСА, СКИНЫ,', 'НАСТРОЙКИ'];
      lines.forEach((t, i) => drawTextBox(t, 1, 80, 240, 28 + i * 10, 35 + i * 10, COL.text));
      settingsButton(80, 106, 160, 120, 'ДАЛЕЕ');
      settingsButton(164, 106, 240, 120, 'ОТМЕНА');
    } else {
      drawTextBox(resetWin.stage === 2 ? 'ТОЧНО СБРОСИТЬ?' : 'ТОЧНО? ЭТО НЕОБРАТИМО!', 1, 76, 244, 56, 64, COL.text);
      settingsButton(80, 96, 160, 110, 'ДА');
      settingsButton(164, 96, 240, 110, 'НЕТ');
    }
  }
  function handleResetDown(gx, gy) {
    if (resetWin.stage === 1) {
      if (inRect(gx, gy, 80, 106, 160, 120)) resetWin = { stage: 2 };
      else if (inRect(gx, gy, 164, 106, 240, 120)) resetWin = null;
      return;
    }
    if (inRect(gx, gy, 80, 96, 160, 110)) {
      if (resetWin.stage === 2) resetWin = { stage: 3 };
      else { resetAll(); resetWin = null; }
    } else if (inRect(gx, gy, 164, 96, 240, 110)) resetWin = null;
  }
  function resetAll() {
    coins = 0n;
    tapLv = 0; tapAcc = 0;
    techOwned = techOwned.map(() => 0);
    prokOwned = prokOwned.map(() => false);
    adBoost = { double: 0, discount: 0 };
    autoAcc = 0;                 // premium purchases are kept on reset
    bakeryLevel = 1; lvlPending = null; lvlWin = null; salute = [];
    // statistics and achievements (the achievements are counted from these) start again
    totalEarned = 0n;
    playerClicks = 0;
    playSec = 0;
    totalBought = 0;
    custServed = 0; questsDone = 0; treatsEaten = 0; minutesSeen = 0; bonyaWoken = 0; offlineTaken = 0; bestPerSec = 0;
    cust = null;
    custGap = CUST_FIRST;        // the customers start again too
    gameT = window.KITCHEN.START;   // and the time: spring, day 5, 10:00
    offlineFrom = 0; offlineWin = null;
    resetAt = Date.now();        // this save is now newer than any copy made before the reset
    saveGame();                  // saved only after everything above is cleared
    if (window.vkBridge) vkSaveNow();   // the cloud gets the reset at once, not in 15 s
  }

  // the whole screen: a tap in the settings asks the browser for it (browsers allow it only after a tap)
  // the full-screen icon in the bottom left corner of the screen: hidden while any menu is open
  const FS_BL_X = SCENE_CROP_X + 3, FS_BL_Y = 299, FS_BL_S = 18;   // scene x: the screen shows the scene from SCENE_CROP_X
  function anyMenuOpenNow() {
    return settingsOpen || panelOpen || !!progWin || skinWin || !!premiumWin || !!skinOffer || boostMenuOpen;
  }
  function drawFullScreenIconAt(x, y, s) {
    fillRect(x, y, s, s, COL.btnFrame);                    // 2 px frame
    fillRect(x + 2, y + 2, s - 4, s - 4, COL.btnFill);     // inside: the tab colour
    const L = x + 3, R = x + s - 4, T = y + 3, B = y + s - 4;   // the four brackets, 2 px thick, 1 px from the inner edge
    fillRect(L, T, 4, 2, COL.btnFrame); fillRect(L, T, 2, 4, COL.btnFrame);
    fillRect(R - 3, T, 4, 2, COL.btnFrame); fillRect(R - 1, T, 2, 4, COL.btnFrame);
    fillRect(L, B - 1, 4, 2, COL.btnFrame); fillRect(L, B - 3, 2, 4, COL.btnFrame);
    fillRect(R - 3, B - 1, 4, 2, COL.btnFrame); fillRect(R - 1, B - 3, 2, 4, COL.btnFrame);
  }
  function toggleFullScreen() {
    try {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else document.documentElement.requestFullscreen().catch(() => {});   // the browser may refuse: nothing changes
    } catch (err) { /* the browser refused: nothing changes */ }
  }
  function handleSettingsDown(gx, gy) {
    if (resetWin) { handleResetDown(gx, gy); return; }   // the reset window takes all taps
    if (inRect(gx, gy, 74, 110, 160, 122)) { supportOpen = true; return; }
    if (inRect(gx, gy, 164, 110, 246, 122)) { docsListOpen = true; return; }
    if (inRect(gx, gy, 74, 124, 246, 136)) { settingsOpen = false; resetWin = null; panelOpen = shopReturn; shopReturn = false; return; }   // back to the shop only if it was open before
    if (inRect(gx, gy, 198, 66, 248, 78, [202, 67, 246, 77])) { settings.animBg = !settings.animBg; saveGame(); return; }
    if (inRect(gx, gy, 198, 80, 248, 92, [202, 81, 246, 91])) { settings.shake = !settings.shake; saveGame(); return; }
    if (inRect(gx, gy, 74, 96, 246, 108)) { resetWin = { stage: 1 }; return; }   // opens the reset window
    if (inRect(gx, gy, 198, 51, 248, 65, [202, 53, 246, 63])) { toggleFullScreen(); return; }   // the full-screen toggle, drawn at y 53-63
    if (inZone(gx, gy, 120, 22, 246, 34)) { sliderDrag = 'sound'; setSlider('sound', gx); return; }
    if (inZone(gx, gy, 120, 38, 246, 50)) { sliderDrag = 'music'; setSlider('music', gx); return; }
  }

  // ---------- input ----------
  let lastRawY = 0;   // the screen row of the last tap, before the shift (the strip under the scene uses it)
  function toGame(e) {
    const r = canvas.getBoundingClientRect();
    const s = r.width / PHONE_W;   // screen pixels per canvas pixel
    const raw = (e.clientY - r.top) / s;
    lastRawY = raw;
    // rows 0-159 show the scene rows 20-179; rows 160-179 are the strip under the scene (no scene picture): far away from every scene target
    const y = raw < 160 ? raw + SCENE_UP : raw < 180 ? 1000 + raw : raw;
    return [(e.clientX - r.left) / s + SCENE_CROP_X, y];   // the whole screen is the scene now
  }
  function inZone(gx, gy, x0, y0, x1, y1) {
    return gx >= x0 && gx < x1 && gy >= y0 && gy < y1;
  }
  // a button: the same, and it is pressed in (drawn: its picture, when the zone of the tap is larger)
  function inRect(gx, gy, x0, y0, x1, y1, drawn) {
    if (!inZone(gx, gy, x0, y0, x1, y1)) return false;
    if (drawn) setHit(gx, gy, ...drawn); else setHit(gx, gy, x0, y0, x1, y1);
    return true;
  }

  // ---------- a pressed button: its inside goes down by a pixel while it is held ----------
  // inRect remembers the rectangle that has taken the tap; when the tap opens or closes a window, the old picture with
  // the pressed button stays for a moment longer, so that the press is seen
  const PRESS_S = 0.09;
  let tapRaw = null, hitBox = null, press = null;   // press: {box, t, held, key, shot}
  const pressCanvas = document.createElement('canvas');
  pressCanvas.width = canvas.width; pressCanvas.height = canvas.height;
  const pressCtx = pressCanvas.getContext('2d');
  function screenKey() {
    return [settingsOpen, panelOpen, !!progWin, skinWin, skinPreview, premiumWin && premiumWin.mode, !!skinOffer, boostMenuOpen, supportOpen, docsListOpen, docsOpen, consentOpen,
      resetWin && resetWin.stage, !!lvlWin, !!offlineWin, !!noticeWin, dailyPreview, !!sale, loadingLeft > 0].join();
  }
  function setHit(gx, gy, x0, y0, x1, y1) {
    if (tapRaw) hitBox = [x0 + tapRaw[0] - gx, y0 + tapRaw[1] - gy, x1 - x0, y1 - y0].map(Math.round);   // on the canvas
  }
  function withPress(e, held, fn) {
    const [gx, gy] = toGame(e), before = screenKey();
    tapRaw = [gx - SCENE_CROP_X, lastRawY]; hitBox = null;
    fn(e);
    tapRaw = null;
    if (!hitBox || !settings.animBg) return;
    const shot = screenKey() !== before;
    if (shot) { pressCtx.clearRect(0, 0, canvas.width, canvas.height); pressCtx.drawImage(canvas, 0, 0); }
    press = { box: hitBox, t: 0, held, shot, key: screenKey() };
  }
  function drawPress(c, dt) {
    if (!press) return;
    press.t += dt;
    if (press.t > PRESS_S && (press.shot || !press.held) || !press.shot && press.key !== screenKey()) { press = null; return; }
    if (press.shot) { c.globalAlpha = 1; c.drawImage(pressCanvas, 0, 0); }
    const [x, y, w, h] = press.box;
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.drawImage(canvas, x + 2, y + 2, w - 4, h - 5, x + 2, y + 3, w - 4, h - 5);
    c.fillStyle = 'rgba(12, 8, 34, 0.22)'; c.fillRect(x + 2, y + 2, w - 4, h - 4);
    c.fillStyle = 'rgba(12, 8, 34, 0.6)'; c.fillRect(x + 2, y + 2, w - 4, 1);
    c.restore();
  }

  // the counter text is not a click target (the big zone overlaps it)
  function inCounter(gx, gy) {
    const cx = coinX();
    const w = Math.max(textWidth('ПРЯНИКОВ', 1), textWidth(coinsText(), 2));
    return inZone(gx, gy, cx - w / 2 - 3, COUNTER_LABEL_Y - 3, cx + w / 2 + 3, COUNTER_AUTO_Y + 9);
  }

  let pendingTapSound = false;   // a tap plays the click sound, unless the tap plays its own sound (a buy, the cookie)
  canvas.addEventListener('pointerdown', (e) => {
    if (splashT > 0) return;   // the start screen takes no taps
    pendingTapSound = true;
    withPress(e, true, handleTapDown);
    if (pendingTapSound) sfxButton();
  });
  function handleTapDown(e) {
    e.preventDefault();
    if (launchState !== 'ok') return;   // not started yet, or not confirmed by the server
    const [ngx, ngy] = toGame(e);
    if (noticeWin) {
      if (noticeWin.onYes) {
        if (inRect(ngx, ngy, 85, 86, 159, 95)) { const yes = noticeWin.onYes; noticeWin = null; yes(); }
        else if (inRect(ngx, ngy, 161, 86, 235, 95)) noticeWin = null;
      } else if (inRect(ngx, ngy, 85, 86, 235, 95)) noticeWin = null;
      return;
    }   // the message takes the taps until OK
    if (splashT > 0) return;                  // the start screen takes no taps
    // the documents scroll by dragging them (in the consent window too), inside their text area
    if (docsOpen >= 0) {
      const [dgx, dgy] = toGame(e);
      if (dgy - SHEET_DY >= DOC_TOP - 2 && dgy - SHEET_DY <= DOC_BOTTOM + 2) {
        docsDrag = { y0: rawY(e), s0: docsScroll, moved: 0 };
        capturePointer(e);
      }
    }
    if (consentOpen) { const [cgx, cgy] = toGame(e); handleConsentDown(cgx, cgy - SHEET_DY); return; }   // the first-launch window comes before the info window
    startMusicOnce();
    const [gx, gy] = toGame(e);
    if (offlineWin) { handleOfflineDown(gx, gy); return; }       // the window of the income while the game was closed
    if (lvlWin) { handleLevelDown(gx, gy); return; }             // the window of a new level
    if (sale) return;                         // the selling screen takes no taps
    if (tapCustomer(gx, gy)) return;          // the customer at the counter (with a menu open too: the scene stays in view)
    if (inZone(gx, gy, ...CAKE_BOX)) kitchen.things.cherry();   // the cherry on the cake springs
    if (tryHitAppetite(gx, gy)) return;       // the glowing plate on the counter (with a menu open too)
    // with a menu open the cookie still counts: the menus are drawn lower down (from y 182), the cookie is above them
    if ((anyMenuOpenNow() || supportOpen || docsListOpen || docsOpen >= 0) && gy < FLOOR_Y + 10) { spawnClick(gx, gy); return; }
    if (!anyMenuOpenNow() && !document.fullscreenElement && inRect(gx, gy, FS_BL_X, FS_BL_Y, FS_BL_X + FS_BL_S, FS_BL_Y + FS_BL_S)) { toggleFullScreen(); return; }
    if (consentOpen) { handleConsentDown(gx, gy - SHEET_DY); return; }
    if (supportOpen || docsListOpen || docsOpen >= 0) { handleInfoDown(gx, gy - SHEET_DY); return; }
    if (settingsOpen) { handleSettingsDown(gx, gy - SHEET_DY); return; }   // the settings window blocks everything else
    if (progWin) { handleProgDown(gx, gy - SHEET_DY); return; }             // and the progress window
    if (skinWin) { handleSkinDown(gx, gy - SHEET_DY); return; }             // and the appearance window
    if (skinOffer) { handleSkinOfferDown(gx, gy - SHEET_DY); return; }
    if (premiumWin) { handlePremiumWinDown(gx, gy - SHEET_DY); return; }     // and the premium purchase window
    if (boostMenuOpen) { boostMenuOpen = false; return; }          // a tap closes the bonus menu
    if (inRect(gx, lastRawY, MENU_BTN_X, MENU_BTN_Y[0], MENU_BTN_X + MENU_BTN_W, MENU_BTN_Y[1])) { boostMenuOpen = true; return; }   // the framed button opens the menu
    countBonyaPokes(gx, gy);
    if (tapBonyaBubble(gx, gy)) return;
    if (tapBonya(gx, gy)) return;                                 // the sleeping rabbit by the cake
    const shopSheetOpen = panelOpen && panelT > 0.99;   // while the shop sheet is open, the buttons under it are not reachable
    if (!shopSheetOpen && inRect(gx, gy, GEAR_X0, GEAR_Y0, GEAR_X1, GEAR_Y1)) { closeMenus('settings'); settingsOpen = true; return; }
    // shop controls (only when the panel is fully open)
    if (inRect(gx, lastRawY, SKIN_BTN[0], SKIN_BTN[1], SKIN_BTN[2], SKIN_BTN[3])) { closeMenus('skin'); skinWin = true; skinScroll = clampSkinScroll(Math.floor(Math.max(0, SKINS.findIndex((s) => s.id === settings.skin)) / SKIN_COLS) * SKIN_ROW_H); return; }
    // the ПРОГРЕСС button is reachable from the shop too
    const [ax0, ax1, ay0, ay1] = topRect('achievements');
    if (!shopSheetOpen && inRect(gx, gy, ax0, ay0, ax1, ay1)) { closeMenus('progress'); progWin = { tab: 'stats' }; return; }
    if (!shopSheetOpen) {
      const [rx0, rx1, ry0, ry1] = topRect('level');
      if (inRect(gx, gy, rx0, ry0, rx1, ry1)) { tapLevelButton(); return; }
    }
    if (panelOpen && panelT > 0.99) {
      const sgy = gy - SHEET_DY;   // the shop sheet is drawn SHEET_DY lower
      for (let i = 0; i < TABS.length; i++) {
        const [x0, y0, x1, y1] = tabRect(i);
        if (inRect(gx, sgy, x0, y0, x1, y1)) { tab = TABS[i].id; scroll = 0; return; }
      }
      if (hasBuyRow() && sgy >= 108 && sgy < 120) {
        for (let i = 0; i < BUY_MODES.length; i++) {
          const [x0, y0, x1, y1] = buyRect(i);
          if (inRect(gx, sgy, x0, y0, x1, y1)) { buyMode = BUY_MODES[i].mode; return; }
        }
      }
      if (inRect(gx, sgy, PX0 + 2, closeY(), PX1 - 2, closeY() + 14)) {
        panelOpen = false;
        return;
      }
      if (tab === 'premium') {
        for (let i = 0; i < PREMIUM_SECTIONS.length; i++) {
          const [x0, y0, x1, y1] = sectionRect(i);
          if (inRect(gx, sgy, x0, y0, x1, y1)) { premiumSection = PREMIUM_SECTIONS[i].id; scroll = 0; return; }
        }
      }
      if (inZone(gx, sgy, PX0, listTop(), PX1, listBottom())) {
        // grabbing the scrollbar (right edge): the thumb follows the finger; elsewhere the list follows it
        drag = { y0: rawY(e), s0: scroll, moved: 0, thumb: gx >= PX1 - 8 };   // raw screen rows, see rawY
        capturePointer(e);   // the finger may leave the list: the game still gets its move and its lift
        return;
      }
    } else if (!panelOpen && inRect(gx, gy, BTN_X0, BTN_Y0, BTN_X1, BTN_Y1)) {
      closeMenus('shop');
      panelOpen = true;
      shopReturn = false;
      return;
    }
    // the coin works with the shop open too
    const dx = gx - coinX();
    const dy = gy - COIN_Y;
    if (gy < FLOOR_Y + 10) { tapCook(gx, gy); spawnClick(gx, gy); }   // any place above the middle of the floor counts, the counter included
  }

  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dy = rawY(e) - drag.y0;   // raw screen rows: the strip between the scene and the sheet must not jump the list
    drag.moved = Math.max(drag.moved, Math.abs(dy));
    // list drag: content follows the finger. thumb drag: the thumb moves with the finger, so the list moves the other way.
    // dragging down moves the thumb down (top of the list = thumb at the top), so the list scrolls the other way
    scroll = drag.s0 + dy * (drag.thumb ? thumbRatio() : -1);   // the list follows the finger: dragging up moves the list up
    clampScroll();
  });

  function endDrag(e) {
    if (!drag) return;
    const [gx, gy] = toGame(e);
    const wasTap = drag.moved < 4;
    drag = null;
    const sgy = panelOpen ? gy - SHEET_DY : gy;   // the shop sheet is drawn SHEET_DY lower
    if (tab === 'click') { if (wasTap && inRect(gx, sgy, ...CLICK_BUY)) buy('click', 0); return; }
    if (wasTap && inZone(gx, sgy, PX0, listTop(), PX1 - 8, listBottom())) {
      const idx = Math.floor((sgy - listTop() + scroll) / rowH());
      if (idx >= 0 && idx < items().length) {
        const ry = listTop() + idx * rowH() - scroll;
        setHit(gx, sgy, PX0, Math.max(listTop(), ry), PX1 - 4, Math.min(listBottom(), ry + rowH()));   // the row is the button
        if (tab === 'prok') buy('prok', PROKACHKI.indexOf(items()[idx]));
        else if (tab === 'premium') {
          const it = items()[idx];
          const gi = PREMIUM_ITEMS.indexOf(it);
          if (it.kind === 'premium') { if (it.hours ? hoursSum(it.hours) > 0n : !premiumOwned[it.id]) premiumWin = { mode: 'confirm', idx: gi }; }
          else if (it.kind === 'ad') buy('ad', gi);
        }
        else buy(tab, idx);
      }
    }
  }
  canvas.addEventListener('pointerup', (e) => { if (drag) withPress(e, false, endDrag); });
  canvas.addEventListener('pointermove', (e) => {
    if (achDrag) { achMove(rawY(e)); return; }
    if (!sliderDrag) return;
    const [gx] = toGame(e);
    setSlider(sliderDrag, gx);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!skinDrag) return;
    const dy = rawY(e) - skinDrag.y0;   // raw screen rows, so the strip between the scene and the sheet does not jump
    const track = (SKIN_BOT - SKIN_TOP) - skinThumbH();
    skinScroll = clampSkinScroll(skinDrag.s0 + dy * (skinMaxScroll() / Math.max(1, track)));
  });
  // the documents follow the finger
  canvas.addEventListener('pointermove', (e) => {
    if (!docsDrag || docsOpen < 0) return;
    const dy = rawY(e) - docsDrag.y0;
    docsDrag.moved = Math.max(docsDrag.moved, Math.abs(dy));
    docsScroll = Math.max(0, Math.min(docMaxScroll(DOCS[docsOpen]), docsDrag.s0 - dy));
  });
  window.addEventListener('pointerup', () => { sliderDrag = null; achDrag = null; skinDrag = null; docsDrag = null; });
  window.addEventListener('pointerup', (e) => { if (press && press.held) press.held = false; });
  canvas.addEventListener('pointercancel', () => { if (press) press.held = false; drag = null; docsDrag = null; });
  // the screen row of a pointer event in canvas pixels, without the scene's shifts: a drag measures the finger's real movement
  function rawY(e) {
    const r = canvas.getBoundingClientRect();
    return (e.clientY - r.top) / (r.width / PHONE_W);
  }
  // the pointer stays with the canvas until the finger lifts, even when it leaves the list
  function capturePointer(e) {
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* the browser refused: the list still works inside the canvas */ }
  }

  canvas.addEventListener('wheel', (e) => {
    if (docsOpen >= 0) {   // the document scrolls with the wheel
      e.preventDefault();
      docsWheelPending += e.deltaY * 0.5;   // eased in update(), like the lists
      return;
    }
    if (skinWin && !skinPreview) {
      const [wx, wy] = toGame(e);
      if (inZone(wx, wy - SHEET_DY, 74, SKIN_TOP, 246, SKIN_BOT)) {
        e.preventDefault();
        skinWheelPending += e.deltaY * 0.5;   // eased in update(), like the lists
        return;
      }
    }
    if (progWin && progWin.tab === 'ach') {
      e.preventDefault();
      achWheel += e.deltaY * 0.5;   // eased in update(), like the lists
      return;
    }
    if (!panelOpen) return;
    const [gx, gy] = toGame(e);
    if (inZone(gx, gy - SHEET_DY, PX0, listTop(), PX1, listBottom())) {   // the shop sheet is drawn SHEET_DY lower
      e.preventDefault();
      wheelPending += e.deltaY * 0.5;   // eased in update(), so the list glides instead of jumping
    }
  }, { passive: false });

  // ---------- update ----------
  function update(dt) {
    if (loadingLeft > 0) loadingLeft = Math.max(0, loadingLeft - dt);
    if (wheelPending !== 0) {
      const step = wheelPending * Math.min(1, dt * 14);
      wheelPending -= step;
      if (Math.abs(wheelPending) < 0.05) wheelPending = 0;
      scroll += step;
      const before = scroll;
      clampScroll();
      if (scroll !== before) wheelPending = 0;   // stop at the ends of the list
    }
    // the skin grid and the document reader glide the same way
    if (skinWheelPending !== 0) {
      const step = skinWheelPending * Math.min(1, dt * 14);
      skinWheelPending -= step;
      if (Math.abs(skinWheelPending) < 0.05) skinWheelPending = 0;
      const want = skinScroll + step;
      skinScroll = clampSkinScroll(want);
      if (skinScroll !== want) skinWheelPending = 0;   // stop at the ends
    }
    if (docsWheelPending !== 0) {
      if (docsOpen < 0) docsWheelPending = 0;
      else {
        const step = docsWheelPending * Math.min(1, dt * 14);
        docsWheelPending -= step;
        if (Math.abs(docsWheelPending) < 0.05) docsWheelPending = 0;
        const want = docsScroll + step;
        docsScroll = Math.max(0, Math.min(docMaxScroll(DOCS[docsOpen]), want));
        if (docsScroll !== want) docsWheelPending = 0;
      }
    }
    if (splashT > 0) { splashT = Math.max(0, splashT - dt); if (splashT === 0) splash = null; }
    animT += dt;
    bonyaT += dt;
    updateBonya(dt);
    if (skinId === 'sea' || skinPreview === 'sea') {
      fishTimer -= dt;
      if (fishTimer <= 0) {
        // one to four fish at once, each one with its own shape and colour
        const inPreview = skinPreview === 'sea';
        const count = 1 + Math.floor(Math.random() * 4);
        const cols = ['#FF9E5E', '#FFD84A', '#7FD6FF', '#FF6FA8', '#9AFF8A', '#C98BFF'];
        for (let n = 0; n < count; n++) {
          fishes.push({
            t: 0, ax: inPreview ? 160 : coinX(), ay: inPreview ? 67 : COIN_Y,
            rx: inPreview ? 40 : 46, dir: Math.random() < 0.5 ? 1 : -1, dy: (Math.random() - 0.5) * 50,
            type: Math.floor(Math.random() * 3), col: cols[Math.floor(Math.random() * cols.length)],
          });
        }
        fishTimer = 8 + Math.random() * 4;
      }
    }
    for (let i = fishes.length - 1; i >= 0; i--) {
      fishes[i].t += dt;
      if (fishes[i].t > 2.2) fishes.splice(i, 1);
    }
    if (skinId === 'newyear' || skinPreview === 'newyear') {
      deerTimer -= dt;
      if (deerTimer <= 0) {
        const inPreview = skinPreview === 'newyear';
        deers.push({ t: 0, ax: inPreview ? 160 : coinX(), ay: inPreview ? 67 : COIN_Y, dx: 0, dy: (Math.random() - 0.5) * 36 });
        deerTimer = 16 + Math.random() * 8;
      }
    }
    for (let i = deers.length - 1; i >= 0; i--) {
      deers[i].t += dt;
      if (deers[i].t > 7) deers.splice(i, 1);
    }
    if (skinId === 'ghost' || skinPreview === 'ghost' || skinId === 'halloween' || skinPreview === 'halloween') {
      ghostTimer -= dt;
      if (ghostTimer <= 0) {
        const halloween = skinId === 'halloween' || skinPreview === 'halloween';
        const inPreview = skinPreview === 'ghost' || skinPreview === 'halloween';   // in the appearance preview the ghosts orbit the picture there
        const ax = inPreview ? 160 : coinX(), ay = inPreview ? 67 : COIN_Y;
        // each ghost has its own mood: its size, its spin direction and how fast it orbits; on Halloween some are orange
        const col = halloween && Math.random() < 0.5 ? '#FFB347' : undefined;
        ghostSprites.push({ t: 0, ax, ay, ang0: Math.random() * Math.PI * 2, dir: Math.random() < 0.5 ? 1 : -1, big: Math.random() < 0.4, spin: 1.6 + Math.random() * 1.2, col });
        ghostTimer = halloween ? 2 + Math.random() * 2 : 5 + Math.random() * 5;
      }
    }
    for (let i = ghostSprites.length - 1; i >= 0; i--) {
      ghostSprites[i].t += dt;
      if (ghostSprites[i].t > 2.6) ghostSprites.splice(i, 1);
    }
    const boostOn = adBoost.double > 0;
    if (bonyaBoostWas && !boostOn) bonyaSpeechGap = BONYA_SPEECH_EVERY;   // the bonus has just ended: the 7-minute count starts again
    bonyaBoostWas = boostOn;
    const menu = speechMenuOpen();
    if (boostOn) {
      bonyaSpeechLeft = 0;                                // the bonus is already running: no offer
      bonyaSpeechPending = false;
    } else {
      // the count always runs; if it ends while a menu is open, the bubble waits until the menu is closed
      if (bonyaSpeechLeft > 0) { if (!menu) bonyaSpeechLeft = Math.max(0, bonyaSpeechLeft - dt); }
      else {
        bonyaSpeechGap -= dt;
        if (bonyaSpeechGap <= 0) { bonyaSpeechGap = BONYA_SPEECH_EVERY; bonyaSpeechPending = true; }
      }
      if (bonyaSpeechPending && !menu && bonyaSpeechLeft <= 0) {
        bonyaSpeechLeft = BONYA_SPEECH_FOR;
        bonyaSpeechPending = false;
      }
    }
    // Z letters appear only while she sleeps and the animated background is on
    if (settings.animBg && (bonyaT % BONYA_CYCLE) >= BONYA_AWAKE_FOR) {
      bonyaZTimer += dt;
      if (bonyaZTimer >= BONYA_Z_EVERY) { bonyaZTimer = 0; bonyaZs.push(0); }
    }
    for (let i = bonyaZs.length - 1; i >= 0; i--) {
      bonyaZs[i] += dt;
      if (bonyaZs[i] >= BONYA_Z_LIFE) bonyaZs.splice(i, 1);
    }
    playSec += dt;
    const today = mskDate();
    if (dailySecDate !== today) { dailySecDate = today; dailySec = 0; }
    dailySec += dt;
    updateEvents(dt);
    updateOffline();
    if (pendingHours > 0) grantHours();
    updateCustomers(dt);
    updateLevel();
    if (lvlWin) lvlWin.t += dt;
    updateSalute(dt);
    updateAchWheel(dt);
    cookT += dt;
    gameT += dt / window.KITCHEN.HOUR_S * TIME_SPEED;
    shakeT = Math.max(0, shakeT - dt);

    const target = panelOpen ? 1 : 0;
    const step = PANEL_SPEED * dt;
    if (panelT < target) panelT = Math.min(target, panelT + step);
    else if (panelT > target) panelT = Math.max(target, panelT - step);

    // generators
    const perSec = autoPerSec();
    bestPerSec = Math.max(bestPerSec, perSec);
    if (perSec > 0) {
      autoAcc += perSec * dt;
      const whole = Math.floor(autoAcc);
      if (whole > 0) {
        earn(BigInt(whole));
        autoAcc -= whole;
      }
    }

    for (const p of popups) { p.t += dt; p.y -= 30 * dt; }
    if (adBoost.double > 0) adBoost.double = Math.max(0, adBoost.double - dt);
    if (adBoost.discount > 0) adBoost.discount = Math.max(0, adBoost.discount - dt);
    for (let i = popups.length - 1; i >= 0; i--) if (popups[i].t > 0.8) popups.splice(i, 1);
    for (const s of sparks) {
      s.t += dt;
      s.vy += 200 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
    }
    // crumbs fall off the bottom of the screen instead of vanishing
    for (let i = sparks.length - 1; i >= 0; i--) if (sparks[i].y > H + 4) sparks.splice(i, 1);
  }

  // colour-blind mode: blue instead of gold/gingerbread for the things colour must show (popups, crumbs, prices, sliders)
  // colour-blind palette (see the approved sheet): accent #4DA3FF, dark #1E5FD1, unavailable #6B6A9E, shadow #0B2A66
  function bodyTone() { return settings.colorblind ? '#4DA3FF' : skinMainColor(skinId); }   // the +N takes the colour of the chosen cookie
  function accent() { return settings.colorblind ? '#4DA3FF' : COL.gold; }
  function dimTone() { return settings.colorblind ? '#6B6A9E' : COL.dim; }
  function shadowTone() { return settings.colorblind ? '#0B2A66' : '#3a1d0a'; }

  // gingerbread-coloured "+N": solid colour with a depth shadow (drawn with the popup's alpha)
  function drawGingerText(str, sc, x, yCap) {
    drawText(str, sc, x + sc, yCap + 2 * sc, shadowTone(), 'center');   // depth shadow
    drawText(str, sc, x, yCap, bodyTone(), 'center');                 // gingerbread body
  }

  // ---------- background: the living bakery (src/kitchen.js; the old picture art/kitchen-bg.png is kept for a revert) ----------
  const cakeImg = new Image();        // the cake on a transparent picture (46x24), without the light of the evening
  cakeImg.src = 'art/cake-day.png?v=1';
  const kitchen = window.KITCHEN.make('phone', { img: cakeImg, x: CAKE_BOX[0], y: CAKE_BOX[1] });
  const woodStrip = kitchen.strip();   // the counter under the scene, drawn once
  // an egg falls only while Bonya can look at it; her sleep is not touched
  kitchen.things.canEgg = () => bonyaAwakeNow() && (bonyaT % BONYA_CYCLE) < BONYA_AWAKE_FOR - BONYA_DROWSY - 9 && bonyaSpeechLeft <= 0;
  kitchen.things.onEgg = () => { if (bonyaAwakeNow()) bonyaPlay('notice'); };
  let gameT = window.KITCHEN.START;   // the game time in hours: it goes only while the game is open, and gives and takes nothing
  // on the local test address the time can be set: ?day=1..40 &hour=0..24 &speed=20
  function timeArg(name) {
    if (!/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return null;
    const m = new RegExp('[?&]' + name + '=([0-9.]+)').exec(location.search);
    return m ? Number(m[1]) : null;
  }
  const TIME_SPEED = timeArg('speed') === null ? 1 : timeArg('speed');
  function setGameTime(day, hour) { gameT = (Math.max(1, day) - 1) * 24 + Math.min(23.99, Math.max(0, hour)); }
  // &weather=wet or &weather=clear: the rain (in winter the snow) always or never
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]weather=(wet|clear)/.test(location.search)) window.KITCHEN.weather(RegExp.$1);
  function applyTimeArgs() {
    const d = timeArg('day'), h = timeArg('hour');
    if (d !== null || h !== null) setGameTime(d === null ? Math.floor(gameT / 24) + 1 : d, h === null ? 12 : h);
  }

  // the cook bakes in src/baker.js; a single tap on him: he waves with the spoon (the tap counts for the cookie as before)
  function tapCook(gx, gy) {
    const x = Math.round(kitchen.baker.place[0]);
    if (settings.animBg && inZone(gx, gy, x - 10, 80, x + 10, 132)) kitchen.baker.poke();
  }

  // Боня: a sable rabbit asleep on the floor to the left of the cake (40x24, the floor at y 152).
  // Frame 1 = asleep (breathing is in the sprite); frame 2 = the same with one ear flicked.
  // Every 10 s the ear flicks for 0.3 s.
  // Bonya sits on the table strip right of the appearance button; her picture is drawn on the screen (BONYA_X - SCENE_CROP_X, BONYA_Y)
  const BONYA_X = 172, BONYA_Y = 155;
  // Cycle of 3 minutes: awake for 60 s (she yawns and stretches first, then does something every few seconds), then asleep for 2 min,
  // in turn curled up and on her side, with little Z letters floating up. The animations are in src/bonya-anim.js.
  const BONYA_AWAKE_FOR = 120, BONYA_SLEEP_FOR = 40, BONYA_CYCLE = BONYA_AWAKE_FOR + BONYA_SLEEP_FOR;
  const BONYA_DROWSY = 1.5;   // seconds of closing eyes before she falls asleep
  const BONYA_Z_EVERY = 2.4, BONYA_Z_LIFE = 2.4;
  const bonyaZs = [];        // ages (seconds) of the floating Z letters
  let bonyaZTimer = 0;
  // Боня's speech bubble: now and then she offers the 2x coins ad; a tap on it starts the boost
  const BONYA_SPEECH_EVERY = 420, BONYA_SPEECH_FOR = 7;  // every 7 minutes; the bubble stays 7 seconds
  let bonyaSpeechGap = BONYA_SPEECH_EVERY, bonyaSpeechLeft = 0, bonyaBoostWas = false, bonyaSpeechPending = false;
  // the windows that cover the screen (settings, progress, appearance, purchase...) pause the bubble clock and hide it;
  // the shop does not, so Боня can still send her message while the shop is open
  function speechMenuOpen() {
    return settingsOpen || !!progWin || skinWin || !!premiumWin || !!lvlWin;
  }
  const BONYA_SHEET_W = 48, BONYA_SHEET_H = 40, BONYA_DX = -4;   // one picture of the sheet; she lies in it 16 px from its top
  const bonyaCanvas = document.createElement('canvas');   // Боня alone, for the dimmed screen
  bonyaCanvas.width = 60; bonyaCanvas.height = 40;
  const bonyaCtx = bonyaCanvas.getContext('2d');
  const bonyaSheet = new Image();
  bonyaSheet.src = 'art/bonya-day.png?v=2';   // without the evening light of the old bonya-sheet.png
  const BONYA_IDLE = ['wash', 'washEar', 'scratch', 'carrot', 'stand', 'hop', 'tail', 'wash', 'tail'];   // what she does while awake
  let bonyaAct = null;             // {name, t}: what she is doing now, null = just sits or sleeps
  let bonyaNext = [];              // what comes right after it
  let bonyaRest = 2;               // seconds of quiet before the next action
  let bonyaLast = '';
  let bonyaWasAwake = true, bonyaCust = null, bonyaBoost = null;
  function bonyaPlay(name, then) { bonyaAct = { name, t: 0 }; bonyaNext = then || []; bonyaLast = name; }
  function bonyaAwakeNow() { return (bonyaT % BONYA_CYCLE) < BONYA_AWAKE_FOR; }
  function bonyaOnSide() { return Math.floor(bonyaT / BONYA_CYCLE) % 2 === 1; }   // every second sleep is on her side
  function updateBonya(dt) {
    const A = window.BONYA_ANIM, awake = bonyaAwakeNow(), phase = bonyaT % BONYA_CYCLE;
    if (bonyaAct) {
      bonyaAct.t += dt;
      const [fps, cells, loops] = A[bonyaAct.name];
      if (bonyaAct.t >= cells.length / fps * loops) {
        bonyaRest = bonyaAct.name === 'earflick' || bonyaAct.name === 'sideEar' ? 10 : 2 + Math.random() * 3;
        bonyaAct = null;
        if (bonyaNext.length) bonyaPlay(bonyaNext[0], bonyaNext.slice(1));
      }
    }
    if (awake !== bonyaWasAwake) {
      bonyaWasAwake = awake;
      bonyaAct = null; bonyaNext = [];
      if (awake) bonyaPlay('yawn', ['stretch']);
    }
    const boost = adBoost.double > 0;
    if (bonyaBoost === false && boost) {          // the 2x bonus has just started: she is glad (and wakes up for it)
      if (!awake) { bonyaT = Math.floor(bonyaT / BONYA_CYCLE) * BONYA_CYCLE + BONYA_AWAKE_FOR - 6; bonyaZs.length = 0; bonyaWasAwake = true; }
      bonyaPlay('binky');
    }
    bonyaBoost = boost;
    if (cust !== bonyaCust) {
      bonyaCust = cust;
      if (cust) {                                  // a customer has come: she wakes up and stays awake while he waits
        if (!awake) { bonyaT = Math.floor(bonyaT / BONYA_CYCLE) * BONYA_CYCLE + BONYA_AWAKE_FOR - 26; bonyaZs.length = 0; bonyaWasAwake = true; }
        bonyaPlay('notice');
      }
    }
    if (awake) {
      if (phase >= BONYA_AWAKE_FOR - BONYA_DROWSY) {
        const lie = bonyaOnSide() ? 'lieSide' : 'lieLoaf';
        if (!bonyaAct || bonyaAct.name !== lie) bonyaPlay(lie);
      } else if (!bonyaAct && bonyaSpeechLeft <= 0) {       // under her speech bubble she sits still
        bonyaRest -= dt;
        if (bonyaRest <= 0 && phase < BONYA_AWAKE_FOR - BONYA_DROWSY - 4) {
          let n;
          do { n = BONYA_IDLE[Math.floor(Math.random() * BONYA_IDLE.length)]; } while (n === bonyaLast);
          bonyaPlay(n);
        }
      }
    } else if (!bonyaAct) {                        // asleep: an ear twitches every 10 s
      bonyaRest -= dt;
      if (bonyaRest <= 0) bonyaPlay(bonyaOnSide() ? 'sideEar' : 'earflick');
    }
  }
  // the cell of the sheet to show now
  function bonyaCell() {
    const A = window.BONYA_ANIM;
    if (!settings.animBg) return A.sleep[1][0];    // a still picture with the animation off
    const name = bonyaAct ? bonyaAct.name : bonyaAwakeNow() ? 'idle' : bonyaOnSide() ? 'side' : 'sleep';
    const [fps, cells] = A[name];
    return cells[Math.floor((bonyaAct ? bonyaAct.t : bonyaT) * fps) % cells.length];
  }
  function drawBonya(c, x, y) {
    if (!bonyaSheet.complete || !bonyaSheet.naturalWidth) return;
    const k = bonyaCell();
    c.drawImage(bonyaSheet, (k % 10) * BONYA_SHEET_W, Math.floor(k / 10) * BONYA_SHEET_H, BONYA_SHEET_W, BONYA_SHEET_H, x + BONYA_DX, y - 16, BONYA_SHEET_W, BONYA_SHEET_H);
  }
  // tap Боня 10 times within 3 s to wake her: she washes for 5 s and then falls asleep again
  const BONYA_WAKE_TAPS = 10, BONYA_WAKE_WINDOW = 3000, BONYA_WAKE_STAY = 5;   // ms, taps, seconds awake
  let bonyaTapTimes = [];
  // 40 taps on Bonya within 10 s: the ad-bonus bubble appears at once
  let bonyaPokeTimes = [];
  function countBonyaPokes(gx, gy) {
    if (!inZone(gx, lastRawY, BONYA_X, BONYA_Y, BONYA_X + 40, BONYA_Y + 24)) return;
    const now = Date.now();
    bonyaPokeTimes = bonyaPokeTimes.filter((t) => now - t < 10000);
    bonyaPokeTimes.push(now);
    if (bonyaPokeTimes.length >= 40) {
      bonyaPokeTimes = [];
      if (adBoost.double <= 0 && !speechMenuOpen()) bonyaSpeechLeft = BONYA_SPEECH_FOR;
    }
  }
  function tapBonya(gx, gy) {
    if (!settings.animBg || !inZone(gx, lastRawY, BONYA_X, BONYA_Y, BONYA_X + 40, BONYA_Y + 24)) return false;
    const now = Date.now();
    bonyaTapTimes = bonyaTapTimes.filter((t) => now - t < BONYA_WAKE_WINDOW);
    bonyaTapTimes.push(now);
    if (bonyaAwakeNow()) { if (!bonyaAct || bonyaAct.name !== 'pet') bonyaPlay('pet'); }   // she likes to be petted
    else if (!bonyaAct) bonyaPlay(bonyaOnSide() ? 'sideEar' : 'earflick');
    if (bonyaTapTimes.length >= BONYA_WAKE_TAPS && (bonyaT % BONYA_CYCLE) >= BONYA_AWAKE_FOR) {
      bonyaWoken += 1;
      bonyaT = BONYA_AWAKE_FOR - BONYA_WAKE_STAY;   // awake for 5 s (washing, then the eyes close) and asleep again
      bonyaZs.length = 0;
      bonyaTapTimes = [];
    }
    return true;
  }
  // the bubble bobs up and down by about a pixel with her breathing, and its tail reaches her head
  function bonyaOffer() { return premiumOwned.noads ? '2Х ДОХОД НА 10 МИНУТ' : '2Х ДОХОД ЗА РЕКЛАМУ'; }
  function bonyaBubbleBox() {
    const l1 = bonyaOffer(), l2 = 'МОЖНО НАЖАТЬ';
    const w = Math.max(textWidth(l1, 1), textWidth(l2, 1)) + 8;
    const bob = Math.round(Math.sin(cookT * 8.8));   // 4 times faster than before
    const x0 = Math.round(160 - w / 2);   // the centre of the screen (the scene is 320 px wide)
    return [x0, 259 + bob, x0 + w, 283 + bob];   // the centre of the empty field under the menu
  }
  // a tap on the bubble starts the 2x coins ad boost (the same as the ad in the БЕСПЛАТНО section)
  function tapBonyaBubble(gx, gy) {
    if (bonyaSpeechLeft <= 0 || adBoost.double > 0 || speechMenuOpen()) return false;
    const [x0, y0, x1, y1] = bonyaBubbleBox();
    if (!inZone(gx, gy, x0, y0, x1, y1)) return false;
    const gi = PREMIUM_ITEMS.findIndex((x) => x.kind === 'ad' && x.id === 'double');
    buy('ad', gi);
    bonyaSpeechLeft = 0;
    return true;
  }
  // the sea skin: a fish swims across every 8-12 seconds, and fades in and out like the reindeer
  let fishTimer = 4;
  const fishes = [];   // {t, ax, ay, dir, dy, col}
  // the new year skin: a reindeer with a sleigh flies past every 10-15 seconds
  let deerTimer = 6;
  const deers = [];   // {t, ax, ay, dx, dy}: age and place of each flight
  // the ghost skin: a faded ghost drifts up past the cookie every 10-20 seconds
  let ghostTimer = 8;
  const ghostSprites = [];   // {t, x, y}: age and place of each ghost
  let bonyaT = BONYA_AWAKE_FOR - BONYA_DROWSY;   // start: she closes her eyes now and falls asleep right away
  let cookT = 0;


  // ---------- render ----------
  function coinFrame() {
    if (animT < 0.06) return FRAME.squash;
    if (animT < 0.18) return FRAME.bounce;
    return FRAME.rest;
  }

  function fillRect(x, y, w, h, col) {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, w, h);
  }

  // closed-state shop button: light silver frame, dark fill, top right
  function drawShopButton() {
    const x = BTN_X0, y = BTN_Y0;
    const w = BTN_X1 - BTN_X0, h = BTN_Y1 - BTN_Y0;
    fillRect(x, y, w, h, COL.btnFrame);                 // 2 px silver border, symmetric
    fillRect(x + 2, y + 2, w - 4, h - 4, COL.btnFill);
    fillRect(x + 2, y + 2, w - 4, 1, COL.btnHi);
    drawTextBox('МАГАЗИН', 1, x, x + w, y, y + h, COL.btnText);
  }

  // text and price for one row of the current tab
  function rowInfo(i, it) {
    if (tab === 'tech') {
      if (listLocked(i)) return { line1: 'ОТКРОЕТСЯ НА УРОВНЕ ' + it.level, line2: '', price: '', can: false, lock: true };
      const p = plan('tech', i), owned = techOwned[i];
      const [line1, cost] = fitPair('+' + rateText(machineIncome(i)) + ' В СЕК', custNum(p.cost), ROW_TEXT_W);   // all the machines of this kind
      return {
        line1,
        line2: 'ЕЩЁ ' + (STAR_EVERY - (owned % STAR_EVERY)) + ' ДО ЗВЕЗДЫ',
        price: cost,
        can: p.can,
        stars: starsOf(owned),
        deal: [p.n, machineGain(i, p.n)],   // how many one tap buys, and what they add per second
        bar: (owned % STAR_EVERY) / STAR_EVERY,
      };
    }
    if (tab === 'prok') {
      const price = finalPrice(it.cost), machine = TECHNIKA[it.tech];
      const have = 'ЕСТЬ ' + it.need + ' ' + fiveOf(machine.name);
      const [line1, cost] = fitPair((machine.short || machine.name) + ' Х2', custNum(price), ROW_TEXT_W);
      return {
        line1,
        line2: textWidth(have, 1) <= ROW_TEXT_W ? have : have.slice(5),   // too long for the row: without ЕСТЬ
        price: cost,
        can: coins >= price,
      };
    }
    // premium and ad rows
    if (it.kind === 'soon') return { line1: it.line, line2: 'ЖДИТЕ ОБНОВЛЕНИЙ', price: '', can: false };
    if (it.hours) {   // gingerbread for N hours of the technika: the exact sum; without the technika there is nothing to sell
      const n = hoursSum(it.hours);
      return { line1: n > 0n ? '+' + fmt(n) : 'НУЖНА ТЕХНИКА', line2: '', price: it.price.replace(/ГОЛОС\S*/, 'ГЛ'), can: false };
    }
    let line2;
    if (it.kind === 'ad') {
      line2 = adBoost[it.id] > 0 ? 'ОСТАЛОСЬ ' + adTimeLeft(it.id) : premiumOwned.noads ? 'БЕЗ РЕКЛАМЫ' : 'ЗА ПРОСМОТР: 10 МИНУТ';
    } else {
      line2 = premiumOwned[it.id] ? 'КУПЛЕНО' : '';   // owned: КУПЛЕНО; not owned: nothing (the price is on the row)
    }
    // a free ad that is running shows the time left on the row (the row draws only this line)
    const left = it.kind === 'ad' && adBoost[it.id] > 0 ? 'ОСТАЛОСЬ ' + adTimeLeft(it.id) : it.line;
    return { line1: left, line2, price: it.kind === 'ad' && premiumOwned.noads ? 'БЕСПЛАТНО' : it.price.replace(/ГОЛОС\S*/, 'ГЛ'), can: it.kind === 'ad' };   // the list shows the short form; the purchase window the full one
  }

  // ---------- the tab КЛИК: what a tap gives, the purchase, the next goal ----------
  const CLICK_BUY = [PX0 + 2, 60, PX1 - 2, 80];
  function drawClickTab() {
    const c = clickTabInfo(), x0 = PX0 + 2, w = PX1 - PX0 - 4, cx = PX0 + (PX1 - PX0) / 2;
    fillRect(x0, 38, w, 21, COL.row);
    drawText('ТВОЙ ТАП ДАЁТ', 1, PX0 + 6, 40, COL.text, 'left');
    drawText('ЗА ОДНО НАЖАТИЕ', 1, PX0 + 6, 50, dimTone(), 'left');
    const big = textWidth(c.now, 2) <= 64 ? 2 : 1;   // a long number goes in the small size
    drawText(c.now, big, PX1 - 6 - textWidth(c.now, big), big === 2 ? 41 : 45, accent(), 'left');
    fillRect(x0, 60, w, 20, c.can ? COL.rowHi : COL.row);
    if (c.can) fillRect(x0, 60, 2, 20, accent());
    drawText(c.buy, 1, PX0 + 6, 61, COL.text, 'left');
    drawText(c.will, 1, PX0 + 6, 71, accent(), 'left');
    drawText(c.price, 1, PX1 - 6 - textWidth(c.price, 1), 71, c.can ? accent() : dimTone(), 'left');
    fillRect(x0, 81, w, 24, COL.row);
    drawText(c.goal, 1, cx, 83, COL.text, 'center');
    drawText(c.goalTap, 1, cx, 92, accent(), 'center');
    fillRect(PX0 + 6, 101, w - 8, 3, COL.track);
    fillRect(PX0 + 6, 101, Math.round((w - 8) * c.bar), 3, accent());
  }
  // two texts on one line: while they do not fit, the digits after the point are dropped (the price first)
  function fitPair(left, right, w) {
    const cut = (t, d) => t.replace(/\.(\d\d)(?=[А-ЯЁ])/, (m, x) => (d > 0 ? '.' + x.slice(0, d) : ''));
    for (const [a, b] of [[2, 2], [2, 1], [1, 1], [1, 0], [0, 0]]) {
      const l = cut(left, a), r = cut(right, b);
      if (textWidth(l, 1) + 5 + textWidth(r, 1) <= w || (a === 0 && b === 0)) return [l, r];
    }
    return [left, right];
  }
  // what n more machines of one kind would add per second (with the stars they bring)
  function machineGain(j, n) {
    const own = techOwned[j], per = TECHNIKA[j].rate * techMult(j) / Math.pow(2, starsOf(own)) * incomeMult() * (glazeTech > 0 ? 2 : 1);
    return per * ((own + n) * Math.pow(2, starsOf(own + n)) - own * Math.pow(2, starsOf(own)));
  }
  // the first line of a machine: its name, its stars, and on the right, over the price, what one tap buys: 10ШТ [+230]
  function drawMachineHead(it, row, x, y, maxX) {
    const sum = rateText(row.deal[1]).replace(/ /g, ''), cut = (d) => row.deal[0] + 'ШТ [+' + sum.replace(/\.(\d\d)(?=[А-ЯЁ])/, (m, k) => (d ? '.' + k.slice(0, d) : '')) + ']';
    const n = row.stars, stars = n > 1 ? smallTextWidth(String(n)) + 10 : n === 1 ? 9 : 0;
    let pick = null;
    for (const nm of [it.name, it.short || it.name]) for (const d of [2, 1, 0]) {
      if (!pick && x + textWidth(nm, 1) + stars + 4 + smallTextWidth(cut(d)) <= maxX) pick = { nm, d };
    }
    if (!pick) pick = { nm: it.short || it.name, d: 0 };
    drawText(pick.nm, 1, x, y, COL.text, 'left');
    drawStars(x + textWidth(pick.nm, 1) + 4, y, n);
    const t = cut(pick.d), w = smallTextWidth(t);
    drawSmallText(t, maxX - w + Math.floor(w / 2), y + 2, row.can ? accent() : dimTone());
  }
  // a 5x5 star
  const STAR_ROWS = ['..#..', '.###.', '#####', '.###.', '.#.#.'];
  function drawStar(x, y, col) {
    ctx.fillStyle = col;
    STAR_ROWS.forEach((row, j) => { for (let i = 0; i < 5; i++) if (row[i] === '#') ctx.fillRect(x + i, y + j, 1, 1); });
  }
  // one star is drawn alone; from two on, the number and one star
  function drawStars(x, y, n) {
    if (!(n > 0)) return;
    if (n > 1) {
      const w = smallTextWidth(String(n));   // a small number, as tall as the star
      drawSmallText(String(n), x + Math.floor(w / 2), y + 1, accent());
      x += w + 1;
    }
    drawStar(x, y + 1, accent());
  }
  // the tab КЛИК: the numbers of its three blocks
  function clickTabInfo() {
    const p = plan('click', 0), left = STAR_EVERY - (tapLv % STAR_EVERY);
    const goalFull = 'И ТАП СТАНЕТ +' + custNum(BigInt(Math.floor(tapValue(tapLv + left))));
    const [will, price] = fitPair('СТАНЕТ +' + custNum(BigInt(Math.floor(tapValue(tapLv + p.n)))), custNum(p.cost), ROW_TEXT_W);
    return {
      now: '+' + custNum(clickGain()),
      buy: 'КУПИТЬ +' + p.n + ' К ТАПУ',
      will,
      price,
      can: p.can,
      goal: 'ЕЩЁ ' + left + plural(left, ' ПОКУПКА', ' ПОКУПКИ', ' ПОКУПОК'),
      goalTap: textWidth(goalFull, 1) <= ROW_TEXT_W ? goalFull : goalFull.slice(2),   // the exact tap with the doubling (its part of the technika income is not doubled)
      bar: (tapLv % STAR_EVERY) / STAR_EVERY,
    };
  }

  function drawPanel() {
    // body slides in from the right
    const bodyW = PX1 - PX0;
    // the sheet is drawn only when it is fully open: while the shop is animating, nothing is drawn over the scene
    if (panelT >= 0.99) {
      // the same frame as the other menus: 1 px on all four sides, from y 4 to y 139
      fillRect(PX0, 4, bodyW, 136, COL.panel);
      fillRect(PX0, 4, bodyW, 1, COL.panelEdge);
      fillRect(PX0, 139, bodyW, 1, COL.panelEdge);
      fillRect(PX0, 4, 1, 136, COL.panelEdge);
      fillRect(PX1 - 1, 4, 1, 136, COL.panelEdge);
    }
    if (panelT < 0.99) {
      // closed header, top right (also the way to open)
      if (panelT < 0.5) drawShopButton();
      return;
    }
    // tabs
    // every element in the shop sits 6 px in from the left and right edges
    TABS.forEach((t, i) => {
      const [x0, y0, x1, y1] = tabRect(i);
      fillRect(x0, y0, x1 - x0, y1 - y0, tab === t.id ? COL.tabOn : COL.tabOff);
      drawTextBox(t.label, 1, x0, x1, y0, y1, COL.text);
      // blinking 4x4 dot in the top-right corner when there is something new in this tab
      if (tabHasNew(t.id) && Math.sin(cookT * 6) > 0) {
        const dx = x1 - 6, dy = y0 + 2;
        fillRect(dx + 1, dy, 2, 4, COL.gold);
        fillRect(dx, dy + 1, 4, 2, COL.gold);
      }
    });

    if (tab === 'premium') {
      PREMIUM_SECTIONS.forEach((sct, i) => {
        const [x0, y0, x1, y1] = sectionRect(i);
        fillRect(x0, y0, x1 - x0, y1 - y0, premiumSection === sct.id ? COL.tabOn : COL.tabOff);
        drawTextBox(sct.label, 1, x0, x1, y0, y1, COL.text);
        // the free section blinks while one of its ads can be watched
        if (sct.id === 'ads' && freeAdReady() && Math.sin(cookT * 6) > 0) blinkDot(x1 - 6, y0 + 2);
      });
    }
    if (tab === 'click') drawClickTab();
    // list (clipped)
    ctx.save();
    ctx.beginPath();
    ctx.rect(PX0, listTop(), PX1 - PX0, listBottom() - listTop());
    ctx.clip();
    const list = items();
    if (tab === 'premium' && premiumSection === 'skins' && list.length === 0) drawTextBox('ТОВАРОВ НЕТ', 1, PX0 + 2, PX1 - 2, listTop() + 14, listTop() + 26, dimTone());
    if (tab === 'prok' && list.length === 0) {
      const all = prokOwned.every(Boolean);
      drawTextBox(all ? 'ВСЕ ПРОКАЧКИ КУПЛЕНЫ' : 'ПРОКАЧЕК ПОКА НЕТ', 1, PX0 + 6, PX1 - 6, listTop() + 14, listTop() + 26, dimTone());
      if (!all) {
        drawTextBox('КУПИ 10 МАШИН', 1, PX0 + 6, PX1 - 6, listTop() + 30, listTop() + 42, dimTone());
        drawTextBox('ОДНОГО ВИДА', 1, PX0 + 6, PX1 - 6, listTop() + 41, listTop() + 53, dimTone());
      }
    }
    list.forEach((it, i) => {
      const y = listTop() + i * rowH() - Math.round(scroll);
      if (y + rowH() < listTop() || y > listBottom()) return;
      const row = rowInfo(i, it);
      fillRect(PX0 + 2, y, PX1 - PX0 - 4, rowH() - 1, row.can ? COL.rowHi : COL.row);
      if (row.can) fillRect(PX0 + 2, y, 2, rowH() - 1, accent());   // affordable: bar on the left, not only colour
      // two lines: the name; what one purchase gives; the price on the right of the second line
      if (row.deal) drawMachineHead(it, row, PX0 + 6, y + 1, PX1 - 6);
      else drawText(it.name, 1, PX0 + 6, y + 1, row.lock ? dimTone() : COL.text, 'left');
      drawText(row.line1, 1, PX0 + 6, y + 10, row.lock ? dimTone() : accent(), 'left');
      if (tab !== 'premium') drawText(row.line2, 1, PX0 + 6, y + 19, dimTone(), 'left');
      if (row.bar !== undefined) { fillRect(PX1 - 34, y + 22, 28, 4, COL.track); fillRect(PX1 - 34, y + 22, Math.round(28 * row.bar), 4, accent()); }
      drawText(row.price, 1, PX1 - 6 - textWidth(row.price, 1), y + 10, row.can ? accent() : dimTone(), 'left');
    });
    ctx.restore();

    // scrollbar
    const max = maxScroll();
    if (max > 0) {
      const trackH = listBottom() - listTop();
      const content = list.length * rowH();
      const thumbH = Math.max(12, Math.round((trackH * trackH) / content));
      // top of the list = thumb at the top; dragging down moves the thumb down
      const thumbY = listTop() + Math.round((trackH - thumbH) * (scroll / max));
      fillRect(PX1 - 4, listTop(), 3, trackH, COL.track);
      fillRect(PX1 - 4, thumbY, 3, thumbH, COL.thumb);
    }

    // close button
    fillRect(PX0 + 2, closeY(), PX1 - PX0 - 4, 14, COL.row);
    drawTextBox('ЗАКРЫТЬ', 1, PX0 + 2, PX1 - 2, closeY(), closeY() + 14, COL.text);

    // buy-amount row, only where a purchase can be repeated
    if (hasBuyRow()) {
      BUY_MODES.forEach((b, i) => {
        const [x0, y0, x1, y1] = buyRect(i);
        const on = buyMode === b.mode;
        fillRect(x0, y0, x1 - x0, y1 - y0, on ? COL.tabOn : COL.tabOff);
        drawTextBox(b.label, 1, x0, x1, y0, y1, COL.text);
      });
    }
  }

  function render() {
    // the shake moves the whole canvas, scaled up a little so no edge shows (inside the canvas, the edge got torn)
    if (shakeT > 0) {
      canvas.style.transform = 'translate(' + Math.round(Math.random() * 4 - 2) + 'px, ' + Math.round(Math.random() * 4 - 2) + 'px) scale(1.04)';
    } else if (canvas.style.transform) {
      canvas.style.transform = '';
    }
    ctx.save();
    kitchen.things.guest = !!cust && cust.out === null;
    kitchen.things.guestX = CUST_X + 5;                                        // where the cook sends the bag
    kitchen.baker.treat(!ev || ev.type !== 'appetite' ? 0 : ev.pies ? -1 : 1);   // he points at the glowing food
    kitchen.things.appetite = !!ev && ev.type === 'appetite' && ev.pies;   // the glowing pies hop
    kitchen.things.busy = minuteLeft > 0 || !!sale;                        // no glare on the cookie now
    kitchen.update(gameT, cookT, settings.animBg, minuteLeft > 0);
    kitchen.drawRoom(ctx);               // the room with the cook (src/baker.js)
    if (cust) drawCustomer();
    kitchen.drawLight(ctx, cookT, settings.animBg);   // the light of the hour: only over the room; the cookie, the numbers and the buttons come after it
  // the speech bubble: 2x coins for the ad, tap it to start the boost
  function drawBonyaBubble() {
    const [x0, y0, x1, y1] = bonyaBubbleBox();
    fillRect(x0, y0, x1 - x0, y1 - y0, COL.panel);
    fillRect(x0, y0, x1 - x0, 1, accent());
    fillRect(x0, y1 - 1, x1 - x0, 1, accent());
    fillRect(x0, y0, 1, y1 - y0, accent());
    fillRect(x1 - 1, y0, 1, y1 - y0, accent());
    const tx = Math.round((x0 + x1) / 2);
    drawText(bonyaOffer(), 1, tx, y0 + 4, accent(), 'center');
    drawText('МОЖНО НАЖАТЬ', 1, tx, y0 + 13, COL.text, 'center');
  }
  // the Z letters: a little pixel Z rising from her head and fading out
    for (const age of bonyaZs) {
      const life = age / BONYA_Z_LIFE;
      const zx = BONYA_X + 29 + Math.floor(life * 4), zy = BONYA_Y + SCENE_UP - 1 - Math.floor(life * 14);   // the scene is drawn SCENE_UP higher on the screen, Bonya is not
      const zRows = ['#####', '...#.', '..#..', '.#...', '#####'];   // a 5x5 pixel Z, 1 px per cell
      ctx.globalAlpha = 1 - life;
      ctx.fillStyle = COL.text;
      zRows.forEach((row, j) => { for (let i = 0; i < 5; i++) if (row[i] === '#') ctx.fillRect(zx + i, zy + j, 1, 1); });
      ctx.globalAlpha = 1;
    }
    if (!FRAME) { ctx.restore(); return; }   // sprite still loading

    const cx = Math.round(coinX());
    // counter: small label above a big number (the label fits the half-width shop layout)
    // fixed rows: label at y 28 (room for the shop button above it), number at y 36

    // shadow + coin
    const frame = coinFrame();
    const newFx = NEW_FX_IDS.includes(skinId);
    if (newFx) { ctx.save(); ctx.shadowColor = skinGlow(skinId, 0.6); ctx.shadowBlur = 8; }
    const neon = skinId === 'neon';
    const tube = skinId === 'neontube';
    if (tube) {
      // the neon tube: its colour slowly moves from cyan to magenta, flickers, and every 4 s it dims for a moment
      const cyc = 0.5 + 0.5 * Math.sin(cookT * 0.8);
      const dim = (cookT % 4.3) < 0.12 ? 0.25 : 1;
      const flick = (0.8 + 0.2 * Math.sin(cookT * 23)) * dim;
      const r = Math.round(255 * cyc), gr = Math.round(255 * (1 - cyc) + 60 * cyc), b = Math.round(230 * (1 - cyc) + 220 * cyc);
      ctx.save();
      ctx.shadowColor = 'rgba(' + r + ', ' + gr + ', ' + b + ', ' + (0.7 * flick).toFixed(2) + ')';
      ctx.shadowBlur = 8 + 4 * cyc;
    }
    const hot = skinId === 'volcano';
    if (neon) {
      // the neon glow pulses; a few sparks circle the cookie
      const pulse = 0.5 + 0.5 * Math.sin(cookT * 3);
      ctx.save();
      ctx.shadowColor = (skinId === 'neontube' ? 'rgba(0, 255, 230, ' : 'rgba(255, 60, 220, ') + (0.45 + 0.4 * pulse).toFixed(2) + ')';
      ctx.shadowBlur = 4 + 6 * pulse;
    }
    if (hot) {
      // the lava glow flickers; sparks rise from the cookie
      const flick = 0.5 + 0.5 * Math.sin(cookT * 11) * Math.sin(cookT * 5);
      ctx.save();
      ctx.shadowColor = 'rgba(255, 130, 20, ' + (0.65 + 0.35 * flick).toFixed(2) + ')';
      ctx.shadowBlur = 6 + 12 * flick;
    }
    const gSway = skinId === 'ghost' ? Math.round(Math.sin(cookT * 1.8) * 2) : 0;   // the ghost cookie sways 2 px to each side
    ctx.drawImage(frame, Math.round(cx - frame.width / 2 - frame.shiftX) + gSway, Math.round(COIN_Y - frame.height / 2 - frame.shiftY));
    if (newFx) {
      ctx.restore();
      fxMask = frame.alpha ? { data: frame.alpha, w: frame.width, h: frame.height, ox: Math.round(cx - frame.width / 2 - frame.shiftX), oy: Math.round(COIN_Y - frame.height / 2 - frame.shiftY) } : null;
      drawNewFx(skinId, cx, COIN_Y, 46, 40, (dx) => ctx.drawImage(frame, Math.round(cx - frame.width / 2 - frame.shiftX) + gSway + dx, Math.round(COIN_Y - frame.height / 2 - frame.shiftY)));
      fxMask = null;
    } else { ctx.save(); ctx.shadowBlur = 0; drawSkinPlus(skinId, cx, COIN_Y, 46, 40); ctx.restore(); }
    if (tube) {
      ctx.restore();
      // electric arcs jump along the tube: a short white zigzag, about every 2.2 s, for 0.15 s
      const arcT = cookT % 2.2;
      if (arcT < 0.15) {
        const a0 = Math.floor(cookT / 2.2) * 2.39;
        for (let k = 0; k < 9; k++) {
          const a = a0 + k * 0.14;
          const rr = 34 + (k % 2 ? 2.5 : -1.5);
          fillRect(Math.round(cx + Math.cos(a) * rr), Math.round(COIN_Y + Math.sin(a) * rr), 2, 2, k % 3 ? '#FFFFFF' : '#7DF9FF');
        }
      }
    }
    if (hot) {
      ctx.restore();
      // embers: 7 sparks rising from the cookie, orange and yellow, fading out at the top
      for (let i = 0; i < 7; i++) {
        const life = ((cookT * 0.8 + i * 0.143) % 1);
        const ex = Math.round(cx - 42 + i * 14 + Math.sin(cookT * 5 + i * 2) * 3);
        const ey = Math.round(COIN_Y + 40 - life * 84);
        fillRect(ex, ey, i % 3 === 0 ? 2 : 1, i % 3 === 0 ? 2 : 1, i % 2 ? '#FFD35A' : '#FF6A1A');
      }
      // smoke: grey puffs rising from the top of the cookie, drifting and fading
      for (let i = 0; i < 4; i++) {
        const life = ((cookT * 0.35 + i * 0.25) % 1);
        const sx = Math.round(cx - 20 + i * 12 + Math.sin(cookT * 2 + i) * 4 + life * 6);
        const sy = Math.round(COIN_Y - 46 - life * 26);
        ctx.globalAlpha = 0.5 * (1 - life);
        fillRect(sx, sy, 3 + (i % 2), 2, '#6B5E66');
        ctx.globalAlpha = 1;
      }
      // little flame tongues flicker on the lower edge
      for (let i = 0; i < 5; i++) {
        const fl = Math.sin(cookT * 9 + i * 2.3);
        if (fl > -0.2) {
          const fx = Math.round(cx - 36 + i * 17), fy = Math.round(COIN_Y + 34 - (fl > 0.5 ? 2 : 1));
          fillRect(fx, fy, 2, 2, fl > 0.5 ? '#FFD35A' : '#FF6A1A');
        }
      }
    }
    if (neon) {
      ctx.restore();
      for (let i = 0; i < 6; i++) {
        const a = cookT * 1.4 + (i * 2 * Math.PI) / 6;
        const sx = Math.round(cx + Math.cos(a) * 46), sy = Math.round(COIN_Y + Math.sin(a) * 40);
        fillRect(sx, sy, 2, 2, ['#FF5FDC', '#7DF9FF', '#FFFFFF'][i % 3]);
      }
      // twinkling stars around the glow
      for (let i = 0; i < 4; i++) {
        const tw = Math.sin(cookT * 4 + i * 1.7);
        if (tw > 0.3) {
          const tx = Math.round(cx + [-58, 56, -50, 50][i]), ty = Math.round(COIN_Y + [-44, -36, 40, 44][i]);
          fillRect(tx, ty, 1, 1, '#FFFFFF');
          fillRect(tx - 1, ty, 3, 1, '#FFFFFF');
          fillRect(tx, ty - 1, 1, 3, '#FFFFFF');
        }
      }
    }

    if (settings.animBg && frame === FRAME.rest) kitchen.things.drawGlare(ctx, frame, Math.round(cx - frame.width / 2 - frame.shiftX) + gSway, Math.round(COIN_Y - frame.height / 2 - frame.shiftY));
    if (skinId === 'newyear') drawSnowFull();
    if (skinId === 'sea') drawFishes();
    if (skinId === 'ghost' || skinId === 'halloween') drawGhosts();
    if (skinId === 'newyear') drawDeers();
    // Боня's speech bubble is drawn over the cookie, so it stays readable
    // sparks
    for (const s of sparks) fillRect(Math.round(s.x), Math.round(s.y), 2, 2, bodyTone());   // gingerbread crumbs, like the +N

    // popups
    for (const p of popups) {
      ctx.globalAlpha = 0.6 * Math.max(0, 1 - p.t / 0.8);   // 60% opacity, fading out
      drawGingerText(p.text, 2, Math.round(p.x), Math.round(p.y));
      ctx.globalAlpha = 1;
    }

    // the hint: yellow like the bonus lines; shown before the first tap and after a minute without taps
    // the hint sits on the floor right under the cookie
    if ((!everTapped || animT > 60) && !(ev && ev.type === 'appetite')) drawTextO('КЛИКАЙ', 1, cx, 149, accent());   // not on top of the appetite text   // above the shop sheet, so it stays visible
    // the appearance button at the bottom, where the hint used to be (only while the shop is closed)

    // the bonus multiplier (2Х, 3Х...) right above the bonus counter, centred on it: in the scene, so it is dimmed with it
    const multTxt = multiplierBonus() > 1 ? 'Х' + multiplierBonus() : '';
    if (multTxt) drawText(multTxt, 1, Math.round(MENU_BTN_X + MENU_BTN_W / 2 - textWidth(multTxt, 1) / 2), 149 + SCENE_UP, accent(), 'left');
    // top-row buttons first, so the open shop panel covers them where they overlap
    // the counter is drawn after all the effects, so no feather or sparkle covers the numbers
    drawCounter(cx);
    drawSettingsButton();
    drawTopButton('ПРОГРЕСС', ...topRect('achievements'));
    if (dailyCanClaim() && Math.sin(cookT * 6) > 0) {
      const [ax0, ax1, ay0] = topRect('achievements');   // topRect gives [x0, x1, y0, y1]
      blinkDot(ax1 - 6, ay0 + 2);
    }
    drawLevelButton();
    if (cust && cust.out === null && !cust.sold) drawCustomerBubble();
    if (panelT >= 0.99) inSheet(drawPanel); else drawPanel();
    // Боня's bubble is drawn over the shop, so she can still send her message while it is open
    if (bonyaSpeechLeft > 0 && adBoost.double <= 0 && !speechMenuOpen()) drawBonyaBubble();
    if (settingsOpen) inSheet(drawSettings);
    if (supportOpen) inSheet(drawSupport);
    else if (docsListOpen) inSheet(drawDocsList);
    else if (docsOpen >= 0) inSheet(drawDocReader);
    if (progWin) inSheet(drawProgWin);
    if (skinWin) inSheet(drawSkinWin);
    if (premiumWin) inSheet(drawPremiumWin);
    if (skinOffer) inSheet(drawSkinOffer);
    if (ev && ev.type === 'appetite') drawAppetite();
    if (loadingLeft > 0) drawLoading();
    if (consentOpen) { inSheet(drawConsent); if (docsOpen >= 0) inSheet(drawDocReader); }   // the first-launch window is the top layer
    if (resetWin) inSheet(drawResetWin);
    if (boostMenuOpen) inSheet(drawBoostMenu);   // the same place as the other menus: the sheet under the scene
    if (!anyMenuOpenNow() && !consentOpen && document.fullscreenEnabled && !document.fullscreenElement) {   // only where the browser allows fullscreen, and only while the screen is not full yet
      drawFullScreenIconAt(FS_BL_X, FS_BL_Y, FS_BL_S);
      // the label next to the icon; it is hidden when the screen is already full
      if (!document.fullscreenElement) {
        // a pixel arrow pointing at the icon (it sways 2 px), and the label pulses so that it is noticed
        const pulse = (Math.sin(performance.now() / 250) + 1) / 2;   // 0..1
        const ax = FS_BL_X + FS_BL_S + 3 + Math.round(pulse * 2);
        const ARROW = ['..#..', '.#...', '#####', '.#...', '..#..'];   // the tip points left, at the icon
        ARROW.forEach((row, j) => { for (let i = 0; i < 5; i++) if (row[i] === '#') fillRect(ax + i, FS_BL_Y + 7 + j, 1, 1, COL.text); });
        ctx.globalAlpha = 0.55 + 0.45 * pulse;
        drawText('НА ПОЛНЫЙ ЭКРАН', 1, ax + 7, FS_BL_Y + 9 - 4, COL.text, 'left');
        ctx.globalAlpha = 1;   // the pulse must not fade what is drawn after the label
      }
    }
    if (lvlWin) drawLevelWin();
    if (offlineWin) drawOffline();
    if (noticeWin) drawNotice();   // over the game scene, not in the menu under it
    ctx.restore();
  }

  // ---------- music: streamed playlist through Web Audio, starts on the first tap ----------
  // one shared audio context, created on the first tap (browsers need a user gesture)
  let audioCtx = null;
  let musicGain = null;
  let sfxGain = null;
  let musicStarted = false;
  function ensureAudio() {
    if (audioCtx) return audioCtx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
      musicGain = audioCtx.createGain();
      musicGain.gain.value = settings.music;
      musicGain.connect(audioCtx.destination);
      sfxGain = audioCtx.createGain();
      sfxGain.gain.value = settings.sound;
      sfxGain.connect(audioCtx.destination);
    } catch (err) {
      audioCtx = null;   // no audio support: the game still works, silently
    }
    return audioCtx;
  }
  // playlist: 3 tracks of 5 minutes, always in the order 1 -> 2 -> 3 -> 1, with an equal-power crossfade.
  // The files are streamed by two <audio> decks (a decoded 5-minute buffer would take 100 MB), through musicGain.
  const TRACKS = ['music/pixel_winter_track1', 'music/pixel_winter_track2', 'music/pixel_winter_track3'];
  const TRACK_LEN = 300;        // seconds in every track (el.duration is only an estimate on servers without Range)
  const TRACK_FADE = 2;         // seconds of crossfade
  const TRACK_PRELOAD = 30;     // the next track starts loading this many seconds before the end
  const FADE_IN = new Float32Array(64);
  const FADE_OUT = new Float32Array(64);
  for (let i = 0; i < 64; i++) {
    const t = i / 63;
    FADE_IN[i] = Math.sin(t * Math.PI / 2);    // equal power: no dip in loudness in the middle
    FADE_OUT[i] = Math.cos(t * Math.PI / 2);
  }
  // a few silent samples: the second deck plays them inside the first tap, so iPhones let it start later by itself
  const SILENCE = 'data:audio/wav;base64,UklGRiwAAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YQgAAACAgICAgICAgA==';
  let trackExt = '.ogg';        // '.m4a' where the browser has no OGG Vorbis (older iPhones)
  let decks = null;             // two { el, g, track }
  let deckIdx = 0;              // the deck that is heard now
  let trackIdx = 0;             // the track that is heard now
  let nextReady = false;        // the other deck already loads the next track
  let fading = false;           // the next track is being started
  let musicPaused = false;      // the page is hidden
  function makeDeck(n) {
    const el = document.createElement('audio');
    const g = audioCtx.createGain();
    g.gain.value = 0;
    audioCtx.createMediaElementSource(el).connect(g);
    g.connect(musicGain);
    const d = { el, g, track: -1, timer: 0 };
    el.addEventListener('timeupdate', () => {
      if (n !== deckIdx || d.track < 0) return;
      const left = TRACK_LEN - el.currentTime;
      if (left <= TRACK_PRELOAD) prepareNext();
      if (left <= TRACK_FADE + 0.25) nextTrack();   // timeupdate comes about 4 times a second
    });
    el.addEventListener('ended', () => { if (n === deckIdx && d.track >= 0) nextTrack(); });
    el.addEventListener('error', () => {
      if (d.track < 0) return;
      if (trackExt === '.ogg' && el.error && el.error.code !== 2) {   // not a network fault: the other format
        trackExt = '.m4a';
        loadDeck(d, d.track);
        if (n === deckIdx) playDeck(d);
      } else if (n === deckIdx) musicStarted = false;                 // the next tap tries again
      else nextReady = false;
    });
    return d;
  }
  function loadDeck(d, i) {
    clearTimeout(d.timer);
    d.track = i;
    d.el.preload = 'auto';
    d.el.src = TRACKS[i] + trackExt;
  }
  // the first start, or a start after a refusal
  function playDeck(d) {
    const src = d.el.src;
    d.el.play().then(() => {
      fadeDeck(d, FADE_IN, 1);
      if (musicPaused) d.el.pause();
    }).catch(() => { if (src === d.el.src) musicStarted = false; });   // not allowed yet: the next tap tries again
  }
  function prepareNext() {
    if (nextReady) return;
    nextReady = true;
    loadDeck(decks[1 - deckIdx], (trackIdx + 1) % TRACKS.length);
  }
  function fadeDeck(d, curve, sec) {
    const p = d.g.gain, now = audioCtx.currentTime;
    p.cancelScheduledValues(0);
    p.setValueCurveAtTime(curve, now, sec);
  }
  function nextTrack() {
    if (fading || musicPaused) return;
    fading = true;
    prepareNext();
    const old = decks[deckIdx], d = decks[1 - deckIdx];
    d.el.play().then(() => {
      deckIdx = 1 - deckIdx;
      trackIdx = d.track;
      nextReady = false;
      fading = false;
      fadeDeck(d, FADE_IN, TRACK_FADE);
      fadeDeck(old, FADE_OUT, TRACK_FADE);
      old.timer = setTimeout(() => old.el.pause(), TRACK_FADE * 1000 + 300);
      if (musicPaused) d.el.pause();
    }).catch(() => {
      fading = false;
      if (old.el.ended) musicStarted = false;       // silence now: the next tap starts the music again
    });
  }
  // a hidden page: the decks stop together with the audio context
  function pauseMusic() {
    if (!audioCtx) return;
    musicPaused = true;
    audioCtx.suspend();
    if (decks) decks[deckIdx].el.pause();
  }
  function resumeMusic() {
    if (!audioCtx || document.hidden) return;
    musicPaused = false;
    audioCtx.resume();
    if (musicStarted && decks) {
      const d = decks[deckIdx];
      if (d.el.ended) nextTrack(); else d.el.play().catch(() => { musicStarted = false; });
    }
  }
  function startMusicOnce() {
    if (musicStarted) return;
    const ctx = ensureAudio();
    if (!ctx) return;
    musicStarted = true;
    if (ctx.state === 'suspended') ctx.resume();
    if (!decks) {
      if (!document.createElement('audio').canPlayType('audio/ogg; codecs="vorbis"')) trackExt = '.m4a';
      decks = [makeDeck(0), makeDeck(1)];
    }
    const d = decks[deckIdx], other = decks[1 - deckIdx];
    if (other.track < 0) {
      other.el.src = SILENCE;
      other.el.play().catch(() => {});
    }
    if (d.track < 0 || d.el.error) loadDeck(d, trackIdx);
    playDeck(d);
  }
  // iPhones count the release of the finger as the tap: a start refused on the press is repeated there
  canvas.addEventListener('pointerup', () => { if (decks && !musicStarted) startMusicOnce(); });

  // short square-wave blip through the sound slider
  function blip(freq, dur, when, type) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const t = ctx.currentTime + (when || 0);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'square';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.2, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(sfxGain);
    o.start(t);
    o.stop(t + dur + 0.02);
  }
  function sfxClick() { pendingTapSound = false; blip(880, 0.06); }
  // a button: two soft low notes of a triangle wave, so it is not the cookie's click
  function sfxButton() { pendingTapSound = false; blip(520, 0.05, 0, 'triangle'); blip(740, 0.05, 0.035, 'triangle'); }
  function sfxBuy() { pendingTapSound = false; blip(660, 0.09); blip(990, 0.12, 0.08); }
  // a new level: a pixel fanfare: square-wave brass notes rising, an accent, a long top note, and bell sparkle; no low bass
  function sfxLevel() {
    pendingTapSound = false;
    const ctx = ensureAudio();
    if (!ctx || !sfxGain) return;
    const t = ctx.currentTime + 0.02;
    const pixel = (f, s, dur, peak) => {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(peak, s + 0.005);
      g.gain.setValueAtTime(peak, s + dur * 0.8);
      g.gain.exponentialRampToValueAtTime(0.0001, s + dur + 0.05);
      g.connect(sfxGain);
      [[f, 1], [f * 1.5, 0.45]].forEach(([fr, a]) => {
        const o = ctx.createOscillator();
        const og = ctx.createGain();
        o.type = 'square';
        o.frequency.value = fr;
        og.gain.value = a;
        o.connect(og);
        og.connect(g);
        o.start(s);
        o.stop(s + dur + 0.1);
      });
    };
    // the motif: G4, C5, G5 with an accent, then the long C6
    pixel(392, t, 0.28, 0.12);
    pixel(523, t + 0.3, 0.28, 0.14);
    pixel(784, t + 0.6, 0.28, 0.2);
    pixel(1047, t + 0.9, 1.1, 0.22);
    // bell sparkle on top: short square ticks of the high notes
    [[2093, t + 0.9, 0.06, 0.5], [2637, t + 1.2, 0.04, 0.4]].forEach(([f, s, p, d]) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'square';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(p, s + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, s + d);
      o.connect(g);
      g.connect(sfxGain);
      o.start(s);
      o.stop(s + d + 0.05);
    });
  }

  // ---------- VK storage: the save is kept on VK too, so the same progress shows on every platform ----------
  // VK keeps values of up to 4096 characters, so the save goes in chunks; a save is sent at most once every 15 seconds
  // two separate copies: the progress (v6_...) and the premium (prem_...), so the progress never takes the purchases with it
  const VK_CHUNK = 3900;
  let vkSaveTimer = null;
  function cloudPut(prefix, raw) {
    const parts = [];
    for (let i = 0; i < raw.length; i += VK_CHUNK) parts.push(raw.slice(i, i + VK_CHUNK));
    vkBridge.send('VKWebAppStorageSet', { key: prefix + 'n', value: String(parts.length) }).catch(() => {});
    parts.forEach((p, i) => vkBridge.send('VKWebAppStorageSet', { key: prefix + i, value: p }).catch(() => {}));
  }
  // resolves with the stored text ('' when there is none)
  function cloudGet(prefix) {
    return vkBridge.send('VKWebAppStorageGet', { keys: [prefix + 'n'] }).then((res) => {
      const n = parseInt(res.keys[0].value, 10);
      if (!(n > 0)) return '';
      const keys = [];
      for (let i = 0; i < n; i++) keys.push(prefix + i);
      return vkBridge.send('VKWebAppStorageGet', { keys: keys }).then((res2) => res2.keys.map((k) => k.value).join(''));
    });
  }
  // a save is sent once per 15 seconds while playing (the timer is not restarted by every local save, so it does get sent)
  function vkSaveSoon() {
    if (!window.vkBridge || vkSaveTimer) return;
    vkSaveTimer = setTimeout(() => { vkSaveTimer = null; vkSaveNow(); }, 15000);
  }
  function vkSaveNow() {
    // the premium: both copies are joined, nothing is ever lost
    cloudGet('prem_').then((cloud) => {
      mergePremium(cloud);
      const raw = premiumRaw();
      if (raw !== cloud) cloudPut('prem_', raw);
    }).catch(() => {});
    let raw = null;
    try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { return; }
    if (!raw) return;
    // never overwrite a save with more progress: read the cloud copy first, write only if this device is not behind
    cloudGet('v6_').then((cloud) => {
      if (cloud && saveAhead(cloud, raw)) return;   // the cloud is ahead: keep it, the next start takes it
      cloudPut('v6_', raw);
    }).catch(() => {});
  }
  // which of two saves is ahead: the one reset later wins (a reset must not be undone by an older copy with more coins);
  // with the same reset, the one with more coins earned in all time. Returns true if `a` is ahead of `b`.
  function saveAhead(a, b) {
    const rank = (raw) => {
      try { const s = JSON.parse(raw || '{}'); return [Number(s.resetAt) || 0, BigInt(s.totalEarned || '0')]; } catch (e) { return [-1, -1n]; }
    };
    const [ra, ea] = rank(a), [rb, eb] = rank(b);
    return ra !== rb ? ra > rb : ea > eb;
  }
  // at the start: the premium of the VK copy is added; if its progress is newer than this device's save, it is taken too
  function vkLoadCloud() {
    cloudGet('prem_').then((cloud) => { mergePremium(cloud); savePremium(); }).catch(() => {}).then(() => cloudGet('v6_')).then((cloud) => {
      // the later reset wins, then more earned progress: savedAt is refreshed by every local save, so it cannot tell which is newer
      // the cloud save is applied in place (no page reload: a reload showed the start screen again)
      if (cloud && saveAhead(cloud, localStorage.getItem(SAVE_KEY))) {
        localStorage.setItem(SAVE_KEY, cloud);
        loadGame();
      }
    }).catch(() => {});
  }
  // ---------- saving: progress and settings in localStorage (fails quietly if unavailable) ----------
  const SAVE_KEY = 'kucha-pryanikov-v6';           // a new key: the saves of the older economies are not read
  const PREMIUM_KEY = 'kucha-pryanikov-premium';   // the purchases and the skins, apart from the progress
  function premiumRaw() {
    return JSON.stringify({ premiumOwned, skinOwned, skinAdViews, grantedOrders, pendingHours, hoursAt });
  }
  // adds what another copy of the premium has (owned things are only added, never taken away)
  function mergePremium(raw) {
    if (!raw) return;
    try {
      const s = JSON.parse(raw);
      for (const it of PREMIUM_ITEMS) if (it.kind === 'premium' && !it.hours && s.premiumOwned && s.premiumOwned[it.id]) premiumOwned[it.id] = true;
      if (premiumOwned.skins_all) unlockAllPremiumSkins();
      for (const id of PREMIUM_SKIN_IDS) if (premiumOwned['skin_' + id]) skinOwned[id] = true;
      for (const k of SKINS) {
        if (s.skinOwned && s.skinOwned[k.id]) skinOwned[k.id] = true;
        skinAdViews[k.id] = Math.max(skinAdViews[k.id] || 0, Math.floor(Number(s.skinAdViews && s.skinAdViews[k.id]) || 0));
      }
      if (Array.isArray(s.grantedOrders)) for (const o of s.grantedOrders) if (!grantedOrders.includes(String(o))) grantedOrders.push(String(o));
      if ((Number(s.hoursAt) || 0) > hoursAt) { hoursAt = Number(s.hoursAt); pendingHours = Math.max(0, Number(s.pendingHours) || 0); }
    } catch (err) { /* damaged data: what is already here stays */ }
  }
  function savePremium() {
    try { localStorage.setItem(PREMIUM_KEY, premiumRaw()); } catch (err) { /* storage blocked or full */ }
  }
  function saveGame() {
    savePremium();
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        v: 6,
        coins: coins.toString(),
        tapLv,
        techOwned,
        prokOwned,
        levelSeen: lvlPending ? lvlPending.from : bakeryLevel,   // a new level whose window is not shown yet is shown after the next start
        adBoost: { double: adBoost.double, discount: adBoost.discount },   // the ad bonuses keep their time left
        totalEarned: totalEarned.toString(),
        resetAt,
        playerClicks,
        playSec: Math.floor(playSec),
        custServed, questsDone, treatsEaten, minutesSeen, bonyaWoken, offlineTaken,
        bestPerSec,
        dailyDay,
        dailyDate,
        dailySec: Math.floor(dailySec),
        dailySecDate,
        totalBought,
        settings,
        custGap: Math.floor(custGap),
        gameT: Math.round(gameT * 1000) / 1000,
        savedAt: Date.now(),
      }));
      vkSaveSoon();
    } catch (err) {
      // storage blocked or full: keep playing without saving
    }
  }
  function loadGame() {
    try { mergePremium(localStorage.getItem(PREMIUM_KEY)); } catch (err) { /* storage blocked */ }
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      const count = (v) => Math.max(0, Math.floor(Number(v) || 0));
      coins = BigInt(s.coins || '0');
      tapLv = count(s.tapLv);
      if (Array.isArray(s.techOwned) && s.techOwned.length === techOwned.length) techOwned = s.techOwned.map(count);
      if (Array.isArray(s.prokOwned) && s.prokOwned.length === prokOwned.length) prokOwned = s.prokOwned.map(Boolean);
      if (s.adBoost) adBoost = { double: Math.max(0, Number(s.adBoost.double) || 0), discount: Math.max(0, Number(s.adBoost.discount) || 0) };
      totalEarned = BigInt(s.totalEarned || '0');
      bakeryLevel = levelFor(totalEarned);
      const seen = count(s.levelSeen) || bakeryLevel;
      lvlPending = seen < bakeryLevel ? { from: seen } : null;
      lvlWin = null;
      resetAt = Number(s.resetAt) || 0;
      playerClicks = count(s.playerClicks);
      playSec = Math.max(0, Number(s.playSec) || 0);
      custServed = count(s.custServed); questsDone = count(s.questsDone); treatsEaten = count(s.treatsEaten);
      minutesSeen = count(s.minutesSeen); bonyaWoken = count(s.bonyaWoken); offlineTaken = count(s.offlineTaken);
      bestPerSec = Math.max(0, Number(s.bestPerSec) || 0);
      dailyDay = Math.min(7, count(s.dailyDay));
      dailyDate = typeof s.dailyDate === 'string' ? s.dailyDate : '';
      dailySec = Math.max(0, Number(s.dailySec) || 0);
      dailySecDate = typeof s.dailySecDate === 'string' ? s.dailySecDate : '';
      totalBought = count(s.totalBought);
      offlineFrom = Number(s.savedAt) || 0; offlineUntil = Date.now();   // paid for once, after the start screen
      offlineWin = null;
      if (Number.isFinite(s.gameT) && s.gameT >= 0) gameT = s.gameT;
      if (Number.isFinite(s.custGap)) custGap = Math.max(0, Math.min(CUST_EVERY, s.custGap));
      if (s.settings) {
        settings.sound = Math.min(1, Math.max(0, Number(s.settings.sound) || 0));
        settings.music = Math.min(1, Math.max(0, Number(s.settings.music) || 0));
        settings.colorblind = false;   // the colour-blind mode is removed from the settings
        settings.animBg = s.settings.animBg !== false;
        settings.shake = s.settings.shake === true;
        // the chosen skin is remembered, as long as it is still owned
        if (s.settings.skin && skinOwned[s.settings.skin] && SKINS.some((k) => k.id === s.settings.skin)) { settings.skin = s.settings.skin; loadSkin(settings.skin); }
      }
    } catch (err) {
      // no save or damaged data: start fresh
    }
  }
  loadGame();
  applyTimeArgs();
  // the VK bridge script loads after this script has started: the VK part waits for it (checked every 0.1 s, up to 20 s)
  function onVkBridge(fn, tries = 0) {
    if (window.vkBridge) fn();
    else if (tries < 200) setTimeout(() => onVkBridge(fn, tries + 1), 100);
  }
  onVkBridge(() => {
    vkLoadCloud();   // the save from the other device, if it has more progress
    // the sound stops when the app is hidden (VKWebAppViewHide) and comes back when it is shown again
    if (vkBridge.subscribe) {
      vkBridge.subscribe((e) => {
        const type = e && e.detail && e.detail.type;
        if (type === 'VKWebAppViewHide') goHidden();
        if (type === 'VKWebAppViewRestore') goShown();
        if (type === 'VKWebAppViewHide') pauseMusic();
        // the game is hidden or closed: the progress goes to VK at once
        if (type === 'VKWebAppViewHide') { saveGame(); vkSaveNow(); }
        if (type === 'VKWebAppViewRestore') resumeMusic();
        // back in the app: the save from the other device is taken if it has more progress
        if (type === 'VKWebAppViewRestore') vkLoadCloud();
      });
    }
  });
  setInterval(saveGame, 5000);
  window.addEventListener('pagehide', () => { saveGame(); if (window.vkBridge) vkSaveNow(); });
  // the sound stops when the page is hidden (a browser tab, or the app in the background) and comes back when it is shown
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) goHidden(); else goShown();
    if (document.hidden) pauseMusic(); else resumeMusic();
  });

  // ---------- loop ----------
  // the start screen: 1.5 s after each load, with the logo, the game's name and the developer
  // the launch check (п. 1.2.2 Правил): inside VK the game starts only when the server confirms VK's launch signature
  const LAUNCH_CHECK_URL = 'https://functions.yandexcloud.net/d4e8ajlqi4mjo1lgs395';   // Яндекс Облако: проверка запуска без VPN
  // on the local test address (localhost) the check is off: the test launch parameters are not signed
  const LOCAL_TEST = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  let launchState = /[?&]vk_/.test(location.search) && !LOCAL_TEST ? 'checking' : 'ok';   // outside VK there is nothing to check
  let launchCode = '';   // the last answer for the check: the HTTP status, or why the request failed (shown on the gate)
  // XMLHttpRequest with its own timeout: it works in the old browsers inside VK, where fetch can hang without an answer
  function checkLaunch(attempt) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', LAUNCH_CHECK_URL + location.search, true);
    xhr.timeout = 8000;
    // a failed try is repeated (up to 4 tries); the last code stays on the gate
    const retry = (code) => {
      launchCode = code;
      if (attempt < 3) setTimeout(() => checkLaunch(attempt + 1), 3000);
      else { launchState = 'denied'; updateLaunchGate(); }
    };
    xhr.onload = () => {
      launchCode = String(xhr.status);
      let ok = false;
      if (xhr.status === 200) { try { ok = JSON.parse(xhr.responseText).ok === true; } catch (e) { ok = false; } }
      launchState = ok ? 'ok' : 'denied';
      updateLaunchGate();   // the gate is updated here, not only in the frame loop
      if (ok) syncPurchases();
    };
    // the code shows where the request stopped: readyState 1 = not sent or opened, 2 = sent, 3 = loading, 4 = done; status 0 = no answer
    xhr.onerror = () => retry('ОШИБКА ' + xhr.readyState + '/' + xhr.status);
    xhr.ontimeout = () => retry('ТАЙМАУТ ' + xhr.readyState + '/' + xhr.status);
    xhr.send();
  }
  if (launchState === 'checking') {
    checkLaunch(1);
    // the last guard: whatever happens, the gate does not stay on "проверка" for more than 20 seconds
    setTimeout(() => { if (launchState === 'checking') { launchState = 'denied'; if (!launchCode) launchCode = 'ТАЙМАУТ'; updateLaunchGate(); } }, 20000);
  }
  // the launch check covers the whole phone screen: a page element over everything, not a part of the canvas
  function updateLaunchGate() {
    const g = document.getElementById('launch-gate');
    if (!g) return;
    // written only when the value changes: rewriting the text every frame made it flicker on the phone
    const shown = launchState === 'ok' ? 'none' : 'flex';
    if (g.style.display !== shown) g.style.display = shown;
    const t = document.getElementById('launch-text');
    const text = launchState === 'denied' ? 'ЗАПУСК НЕ ПРОВЕРЕН, КОД: ' + launchCode : 'ПРОВЕРКА ЗАПУСКА...';
    if (t && t.textContent !== text) t.textContent = text;
  }
  let splashT = 2.5;
  // the New Year start screen (splash.js): one of its three scenes, made once; it is dropped when the screen is over
  let splash = window.SPLASH.start('phone', accent());
  function drawSplash() {
    const SPLASH_T = 2.5;
    if (!splash) return;
    const pic = splash.frame(SPLASH_T - splashT);         // seconds since the start screen began
    ctx.save();
    ctx.globalAlpha = splashT < 0.3 ? splashT / 0.3 : 1;
    ctx.drawImage(pic, SCENE_CROP_X, 0);
    ctx.restore();
  }
  // Боня on her own picture, in the light of the hour
  function litBonya() {
    bonyaCtx.globalCompositeOperation = 'source-over';
    bonyaCtx.clearRect(0, 0, 60, 40);
    drawBonya(bonyaCtx, 4, 16);
    bonyaCtx.globalCompositeOperation = 'multiply';
    bonyaCtx.drawImage(kitchen.lit, BONYA_X - 4, 179, 60, 1, 0, 0, 60, 40);
    bonyaCtx.globalCompositeOperation = 'destination-in';
    drawBonya(bonyaCtx, 4, 16);
    bonyaCtx.globalCompositeOperation = 'source-over';
  }
  let last = performance.now();
  function frame(now) {
    // inside VK the frame can change its size without a resize event: the canvas follows it on every frame
    if (window.innerWidth !== fitW || window.innerHeight !== fitH) { fitW = window.innerWidth; fitH = window.innerHeight; fitScreen(); }
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));   // a frame timestamp can be slightly earlier than `last` on load
    last = now;
    update(dt);
    ctx.fillStyle = 'rgb(34, 26, 56)';            // the panel under the scene
    ctx.fillRect(0, 0, W, 320);
    render();
    if (splashT > 0) drawSplash();
    updateLaunchGate();   // on top of everything, the consent window included
    screenCtx.imageSmoothingEnabled = false;
    screenCtx.fillStyle = '#000';
    screenCtx.fillRect(0, 0, PHONE_W, PHONE_H);
    // the scene part (above the menu line) moves up by SCENE_UP; the menu part stays where it is
    if (splashT > 0) {
      screenCtx.drawImage(sceneCanvas, SCENE_CROP_X, 0, PHONE_W, 320, 0, 0, PHONE_W, PHONE_H);
    } else {
      screenCtx.fillStyle = 'rgb(34, 26, 56)';
      screenCtx.fillRect(0, 180 - SCENE_UP, PHONE_W, SCENE_UP);
      screenCtx.drawImage(sceneCanvas, SCENE_CROP_X, SCENE_UP, PHONE_W, 180 - SCENE_UP, 0, 0, PHONE_W, 180 - SCENE_UP);
      screenCtx.drawImage(sceneCanvas, SCENE_CROP_X, 180, PHONE_W, PHONE_H - 180, 0, 180, PHONE_W, PHONE_H - 180);
      // the gap under the scene (the rows between the scene and the menu): the same wood, in the same light
      screenCtx.drawImage(woodStrip, SCENE_CROP_X, 0, PHONE_W, SCENE_UP, 0, 180 - SCENE_UP, PHONE_W, SCENE_UP);
      screenCtx.globalCompositeOperation = 'multiply';
      screenCtx.drawImage(kitchen.lit, SCENE_CROP_X, 179, PHONE_W, 1, 0, 180 - SCENE_UP, PHONE_W, SCENE_UP);
      screenCtx.globalCompositeOperation = 'source-over';
      const mainCtx = ctx;
      ctx = skinBtnCtx;
      ctx.clearRect(0, 0, W, 20);
      drawTopButton(SKIN_BTN_LABEL, SKIN_BTN[0], SKIN_BTN[2], 0, 18);
      drawBoostLine(0, 18);
      ctx = mainCtx;
      const bw = SKIN_BTN[2] - SKIN_BTN[0];
      screenCtx.drawImage(skinBtnCanvas, SKIN_BTN[0], 0, bw, 18, SKIN_BTN[0] - SCENE_CROP_X, 160, bw, 18);
      screenCtx.drawImage(skinBtnCanvas, MENU_BTN_X - 30, 0, MENU_BTN_W + 30, 18, MENU_BTN_X - 30 - SCENE_CROP_X, 160, MENU_BTN_W + 30, 18);
      if (noticeWin || offlineWin || lvlWin) {
        // this strip is drawn after the scene: it is dimmed here, and Боня (she is taller than the strip) on her own picture
        screenCtx.fillStyle = NOTICE_DIM; screenCtx.fillRect(0, 180 - SCENE_UP, PHONE_W, SCENE_UP);
        litBonya();
        bonyaCtx.globalCompositeOperation = 'source-atop';
        bonyaCtx.fillStyle = NOTICE_DIM; bonyaCtx.fillRect(0, 0, 60, 40);
        screenCtx.drawImage(bonyaCanvas, BONYA_X - SCENE_CROP_X - 4, BONYA_Y - 16);
      } else {
        litBonya();
        screenCtx.drawImage(bonyaCanvas, BONYA_X - SCENE_CROP_X - 4, BONYA_Y - 16);
      }
    }
    drawPress(screenCtx, dt);
    requestAnimationFrame(frame);
  }
  let fitW = 0, fitH = 0;   // the window size the canvas was last fitted to
  function fitScreen() {
    // the size left inside the safe area (the body's padding is the notch and the system bars)
    const cs = getComputedStyle(document.body);
    const availW = window.innerWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const availH = window.innerHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const k = Math.max(1, Math.floor(Math.min(availW / PHONE_W, availH / PHONE_H)));
    canvas.style.width = PHONE_W * k + 'px';
    canvas.style.height = PHONE_H * k + 'px';
  }
  window.addEventListener('resize', fitScreen);
  fitScreen();
  if (CUST_TEST) custGap = 5;
  requestAnimationFrame(frame);

  // small hook for checks in the browser console
  window.KUCHA = {
    version: VERSION,
    splash(v) { splash = window.SPLASH.start('phone', accent(), v); splashT = 2.5; return splash.v; },
    get coins() { return coins.toString(); },
    get owned() { return { tap: tapLv, tech: techOwned.slice(), prok: prokOwned.slice() }; },
    get perSec() { return autoPerSec(); },
    get level() { return bakeryLevel; },
    event(type, pies) { if (type === 'appetite') ev = { type: 'appetite', t: 0, pies: pies !== false }; if (type === 'quest') ev = { type: 'quest', t: 60, taps: 0, done: null }; if (type === 'minute') startMinute(); },
    get menus() { return { shop: panelOpen, settings: settingsOpen, level: !!lvlWin, progress: progWin ? progWin.tab : null, premium: !!premiumWin }; },
    get glaze() { return { click: glazeClick, tech: glazeTech, name: glazeName }; },
    get questBoost() { return questBoost; },
    get minuteLeft() { return minuteLeft; },
    get ev() { return ev ? { type: ev.type, t: ev.t, taps: ev.taps, done: ev.done, pies: ev.pies } : null; },
    customer(kind) { custComes(kind); },
    bonya(name) { if (name === 'wake') bonyaT = Math.floor(bonyaT / BONYA_CYCLE + 1) * BONYA_CYCLE; else if (name) bonyaPlay(name); return { act: bonyaAct && bonyaAct.name, awake: bonyaAwakeNow(), side: bonyaOnSide() }; },
    get customers() { return { gap: custGap, now: cust ? { kind: cust.k, n: cust.n.toString(), left: cust.left } : null, selling: !!sale }; },
    fmt(v) { return fmt(BigInt(v)); },
    get mult() { return incomeMult(); },
    get cook() { return kitchen.baker.state; },
    get things() { return kitchen.things; },
    baker: kitchen.baker,
    setCook(o) { kitchen.baker.set(o); },
    get clock() { const c = kitchen.now; return { t: gameT, season: c.season, day: c.dayOfSeason, hour: gameT % 24 }; },
    setTime(day, hour) { setGameTime(day, hour); },
    get totalEarned() { return totalEarned.toString(); },
  };
})();
