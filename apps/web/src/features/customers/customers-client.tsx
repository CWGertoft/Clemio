"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, MapPin, Pencil, Phone, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { createCustomerAction, updateCustomerAction } from "@/actions/customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CustomerFields,
  customerTypeLabel,
  emptyCustomerDraft,
  type CustomerDraft,
} from "@/features/customers/customer-fields";
import type { Customer } from "@/types/domain";

export function CustomersClient({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<CustomerDraft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const visible = useMemo(
    () => customers.filter((customer) => (
      `${customer.name} ${customer.email ?? ""} ${customer.city ?? ""}`
        .toLocaleLowerCase("sv-SE")
        .includes(query.toLocaleLowerCase("sv-SE"))
    )),
    [customers, query],
  );

  function startCreate() {
    setEditingId(null);
    setDraft({ ...emptyCustomerDraft });
  }

  function startEdit(customer: Customer) {
    setEditingId(customer.id);
    setDraft({
      type: customer.type,
      name: customer.name,
      organizationNumber: customer.organizationNumber,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      postalCode: customer.postalCode,
      city: customer.city,
    });
  }

  function save(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;

    startTransition(async () => {
      const result = editingId
        ? await updateCustomerAction(editingId, draft)
        : await createCustomerAction(draft);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(editingId ? "Kunden har uppdaterats" : "Kunden har skapats");
      setDraft(null);
      setEditingId(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Kunder</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Kundregister</h1>
        </div>
        <Button onClick={startCreate}><Plus />Ny kund</Button>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Sök kunder" />
          </div>

          <div className="overflow-hidden rounded-xl border bg-card">
            {visible.length ? (
              <div className="divide-y">
                {visible.map((customer) => (
                  <article key={customer.id} className="flex items-start gap-4 px-5 py-4">
                    <div className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold">
                      {customer.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {customerTypeLabel(customer.type)}
                            {customer.organizationNumber ? ` · ${customer.organizationNumber}` : ""}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon-sm" aria-label={`Redigera ${customer.name}`} onClick={() => startEdit(customer)}>
                          <Pencil />
                        </Button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {customer.email && <span className="inline-flex items-center gap-1"><Mail className="size-3" />{customer.email}</span>}
                        {customer.phone && <span className="inline-flex items-center gap-1"><Phone className="size-3" />{customer.phone}</span>}
                        {customer.city && <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{customer.city}</span>}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="grid min-h-56 place-items-center p-6 text-center">
                <div>
                  <p className="font-medium">{query ? "Inga kunder matchar" : "Inga kunder ännu"}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {query ? "Prova ett annat sökord." : "Lägg till en kund för att koppla den till en kalkyl."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {draft && (
          <CustomerForm
            draft={draft}
            editing={Boolean(editingId)}
            pending={pending}
            onChange={setDraft}
            onSave={save}
            onCancel={() => {
              setDraft(null);
              setEditingId(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

function CustomerForm({
  draft,
  editing,
  pending,
  onChange,
  onSave,
  onCancel,
}: {
  draft: CustomerDraft;
  editing: boolean;
  pending: boolean;
  onChange: (draft: CustomerDraft) => void;
  onSave: (event: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <aside className="h-fit rounded-xl border bg-card p-5 xl:sticky xl:top-10">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h2 className="font-semibold">{editing ? "Redigera kund" : "Ny kund"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Grunduppgifter för kalkyler och offerter.</p>
        </div>
        <Button size="icon-sm" variant="ghost" aria-label="Stäng" onClick={onCancel}><X /></Button>
      </div>

      <form onSubmit={onSave} className="space-y-4">
        <CustomerFields draft={draft} onChange={onChange} idPrefix="customer" />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>Avbryt</Button>
          <Button type="submit" disabled={pending}>{editing ? "Spara kund" : "Skapa kund"}</Button>
        </div>
      </form>
    </aside>
  );
}
