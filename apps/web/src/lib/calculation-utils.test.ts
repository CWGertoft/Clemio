import assert from "node:assert/strict";
import test from "node:test";
import { formatQuoteNumber } from "./calculation-utils";

test("formats sequential customer-facing quote numbers", () => {
  assert.equal(formatQuoteNumber(2026, 1), "2026-001");
  assert.equal(formatQuoteNumber(2026, 120), "2026-120");
});
