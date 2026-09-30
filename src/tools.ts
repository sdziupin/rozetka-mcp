const sortSchema = { type: "string", enum: ["relevance", "price_asc", "price_desc", "newest"], default: "relevance" } as const;

const filterSchema = {
  type: "object",
  description: "Exact Rozetka query/filter parameters. Discover valid keys/values with rozetka_list_filters first.",
  additionalProperties: {
    anyOf: [
      { type: "string" }, { type: "number" }, { type: "boolean" },
      { type: "array", items: { anyOf: [{ type: "string" }, { type: "number" }] } },
    ],
  },
} as const;

const searchProperties = {
  query: { type: "string", minLength: 1, description: "Product search query." },
  page: { type: "integer", minimum: 1, default: 1 },
  limit: { type: "integer", minimum: 1, maximum: 60, default: 20 },
  min_price: { type: "number", minimum: 0, description: "Client-side minimum price filter after Rozetka search/hydration." },
  max_price: { type: "number", minimum: 0, description: "Client-side maximum price filter after Rozetka search/hydration." },
  seller: { type: "string", minLength: 1, description: "Rozetka seller filter, e.g. 'rozetka', when supported by the backend." },
  category_id: { type: "integer", minimum: 1 },
  sort: sortSchema,
  filters: filterSchema,
  hydrate: { type: "boolean", default: true, description: "Try rich catalog hydration when available; automatically falls back to public search results if Rozetka blocks the catalog host." },
} as const;

export const tools = [
  {
    name: "rozetka_search_products",
    description: "Search Rozetka.ua through its public-facing JSON search backend. No browser automation. Rich hydration is best-effort and never required.",
    inputSchema: { type: "object", properties: searchProperties, required: ["query"], additionalProperties: false },
  },
  {
    name: "rozetka_get_product",
    description: "Resolve one Rozetka product by numeric id or product URL. Description and characteristics are fetched by default from product-api; blocked optional catalog hydration does not fail the lookup.",
    inputSchema: {
      type: "object",
      properties: {
        id_or_url: { anyOf: [{ type: "integer", minimum: 1 }, { type: "string", minLength: 1 }] },
        include_description: { type: "boolean", default: true },
        include_characteristics: { type: "boolean", default: true },
      },
      required: ["id_or_url"],
      additionalProperties: false,
    },
  },
  {
    name: "rozetka_get_products",
    description: "Resolve up to 60 Rozetka product ids. Rich catalog hydration is attempted when available and falls back to public search/id records when blocked.",
    inputSchema: {
      type: "object",
      properties: { ids: { type: "array", minItems: 1, maxItems: 60, items: { anyOf: [{ type: "integer", minimum: 1 }, { type: "string", minLength: 1 }] } } },
      required: ["ids"], additionalProperties: false,
    },
  },
  {
    name: "rozetka_list_filters",
    description: "Return Rozetka's live filter metadata/options for a search query. Use this before passing category-specific keys in rozetka_search_products.filters.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string", minLength: 1 }, category_id: { type: "integer", minimum: 1 } },
      required: ["query"], additionalProperties: false,
    },
  },
  {
    name: "rozetka_list_categories",
    description: "Return category suggestions from Rozetka's search API for a text query. Full fat-menu enumeration is intentionally not used because common-api may be Cloudflare-protected.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string", minLength: 1 }, limit: { type: "integer", minimum: 1, maximum: 500, default: 100 } },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "rozetka_resolve_url",
    description: "Resolve a Rozetka product URL (/p<ID>/) or category URL (/c<ID>/) without a network request.",
    inputSchema: { type: "object", properties: { url: { type: "string", minLength: 1 } }, required: ["url"], additionalProperties: false },
  },
  {
    name: "rozetka_saved_search_list",
    description: "List locally saved Rozetka searches.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "rozetka_saved_search_create",
    description: "Save a structured Rozetka search locally for repeat execution.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", minLength: 1 },
        search: { type: "object", properties: searchProperties, required: ["query"], additionalProperties: false },
      },
      required: ["name", "search"], additionalProperties: false,
    },
  },
  {
    name: "rozetka_saved_search_run",
    description: "Run a locally saved Rozetka search.",
    inputSchema: { type: "object", properties: { id: { type: "string", minLength: 1 } }, required: ["id"], additionalProperties: false },
  },
  {
    name: "rozetka_saved_search_delete",
    description: "Delete a locally saved Rozetka search.",
    inputSchema: { type: "object", properties: { id: { type: "string", minLength: 1 } }, required: ["id"], additionalProperties: false },
  },
] as const;
