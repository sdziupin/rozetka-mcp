import assert from "node:assert/strict";
import test from "node:test";
import { loadConfig } from "../src/config.js";

test("loadConfig has browser-free API defaults", () => {
  const config = loadConfig({ HOME: "/tmp/home" });
  assert.equal(config.language, "ua");
  assert.equal(config.country, "UA");
  assert.match(config.searchApiBase, /search\.rozetka\.com\.ua/);
  assert.match(config.catalogApiBase, /xl-catalog-api\.rozetka\.com\.ua/);
  assert.match(config.commonApiBase, /common-api\.rozetka\.com\.ua/);
  assert.equal(config.httpRetries, 2);
});
