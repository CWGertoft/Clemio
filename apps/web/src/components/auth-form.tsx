"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { signInAction, signUpAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();
  const isRegister = mode === "register";

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(undefined);
    startTransition(async () => {
      const result = isRegister ? await signUpAction(formData) : await signInAction(formData);
      if (result.error) { setError(result.error); return; }
      if (isRegister) setSent(true);
      else { router.replace("/app"); router.refresh(); }
    });
  }

  if (sent) return <div className="space-y-3 text-center"><h1 className="text-2xl font-semibold">Kontrollera din inkorg</h1><p className="text-sm leading-6 text-muted-foreground">Vi har skickat en bekräftelselänk. Öppna den för att fortsätta till företagets uppstart.</p><Link className="text-sm font-medium underline underline-offset-4" href="/login">Till inloggningen</Link></div>;

  return <form onSubmit={submit} className="space-y-5" noValidate>
    <div className="space-y-1.5"><h1 className="text-2xl font-semibold tracking-tight">{isRegister ? "Skapa ditt konto" : "Välkommen tillbaka"}</h1><p className="text-sm text-muted-foreground">{isRegister ? "Börja skapa bättre kalkyler på några minuter." : "Logga in för att fortsätta arbeta i Cemio."}</p></div>
    {isRegister && <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label htmlFor="firstName">Förnamn</Label><Input id="firstName" name="firstName" autoComplete="given-name" /></div><div className="space-y-1.5"><Label htmlFor="lastName">Efternamn</Label><Input id="lastName" name="lastName" autoComplete="family-name" /></div></div>}
    <div className="space-y-1.5"><Label htmlFor="email">E-postadress</Label><Input id="email" name="email" type="email" required autoComplete="email" placeholder="du@foretag.se" /></div>
    <div className="space-y-1.5"><div className="flex items-center justify-between"><Label htmlFor="password">Lösenord</Label>{!isRegister && <Link href="/forgot-password" className="text-xs font-medium text-muted-foreground underline-offset-4 hover:underline">Glömt lösenordet?</Link>}</div><Input id="password" name="password" type="password" required minLength={8} autoComplete={isRegister ? "new-password" : "current-password"} placeholder="Minst 8 tecken" /></div>
    {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
    <Button type="submit" className="h-10 w-full" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" /> : <ArrowRight />}{isRegister ? "Skapa konto" : "Logga in"}</Button>
    <p className="text-center text-sm text-muted-foreground">{isRegister ? "Har du redan ett konto?" : "Ny på Cemio?"} <Link href={isRegister ? "/login" : "/register"} className="font-medium text-foreground underline underline-offset-4">{isRegister ? "Logga in" : "Skapa konto"}</Link></p>
  </form>;
}
