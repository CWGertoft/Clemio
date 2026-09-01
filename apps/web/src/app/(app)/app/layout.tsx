import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCurrentCompany, requireUser } from "@/lib/data";

export default async function ApplicationLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  const company = await getCurrentCompany();
  if (!company) redirect("/onboarding");
  return <AppShell companyName={company.name}>{children}</AppShell>;
}
