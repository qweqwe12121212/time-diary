'use strict';
/* =========================================================
   Дневник времени — учёт времени в формате «бюджета»
   ========================================================= */

/* ---------- мелкие помощники ---------- */
const $ = (s, e = document) => e.querySelector(s);
const $$ = (s, e = document) => [...e.querySelectorAll(s)];
const pad = n => String(n).padStart(2, '0');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DAY = 86400000;

/* ---------- переводы ---------- */
const I = {
  ru: {
    nav_stats: 'Статистика', nav_home: 'Главная', nav_notes: 'Заметки', settings: 'Настройки',
    today: 'Сегодня', total: 'всего', empty: 'Пока нет записей.\nНажми ⏱, чтобы засечь время, или ＋, чтобы добавить вручную.',
    timer_start: 'Что засекаем?', running: 'Идёт', paused: 'Пауза', pause: 'Пауза', resume: 'Продолжить', stop: 'Завершить',
    save: 'Сохранить', cancel: 'Отмена', delete: 'Удалить', ok: 'ОК', close: 'Закрыть',
    finish_title: 'Завершить учёт', started: 'Начало', ended: 'Конец', duration: 'Длительность',
    paused_note: 'Из них пауза: {0}', leftover_title: 'Остаток {0} ({1} – {2})', leftover_to: 'Куда записать остаток?',
    leftover_none: 'Не учитывать', discard: 'Отбросить', confirm_discard: 'Отбросить эту запись?',
    tap_to_edit: 'Нажми на время, чтобы изменить',
    new_entry: 'Новая запись', edit_entry: 'Изменить запись', category: 'Категория',
    err_order: 'Конец должен быть позже начала', err_after_stop: 'Конец не может быть позже момента остановки таймера',
    err_cat: 'Выбери категорию', timer_active: 'Таймер уже запущен', info_title: 'Информация',
    info_timer_start: 'Таймер запущен', info_timer_end: 'Таймер остановлен', info_manual: 'Создано вручную',
    info_leftover: 'Остаток после правки таймера', info_edits: 'Что изменено', info_noedits: 'Правок не было',
    ch_start: 'Начало: {0} → {1}', ch_end: 'Конец: {0} → {1}', ch_cat: 'Категория: {0} → {1}', at: 'в {0}',
    p7: 'Неделя', p30: '30 дней', p365: 'Год', pc: 'Период', from: 'С', to: 'По',
    percent: 'Проценты', time: 'Время', rank: 'Рейтинг', circle: 'Круг',
    hide_hint: 'Нажми на категорию, чтобы убрать её из статистики (например, сон).',
    no_data: 'За этот период данных нет', by_period: 'По дням',
    new_cat: 'Новая категория', edit_cat: 'Категория', name: 'Название', icon: 'Картинка', color: 'Цвет',
    language: 'Язык', sys: 'Системный', date_format: 'Формат даты', time_format: 'Формат времени',
    h24: '24 часа', h12: '12 часов (AM/PM)', day_start: 'Начало нового дня',
    day_start_hint: 'Можно выбрать с 20:00 до 08:00. День получает номер той даты, на которую приходится больше его часов. Например, при начале в 23:00 всё после 23:00 сегодня относится уже к следующей дате.',
    cats: 'Мои категории', add: 'Добавить', no_cat: 'Без категории',
    notes_tab: 'Заметки', rem_tab: 'Напоминания', note_new: 'Новая заметка', note_edit: 'Заметка', note_ph: 'Текст заметки',
    rem_new: 'Новое напоминание', rem_title: 'О чём напомнить', date: 'Дата', time_lbl: 'Время',
    no_notes: 'Заметок пока нет. Нажми ＋.', no_rem: 'На этот день напоминаний нет.',
    err_title: 'Введи текст', err_name: 'Введи название', confirm_del: 'Удалить?',
    h_short: 'ч', m_short: 'мин', picking_hours: 'Часы', picking_minutes: 'Минуты', now: 'Сейчас',
    manual_src: 'вручную', hint_notif: 'Таймер виден в шторке уведомлений — там можно поставить паузу или завершить.',
    nav_screen: 'Экран', p1: 'День',
    scr_need_title: 'Нужен доступ к статистике использования',
    scr_need_text: 'Android сам считает, сколько времени ты провёл в каждом приложении. Чтобы показать это здесь, нужно один раз разрешить доступ. Данные остаются только на телефоне.',
    scr_steps: '1. Нажми кнопку ниже.\n2. В списке найди «Дневник времени».\n3. Включи «Разрешить доступ к данным об использовании».\n4. Вернись в приложение.',
    scr_grant: 'Открыть настройки доступа', scr_browser: 'Эта вкладка работает только в приложении на телефоне.',
    scr_others: 'Остальные', scr_show_all: 'Показать все ({0})', scr_less: 'Свернуть',
    scr_hide: 'Скрыть это приложение из статистики?', scr_hidden: 'Скрытые приложения', scr_restore: 'Вернуть',
    scr_no_hidden: 'Скрытых приложений нет. Скрыть можно кнопкой ✕ на вкладке «Экран».',
    scr_no_data: 'Пока нет данных об экранном времени за этот период.',
    scr_note: 'Android хранит подробные данные примерно неделю. Всё, что приложение успело увидеть, оно сохраняет у себя, поэтому история копится со временем. Время считается по приложению целиком: рилсы и обычная лента для Android — одно приложение.',
    scr_days: 'дн.', scr_apps_hint: 'Приложения'
  },
  en: {
    nav_stats: 'Stats', nav_home: 'Home', nav_notes: 'Notes', settings: 'Settings',
    today: 'Today', total: 'total', empty: 'No entries yet.\nTap ⏱ to start timing, or ＋ to add one manually.',
    timer_start: 'What are we timing?', running: 'Running', paused: 'Paused', pause: 'Pause', resume: 'Resume', stop: 'Finish',
    save: 'Save', cancel: 'Cancel', delete: 'Delete', ok: 'OK', close: 'Close',
    finish_title: 'Finish tracking', started: 'Start', ended: 'End', duration: 'Duration',
    paused_note: 'Including pause: {0}', leftover_title: 'Leftover {0} ({1} – {2})', leftover_to: 'Where to put the leftover?',
    leftover_none: 'Don’t count', discard: 'Discard', confirm_discard: 'Discard this entry?',
    tap_to_edit: 'Tap the time to change it',
    new_entry: 'New entry', edit_entry: 'Edit entry', category: 'Category',
    err_order: 'End must be after start', err_after_stop: 'End can’t be later than when the timer was stopped',
    err_cat: 'Choose a category', timer_active: 'A timer is already running', info_title: 'Details',
    info_timer_start: 'Timer started', info_timer_end: 'Timer stopped', info_manual: 'Created manually',
    info_leftover: 'Leftover after trimming the timer', info_edits: 'Changes', info_noedits: 'No edits',
    ch_start: 'Start: {0} → {1}', ch_end: 'End: {0} → {1}', ch_cat: 'Category: {0} → {1}', at: 'at {0}',
    p7: 'Week', p30: '30 days', p365: 'Year', pc: 'Custom', from: 'From', to: 'To',
    percent: 'Percent', time: 'Time', rank: 'Ranking', circle: 'Circle',
    hide_hint: 'Tap a category to hide it from the stats (e.g. sleep).',
    no_data: 'No data for this period', by_period: 'By day',
    new_cat: 'New category', edit_cat: 'Category', name: 'Name', icon: 'Icon', color: 'Color',
    language: 'Language', sys: 'System', date_format: 'Date format', time_format: 'Time format',
    h24: '24-hour', h12: '12-hour (AM/PM)', day_start: 'New day starts at',
    day_start_hint: 'Choose from 20:00 to 08:00. A day gets the date that holds most of its hours. For example, if it starts at 23:00, everything after 23:00 tonight belongs to the next date.',
    cats: 'My categories', add: 'Add', no_cat: 'No category',
    notes_tab: 'Notes', rem_tab: 'Reminders', note_new: 'New note', note_edit: 'Note', note_ph: 'Note text',
    rem_new: 'New reminder', rem_title: 'What to remind', date: 'Date', time_lbl: 'Time',
    no_notes: 'No notes yet. Tap ＋.', no_rem: 'No reminders for this day.',
    err_title: 'Enter some text', err_name: 'Enter a name', confirm_del: 'Delete?',
    h_short: 'h', m_short: 'm', picking_hours: 'Hours', picking_minutes: 'Minutes', now: 'Now',
    manual_src: 'manual', hint_notif: 'The timer is shown in the notification shade, where you can pause or finish it.',
    nav_screen: 'Screen', p1: 'Day',
    scr_need_title: 'Usage access is needed',
    scr_need_text: 'Android itself counts how long you spend in each app. To show it here, allow access once. The data never leaves your phone.',
    scr_steps: '1. Tap the button below.\n2. Find “Time Diary” in the list.\n3. Turn on “Allow usage access”.\n4. Come back to the app.',
    scr_grant: 'Open access settings', scr_browser: 'This tab only works in the phone app.',
    scr_others: 'Others', scr_show_all: 'Show all ({0})', scr_less: 'Show less',
    scr_hide: 'Hide this app from the stats?', scr_hidden: 'Hidden apps', scr_restore: 'Restore',
    scr_no_hidden: 'No hidden apps. Hide one with the ✕ button on the Screen tab.',
    scr_no_data: 'No screen time data for this period yet.',
    scr_note: 'Android keeps detailed data for about a week. Whatever the app has seen it saves itself, so history builds up over time. Time is counted per app: reels and the regular feed are one app to Android.',
    scr_days: 'd', scr_apps_hint: 'Apps'
  }
};

/* ---------- данные ---------- */
const KEY = 'td_v1';
const EMOJIS = ['😴', '🛏️', '🧼', '🚿', '🏍️', '🚗', '🚌', '🚶', '💼', '💻', '📞', '☕', '🍔', '🍳', '🥗', '🏋️', '🏃', '🚴', '🧘', '📱', '🎬', '🎮', '🎧', '📚', '🛒', '🧹', '🧺', '👨‍👩‍👧', '❤️', '🐕', '💊', '🛠️', '✈️', '🎓', '✍️', '🎨', '💰', '🕒', '🌳', '⭐'];
const COLORS = ['#6366f1', '#3b82f6', '#06b6d4', '#14b8a6', '#22c55e', '#84cc16', '#eab308', '#f59e0b', '#f97316', '#ef4444', '#ec4899', '#a855f7', '#8b5cf6', '#64748b', '#78716c', '#0ea5e9'];

function defaultCats(l) {
  const n = l === 'ru'
    ? ['Сон', 'Сборы', 'Дорога', 'Работа', 'Перерыв', 'Тренировка', 'Еда', 'Рилсы и шортсы']
    : ['Sleep', 'Getting ready', 'Commute', 'Work', 'Break', 'Workout', 'Food', 'Reels & Shorts'];
  const d = [['😴', '#6366f1'], ['🧼', '#14b8a6'], ['🏍️', '#f59e0b'], ['💼', '#3b82f6'], ['☕', '#f97316'], ['🏋️', '#22c55e'], ['🍔', '#ef4444'], ['📱', '#ec4899']];
  return n.map((name, i) => ({ id: 'c' + i, name, icon: d[i][0], color: d[i][1] }));
}

function sysLang() { return (navigator.language || 'en').toLowerCase().startsWith('ru') ? 'ru' : 'en'; }

function freshState() {
  return {
    cats: defaultCats(sysLang()), entries: [], notes: [], reminders: [],
    settings: { lang: 'system', dateFmt: 'DD.MM.YYYY', timeFmt: '24', dayStart: 0, statEx: [] },
    screen: { ds: 0, days: {}, names: {}, hidden: [], lastFull: 0 }
  };
}

function loadState() {
  try {
    const r = JSON.parse(localStorage.getItem(KEY));
    if (r && r.cats) {
      const f = freshState();
      r.settings = Object.assign(f.settings, r.settings || {});
      r.entries = r.entries || []; r.notes = r.notes || []; r.reminders = r.reminders || [];
      r.screen = Object.assign(f.screen, r.screen || {});
      return r;
    }
  } catch (e) { /* пусто */ }
  return freshState();
}
let S = loadState();
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } }

/* Таймер хранит нативная часть (чтобы работала шторка уведомлений); в браузере — localStorage */
const Native = {
  getTimer() {
    try {
      const s = window.Android ? window.Android.getTimer() : localStorage.getItem('td_timer');
      return s ? JSON.parse(s) : null;
    } catch (e) { return null; }
  },
  setTimer(o) {
    const s = o ? JSON.stringify(o) : '';
    try {
      if (window.Android) window.Android.setTimer(s);
      else if (o) localStorage.setItem('td_timer', s); else localStorage.removeItem('td_timer');
    } catch (e) { /* ignore */ }
  },
  syncReminders() {
    const list = S.reminders.filter(r => r.at > Date.now()).map(r => ({ id: r.id, title: r.title, at: r.at }));
    try { if (window.Android) window.Android.setReminders(JSON.stringify(list)); } catch (e) { /* ignore */ }
  }
};

/* Экранное время: читаем из Android, историю копим у себя */
const Screen = {
  has() { try { return window.Android ? !!window.Android.hasUsageAccess() : false; } catch (e) { return false; } },
  open() { try { if (window.Android) window.Android.openUsageSettings(); } catch (e) { /* ignore */ } },
  query(from, to) {
    try { return window.Android ? JSON.parse(window.Android.getUsage(from, to)) : null; } catch (e) { return null; }
  },
  icons: (() => { try { return JSON.parse(localStorage.getItem('td_icons')) || {}; } catch (e) { return {}; } })(),
  icon(pkg) {
    if (this.icons[pkg] !== undefined) return this.icons[pkg];
    let src = '';
    try { if (window.Android) src = window.Android.getIcon(pkg) || ''; } catch (e) { /* ignore */ }
    if (src) {
      this.icons[pkg] = src;
      try { localStorage.setItem('td_icons', JSON.stringify(this.icons)); } catch (e) { /* ignore */ }
    }
    return src;
  }
};

/** Забирает данные за последние дни и сливает с сохранёнными (данные дня только растут). */
function syncScreen(full) {
  const sc = S.screen;
  if (!Screen.has()) return false;
  if (sc.ds !== S.settings.dayStart) { sc.days = {}; sc.ds = S.settings.dayStart; sc.lastFull = 0; }
  const now = Date.now(), today = labelOf(now);
  const doFull = full || now - (sc.lastFull || 0) > 5 * 60000;
  const from = doFull ? addDays(today, -7) : today;
  for (let k = from; k <= today; k = addDays(k, 1)) {
    const [ws, we] = dayWindow(k);
    if (ws > now) continue;
    const res = Screen.query(ws, we);
    if (!res) continue;
    const cur = sc.days[k] || {};
    res.forEach(r => {
      sc.names[r.p] = r.n;
      if (!(cur[r.p] >= r.ms)) cur[r.p] = r.ms;
    });
    if (Object.keys(cur).length) sc.days[k] = cur;
  }
  if (doFull) sc.lastFull = now;
  save();
  return true;
}

/* ---------- язык, форматы ---------- */
function lang() { return S.settings.lang === 'system' ? sysLang() : S.settings.lang; }
function t(k, ...a) {
  let s = (I[lang()][k] ?? I.en[k] ?? k);
  a.forEach((v, i) => { s = s.split('{' + i + '}').join(v); });
  return s;
}
function fmtDate(ts) {
  const d = new Date(ts), dd = pad(d.getDate()), mm = pad(d.getMonth() + 1), yy = d.getFullYear();
  switch (S.settings.dateFmt) {
    case 'YYYY.MM.DD': return `${yy}.${mm}.${dd}`;
    case 'MM.DD.YYYY': return `${mm}.${dd}.${yy}`;
    default: return `${dd}.${mm}.${yy}`;
  }
}
function fmtTime(ts) {
  const d = new Date(ts), h = d.getHours(), m = pad(d.getMinutes());
  if (S.settings.timeFmt === '24') return `${pad(h)}:${m}`;
  return `${h % 12 || 12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
}
function fmtDur(ms) {
  const mins = Math.round(ms / 60000), h = Math.floor(mins / 60), m = mins % 60;
  const H = t('h_short'), M = t('m_short');
  if (h === 0) return `${m} ${M}`;
  return lang() === 'ru' ? `${h} ${H} ${pad(m)} ${M}` : `${h}${H} ${pad(m)}${M}`;
}
function fmtClock(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s % 3600 / 60))}:${pad(s % 60)}`;
}
function isoDate(ts) { const d = new Date(ts); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function setTimePart(ts, h, m) { const d = new Date(ts); d.setHours(h, m, 0, 0); return d.getTime(); }
function setDatePart(ts, iso) {
  const [y, mo, da] = iso.split('-').map(Number); const d = new Date(ts); d.setFullYear(y, mo - 1, da); return d.getTime();
}

/* ---------- «день» с настраиваемым началом ---------- */
function keyOf(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function parseKey(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); }
function addDays(k, n) { const d = parseKey(k); d.setDate(d.getDate() + n); return keyOf(d); }
/** Номер дня (дата), к которому относится момент ts. */
function labelOf(ts) {
  const h = S.settings.dayStart, d = new Date(ts);
  if (h >= 12) d.setHours(d.getHours() + (24 - h)); else d.setHours(d.getHours() - h);
  return keyOf(d);
}
/** [начало, конец) дня с номером key. */
function dayWindow(key) {
  const h = S.settings.dayStart, d = parseKey(key);
  const s = h >= 12 ? new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1, h) : new Date(d.getFullYear(), d.getMonth(), d.getDate(), h);
  const e = new Date(s.getFullYear(), s.getMonth(), s.getDate() + 1, s.getHours());
  return [s.getTime(), e.getTime()];
}
const dur = e => Math.max(0, e.end - e.start - (e.paused || 0));
function sliceDay(key) {
  const [ws, we] = dayWindow(key), m = {};
  for (const e of S.entries) {
    if (e.end <= ws || e.start >= we) continue;
    const ov = Math.min(e.end, we) - Math.max(e.start, ws), span = e.end - e.start;
    m[e.cat] = (m[e.cat] || 0) + ov * (span > 0 ? dur(e) / span : 0);
  }
  return m;
}
function entriesOfDay(key) {
  const [ws, we] = dayWindow(key);
  return S.entries.filter(e => e.end > ws && e.start < we).sort((a, b) => a.start - b.start);
}

const NOCAT = () => ({ id: '_', name: t('no_cat'), icon: '❔', color: '#888888' });
const getCat = id => S.cats.find(c => c.id === id) || NOCAT();

/* ---------- состояние интерфейса ---------- */
const U = {
  view: 'home', day: labelOf(Date.now()),
  range: '30', from: null, to: null, statView: 'circle', statMode: 'percent',
  sper: '1', sday: labelOf(Date.now()), sall: false,
  noteTab: 'notes', calY: new Date().getFullYear(), calM: new Date().getMonth(), calSel: isoDate(Date.now())
};
let modals = [];

/* ---------- графика ---------- */
function donut(items, centerMain, centerSub) {
  const total = items.reduce((a, b) => a + b.ms, 0), R = 80, W = 26, C = 100;
  let out = '';
  const live = items.filter(i => i.ms > 0);
  if (!total) {
    out = `<circle cx="100" cy="100" r="${R}" fill="none" stroke="var(--line)" stroke-width="${W}"/>`;
  } else if (live.length === 1) {
    out = `<circle cx="100" cy="100" r="${R}" fill="none" stroke="${live[0].color}" stroke-width="${W}"/>`;
  } else {
    let a0 = -Math.PI / 2;
    const p = a => [C + R * Math.cos(a), C + R * Math.sin(a)];
    live.forEach(i => {
      const a1 = a0 + i.ms / total * 2 * Math.PI, large = a1 - a0 > Math.PI ? 1 : 0;
      const [x0, y0] = p(a0), [x1, y1] = p(a1);
      out += `<path d="M${x0.toFixed(2)} ${y0.toFixed(2)} A${R} ${R} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}" fill="none" stroke="${i.color}" stroke-width="${W}"/>`;
      a0 = a1;
    });
  }
  return `<svg viewBox="0 0 200 200" class="donut">${out}
    <text x="100" y="102" class="dc1" style="font-size:${String(centerMain).length > 9 ? 16 : String(centerMain).length > 7 ? 19 : 21}px">${esc(centerMain)}</text><text x="100" y="122" class="dc2">${esc(centerSub)}</text></svg>`;
}

function legendRows(map, mode) { // map: catId -> ms
  const rows = Object.entries(map).filter(([, ms]) => ms > 0).sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((a, [, ms]) => a + ms, 0);
  return rows.map(([id, ms]) => {
    const c = getCat(id);
    return `<div class="lrow"><span class="dot" style="background:${c.color}"></span><span>${esc(c.icon)}</span>
      <span class="nm">${esc(c.name)}</span><span class="v">${fmtDur(ms)}</span><span class="p">${Math.round(ms / total * 100)}%</span></div>`;
  }).join('');
}

function mapToItems(map) {
  return Object.entries(map).filter(([, ms]) => ms > 0).sort((a, b) => b[1] - a[1])
    .map(([id, ms]) => ({ color: getCat(id).color, ms }));
}

/* ---------- модальные окна ---------- */
function openModal(render, onAction, opts = {}) {
  const el = document.createElement('div');
  el.className = 'overlay' + (opts.top ? ' top' : '');
  const box = document.createElement('div');
  box.className = 'sheet';
  el.appendChild(box);
  document.body.appendChild(el);
  const m = {
    el, box,
    close() { el.remove(); modals = modals.filter(x => x !== m); if (opts.onClose) opts.onClose(); },
    update() { if (opts.sync && box.innerHTML) opts.sync(m); box.innerHTML = render(m); }
  };
  box.addEventListener('click', e => {
    const a = e.target.closest('[data-m]');
    if (a) { if (opts.sync) opts.sync(m); onAction(a.dataset.m, a, m, e); }
  });
  box.addEventListener('change', e => {
    const a = e.target.closest('[data-c]');
    if (a && opts.onChange) opts.onChange(a.dataset.c, a.value, m);
  });
  el.addEventListener('click', e => { if (e.target === el && !opts.sticky) m.close(); });
  modals.push(m);
  m.update();
  return m;
}

function confirmBox(text, yes) {
  openModal(() => `<h2>${esc(text)}</h2><div class="btns"><button class="btn" data-m="no">${t('cancel')}</button>
    <button class="btn primary" data-m="yes">${t('ok')}</button></div>`,
    (a, el, m) => { m.close(); if (a === 'yes') yes(); }, { top: true });
}

function toast(msg) {
  const el = $('#toast'); el.textContent = msg; el.hidden = false;
  clearTimeout(toast.tm); toast.tm = setTimeout(() => { el.hidden = true; }, 2600);
}

/* ---------- круговой выбор времени (как на будильнике) ---------- */
function pickTime(ts, titleText) {
  return new Promise(resolve => {
    const is24 = S.settings.timeFmt === '24';
    const d = new Date(ts);
    const st = { h: d.getHours(), m: d.getMinutes(), mode: 'h' };
    const R = 112, CX = 130, CY = 130;

    const pos = (k, r) => [CX + r * Math.sin(k * Math.PI / 6), CY - r * Math.cos(k * Math.PI / 6)];

    const dialSvg = () => {
      let items = '', hx, hy, selLabel = '';
      if (st.mode === 'h') {
        if (is24) {
          for (let k = 0; k < 12; k++) {
            const hOut = k === 0 ? 0 : k + 12, hIn = k === 0 ? 12 : k;
            [[hOut, 100, 'o'], [hIn, 62, 'i']].forEach(([hv, r]) => {
              const [x, y] = pos(k, r), sel = st.h === hv;
              if (sel) { hx = x; hy = y; selLabel = pad(hv); }
              items += `<text x="${x}" y="${y}" class="${sel ? 'sel' : ''}" style="font-size:${r === 100 ? 15 : 14}px">${pad(hv)}</text>`;
            });
          }
        } else {
          const h12 = st.h % 12 || 12;
          for (let k = 0; k < 12; k++) {
            const hv = k === 0 ? 12 : k, [x, y] = pos(k, 100), sel = h12 === hv;
            if (sel) { hx = x; hy = y; selLabel = String(hv); }
            items += `<text x="${x}" y="${y}" class="${sel ? 'sel' : ''}">${hv}</text>`;
          }
        }
      } else {
        for (let k = 0; k < 12; k++) {
          const mv = k * 5, [x, y] = pos(k, 100);
          items += `<text x="${x}" y="${y}" class="${st.m === mv ? 'sel' : ''}">${pad(mv)}</text>`;
        }
        const ang = st.m / 60 * 12;
        [hx, hy] = pos(ang, 100);
        if (st.m % 5 !== 0) items += `<circle cx="${hx}" cy="${hy}" r="3" fill="var(--accent-t)"/>`;
        else selLabel = '';
      }
      return `<circle class="face" cx="${CX}" cy="${CY}" r="${R + 14}"/>
        <line class="hand" x1="${CX}" y1="${CY}" x2="${hx}" y2="${hy}"/>
        <circle class="knob" cx="${CX}" cy="${CY}" r="4"/>
        <circle class="knob" cx="${hx}" cy="${hy}" r="${st.mode === 'm' && st.m % 5 !== 0 ? 16 : 19}" style="opacity:${st.mode === 'm' && st.m % 5 !== 0 ? .9 : 1}"/>
        ${items}`;
    };

    const headHtml = () => {
      const hShown = is24 ? pad(st.h) : String(st.h % 12 || 12);
      return `<div class="dialhead">
        <button class="seg ${st.mode === 'h' ? 'on' : ''}" data-m="mh">${hShown}</button><span class="col">:</span>
        <button class="seg ${st.mode === 'm' ? 'on' : ''}" data-m="mm">${pad(st.m)}</button>
        ${is24 ? '' : `<div class="ampm"><button class="${st.h < 12 ? 'on' : ''}" data-m="am">AM</button><button class="${st.h >= 12 ? 'on' : ''}" data-m="pm">PM</button></div>`}
      </div>`;
    };

    const m = openModal(() => `<h2>${esc(titleText || t('time_lbl'))}</h2>${headHtml()}
      <svg class="dial" viewBox="0 0 260 260" id="dial">${dialSvg()}</svg>
      <div class="note" style="text-align:center">${st.mode === 'h' ? t('picking_hours') : t('picking_minutes')}</div>
      <div class="btns"><button class="btn" data-m="cancel">${t('cancel')}</button><button class="btn primary" data-m="ok">${t('ok')}</button></div>`,
      (a, el, mm) => {
        if (a === 'mh') { st.mode = 'h'; mm.update(); bind(); }
        else if (a === 'mm') { st.mode = 'm'; mm.update(); bind(); }
        else if (a === 'am') { if (st.h >= 12) st.h -= 12; mm.update(); bind(); }
        else if (a === 'pm') { if (st.h < 12) st.h += 12; mm.update(); bind(); }
        else if (a === 'cancel') { done(null); }
        else if (a === 'ok') { done({ h: st.h, m: st.m }); }
      }, { top: true, sticky: true });

    let finished = false;
    function done(v) { if (finished) return; finished = true; m.close(); resolve(v); }

    function bind() {
      const svg = $('#dial', m.box);
      const apply = (e, final) => {
        const r = svg.getBoundingClientRect(), sc = 260 / r.width;
        const x = (e.clientX - r.left) * sc - CX, y = (e.clientY - r.top) * sc - CY;
        let deg = Math.atan2(x, -y) * 180 / Math.PI; if (deg < 0) deg += 360;
        const dist = Math.hypot(x, y);
        if (st.mode === 'h') {
          const k = Math.round(deg / 30) % 12;
          if (is24) st.h = dist < 82 ? (k === 0 ? 12 : k) : (k === 0 ? 0 : k + 12);
          else { const base = k === 0 ? 0 : k; st.h = base + (st.h >= 12 ? 12 : 0); }
        } else {
          st.m = Math.round(deg / 6) % 60;
        }
        const keepMode = st.mode;
        m.box.querySelector('.dialhead').outerHTML = headHtml();
        svg.innerHTML = dialSvg();
        if (final && keepMode === 'h') { st.mode = 'm'; m.update(); bind(); }
      };
      let down = false;
      svg.addEventListener('pointerdown', e => { down = true; svg.setPointerCapture(e.pointerId); apply(e, false); });
      svg.addEventListener('pointermove', e => { if (down) apply(e, false); });
      svg.addEventListener('pointerup', e => { if (down) { down = false; apply(e, true); } });
    }
    bind();
  });
}

/* ---------- кнопки «дата» и «время» ---------- */
const dateBtn = (ts, key) => `<label class="btn datebtn">${fmtDate(ts)}<input type="date" value="${isoDate(ts)}" data-c="${key}"></label>`;
const timeBtn = (ts, key) => `<button class="btn timebig" data-m="${key}">${fmtTime(ts)}</button>`;

/* ---------- таймер ---------- */
function timerElapsed(st, now = Date.now()) {
  const end = st.finished ? st.endedAt : (st.running ? now : st.pauseStart);
  return Math.max(0, end - st.startedAt - (st.pausedTotal || 0));
}
function startTimerFlow() {
  const cur = Native.getTimer();
  if (cur && !cur.finished) { toast(t('timer_active')); return; }
  openModal(() => `<h2>${t('timer_start')}</h2><div class="catgrid">${S.cats.map(c =>
    `<button class="cg" style="--c:${c.color}" data-m="go" data-id="${c.id}"><span class="ci">${esc(c.icon)}</span>${esc(c.name)}</button>`).join('')}</div>
    <p class="note">${t('hint_notif')}</p>`,
    (a, el, m) => {
      if (a !== 'go') return;
      const c = getCat(el.dataset.id);
      m.close();
      Native.setTimer({ catId: c.id, name: c.name, icon: c.icon, color: c.color, startedAt: Date.now(), running: true, pauseStart: null, pausedTotal: 0, finished: false, endedAt: null });
      render();
    });
}
function pauseResumeTimer() {
  const st = Native.getTimer(); if (!st || st.finished) return;
  const now = Date.now();
  if (st.running) { st.running = false; st.pauseStart = now; }
  else { st.pausedTotal = (st.pausedTotal || 0) + now - st.pauseStart; st.pauseStart = null; st.running = true; }
  Native.setTimer(st); render();
}
function stopTimer() {
  const st = Native.getTimer(); if (!st || st.finished) return;
  const now = Date.now();
  if (!st.running) { st.pausedTotal = (st.pausedTotal || 0) + now - st.pauseStart; st.pauseStart = null; st.running = true; }
  st.finished = true; st.endedAt = now;
  Native.setTimer(st); render(); checkFinished();
}

let finOpen = false;
function checkFinished() {
  const st = Native.getTimer();
  if (!st || !st.finished || finOpen) return;
  finOpen = true;
  const start = st.startedAt, stopAt = st.endedAt, paused = st.pausedTotal || 0;
  const cat = getCat(st.catId);
  const f = { end: stopAt, lo: '', err: '' };

  openModal(m => {
    const net = Math.max(0, f.end - start - Math.min(paused, f.end - start));
    const left = stopAt - f.end;
    return `<h2>${esc(cat.icon)} ${esc(cat.name)} · ${t('finish_title')}</h2>
      <div class="row"><span class="lab">${t('started')}</span><b class="timebig" style="padding:6px 0">${fmtDate(start)} ${fmtTime(start)}</b></div>
      <div class="row"><span class="lab">${t('ended')}</span>${timeBtn(f.end, 'end')}<span style="color:var(--muted)">✏️</span></div>
      <div class="row"><span class="lab">${t('duration')}</span><b style="font-size:20px">${fmtDur(net)}</b></div>
      ${paused > 0 ? `<div class="note">${t('paused_note', fmtDur(paused))}</div>` : ''}
      <div class="note">${t('tap_to_edit')}</div>
      ${left >= 60000 ? `<div class="card" style="box-shadow:none;border:1px dashed var(--line);margin-top:10px">
        <b>${t('leftover_title', fmtDur(left), fmtTime(f.end), fmtTime(stopAt))}</b>
        <div class="note">${t('leftover_to')}</div>
        <div class="chips"><button class="chip ${f.lo === '' ? 'on' : ''}" data-m="lo" data-id="">${t('leftover_none')}</button>
        ${S.cats.filter(c => c.id !== st.catId).map(c => `<button class="chip ${f.lo === c.id ? 'on' : ''}" style="--c:${c.color}" data-m="lo" data-id="${c.id}">${esc(c.icon)} ${esc(c.name)}</button>`).join('')}</div></div>` : ''}
      ${f.err ? `<p class="err">${esc(f.err)}</p>` : ''}
      <div class="btns"><button class="btn danger" data-m="discard">${t('discard')}</button><button class="btn primary" data-m="save">${t('save')}</button></div>`;
  }, async (a, el, m) => {
    if (a === 'lo') { f.lo = el.dataset.id; f.err = ''; m.update(); }
    else if (a === 'end') {
      const r = await pickTime(f.end, t('ended'));
      if (!r) return;
      let c = setTimePart(start, r.h, r.m);
      if (c < start) c += DAY;
      if (c > stopAt) c -= DAY;
      if (c < start) { f.err = t('err_after_stop'); } else if (c > stopAt) { f.err = t('err_after_stop'); } else { f.end = c; f.err = ''; }
      m.update();
    } else if (a === 'discard') {
      confirmBox(t('confirm_discard'), () => { Native.setTimer(null); m.close(); render(); });
    } else if (a === 'save') {
      if (f.end <= start) { f.err = t('err_order'); m.update(); return; }
      const now = Date.now();
      S.entries.push({
        id: uid(), cat: st.catId, start, end: f.end, paused: Math.min(paused, f.end - start), src: 'timer',
        origStart: start, origEnd: stopAt, createdAt: now,
        hist: f.end !== stopAt ? [{ f: 'end', from: stopAt, to: f.end, at: now }] : []
      });
      if (f.lo && stopAt - f.end >= 60000) {
        S.entries.push({ id: uid(), cat: f.lo, start: f.end, end: stopAt, paused: 0, src: 'leftover', origStart: f.end, origEnd: stopAt, createdAt: now, hist: [] });
      }
      save(); Native.setTimer(null);
      U.day = labelOf(f.end - 1);
      m.close(); render();
    }
  }, { sticky: true, onClose: () => { finOpen = false; } });
}

/* ---------- запись: создать / изменить ---------- */
function entryEditor(id) {
  const e = id ? S.entries.find(x => x.id === id) : null;
  const now = Date.now();
  const f = { cat: e ? e.cat : (S.cats[0] ? S.cats[0].id : ''), start: e ? e.start : now - 3600000, end: e ? e.end : now, err: '' };
  openModal(m => `<h2>${e ? t('edit_entry') : t('new_entry')}</h2>
    <div class="note" style="margin-top:0">${t('category')}</div>
    <div class="chips">${S.cats.map(c => `<button class="chip ${f.cat === c.id ? 'on' : ''}" style="--c:${c.color}" data-m="cat" data-id="${c.id}">${esc(c.icon)} ${esc(c.name)}</button>`).join('')}</div>
    <div class="row"><span class="lab">${t('started')}</span>${dateBtn(f.start, 'sd')}${timeBtn(f.start, 'st')}</div>
    <div class="row"><span class="lab">${t('ended')}</span>${dateBtn(f.end, 'ed')}${timeBtn(f.end, 'et')}</div>
    <div class="row"><span class="lab">${t('duration')}</span><b style="font-size:20px">${f.end > f.start ? fmtDur(Math.max(0, f.end - f.start - (e ? (e.paused || 0) : 0))) : '—'}</b></div>
    ${f.err ? `<p class="err">${esc(f.err)}</p>` : ''}
    <div class="btns">${e ? `<button class="btn danger" data-m="del">${t('delete')}</button>` : `<button class="btn" data-m="x">${t('cancel')}</button>`}
    <button class="btn primary" data-m="save">${t('save')}</button></div>`,
    async (a, el, m) => {
      if (a === 'cat') { f.cat = el.dataset.id; m.update(); }
      else if (a === 'x') m.close();
      else if (a === 'st') {
        const r = await pickTime(f.start, t('started')); if (!r) return;
        f.start = setTimePart(f.start, r.h, r.m);
        if (f.start >= f.end) f.start -= DAY;
        f.err = ''; m.update();
      } else if (a === 'et') {
        const r = await pickTime(f.end, t('ended')); if (!r) return;
        f.end = setTimePart(f.end, r.h, r.m);
        if (f.end <= f.start) f.end += DAY;
        f.err = ''; m.update();
      } else if (a === 'del') {
        confirmBox(t('confirm_del'), () => { S.entries = S.entries.filter(x => x.id !== e.id); save(); m.close(); render(); });
      } else if (a === 'save') {
        if (!f.cat) { f.err = t('err_cat'); m.update(); return; }
        if (f.end <= f.start) { f.err = t('err_order'); m.update(); return; }
        if (e) {
          const at = Date.now(); e.hist = e.hist || [];
          if (e.start !== f.start) e.hist.push({ f: 'start', from: e.start, to: f.start, at });
          if (e.end !== f.end) e.hist.push({ f: 'end', from: e.end, to: f.end, at });
          if (e.cat !== f.cat) e.hist.push({ f: 'cat', from: e.cat, to: f.cat, at });
          e.start = f.start; e.end = f.end; e.cat = f.cat;
          if (e.paused > e.end - e.start) e.paused = 0;
        } else {
          S.entries.push({ id: uid(), cat: f.cat, start: f.start, end: f.end, paused: 0, src: 'manual', origStart: f.start, origEnd: f.end, createdAt: Date.now(), hist: [] });
        }
        save(); U.day = labelOf(f.end - 1); m.close(); render();
      }
    },
    {
      onChange: (k, v, m) => {
        if (!v) return;
        if (k === 'sd') f.start = setDatePart(f.start, v);
        if (k === 'ed') f.end = setDatePart(f.end, v);
        f.err = ''; m.update();
      }
    });
}

function entryInfo(id) {
  const e = S.entries.find(x => x.id === id); if (!e) return;
  const c = getCat(e.cat), dt = ts => `${fmtDate(ts)} ${fmtTime(ts)}`;
  const nameOf = i => getCat(i).name;
  const lines = (e.hist || []).map(h => {
    const when = t('at', dt(h.at));
    if (h.f === 'start') return `${t('ch_start', fmtTime(h.from), fmtTime(h.to))} (${when})`;
    if (h.f === 'end') return `${t('ch_end', fmtTime(h.from), fmtTime(h.to))} (${when})`;
    return `${t('ch_cat', esc(nameOf(h.from)), esc(nameOf(h.to)))} (${when})`;
  });
  const first = e.src === 'timer'
    ? `<div class="row"><span class="lab" style="width:130px">${t('info_timer_start')}</span><b>${dt(e.origStart)}</b></div>
       <div class="row"><span class="lab" style="width:130px">${t('info_timer_end')}</span><b>${dt(e.origEnd)}</b></div>`
    : `<div class="row"><span class="lab" style="width:130px">${e.src === 'leftover' ? t('info_leftover') : t('info_manual')}</span><b>${dt(e.createdAt)}</b></div>`;
  openModal(() => `<h2>${esc(c.icon)} ${esc(c.name)} · ${t('info_title')}</h2>
    ${first}
    <div class="row"><span class="lab" style="width:130px">${t('started')} / ${t('ended')}</span><b>${fmtTime(e.start)} – ${fmtTime(e.end)}</b></div>
    <div class="row"><span class="lab" style="width:130px">${t('duration')}</span><b>${fmtDur(dur(e))}</b></div>
    <div class="sec">${t('info_edits')}</div>
    ${lines.length ? lines.map(l => `<div class="note" style="font-size:14px;color:var(--text)">• ${l}</div>`).join('') : `<div class="note">${t('info_noedits')}</div>`}
    <div class="btns"><button class="btn primary" data-m="x">${t('close')}</button></div>`,
    (a, el, m) => m.close());
}

/* ---------- экраны ---------- */
function header(title, withGear = true) {
  return `<div class="top"><h1>${esc(title)}</h1>${withGear ? `<button class="icon-btn" data-a="settings" aria-label="${t('settings')}">⚙️</button>` : ''}</div>`;
}

function homeView() {
  const today = labelOf(Date.now());
  const sl = sliceDay(U.day), total = Object.values(sl).reduce((a, b) => a + b, 0);
  const list = entriesOfDay(U.day);
  const wd = parseKey(U.day).toLocaleDateString(lang(), { weekday: 'short' });
  const label = U.day === today ? t('today') : `${wd}, ${fmtDate(parseKey(U.day).getTime())}`;
  const tm = Native.getTimer();
  let banner = '';
  if (tm && !tm.finished) {
    banner = `<div class="banner" style="background:${tm.color || 'var(--accent)'}"><span class="bi">${esc(tm.icon || '⏱')}</span>
      <div class="bt"><div class="bn">${esc(tm.name)} · ${tm.running ? t('running') : t('paused')}</div><div class="bc" id="tick">${fmtClock(timerElapsed(tm))}</div></div>
      <div class="bb"><button data-a="tpause">${tm.running ? t('pause') : t('resume')}</button><button data-a="tstop">${t('stop')}</button></div></div>`;
  }
  const entries = list.map(e => {
    const c = getCat(e.cat);
    return `<div class="entry" style="--c:${c.color}"><div class="em"><div class="en">${esc(c.icon)} ${esc(c.name)}</div><div class="ed">${fmtDur(dur(e))}</div></div>
      <button class="ib" data-a="edit" data-id="${e.id}" aria-label="edit">✏️</button><button class="ib i" data-a="info" data-id="${e.id}" aria-label="info">i</button></div>`;
  }).join('');
  return `${header(t('nav_home'))}<main>
    <div class="daynav"><button class="icon-btn" data-a="prev">‹</button>
      <label class="lbl">${esc(label)}<input type="date" value="${U.day}" data-c="day"></label>
      <button class="icon-btn" data-a="next">›</button></div>
    ${banner}
    <div class="card">${donut(mapToItems(sl), fmtDur(total), t('total'))}<div class="legend">${legendRows(sl)}</div></div>
    ${list.length ? entries : `<div class="empty">${esc(t('empty')).replace(/\n/g, '<br>')}</div>`}
  </main>
  <div class="fabs"><button class="fab sec2" data-a="timer" aria-label="timer">⏱</button><button class="fab add" data-a="add" aria-label="add">＋</button></div>`;
}

function rangeKeys() {
  if (U.range === 'custom') {
    const a = U.from || addDays(labelOf(Date.now()), -6), b = U.to || labelOf(Date.now());
    return a <= b ? [a, b] : [b, a];
  }
  const n = +U.range, end = labelOf(Date.now());
  return [addDays(end, -(n - 1)), end];
}

function statsView() {
  const [a, b] = rangeKeys(), keys = [];
  for (let k = a, g = 0; k <= b && g < 4000; k = addDays(k, 1), g++) keys.push(k);
  const ex = new Set(S.settings.statEx);
  const perDay = keys.map(k => ({ k, m: sliceDay(k) }));
  const sum = {};
  perDay.forEach(d => Object.entries(d.m).forEach(([id, ms]) => { if (!ex.has(id)) sum[id] = (sum[id] || 0) + ms; }));
  const total = Object.values(sum).reduce((x, y) => x + y, 0);

  // столбики: по дням (до 31) или по месяцам
  const monthly = keys.length > 31;
  const buckets = [];
  perDay.forEach(d => {
    const bk = monthly ? d.k.slice(0, 7) : d.k;
    let bo = buckets[buckets.length - 1];
    if (!bo || bo.key !== bk) { bo = { key: bk, first: d.k, m: {} }; buckets.push(bo); }
    Object.entries(d.m).forEach(([id, ms]) => { if (!ex.has(id)) bo.m[id] = (bo.m[id] || 0) + ms; });
  });
  const bt = buckets.map(bo => Object.values(bo.m).reduce((x, y) => x + y, 0));
  const mx = Math.max(1, ...bt);
  const bars = buckets.map((bo, i) => {
    const segs = S.cats.concat([NOCAT()]).filter(c => bo.m[c.id] > 0)
      .map(c => `<div style="height:${bo.m[c.id] / mx * 130}px;background:${c.color}"></div>`).join('');
    return `<div class="bar" data-a="goday" data-day="${bo.first}"><div class="stack">${segs}</div></div>`;
  }).join('');
  const blab = buckets.map((bo, i) => {
    let txt = '';
    if (monthly) txt = parseKey(bo.first).toLocaleDateString(lang(), { month: 'short' }).slice(0, 3);
    else { const day = +bo.key.slice(8); txt = (buckets.length <= 16 || i % 3 === 0) ? String(day) : ''; }
    return `<span>${txt}</span>`;
  }).join('');

  const items = Object.entries(sum).filter(([, v]) => v > 0).sort((x, y) => y[1] - x[1]);
  const max = items.length ? items[0][1] : 1;
  const rank = items.map(([id, ms]) => {
    const c = getCat(id);
    return `<div class="rrow"><div class="top2"><span class="dot" style="background:${c.color}"></span><span>${esc(c.icon)}</span><span class="nm">${esc(c.name)}</span>
      <b>${U.statMode === 'percent' ? Math.round(ms / total * 100) + '%' : fmtDur(ms)}</b></div>
      <div class="track"><i style="width:${ms / max * 100}%;background:${c.color}"></i></div></div>`;
  }).join('');

  const chips = S.cats.map(c => `<button class="chip ${ex.has(c.id) ? 'off' : 'on'}" style="--c:${c.color}" data-a="toggleex" data-id="${c.id}">${esc(c.icon)} ${esc(c.name)}</button>`).join('');
  const periods = [['7', 'p7'], ['30', 'p30'], ['365', 'p365'], ['custom', 'pc']];

  return `${header(t('nav_stats'))}<main class="noFab">
    <div class="seg-tabs">${periods.map(([v, k]) => `<button class="${U.range === v ? 'on' : ''}" data-a="range" data-v="${v}">${t(k)}</button>`).join('')}</div>
    ${U.range === 'custom' ? `<div class="rangebar"><span>${t('from')}</span>${dateBtn(parseKey(a).getTime(), 'from')}<span>${t('to')}</span>${dateBtn(parseKey(b).getTime(), 'to')}</div>` : ''}
    <div class="card">
      <div class="seg-tabs" style="box-shadow:none;background:var(--bg)"><button class="${U.statView === 'circle' ? 'on' : ''}" data-a="sview" data-v="circle">${t('circle')}</button>
        <button class="${U.statView === 'rank' ? 'on' : ''}" data-a="sview" data-v="rank">${t('rank')}</button>
        <button class="${U.statMode === 'percent' ? 'on' : ''}" data-a="smode" data-v="percent">%</button>
        <button class="${U.statMode === 'time' ? 'on' : ''}" data-a="smode" data-v="time">${t('time')}</button></div>
      ${total <= 0 ? `<div class="empty">${t('no_data')}</div>` :
        (U.statView === 'circle'
          ? `${donut(mapToItems(sum), fmtDur(total), keys.length + ' ' + (lang() === 'ru' ? 'дн.' : 'd'))}<div class="legend">${legendRowsMode(sum)}</div>`
          : `<div class="rank">${rank}</div>`)}
    </div>
    <div class="card"><div class="sec" style="margin-top:0">${t('by_period')}</div>
      ${total <= 0 ? '' : `<div class="bars">${bars}</div><div class="barlabels">${blab}</div>`}</div>
    <div class="card"><div class="note" style="margin-top:0">${t('hide_hint')}</div><div class="chips">${chips}</div></div>
  </main>`;
}
function legendRowsMode(map) {
  const rows = Object.entries(map).filter(([, ms]) => ms > 0).sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((a, [, ms]) => a + ms, 0);
  return rows.map(([id, ms]) => {
    const c = getCat(id);
    const main = U.statMode === 'percent' ? Math.round(ms / total * 100) + '%' : fmtDur(ms);
    const sub = U.statMode === 'percent' ? fmtDur(ms) : Math.round(ms / total * 100) + '%';
    return `<div class="lrow"><span class="dot" style="background:${c.color}"></span><span>${esc(c.icon)}</span><span class="nm">${esc(c.name)}</span><span class="v">${sub}</span><span class="p" style="width:56px">${main}</span></div>`;
  }).join('');
}

const APPCOL = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#a855f7', '#06b6d4', '#ec4899'];
const OTHERCOL = '#94a3b8';

function appIcon(pkg) {
  const src = Screen.icon(pkg);
  return src ? `<img class="appic" src="${src}" alt="">` : `<span class="appic ph">📱</span>`;
}

function screenView() {
  const head = header(t('nav_screen'));
  if (!window.Android || !Screen.has()) {
    return `${head}<main class="noFab"><div class="card"><h2 style="margin:0 0 8px;font-size:18px">${t('scr_need_title')}</h2>
      <p class="note" style="font-size:15px;color:var(--text)">${esc(t('scr_need_text'))}</p>
      ${window.Android ? `<p class="note" style="font-size:14px">${esc(t('scr_steps')).replace(/\n/g, '<br>')}</p>
      <div class="btns"><button class="btn primary" data-a="sgrant">${t('scr_grant')}</button></div>` : `<p class="note">${t('scr_browser')}</p>`}
    </div></main>`;
  }
  const sc = S.screen, hid = new Set(sc.hidden), today = labelOf(Date.now());
  let keys = [];
  if (U.sper === '1') keys = [U.sday];
  else { const n = +U.sper; for (let i = n - 1; i >= 0; i--) keys.push(addDays(today, -i)); }
  const sum = {}, perDay = [];
  keys.forEach(k => {
    let tot = 0; const d = sc.days[k] || {};
    Object.entries(d).forEach(([pkg, ms]) => { if (hid.has(pkg)) return; sum[pkg] = (sum[pkg] || 0) + ms; tot += ms; });
    perDay.push({ k, tot });
  });
  const rows = Object.entries(sum).filter(([, ms]) => ms >= 30000).sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((a, [, ms]) => a + ms, 0);

  // круг: топ-6 + остальные
  const top = rows.slice(0, 6), rest = rows.slice(6).reduce((a, [, ms]) => a + ms, 0);
  const items = top.map(([, ms], i) => ({ ms, color: APPCOL[i] }));
  if (rest > 0) items.push({ ms: rest, color: OTHERCOL });
  const colorOf = i => (i < 6 ? APPCOL[i] : OTHERCOL);

  const shown = U.sall ? rows : rows.slice(0, 12);
  const max = rows.length ? rows[0][1] : 1;
  const list = shown.map(([pkg, ms]) => {
    const i = rows.findIndex(r => r[0] === pkg);
    return `<div class="approw">${appIcon(pkg)}<div class="am"><div class="top2"><span class="nm">${esc(sc.names[pkg] || pkg)}</span>
      <b>${fmtDur(ms)}</b><span class="pc">${Math.round(ms / total * 100)}%</span></div>
      <div class="track"><i style="width:${ms / max * 100}%;background:${colorOf(i)}"></i></div></div>
      <button class="ib x" data-a="hideapp" data-id="${esc(pkg)}" aria-label="hide">✕</button></div>`;
  }).join('');

  let nav = '';
  if (U.sper === '1') {
    const wd = parseKey(U.sday).toLocaleDateString(lang(), { weekday: 'short' });
    const label = U.sday === today ? t('today') : `${wd}, ${fmtDate(parseKey(U.sday).getTime())}`;
    nav = `<div class="daynav"><button class="icon-btn" data-a="sprev">‹</button><label class="lbl">${esc(label)}<input type="date" value="${U.sday}" data-c="sday"></label>
      <button class="icon-btn" data-a="snext" ${U.sday >= today ? 'disabled style="opacity:.3"' : ''}>›</button></div>`;
  }
  let bars = '';
  if (U.sper !== '1') {
    const mx = Math.max(1, ...perDay.map(d => d.tot));
    bars = `<div class="card"><div class="sec" style="margin-top:0">${t('by_period')}</div>
      <div class="bars">${perDay.map(d => `<div class="bar" data-a="sgoday" data-day="${d.k}"><div class="stack"><div style="height:${d.tot / mx * 130}px;background:var(--accent)"></div></div></div>`).join('')}</div>
      <div class="barlabels">${perDay.map((d, i) => `<span>${(perDay.length <= 8 || i % 3 === 0) ? +d.k.slice(8) : ''}</span>`).join('')}</div></div>`;
  }
  const per = [['1', 'p1'], ['7', 'p7'], ['30', 'p30']];
  return `${head}<main class="noFab">
    <div class="seg-tabs">${per.map(([v, k]) => `<button class="${U.sper === v ? 'on' : ''}" data-a="sper" data-v="${v}">${t(k)}</button>`).join('')}</div>
    ${nav}
    <div class="card">${total > 0
      ? `${donut(items, fmtDur(total), U.sper === '1' ? t('total') : keys.length + ' ' + t('scr_days'))}
         <div class="sec">${t('scr_apps_hint')}</div><div class="apps">${list}</div>
         ${rows.length > 12 ? `<div class="btns"><button class="btn" data-a="sall">${U.sall ? t('scr_less') : t('scr_show_all', rows.length)}</button></div>` : ''}`
      : `<div class="empty">${t('scr_no_data')}</div>`}</div>
    ${bars}
    <div class="note" style="padding:0 4px">${t('scr_note')}</div>
  </main>`;
}

function monthGrid() {
  const y = U.calY, mo = U.calM, first = new Date(y, mo, 1), lead = (first.getDay() + 6) % 7;
  const days = new Date(y, mo + 1, 0).getDate();
  const todayIso = isoDate(Date.now());
  const has = new Set(S.reminders.map(r => isoDate(r.at)));
  const wds = []; for (let i = 0; i < 7; i++) wds.push(new Date(2024, 0, 1 + i).toLocaleDateString(lang(), { weekday: 'short' }));
  let cells = wds.map(w => `<div class="wd">${esc(w)}</div>`).join('') + '<div></div>'.repeat(lead);
  for (let d = 1; d <= days; d++) {
    const iso = `${y}-${pad(mo + 1)}-${pad(d)}`;
    cells += `<button class="${iso === U.calSel ? 'sel' : ''} ${iso === todayIso ? 'today' : ''}" data-a="calday" data-iso="${iso}">${d}${has.has(iso) ? '<i></i>' : ''}</button>`;
  }
  let title = first.toLocaleDateString(lang(), { month: 'long', year: 'numeric' }).replace(/\s?г\.$/, ''); title = title.charAt(0).toUpperCase() + title.slice(1);
  return `<div class="card"><div class="calhead"><button class="icon-btn" data-a="calprev">‹</button><b>${esc(title)}</b><button class="icon-btn" data-a="calnext">›</button></div><div class="calgrid">${cells}</div></div>`;
}

function notesView() {
  let body = '';
  if (U.noteTab === 'notes') {
    body = S.notes.length
      ? [...S.notes].sort((a, b) => b.ts - a.ts).map(n => `<button class="noteitem" style="display:block;width:100%;text-align:left" data-a="editnote" data-id="${n.id}">${esc(n.text)}<small>${fmtDate(n.ts)} ${fmtTime(n.ts)}</small></button>`).join('')
      : `<div class="empty">${t('no_notes')}</div>`;
  } else {
    const list = S.reminders.filter(r => isoDate(r.at) === U.calSel).sort((a, b) => a.at - b.at);
    body = monthGrid() + (list.length
      ? list.map(r => `<div class="remitem ${r.at < Date.now() ? 'past' : ''}"><span class="rt">${fmtTime(r.at)}</span><span class="rx">${esc(r.title)}</span>
          <button class="ib icon-btn" data-a="delrem" data-id="${r.id}">🗑️</button></div>`).join('')
      : `<div class="empty">${t('no_rem')}</div>`);
  }
  return `${header(t('nav_notes'))}<main class="noFab">
    <div class="seg-tabs"><button class="${U.noteTab === 'notes' ? 'on' : ''}" data-a="ntab" data-v="notes">📝 ${t('notes_tab')}</button>
      <button class="${U.noteTab === 'rem' ? 'on' : ''}" data-a="ntab" data-v="rem">🔔 ${t('rem_tab')}</button></div>
    ${body}</main>
  <div class="small-fab"><button class="fab add" data-a="${U.noteTab === 'notes' ? 'addnote' : 'addrem'}">＋</button></div>`;
}

function settingsView() {
  const s = S.settings, hours = [20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6, 7, 8];
  const hl = h => fmtTime(new Date(2024, 0, 1, h, 0).getTime());
  const now = Date.now();
  const sample = fmtDate(now);
  return `${header(t('settings'), false).replace('<h1>', '<button class="icon-btn" data-a="back">‹</button><h1>')}<main class="noFab">
    <div class="card">
      <div class="setrow"><span>${t('language')}</span><select class="field" data-a="set" data-k="lang">
        <option value="system" ${s.lang === 'system' ? 'selected' : ''}>${t('sys')}</option><option value="ru" ${s.lang === 'ru' ? 'selected' : ''}>Русский</option><option value="en" ${s.lang === 'en' ? 'selected' : ''}>English</option></select></div>
      <div class="setrow"><span>${t('date_format')}<br><small style="color:var(--muted)">${sample}</small></span><select class="field" data-a="set" data-k="dateFmt">
        ${['DD.MM.YYYY', 'YYYY.MM.DD', 'MM.DD.YYYY'].map(f => `<option ${s.dateFmt === f ? 'selected' : ''}>${f}</option>`).join('')}</select></div>
      <div class="setrow"><span>${t('time_format')}<br><small style="color:var(--muted)">${fmtTime(now)}</small></span><select class="field" data-a="set" data-k="timeFmt">
        <option value="24" ${s.timeFmt === '24' ? 'selected' : ''}>${t('h24')}</option><option value="12" ${s.timeFmt === '12' ? 'selected' : ''}>${t('h12')}</option></select></div>
      <div class="setrow"><span>${t('day_start')}</span><select class="field" data-a="set" data-k="dayStart">
        ${hours.map(h => `<option value="${h}" ${s.dayStart === h ? 'selected' : ''}>${hl(h)}</option>`).join('')}</select></div>
      <div class="note">${t('day_start_hint')}</div>
    </div>
    <div class="card"><div class="sec" style="margin-top:0">${t('cats')}</div>
      ${S.cats.map(c => `<div class="crow"><span class="ci" style="background:${c.color}">${esc(c.icon)}</span><span class="nm">${esc(c.name)}</span>
        <button class="icon-btn" data-a="editcat" data-id="${c.id}">✏️</button></div>`).join('')}
      <div class="btns"><button class="btn primary" data-a="addcat">＋ ${t('add')}</button></div></div>
    <div class="card"><div class="sec" style="margin-top:0">${t('scr_hidden')}</div>
      ${S.screen.hidden.length ? S.screen.hidden.map(pkg => `<div class="crow">${appIcon(pkg)}<span class="nm">${esc(S.screen.names[pkg] || pkg)}</span>
        <button class="btn" data-a="unhide" data-id="${esc(pkg)}">${t('scr_restore')}</button></div>`).join('') : `<div class="note">${t('scr_no_hidden')}</div>`}</div>
  </main>`;
}

function render() {
  const keep = $('main') ? $('main').scrollTop : 0;
  let body;
  if (U.view === 'stats') body = statsView();
  else if (U.view === 'notes') body = notesView();
  else if (U.view === 'screen') body = screenView();
  else if (U.view === 'settings') body = settingsView();
  else body = homeView();
  const navOn = k => (U.view === k ? 'on' : '');
  $('#app').innerHTML = `${body}<nav>
    <button class="${navOn('stats')}" data-a="nav" data-v="stats"><span class="ni">📅</span>${t('nav_stats')}</button>
    <button class="${navOn('home')}" data-a="nav" data-v="home"><span class="ni">⏱️</span>${t('nav_home')}</button>
    <button class="${navOn('screen')}" data-a="nav" data-v="screen"><span class="ni">📱</span>${t('nav_screen')}</button>
    <button class="${navOn('notes')}" data-a="nav" data-v="notes"><span class="ni">📝</span>${t('nav_notes')}</button></nav>`;
  document.documentElement.lang = lang();
  if ($('main')) $('main').scrollTop = keep;
}

/* ---------- категории ---------- */
function catEditor(id) {
  const c = id ? S.cats.find(x => x.id === id) : null;
  const f = { name: c ? c.name : '', icon: c ? c.icon : EMOJIS[0], color: c ? c.color : COLORS[0], err: '' };
  openModal(() => `<h2>${c ? t('edit_cat') : t('new_cat')}</h2>
    <div class="row"><span class="ci crow" style="width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font-size:24px;background:${f.color}">${esc(f.icon)}</span>
      <input class="field" id="cname" placeholder="${t('name')}" value="${esc(f.name)}" maxlength="30"></div>
    <div class="note">${t('icon')}</div><div class="emojis">${EMOJIS.map(e => `<button class="${f.icon === e ? 'on' : ''}" data-m="ic" data-v="${e}">${e}</button>`).join('')}</div>
    <div class="note">${t('color')}</div><div class="swatches">${COLORS.map(k => `<button class="${f.color === k ? 'on' : ''}" style="--c:${k}" data-m="co" data-v="${k}"></button>`).join('')}</div>
    ${f.err ? `<p class="err">${esc(f.err)}</p>` : ''}
    <div class="btns">${c ? `<button class="btn danger" data-m="del">${t('delete')}</button>` : `<button class="btn" data-m="x">${t('cancel')}</button>`}<button class="btn primary" data-m="save">${t('save')}</button></div>`,
    (a, el, m) => {
      if (a === 'ic') { f.icon = el.dataset.v; m.update(); }
      else if (a === 'co') { f.color = el.dataset.v; m.update(); }
      else if (a === 'x') m.close();
      else if (a === 'del') confirmBox(t('confirm_del'), () => { S.cats = S.cats.filter(x => x.id !== c.id); save(); m.close(); render(); });
      else if (a === 'save') {
        if (!f.name.trim()) { f.err = t('err_name'); m.update(); return; }
        if (c) { c.name = f.name.trim(); c.icon = f.icon; c.color = f.color; }
        else S.cats.push({ id: 'c' + uid(), name: f.name.trim(), icon: f.icon, color: f.color });
        save(); m.close(); render();
      }
    }, { sync: m => { const i = $('#cname', m.box); if (i) f.name = i.value; } });
}

/* ---------- заметки и напоминания ---------- */
function noteEditor(id) {
  const n = id ? S.notes.find(x => x.id === id) : null;
  const f = { text: n ? n.text : '', err: '' };
  openModal(() => `<h2>${n ? t('note_edit') : t('note_new')}</h2>
    <textarea class="field" id="ntext" placeholder="${t('note_ph')}">${esc(f.text)}</textarea>
    ${f.err ? `<p class="err">${esc(f.err)}</p>` : ''}
    <div class="btns">${n ? `<button class="btn danger" data-m="del">${t('delete')}</button>` : `<button class="btn" data-m="x">${t('cancel')}</button>`}<button class="btn primary" data-m="save">${t('save')}</button></div>`,
    (a, el, m) => {
      f.text = $('#ntext', m.box).value;
      if (a === 'x') m.close();
      else if (a === 'del') confirmBox(t('confirm_del'), () => { S.notes = S.notes.filter(x => x.id !== n.id); save(); m.close(); render(); });
      else if (a === 'save') {
        if (!f.text.trim()) { f.err = t('err_title'); m.update(); return; }
        if (n) { n.text = f.text.trim(); n.ts = Date.now(); } else S.notes.push({ id: uid(), text: f.text.trim(), ts: Date.now() });
        save(); m.close(); render();
      }
    }, { sync: m => { const i = $('#ntext', m.box); if (i) f.text = i.value; } });
}

function reminderEditor() {
  const base = parseKey(U.calSel); const now = new Date();
  let at = new Date(base.getFullYear(), base.getMonth(), base.getDate(), now.getHours() + 1, 0).getTime();
  const f = { title: '', at, err: '' };
  openModal(() => `<h2>${t('rem_new')}</h2>
    <input class="field" id="rtitle" placeholder="${t('rem_title')}" value="${esc(f.title)}" maxlength="120">
    <div class="row"><span class="lab">${t('date')}</span>${dateBtn(f.at, 'rd')}</div>
    <div class="row"><span class="lab">${t('time_lbl')}</span>${timeBtn(f.at, 'rt')}</div>
    ${f.err ? `<p class="err">${esc(f.err)}</p>` : ''}
    <div class="btns"><button class="btn" data-m="x">${t('cancel')}</button><button class="btn primary" data-m="save">${t('save')}</button></div>`,
    async (a, el, m) => {
      if (a === 'x') m.close();
      else if (a === 'rt') { const r = await pickTime(f.at, t('time_lbl')); if (r) { f.at = setTimePart(f.at, r.h, r.m); m.update(); } }
      else if (a === 'save') {
        if (!f.title.trim()) { f.err = t('err_title'); m.update(); return; }
        S.reminders.push({ id: uid(), title: f.title.trim(), at: f.at });
        save(); Native.syncReminders();
        U.calSel = isoDate(f.at); U.calY = new Date(f.at).getFullYear(); U.calM = new Date(f.at).getMonth();
        m.close(); render();
      }
    },
    {
      sync: m => { const i = $('#rtitle', m.box); if (i) f.title = i.value; },
      onChange: (k, v, m) => { if (k === 'rd' && v) { f.at = setDatePart(f.at, v); m.update(); } }
    });
}

/* ---------- обработка нажатий ---------- */
document.addEventListener('click', e => {
  const a = e.target.closest('#app [data-a]'); if (!a) return;
  const act = a.dataset.a, id = a.dataset.id, v = a.dataset.v;
  switch (act) {
    case 'nav': U.view = v; render(); if (v === 'screen') refreshScreen(true); break;
    case 'sgrant': Screen.open(); break;
    case 'sper': U.sper = v; U.sall = false; render(); break;
    case 'sprev': U.sday = addDays(U.sday, -1); render(); break;
    case 'snext': if (U.sday < labelOf(Date.now())) { U.sday = addDays(U.sday, 1); render(); } break;
    case 'sall': U.sall = !U.sall; render(); break;
    case 'sgoday': U.sper = '1'; U.sday = a.dataset.day; render(); break;
    case 'hideapp': confirmBox(t('scr_hide'), () => { if (!S.screen.hidden.includes(id)) S.screen.hidden.push(id); save(); render(); }); break;
    case 'unhide': S.screen.hidden = S.screen.hidden.filter(x => x !== id); save(); render(); break;
    case 'settings': U.view = 'settings'; render(); break;
    case 'back': U.view = 'home'; render(); break;
    case 'prev': U.day = addDays(U.day, -1); render(); break;
    case 'next': U.day = addDays(U.day, 1); render(); break;
    case 'timer': startTimerFlow(); break;
    case 'add': entryEditor(null); break;
    case 'edit': entryEditor(id); break;
    case 'info': entryInfo(id); break;
    case 'tpause': pauseResumeTimer(); break;
    case 'tstop': stopTimer(); break;
    case 'range': U.range = v; render(); break;
    case 'sview': U.statView = v; render(); break;
    case 'smode': U.statMode = v; render(); break;
    case 'toggleex': {
      const ex = new Set(S.settings.statEx); ex.has(id) ? ex.delete(id) : ex.add(id);
      S.settings.statEx = [...ex]; save(); render(); break;
    }
    case 'goday': U.day = a.dataset.day; U.view = 'home'; render(); break;
    case 'ntab': U.noteTab = v; render(); break;
    case 'addnote': noteEditor(null); break;
    case 'editnote': noteEditor(id); break;
    case 'addrem': reminderEditor(); break;
    case 'delrem': confirmBox(t('confirm_del'), () => { S.reminders = S.reminders.filter(r => r.id !== id); save(); Native.syncReminders(); render(); }); break;
    case 'calprev': U.calM--; if (U.calM < 0) { U.calM = 11; U.calY--; } render(); break;
    case 'calnext': U.calM++; if (U.calM > 11) { U.calM = 0; U.calY++; } render(); break;
    case 'calday': U.calSel = a.dataset.iso; render(); break;
    case 'addcat': catEditor(null); break;
    case 'editcat': catEditor(id); break;
  }
});

document.addEventListener('change', e => {
  const el = e.target.closest('#app [data-a="set"]');
  if (el) {
    const k = el.dataset.k;
    S.settings[k] = k === 'dayStart' ? +el.value : el.value;
    if (k === 'dayStart') { S.screen.days = {}; S.screen.ds = S.settings.dayStart; S.screen.lastFull = 0; }
    save(); render(); return;
  }
  const dc = e.target.closest('#app [data-c]');
  if (!dc || !dc.value) return;
  if (dc.dataset.c === 'day') { U.day = dc.value; render(); }
  if (dc.dataset.c === 'sday') { U.sday = dc.value > labelOf(Date.now()) ? labelOf(Date.now()) : dc.value; render(); }
  if (dc.dataset.c === 'from') { U.from = dc.value; U.range = 'custom'; if (!U.to) U.to = labelOf(Date.now()); render(); }
  if (dc.dataset.c === 'to') { U.to = dc.value; U.range = 'custom'; if (!U.from) U.from = addDays(dc.value, -6); render(); }
});

/* ---------- системные события ---------- */
window.onBack = () => {
  if (modals.length) { const m = modals[modals.length - 1]; m.close(); return true; }
  if (U.view !== 'home') { U.view = 'home'; render(); return true; }
  return false;
};
function refreshScreen(full) {
  // показываем экран сразу, данные подтягиваем следом
  setTimeout(() => { if (syncScreen(full) && U.view === 'screen') render(); }, 30);
}
window.onNativeResume = () => { render(); checkFinished(); if (U.view === 'screen') refreshScreen(false); };
document.addEventListener('visibilitychange', () => { if (!document.hidden) window.onNativeResume(); });

setInterval(() => {
  const el = $('#tick'); if (!el) return;
  const st = Native.getTimer();
  if (!st || st.finished) { render(); checkFinished(); return; }
  el.textContent = fmtClock(timerElapsed(st));
}, 1000);

setInterval(() => { if (U.view === 'screen' && !document.hidden && !modals.length) refreshScreen(false); }, 60000);

render();
checkFinished();
Native.syncReminders();
