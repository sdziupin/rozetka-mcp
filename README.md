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

## Branch and release flow

Development happens on `devel`. `main` is the release branch.

Normal flow:

```text
feature work
   ↓
devel
   ↓  PR
main
   ↓  automatic release
GitHub Release + npm
```

A PR into `main` must contain a package version that is not already published on npm. Before opening or merging the release PR, bump the version on `devel`:

```bash
npm run version:patch
# or
npm run version:minor
npm run version:major
```

Commit that version change to `devel`. CI checks that the version is still available on npm.

The release workflow only accepts automatic releases from commits associated with a merged `devel → main` pull request. A direct push to `main` fails the main-policy check and is refused by the release workflow.

### npm publishing secret

The repository must have this GitHub Actions repository secret:

```text
NPM_TOKEN=<npm automation/publish token>
```

The token is exposed to npm only as `NODE_AUTH_TOKEN` inside the publish step and is never committed.

On every valid merge into `main`, `.github/workflows/publish.yml`:

1. verifies the commit came from a merged `devel → main` PR
2. installs dependencies
3. typechecks
4. runs unit tests
5. builds the runtime
6. validates the npm tarball
7. runs the live Rozetka smoke test
8. publishes the version from `package.json` to npm when not already published
9. creates the matching GitHub Release `vX.Y.Z`

The workflow is retry-safe: if npm publishing succeeded but GitHub Release creation failed, a rerun skips the existing npm version and creates the missing Release.

### GitHub branch protection

The repository includes a one-shot admin helper for the only settings GitHub does not expose to this connector:

```bash
./scripts/configure-github.sh
```

It sets `devel` as the default branch and applies hard protection to `main`.

Recommended hard protection for `main`:

- require a pull request before merging
- require CI checks: `test`, `docker`, `release-version`, and live smoke
- require the branch to be up to date
- block force pushes
- block branch deletion
- keep `devel` as the normal/default working branch

The repository workflows additionally enforce the release policy in CI so a direct `main` push cannot publish a release.

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
