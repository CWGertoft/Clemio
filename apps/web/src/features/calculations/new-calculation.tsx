"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bot, FilePenLine, LoaderCircle, Mic, Sparkles, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { createAiCalculationAction, createManualCalculationAction } from "@/actions/calculations";
import { createCustomerAction } from "@/actions/customers";
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

type Mode = "choose" | "manual" | "ai";
type ActiveAction = "calculation" | "customer" | null;

export function NewCalculation({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("choose");
  const [pending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<ActiveAction>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerDraft, setCustomerDraft] = useState<CustomerDraft>({ ...emptyCustomerDraft });
  const [createdCustomer, setCreatedCustomer] = useState<Customer | null>(null);

  const customerOptions = useMemo(() => {
    if (!createdCustomer || customers.some((customer) => customer.id === createdCustomer.id)) return customers;
    return [createdCustomer, ...customers];
  }, [createdCustomer, customers]);

  function createManualCalculation() {
    setActiveAction("calculation");
    startTransition(async () => {
      const result = await createManualCalculationAction({ title: title || "Ny kalkyl", customerId });
      setActiveAction(null);
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        router.push(`/app/calculations/${result.data.id}`);
      }
    });
  }

  function createAiCalculation() {
    setActiveAction("calculation");
    startTransition(async () => {
      const result = await createAiCalculationAction({ description, customerId });
      setActiveAction(null);
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        router.push(`/app/calculations/${result.data.id}`);
      }
    });
  }

  function createAndSelectCustomer(event: React.FormEvent) {
    event.preventDefault();
    setActiveAction("customer");
    startTransition(async () => {
      const result = await createCustomerAction(customerDraft);
      setActiveAction(null);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (!result.data) return;

      const newCustomer: Customer = {
        id: result.data.id,
        ...customerDraft,
        organizationNumber: customerDraft.type === "company" ? customerDraft.organizationNumber : null,
        createdAt: new Date().toISOString(),
      };
      setCreatedCustomer(newCustomer);
      setCustomerId(newCustomer.id);
      setShowCustomerForm(false);
      setCustomerDraft({ ...emptyCustomerDraft });
      toast.success("Kunden är skapad och vald för kalkylen");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <div>
        <p className="text-sm text-muted-foreground">Kalkyler</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Ny kalkyl</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Skapa allt manuellt eller låt Mock AI föreslå en strukturerad start. Du kan ändra varje rad efteråt.
        </p>
      </div>

      {mode === "choose" && (
        <div className="grid gap-4 md:grid-cols-2">
          <button onClick={() => setMode("ai")} className="group rounded-xl border bg-card p-6 text-left transition-colors hover:border-brand hover:bg-secondary/30">
            <span className="grid size-10 place-items-center rounded-lg bg-secondary text-brand"><Sparkles className="size-5" /></span>
            <h2 className="mt-5 font-semibold">Skapa med AI</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Beskriv jobbet. AI föreslår arbetsmoment och material utan att sätta priser.</p>
            <span className="mt-5 inline-flex text-sm font-medium text-foreground">Beskriv arbetet →</span>
          </button>
          <button onClick={() => setMode("manual")} className="group rounded-xl border bg-card p-6 text-left transition-colors hover:border-brand hover:bg-secondary/30">
            <span className="grid size-10 place-items-center rounded-lg bg-muted text-foreground"><FilePenLine className="size-5" /></span>
            <h2 className="mt-5 font-semibold">Skapa manuellt</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Börja med ett tomt dokument och lägg till arbete, material och övriga kostnader.</p>
            <span className="mt-5 inline-flex text-sm font-medium text-foreground">Börja från tom →</span>
          </button>
        </div>
      )}

      {mode === "manual" && (
        <section className="rounded-xl border bg-card p-6">
          <div className="mb-5">
            <h2 className="font-semibold">Tom kalkyl</h2>
            <p className="mt-1 text-sm text-muted-foreground">Ge kalkylen en rubrik. Resten fyller du i i dokumentet.</p>
          </div>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Exempel: Altan – Andersson" autoFocus />
          <CustomerPicker
            customers={customerOptions}
            customerId={customerId}
            onCustomerIdChange={setCustomerId}
            showCustomerForm={showCustomerForm}
            onShowCustomerFormChange={setShowCustomerForm}
            customerDraft={customerDraft}
            onCustomerDraftChange={setCustomerDraft}
            onCreateCustomer={createAndSelectCustomer}
            pending={pending}
            creatingCustomer={activeAction === "customer"}
          />
          <div className="mt-5 flex justify-between">
            <Button variant="ghost" onClick={() => setMode("choose")}>Tillbaka</Button>
            <Button onClick={createManualCalculation} disabled={pending}>
              {activeAction === "calculation" && <LoaderCircle className="animate-spin" />}
              Skapa kalkyl
            </Button>
          </div>
        </section>
      )}

      {mode === "ai" && (
        <section className="rounded-xl border bg-card p-6">
          <div className="mb-5">
            <div className="flex items-center gap-2"><Sparkles className="size-4 text-brand" /><h2 className="font-semibold">Beskriv arbetet</h2></div>
            <p className="mt-1 text-sm text-muted-foreground">Skriv vad som ska göras, omfattning och materialval. AI föreslår sedan en redigerbar struktur.</p>
          </div>
          <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={8} placeholder="Bygg en ny altan på cirka 30 m². Befintlig altan ska rivas och ny tryckimpregnerad stomme och trall byggas." autoFocus />
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Mic className="size-3.5" />Röstinmatning kommer senare</div>
          <CustomerPicker
            customers={customerOptions}
            customerId={customerId}
            onCustomerIdChange={setCustomerId}
            showCustomerForm={showCustomerForm}
            onShowCustomerFormChange={setShowCustomerForm}
            customerDraft={customerDraft}
            onCustomerDraftChange={setCustomerDraft}
            onCreateCustomer={createAndSelectCustomer}
            pending={pending}
            creatingCustomer={activeAction === "customer"}
          />
          <div className="mt-5 flex justify-between">
            <Button variant="ghost" onClick={() => setMode("choose")}>Tillbaka</Button>
            <Button onClick={createAiCalculation} disabled={pending || description.trim().length < 12}>
              {activeAction === "calculation" ? <LoaderCircle className="animate-spin" /> : <Bot />}
              Skapa med AI
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

function CustomerPicker({
  customers,
  customerId,
  onCustomerIdChange,
  showCustomerForm,
  onShowCustomerFormChange,
  customerDraft,
  onCustomerDraftChange,
  onCreateCustomer,
  pending,
  creatingCustomer,
}: {
  customers: Customer[];
  customerId: string | null;
  onCustomerIdChange: (id: string | null) => void;
  showCustomerForm: boolean;
  onShowCustomerFormChange: (visible: boolean) => void;
  customerDraft: CustomerDraft;
  onCustomerDraftChange: (draft: CustomerDraft) => void;
  onCreateCustomer: (event: React.FormEvent) => void;
  pending: boolean;
  creatingCustomer: boolean;
}) {
  const labelForId = (id: unknown) => customers.find((customer) => customer.id === id)?.name ?? "Välj kund";

  return (
    <div className="mt-6 border-t pt-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <label className="text-sm font-medium" htmlFor="calculation-customer">Kund</label>
          <Select
            value={customerId}
            onValueChange={(value) => {
              onCustomerIdChange(value ? String(value) : null);
              onShowCustomerFormChange(false);
            }}
          >
            <SelectTrigger id="calculation-customer" className="w-full">
              <SelectValue>{labelForId}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name} · {customerTypeLabel(customer.type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => onShowCustomerFormChange(!showCustomerForm)}
          disabled={pending}
        >
          <UserPlus />
          {showCustomerForm ? "Dölj formulär" : "Ny kund"}
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Valfritt. Du kan välja en kund nu eller skapa en direkt här.</p>

      {customerId && !showCustomerForm && (
        <Button type="button" variant="link" className="mt-1 h-auto p-0 text-xs" onClick={() => onCustomerIdChange(null)}>
          Ta bort vald kund
        </Button>
      )}

      {showCustomerForm && (
        <form onSubmit={onCreateCustomer} className="mt-5 rounded-lg border bg-secondary/20 p-4">
          <div className="mb-4">
            <h3 className="font-medium">Skapa och välj kund</h3>
            <p className="mt-1 text-sm text-muted-foreground">Kunden sparas i kundregistret och kopplas sedan till den här kalkylen.</p>
          </div>
          <CustomerFields draft={customerDraft} onChange={onCustomerDraftChange} idPrefix="calculation-customer-new" />
          <div className="mt-4 flex justify-end">
            <Button type="submit" disabled={pending}>
              {creatingCustomer && <LoaderCircle className="animate-spin" />}
              Skapa och välj kund
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
