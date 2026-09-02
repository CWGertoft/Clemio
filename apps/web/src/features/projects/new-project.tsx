"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { createProjectAction } from "@/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CustomerFields,
  customerTypeLabel,
  emptyCustomerDraft,
  type CustomerDraft,
} from "@/features/customers/customer-fields";
import type { Customer } from "@/types/domain";

type CustomerMode = "existing" | "new";

export function NewProject({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [customerMode, setCustomerMode] = useState<CustomerMode>(customers.length ? "existing" : "new");
  const [customerId, setCustomerId] = useState<string | null>(customers[0]?.id ?? null);
  const [customerDraft, setCustomerDraft] = useState<CustomerDraft>({ ...emptyCustomerDraft });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createProjectAction({
        title,
        description: description.trim() || null,
        customerId: customerMode === "existing" ? customerId : null,
        newCustomer: customerMode === "new" ? customerDraft : null,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (!result.data) return;
      toast.success("Projektet är skapat");
      router.push(`/app/projects/${result.data.id}`);
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <div>
        <p className="text-sm text-muted-foreground">Projekt</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Nytt projekt</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Samla kunden och alla kalkyler för samma jobb på ett ställe.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-6 rounded-xl border bg-card p-6">
        <section className="space-y-4">
          <div>
            <h2 className="font-semibold">Projektuppgifter</h2>
            <p className="mt-1 text-sm text-muted-foreground">Ge jobbet ett tydligt namn. Du kan börja skapa kalkyler direkt efteråt.</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="project-title">Projektnamn</label>
            <Input id="project-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Exempel: Ny altan – Andersson" autoFocus required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="project-description">Beskrivning <span className="font-normal text-muted-foreground">(valfritt)</span></label>
            <Textarea id="project-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="Kort om jobbet, platsen eller omfattningen." />
          </div>
        </section>

        <section className="border-t pt-6">
          <div>
            <h2 className="font-semibold">Kund</h2>
            <p className="mt-1 text-sm text-muted-foreground">Välj en kund du redan har eller skapa en ny utan att lämna projektet.</p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setCustomerMode("existing")}
              disabled={!customers.length}
              className={`rounded-lg border p-4 text-left transition-colors ${customerMode === "existing" ? "border-brand bg-secondary/40" : "hover:bg-muted/50"} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <Users className="size-5 text-brand" />
              <p className="mt-3 font-medium">Befintlig kund</p>
              <p className="mt-1 text-sm text-muted-foreground">Välj från kundregistret.</p>
            </button>
            <button
              type="button"
              onClick={() => setCustomerMode("new")}
              className={`rounded-lg border p-4 text-left transition-colors ${customerMode === "new" ? "border-brand bg-secondary/40" : "hover:bg-muted/50"}`}
            >
              <UserPlus className="size-5 text-brand" />
              <p className="mt-3 font-medium">Ny kund</p>
              <p className="mt-1 text-sm text-muted-foreground">Spara kundens uppgifter samtidigt.</p>
            </button>
          </div>

          {customerMode === "existing" ? (
            <div className="mt-5 space-y-1.5">
              <label className="text-sm font-medium" htmlFor="project-customer">Välj kund</label>
              <Select value={customerId ?? undefined} onValueChange={(value) => setCustomerId(String(value))}>
                <SelectTrigger id="project-customer"><SelectValue placeholder="Välj kund" /></SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} · {customerTypeLabel(customer.type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="mt-5 rounded-lg border bg-secondary/20 p-4">
              <CustomerFields draft={customerDraft} onChange={setCustomerDraft} idPrefix="project-customer-new" />
            </div>
          )}
        </section>

        <div className="flex justify-end gap-3 border-t pt-5">
          <Button type="button" variant="outline" onClick={() => router.push("/app/projects")} disabled={pending}>Avbryt</Button>
          <Button type="submit" disabled={pending}>
            {pending ? <LoaderCircle className="animate-spin" /> : <Check />}
            Skapa projekt
          </Button>
        </div>
      </form>
    </div>
  );
}
