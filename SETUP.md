# Genshin Wiki — Инструкция по настройке EmailJS

## Что нужно сделать ОДИН РАЗ перед запуском

---

### Шаг 1 — Регистрация на EmailJS
1. Перейди на https://www.emailjs.com
2. Нажми **Sign Up** → зарегистрируйся (бесплатно, 200 писем/месяц)

---

### Шаг 2 — Подключи Gmail
1. В панели EmailJS → **Email Services** → **Add New Service**
2. Выбери **Gmail**
3. Нажми **Connect Account** → войди в **time10619@gmail.com**
4. Скопируй **Service ID** (например: `service_abc123`)
5. Открой файл `emailjs-config.js` и вставь его в строку `SERVICE_ID`

---

### Шаг 3 — Создай шаблон A: подтверждение регистрации

1. **Email Templates** → **Create New Template**
2. Заполни поля:
   - **To Email:** `{{to_email}}`
   - **From Name:** `Genshin Wiki`
   - **Subject:** `Genshin Wiki — код подтверждения {{code}}`
   - **Body (HTML или Text):**
     ```
     Привет, {{user_name}}!

     Твой код подтверждения для Genshin Wiki:

     ┌─────────────────┐
     │    {{code}}     │
     └─────────────────┘

     Код действует 10 минут.
     Если ты не регистрировался — просто проигнорируй это письмо.

     С уважением,
     Genshin Wiki
     ```
3. Нажми **Save** → скопируй **Template ID** (например: `template_verify123`)
4. Вставь в `emailjs-config.js` в строку `TEMPLATE_VERIFY`

---

### Шаг 4 — Создай шаблон B: заявки пользователей

1. **Email Templates** → **Create New Template**
2. Заполни поля:
   - **To Email:** `time10619@gmail.com`  ← ВАЖНО: жёстко прописать!
   - **From Name:** `Genshin Wiki`
   - **Subject:** `[Genshin Wiki] Новая заявка — {{page}} от {{user_name}}`
   - **Body:**
     ```
     Новая заявка от пользователя!

     От кого:   {{user_name}} ({{user_email}})
     Страница:  {{page}}
     Категория: {{category}}
     Объект:    {{item}}
     Дата:      {{date}}

     ───────────────────────────────
     Текст заявки:
     {{message}}
     ───────────────────────────────
     ```
3. Нажми **Save** → скопируй **Template ID** (например: `template_proposal456`)
4. Вставь в `emailjs-config.js` в строку `TEMPLATE_PROPOSAL`

---

### Шаг 5 — Public Key

1. В EmailJS → **Account** → **General** → **Public Key**
2. Скопируй ключ (например: `user_abc123xyz`)
3. Вставь в `emailjs-config.js` в строку `PUBLIC_KEY`

---

### Итоговый вид файла emailjs-config.js

```js
const EMAILJS_CONFIG = {
  PUBLIC_KEY:        'user_abc123xyz',
  SERVICE_ID:        'service_abc123',
  TEMPLATE_VERIFY:   'template_verify123',
  TEMPLATE_PROPOSAL: 'template_proposal456',
  ADMIN_EMAIL:       'time10619@gmail.com',
};
```

---

### Демо-режим (без настройки)
Если EmailJS не настроен — сайт работает в **демо-режиме**:
- Код подтверждения показывается прямо на экране (красный баннер)
- Заявки сохраняются в localStorage браузера, но НЕ отправляются на почту
- Всё остальное работает полностью

---

### Структура файлов

```
genshin-wiki/
├── index.html          ← Главная страница
├── characters.html     ← Персонажи
├── weapons.html        ← Оружие
├── artifacts.html      ← Артефакты
├── regions.html        ← Регионы
├── guides.html         ← Гайды
├── patches.html        ← Патчноуты
├── banners.html        ← Баннеры и события
├── auth.html           ← Регистрация / вход (standalone)
├── style.css           ← Общие стили
├── data.js             ← Данные + утилиты
├── emailjs-config.js   ← ⚠️ ЗАПОЛНИ ЭТОТ ФАЙЛ
└── SETUP.md            ← Эта инструкция
```
