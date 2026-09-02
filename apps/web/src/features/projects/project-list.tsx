import Link from "next/link";
import { FolderKanban, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Project } from "@/types/domain";

export function ProjectList({ projects }: { projects: Project[] }) {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Projekt</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Alla projekt</h1>
          <p className="mt-2 text-sm text-muted-foreground">Ett projekt samlar kund och kalkyler för samma jobb.</p>
        </div>
        <Link href="/app/projects/new"><Button><Plus />Nytt projekt</Button></Link>
      </header>

      {projects.length ? (
        <section className="overflow-hidden rounded-xl border bg-card">
          <div className="divide-y">
            {projects.map((project) => (
              <Link key={project.id} href={`/app/projects/${project.id}`} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/30">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-brand"><FolderKanban className="size-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{project.title}</p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{project.customer?.name ?? "Kund saknas"}{project.description ? ` · ${project.description}` : ""}</p>
                </div>
                <span className="shrink-0 text-sm text-muted-foreground">{project.calculationCount} {project.calculationCount === 1 ? "kalkyl" : "kalkyler"}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className="grid min-h-72 place-items-center rounded-xl border bg-card p-8 text-center">
          <div>
            <span className="mx-auto grid size-11 place-items-center rounded-lg bg-secondary text-brand"><FolderKanban className="size-5" /></span>
            <p className="mt-4 font-medium">Skapa ditt första projekt</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">Lägg till kunden och skapa sedan en eller flera kalkyler för jobbet.</p>
            <Link href="/app/projects/new" className="mt-4 inline-flex"><Button size="sm"><Plus />Nytt projekt</Button></Link>
          </div>
        </section>
      )}
    </div>
  );
}
