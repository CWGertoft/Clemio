"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { companySchema } from "@/lib/schemas";
import { minorToSek, sekToMinor } from "@/lib/money";
import { getCompanyId } from "@/lib/data";
import type { ActionResult } from "./auth";

export async function createCompanyAction(input: unknown): Promise<ActionResult<{ companyId: string }>> {
  const parsed = companySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Kontrollera företagsuppgifterna." };
  const { supabase, companyId } = await getCompanyId();
  if (companyId) return { error: "Ditt konto är redan kopplat till ett företag." };
  const data = parsed.data;
  const { data: newCompanyId, error } = await supabase.rpc("create_company_with_owner", {
    p_name: data.name,
    p_organization_number: data.organizationNumber || "",
    p_email: data.email,
    p_phone: data.phone,
    p_address: data.address,
    p_postal_code: data.postalCode,
    p_city: data.city,
    p_default_vat_rate: data.defaultVatRate,
    p_default_hourly_rate: minorToSek(sekToMinor(data.defaultHourlyRate)),
    p_default_material_markup: data.defaultMaterialMarkup,
    p_default_other_markup: data.defaultOtherMarkup,
  });
  if (error || !newCompanyId) return { error: error?.message ?? "Det gick inte att skapa företaget." };
  revalidatePath("/app", "layout");
  return { data: { companyId: String(newCompanyId) } };
}

export async function updateCompanyAction(input: unknown): Promise<ActionResult> {
  const parsed = companySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Kontrollera företagsuppgifterna." };
  const { supabase, companyId } = await getCompanyId();
  if (!companyId) return { error: "Skapa ett företag först." };
  const value = parsed.data;
  const { error } = await supabase.from("companies").update({
    name: value.name, organization_number: value.organizationNumber || null, email: value.email,
    phone: value.phone, address: value.address, postal_code: value.postalCode, city: value.city,
    default_vat_rate: value.defaultVatRate,
    default_hourly_rate: minorToSek(sekToMinor(value.defaultHourlyRate)),
    default_material_markup: value.defaultMaterialMarkup, default_other_markup: value.defaultOtherMarkup,
  }).eq("id", companyId);
  if (error) return { error: error.message };
  revalidatePath("/app", "layout");
  return {};
}

const librarySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  unit: z.string().trim().min(1).max(24),
  unitPrice: z.string().trim().regex(/^\d+(?:[.,]\d{1,2})?$/),
  costPrice: z.string().trim().regex(/^\d+(?:[.,]\d{1,2})?$/).optional(),
  markupPercent: z.coerce.number().min(0).max(10000).optional(),
});

export async function upsertLaborRateAction(input: unknown): Promise<ActionResult> {
  const parsed = librarySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Kontrollera uppgifterna." };
  const { supabase, companyId } = await getCompanyId();
  if (!companyId) return { error: "Skapa ett företag först." };
  const value = parsed.data;
  const record = {
    company_id: companyId, name: value.name, description: value.description || null, unit: value.unit,
    unit_price: minorToSek(sekToMinor(value.unitPrice)), active: true,
  };
  const result = value.id
    ? await supabase.from("labor_rates").update(record).eq("id", value.id)
    : await supabase.from("labor_rates").insert(record);
  if (result.error) return { error: result.error.message };
  revalidatePath("/app/settings");
  return {};
}

export async function upsertMaterialAction(input: unknown): Promise<ActionResult> {
  const parsed = librarySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Kontrollera uppgifterna." };
  const { supabase, companyId } = await getCompanyId();
  if (!companyId) return { error: "Skapa ett företag först." };
  const value = parsed.data;
  const record = {
    company_id: companyId, name: value.name, description: value.description || null, unit: value.unit,
    cost_price: minorToSek(sekToMinor(value.costPrice ?? "0")), markup_percent: value.markupPercent ?? 0,
    sale_price: minorToSek(sekToMinor(value.unitPrice)), active: true,
  };
  const result = value.id
    ? await supabase.from("materials").update(record).eq("id", value.id)
    : await supabase.from("materials").insert(record);
  if (result.error) return { error: result.error.message };
  revalidatePath("/app/settings");
  return {};
}

export async function setLibraryActiveAction(kind: "labor_rates" | "materials", id: string, active: boolean): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(id).success) return { error: "Ogiltigt bibliotekspost." };
  const { supabase } = await getCompanyId();
  const { error } = await supabase.from(kind).update({ active }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/app/settings");
  return {};
}
