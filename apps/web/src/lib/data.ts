import { redirect } from "next/navigation";
import { sekToMinor } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import type {
  Calculation,
  CalculationItem,
  CompanySettings,
  Customer,
  LibraryItem,
  Quote,
  ReviewSuggestion,
} from "@/types/domain";

type DbRow = Record<string, unknown>;

function row(value: unknown): DbRow {
  return (value ?? {}) as DbRow;
}

function string(value: unknown): string | null {
  return typeof value === "string" ? value : value === null || value === undefined ? null : String(value);
}

function number(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: unknown) {
  return sekToMinor(string(value) ?? "0");
}

function assertData<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (data === null) throw new Error("Data kunde inte hittas.");
  return data;
}

export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) redirect("/login");
  return { supabase, userId: data.claims.sub };
}

export async function getCompanyId() {
  const { supabase, userId } = await requireUser();
  const { data, error } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return { supabase, companyId: data?.company_id ? String(data.company_id) : null };
}

export function toCompany(value: unknown): CompanySettings {
  const item = row(value);
  return {
    id: String(item.id),
    name: String(item.name),
    organizationNumber: string(item.organization_number),
    email: string(item.email),
    phone: string(item.phone),
    address: string(item.address),
    postalCode: string(item.postal_code),
    city: string(item.city),
    logoUrl: string(item.logo_url),
    defaultVatRate: number(item.default_vat_rate),
    defaultHourlyRate: money(item.default_hourly_rate),
    defaultMaterialMarkup: number(item.default_material_markup),
    defaultOtherMarkup: number(item.default_other_markup),
  };
}

export async function getCurrentCompany(): Promise<CompanySettings | null> {
  const { supabase, companyId } = await getCompanyId();
  if (!companyId) return null;
  const { data, error } = await supabase.from("companies").select("*").eq("id", companyId).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toCompany(data) : null;
}

export function toCustomer(value: unknown): Customer {
  const item = row(value);
  return {
    id: String(item.id),
    type: item.type === "company" ? "company" : "private",
    name: String(item.name),
    organizationNumber: string(item.organization_number),
    email: string(item.email),
    phone: string(item.phone),
    address: string(item.address),
    postalCode: string(item.postal_code),
    city: string(item.city),
    createdAt: String(item.created_at),
  };
}

export function toItem(value: unknown): CalculationItem {
  const item = row(value);
  const type = item.type;
  return {
    id: String(item.id),
    type: type === "labor" || type === "material" ? type : "other",
    category: string(item.category),
    name: String(item.name),
    description: string(item.description),
    quantity: number(item.quantity),
    unit: String(item.unit),
    costPrice: money(item.cost_price),
    markupPercent: number(item.markup_percent),
    unitPrice: money(item.unit_price),
    totalCost: money(item.total_cost),
    totalPrice: money(item.total_price),
    sortOrder: number(item.sort_order),
    aiGenerated: Boolean(item.ai_generated),
  };
}

export function toCalculation(value: unknown, customerName: string | null = null): Calculation {
  const item = row(value);
  const nestedItems = Array.isArray(item.calculation_items) ? item.calculation_items : [];
  const status = item.status;
  return {
    id: String(item.id),
    title: String(item.title),
    description: string(item.description),
    sourceInput: string(item.source_input),
    customerId: string(item.customer_id),
    customerName,
    status: status === "reviewed" || status === "quote_created" || status === "archived" ? status : "draft",
    vatRate: number(item.vat_rate),
    subtotalExVat: money(item.subtotal_ex_vat),
    vatAmount: money(item.vat_amount),
    totalIncVat: money(item.total_inc_vat),
    aiGenerated: Boolean(item.ai_generated),
    updatedAt: String(item.updated_at),
    items: nestedItems.map(toItem).sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export async function getCustomers(): Promise<Customer[]> {
  const { supabase, companyId } = await getCompanyId();
  if (!companyId) return [];
  const { data, error } = await supabase.from("customers").select("*").eq("company_id", companyId).order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map(toCustomer);
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const { supabase } = await getCompanyId();
  const { data, error } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toCustomer(data) : null;
}

export async function getCalculations(): Promise<Calculation[]> {
  const { supabase, companyId } = await getCompanyId();
  if (!companyId) return [];
  const { data, error } = await supabase
    .from("calculations")
    .select("*, calculation_items(*)")
    .eq("company_id", companyId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);

  const customers = await getCustomers();
  const customerNames = new Map(customers.map((customer) => [customer.id, customer.name]));
  return (data ?? []).map((calculation) => {
    const calculationRow = row(calculation);
    return toCalculation(calculation, customerNames.get(string(calculationRow.customer_id) ?? "") ?? null);
  });
}

export async function getCalculation(id: string): Promise<Calculation | null> {
  const { supabase } = await getCompanyId();
  const { data, error } = await supabase
    .from("calculations")
    .select("*, calculation_items(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const calculationRow = row(data);
  const customerId = string(calculationRow.customer_id);
  const customer = customerId ? await getCustomer(customerId) : null;
  return toCalculation(data, customer?.name ?? null);
}

export async function getLibrary(): Promise<{ labor: LibraryItem[]; materials: LibraryItem[] }> {
  const { supabase, companyId } = await getCompanyId();
  if (!companyId) return { labor: [], materials: [] };
  const [laborResult, materialResult] = await Promise.all([
    supabase.from("labor_rates").select("*").eq("company_id", companyId).order("name"),
    supabase.from("materials").select("*").eq("company_id", companyId).order("name"),
  ]);
  if (laborResult.error) throw new Error(laborResult.error.message);
  if (materialResult.error) throw new Error(materialResult.error.message);
  return {
    labor: (laborResult.data ?? []).map((item) => {
      const value = row(item);
      return {
        id: String(value.id), name: String(value.name), description: string(value.description),
        unit: String(value.unit), unitPrice: money(value.unit_price), active: Boolean(value.active),
      };
    }),
    materials: (materialResult.data ?? []).map((item) => {
      const value = row(item);
      return {
        id: String(value.id), name: String(value.name), description: string(value.description),
        unit: String(value.unit), unitPrice: money(value.sale_price), costPrice: money(value.cost_price),
        markupPercent: number(value.markup_percent), active: Boolean(value.active),
      };
    }),
  };
}

export async function getQuote(id: string): Promise<Quote | null> {
  const { supabase } = await getCompanyId();
  const { data, error } = await supabase.from("quotes").select("*, quote_items(*)").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const quote = row(data);
  const [companyResult, customerResult] = await Promise.all([
    supabase.from("companies").select("*").eq("id", quote.company_id as string).maybeSingle(),
    quote.customer_id
      ? supabase.from("customers").select("*").eq("id", quote.customer_id as string).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  const company = assertData(companyResult.data, companyResult.error);
  if (customerResult.error) throw new Error(customerResult.error.message);
  const quoteItems = Array.isArray(quote.quote_items) ? quote.quote_items : [];
  return {
    id: String(quote.id), quoteNumber: String(quote.quote_number), title: String(quote.title),
    introText: string(quote.intro_text), terms: string(quote.terms),
    detailLevel: quote.detail_level === "summary" ? "summary" : "detailed",
    subtotal: money(quote.subtotal), vatAmount: money(quote.vat_amount), total: money(quote.total),
    createdAt: String(quote.created_at), customer: customerResult.data ? toCustomer(customerResult.data) : null,
    company: toCompany(company),
    items: quoteItems.map((item) => {
      const quoteItem = row(item);
      const type: CalculationItem["type"] = quoteItem.type === "labor" || quoteItem.type === "material" ? quoteItem.type : "other";
      return {
        id: String(quoteItem.id), type,
        category: null, name: String(quoteItem.name), description: string(quoteItem.description),
        quantity: number(quoteItem.quantity), unit: String(quoteItem.unit), costPrice: 0, markupPercent: 0,
        unitPrice: money(quoteItem.unit_price), totalCost: 0, totalPrice: money(quoteItem.total_price),
        sortOrder: number(quoteItem.sort_order), aiGenerated: false,
      };
    }).sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export async function getLatestReviewSuggestions(calculationId: string): Promise<{ summary: string; items: ReviewSuggestion[] } | null> {
  const { supabase } = await getCompanyId();
  const { data, error } = await supabase
    .from("calculation_reviews")
    .select("*, calculation_review_items(*)")
    .eq("calculation_id", calculationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const review = row(data);
  const items = Array.isArray(review.calculation_review_items) ? review.calculation_review_items : [];
  return {
    summary: String(review.summary),
    items: items.map((value) => {
      const item = row(value);
      const type = item.type;
      const severity = item.severity;
      const status = item.status;
      const proposed = row(item.proposed_item);
      const proposedType: CalculationItem["type"] = proposed.type === "labor" || proposed.type === "material" ? proposed.type : "other";
      return {
        id: String(item.id),
        type: type === "quantity_check" || type === "potential_issue" ? type : "missing_item",
        severity: severity === "warning" || severity === "important" ? severity : "info",
        title: String(item.title), description: String(item.description), suggestedAction: string(item.suggested_action),
        status: status === "accepted" || status === "dismissed" ? status : "pending",
        proposedItem: proposed.name ? {
          type: proposedType,
          category: null, name: String(proposed.name), description: string(proposed.description),
          quantity: number(proposed.quantity), unit: String(proposed.unit),
          costPrice: 0, markupPercent: 0, unitPrice: 0, aiGenerated: true,
        } : null,
      };
    }),
  };
}
