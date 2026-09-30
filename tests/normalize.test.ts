import assert from "node:assert/strict";
import test from "node:test";
import { categoryIdFromUrl, extractIds, normalizeProduct, productId } from "../src/rozetka/normalize.js";

test("resolves product and category ids from Rozetka URLs", () => {
  assert.equal(productId("https://rozetka.com.ua/ua/foo/p280528638/"), 280528638);
  assert.equal(categoryIdFromUrl("https://rozetka.com.ua/ua/mobile-phones/c80003/"), 80003);
});

test("normalizes catalog product details", () => {
  const product = normalizeProduct({
    id: 280528638,
    title: "Phone",
    price: 10399,
    old_price: 10499,
    href: "https://rozetka.com.ua/ua/x/p280528638/",
    sell_status: "available",
    category_id: 80003,
    brand: "Samsung",
    comments_amount: 109,
    comments_mark: 3.9,
    image_main: "https://content.rozetka.com.ua/x.jpg",
  });
  assert.equal(product?.id, 280528638);
  assert.equal(product?.price, 10399);
  assert.equal(product?.available, true);
  assert.equal(product?.reviews, 109);
  assert.equal(product?.brand, "Samsung");
});


test("extracts numeric product ids from search goods arrays", () => {
  assert.deepEqual(extractIds({ data: { goods: [101, 202, 303] } }), [101, 202, 303]);
});
