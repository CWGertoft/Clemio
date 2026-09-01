"use server";

import { revalidatePath } from "next/cache";
import { quoteSchema } from "@/lib/schemas";
import { getCalculation, getCompanyId, getCurrentCompany } from "@/lib/data";
import { minorToSek } from "@/lib/money";
import type { ActionResult } from "./auth";

export async function createQuoteAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = quoteSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Kontrollera offertuppgifterna." };
  const calculation = await getCalculation(parsed.data.calculationId);
  const [company, context] = await Promise.all([getCurrentCompany(), getCompanyId()]);
  if (!calculation || !company || !context.companyId) return { error: "Kalkylen kunde inte hittas." };
  const { data: quoteNumber, error: sequenceError } = await context.supabase.rpc("next_quote_number", {
    target_company_id: company.id,
    quote_year: new Date().getFullYear(),
  });
  if (sequenceError || !quoteNumber) return { error: sequenceError?.message ?? "Det gick inte att skapa ett offertnummer." };
  const { data: quote, error } = await context.supabase.from("quotes").insert({
    company_id: company.id, calculation_id: calculation.id, customer_id: calculation.customerId,
    quote_number: quoteNumber, title: parsed.data.title, intro_text: parsed.data.introText,
    terms: parsed.data.terms, detail_level: parsed.data.detailLevel,
    subtotal: minorToSek(calculation.subtotalExVat), vat_amount: minorToSek(calculation.vatAmount),
    total: minorToSek(calculation.totalIncVat), status: "generated",
  }).select("id").single();
  if (error || !quote) return { error: error?.message ?? "Det gick inte att skapa offerten." };
  const { error: itemsError } = await context.supabase.from("quote_items").insert(calculation.items.map((item) => ({
    quote_id: quote.id, type: item.type, name: item.name, description: item.description,
    quantity: item.quantity, unit: item.unit, unit_price: minorToSek(item.unitPrice),
    total_price: minorToSek(item.totalPrice), sort_order: item.sortOrder,
  })));
  if (itemsError) return { error: itemsError.message };
  await context.supabase.from("calculations").update({ status: "quote_created" }).eq("id", calculation.id);
  revalidatePath(`/app/calculations/${calculation.id}`);
  revalidatePath(`/app/quotes/${quote.id}`);
  return { data: { id: String(quote.id) } };
}
