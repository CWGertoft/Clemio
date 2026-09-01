import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="grid min-h-screen place-items-center bg-muted/50 p-5"><section className="w-full max-w-md rounded-2xl border bg-card p-7 shadow-sm sm:p-9"><Link href="/" className="mb-9 inline-flex items-center gap-2 text-lg font-semibold"><span className="grid size-8 place-items-center rounded-lg bg-brand text-sm text-white">C</span>Cemio</Link>{children}</section></main>;
}
