# Genshin Wiki — план реализации переработки

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перевести фан-вики на Vite + ES-модули с данными из `genshin-db`, новым интерфейсом (иконки, фильтры в URL, страница персонажа, поиск), честными демо-аккаунтами на PBKDF2 и деплоем на GitHub Pages.

**Architecture:** Многостраничный сайт: каждая HTML-страница в корне подключает свой модуль из `src/pages/`. Общие `<head>`, шапку и подвал подставляет при сборке плагин Vite из `partials/`. Данные генерирует скрипт `scripts/data/` в `src/data/generated/*.json` (их коммитим); вручную написанный контент лежит в `src/data/content/`. Чистая логика живёт в `src/lib/` и покрыта Vitest; HTML-шаблоны лежат в `src/components/`.

**Tech Stack:** Node 22, Vite (последняя стабильная), Vitest + jsdom, ESLint 9+ (flat config) + Prettier, `@emailjs/browser`, `genshin-db@5.2.14` (только в `scripts/data`), GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-25-genshin-wiki-redesign-design.md`

## Global Constraints

- Язык интерфейса и текстов — русский; имена в коде, файлах и коммитах — английские.
- `genshin-db` фиксируется точной версией `5.2.14` в `scripts/data/package.json` и **не** попадает в корневой `package.json`.
- Vite: `base: './'`; все страницы перечислены в `build.rollupOptions.input`.
- Любая строка в шаблоне для `innerHTML` проходит через `escapeHtml()`; исключение — поля `html` из сгенерированных данных (их очищает `cleanText`).
- Ключи localStorage сохраняются: `gw_user`, `gw_users`, `gw_proposals`; новый ключ — `gw_view_<page>`.
- Переменные EmailJS: `VITE_EMAILJS_PUBLIC_KEY`, `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_VERIFY`, `VITE_EMAILJS_TEMPLATE_PROPOSAL`. Личного email в репозитории нет.
- PBKDF2-SHA-256, 600 000 итераций, соль 16 байт, хеш и соль в hex.
- Дата актуальности ручных данных: `25.10.2026`.
- Источники изображений по порядку: HoYoLAB (`upload-os-bbs.mihoyo.com`), затем `enka.network/ui/<file>.png`, затем заглушка.
- Никаких атрибутов `onclick`/`oninput` в HTML: только обработчики, навешанные в JS.
- Каждый коммит заканчивается строками:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` и
  `Claude-Session: https://claude.ai/code/session_017Bnzivt6T8dNNqy4E9yCRw`.
- Пушить только в `claude/youthful-hawking-gocqmg`.

## Review Focus

1. Мусор в URL (`?el=foo&rarity=9`, `?id=../../x`, `?id=` без значения): значение падает на дефолт, а неизвестный персонаж даёт заглушку «не найден», а не пустую страницу или исключение. → тесты в Task 3 (`parseQuery`) и Task 10 (`findCharacter`).
2. Поиск с `ё`/`е`, регистром и лишними пробелами (`"  АЛЕША "` находит «Алёша»). → тесты в Task 3 (`normalize`) и Task 12 (`searchIndex`).
3. Все хосты картинок недоступны: показывается заглушка с буквой, нет значка битой картинки и бесконечного цикла `error`. → тест в Task 7 (`installImageFallbacks`).
4. Сеты только с бонусом за 1 предмет (сеты «Шаман …») и оружие без доп. стата: в разметке нет `undefined`/`null`. → тесты в Task 4 (`toArtifact`) и Task 9 (`artifactCardHtml`).
5. localStorage недоступен или содержит битый JSON (приватный режим, ручная правка): страницы рендерятся, `getCurrentUser()` возвращает `null`, auth показывает ошибку вместо падения. → тесты в Task 1 (`readJson`) и Task 14 (`getUsers`).

---

## Этап 1. Фундамент

### Task 1: Каркас Vite, линтер, тесты, CI, базовые библиотеки

**Files:**
- Create: `package.json`, `vite.config.js`, `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `.gitignore`, `.env.example`, `.github/workflows/ci.yml`
- Create: `src/lib/escape-html.js`, `src/lib/storage.js`, `src/lib/session.js`
- Test: `tests/lib/escape-html.test.js`, `tests/lib/storage.test.js`, `tests/lib/session.test.js`

**Interfaces:**
- Produces:
  - `escapeHtml(value: unknown) -> string` (`null`/`undefined` → `''`; экранирует `& < > " '`)
  - `readJson(key: string, fallback: T) -> T` (исключение доступа к хранилищу или битый JSON → `fallback`)
  - `writeJson(key: string, value: unknown) -> boolean`
  - `getCurrentUser() -> {name, email, joined} | null` (ключ `gw_user`; если `name` или `email` не строка → `null`), `setCurrentUser(user)`, `clearCurrentUser()`
  - npm-скрипты: `dev`, `build`, `preview`, `test` (`vitest run`), `test:watch`, `lint` (`eslint .`), `format` (`prettier --write .`), `format:check`, `data:update` (`npm --prefix scripts/data ci && node scripts/data/build-data.mjs`)

- [ ] **Step 1: Инициализировать проект.** `package.json` с `"type": "module"`, `"private": true`, `"engines": {"node": ">=22"}` и скриптами выше. Установить `vite vitest jsdom eslint @eslint/js globals prettier eslint-config-prettier` в devDependencies и `@emailjs/browser` в dependencies (последние стабильные; версии зафиксирует `package-lock.json`).
- [ ] **Step 2: Конфиги.**
  - `vite.config.js`: `base: './'`, `input` пока только `index.html`; в Task 2 он станет списком страниц. Блок `test: { include: ['tests/**/*.test.js'] }`.
  - `eslint.config.js`: `@eslint/js` recommended + `eslint-config-prettier`; `globals.browser` для `src/**`, `globals.node` для `scripts/**`, `build/**` и `*.config.js`; игнор: `dist`, `node_modules`, `scripts/data/node_modules`, `src/data/generated`, старые корневые `*.js`, которые удалит Task 16 (`data.js`, `auth.js`, `characters.js`, `weapons.js`, `artifacts.js`, `regions.js`, `guides.js`, `patches.js`, `banners.js`, `index.js`, `shared.js`, `emailjs-config.js`).
  - `.prettierrc.json`: `{ "singleQuote": true, "printWidth": 100 }`; `.prettierignore` — те же пути плюс `*.css` и `*.html` из корня до Task 16, а также `docs/`.
  - `.gitignore`: `node_modules/`, `dist/`, `.env`, `scripts/data/node_modules/`.
  - `.env.example`: четыре переменные `VITE_EMAILJS_*` с пустыми значениями и комментарием, что без них работает демо-режим.
- [ ] **Step 3: Написать падающие тесты.**

```js
// tests/lib/escape-html.test.js
expect(escapeHtml('<img src=x onerror="a">&\'')).toBe('&lt;img src=x onerror=&quot;a&quot;&gt;&amp;&#39;');
expect(escapeHtml(null)).toBe('');
expect(escapeHtml(42)).toBe('42');

// tests/lib/storage.test.js (@vitest-environment jsdom)
localStorage.setItem('k', '{bad json');
expect(readJson('k', [])).toEqual([]);
vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
expect(readJson('k', 'fb')).toBe('fb');
vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
expect(writeJson('k', 1)).toBe(false);

// tests/lib/session.test.js (@vitest-environment jsdom)
localStorage.setItem('gw_user', JSON.stringify({ name: 5 }));
expect(getCurrentUser()).toBeNull();
setCurrentUser({ name: 'Аня', email: 'a@b.c', joined: '01.01.2026' });
expect(getCurrentUser().name).toBe('Аня');
clearCurrentUser();
expect(getCurrentUser()).toBeNull();
```

- [ ] **Step 4: Запустить, убедиться, что тесты падают.** `npm test` → FAIL (модулей нет).
- [ ] **Step 5: Реализовать** три модуля в `src/lib/`.
- [ ] **Step 6: Проверить.** `npm test` → PASS; `npm run lint` → 0 ошибок; `npm run format:check` → OK.
- [ ] **Step 7: CI.** `.github/workflows/ci.yml`: на `push` и `pull_request`; ubuntu-latest, `actions/checkout`, `actions/setup-node` (node 22, cache npm), `npm ci`, `npm run lint`, `npm run format:check`, `npm test`, `npm run build`. Взять актуальные мажорные версии actions (проверить через GitHub `get_latest_release` для `actions/checkout` и `actions/setup-node`).
- [ ] **Step 8: Коммит.** `chore: scaffold Vite project with lint, tests and CI`

### Task 2: Плагин partials и общие куски страницы

**Files:**
- Create: `build/partials-plugin.js`, `partials/head.html`, `partials/header.html`, `partials/footer.html`, `public/favicon.svg`
- Modify: `vite.config.js`
- Test: `tests/build/partials-plugin.test.js`

**Interfaces:**
- Produces:
  - `applyPartials(html: string, { partials: Record<string, string>, page: string }) -> string`: заменяет каждый `<!-- include:NAME -->` на `partials[NAME]` (неизвестное имя → `Error('Unknown partial: NAME')`), затем в ссылке `<a … data-nav="X">`, где `X === navFor(page)`, добавляет `class="active"` (к существующему классу через пробел) и `aria-current="page"`.
  - `navFor(page: string) -> string`: `'character.html'` → `'characters.html'`, иначе `page`.
  - `partialsPlugin({ dir: string }) -> VitePlugin`: в `transformIndexHtml(html, ctx)` читает `dir/*.html` (заново при каждом вызове, чтобы dev-сервер подхватывал правки) и вызывает `applyPartials` с `page = path.basename(ctx.filename)`.
  - `PAGES` в `vite.config.js` — массив имён страниц, из которого строится `input`. Сейчас `['index']`; каждая задача, переносящая страницу, дописывает её имя (Task 9, 10, 11, 15). Ещё не перенесённые страницы в сборку не попадают.
  - Разметка шапки (используется в Task 7 и Task 12):
    - `<header class="site-header">` с логотипом `a.logo`;
    - `button#nav-toggle.nav-toggle` с `aria-expanded="false"` и `aria-controls="site-nav"`;
    - `nav#site-nav` с 8 ссылками `data-nav="index.html"` … `data-nav="banners.html"`;
    - `div.site-search` с `input#site-search[type=search]` и `ul#site-search-results[role=listbox][hidden]`;
    - `a#auth-btn.btn-reg[href=auth.html]` с текстом «Войти».
  - Подвал: колонки ссылок, как сейчас; строка `Данные актуальны на <span data-as-of></span>`; дисклеймер HoYoverse.
  - `head.html`: charset, viewport, `<link rel="icon" href="/favicon.svg">`, preconnect и подключение Google Fonts (Cinzel и Inter, как сейчас).

- [ ] **Step 1: Тесты.**

```js
const partials = { head: '<meta x>', header: '<nav><a data-nav="index.html">Г</a><a class="n" data-nav="characters.html">П</a></nav>' };
const out = applyPartials('<!-- include:head --><!-- include:header -->', { partials, page: 'character.html' });
expect(out).toContain('<meta x>');
expect(out).toContain('<a class="n active" aria-current="page" data-nav="characters.html">');
expect(out).not.toMatch(/data-nav="index.html"[^>]*active/);
expect(() => applyPartials('<!-- include:nope -->', { partials, page: 'index.html' })).toThrow('Unknown partial: nope');
```

- [ ] **Step 2: Запустить** `npx vitest run tests/build` → FAIL.
- [ ] **Step 3: Реализовать** плагин и partials; подключить `partialsPlugin({ dir: 'partials' })` в `vite.config.js` и собирать `input` из `PAGES`.
- [ ] **Step 4: Проверить.** `npm test` → PASS; `npm run lint` → OK.
- [ ] **Step 5: Коммит.** `feat: add build-time partials for head, header and footer`

### Task 3: Общая логика: подписи, нормализация текста, версии, состояние URL, фильтры

**Files:**
- Create: `src/lib/labels.js`, `src/lib/text.js`, `src/lib/versions.js`, `src/lib/url-state.js`, `src/lib/filters.js`
- Test: `tests/lib/text.test.js`, `tests/lib/versions.test.js`, `tests/lib/url-state.test.js`, `tests/lib/filters.test.js`

**Interfaces:**
- Produces:
  - `ELEMENTS`: `{ pyro: {label:'Пиро', icon:'🔥'}, hydro: {label:'Гидро', icon:'💧'}, anemo: {label:'Анемо', icon:'🌬️'}, electro: {label:'Электро', icon:'⚡'}, cryo: {label:'Крио', icon:'❄️'}, geo: {label:'Гео', icon:'⛰️'}, dendro: {label:'Дендро', icon:'🌿'}, none: {label:'Без стихии', icon:'✦'} }`
  - `WEAPON_TYPES`: `{ sword:'Одноручный меч', claymore:'Двуручный меч', polearm:'Древковое', bow:'Лук', catalyst:'Катализатор' }`
  - `REGIONS`: `{ mondstadt:'Мондштадт', liyue:'Ли Юэ', inazuma:'Инадзума', sumeru:'Сумеру', fontaine:'Фонтейн', natlan:'Натлан', nodkrai:'Нод-Край', snezhnaya:'Снежная', other:'Другое' }` (порядок ключей — порядок показа)
  - `normalize(s: string) -> string`: нижний регистр, `ё`→`е`, trim, схлопывание пробелов
  - `matchesQuery(query: string, ...fields: string[]) -> boolean`: пустой запрос → `true`; иначе нормализованный запрос — подстрока хотя бы одного нормализованного поля
  - `compareVersions(a: string, b: string) -> number`: сравнение по числам `major.minor`
  - `latestVersion(versions: string[]) -> string | null`
  - `parseQuery(search: string, schema) -> Record<string,string>`. Схема: `{ key: { default: string, values?: string[] } }`. Значение не из `values` → `default`. Без `values` — любая строка: trim, обрезка до 50 символов.
  - `toQuery(state, schema) -> string`: `''` или `'?a=1&b=2'`, без ключей, равных дефолту, в порядке ключей схемы
  - `filterCharacters(list, {el, rarity, weapon, region, q})`: `'all'` пропускает всё, `rarity` — строка `'4'`/`'5'`; `q` ищет по `name`, `title`, `REGIONS[region]`, `WEAPON_TYPES[weapon]`
  - `sortCharacters(list, sort: 'name' | 'new')`: возвращает новый массив; `'name'` — `localeCompare(…, 'ru')`; `'new'` — версия по убыванию, при равенстве — по имени
  - `filterWeapons(list, {type, rarity, q})`: `q` ищет по `name` и `passive?.name`
  - `filterArtifacts(list, {rarity, q})`: `q` ищет по `name`

- [ ] **Step 1: Тесты.**

```js
expect(normalize('  АЛЁША   Тест ')).toBe('алеша тест');
expect(matchesQuery('алеша', 'Алёша')).toBe(true);
expect(matchesQuery('', 'x')).toBe(true);

expect(compareVersions('6.10', '6.9')).toBeGreaterThan(0);
expect(latestVersion(['5.7', '7.1', '6.10', '7.0'])).toBe('7.1');
expect(latestVersion([])).toBeNull();

const schema = { el: { default: 'all', values: ['all', 'pyro', 'cryo'] }, rarity: { default: 'all', values: ['all', '4', '5'] }, q: { default: '' } };
expect(parseQuery('?el=foo&rarity=9&q=%20Скирк%20', schema)).toEqual({ el: 'all', rarity: 'all', q: 'Скирк' });
expect(parseQuery('?q=' + 'x'.repeat(80), schema).q).toHaveLength(50);
expect(toQuery({ el: 'cryo', rarity: 'all', q: '' }, schema)).toBe('?el=cryo');
expect(toQuery({ el: 'all', rarity: 'all', q: '' }, schema)).toBe('');

const chars = [
  { name: 'Скирк', title: 'Звезда пустоты', element: 'cryo', rarity: 5, weapon: 'sword', region: 'other', version: '5.7' },
  { name: 'Алёша', title: '', element: 'electro', rarity: 4, weapon: 'polearm', region: 'snezhnaya', version: '7.0' },
  { name: 'Путешественник', title: '', element: 'none', rarity: 5, weapon: 'sword', region: 'other', version: '1.0' },
];
const all = { el: 'all', rarity: 'all', weapon: 'all', region: 'all', q: '' };
expect(filterCharacters(chars, { ...all, el: 'cryo' }).map(c => c.name)).toEqual(['Скирк']);
expect(filterCharacters(chars, all)).toHaveLength(3);
expect(filterCharacters(chars, { ...all, rarity: '4' }).map(c => c.name)).toEqual(['Алёша']);
expect(filterCharacters(chars, { ...all, q: 'снежная' }).map(c => c.name)).toEqual(['Алёша']);
expect(sortCharacters(chars, 'new').map(c => c.name)).toEqual(['Алёша', 'Скирк', 'Путешественник']);
expect(sortCharacters(chars, 'name')[0].name).toBe('Алёша');
```

  Плюс по одному тесту на `filterWeapons` (тип и редкость) и `filterArtifacts` (поиск по имени).
- [ ] **Step 2: Запустить** → FAIL.
- [ ] **Step 3: Реализовать** пять модулей.
- [ ] **Step 4: Проверить.** `npm test` → PASS; `npm run lint` → OK.
- [ ] **Step 5: Коммит.** `feat: add labels, text normalization, URL state and filters`

---

## Этап 2. Данные

### Task 4: Чистые преобразования данных genshin-db

**Files:**
- Create: `scripts/data/transform.mjs`
- Test: `tests/data/transform.test.js` (фикстуры — маленькие объекты в форме `genshin-db`, сам пакет не импортируется)

**Interfaces:**
- Consumes: `compareVersions` (Task 3).
- Produces (всё экспортируется из `transform.mjs`):
  - `slugify(englishName) -> string`: нижний регистр, удаление диакритики (NFD), всё, кроме `a-z0-9`, → `-`, без повторных и крайних `-` (`'Hu Tao'` → `'hu-tao'`)
  - `mapElement(elementType)`: `ELEMENT_PYRO`→`pyro`, …, `ELEMENT_NONE` или пусто → `none`
  - `mapWeapon(weaponType)`: `WEAPON_SWORD_ONE_HAND`→`sword`, `WEAPON_CLAYMORE`→`claymore`, `WEAPON_POLE`→`polearm`, `WEAPON_BOW`→`bow`, `WEAPON_CATALYST`→`catalyst`; неизвестное → throw
  - `mapRegion(associationType, englishName)`:
    - `MONDSTADT`→`mondstadt`; `LIYUE`, `NODKRAI_ZIBAI`→`liyue`; `INAZUMA`→`inazuma`; `SUMERU`→`sumeru`; `FONTAINE`→`fontaine`; `NATLAN`→`natlan`; `NODKRAI`→`nodkrai`;
    - `SNEZHNAYA`, `SNEZHNAYA_STAR`, `FATUI`→`snezhnaya`;
    - `RANGER`, `HVISION`, `OMNI_SCOURGE`, `MAINACTOR`→`other` (на входе всё с префиксом `ASSOC_`);
    - неизвестное → `Error('Unknown associationType ASSOC_X for Name')`
  - `cleanText(s) -> string` (безопасный HTML): удалить теги `<color…>`/`</color>` и любые другие `<…>`, затем экранировать, затем `**x**` → `<b class="hl">x</b>`, `\n` → `<br>`. `undefined` → `''`
  - `formatSubstat(type, value) -> string | null`: `FIGHT_PROP_ELEMENT_MASTERY` → `String(Math.round(value))`, остальные — `(value*100).toFixed(1)` с запятой и `%`; если нет `type` или значения → `null`
  - `sumCosts(costs) -> {name, count}[]`: суммирует все `ascend1..N` по `name` в порядке первого появления
  - `toCharacterSummary(ru, en) -> {slug, name, title, rarity, element, weapon, region, birthday, constellation, version, icon}` (`icon = ru.images.filename_icon`)
  - `toCharacterDetail(ru, en, talents, constellations) -> {slug, description, affiliation, ascensionStat, splash, talents, constellations, materials}`:
    - `talents`: `{kind: 'combat' | 'passive', name, html}[]` из ключей `combat1, combat2, combatsp, combat3, passive1..passive4` (только существующих);
    - `constellations`: `{level: 1..6, name, html}[]`;
    - `splash = ru.images.filename_gachaSplash`;
    - `talents` или `constellations` равны `null` (Путешественник) → пустые массивы.
  - `toTraveler(lumineRu, lumineEn) -> { summary, detail }`:
    - summary: `slug: 'traveler'`, `name: 'Путешественник'`, `element: 'none'`, `weapon: 'sword'`, `rarity: 5`, `region: 'other'`, `version: '1.0'`, `title: ''`, `birthday: ''`, `constellation: ''`, `icon` от Люмин;
    - detail: описание Люмин, пустые `talents` и `constellations`, `materials: []`.
  - `toWeapon(ru, en, stats90) -> {slug, name, type, rarity, baseAtk, substat: {label, value} | null, passive: {name, html} | null, icon, version}`: `baseAtk = Math.round(stats90.attack)`; `substat` — `{label: ru.mainStatText, value: formatSubstat(en.mainStatType, stats90.specialized)}` или `null`; `passive` — `{name: ru.effectName, html: cleanText(ru.r1.description)}` или `null`; `icon = ru.images.filename_icon`
  - `toArtifact(ru, en) -> {slug, name, rarity, bonus1, bonus2, bonus4, icon, version}`: `rarity = Math.max(...rarityList)`; бонусы — `cleanText` или `null`; `icon = images.filename_flower ?? images.filename_circlet`
  - `buildSearchIndex({characters, weapons, artifacts}) -> {type: 'character' | 'weapon' | 'artifact', slug, name, icon}[]`
  - `assertUniqueSlugs(list, label)`: дубликат → throw с обоими именами

- [ ] **Step 1: Тесты** на каждую функцию, обязательно:

```js
expect(slugify('Hu Tao')).toBe('hu-tao');
expect(mapRegion('ASSOC_NODKRAI_ZIBAI', 'Zibai')).toBe('liyue');
expect(() => mapRegion('ASSOC_NEW', 'X')).toThrow('Unknown associationType ASSOC_NEW for X');
expect(cleanText('<color=#FFD780FF>Огонь</color> **Удар**\n<script>')).toBe('Огонь <b class="hl">Удар</b><br>');
expect(formatSubstat('FIGHT_PROP_CRITICAL_HURT', 0.441024)).toBe('44,1%');
expect(formatSubstat('FIGHT_PROP_ELEMENT_MASTERY', 165.4)).toBe('165');
expect(formatSubstat(undefined, undefined)).toBeNull();
expect(sumCosts({ ascend1: [{ name: 'Мора', count: 20000 }, { name: 'X', count: 1 }], ascend2: [{ name: 'Мора', count: 40000 }] }))
  .toEqual([{ name: 'Мора', count: 60000 }, { name: 'X', count: 1 }]);
const shaman = { name: 'Шаман воды', rarityList: [3, 4], effect1Pc: 'Уменьшает…', images: { filename_circlet: 'UI_RelicIcon_X_3' }, version: '1.0' };
expect(toArtifact(shaman, { name: 'Prayers for Wisdom' })).toMatchObject({ slug: 'prayers-for-wisdom', rarity: 4, bonus2: null, bonus4: null, icon: 'UI_RelicIcon_X_3' });
expect(toCharacterDetail(lumineRu, lumineEn, null, null).talents).toEqual([]);
expect(() => assertUniqueSlugs([{ slug: 'a', name: 'A' }, { slug: 'a', name: 'B' }], 'characters')).toThrow(/A.*B/);
```

- [ ] **Step 2: Запустить** → FAIL.
- [ ] **Step 3: Реализовать** `transform.mjs`.
- [ ] **Step 4: Проверить.** `npm test` → PASS; `npm run lint` → OK.
- [ ] **Step 5: Коммит.** `feat: add genshin-db data transforms`

### Task 5: Скрипт генерации и сгенерированные данные

**Files:**
- Create: `scripts/data/package.json` (`private`, зависимость `"genshin-db": "5.2.14"`), `scripts/data/package-lock.json`, `scripts/data/build-data.mjs`
- Create (результат запуска): `src/data/generated/characters.json`, `src/data/generated/characters/<slug>.json`, `weapons.json`, `artifacts.json`, `search-index.json`, `meta.json`

**Interfaces:**
- Consumes: всё из Task 4.
- Produces (файлы, которые читают страницы):
  - `characters.json`: массив summary по имени (`localeCompare 'ru'`); без «Манекенов» (`en.name` `Manekin` / `Manekina`); Итэр и Люмин заменены одной записью `traveler`
  - `characters/<slug>.json`: detail
  - `weapons.json`: только `rarity >= 3`; сортировка: редкость по убыванию, затем имя
  - `artifacts.json`: только `max(rarityList) >= 4`; та же сортировка
  - `search-index.json`
  - `meta.json`: `{ source: 'genshin-db', sourceVersion: '5.2.14', latestVersion }`; `latestVersion` — максимум `version` по персонажам
  - Формат всех файлов: `JSON.stringify(x, null, 2) + '\n'`; перед записью каталог `src/data/generated` очищается

- [ ] **Step 1: Реализовать** `build-data.mjs`:
  - `genshin-db` подключается через `createRequire` относительно `scripts/data/`;
  - русские данные — `{ resultLanguage: 'Russian' }`, английские — по умолчанию;
  - списки — через `g.characters('names', { matchCategories: true })` (и так же для оружия и артефактов);
  - статы — `weapon.stats(90)`;
  - перед записью — `assertUniqueSlugs` для каждого списка.
- [ ] **Step 2: Запустить** `npm run data:update`. Ожидается без ошибок: 121 персонаж (120 + Путешественник), 245 оружия, 60 сетов, `latestVersion` = `7.1`.
- [ ] **Step 3: Выборочная проверка** через `node -e` по `characters.json`:
  - Скирк: `cryo`, `sword`, `5`, `other`;
  - Далия: `rarity 4`;
  - Мавуика: `natlan`;
  - Цзы Бай: `liyue`;
  - Весна и Водяница: `version 7.1`.

  В `characters/skirk.json` 6 созвездий и не меньше 6 талантов; ни в одном JSON нет строк `undefined` и `<color` (`grep -r "undefined\|<color" src/data/generated` → пусто).
- [ ] **Step 4: Проверить** `npm test` и `npm run lint` → OK.
- [ ] **Step 5: Коммит.** `feat: generate game data from genshin-db 5.2.14` (сгенерированные JSON входят в коммит)

### Task 6: Ручной контент со сверкой по интернету

**Files:**
- Create: `src/data/content/site.js`, `regions.js`, `patches.js`, `banners.js`, `guides.js`
- Test: `tests/data/content.test.js`

**Interfaces:**
- Consumes: `REGIONS`, `ELEMENTS` (Task 3); `characters.json`, `weapons.json` (Task 5).
- Produces:
  - `DATA_AS_OF = '25.10.2026'`
  - `REGIONS_INFO: {slug, emoji, nation, element, archon, desc, tags: string[]}[]`: 8 записей — 7 наций (`snezhnaya` в их числе) плюс `nodkrai`; `slug` из `REGIONS` (кроме `other`); `element` — ключ `ELEMENTS`
  - `PATCHES: {version, date: 'YYYY-MM-DD', title, highlights: string[]}[]`: версии 6.0–7.1, по убыванию версии
  - `BANNERS: { current: Banner[], upcoming: Banner[] }`, где `Banner = {title, kind: 'character' | 'weapon' | 'chronicled' | 'standard', featured5: string[], featured4: string[], start: 'YYYY-MM-DD' | null, end: 'YYYY-MM-DD' | null}`; `featured*` — slug'и персонажей (для `kind: 'weapon'` — slug'и оружия)
  - `PITY: {label, value, sub}[]`: правила гарантии с учётом механики «Захват сияния» (Capturing Radiance)
  - `GUIDES: {title, tag, desc}[]`; `GUIDE_TAGS: ['Новичок', 'Механики', 'Прокачка', 'Контент', 'Ресурсы', 'Прогресс']`

- [ ] **Step 1: Исследование.** WebSearch (`mode: extended` для свежих данных):
  - даты выхода и главное содержание версий 6.0–7.1;
  - текущие баннеры 7.1 фаза 2 (13.10–03.11.2026), включая 4★ и оружейный баннер;
  - анонс 7.2 (04.11.2026: Митя, Валерий, Хроники молитв);
  - архонты и стихии наций, статус Снежной и Нод-Края на 7.1;
  - механика гарантии и «Захвата сияния».

  В начале каждого файла комментарий `// Источники:` со списком URL.
- [ ] **Step 2: Тест целостности (падающий).**

```js
expect(PATCHES.every(p => /^\d{4}-\d{2}-\d{2}$/.test(p.date))).toBe(true);
expect([...PATCHES].sort((a, b) => compareVersions(b.version, a.version))).toEqual(PATCHES);
const charSlugs = new Set(characters.map(c => c.slug)), weaponSlugs = new Set(weapons.map(w => w.slug));
for (const b of [...BANNERS.current, ...BANNERS.upcoming])
  for (const s of [...b.featured5, ...b.featured4])
    expect(b.kind === 'weapon' ? weaponSlugs : charSlugs).toContain(s);
expect(REGIONS_INFO.every(r => r.slug in REGIONS && r.slug !== 'other' && r.element in ELEMENTS)).toBe(true);
expect(GUIDES.every(g => GUIDE_TAGS.includes(g.tag))).toBe(true);
```

  Персонажей 7.2 (Митя, Валерий) нет в `genshin-db`, поэтому в `upcoming` их не кладём в `featured*`: имена указываются текстом в `title` (например, «Митя (5★ Электро) и Валерий (4★ Электро)»).
- [ ] **Step 3: Запустить** → FAIL.
- [ ] **Step 4: Написать** пять файлов контента по результатам исследования.
- [ ] **Step 5: Проверить.** `npm test` → PASS; `npm run lint` → OK.
- [ ] **Step 6: Коммит.** `feat: add verified regions, patches, banners and guides content`

---

## Этап 3. Страницы

### Task 7: Стили, общий layout, тост, изображения с фолбэком

**Files:**
- Create: `src/styles/main.css` (`@import` трёх файлов ниже), `src/styles/base.css`, `src/styles/layout.css`, `src/styles/components.css`
- Create: `src/lib/images.js`, `src/components/game-image.js`, `src/components/toast.js`, `src/components/layout.js`
- Test: `tests/components/game-image.test.js`, `tests/components/layout.test.js`

**Interfaces:**
- Consumes: `getCurrentUser` (Task 1), `DATA_AS_OF` (Task 6), разметка шапки (Task 2).
- Produces:
  - `iconUrls(kind: 'character' | 'weapon' | 'artifact' | 'splash', file: string) -> string[]`:
    - character: `https://upload-os-bbs.mihoyo.com/game_record/genshin/character_icon/${file}.png`, затем `https://enka.network/ui/${file}.png`;
    - weapon и artifact: `…/game_record/genshin/equip/${file}.png`, затем enka;
    - splash: только enka;
    - пустой `file` → `[]`.
  - `imageHtml({ kind, file, alt, fallbackText, className = '' }) -> string`: `<img src="1-й URL" data-fallbacks="остальные через |" data-fallback-text="…" alt="…" loading="lazy" class="…">` (всё экранировано); при пустом списке URL — сразу заглушка
  - `placeholderHtml(text, className) -> string`: `<span class="img-ph ${className}" aria-hidden="true">${первая буква}</span>`
  - `installImageFallbacks(root = document)`: один слушатель `error` в фазе capture. Для `img[data-fallbacks]`: есть следующий URL → подставить его; список кончился → заменить `img` на `placeholderHtml`. Повторный вызов не вешает второй слушатель.
  - `showToast(message: string, isError = false)`: создаёт `#toast`, если его нет; класс `error`; скрывается через 3000 мс
  - `initLayout()`:
    - `#auth-btn`: `textContent = '👤 ' + user.name`, если вошёл;
    - `#nav-toggle` переключает `body.nav-open` и `aria-expanded`; Escape закрывает меню;
    - заполняет `[data-as-of]`;
    - вызывает `installImageFallbacks()`.
  - CSS:
    - перенос `style.css` по файлам: токены, reset и `:focus-visible` → base; header, nav, бургер (≤960px: навигация — выпадающая панель), поиск, footer, page-hero → layout; фильтры, карточки, теги, таблицы, тост, submit-panel, empty-state → components;
    - новые классы: `.img-ph` (кружок цвета стихии через `.el-<element>`), `.demo-note`, `.view-toggle`, `.chip[aria-pressed=true]`.

- [ ] **Step 1: Тесты (jsdom).**

```js
document.body.innerHTML = imageHtml({ kind: 'character', file: 'UI_AvatarIcon_X', alt: 'Скирк', fallbackText: 'Скирк', className: 'el-cryo' });
installImageFallbacks(); installImageFallbacks();
const img = () => document.querySelector('img');
expect(img().src).toContain('upload-os-bbs.mihoyo.com');
img().dispatchEvent(new Event('error'));
expect(img().src).toContain('enka.network/ui/UI_AvatarIcon_X.png');
img().dispatchEvent(new Event('error'));
expect(document.querySelector('img')).toBeNull();
expect(document.querySelector('.img-ph.el-cryo').textContent).toBe('С');
expect(imageHtml({ kind: 'character', file: '', alt: 'A', fallbackText: 'A' })).toContain('img-ph');
expect(imageHtml({ kind: 'weapon', file: 'f', alt: '"><script>', fallbackText: 'x' })).not.toContain('<script>');

// layout
document.body.innerHTML = '<button id="nav-toggle" aria-expanded="false"></button><a id="auth-btn">Войти</a><span data-as-of></span>';
localStorage.setItem('gw_user', JSON.stringify({ name: '<b>Аня</b>', email: 'a@b.c' }));
initLayout();
expect(document.getElementById('auth-btn').textContent).toBe('👤 <b>Аня</b>');
document.getElementById('nav-toggle').click();
expect(document.body.classList.contains('nav-open')).toBe(true);
expect(document.querySelector('[data-as-of]').textContent).toBe('25.10.2026');
```

- [ ] **Step 2: Запустить** → FAIL.
- [ ] **Step 3: Реализовать** модули и CSS.
- [ ] **Step 4: Проверить.** `npm test` → PASS; `npm run lint` → OK.
- [ ] **Step 5: Коммит.** `feat: add shared styles, layout, toast and image fallbacks`

### Task 8: Главная страница на Vite

**Files:**
- Modify (переписать): `index.html`
- Create: `src/pages/home.js`, `src/styles/pages/home.css` (из `index.css`)
- Create (вне репозитория, в scratchpad): `smoke.mjs`; расширяется в следующих задачах

**Interfaces:**
- Consumes: `initLayout`, `imageHtml` (Task 7); `characters.json`, `weapons.json`, `artifacts.json`, `meta.json` (Task 5); `REGIONS_INFO`, `PATCHES` (Task 6); `ELEMENTS` (Task 3).
- Produces:
  - `index.html`: `<!-- include:head --><title>Genshin Wiki — энциклопедия Тейвата</title>`, `<!-- include:header -->`, `main` с контейнерами `#hero-stats`, `#news`, `#new-in-version`, сетка разделов (статическая, как сейчас), блок «О проекте», чипы стихий со ссылками `characters.html?el=<key>`, `<!-- include:footer -->`, `<script type="module" src="/src/pages/home.js">`
  - Счётчики: персонажи (`characters.length`), стихии (7), регионы (`REGIONS_INFO.length`), оружие, сеты артефактов
  - Новости: `PATCHES[0]` (версия, дата, `title`, 2 первых `highlights`)
  - «Новое в версии X», где `X = meta.latestVersion`: карточки персонажей с этой версией, ссылки `character.html?id=<slug>`
- Smoke-скрипт (Playwright, `chromium.launch()`): `vite preview`; все внешние запросы абортируются через `page.route`; ошибки консоли, кроме `Failed to load resource`, валят проверку; `pageerror` валит всегда. Для каждой страницы из списка: открыть и проверить, что ошибок нет, и что ширина документа ≤ ширины окна при viewport 375×800.

- [ ] **Step 1: Реализовать** страницу и CSS.
- [ ] **Step 2: Собрать.** `npm run build` → без ошибок и предупреждений о классических скриптах; в `dist/index.html` подставлены partials и `class="active"` у пункта «Главная».
- [ ] **Step 3: Smoke.** `node <scratchpad>/smoke.mjs index.html` → OK; цифры совпадают с JSON, блок «Новое в версии 7.1» содержит Весну и Водяницу.
- [ ] **Step 4: Коммит.** `feat: rebuild home page on Vite with live counts`

### Task 9: Каталоги персонажей, оружия и артефактов

**Files:**
- Modify (переписать): `characters.html`, `weapons.html`, `artifacts.html`
- Create: `src/components/cards.js`, `src/components/chips.js`, `src/components/view-toggle.js`, `src/pages/characters.js`, `src/pages/weapons.js`, `src/pages/artifacts.js`
- Test: `tests/components/cards.test.js`, `tests/components/chips.test.js`

**Interfaces:**
- Consumes: Task 3 (`parseQuery`, `toQuery`, фильтры, подписи), Task 7 (`imageHtml`, `initLayout`), Task 1 (`readJson`, `writeJson`), JSON из Task 5.
- Produces:
  - `characterCardHtml(c)`: `<a class="char-card" href="character.html?id=${slug}">` с иконкой (класс `el-${element}`), именем, титулом, `★` по редкости, тегами стихии и оружия, регионом
  - `characterRowHtml(c)`: строка таблицы
  - `weaponCardHtml(w)`, `weaponRowHtml(w)`: иконка, имя, тип, редкость, базовая атака, доп. стат (если есть), пассивка (если есть)
  - `artifactCardHtml(a)`, `artifactRowHtml(a)`: иконка, имя, редкость, существующие бонусы с подписями «1 предмет», «2 предмета», «4 предмета»
  - `chipGroupHtml(name, label, options: {value, label}[], current) -> string`: `<div class="filter-group" role="group" aria-label>` с `<button class="chip" data-filter=name data-value aria-pressed>`
  - `bindChips(root, onChange: (name, value) => void)`: делегирование кликов
  - `syncChips(root, state)`
  - `initViewToggle(root, storageKey, onChange: (view) => void) -> 'cards' | 'table'`: кнопки `[data-view]` внутри `.view-toggle`, ключ `gw_view_<page>`, по умолчанию `'cards'`
  - Схемы URL:
    - персонажи: `{el: all|<ключи ELEMENTS без none>, rarity: all|4|5, weapon: all|<ключи WEAPON_TYPES>, region: all|<ключи REGIONS>, sort: name|new, q}`;
    - оружие: `{type: all|…, rarity: all|3|4|5, q}`;
    - артефакты: `{rarity: all|4|5, q}`.
  - При изменении фильтра — `history.replaceState(null, '', toQuery(state, schema) || location.pathname)`, синхронизация чипов, перерисовка. Пустой результат → `.empty-state` «Ничего не найдено — попробуйте изменить фильтр». Над сеткой показывается число найденных.
  - Форма предложения на этих страницах появится в Task 13; контейнер `#submit-wrap` оставить уже сейчас.

- [ ] **Step 1: Тесты.**

```js
const c = { slug: 'skirk', name: '<Скирк>', title: 'Звезда', rarity: 5, element: 'cryo', weapon: 'sword', region: 'other', icon: 'I' };
expect(characterCardHtml(c)).toContain('href="character.html?id=skirk"');
expect(characterCardHtml(c)).toContain('&lt;Скирк&gt;');
const shaman = { slug: 's', name: 'Шаман воды', rarity: 4, bonus1: 'Эффект', bonus2: null, bonus4: null, icon: 'I' };
expect(artifactCardHtml(shaman)).toContain('1 предмет');
expect(artifactCardHtml(shaman)).not.toMatch(/undefined|null|2 предмета/);
const w = { slug: 'w', name: 'W', type: 'sword', rarity: 3, baseAtk: 401, substat: null, passive: null, icon: 'I' };
expect(weaponCardHtml(w)).not.toMatch(/undefined|null/);
// chips (jsdom): клик по data-value="cryo" вызывает onChange('el', 'cryo'); syncChips ставит aria-pressed="true" только у выбранного
```

- [ ] **Step 2: Запустить** → FAIL.
- [ ] **Step 3: Реализовать** компоненты и три страницы, добавить их в `PAGES`. Ссылки с главной `characters.html?el=pyro` должны работать.
- [ ] **Step 4: Проверить.** `npm test`, `npm run lint`, `npm run build` → OK. Smoke для трёх страниц плюс сценарии:
  - `characters.html?el=cryo&rarity=5` → только 5★ Крио, чипы нажаты;
  - клик по «Гео» меняет URL на `?el=geo&rarity=5`;
  - `?el=foo` → показаны все;
  - переключение на таблицу сохраняется после перезагрузки;
  - `weapons.html?q=туман` находит «Рассекающий туман».
- [ ] **Step 5: Коммит.** `feat: rebuild character, weapon and artifact catalogs with URL filters`

### Task 10: Страница персонажа

**Files:**
- Create: `character.html`, `src/pages/character.js`, `src/pages/character-view.js`, `src/styles/pages/character.css`
- Test: `tests/pages/character-view.test.js`

**Interfaces:**
- Consumes: `characters.json`; `characters/<slug>.json` через `import.meta.glob('../data/generated/characters/*.json')` (ленивая загрузка); `imageHtml` (Task 7); подписи (Task 3).
- Produces:
  - `findCharacter(list, id) -> summary | null`: `null`, если `id` не соответствует `/^[a-z0-9-]+$/` или его нет в списке
  - `renderCharacter(summary, detail) -> string`:
    - шапка: сплэш (`kind: 'splash'`, фолбэк — иконка) и факты (стихия, оружие, редкость, регион, принадлежность, день рождения, созвездие, стат возвышения, версия);
    - описание;
    - таланты во вкладках (`role="tablist"`, кнопки `role="tab"` с `aria-selected`, панели `role="tabpanel"`; первая вкладка открыта);
    - список созвездий C1–C6 и таблица материалов (`count.toLocaleString('ru-RU')`);
    - пустые секции не выводятся; для Путешественника вместо талантов фраза «Таланты зависят от выбранной стихии».
  - `renderNotFound() -> string`: «Персонаж не найден» и ссылка `characters.html`
  - Страница выставляет `document.title = '<Имя> — Genshin Wiki'`; переключение вкладок — делегирование и стрелки ←/→.

- [ ] **Step 1: Тесты.**

```js
const list = [{ slug: 'skirk', name: 'Скирк' }];
expect(findCharacter(list, 'skirk').name).toBe('Скирк');
expect(findCharacter(list, '../../x')).toBeNull();
expect(findCharacter(list, '')).toBeNull();
expect(findCharacter(list, 'nobody')).toBeNull();
const html = renderCharacter(summary, { ...detail, talents: [{ kind: 'combat', name: 'Удар', html: '<b class="hl">x</b>' }], constellations: [] });
expect(html).toContain('role="tab"');
expect(html).toContain('<b class="hl">x</b>');
expect(html).not.toContain('Созвездия');
expect(renderNotFound()).toContain('href="characters.html"');
```

- [ ] **Step 2: Запустить** → FAIL.
- [ ] **Step 3: Реализовать.** Добавить `'character'` в `PAGES`.
- [ ] **Step 4: Проверить.** `npm test`, `npm run lint`, `npm run build` → OK. Smoke:
  - `character.html?id=skirk`: имя, 6 созвездий, вкладки переключаются;
  - `?id=traveler`: фраза про стихии;
  - `?id=nope` → «Персонаж не найден»;
  - в `dist/assets` файлы деталей вынесены в отдельные чанки.
- [ ] **Step 5: Коммит.** `feat: add character detail page`

### Task 11: Регионы, гайды, патчноуты, баннеры

**Files:**
- Modify (переписать): `regions.html`, `guides.html`, `patches.html`, `banners.html`
- Create: `src/pages/regions.js`, `src/pages/guides.js`, `src/pages/patches.js`, `src/pages/banners.js`, `src/styles/pages/regions.css`, `src/styles/pages/banners.css` (перенос из корневых CSS)

**Interfaces:**
- Consumes: контент (Task 6), JSON (Task 5), `chipGroupHtml` и `bindChips` (Task 9), `imageHtml` (Task 7).
- Produces:
  - Регионы: карточка на каждую запись `REGIONS_INFO` со строкой «Персонажей: N» — ссылка `characters.html?region=<slug>`
  - Гайды: чипы по `GUIDE_TAGS` и состояние `?tag=` (схема `{tag: all|…}`)
  - Патчноуты: для каждой записи `PATCHES` — версия, дата (`DD.MM.YYYY`), заголовок, highlights; «Новые персонажи» (`characters` с `version === p.version`, ссылки на страницы); «Новое 5★ оружие» (`weapons`, `rarity === 5` и та же версия). Пустые подсписки не выводятся.
  - Баннеры: секции «Сейчас» и «Скоро»; в каждой карточке даты (`start`/`end` → `DD.MM.YYYY`, `null` → «дата уточняется»), featured с иконками и ссылками для персонажей; блок `PITY`; подпись «Данные актуальны на 25.10.2026»
  - Вспомогательная `formatDate('2026-09-23') -> '23.09.2026'` в `src/lib/text.js` с тестом в `tests/lib/text.test.js`

- [ ] **Step 1: Тест** `formatDate` (падающий) → реализовать → PASS.
- [ ] **Step 2: Реализовать** четыре страницы и добавить их в `PAGES`.
- [ ] **Step 3: Проверить.** `npm test`, `npm run lint`, `npm run build` → OK. Smoke для четырёх страниц; на патчноутах у 7.1 есть Весна и Водяница.
- [ ] **Step 4: Коммит.** `feat: rebuild regions, guides, patches and banners pages`

### Task 12: Глобальный поиск в шапке

**Files:**
- Create: `src/lib/search.js`, `src/components/search.js`
- Modify: `src/components/layout.js` (`initLayout` вызывает `initSearch`)
- Test: `tests/lib/search.test.js`, `tests/components/search.test.js`

**Interfaces:**
- Consumes: `normalize` (Task 3); `search-index.json` (Task 5) через динамический `import()`; разметка поиска из `partials/header.html` (Task 2).
- Produces:
  - `searchIndex(index, query, limit = 8) -> item[]`: пустой нормализованный запрос → `[]`. Ранжирование: имя начинается с запроса, затем какое-то слово имени начинается с запроса, затем подстрока; внутри группы порядок исходный.
  - `resultHref(item) -> string`: character → `character.html?id=<slug>`; weapon → `weapons.html?q=<encodeURIComponent(name)>`; artifact → `artifacts.html?q=…`
  - `initSearch(input, listEl, load = () => import('../data/generated/search-index.json'))`:
    - индекс грузится при первом `focus`;
    - на `input` рисуется до 8 `<li role="option">` с иконкой, именем и типом («Персонаж», «Оружие», «Артефакт»);
    - клавиши ↑/↓ двигают `aria-selected`, Enter переходит по выбранному (или первому) результату, Escape закрывает список;
    - клик вне поиска закрывает список;
    - пусто → `<li class="empty">Ничего не найдено</li>`.

- [ ] **Step 1: Тесты.**

```js
const idx = [
  { type: 'weapon', slug: 'a', name: 'Песнь Алёши' },
  { type: 'character', slug: 'alyosha', name: 'Алёша' },
  { type: 'artifact', slug: 'b', name: 'Сон алеши' },
];
expect(searchIndex(idx, '  АЛЕША ').map(i => i.slug)).toEqual(['alyosha', 'a', 'b']);
expect(searchIndex(idx, '   ')).toEqual([]);
expect(searchIndex(Array(20).fill(idx[1]), 'а')).toHaveLength(8);
expect(resultHref({ type: 'weapon', name: 'Рассекающий туман' })).toBe('weapons.html?q=%D0%A0%D0%B0%D1%81%D1%81%D0%B5%D0%BA%D0%B0%D1%8E%D1%89%D0%B8%D0%B9%20%D1%82%D1%83%D0%BC%D0%B0%D0%BD');
// component (jsdom, индекс передаётся через параметр load):
// ввод «ал» → 3 option; ArrowDown → у первого aria-selected="true"; Escape → listEl.hidden === true
```

- [ ] **Step 2: Запустить** → FAIL.
- [ ] **Step 3: Реализовать.**
- [ ] **Step 4: Проверить.** `npm test`, `npm run lint`, `npm run build` → OK. Smoke: на главной ввод «скирк» и Enter открывают `character.html?id=skirk`; на ширине 375 поиск доступен в бургер-меню.
- [ ] **Step 5: Коммит.** `feat: add global search to header`

### Task 13: Общая форма «предложить правку» и EmailJS

**Files:**
- Create: `src/lib/proposals.js`, `src/lib/emailjs.js`, `src/components/proposal-form.js`
- Modify: `src/pages/characters.js`, `weapons.js`, `artifacts.js`, `guides.js`, `patches.js` (монтирование формы); `guides.html` и `patches.html` получают `#submit-wrap`
- Test: `tests/lib/proposals.test.js`, `tests/lib/emailjs.test.js`, `tests/components/proposal-form.test.js`

**Interfaces:**
- Consumes: `readJson`, `writeJson`, `getCurrentUser` (Task 1), `showToast` (Task 7), `escapeHtml`.
- Produces:
  - `addProposal({ user, page, cat, item, text }) -> proposal` (добавляет `date: new Date().toISOString()`, ключ `gw_proposals`)
  - `getProposalsFor(email) -> proposal[]` (новые первыми)
  - `isEmailConfigured(env = import.meta.env) -> boolean`: все четыре `VITE_EMAILJS_*` непустые
  - `sendVerifyCode({ toEmail, code, userName }, env = import.meta.env) -> Promise<boolean>`, `sendProposal({ user_name, user_email, page, category, item, message }, env = import.meta.env) -> Promise<boolean>`: если EmailJS не настроен → `false` без сетевых запросов; `@emailjs/browser` подгружается динамическим `import()`; ошибки ловятся → `false`
  - `mountProposalForm(container, { page, title, intro, categories: string[], itemPlaceholder })`:
    - гость: заголовок, intro и ссылка «Войти или зарегистрироваться →» на `auth.html`;
    - вошедший: форма (select, input, textarea, кнопка) и плашка `.demo-note` «Демо: предложения сохраняются в этом браузере» (если EmailJS настроен, дописывается «и отправляются администратору»);
    - валидация: «Выберите категорию», «Введите описание предложения»;
    - после отправки тост: «✓ Предложение отправлено администратору» или «✓ Предложение сохранено локально (демо-режим)».
  - Категории — те же, что сейчас на каждой странице.

- [ ] **Step 1: Тесты.**

```js
expect(isEmailConfigured({ VITE_EMAILJS_PUBLIC_KEY: 'a', VITE_EMAILJS_SERVICE_ID: 'b', VITE_EMAILJS_TEMPLATE_VERIFY: 'c', VITE_EMAILJS_TEMPLATE_PROPOSAL: '' })).toBe(false);
await expect(sendProposal({ user_name: 'x' }, {})).resolves.toBe(false); // второй аргумент — env для теста
addProposal({ user: 'a@b.c', page: 'Персонажи', cat: 'Другое', item: '', text: 't' });
expect(getProposalsFor('a@b.c')).toHaveLength(1);
// form (jsdom): без пользователя есть ссылка на auth.html; с пользователем пустая отправка → тост «Выберите категорию», в хранилище 0 записей; имя пользователя экранировано
```

- [ ] **Step 2: Запустить** → FAIL.
- [ ] **Step 3: Реализовать** и смонтировать форму на пяти страницах.
- [ ] **Step 4: Проверить.** `npm test`, `npm run lint`, `npm run build` → OK. Smoke: с `gw_user` в localStorage форма видна, отправка сохраняет запись.
- [ ] **Step 5: Коммит.** `feat: share proposal form across pages with optional EmailJS`

---

## Этап 4. Аккаунты

### Task 14: Логика демо-аккаунтов

**Files:**
- Create: `src/lib/auth.js`
- Test: `tests/lib/auth.test.js`

**Interfaces:**
- Consumes: `readJson`, `writeJson` (Task 1).
- Produces:
  - `PBKDF2_ITERATIONS = 600000`
  - `hashPassword(password, saltHex = randomSaltHex()) -> Promise<{ hash, salt }>`: Web Crypto `PBKDF2`, `SHA-256`, 256 бит, hex
  - `legacyHash(password, email) -> string`: `btoa(encodeURIComponent(password + '_gw_' + email))`, как в старом `auth.js`
  - `verifyPassword(user, password) -> Promise<{ ok: boolean, upgrade: { hash, salt } | null }>`: у пользователя без `salt` — сравнение с `legacyHash`, при успехе `upgrade` — новый хеш; иначе PBKDF2 со сравнением
  - `isEmail(s)`: та же регулярка, что сейчас
  - `validateRegistration({ name, email, pass, pass2, agree }) -> Record<'name' | 'email' | 'pass' | 'pass2' | 'agree', string>`: только ошибочные поля; тексты: «Минимум 2 символа», «Введите корректный email», «Минимум 8 символов», «Пароли не совпадают», «Примите условия использования»
  - `generateCode() -> string`: 6 цифр, `crypto.getRandomValues`, диапазон 100000–999999
  - `passwordStrength(p) -> 0..4`: те же правила, что в старом `_strength`, ограничено 4
  - `getUsers() -> user[]` (битый JSON → `[]`), `saveUsers(users)`, `findUser(email)`, `upsertUser(user)` (по `email`)

- [ ] **Step 1: Тесты.**

```js
const { hash, salt } = await hashPassword('secret123', '00'.repeat(16));
expect(hash).toMatch(/^[0-9a-f]{64}$/);
expect((await hashPassword('secret123', '00'.repeat(16))).hash).toBe(hash);
expect((await verifyPassword({ email: 'a@b.c', hash, salt }, 'secret123')).ok).toBe(true);
expect((await verifyPassword({ email: 'a@b.c', hash, salt }, 'wrong')).ok).toBe(false);
const legacy = { email: 'a@b.c', hash: legacyHash('oldpass1', 'a@b.c') };
const r = await verifyPassword(legacy, 'oldpass1');
expect(r.ok).toBe(true);
expect(r.upgrade.salt).toMatch(/^[0-9a-f]{32}$/);
expect(validateRegistration({ name: 'А', email: 'x', pass: '1', pass2: '2', agree: false })).toEqual({
  name: 'Минимум 2 символа', email: 'Введите корректный email', pass: 'Минимум 8 символов', pass2: 'Пароли не совпадают', agree: 'Примите условия использования',
});
expect(generateCode()).toMatch(/^[1-9]\d{5}$/);
localStorage.setItem('gw_users', '{oops');
expect(getUsers()).toEqual([]);
```

- [ ] **Step 2: Запустить** → FAIL.
- [ ] **Step 3: Реализовать.**
- [ ] **Step 4: Проверить.** `npm test` → PASS; `npm run lint` → OK.
- [ ] **Step 5: Коммит.** `feat: add PBKDF2-based demo account logic with legacy migration`

### Task 15: Страница входа и регистрации

**Files:**
- Modify (переписать): `auth.html`
- Create: `src/pages/auth.js`, `src/styles/pages/auth.css` (из корневого `auth.css`, без дублей base и layout)

**Interfaces:**
- Consumes: всё из Task 14; `sendVerifyCode` (Task 13); `getCurrentUser`, `setCurrentUser`, `clearCurrentUser` (Task 1); `getProposalsFor` (Task 13); `showToast`, `initLayout` (Task 7).
- Produces:
  - `auth.html` с общими head, header и footer. Панели, как сейчас (login, register, verify, forgot, reset-code, new-pass, success, profile), без inline-обработчиков: кнопки с `data-action="login" | "register" | "verify" | "resend" | "forgot" | "verify-reset" | "new-password" | "logout" | "show:<panel>" | "tab:<login|register>" | "toggle-pass:<inputId>"`. Обработка — одно делегирование на `#auth-card`.
  - Вверху карточки `.demo-note`: «Демо: аккаунты хранятся только в этом браузере. Не используйте настоящий пароль.»
  - Поведение как у старого `auth.js`. Отличия:
    - хеширование через `hashPassword`, проверка через `verifyPassword`; при `upgrade` пользователь пересохраняется;
    - коды — `generateCode()`;
    - письма — `sendVerifyCode`: при `false` код показывается в баннере «Демо-режим: ваш код — 123456»;
    - тексты ошибок — из `validateRegistration`;
    - кнопки на время PBKDF2 блокируются со спиннером.
  - Ввод кода: автопереход между цифрами, Backspace, ←/→, вставка 6 цифр из буфера заполняет все поля.

- [ ] **Step 1: Реализовать** страницу и добавить `'auth'` в `PAGES`.
- [ ] **Step 2: Проверить.** `npm test`, `npm run lint`, `npm run build` → OK. Smoke-сценарий (EmailJS не настроен):
  1. Регистрация: код виден в баннере → ввод кода → успех → профиль.
  2. Выход → вход с правильным паролем → профиль; с неправильным → «Неверный email или пароль».
  3. В `gw_users` подложен пользователь со старым base64-хешем → вход проходит, после входа у записи есть `salt`.
  4. Сброс пароля: код из баннера → новый пароль → вход с новым паролем.
  5. В `gw_users` битый JSON → страница открывается без `pageerror`.
- [ ] **Step 3: Коммит.** `feat: rebuild auth page as honest demo with PBKDF2`

---

## Этап 5. Завершение

### Task 16: Удаление старого, деплой, README

**Files:**
- Delete: `data.js`, `auth.js`, `characters.js`, `weapons.js`, `artifacts.js`, `regions.js`, `guides.js`, `patches.js`, `banners.js`, `index.js`, `shared.js`, `emailjs-config.js`, `style.css`, `index.css`, `auth.css`, `banners.css`, `regions.css`, `SETUP.md`
- Modify: `eslint.config.js` и `.prettierignore` (убрать игнор старых файлов), `README.md` (переписать)
- Create: `.github/workflows/deploy.yml`, `docs/screenshot.png`

**Interfaces:**
- Produces:
  - `deploy.yml`:
    - триггеры: `push` в `main` и `workflow_dispatch`;
    - права: `contents: read`, `pages: write`, `id-token: write`; concurrency `pages`;
    - job build: checkout, setup-node 22, `npm ci`, `npm run build` с `env` из `vars.VITE_EMAILJS_*`, `actions/upload-pages-artifact` (`path: dist`);
    - job deploy: `actions/deploy-pages` (environment `github-pages`);
    - версии actions взять актуальные.
  - README:
    - заголовок и ссылка на живой сайт `https://portfoliobts.github.io/genshin-wiki/`, скриншот;
    - возможности, стек, структура, команды (`dev`, `build`, `test`, `lint`, `data:update`);
    - включение GitHub Pages (Settings → Pages → Source: GitHub Actions), необязательная настройка EmailJS (`.env` / Actions Variables, шаблоны с плейсхолдерами `to_email`, `code`, `user_name` и `user_name`, `user_email`, `page`, `category`, `item`, `message`, `date`; адрес администратора задаётся в шаблоне);
    - источники данных, честная пометка о демо-аккаунтах, дисклеймер HoYoverse.

- [ ] **Step 1: Удалить** старые файлы и их игноры (включая `*.html` и `*.css` в `.prettierignore`), выполнить `npm run format`; `grep -rn "data.js\|emailjs-config\|style.css" --include=*.html .` → пусто.
- [ ] **Step 2: Проверить.** `npm run lint`, `npm run format:check`, `npm test`, `npm run build` → OK; smoke по всем 10 страницам → OK.
- [ ] **Step 3: Скриншот.** Playwright, `vite preview`, главная 1440×900 → `docs/screenshot.png`. Внешние картинки в этом окружении недоступны: в отчёте пользователю сказать, что скриншот стоит переснять после деплоя.
- [ ] **Step 4: Написать** `deploy.yml` и README.
- [ ] **Step 5: Коммит.** `chore: remove legacy files, add Pages deploy and README`

### Task 17: Финальная проверка и пуш

- [ ] **Step 1:** Полный прогон: `npm ci && npm run lint && npm run format:check && npm test && npm run build`. Всё зелёное; число тестов записать для отчёта.
- [ ] **Step 2:** Smoke по всем страницам на 1440×900 и 375×800: нет `pageerror` и посторонних ошибок консоли, нет горизонтального скролла; сценарии из Task 9, 10, 13 и 16 проходят.
- [ ] **Step 3:** `git push -u origin claude/youthful-hawking-gocqmg`; проверить, что CI на ветке зелёный (GitHub MCP: статус проверок последнего коммита).
- [ ] **Step 4:** Отчёт пользователю: что сделано; что проверить руками после деплоя (картинки, включение Pages, переменные EmailJS); предложение открыть PR.
