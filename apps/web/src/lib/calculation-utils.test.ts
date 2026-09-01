import assert from "node:assert/strict";
import test from "node:test";
import { duplicateCalculationItems, formatQuoteNumber } from "./calculation-utils";
import type { CalculationItem } from "@/types/domain";

const item: CalculationItem = {
  id: "a", type: "labor", category: null, name: "Snickare", description: null,
  quantity: 8, unit: "tim", costPrice: 0, markupPercent: 0, unitPrice: 65000,
  totalCost: 0, totalPrice: 520000, sortOrder: 4, aiGenerated: false,
};

test("duplicates rows without sharing IDs or order", () => {
  const makeId = (() => { let number = 0; return () => `new-${++number}`; })();
  const copy = duplicateCalculationItems([item, { ...item, id: "b" }], makeId);
  assert.deepEqual(copy.map((entry) => [entry.id, entry.sortOrder]), [["new-1", 0], ["new-2", 1]]);
  assert.equal(copy[0].name, item.name);
});

test("formats sequential customer-facing quote numbers", () => {
  assert.equal(formatQuoteNumber(2026, 1), "2026-001");
  assert.equal(formatQuoteNumber(2026, 120), "2026-120");
});
