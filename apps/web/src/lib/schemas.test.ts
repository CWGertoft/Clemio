import assert from "node:assert/strict";
import test from "node:test";
import { calculationSchema, customerSchema, projectCreateSchema } from "./schemas";

test("rejects a calculation row with a negative quantity", () => {
  const result = calculationSchema.safeParse({
    id: "ab16ae5a-364e-4c0b-b2f1-1382095dbf1a", title: "Test", description: null,
    sourceInput: null, projectId: null, customerId: null, vatRate: 25, status: "draft", aiGenerated: false,
    items: [{ id: "582a3265-670a-4a6c-ae52-b011a4ecb842", type: "labor", category: null,
      name: "Arbete", description: null, quantity: -1, unit: "tim", costPrice: 0,
      markupPercent: 0, unitPrice: 65000, totalCost: 0, totalPrice: 0, sortOrder: 0, aiGenerated: false }],
  });
  assert.equal(result.success, false);
});

test("allows blank optional fields for a private customer", () => {
  const result = customerSchema.safeParse({
    type: "private",
    name: "WG",
    organizationNumber: null,
    email: "privatperson@example.se",
    phone: "0700000000",
    address: "Testvägen 1",
    postalCode: "11111",
    city: null,
  });
  assert.equal(result.success, true);
});

test("requires one customer source when creating a project", () => {
  const result = projectCreateSchema.safeParse({
    title: "Altan hos Andersson", description: null, customerId: null, newCustomer: null,
  });
  assert.equal(result.success, false);
});
