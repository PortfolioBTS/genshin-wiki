// ── banners.js ────────────────────────────────────────────────────────────────

document.getElementById('banners-grid').innerHTML = BANNERS.map(b => `
  <div class="banner-card">
    <div class="banner-top">
      <span class="banner-emoji">${b.emoji}</span>
      <div><h4>${b.name}</h4><div class="b-type">${b.type}</div></div>
    </div>
    <div class="banner-body">
      <div class="banner-chars">
        ${b.five.map(c => `<span class="banner-char-tag five">⭐ ${c}</span>`).join('')}
        ${b.four.map(c => `<span class="banner-char-tag">★ ${c}</span>`).join('')}
      </div>
      <div class="banner-dates">🗓 ${b.dates}</div>
    </div>
  </div>`).join('');

const EVENTS = [
  { icon: '🔥', title: 'Пламя Испытания',   desc: 'Сражайтесь в испытаниях Натлана и получите ограниченные косметические предметы.',        date: '01.05 — 21.05', reward: 'До 800 Примогемов' },
  { icon: '🎵', title: 'Мелодия Фонтена',   desc: 'Музыкальный ивент в Фонтене — собери инструменты и сыграй уникальные партитуры.',         date: '05.05 — 20.05', reward: 'Косметика + Примогемы' },
  { icon: '🌿', title: 'Цветение Сумеру',   desc: 'Обследуй джунгли Сумеру, собери Дендро-цветы для фестивального обмена.',                  date: '10.05 — 25.05', reward: '4★ персонаж на выбор' },
  { icon: '⚡', title: 'Испытание Бездны',  desc: 'Обновление Спирального Утёса — новые враги, новые баффы сезона.',                         date: '01.05 — 15.06', reward: 'До 1200 Примогемов' },
  { icon: '🎁', title: 'Вход каждый день',  desc: 'Получайте ежедневные награды за вход в течение всей версии 5.7.',                         date: '01.05 — 11.06', reward: '10 Примогемов за вход' },
];

document.getElementById('events-list').innerHTML = EVENTS.map(e => `
  <div class="event-card">
    <div class="event-icon">${e.icon}</div>
    <div class="event-body">
      <h4>${e.title}</h4>
      <p>${e.desc}</p>
    </div>
    <div class="event-date">
      <div>${e.date}</div>
      <div class="event-reward">🏆 ${e.reward}</div>
    </div>
  </div>`).join('');

const u = getUser();
if (u) { document.getElementById('auth-btn').textContent = '👤 ' + u.name; }
