"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Archive, ArchiveRestore, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  archiveCalculationAction,
  deleteCalculationAction,
  restoreCalculationAction,
} from "@/actions/calculations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatSek } from "@/lib/money";
import type { Calculation } from "@/types/domain";

type CalculationFilter = "active" | "archived";

const statusLabel: Record<Calculation["status"], string> = {
  draft: "Utkast",
  reviewed: "Granskad",
  quote_created: "Offert skapad",
  archived: "Arkiverad",
};

export function CalculationList({ calculations }: { calculations: Calculation[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CalculationFilter>("active");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const rows = useMemo(() => calculations.filter((calculation) => {
    const matchesFilter = filter === "archived"
      ? calculation.status === "archived"
      : calculation.status !== "archived";
    const matchesQuery = `${calculation.title} ${calculation.customerName ?? ""}`
      .toLocaleLowerCase("sv-SE")
      .includes(query.toLocaleLowerCase("sv-SE"));
    return matchesFilter && matchesQuery;
  }), [calculations, filter, query]);

  const activeCount = calculations.filter((calculation) => calculation.status !== "archived").length;
  const archivedCount = calculations.length - activeCount;

  function archive(id: string) {
    startTransition(async () => {
      const result = await archiveCalculationAction(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Kalkylen har arkiverats");
      router.refresh();
    });
  }

  function restore(id: string) {
    startTransition(async () => {
      const result = await restoreCalculationAction(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Kalkylen är tillbaka bland aktiva");
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteCalculationAction(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setConfirmingId(null);
      toast.success("Kalkylen har tagits bort");
      router.refresh();
    });
  }

  const emptyTitle = query
    ? "Inga kalkyler matchar sökningen"
    : filter === "archived"
      ? "Inga arkiverade kalkyler"
      : "Inga aktiva kalkyler";
  const emptyDescription = query
    ? "Prova ett annat sökord."
    : filter === "archived"
      ? "Arkiverade kalkyler hamnar här."
      : "Skapa din första kalkyl och bygg offertunderlaget här.";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Kalkyler</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Alla kalkyler</h1>
        </div>
        <Button onClick={() => router.push("/app/calculations/new")}><Plus />Ny kalkyl</Button>
      </header>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit rounded-lg border bg-card p-1" aria-label="Filtrera kalkyler">
          <Button size="sm" variant={filter === "active" ? "secondary" : "ghost"} onClick={() => setFilter("active")}>
            Aktiva ({activeCount})
          </Button>
          <Button size="sm" variant={filter === "archived" ? "secondary" : "ghost"} onClick={() => setFilter("archived")}>
            Arkiverade ({archivedCount})
          </Button>
        </div>
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Sök titel eller kund" />
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border bg-card">
        {rows.length ? (
          <div className="divide-y">
            {rows.map((calculation) => {
              const confirmingDeletion = confirmingId === calculation.id;
              const archived = calculation.status === "archived";

              return (
                <div key={calculation.id} className="flex flex-col gap-4 px-5 py-4 transition-colors hover:bg-muted/30 lg:flex-row lg:items-center">
                  <Link href={`/app/calculations/${calculation.id}`} className="min-w-0 flex-1">
                    <p className="truncate font-medium">{calculation.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {calculation.customerName ?? "Ingen kund"} · Uppdaterad {new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium" }).format(new Date(calculation.updatedAt))}
                    </p>
                  </Link>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <Badge variant="secondary">{statusLabel[calculation.status]}</Badge>
                    <span className="mr-2 w-28 text-right text-sm font-medium">{formatSek(calculation.totalIncVat, { compact: true })}</span>

                    {confirmingDeletion ? (
                      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-2 py-1.5">
                        <span className="text-xs font-medium text-destructive">Ta bort kalkylen permanent?</span>
                        <Button size="xs" variant="ghost" disabled={pending} onClick={() => setConfirmingId(null)}>Avbryt</Button>
                        <Button size="xs" variant="destructive" disabled={pending} onClick={() => remove(calculation.id)}>Ta bort</Button>
                      </div>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => router.push(`/app/calculations/${calculation.id}`)}>
                          <Pencil />Redigera
                        </Button>
                        {archived ? (
                          <Button size="sm" variant="ghost" disabled={pending} onClick={() => restore(calculation.id)}>
                            <ArchiveRestore />Återställ
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" disabled={pending} onClick={() => archive(calculation.id)}>
                            <Archive />Arkivera
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={pending} onClick={() => setConfirmingId(calculation.id)}>
                          <Trash2 />Ta bort
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid min-h-64 place-items-center p-8 text-center">
            <div>
              <p className="font-medium">{emptyTitle}</p>
              <p className="mt-1 text-sm text-muted-foreground">{emptyDescription}</p>
              {!query && filter === "active" && (
                <Button className="mt-4" size="sm" onClick={() => router.push("/app/calculations/new")}>
                  <Plus />Skapa första kalkylen
                </Button>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
