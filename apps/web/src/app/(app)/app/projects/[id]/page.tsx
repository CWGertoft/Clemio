import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calculator, Plus, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatSek } from "@/lib/money";
import { getCalculations, getProject } from "@/lib/data";

const statusLabel = {
  draft: "Utkast",
  reviewed: "Granskad",
  quote_created: "Offert skapad",
  archived: "Arkiverad",
} as const;

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [project, calculations] = await Promise.all([getProject(id), getCalculations(id)]);
  if (!project) notFound();
  const activeCalculations = calculations.filter((calculation) => calculation.status !== "archived");

  return (
    <div className="space-y-7">
      <Link href="/app/projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="size-4" />Alla projekt</Link>

      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Projekt</p>
          <h1 className="mt-1 truncate text-3xl font-semibold tracking-tight">{project.title}</h1>
          {project.description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{project.description}</p>}
        </div>
        <Link href={`/app/projects/${project.id}/calculations/new`}><Button><Plus />Ny kalkyl</Button></Link>
      </header>

      <section className="rounded-xl border bg-card p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-brand"><UserRound className="size-4" /></span>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Kund</p>
            <p className="mt-1 font-medium">{project.customer?.name ?? "Kund saknas"}</p>
            {project.customer && <p className="mt-1 text-sm text-muted-foreground">{[project.customer.email, project.customer.phone, project.customer.city].filter(Boolean).join(" · ") || "Inga fler kunduppgifter"}</p>}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="font-semibold">Kalkyler</h2>
            <p className="mt-1 text-sm text-muted-foreground">Flera kalkyler kan höra till samma projekt.</p>
          </div>
          <Link href={`/app/projects/${project.id}/calculations/new`}><Button size="sm" variant="outline"><Plus />Ny kalkyl</Button></Link>
        </div>
        {activeCalculations.length ? (
          <div className="divide-y">
            {activeCalculations.map((calculation) => (
              <Link key={calculation.id} href={`/app/calculations/${calculation.id}`} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/30">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"><Calculator className="size-4" /></span>
                <div className="min-w-0 flex-1"><p className="truncate font-medium">{calculation.title}</p><p className="mt-1 text-sm text-muted-foreground">Uppdaterad {new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium" }).format(new Date(calculation.updatedAt))}</p></div>
                <Badge variant="secondary">{statusLabel[calculation.status]}</Badge>
                <span className="w-28 text-right text-sm font-medium">{formatSek(calculation.totalIncVat, { compact: true })}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <p className="font-medium">Ingen kalkyl i projektet ännu</p>
            <p className="mt-1 text-sm text-muted-foreground">Börja manuellt eller låt AI skapa en redigerbar första version.</p>
            <Link href={`/app/projects/${project.id}/calculations/new`} className="mt-4 inline-flex"><Button size="sm"><Plus />Skapa första kalkylen</Button></Link>
          </div>
        )}
      </section>
    </div>
  );
}
