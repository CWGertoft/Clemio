"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Bot, Check, FileText, GripVertical, LoaderCircle, Plus, Sparkles, Trash2 } from "lucide-react";
import { createQuoteAction } from "@/actions/quotes";
import { requestCalculationReviewAction, resolveReviewItemAction, saveCalculationAction } from "@/actions/calculations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { calculateLineTotal, calculateUnitPrice, calculateVat, formatSek, minorToSek, sekToMinor, sumMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Calculation, CalculationItem, CalculationItemType, Customer, LibraryItem, ReviewSuggestion } from "@/types/domain";
import { toast } from "sonner";

type Library = { labor: LibraryItem[]; materials: LibraryItem[] };

function newItem(type: CalculationItemType, sortOrder: number): CalculationItem {
  return { id: crypto.randomUUID(), type, category: null, name: type === "labor" ? "Nytt arbete" : type === "material" ? "Nytt material" : "Ny övrig kostnad", description: null, quantity: 1, unit: type === "labor" ? "tim" : "st", costPrice: 0, markupPercent: 0, unitPrice: 0, totalCost: 0, totalPrice: 0, sortOrder, aiGenerated: false };
}

function calculate(items: CalculationItem[], vatRate: number) {
  const normalized = items.map((item) => ({ ...item, totalCost: calculateLineTotal(item.quantity, item.costPrice), totalPrice: calculateLineTotal(item.quantity, item.unitPrice) }));
  const subtotal = sumMoney(normalized.map((item) => item.totalPrice));
  const vat = calculateVat(subtotal, vatRate);
  return { items: normalized, subtotal, vat, total: subtotal + vat };
}

function itemLabel(type: CalculationItemType) { return type === "labor" ? "Arbete" : type === "material" ? "Material" : "Övriga kostnader"; }

export function CalculationEditor({ calculation, customers, library, review }: { calculation: Calculation; customers: Customer[]; library: Library; review: { summary: string; items: ReviewSuggestion[] } | null }) {
  const router = useRouter();
  const [draft, setDraft] = useState(calculation);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const [showQuote, setShowQuote] = useState(false);
  const [reviewItems, setReviewItems] = useState(review?.items ?? []);
  const [pending, startTransition] = useTransition();
  const initial = useRef(JSON.stringify(calculation));
  const skipAutosave = useRef(true);
  const computed = useMemo(() => calculate(draft.items, draft.vatRate), [draft.items, draft.vatRate]);

  useEffect(() => {
    if (skipAutosave.current) { skipAutosave.current = false; return; }
    const payload = { ...draft, items: computed.items, subtotalExVat: computed.subtotal, vatAmount: computed.vat, totalIncVat: computed.total };
    if (JSON.stringify(payload) === initial.current) return;
    setSaveStatus("saving");
    const timer = window.setTimeout(async () => {
      const result = await saveCalculationAction(payload);
      if (result.error) { setSaveStatus("error"); toast.error(result.error); return; }
      initial.current = JSON.stringify(payload); setSaveStatus("saved");
    }, 800);
    return () => window.clearTimeout(timer);
  }, [draft, computed]);

  function update(patch: Partial<Calculation>) { setDraft((current) => ({ ...current, ...patch })); }
  function updateItem(id: string, patch: Partial<CalculationItem>) {
    setDraft((current) => ({ ...current, items: current.items.map((item) => {
      if (item.id !== id) return item;
      const next = { ...item, ...patch };
      if (patch.costPrice !== undefined || patch.markupPercent !== undefined) next.unitPrice = calculateUnitPrice(next.costPrice, next.markupPercent);
      return next;
    }) }));
  }
  function addItem(type: CalculationItemType, source?: LibraryItem) {
    setDraft((current) => ({ ...current, items: [...current.items, source ? {
      ...newItem(type, current.items.length), name: source.name, description: source.description, unit: source.unit,
      costPrice: source.costPrice ?? 0, markupPercent: source.markupPercent ?? 0, unitPrice: source.unitPrice,
    } : newItem(type, current.items.length)] }));
  }
  function deleteItem(id: string) { setDraft((current) => ({ ...current, items: current.items.filter((item) => item.id !== id).map((item, index) => ({ ...item, sortOrder: index })) })); }
  function moveItem(id: string, direction: -1 | 1) { setDraft((current) => { const index = current.items.findIndex((item) => item.id === id); const nextIndex = index + direction; if (index < 0 || nextIndex < 0 || nextIndex >= current.items.length) return current; const items = [...current.items]; [items[index], items[nextIndex]] = [items[nextIndex], items[index]]; return { ...current, items: items.map((item, order) => ({ ...item, sortOrder: order })) }; }); }
  function reviewCalculation() { startTransition(async () => { const result = await requestCalculationReviewAction(draft.id); if (result.error) toast.error(result.error); else { toast.success("Kalkylen har granskats"); router.refresh(); } }); }
  function resolveSuggestion(id: string, action: "accepted" | "dismissed") { startTransition(async () => { const result = await resolveReviewItemAction({ id, action }); if (result.error) toast.error(result.error); else { setReviewItems((items) => items.map((item) => item.id === id ? { ...item, status: action } : item)); toast.success(action === "accepted" ? "Förslaget har accepterats" : "Förslaget har avfärdats"); router.refresh(); } }); }

  const groups: CalculationItemType[] = ["labor", "material", "other"];
  return <div className="space-y-6"><header className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0 space-y-2"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Link href="/app/calculations" className="hover:text-foreground">Kalkyler</Link><span>/</span><span>{draft.status === "draft" ? "Utkast" : draft.status === "reviewed" ? "Granskad" : "Offert skapad"}</span></div><Input value={draft.title} onChange={(event) => update({ title: event.target.value })} className="h-auto max-w-xl border-0 bg-transparent px-0 text-2xl font-semibold shadow-none focus-visible:ring-0 sm:text-3xl" aria-label="Kalkylens titel" /><p className={cn("text-xs", saveStatus === "error" ? "text-destructive" : "text-muted-foreground")}>{saveStatus === "saving" ? "Sparar…" : saveStatus === "error" ? "Kunde inte spara" : "Sparad"}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={reviewCalculation} disabled={pending}><Bot /> Granska med AI</Button><Button onClick={() => setShowQuote((open) => !open)}><FileText /> Skapa offert</Button></div></header>
    {showQuote && <QuoteForm calculation={draft} onCancel={() => setShowQuote(false)} />}
    <section className="grid gap-5 rounded-xl border bg-card p-5 lg:grid-cols-[1fr_280px]"><div className="space-y-4"><div className="space-y-1.5"><label className="text-sm font-medium" htmlFor="customer">Kund</label><Select value={draft.customerId ?? "none"} onValueChange={(value) => update({ customerId: value === "none" ? null : value, customerName: customers.find((customer) => customer.id === value)?.name ?? null })}><SelectTrigger id="customer"><SelectValue placeholder="Välj kund (valfritt)" /></SelectTrigger><SelectContent><SelectItem value="none">Ingen kund ännu</SelectItem>{customers.map((customer) => <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1.5"><label className="text-sm font-medium" htmlFor="description">Beskrivning</label><Textarea id="description" value={draft.description ?? ""} onChange={(event) => update({ description: event.target.value || null })} placeholder="Kort beskrivning av arbetet som ska utföras." rows={3} /></div></div><div className="grid grid-cols-2 gap-4 border-t pt-4 lg:block lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0"><div><p className="text-xs text-muted-foreground">Delsumma exkl. moms</p><p className="mt-1 text-lg font-semibold">{formatSek(computed.subtotal)}</p></div><div className="lg:mt-4"><label className="text-xs text-muted-foreground" htmlFor="vat">Moms</label><div className="mt-1 flex items-center gap-1"><Input id="vat" value={draft.vatRate} inputMode="decimal" onChange={(event) => update({ vatRate: Number(event.target.value) || 0 })} className="h-8 w-16" /><span className="text-sm">%</span></div></div><div className="col-span-2 border-t pt-3 lg:mt-4"><p className="text-xs text-muted-foreground">Totalt inkl. moms</p><p className="mt-1 text-2xl font-semibold">{formatSek(computed.total)}</p></div></div></section>
    {groups.map((type) => <ItemGroup key={type} type={type} items={computed.items.filter((item) => item.type === type)} onAdd={addItem} onUpdate={updateItem} onDelete={deleteItem} onMove={moveItem} library={type === "labor" ? library.labor : type === "material" ? library.materials : []} />)}
    <section className="rounded-xl border bg-card p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">AI-granskning</h2><p className="mt-1 text-sm text-muted-foreground">Förslag ändrar aldrig kalkylen automatiskt.</p></div><Button variant="outline" size="sm" onClick={reviewCalculation} disabled={pending}>{pending ? <LoaderCircle className="animate-spin" /> : <Sparkles />}Granska</Button></div>{reviewItems.length ? <div className="divide-y">{reviewItems.map((item) => <div key={item.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-medium">{item.title}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>{item.suggestedAction && <p className="mt-2 text-xs font-medium text-muted-foreground">{item.suggestedAction}</p>}</div>{item.status === "pending" ? <div className="flex shrink-0 gap-2"><Button variant="outline" size="sm" onClick={() => resolveSuggestion(item.id, "dismissed")} disabled={pending}>Avfärda</Button><Button size="sm" onClick={() => resolveSuggestion(item.id, "accepted")} disabled={pending}><Check /> Acceptera</Button></div> : <span className="text-sm text-muted-foreground">{item.status === "accepted" ? "Accepterat" : "Avfärdat"}</span>}</div>)}</div> : <p className="rounded-lg bg-muted px-4 py-5 text-sm text-muted-foreground">Ingen granskning gjord ännu. AI kan lyfta möjliga luckor, men du behåller alltid beslutet.</p>}</section>
  </div>;
}

function ItemGroup({ type, items, onAdd, onUpdate, onDelete, onMove, library }: { type: CalculationItemType; items: CalculationItem[]; onAdd: (type: CalculationItemType, source?: LibraryItem) => void; onUpdate: (id: string, patch: Partial<CalculationItem>) => void; onDelete: (id: string) => void; onMove: (id: string, direction: -1 | 1) => void; library: LibraryItem[] }) {
  return <section className="overflow-hidden rounded-xl border bg-card"><div className="flex flex-col gap-3 border-b bg-muted/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">{itemLabel(type)}</h2><p className="text-xs text-muted-foreground">{type === "labor" ? "Tid och arbetskostnad" : type === "material" ? "Inköp och materialpåslag" : "Fasta och övriga kostnader"}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => onAdd(type)}><Plus /> Lägg till rad</Button>{library.length > 0 && <Select onValueChange={(value) => { const source = library.find((item) => item.id === value); if (source) onAdd(type, source); }}><SelectTrigger className="h-8 w-40"><SelectValue placeholder="Från bibliotek" /></SelectTrigger><SelectContent>{library.filter((item) => item.active).map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select>}</div></div><div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-sm"><thead className="border-b text-xs text-muted-foreground"><tr><th className="w-16 px-3 py-3"></th><th className="min-w-48 px-2 py-3">Benämning</th><th className="w-24 px-2 py-3">Antal</th><th className="w-20 px-2 py-3">Enhet</th><th className="w-28 px-2 py-3">Kostnad</th><th className="w-24 px-2 py-3">Påslag</th><th className="w-32 px-2 py-3">Säljpris</th><th className="w-32 px-2 py-3 text-right">Summa</th><th className="w-12 px-2 py-3"></th></tr></thead><tbody>{items.length ? items.map((item) => <tr key={item.id} className="border-b last:border-0"><td className="px-3 py-2"><div className="flex items-center gap-0.5 text-muted-foreground"><GripVertical className="size-4" /><div className="flex flex-col"><button aria-label="Flytta upp" onClick={() => onMove(item.id, -1)}><ArrowUp className="size-3" /></button><button aria-label="Flytta ned" onClick={() => onMove(item.id, 1)}><ArrowDown className="size-3" /></button></div></div></td><td className="px-2 py-2"><Input value={item.name} onChange={(event) => onUpdate(item.id, { name: event.target.value })} className="h-8" /></td><td className="px-2 py-2"><Input value={item.quantity} inputMode="decimal" onChange={(event) => onUpdate(item.id, { quantity: Number(event.target.value) || 0 })} className="h-8" /></td><td className="px-2 py-2"><Input value={item.unit} onChange={(event) => onUpdate(item.id, { unit: event.target.value })} className="h-8" /></td><td className="px-2 py-2"><Input value={minorToSek(item.costPrice)} inputMode="decimal" onChange={(event) => onUpdate(item.id, { costPrice: sekToMinor(event.target.value) })} className="h-8" /></td><td className="px-2 py-2"><Input value={item.markupPercent} inputMode="decimal" onChange={(event) => onUpdate(item.id, { markupPercent: Number(event.target.value) || 0 })} className="h-8" /></td><td className="px-2 py-2"><Input value={minorToSek(item.unitPrice)} inputMode="decimal" onChange={(event) => onUpdate(item.id, { unitPrice: sekToMinor(event.target.value) })} className="h-8" /></td><td className="px-2 py-2 text-right font-medium">{formatSek(item.totalPrice)}</td><td className="px-2 py-2"><Button variant="ghost" size="icon-sm" aria-label="Ta bort rad" className="text-muted-foreground hover:text-destructive" onClick={() => onDelete(item.id)}><Trash2 /></Button></td></tr>) : <tr><td colSpan={9} className="px-5 py-8 text-center text-sm text-muted-foreground">Inga rader ännu. Lägg till en rad eller välj från ditt bibliotek.</td></tr>}</tbody></table></div></section>;
}

function QuoteForm({ calculation, onCancel }: { calculation: Calculation; onCancel: () => void }) {
  const router = useRouter(); const [pending, startTransition] = useTransition(); const [error, setError] = useState<string>(); const [detailLevel, setDetailLevel] = useState<"detailed" | "summary">("detailed");
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); startTransition(async () => { const result = await createQuoteAction({ calculationId: calculation.id, title: form.get("title"), introText: form.get("introText") || null, terms: form.get("terms") || null, detailLevel }); if (result.error) setError(result.error); else if (result.data) { toast.success("Offerten är skapad"); router.push(`/app/quotes/${result.data.id}`); } }); }
  return <section className="rounded-xl border bg-card p-5"><form onSubmit={submit} className="space-y-4"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Skapa offert</h2><p className="text-sm text-muted-foreground">Offerten är en fryst presentation av den här kalkylen.</p></div><Button type="button" variant="ghost" size="sm" onClick={onCancel}>Stäng</Button></div><div className="grid gap-4 md:grid-cols-2"><div className="space-y-1.5"><label htmlFor="quote-title" className="text-sm font-medium">Offerttitel</label><Input id="quote-title" name="title" defaultValue={calculation.title} required /></div><div className="space-y-1.5"><label className="text-sm font-medium">Detaljnivå</label><Select value={detailLevel} onValueChange={(value) => setDetailLevel(value as "detailed" | "summary")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="detailed">Detaljerad – visa rader</SelectItem><SelectItem value="summary">Summerad – visa kategorier</SelectItem></SelectContent></Select></div></div><div className="space-y-1.5"><label htmlFor="introText" className="text-sm font-medium">Inledning</label><Textarea id="introText" name="introText" defaultValue="Tack för förfrågan. Härmed lämnar vi följande offert." rows={2} /></div><div className="space-y-1.5"><label htmlFor="terms" className="text-sm font-medium">Villkor</label><Textarea id="terms" name="terms" defaultValue="Offerten gäller i 30 dagar. Arbetet utförs enligt överenskommelse." rows={2} /></div>{error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>Avbryt</Button><Button type="submit" disabled={pending}>{pending && <LoaderCircle className="animate-spin" />}Skapa och förhandsvisa</Button></div></form></section>;
}
