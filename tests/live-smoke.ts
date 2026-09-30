import { loadConfig } from "../src/config.js";
import { RozetkaClient } from "../src/rozetka/client.js";

const client = new RozetkaClient(loadConfig());
const result = await client.search({ query: process.argv[2] || "iphone", limit: 3, hydrate: true });
console.log(JSON.stringify(result, null, 2));
