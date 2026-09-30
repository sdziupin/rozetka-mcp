# rozetka-mcp

[![CI](https://github.com/sdziupin/rozetka-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/sdziupin/rozetka-mcp/actions/workflows/ci.yml)
[![Live Rozetka smoke](https://github.com/sdziupin/rozetka-mcp/actions/workflows/live-smoke.yml/badge.svg)](https://github.com/sdziupin/rozetka-mcp/actions/workflows/live-smoke.yml)

Browser-free MCP server for **Rozetka.ua**.

It uses Rozetka's public-facing JSON backends directly. There is **no Playwright, Chromium, Bright Data, browser profile, cookie jar, GUI automation or search-engine dependency**.

> **Status: alpha / reverse-engineered integration.** Rozetka does not publish these buyer/catalog endpoints as a supported public API. Endpoint shapes and anti-bot policy can change.

## What is reliable

The core path uses endpoints that are live-tested from GitHub Actions:

- `search.rozetka.com.ua` — product search, product ids, filters, category suggestions
- `product-api.rozetka.com.ua` — product description and characteristics

Some richer Rozetka hosts such as `xl-catalog-api.rozetka.com.ua`, `common-api.rozetka.com.ua`, and the storefront itself can return a Cloudflare managed challenge from datacenter IPs. Rich catalog hydration is therefore **best-effort only** and never required for the core tools to return safely.

## MCP tools

- `rozetka_search_products` — search products, filters/sort, optional best-effort rich hydration
- `rozetka_get_product` — product id/URL lookup plus description and characteristics by default
- `rozetka_get_products` — resolve up to 60 product ids; rich hydration when available, safe id fallback otherwise
- `rozetka_list_filters` — live filter metadata for a query
- `rozetka_list_categories` — category suggestions for a query from the search API
- `rozetka_resolve_url` — product/category URL → id, offline
- `rozetka_saved_search_list`
- `rozetka_saved_search_create`
- `rozetka_saved_search_run`
- `rozetka_saved_search_delete`

## Install from npm

After the first npm release, no clone/build step is needed.

### npx

```bash
npx -y rozetka-mcp
```

### Global install

```bash
npm install -g rozetka-mcp
rozetka-mcp
```

### MCP configuration

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

## Install from source

Requirements: Node.js 20+.

```bash
git clone https://github.com/sdziupin/rozetka-mcp.git
cd rozetka-mcp
npm install
npm run check
npm test
npm run build
npm start
```

Development:

```bash
npm run dev
npm run smoke
npm run pack:check
```

Source checkout MCP config:

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

## Search example

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

Use `rozetka_list_filters` first for category-specific attributes, then pass the exact Rozetka filter keys/values through `filters`.

Some high-level queries can be converted by Rozetka into a category redirect instead of a product list. In that case the tool returns `navigate_to` rather than pretending it found products.

## Configuration

```bash
ROZETKA_LANGUAGE=ua
ROZETKA_COUNTRY=UA
ROZETKA_FRONT_TYPE=xl
ROZETKA_HTTP_TIMEOUT_MS=15000
ROZETKA_HTTP_RETRIES=2
```

Advanced endpoint overrides are available in `.env.example`.

## CI

`.github/workflows/ci.yml` validates:

- TypeScript typecheck
- unit tests
- production build
- npm package dry-run
- built CLI entrypoint
- Docker image build

`.github/workflows/live-smoke.yml` validates the real Rozetka core API path on pushes that affect runtime behavior, on manual dispatch, and weekly.

The live smoke intentionally tests only the public search/product endpoints that this package promises as its reliable core. Cloudflare-protected optional hydration is fail-soft and is not treated as a release blocker.

## Publishing to npm

Publishing is handled by `.github/workflows/publish.yml`.

### 1. Create an npm token

Create an npm access token with permission to publish `rozetka-mcp`.

### 2. Add the GitHub Actions secret

In the GitHub repository:

```text
Settings
→ Secrets and variables
→ Actions
→ New repository secret
```

Create:

```text
Name:  NPM_TOKEN
Value: <your npm publish token>
```

The workflow maps this secret to `NODE_AUTH_TOKEN`. The token is never stored in the repository.

### 3. Release

Update `package.json` version, for example:

```bash
npm version patch --no-git-tag-version
```

Commit and push the version change, then create a GitHub Release with a tag matching the version exactly:

```text
package.json: 0.1.0
release tag:  v0.1.0
```

On a published GitHub Release the workflow:

1. installs dependencies
2. typechecks
3. runs unit tests
4. builds
5. validates the npm tarball
6. runs the live Rozetka smoke test
7. verifies `vX.Y.Z` matches `package.json`
8. publishes with `npm publish --access public --provenance`

The workflow can also be started manually. Manual runs default to validation-only; set the `publish` input to `true` to publish the current package version.

## Buyer account actions

Authenticated buyer features are intentionally **not implemented**:

- wishlist mutation
- cart mutation
- order history
- checkout/payment
- messages

They should only be added after a stable HTTP flow is independently verified. This project will not emulate them with Playwright/Chromium.

## Operational model

- browser-free HTTP only
- no credentials required for marketplace tools
- no checkout/payment automation
- retries only for network errors, HTTP 429 and 5xx
- maximum batch size: 60 product ids
- Cloudflare-protected enrichment fails soft
- description/characteristics use the independently live-tested product API
- no claim that reverse-engineered endpoints are an official Rozetka API

## References

The implementation was cross-checked against community Rozetka integrations including `2BAD/rozetka`, `ALERTua/rozetka_api`, and `joshua-light/rozetka-mcp`, then implemented as a small TypeScript MCP-native client.

## License

MIT
