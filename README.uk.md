# rozetka-mcp

[English](./README.md) | **Українська**

[![CI](https://github.com/sdziupin/rozetka-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/sdziupin/rozetka-mcp/actions/workflows/ci.yml)
[![Live Rozetka smoke](https://github.com/sdziupin/rozetka-mcp/actions/workflows/live-smoke.yml/badge.svg)](https://github.com/sdziupin/rozetka-mcp/actions/workflows/live-smoke.yml)

MCP-сервер для **Rozetka.ua** без браузерної автоматизації.

Він напряму використовує публічно доступні JSON backend-и Rozetka. У проєкті **немає Playwright, Chromium, Bright Data, browser profile, cookie jar, GUI automation чи залежності від пошукового рушія**.

> **Статус: alpha / reverse-engineered інтеграція.** Rozetka не публікує ці buyer/catalog endpoints як офіційно підтримуваний public API. Формати endpoint-ів та anti-bot policy можуть змінюватися.

## Що зараз надійно працює

Основний шлях використовує endpoint-и, які live-тестуються з GitHub Actions:

- `search.rozetka.com.ua` — пошук товарів, product IDs, фільтри та підказки категорій
- `product-api.rozetka.com.ua` — опис і характеристики товару

Деякі розширені host-и Rozetka, зокрема `xl-catalog-api.rozetka.com.ua`, `common-api.rozetka.com.ua` та сам storefront, можуть повертати Cloudflare managed challenge для datacenter IP. Тому rich catalog hydration є лише **best-effort** і не потрібен для стабільної роботи основних tools.

## MCP tools

- `rozetka_search_products` — пошук товарів, фільтри/сортування, опційний best-effort rich hydration
- `rozetka_get_product` — товар за ID або URL, плюс опис і характеристики за замовчуванням
- `rozetka_get_products` — resolve до 60 product IDs; rich hydration коли доступний, безпечний fallback до ID інакше
- `rozetka_list_filters` — live metadata фільтрів для пошукового запиту
- `rozetka_list_categories` — підказки категорій для запиту через search API
- `rozetka_resolve_url` — product/category URL → ID без мережевого запиту
- `rozetka_saved_search_list`
- `rozetka_saved_search_create`
- `rozetka_saved_search_run`
- `rozetka_saved_search_delete`

## Встановлення з npm

Після npm-релізу clone/build більше не потрібен.

### npx

```bash
npx -y rozetka-mcp
```

### Глобальне встановлення

```bash
npm install -g rozetka-mcp
rozetka-mcp
```

### Конфігурація MCP

```json
{
  "mcpServers": {
    "rozetka": {
      "command": "npx",
      "args": ["-y", "rozetka-mcp"]
    }
  }
}
```

## Встановлення з source

Вимоги: Node.js 20+.

```bash
git clone https://github.com/sdziupin/rozetka-mcp.git
cd rozetka-mcp
npm install
npm run check
npm test
npm run build
npm start
```

Розробка:

```bash
npm run dev
npm run smoke
npm run pack:check
```

MCP-конфіг для локального checkout:

```json
{
  "mcpServers": {
    "rozetka": {
      "command": "node",
      "args": ["/absolute/path/to/rozetka-mcp/dist/index.js"]
    }
  }
}
```

## Приклад пошуку

```json
{
  "query": "Deye SE-F16-C",
  "min_price": 40000,
  "max_price": 80000,
  "seller": "rozetka",
  "sort": "price_asc",
  "limit": 20
}
```

Для category-specific attributes спочатку використовуйте `rozetka_list_filters`, а потім передавайте точні Rozetka filter keys/values через `filters`.

Деякі широкі запити Rozetka може перетворити на category redirect замість списку товарів. У такому випадку tool повертає `navigate_to`, а не вигадує, ніби товари були знайдені.

## Налаштування

```bash
ROZETKA_LANGUAGE=ua
ROZETKA_COUNTRY=UA
ROZETKA_FRONT_TYPE=xl
ROZETKA_HTTP_TIMEOUT_MS=15000
ROZETKA_HTTP_RETRIES=2
```

Розширені overrides endpoint-ів доступні в `.env.example`.

## CI

`.github/workflows/ci.yml` перевіряє:

- TypeScript typecheck
- unit tests
- production build
- npm package dry-run
- зібраний CLI entrypoint
- Docker image build

`.github/workflows/live-smoke.yml` перевіряє реальний core API path Rozetka при змінах runtime-коду, manual dispatch та щотижня.

Live smoke навмисно тестує лише публічні search/product endpoint-и, які пакет вважає своїм надійним core. Cloudflare-protected hydration працює fail-soft і не є release blocker.

## Гілки та release flow

Основна розробка ведеться в `devel`. `main` — release branch.

Звичайний flow:

```text
feature work
   ↓
devel
   ↓  PR
main
   ↓  automatic release
GitHub Release + npm
```

PR у `main` має містити package version, якої ще немає в npm. Перед створенням або merge release PR підніміть версію в `devel`:

```bash
npm run version:patch
# або
npm run version:minor
npm run version:major
```

Закомітьте зміну версії в `devel`. CI перевіряє, що ця версія ще доступна для публікації в npm.

Release workflow приймає автоматичні релізи лише для commits, пов'язаних із merged PR `devel → main`. Direct push у `main` провалює `main-policy` check і не може запустити publish.

### npm publishing secret

У GitHub Actions repository secrets має бути:

```text
NPM_TOKEN=<npm automation/publish token>
```

Token передається npm лише як `NODE_AUTH_TOKEN` усередині publish step і ніколи не зберігається в репозиторії.

Після кожного коректного merge у `main`, `.github/workflows/publish.yml`:

1. перевіряє, що commit походить із merged PR `devel → main`
2. встановлює dependencies
3. запускає typecheck
4. запускає unit tests
5. збирає runtime
6. перевіряє npm tarball
7. запускає live Rozetka smoke test
8. публікує version із `package.json` у npm, якщо її там ще немає
9. створює відповідний GitHub Release `vX.Y.Z`

Workflow retry-safe: якщо npm publish уже пройшов, а створення GitHub Release впало, повторний запуск пропустить уже існуючу npm version і створить лише відсутній Release.

### GitHub branch protection

У репозиторії є one-shot admin helper для settings, які цей GitHub connector не може змінити:

```bash
bash scripts/configure-github.sh
```

Запускайте його через GitHub CLI login/token із repository administration permission. Він встановлює `devel` як default branch і вмикає hard protection для `main`.

Рекомендований hard protection для `main`:

- вимагати pull request перед merge
- вимагати CI checks: `test`, `docker`, `release-version` та live smoke
- вимагати актуальну branch перед merge
- блокувати force push
- блокувати видалення branch
- використовувати `devel` як звичайну/default робочу branch

Додатково repository workflows самі перевіряють release policy, тому direct push у `main` не може опублікувати реліз.

## Дії buyer account

Authenticated buyer features навмисно **не реалізовані**:

- зміни wishlist
- зміни cart
- order history
- checkout/payment
- messages

Їх варто додавати лише після незалежної перевірки стабільного HTTP flow. Проєкт не буде емулювати їх через Playwright/Chromium.

## Операційна модель

- тільки browser-free HTTP
- marketplace tools не потребують credentials
- без checkout/payment automation
- retries лише для network errors, HTTP 429 та 5xx
- максимальний batch: 60 product IDs
- Cloudflare-protected enrichment працює fail-soft
- description/characteristics використовують окремо live-tested product API
- проєкт не заявляє, що reverse-engineered endpoints є офіційним Rozetka API

## Джерела та перевірка підходу

Реалізацію було звірено з community Rozetka integrations, зокрема `2BAD/rozetka`, `ALERTua/rozetka_api` та `joshua-light/rozetka-mcp`, після чого окремо реалізовано як невеликий TypeScript MCP-native client.

## Ліцензія

MIT
