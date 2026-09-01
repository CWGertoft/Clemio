"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { createCompanyAction } from "@/actions/company";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const fieldClass = "space-y-1.5";

export function CompanyOnboarding() {
  const router = useRouter(); const [error, setError] = useState<string>(); const [pending, startTransition] = useTransition();
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    setError(undefined);
    startTransition(async () => {
      const result = await createCompanyAction({
        name: form.get("name"), organizationNumber: form.get("organizationNumber"), email: form.get("email"), phone: form.get("phone"),
        address: form.get("address"), postalCode: form.get("postalCode"), city: form.get("city"), defaultHourlyRate: form.get("defaultHourlyRate"),
        defaultVatRate: form.get("defaultVatRate"), defaultMaterialMarkup: form.get("defaultMaterialMarkup"), defaultOtherMarkup: form.get("defaultOtherMarkup"),
      });
      if (result.error) setError(result.error); else { router.replace("/app"); router.refresh(); }
    });
  }
  return <form onSubmit={submit} className="space-y-7"><div className="space-y-2"><span className="inline-flex rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">Steg 1 av 1</span><h1 className="text-3xl font-semibold tracking-tight">Berätta om företaget</h1><p className="max-w-xl text-sm leading-6 text-muted-foreground">Dina standardpriser används som utgångspunkt i nya kalkyler. Varje kalkyl kan alltid ändras individuellt.</p></div><div className="grid gap-5 md:grid-cols-2"><div className={fieldClass}><Label htmlFor="name">Företagsnamn</Label><Input id="name" name="name" required placeholder="Exempel Bygg AB" /></div><div className={fieldClass}><Label htmlFor="organizationNumber">Organisationsnummer</Label><Input id="organizationNumber" name="organizationNumber" placeholder="556123-4567" /></div><div className={fieldClass}><Label htmlFor="email">E-postadress</Label><Input id="email" name="email" type="email" required placeholder="kontakt@foretag.se" /></div><div className={fieldClass}><Label htmlFor="phone">Telefon</Label><Input id="phone" name="phone" required placeholder="070-123 45 67" /></div><div className={fieldClass}><Label htmlFor="address">Adress</Label><Input id="address" name="address" required placeholder="Byggvägen 8" /></div><div className="grid grid-cols-2 gap-3"><div className={fieldClass}><Label htmlFor="postalCode">Postnummer</Label><Input id="postalCode" name="postalCode" required placeholder="123 45" /></div><div className={fieldClass}><Label htmlFor="city">Ort</Label><Input id="city" name="city" required placeholder="Stockholm" /></div></div></div><div className="space-y-3 border-t pt-6"><h2 className="font-semibold">Standard för kalkyler</h2><div className="grid gap-5 md:grid-cols-4"><div className={fieldClass}><Label htmlFor="defaultHourlyRate">Timpris, SEK</Label><Input id="defaultHourlyRate" name="defaultHourlyRate" required inputMode="decimal" defaultValue="650" /></div><div className={fieldClass}><Label htmlFor="defaultMaterialMarkup">Materialpåslag, %</Label><Input id="defaultMaterialMarkup" name="defaultMaterialMarkup" required inputMode="decimal" defaultValue="15" /></div><div className={fieldClass}><Label htmlFor="defaultOtherMarkup">Övrigt påslag, %</Label><Input id="defaultOtherMarkup" name="defaultOtherMarkup" required inputMode="decimal" defaultValue="0" /></div><div className={fieldClass}><Label htmlFor="defaultVatRate">Moms, %</Label><Input id="defaultVatRate" name="defaultVatRate" required inputMode="decimal" defaultValue="25" /></div></div></div>{error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}<div className="flex justify-end"><Button type="submit" size="lg" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" /> : <ArrowRight />}Fortsätt till Cemio</Button></div></form>;
}
