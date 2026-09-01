"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateWithAi, reviewWithAi, type AiGeneratedItem } from "@/lib/ai";
import { getCalculation, getCompanyId, getCurrentCompany, getLibrary } from "@/lib/data";
import {
  calculateLineTotal,
  calculateVat,
  minorToSek,
  sumMoney,
} from "@/lib/money";
import { aiPromptSchema, calculationSchema } from "@/lib/schemas";
import { duplicateCalculationItems } from "@/lib/calculation-utils";
import type { CalculationItem } from "@/types/domain";
import type { ActionResult } from "./auth";

function toDbItem(item: CalculationItem, calculationId: string) {
  const totalCost = calculateLineTotal(item.quantity, item.costPrice);
  const totalPrice = calculateLineTotal(item.quantity, item.unitPrice);
  return {
    id: item.id, calculation_id: calculationId, type: item.type, category: item.category,
    name: item.name, description: item.description, quantity: item.quantity, unit: item.unit,
    cost_price: minorToSek(item.costPrice), markup_percent: item.markupPercent,
    unit_price: minorToSek(item.unitPrice), total_cost: minorToSek(totalCost), total_price: minorToSek(totalPrice),
    sort_order: item.sortOrder, ai_generated: item.aiGenerated,
  };
}

function totals(items: CalculationItem[], vatRate: number) {
  const normalized = items.map((item) => ({
    ...item,
    totalCost: calculateLineTotal(item.quantity, item.costPrice),
    totalPrice: calculateLineTotal(item.quantity, item.unitPrice),
  }));
  const subtotal = sumMoney(normalized.map((item) => item.totalPrice));
  const vat = calculateVat(subtotal, vatRate);
  return { items: normalized, subtotal, vat, total: subtotal + vat };
}

async function assertCustomerBelongsToCompany(customerId: string | null, companyId: string, supabase: Awaited<ReturnType<typeof getCompanyId>>["supabase"]) {
  if (!customerId) return true;
  const { data, error } = await supabase.from("customers").select("id").eq("id", customerId).eq("company_id", companyId).maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function createManualCalculationAction(input: { title?: string; customerId?: string | null }): Promise<ActionResult<{ id: string }>> {
  const title = z.string().trim().min(2).max(160).safeParse(input.title ?? "Ny kalkyl");
  const customerId = input.customerId && z.string().uuid().safeParse(input.customerId).success ? input.customerId : null;
  if (!title.success) return { error: "Ange en tydlig rubrik för kalkylen." };
  const [company, context] = await Promise.all([getCurrentCompany(), getCompanyId()]);
  if (!company || !context.companyId) return { error: "Skapa ett företag först." };
  if (!(await assertCustomerBelongsToCompany(customerId, context.companyId, context.supabase))) return { error: "Kunden tillhör inte ditt företag." };
  const { data, error } = await context.supabase.from("calculations").insert({
    company_id: context.companyId, customer_id: customerId, title: title.data,
    status: "draft", vat_rate: company.defaultVatRate, ai_generated: false,
  }).select("id").single();
  if (error || !data) return { error: error?.message ?? "Det gick inte att skapa kalkylen." };
  revalidatePath("/app/calculations");
  return { data: { id: String(data.id) } };
}

export async function saveCalculationAction(input: unknown): Promise<ActionResult> {
  const parsed = calculationSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Kontrollera kalkylen." };
  const calculation = parsed.data;
  const { supabase, companyId } = await getCompanyId();
  if (!companyId) return { error: "Skapa ett företag först." };
  if (!(await assertCustomerBelongsToCompany(calculation.customerId, companyId, supabase))) return { error: "Kunden tillhör inte ditt företag." };
  const result = totals(calculation.items, calculation.vatRate);
  const { error: updateError } = await supabase.from("calculations").update({
    title: calculation.title, description: calculation.description, source_input: calculation.sourceInput,
    customer_id: calculation.customerId, status: calculation.status, vat_rate: calculation.vatRate,
    subtotal_ex_vat: minorToSek(result.subtotal), vat_amount: minorToSek(result.vat),
    total_inc_vat: minorToSek(result.total), ai_generated: calculation.aiGenerated,
  }).eq("id", calculation.id).eq("company_id", companyId);
  if (updateError) return { error: updateError.message };

  const { error: deleteError } = await supabase.from("calculation_items").delete().eq("calculation_id", calculation.id);
  if (deleteError) return { error: deleteError.message };
  if (result.items.length) {
    const { error: insertError } = await supabase.from("calculation_items").insert(result.items.map((item) => toDbItem(item, calculation.id)));
    if (insertError) return { error: insertError.message };
  }
  revalidatePath(`/app/calculations/${calculation.id}`);
  revalidatePath("/app/calculations");
  revalidatePath("/app");
  return {};
}

export async function duplicateCalculationAction(id: string): Promise<ActionResult<{ id: string }>> {
  if (!z.string().uuid().safeParse(id).success) return { error: "Ogiltigt kalkyl-id." };
  const source = await getCalculation(id);
  const { supabase, companyId } = await getCompanyId();
  if (!source || !companyId) return { error: "Kalkylen kunde inte hittas." };
  const copyTotals = totals(source.items, source.vatRate);
  const { data: duplicate, error } = await supabase.from("calculations").insert({
    company_id: companyId, customer_id: source.customerId, title: `${source.title} (kopia)`,
    description: source.description, source_input: source.sourceInput, status: "draft", vat_rate: source.vatRate,
    subtotal_ex_vat: minorToSek(copyTotals.subtotal), vat_amount: minorToSek(copyTotals.vat),
    total_inc_vat: minorToSek(copyTotals.total), ai_generated: source.aiGenerated,
  }).select("id").single();
  if (error || !duplicate) return { error: error?.message ?? "Kalkylen kunde inte dupliceras." };
  if (copyTotals.items.length) {
    const items = duplicateCalculationItems(copyTotals.items, randomUUID).map((item) => toDbItem(item, String(duplicate.id)));
    const { error: itemsError } = await supabase.from("calculation_items").insert(items);
    if (itemsError) return { error: itemsError.message };
  }
  revalidatePath("/app/calculations");
  return { data: { id: String(duplicate.id) } };
}

export async function archiveCalculationAction(id: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(id).success) return { error: "Ogiltigt kalkyl-id." };
  const { supabase } = await getCompanyId();
  const { error } = await supabase.from("calculations").update({ status: "archived" }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/app/calculations");
  return {};
}

function mapAiItem(
  aiItem: AiGeneratedItem,
  index: number,
  library: Awaited<ReturnType<typeof getLibrary>>,
  defaults: { hourlyRate: number; materialMarkup: number; otherMarkup: number },
): CalculationItem {
  const normalize = (value: string) => value.trim().toLocaleLowerCase("sv-SE");
  const source = aiItem.type === "labor"
    ? library.labor.find((entry) => normalize(entry.name) === normalize(aiItem.name))
    : aiItem.type === "material"
      ? library.materials.find((entry) => normalize(entry.name) === normalize(aiItem.name))
      : undefined;
  const costPrice = source?.costPrice ?? 0;
  const markupPercent = source?.markupPercent ?? (aiItem.type === "material" ? defaults.materialMarkup : aiItem.type === "other" ? defaults.otherMarkup : 0);
  const unitPrice = source?.unitPrice ?? (aiItem.type === "labor" ? defaults.hourlyRate : 0);
  return {
    id: randomUUID(), type: aiItem.type, category: null, name: source?.name ?? aiItem.name,
    description: aiItem.description ?? null, quantity: aiItem.quantity, unit: source?.unit ?? aiItem.unit,
    costPrice, markupPercent, unitPrice, totalCost: calculateLineTotal(aiItem.quantity, costPrice),
    totalPrice: calculateLineTotal(aiItem.quantity, unitPrice), sortOrder: index, aiGenerated: true,
  };
}

export async function createAiCalculationAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = aiPromptSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Beskriv arbetet först." };
  const [company, context, library] = await Promise.all([getCurrentCompany(), getCompanyId(), getLibrary()]);
  if (!company || !context.companyId) return { error: "Skapa ett företag först." };
  let generated: Awaited<ReturnType<typeof generateWithAi>>;
  try {
    generated = await generateWithAi({
      description: parsed.data.description,
      availableLabor: library.labor.filter((item) => item.active).map((item) => ({ name: item.name, unit: item.unit })),
      availableMaterials: library.materials.filter((item) => item.active).map((item) => ({ name: item.name, unit: item.unit })),
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "AI-tjänsten svarade inte." };
  }
  const items = generated.items.map((item, index) => mapAiItem(item, index, library, {
    hourlyRate: company.defaultHourlyRate, materialMarkup: company.defaultMaterialMarkup, otherMarkup: company.defaultOtherMarkup,
  }));
  const calculated = totals(items, company.defaultVatRate);
  const { data, error } = await context.supabase.from("calculations").insert({
    company_id: context.companyId, title: generated.title, source_input: parsed.data.description, status: "draft",
    vat_rate: company.defaultVatRate, subtotal_ex_vat: minorToSek(calculated.subtotal), vat_amount: minorToSek(calculated.vat),
    total_inc_vat: minorToSek(calculated.total), ai_generated: true,
  }).select("id").single();
  if (error || !data) return { error: error?.message ?? "Det gick inte att skapa AI-kalkylen." };
  const { error: itemError } = await context.supabase.from("calculation_items").insert(calculated.items.map((item) => toDbItem(item, String(data.id))));
  if (itemError) return { error: itemError.message };
  revalidatePath("/app/calculations");
  return { data: { id: String(data.id) } };
}

export async function requestCalculationReviewAction(calculationId: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(calculationId).success) return { error: "Ogiltigt kalkyl-id." };
  const calculation = await getCalculation(calculationId);
  if (!calculation) return { error: "Kalkylen kunde inte hittas." };
  let review: Awaited<ReturnType<typeof reviewWithAi>>;
  try {
    review = await reviewWithAi(calculation);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "AI-granskningen misslyckades." };
  }
  const { supabase } = await getCompanyId();
  const { data: reviewRow, error } = await supabase.from("calculation_reviews").insert({
    calculation_id: calculation.id, summary: review.summary, status: "completed",
  }).select("id").single();
  if (error || !reviewRow) return { error: error?.message ?? "Granskningen kunde inte sparas." };
  if (review.items.length) {
    const { error: itemError } = await supabase.from("calculation_review_items").insert(review.items.map((item) => ({
      review_id: reviewRow.id, type: item.type, severity: item.severity, title: item.title,
      description: item.description, suggested_action: item.suggested_action ?? null,
      proposed_item: item.proposed_item ?? null, status: "pending",
    })));
    if (itemError) return { error: itemError.message };
  }
  await supabase.from("calculations").update({ status: "reviewed" }).eq("id", calculation.id);
  revalidatePath(`/app/calculations/${calculation.id}`);
  return {};
}

export async function resolveReviewItemAction(input: { id: string; action: "accepted" | "dismissed" }): Promise<ActionResult> {
  const validated = z.object({ id: z.string().uuid(), action: z.enum(["accepted", "dismissed"]) }).safeParse(input);
  if (!validated.success) return { error: "Ogiltigt granskningsval." };
  const { supabase } = await getCompanyId();
  const { data: reviewItem, error } = await supabase.from("calculation_review_items").select("*, calculation_reviews(calculation_id)").eq("id", validated.data.id).maybeSingle();
  if (error || !reviewItem) return { error: error?.message ?? "Granskningsförslaget kunde inte hittas." };
  const raw = reviewItem as Record<string, unknown>;
  const reviewData = raw.calculation_reviews as Record<string, unknown> | null;
  const calculationId = reviewData?.calculation_id ? String(reviewData.calculation_id) : null;
  if (validated.data.action === "accepted" && raw.proposed_item && calculationId) {
    const proposal = raw.proposed_item as Record<string, unknown>;
    const type = proposal.type;
    if (type === "labor" || type === "material" || type === "other") {
      const calculation = await getCalculation(calculationId);
      if (calculation) {
        const proposed = mapAiItem({
          type, name: String(proposal.name ?? "Föreslagen rad"), description: proposal.description ? String(proposal.description) : null,
          quantity: Number(proposal.quantity ?? 1), unit: String(proposal.unit ?? "st"),
        }, calculation.items.length, { labor: [], materials: [] }, { hourlyRate: 0, materialMarkup: 0, otherMarkup: 0 });
        const { error: addError } = await supabase.from("calculation_items").insert(toDbItem(proposed, calculationId));
        if (addError) return { error: addError.message };
      }
    }
  }
  const { error: updateError } = await supabase.from("calculation_review_items").update({ status: validated.data.action }).eq("id", validated.data.id);
  if (updateError) return { error: updateError.message };
  if (calculationId) revalidatePath(`/app/calculations/${calculationId}`);
  return {};
}
