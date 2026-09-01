"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type ActionResult<T = undefined> = { error?: string; data?: T };

const credentialsSchema = z.object({
  email: z.string().trim().email("Ange en giltig e-postadress"),
  password: z.string().min(8, "Lösenordet måste ha minst 8 tecken").max(128),
});

function formValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function signInAction(formData: FormData): Promise<ActionResult> {
  const parsed = credentialsSchema.safeParse({ email: formValue(formData, "email"), password: formValue(formData, "password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Kontrollera uppgifterna." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  return error ? { error: "Det gick inte att logga in. Kontrollera dina uppgifter." } : {};
}

export async function signUpAction(formData: FormData): Promise<ActionResult> {
  const parsed = credentialsSchema.safeParse({ email: formValue(formData, "email"), password: formValue(formData, "password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Kontrollera uppgifterna." };
  const firstName = formValue(formData, "firstName").trim();
  const lastName = formValue(formData, "lastName").trim();
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.signUp({
    ...parsed.data,
    options: {
      data: { first_name: firstName, last_name: lastName },
      emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
    },
  });
  return error ? { error: error.message } : {};
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export async function requestPasswordResetAction(formData: FormData): Promise<ActionResult> {
  const email = z.string().trim().email("Ange en giltig e-postadress").safeParse(formValue(formData, "email"));
  if (!email.success) return { error: email.error.issues[0]?.message };
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${origin}/reset-password`,
  });
  return error ? { error: error.message } : {};
}

export async function updatePasswordAction(formData: FormData): Promise<ActionResult> {
  const password = z.string().min(8, "Lösenordet måste ha minst 8 tecken").max(128).safeParse(formValue(formData, "password"));
  if (!password.success) return { error: password.error.issues[0]?.message };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: password.data });
  return error ? { error: error.message } : {};
}
