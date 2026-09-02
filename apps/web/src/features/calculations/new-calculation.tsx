"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bot, FilePenLine, LoaderCircle, Mic, Sparkles, UserRound } from "lucide-react";
import { toast } from "sonner";
import { createAiCalculationAction, createManualCalculationAction } from "@/actions/calculations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Project } from "@/types/domain";

type Mode = "choose" | "manual" | "ai";

export function NewCalculation({ project }: { project: Project }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("choose");
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  function createManualCalculation() {
    startTransition(async () => {
      const result = await createManualCalculationAction({ title: title || "Ny kalkyl", projectId: project.id });
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        router.push(`/app/calculations/${result.data.id}`);
      }
    });
  }

  function createAiCalculation() {
    startTransition(async () => {
      const result = await createAiCalculationAction({ description, projectId: project.id });
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        router.push(`/app/calculations/${result.data.id}`);
      }
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <div>
        <button onClick={() => router.push(`/app/projects/${project.id}`)} className="text-sm text-muted-foreground hover:text-foreground">Projekt / {project.title}</button>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Ny kalkyl</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Kalkylen kopplas till projektet och använder dess kund automatiskt.
        </p>
      </div>

      <section className="flex items-start gap-3 rounded-xl border bg-card p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-brand"><UserRound className="size-4" /></span>
        <div><p className="text-sm text-muted-foreground">Projektets kund</p><p className="mt-1 font-medium">{project.customer?.name ?? "Kund saknas"}</p></div>
      </section>

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
          <div className="mb-5"><h2 className="font-semibold">Tom kalkyl</h2><p className="mt-1 text-sm text-muted-foreground">Ge kalkylen en rubrik. Resten fyller du i i dokumentet.</p></div>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Exempel: Altan – Andersson" autoFocus />
          <div className="mt-5 flex justify-between"><Button variant="ghost" onClick={() => setMode("choose")}>Tillbaka</Button><Button onClick={createManualCalculation} disabled={pending}>{pending && <LoaderCircle className="animate-spin" />}Skapa kalkyl</Button></div>
        </section>
      )}

      {mode === "ai" && (
        <section className="rounded-xl border bg-card p-6">
          <div className="mb-5"><div className="flex items-center gap-2"><Sparkles className="size-4 text-brand" /><h2 className="font-semibold">Beskriv arbetet</h2></div><p className="mt-1 text-sm text-muted-foreground">Skriv vad som ska göras, omfattning och materialval. AI föreslår sedan en redigerbar struktur.</p></div>
          <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={8} placeholder="Bygg en ny altan på cirka 30 m². Befintlig altan ska rivas och ny tryckimpregnerad stomme och trall byggas." autoFocus />
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Mic className="size-3.5" />Röstinmatning kommer senare</div>
          <div className="mt-5 flex justify-between"><Button variant="ghost" onClick={() => setMode("choose")}>Tillbaka</Button><Button onClick={createAiCalculation} disabled={pending || description.trim().length < 12}>{pending ? <LoaderCircle className="animate-spin" /> : <Bot />}Skapa med AI</Button></div>
        </section>
      )}
    </div>
  );
}
