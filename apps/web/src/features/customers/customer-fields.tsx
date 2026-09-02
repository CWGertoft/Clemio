"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Customer, CustomerType } from "@/types/domain";

export type CustomerDraft = Omit<Customer, "id" | "createdAt">;

export const emptyCustomerDraft: CustomerDraft = {
  type: "private",
  name: "",
  organizationNumber: null,
  email: null,
  phone: null,
  address: null,
  postalCode: null,
  city: null,
};

export function customerTypeLabel(type: CustomerType) {
  return type === "company" ? "Företag" : "Privatperson";
}

export function CustomerFields({
  draft,
  onChange,
  idPrefix,
}: {
  draft: CustomerDraft;
  onChange: (draft: CustomerDraft) => void;
  idPrefix: string;
}) {
  function setField<Key extends keyof CustomerDraft>(key: Key, value: CustomerDraft[Key]) {
    onChange({ ...draft, [key]: value });
  }

  function setOptionalField(
    key: "organizationNumber" | "email" | "phone" | "address" | "postalCode" | "city",
    value: string,
  ) {
    setField(key, value || null);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor={`${idPrefix}-type`}>Kundtyp</label>
        <Select
          value={draft.type}
          onValueChange={(value) => {
            const type: CustomerType = value === "company" ? "company" : "private";
            onChange({ ...draft, type, organizationNumber: type === "company" ? draft.organizationNumber : null });
          }}
        >
          <SelectTrigger id={`${idPrefix}-type`} className="w-full">
            <SelectValue>{(value: unknown) => customerTypeLabel(value === "company" ? "company" : "private")}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="private">Privatperson</SelectItem>
            <SelectItem value="company">Företag</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <CustomerField id={`${idPrefix}-name`} label="Namn" value={draft.name} required onChange={(value) => setField("name", value)} />
      {draft.type === "company" && (
        <CustomerField
          id={`${idPrefix}-organization-number`}
          label="Organisationsnummer"
          value={draft.organizationNumber ?? ""}
          onChange={(value) => setOptionalField("organizationNumber", value)}
        />
      )}
      <CustomerField id={`${idPrefix}-email`} label="E-post" type="email" value={draft.email ?? ""} onChange={(value) => setOptionalField("email", value)} />
      <CustomerField id={`${idPrefix}-phone`} label="Telefon" value={draft.phone ?? ""} onChange={(value) => setOptionalField("phone", value)} />
      <CustomerField id={`${idPrefix}-address`} label="Adress" value={draft.address ?? ""} onChange={(value) => setOptionalField("address", value)} />
      <div className="grid grid-cols-2 gap-3">
        <CustomerField id={`${idPrefix}-postal-code`} label="Postnummer" value={draft.postalCode ?? ""} onChange={(value) => setOptionalField("postalCode", value)} />
        <CustomerField id={`${idPrefix}-city`} label="Ort" value={draft.city ?? ""} onChange={(value) => setOptionalField("city", value)} />
      </div>
    </div>
  );
}

function CustomerField({
  id,
  label,
  value,
  onChange,
  required = false,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium" htmlFor={id}>{label}</label>
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} required={required} type={type} />
    </div>
  );
}
