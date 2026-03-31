# 12 UNDER 12 — лендинг

Совместный проект **Zorka.Agency × Influencer Marketing Hub**. Статический сайт без сборки.

## Запуск локально

```bash
cd /path/to/oup
python3 -m http.server 8080
```

Откройте http://localhost:8080 (нужен сервер из‑за `fetch` к JSON).

## Git и GitHub (PAT из `.env`)

Токен храните в **`GITHUB_PAT`** в файле **`.env`** в каталоге проекта `oup/` или на уровень выше (например `Desktop/.env`). Шаблон: **`.env.example`**. Файл `.env` в репозиторий не попадает.

Пуш с подстановкой токена из окружения (текущая ветка):

```bash
./scripts/push-with-pat.sh
```

Опционально — те же аргументы, что у `git push` после URL (например `HEAD:main`).

```bash
./scripts/push-with-pat.sh HEAD:main
```

## Pre-launch

- **`coming-soon.html`** — страница-заглушка (одна иллюстрация). Прямой URL: `…/coming-soon.html` (на GitHub Pages это обычно `https://<user>.github.io/<repo>/coming-soon.html`).
- **`js/config.js`** — `PRELAUNCH_COMING_SOON`: при `true` все страницы, кроме `coming-soon.html`, сразу редиректят на заглушку (`js/prelaunch-redirect.js`). Для наполнения и превью сайта держите `false`.

## Структура

- **index.html** — главная: сетка 12 карточек (3×4), Mission, Why 12, навигация, соцсети.
- **marketer.html?id=** — страница маркетолога (карусели цитат и секций, Q&A).
- **about.html** — About project (текст — картинка — текст; замените на контент из Canva).
- **team.html** — команда, данные из `data/team.json`.
- **become-one.html** — форма *Become one of 12* (отправка через `mailto:info@zorka.agency`).
- **contact.html** — контактная форма + соцсети.

## Данные

- **`data/marketers.json`** — партнёры, описание проекта, массив маркетологов (по мере запуска добавляйте слоты).
  - `status: "published"` — полный профиль + фото; карточка ведёт на `marketer.html?id=…`.
  - `status: "coming_soon"` — плейсхолдер **Coming soon** и подпись месяца (`monthEdition`). Поле `photo` и опционально `samplePhoto` — локальный путь, например `images/marketers/jane.jpg`.
- **`data/team.json`** — блок Our team.

Шрифты: **Anton** (заголовки), **Great Vibes** (скрипт; аналог New Icon Script из Canva). Цвета: белый `#ffffff`, винный `#5f040d`, бирюзовый `#0097b2`.

## Формы

Сейчас при **Send** открывается почтовый клиент с письмом на **info@zorka.agency**. Для отправки без почты подключите [Formspree](https://formspree.io) или аналог и замените `action` у форм.

## Соцсети

В `index.html` и `contact.html` замените `href` у иконок LinkedIn / YouTube / Instagram на ваши URL.

## Старые ссылки

`interview.html?id=…` перенаправляет на `marketer.html?id=…`.
