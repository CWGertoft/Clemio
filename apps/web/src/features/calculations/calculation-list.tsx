"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Archive, Copy, Plus, Search } from "lucide-react";
import { archiveCalculationAction, duplicateCalculationAction } from "@/actions/calculations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatSek } from "@/lib/money";
import type { Calculation } from "@/types/domain";
import { toast } from "sonner";

const status: Record<Calculation["status"], string> = { draft: "Utkast", reviewed: "Granskad", quote_created: "Offert skapad", archived: "Arkiverad" };

export function CalculationList({ calculations }: { calculations: Calculation[] }) {
  const router = useRouter(); const [query, setQuery] = useState(""); const [pending, startTransition] = useTransition();
  const rows = useMemo(() => calculations.filter((item) => `${item.title} ${item.customerName ?? ""}`.toLocaleLowerCase("sv-SE").includes(query.toLocaleLowerCase("sv-SE"))), [calculations, query]);
  function duplicate(id: string) { startTransition(async () => { const result = await duplicateCalculationAction(id); if (result.error) toast.error(result.error); else { toast.success("Kalkylen har duplicerats"); router.refresh(); } }); }
  function archive(id: string) { startTransition(async () => { const result = await archiveCalculationAction(id); if (result.error) toast.error(result.error); else { toast.success("Kalkylen har arkiverats"); router.refresh(); } }); }
  return <div className="space-y-6"><header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm text-muted-foreground">Kalkyler</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Alla kalkyler</h1></div><Link href="/app/calculations/new"><Button><Plus />Ny kalkyl</Button></Link></header><div className="relative max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Sök titel eller kund" /></div><section className="overflow-hidden rounded-xl border bg-card">{rows.length ? <div className="divide-y">{rows.map((calculation) => <div key={calculation.id} className="flex flex-col gap-4 px-5 py-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center"><Link href={`/app/calculations/${calculation.id}`} className="min-w-0 flex-1"><p className="truncate font-medium">{calculation.title}</p><p className="mt-1 text-sm text-muted-foreground">{calculation.customerName ?? "Ingen kund"} · Uppdaterad {new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium" }).format(new Date(calculation.updatedAt))}</p></Link><div className="flex items-center gap-3 sm:justify-end"><Badge variant="secondary">{status[calculation.status]}</Badge><span className="w-28 text-right text-sm font-medium">{formatSek(calculation.totalIncVat, { compact: true })}</span><Button variant="ghost" size="icon-sm" aria-label="Duplicera" disabled={pending} onClick={() => duplicate(calculation.id)}><Copy /></Button><Button variant="ghost" size="icon-sm" aria-label="Arkivera" disabled={pending || calculation.status === "archived"} onClick={() => archive(calculation.id)}><Archive /></Button></div></div>)}</div> : <div className="grid min-h-64 place-items-center p-8 text-center"><div><p className="font-medium">{query ? "Inga kalkyler matchar sökningen" : "Inga kalkyler ännu"}</p><p className="mt-1 text-sm text-muted-foreground">{query ? "Prova ett annat sökord." : "Skapa din första kalkyl och bygg offertunderlaget här."}</p>{!query && <Link href="/app/calculations/new" className="mt-4 inline-flex"><Button size="sm"><Plus />Skapa första kalkylen</Button></Link>}</div></div>}</section></div>;
}
