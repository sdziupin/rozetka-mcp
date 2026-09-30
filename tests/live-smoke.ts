import { loadConfig } from "../src/config.js";
import { RozetkaClient } from "../src/rozetka/client.js";

const client = new RozetkaClient(loadConfig());

const search = await client.search({
  query: "Asus Zenbook 14",
  limit: 3,
  hydrate: false,
});

if (typeof search.returned !== "number" || search.returned < 1) {
  throw new Error("Live search returned no Rozetka product ids");
}

const products = search.products as Array<{ id?: number }>;
const productId = products[0]?.id;
if (!productId) throw new Error("Live search result has no product id");

const resolved = await client.getProduct(productId);
const product = resolved.product as { id?: number } | undefined;
if (product?.id !== productId) throw new Error("Product resolution returned the wrong id");
if (!resolved.description || resolved.description_error) throw new Error("Product description API is unavailable");
if (!resolved.characteristics || resolved.characteristics_error) throw new Error("Product characteristics API is unavailable");

const filters = await client.listFilters("Asus Zenbook 14");
if (!Array.isArray(filters.options)) throw new Error("Search filter metadata is unavailable");

const categories = await client.listCategories("Asus Zenbook 14", 20);
if (!Array.isArray(categories.categories)) throw new Error("Category suggestions are unavailable");

console.log(JSON.stringify({
  search_returned: search.returned,
  product_id: productId,
  description: "ok",
  characteristics: "ok",
  filters: "ok",
  categories: "ok",
}, null, 2));
