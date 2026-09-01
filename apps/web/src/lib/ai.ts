import { z } from "zod";
import type { CalculationItem, ReviewSuggestion } from "@/types/domain";

const generatedItemSchema = z.object({
  type: z.enum(["labor", "material", "other"]),
  name: z.string().min(1).max(180),
  description: z.string().max(500).nullable().optional(),
  quantity: z.number().positive().max(100000),
  unit: z.string().min(1).max(24),
});

const generatedCalculationSchema = z.object({
  title: z.string().min(2).max(160),
  items: z.array(generatedItemSchema).min(1).max(100),
});

const reviewSchema = z.object({
  summary: z.string().min(1).max(1000),
  items: z.array(z.object({
    type: z.enum(["missing_item", "quantity_check", "potential_issue"]),
    severity: z.enum(["info", "warning", "important"]),
    title: z.string().min(1).max(160),
    description: z.string().min(1).max(1000),
    suggested_action: z.string().max(500).nullable().optional(),
    proposed_item: generatedItemSchema.nullable().optional(),
  })).max(20),
});

function aiUrl(path: string) {
  const base = process.env.AI_SERVICE_URL ?? "http://localhost:8000";
  return new URL(path, base).toString();
}

async function request(path: string, body: unknown) {
  const response = await fetch(aiUrl(path), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("AI-tjänsten är inte tillgänglig. Du kan alltid skapa kalkylen manuellt.");
  }
  return response.json() as Promise<unknown>;
}

export async function generateWithAi(input: {
  description: string;
  availableLabor: Array<{ name: string; unit: string }>;
  availableMaterials: Array<{ name: string; unit: string }>;
}) {
  return generatedCalculationSchema.parse(await request("/calculations/generate", input));
}

export async function reviewWithAi(calculation: {
  title: string;
  description: string | null;
  items: CalculationItem[];
}) {
  return reviewSchema.parse(await request("/calculations/review", {
    title: calculation.title,
    description: calculation.description,
    items: calculation.items.map((item) => ({
      type: item.type,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
    })),
  }));
}

export type AiGeneratedItem = z.infer<typeof generatedItemSchema>;
export type AiReview = z.infer<typeof reviewSchema>;
export type AiSuggestion = ReviewSuggestion;
