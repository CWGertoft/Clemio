import { notFound } from "next/navigation";
import { QuotePreview } from "@/features/quotes/quote-preview";
import { getQuote } from "@/lib/data";
export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const quote = await getQuote(id); if (!quote) notFound(); return <QuotePreview quote={quote} />; }
