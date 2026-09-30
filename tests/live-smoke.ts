import { loadConfig } from "../src/config.js";
import { RozetkaClient } from "../src/rozetka/client.js";

const client = new RozetkaClient(loadConfig());
const query = process.argv[2] || "iphone";
const result = await client.search({ query, limit: 3, hydrate: true });

console.log(JSON.stringify(result, null, 2));

if ((result.returned as number | undefined) === 0) {
  throw new Error("Live smoke returned zero products");
}
