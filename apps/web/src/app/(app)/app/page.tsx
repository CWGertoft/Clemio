import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatSek, sumMoney } from "@/lib/money";
import { getCalculations, getCurrentCompany } from "@/lib/data";

export default async function DashboardPage() {
  const [calculations, company] = await Promise.all([getCalculations(), getCurrentCompany()]);
  const month = new Date().getMonth(); const year = new Date().getFullYear();
  const thisMonth = calculations.filter((item) => { const date = new Date(item.updatedAt); return date.getMonth() === month && date.getFullYear() === year; });
  const value = sumMoney(thisMonth.filter((item) => item.status !== "archived").map((item) => item.totalIncVat));
  const drafts = calculations.filter((item) => item.status === "draft").length;
  return <div className="space-y-8"><header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm text-muted-foreground">{company?.name}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Översikt</h1><p className="mt-2 text-sm text-muted-foreground">Allt du behöver för nästa projekt, kalkyl och offert.</p></div><Link href="/app/projects/new"><Button><Plus />Nytt projekt</Button></Link></header><section className="grid gap-4 md:grid-cols-3"><Metric label="Kalkyler denna månad" value={String(thisMonth.length)} /><Metric label="Kalkylerat värde" value={formatSek(value, { compact: true })} /><Metric label="Utkast att slutföra" value={String(drafts)} /></section><section className="overflow-hidden rounded-xl border bg-card"><div className="flex items-center justify-between border-b px-5 py-4"><div><h2 className="font-semibold">Senaste kalkylerna</h2><p className="mt-1 text-sm text-muted-foreground">Fortsätt där du slutade.</p></div><Link href="/app/calculations" className="text-sm font-medium underline underline-offset-4">Se alla</Link></div>{calculations.length ? <div className="divide-y">{calculations.slice(0, 6).map((item) => <Link key={item.id} href={`/app/calculations/${item.id}`} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/30"><div className="min-w-0 flex-1"><p className="truncate font-medium">{item.title}</p><p className="mt-1 text-sm text-muted-foreground">{item.projectTitle ?? item.customerName ?? "Ej kopplad till projekt"}</p></div><Badge variant="secondary">{item.status === "draft" ? "Utkast" : item.status === "reviewed" ? "Granskad" : item.status === "quote_created" ? "Offert skapad" : "Arkiverad"}</Badge><span className="w-28 text-right text-sm font-medium">{formatSek(item.totalIncVat, { compact: true })}</span></Link>)}</div> : <div className="px-5 py-12 text-center"><p className="font-medium">Ditt första projekt börjar här</p><p className="mt-1 text-sm text-muted-foreground">Lägg till kund, skapa projektet och bygg sedan kalkylerna där.</p><Link href="/app/projects/new" className="mt-4 inline-flex"><Button size="sm"><Plus />Skapa projekt</Button></Link></div>}</section></div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <article className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p></article>; }
