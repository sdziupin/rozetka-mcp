import assert from "node:assert/strict";
import test from "node:test";
import { loadConfig } from "../src/config.js";
import { RozetkaClient } from "../src/rozetka/client.js";

function response(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
}

test("search uses JSON API and batch hydrates ids", async () => {
  const seen: string[] = [];
  const fetchImpl: typeof fetch = async (input) => {
    const url = String(input);
    seen.push(url);
    if (url.includes("/search/api/")) {
      return response({ data: { goods: [{ id: 1, title: "thin" }, { id: 2, title: "thin2" }], pagination: { total: 2 } } });
    }
    if (url.includes("getDetails")) {
      return response({ data: [
        { id: 1, title: "A", price: 100, href: "https://rozetka.com.ua/a/p1/", sell_status: "available" },
        { id: 2, title: "B", price: 200, href: "https://rozetka.com.ua/b/p2/", sell_status: "available" },
      ] });
    }
    throw new Error(`unexpected url ${url}`);
  };
  const client = new RozetkaClient(loadConfig({ HOME: "/tmp" }), { fetchImpl });
  const result = await client.search({ query: "ssd", max_price: 150 });
  assert.equal(result.returned, 1);
  assert.equal((result.products as Array<{ id: number }>)[0].id, 1);
  assert.equal(seen.length, 2);
});

test("resolveUrl requires no network", () => {
  const client = new RozetkaClient(loadConfig({ HOME: "/tmp" }), { fetchImpl: async () => { throw new Error("network used"); } });
  assert.deepEqual(client.resolveUrl("https://rozetka.com.ua/ua/foo/p123/"), { type: "product", id: 123, url: "https://rozetka.com.ua/ua/foo/p123/" });
});
