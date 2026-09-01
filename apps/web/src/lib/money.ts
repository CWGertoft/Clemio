import Decimal from "decimal.js";

/**
 * Monetary values inside the application are integer öre. PostgreSQL stores
 * exact numeric SEK values; conversion happens only at the persistence edge.
 */
export type MinorUnits = number;

const SEK_SCALE = new Decimal(100);

function integer(value: Decimal): MinorUnits {
  return value.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
}

export function sekToMinor(value: Decimal.Value | null | undefined): MinorUnits {
  if (value === null || value === undefined || value === "") return 0;
  return integer(new Decimal(value).times(SEK_SCALE));
}

export function minorToSek(value: MinorUnits): string {
  return new Decimal(value).div(SEK_SCALE).toFixed(2);
}

export function money(value: Decimal.Value | null | undefined): MinorUnits {
  return sekToMinor(value);
}

export function formatSek(value: MinorUnits, options?: { compact?: boolean }) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: options?.compact ? 0 : 2,
    minimumFractionDigits: options?.compact ? 0 : 0,
  }).format(new Decimal(value).div(SEK_SCALE).toNumber());
}

export function calculateUnitPrice(
  costPrice: MinorUnits,
  markupPercent: Decimal.Value,
): MinorUnits {
  return integer(
    new Decimal(costPrice).times(new Decimal(1).plus(new Decimal(markupPercent).div(100))),
  );
}

export function calculateLineTotal(
  quantity: Decimal.Value,
  unitPrice: MinorUnits,
): MinorUnits {
  return integer(new Decimal(quantity || 0).times(unitPrice));
}

export function calculateVat(subtotal: MinorUnits, vatRate: Decimal.Value): MinorUnits {
  return integer(new Decimal(subtotal).times(new Decimal(vatRate).div(100)));
}

export function sumMoney(values: MinorUnits[]): MinorUnits {
  return integer(values.reduce((total, value) => total.plus(value), new Decimal(0)));
}
