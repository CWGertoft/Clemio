import { redirect } from "next/navigation";
import { CompanyOnboarding } from "@/components/company-onboarding";
import { getCurrentCompany, requireUser } from "@/lib/data";

export default async function OnboardingPage() {
  await requireUser();
  if (await getCurrentCompany()) redirect("/app");
  return <main className="min-h-screen bg-muted/50 px-5 py-10 sm:px-10"><div className="mx-auto max-w-3xl"><div className="mb-10 flex items-center gap-2 text-xl font-semibold"><span className="grid size-8 place-items-center rounded-lg bg-brand text-sm text-white">C</span>Cemio</div><section className="rounded-2xl border bg-card p-6 shadow-sm sm:p-9"><CompanyOnboarding /></section></div></main>;
}
