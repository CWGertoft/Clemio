import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateLineTotal,
  calculateUnitPrice,
  calculateVat,
  minorToSek,
  sekToMinor,
  sumMoney,
} from "./money";

test("converts SEK without floating point drift", () => {
  assert.equal(sekToMinor("0.1"), 10);
  assert.equal(sekToMinor("650.25"), 65025);
  assert.equal(minorToSek(65025), "650.25");
});

test("calculates material markups and VAT deterministically", () => {
  assert.equal(calculateUnitPrice(24000, "15"), 27600);
  assert.equal(calculateLineTotal("33", 27600), 910800);
  assert.equal(calculateVat(910800, "25"), 227700);
});

test("sums rows exactly in minor units", () => {
  assert.equal(sumMoney([1, 2, 3]), 6);
});
