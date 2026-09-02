import { z } from "zod";

const moneyString = z
  .string()
  .trim()
  .regex(/^\d+(?:[.,]\d{1,2})?$/, "Ange ett giltigt belopp")
  .transform((value) => value.replace(",", "."));

export const companySchema = z.object({
  name: z.string().trim().min(2, "Ange företagsnamn").max(120),
  organizationNumber: z.string().trim().max(32).optional().or(z.literal("")),
  email: z.string().trim().email("Ange en giltig e-postadress"),
  phone: z.string().trim().min(5, "Ange telefonnummer").max(40),
  address: z.string().trim().min(2, "Ange adress").max(160),
  postalCode: z.string().trim().min(3, "Ange postnummer").max(16),
  city: z.string().trim().min(2, "Ange ort").max(80),
  defaultHourlyRate: moneyString,
  defaultVatRate: z.coerce.number().min(0).max(100),
  defaultMaterialMarkup: z.coerce.number().min(0).max(500),
  defaultOtherMarkup: z.coerce.number().min(0).max(500),
});

export const customerSchema = z.object({
  type: z.enum(["private", "company"]),
  name: z.string().trim().min(2, "Ange kundens namn").max(160),
  organizationNumber: z.string().trim().max(32).nullish(),
  email: z.string().trim().email("Ange en giltig e-postadress").or(z.literal("")).nullish(),
  phone: z.string().trim().max(40).nullish(),
  address: z.string().trim().max(160).nullish(),
  postalCode: z.string().trim().max(16).nullish(),
  city: z.string().trim().max(80).nullish(),
});

export const projectCreateSchema = z.object({
  title: z.string().trim().min(2, "Ange ett projektnamn").max(160),
  description: z.string().trim().max(2000).nullable(),
  customerId: z.string().uuid().nullable(),
  newCustomer: customerSchema.nullable(),
}).superRefine((value, context) => {
  if (!value.customerId && !value.newCustomer) {
    context.addIssue({ code: "custom", path: ["customerId"], message: "Välj eller skapa en kund för projektet." });
  }
  if (value.customerId && value.newCustomer) {
    context.addIssue({ code: "custom", path: ["customerId"], message: "Välj antingen en befintlig kund eller skapa en ny." });
  }
});

export const calculationItemSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["labor", "material", "other"]),
  category: z.string().max(80).nullable(),
  name: z.string().trim().min(1, "Ange radnamn").max(180),
  description: z.string().trim().max(500).nullable(),
  quantity: z.coerce.number().positive("Antalet måste vara större än noll").max(100000),
  unit: z.string().trim().min(1).max(24),
  costPrice: z.number().int().min(0).max(900000000000000),
  markupPercent: z.number().min(0).max(10000),
  unitPrice: z.number().int().min(0).max(900000000000000),
  totalCost: z.number().int().min(0),
  totalPrice: z.number().int().min(0),
  sortOrder: z.number().int().min(0),
  aiGenerated: z.boolean(),
});

export const calculationSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(2, "Ange en rubrik").max(160),
  description: z.string().trim().max(2000).nullable(),
  sourceInput: z.string().trim().max(5000).nullable(),
  projectId: z.string().uuid().nullable(),
  customerId: z.string().uuid().nullable(),
  vatRate: z.number().min(0).max(100),
  status: z.enum(["draft", "reviewed", "quote_created", "archived"]),
  aiGenerated: z.boolean(),
  items: z.array(calculationItemSchema).max(250),
});

export const aiPromptSchema = z.object({
  description: z.string().trim().min(12, "Beskriv arbetet lite mer detaljerat").max(5000),
});

export const quoteSchema = z.object({
  calculationId: z.string().uuid(),
  title: z.string().trim().min(2).max(160),
  introText: z.string().trim().max(3000).nullable(),
  terms: z.string().trim().max(5000).nullable(),
  detailLevel: z.enum(["detailed", "summary"]),
});
