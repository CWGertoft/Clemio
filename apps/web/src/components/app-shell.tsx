"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { useTheme } from "next-themes";
import { Calculator, FolderKanban, Home, LogOut, Moon, Plus, Settings, Sun, Users } from "lucide-react";
import { signOutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/app", label: "Översikt", icon: Home, exact: true },
  { href: "/app/projects", label: "Projekt", icon: FolderKanban },
  { href: "/app/calculations", label: "Kalkyler", icon: Calculator },
  { href: "/app/customers", label: "Kunder", icon: Users },
];

export function AppShell({ companyName, children }: { companyName: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { theme, setTheme } = useTheme();
  const isActive = (href: string, exact?: boolean) => exact ? pathname === href : pathname.startsWith(href);

  function logout() {
    startTransition(async () => {
      await signOutAction();
      router.replace("/login");
      router.refresh();
    });
  }

  return (
    <div className="min-h-screen bg-muted/50">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r bg-sidebar px-3 py-5 lg:flex lg:flex-col">
        <Link href="/app" className="mb-8 flex items-center gap-2 px-2 text-xl font-semibold tracking-tight">
          <span className="grid size-8 place-items-center rounded-lg bg-brand text-white">C</span>
          Cemio
        </Link>
        <Link href="/app/projects/new" className="mb-5">
          <Button className="h-10 w-full justify-center bg-brand text-white hover:bg-brand/85" size="lg">
            <Plus /> Nytt projekt
          </Button>
        </Link>
        <nav className="space-y-1">
          {navigation.map(({ href, label, icon: Icon, exact }) => (
            <Link key={href} href={href} className={cn("flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground", isActive(href, exact) && "bg-sidebar-accent text-foreground")}>
              <Icon className="size-4" /> {label}
            </Link>
          ))}
        </nav>
        <div className="my-5 border-t" />
        <Link href="/app/settings" className={cn("flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground", pathname.startsWith("/app/settings") && "bg-sidebar-accent text-foreground")}>
          <Settings className="size-4" /> Inställningar
        </Link>
        <div className="mt-auto space-y-2 border-t pt-4">
          <div className="flex items-center justify-between rounded-lg px-3 py-2 text-xs text-muted-foreground">
            <span className="max-w-36 truncate">{companyName}</span>
            <select aria-label="Färgtema" value={theme} onChange={(event) => setTheme(event.target.value)} className="cursor-pointer bg-transparent text-foreground outline-none">
              <option value="system">System</option><option value="light">Ljust</option><option value="dark">Mörkt</option>
            </select>
          </div>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={logout} disabled={pending}>
            <LogOut /> Logga ut
          </Button>
        </div>
      </aside>
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur lg:hidden">
        <Link href="/app" className="flex items-center gap-2 font-semibold"><span className="grid size-7 place-items-center rounded-md bg-brand text-xs text-white">C</span> Cemio</Link>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Växla tema" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? <Sun /> : <Moon />}</Button>
          <Link href="/app/projects/new"><Button size="icon" aria-label="Nytt projekt"><Plus /></Button></Link>
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] px-4 py-6 pb-24 lg:ml-64 lg:px-10 lg:py-10">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-20 flex h-16 items-center justify-around border-t bg-background/95 px-2 backdrop-blur lg:hidden">
        {navigation.map(({ href, label, icon: Icon, exact }) => <Link key={href} href={href} className={cn("flex min-w-16 flex-col items-center gap-1 text-[10px] text-muted-foreground", isActive(href, exact) && "text-foreground")}><Icon className="size-4" />{label}</Link>)}
        <Link href="/app/settings" className={cn("flex min-w-16 flex-col items-center gap-1 text-[10px] text-muted-foreground", pathname.startsWith("/app/settings") && "text-foreground")}><Settings className="size-4" />Inställn.</Link>
      </nav>
    </div>
  );
}
