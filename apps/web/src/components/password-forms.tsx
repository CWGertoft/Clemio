"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { requestPasswordResetAction, updatePasswordAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasswordResetRequestForm() {
  const [error, setError] = useState<string>(); const [sent, setSent] = useState(false); const [pending, startTransition] = useTransition();
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setError(undefined); startTransition(async () => { const result = await requestPasswordResetAction(new FormData(event.currentTarget)); if (result.error) setError(result.error); else setSent(true); }); }
  if (sent) return <div className="space-y-3 text-center"><h1 className="text-2xl font-semibold">Kolla din inkorg</h1><p className="text-sm leading-6 text-muted-foreground">Om e-postadressen finns hos oss har vi skickat en länk för att återställa lösenordet.</p><Link className="text-sm underline underline-offset-4" href="/login">Till inloggningen</Link></div>;
  return <form onSubmit={submit} className="space-y-5"><div className="space-y-1.5"><h1 className="text-2xl font-semibold">Återställ lösenord</h1><p className="text-sm text-muted-foreground">Skriv din e-postadress så skickar vi en återställningslänk.</p></div><div className="space-y-1.5"><Label htmlFor="email">E-postadress</Label><Input id="email" name="email" type="email" required autoComplete="email" /></div>{error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}<Button type="submit" className="w-full" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" /> : <ArrowRight />}Skicka länk</Button><Link className="block text-center text-sm text-muted-foreground underline underline-offset-4" href="/login">Tillbaka till inloggningen</Link></form>;
}

export function NewPasswordForm() {
  const router = useRouter(); const [error, setError] = useState<string>(); const [pending, startTransition] = useTransition();
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setError(undefined); startTransition(async () => { const result = await updatePasswordAction(new FormData(event.currentTarget)); if (result.error) setError(result.error); else { router.replace("/app"); router.refresh(); } }); }
  return <form onSubmit={submit} className="space-y-5"><div className="space-y-1.5"><h1 className="text-2xl font-semibold">Välj nytt lösenord</h1><p className="text-sm text-muted-foreground">Ditt nya lösenord ska ha minst åtta tecken.</p></div><div className="space-y-1.5"><Label htmlFor="password">Nytt lösenord</Label><Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" /></div>{error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}<Button type="submit" className="w-full" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" /> : <ArrowRight />}Spara lösenord</Button></form>;
}
