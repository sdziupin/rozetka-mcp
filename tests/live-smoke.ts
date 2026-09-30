import { loadConfig } from "../src/config.js";
import { RozetkaClient } from "../src/rozetka/client.js";

const client = new RozetkaClient(loadConfig());
const query = process.argv[2] || "iphone";

const narrowed = await client.search({
  query,
  category_id: 80003,
  filters: { producer: "apple" },
  limit: 3,
  hydrate: false,
});
console.log("NARROWED_SEARCH", JSON.stringify(narrowed, null, 2));

const result = await client.search({ query, limit: 3, hydrate: false });
console.log("SEARCH", JSON.stringify(result, null, 2));

if ((narrowed.returned as number | undefined) === 0) {
  throw new Error("Narrowed live search returned zero products");
}
