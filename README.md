# rozetka-mcp

Browser-free MCP server for **Rozetka.ua**.

It talks directly to Rozetka's public-facing JSON backends used by its storefront. There is **no Playwright, Chromium, Bright Data, browser profile, cookie jar, GUI automation or search-engine dependency**.

> **Status: alpha / reverse-engineered integration.** Rozetka does not publish these buyer/catalog endpoints as a supported public API. Endpoint shapes can change. The client is intentionally tolerant and optional product endpoints fail soft.

## Tools

- `rozetka_search_products` — search products, filters/sort, optional batch hydration
- `rozetka_get_product` — product by id or URL; optional description/characteristics
- `rozetka_get_products` — batch hydrate up to 60 product ids
- `rozetka_list_filters` — live Rozetka filter metadata for a query/category
- `rozetka_list_categories` — fetch and flatten Rozetka's category tree
- `rozetka_search_category` — products in a category
- `rozetka_resolve_url` — product/category URL → id, offline
- `rozetka_saved_search_list`
- `rozetka_saved_search_create`
- `rozetka_saved_search_run`
- `rozetka_saved_search_delete`

## Architecture

```text
Agent / MCP client
       |
       v
  rozetka-mcp
       |
       +-- search.rozetka.com.ua          search + live filters
       +-- xl-catalog-api.rozetka.com.ua  product ids + batch details
       +-- common-api.rozetka.com.ua      category tree
       `-- product-api.rozetka.com.ua     optional description/characteristics
```

Search and product hydration are deliberately separate. A normal query is approximately:

```text
1 x search request -> product ids
1 x getDetails batch -> up to 60 rich products
```

No N+1 request loop is required.

## Install

```bash
npm install
npm run build
```

Run over stdio:

```bash
npm start
```

Development:

```bash
npm run dev
npm run check
npm test
```

Optional live smoke test:

```bash
npm run smoke -- "Deye SE-F16-C"
```

## MCP config

```json
{
  "mcpServers": {
    "rozetka": {
      "command": "node",
      "args": ["/absolute/path/to/rozetka-mcp/dist/src/index.js"]
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

Use `rozetka_list_filters` first for category-specific attributes. Then pass the exact Rozetka filter keys/values through `filters`.

## Configuration

```bash
ROZETKA_LANGUAGE=ua
ROZETKA_COUNTRY=UA
ROZETKA_FRONT_TYPE=xl
ROZETKA_HTTP_TIMEOUT_MS=15000
ROZETKA_HTTP_RETRIES=2
```

Advanced endpoint overrides are available in `.env.example` for debugging migrations when Rozetka changes an internal endpoint.

## Buyer account actions

Authenticated buyer features are intentionally **not** implemented yet:

- wishlist mutation
- cart mutation
- order history
- checkout/payment
- messages

They should be added only after a stable HTTP flow is independently verified. This project will not emulate them with Playwright/Chromium.

## Safety / operational model

- browser-free HTTP only
- no credentials required for catalog/search tools
- no checkout or payment automation
- retries only for network errors, HTTP 429 and 5xx
- bounded batch size (60 products)
- optional description/characteristics fail soft
- no claim that reverse-engineered endpoints are an official Rozetka API

## References

The integration design was cross-checked against historical open-source Rozetka clients including `2BAD/rozetka` and `ALERTua/rozetka_api`, then rewritten as a small MCP-native client rather than importing either archived project.

## License

MIT
