"use server";

import { revalidatePath } from "next/cache";
import { getCompanyId } from "@/lib/data";
import { projectCreateSchema } from "@/lib/schemas";
import type { ActionResult } from "./auth";

export async function createProjectAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = projectCreateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Kontrollera projektuppgifterna." };

  const { supabase, companyId } = await getCompanyId();
  if (!companyId) return { error: "Skapa ett företag först." };

  const value = parsed.data;
  let customerId = value.customerId;

  if (customerId) {
    const { data, error } = await supabase
      .from("customers")
      .select("id")
      .eq("id", customerId)
      .eq("company_id", companyId)
      .maybeSingle();
    if (error) return { error: error.message };
    if (!data) return { error: "Den valda kunden tillhör inte ditt företag." };
  } else if (value.newCustomer) {
    const customer = value.newCustomer;
    const { data, error } = await supabase
      .from("customers")
      .insert({
        company_id: companyId,
        type: customer.type,
        name: customer.name,
        organization_number: customer.type === "company" ? customer.organizationNumber || null : null,
        email: customer.email || null,
        phone: customer.phone || null,
        address: customer.address || null,
        postal_code: customer.postalCode || null,
        city: customer.city || null,
      })
      .select("id")
      .single();
    if (error || !data) return { error: error?.message ?? "Det gick inte att skapa kunden." };
    customerId = String(data.id);
  }

  if (!customerId) return { error: "Välj eller skapa en kund för projektet." };

  const { data, error } = await supabase
    .from("projects")
    .insert({
      company_id: companyId,
      customer_id: customerId,
      title: value.title,
      description: value.description || null,
    })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "Det gick inte att skapa projektet." };

  revalidatePath("/app/projects");
  revalidatePath("/app/customers");
  return { data: { id: String(data.id) } };
}
