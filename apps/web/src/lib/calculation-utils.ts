export function formatQuoteNumber(year: number, sequence: number) {
  if (!Number.isInteger(year) || !Number.isInteger(sequence) || sequence < 1) {
    throw new Error("Invalid quote number input");
  }
  return `${year}-${String(sequence).padStart(3, "0")}`;
}
