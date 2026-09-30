import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { SavedSearchStore } from "../src/saved-searches.js";

test("saved searches persist", async () => {
  const dir = await mkdtemp(join(tmpdir(), "rozetka-mcp-"));
  try {
    const store = new SavedSearchStore(join(dir, "saved.json"));
    const created = await store.create("ssd", { query: "ssd 2.5", max_price: 1500 });
    assert.equal((await store.list()).length, 1);
    assert.equal((await store.get(created.id)).search.query, "ssd 2.5");
    await store.remove(created.id);
    assert.equal((await store.list()).length, 0);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
