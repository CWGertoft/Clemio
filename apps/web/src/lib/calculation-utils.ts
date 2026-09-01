import type { CalculationItem } from "@/types/domain";

export function duplicateCalculationItems(items: CalculationItem[], createId: () => string): CalculationItem[] {
  return items.map((item, index) => ({ ...item, id: createId(), sortOrder: index }));
}

export function formatQuoteNumber(year: number, sequence: number) {
  if (!Number.isInteger(year) || !Number.isInteger(sequence) || sequence < 1) {
    throw new Error("Invalid quote number input");
  }
  return `${year}-${String(sequence).padStart(3, "0")}`;
}
