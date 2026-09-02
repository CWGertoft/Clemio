"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCompanyId } from "@/lib/data";
import { customerSchema } from "@/lib/schemas";
import type { ActionResult } from "./auth";

export async function createCustomerAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Kontrollera kunduppgifterna." };
  const { supabase, companyId } = await getCompanyId();
  if (!companyId) return { error: "Skapa ett företag först." };
  const value = parsed.data;
  const { data, error } = await supabase.from("customers").insert({
    company_id: companyId, type: value.type, name: value.name,
    organization_number: value.type === "company" ? value.organizationNumber || null : null,
    email: value.email || null, phone: value.phone || null,
    address: value.address || null, postal_code: value.postalCode || null, city: value.city || null,
  }).select("id").single();
  if (error || !data) return { error: error?.message ?? "Det gick inte att skapa kunden." };
  revalidatePath("/app/customers");
  revalidatePath("/app/calculations/new");
  return { data: { id: String(data.id) } };
}

export async function updateCustomerAction(id: string, input: unknown): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(id).success) return { error: "Ogiltigt kund-id." };
  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Kontrollera kunduppgifterna." };
  const { supabase } = await getCompanyId();
  const value = parsed.data;
  const { error } = await supabase.from("customers").update({
    type: value.type, name: value.name,
    organization_number: value.type === "company" ? value.organizationNumber || null : null,
    email: value.email || null, phone: value.phone || null, address: value.address || null,
    postal_code: value.postalCode || null, city: value.city || null,
  }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/app/customers");
  return {};
}
