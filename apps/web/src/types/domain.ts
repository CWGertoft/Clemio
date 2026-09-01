import type { MinorUnits } from "@/lib/money";

export type CalculationItemType = "labor" | "material" | "other";
export type CalculationStatus = "draft" | "reviewed" | "quote_created" | "archived";
export type CustomerType = "private" | "company";
export type QuoteDetailLevel = "detailed" | "summary";
export type ReviewStatus = "pending" | "accepted" | "dismissed";

export type CalculationItem = {
  id: string;
  type: CalculationItemType;
  category: string | null;
  name: string;
  description: string | null;
  quantity: number;
  unit: string;
  costPrice: MinorUnits;
  markupPercent: number;
  unitPrice: MinorUnits;
  totalCost: MinorUnits;
  totalPrice: MinorUnits;
  sortOrder: number;
  aiGenerated: boolean;
};

export type Calculation = {
  id: string;
  title: string;
  description: string | null;
  sourceInput: string | null;
  customerId: string | null;
  customerName: string | null;
  status: CalculationStatus;
  vatRate: number;
  subtotalExVat: MinorUnits;
  vatAmount: MinorUnits;
  totalIncVat: MinorUnits;
  aiGenerated: boolean;
  updatedAt: string;
  items: CalculationItem[];
};

export type Customer = {
  id: string;
  type: CustomerType;
  name: string;
  organizationNumber: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  createdAt: string;
};

export type CompanySettings = {
  id: string;
  name: string;
  organizationNumber: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  logoUrl: string | null;
  defaultVatRate: number;
  defaultHourlyRate: MinorUnits;
  defaultMaterialMarkup: number;
  defaultOtherMarkup: number;
};

export type LibraryItem = {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  unitPrice: MinorUnits;
  costPrice?: MinorUnits;
  markupPercent?: number;
  active: boolean;
};

export type ReviewSuggestion = {
  id: string;
  type: "missing_item" | "quantity_check" | "potential_issue";
  severity: "info" | "warning" | "important";
  title: string;
  description: string;
  suggestedAction: string | null;
  status: ReviewStatus;
  proposedItem?: Omit<CalculationItem, "id" | "sortOrder" | "totalCost" | "totalPrice"> | null;
};

export type Quote = {
  id: string;
  quoteNumber: string;
  title: string;
  introText: string | null;
  terms: string | null;
  detailLevel: QuoteDetailLevel;
  subtotal: MinorUnits;
  vatAmount: MinorUnits;
  total: MinorUnits;
  createdAt: string;
  customer: Customer | null;
  company: CompanySettings;
  items: CalculationItem[];
};
