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
  hydrate: { type: "boolean", default: true, description: "Hydrate search ids through batch getDetails for richer product data." },
} as const;

export const tools = [
  {
    name: "rozetka_search_products",
    description: "Search Rozetka.ua through its JSON search backend. No browser automation. Can hydrate results through Rozetka catalog JSON API.",
    inputSchema: { type: "object", properties: searchProperties, required: ["query"], additionalProperties: false },
  },
  {
    name: "rozetka_get_product",
    description: "Get one Rozetka product by numeric id or product URL. Optionally fetch description and characteristics; failures of optional endpoints do not fail the product lookup.",
    inputSchema: {
      type: "object",
      properties: {
        id_or_url: { anyOf: [{ type: "integer", minimum: 1 }, { type: "string", minLength: 1 }] },
        include_description: { type: "boolean", default: false },
        include_characteristics: { type: "boolean", default: false },
      },
      required: ["id_or_url"],
      additionalProperties: false,
    },
  },
  {
    name: "rozetka_get_products",
    description: "Batch-hydrate up to 60 Rozetka products through the catalog JSON API.",
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
    description: "Fetch Rozetka's fat-menu JSON, flatten the category tree and optionally find categories by name/id.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" }, limit: { type: "integer", minimum: 1, maximum: 500, default: 100 } },
      additionalProperties: false,
    },
  },
  {
    name: "rozetka_search_category",
    description: "List products in a Rozetka category by category id and hydrate them in one batch.",
    inputSchema: {
      type: "object",
      properties: {
        category_id: { type: "integer", minimum: 1 }, page: { type: "integer", minimum: 1, default: 1 },
        limit: { type: "integer", minimum: 1, maximum: 60, default: 20 }, seller: { type: "string" }, sort: sortSchema,
      },
      required: ["category_id"], additionalProperties: false,
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
