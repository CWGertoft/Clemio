"use client";

import { jsPDF } from "jspdf";
import { Download, LoaderCircle, Printer } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatSek, sumMoney } from "@/lib/money";
import type { CalculationItemType, Quote } from "@/types/domain";
import { toast } from "sonner";

const typeName: Record<CalculationItemType, string> = { labor: "Arbete", material: "Material", other: "Övriga kostnader" };

function displayRows(quote: Quote) {
  if (quote.detailLevel === "detailed") return quote.items.map((item) => ({ name: item.name, quantity: `${item.quantity} ${item.unit}`, total: item.totalPrice }));
  return (["labor", "material", "other"] as CalculationItemType[]).map((type) => ({ name: typeName[type], quantity: "", total: sumMoney(quote.items.filter((item) => item.type === type).map((item) => item.totalPrice)) })).filter((item) => item.total > 0);
}

export function QuotePreview({ quote }: { quote: Quote }) {
  const [downloading, setDownloading] = useState(false);
  const rows = displayRows(quote); const date = new Intl.DateTimeFormat("sv-SE", { dateStyle: "long" }).format(new Date(quote.createdAt));
  async function download() {
    setDownloading(true);
    try {
      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const width = 210; const margin = 20; let y = 24;
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(22); pdf.text(quote.company.name, margin, y); y += 8;
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(9);
      [quote.company.address, `${quote.company.postalCode ?? ""} ${quote.company.city ?? ""}`.trim(), quote.company.email, quote.company.phone, quote.company.organizationNumber ? `Org.nr ${quote.company.organizationNumber}` : ""].filter(Boolean).forEach((line) => { pdf.text(String(line), margin, y); y += 4.5; });
      y = 24; pdf.setFont("helvetica", "bold"); pdf.setFontSize(22); pdf.text("OFFERT", width - margin, y, { align: "right" }); y += 8; pdf.setFont("helvetica", "normal"); pdf.setFontSize(9); pdf.text(`Offertnummer: ${quote.quoteNumber}`, width - margin, y, { align: "right" }); y += 4.5; pdf.text(`Datum: ${date}`, width - margin, y, { align: "right" });
      y = 67; pdf.setDrawColor(190); pdf.line(margin, y, width - margin, y); y += 10; pdf.setFont("helvetica", "bold"); pdf.setFontSize(15); pdf.text(quote.title, margin, y); y += 8; pdf.setFont("helvetica", "normal"); pdf.setFontSize(9);
      if (quote.customer) { pdf.setFont("helvetica", "bold"); pdf.text("Till", margin, y); y += 5; pdf.setFont("helvetica", "normal"); [quote.customer.name, quote.customer.address, `${quote.customer.postalCode ?? ""} ${quote.customer.city ?? ""}`.trim()].filter(Boolean).forEach((line) => { pdf.text(String(line), margin, y); y += 4.5; }); y += 4; }
      if (quote.introText) { const lines = pdf.splitTextToSize(quote.introText, width - margin * 2); pdf.text(lines, margin, y); y += lines.length * 4.5 + 6; }
      pdf.setFillColor(245, 247, 245); pdf.rect(margin, y, width - margin * 2, 7, "F"); pdf.setFont("helvetica", "bold"); pdf.text("Beskrivning", margin + 3, y + 4.6); pdf.text("Summa", width - margin - 3, y + 4.6, { align: "right" }); y += 12; pdf.setFont("helvetica", "normal");
      rows.forEach((row) => { if (y > 245) { pdf.addPage(); y = 24; } pdf.text(row.name, margin + 3, y); if (row.quantity) pdf.text(row.quantity, margin + 3, y + 4); pdf.text(formatSek(row.total), width - margin - 3, y, { align: "right" }); y += row.quantity ? 11 : 7; });
      y += 4; pdf.setDrawColor(190); pdf.line(width - 88, y, width - margin, y); y += 6; pdf.setFont("helvetica", "normal"); pdf.text("Delsumma exkl. moms", width - 88, y); pdf.text(formatSek(quote.subtotal), width - margin, y, { align: "right" }); y += 6; pdf.text(`Moms`, width - 88, y); pdf.text(formatSek(quote.vatAmount), width - margin, y, { align: "right" }); y += 7; pdf.setFont("helvetica", "bold"); pdf.setFontSize(12); pdf.text("Totalt inkl. moms", width - 88, y); pdf.text(formatSek(quote.total), width - margin, y, { align: "right" });
      if (quote.terms) { y += 17; pdf.setFontSize(9); pdf.setFont("helvetica", "bold"); pdf.text("Villkor", margin, y); y += 5; pdf.setFont("helvetica", "normal"); pdf.text(pdf.splitTextToSize(quote.terms, width - margin * 2), margin, y); }
      pdf.save(`offert-${quote.quoteNumber}.pdf`);
      toast.success("PDF har laddats ned");
    } catch { toast.error("PDF kunde inte skapas."); }
    finally { setDownloading(false); }
  }
  return <div className="space-y-6"><header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm text-muted-foreground">Offert {quote.quoteNumber}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Förhandsvisning</h1></div><div className="flex gap-2"><Button variant="outline" onClick={() => window.print()}><Printer />Skriv ut</Button><Button onClick={download} disabled={downloading}>{downloading ? <LoaderCircle className="animate-spin" /> : <Download />}Ladda ned PDF</Button></div></header><article className="mx-auto max-w-4xl bg-white p-7 text-[#2e3d38] shadow-sm ring-1 ring-black/5 sm:p-12 print:shadow-none"><div className="flex flex-col justify-between gap-8 border-b border-[#dce3de] pb-9 sm:flex-row"><div><div className="text-2xl font-semibold">{quote.company.name}</div><div className="mt-3 space-y-0.5 text-sm text-[#6f7d77]">{quote.company.address && <p>{quote.company.address}</p>}<p>{[quote.company.postalCode, quote.company.city].filter(Boolean).join(" ")}</p>{quote.company.email && <p>{quote.company.email}</p>}{quote.company.phone && <p>{quote.company.phone}</p>}{quote.company.organizationNumber && <p>Org.nr {quote.company.organizationNumber}</p>}</div></div><div className="sm:text-right"><p className="text-3xl font-semibold tracking-tight">Offert</p><p className="mt-3 text-sm">{quote.quoteNumber}</p><p className="text-sm text-[#6f7d77]">{date}</p></div></div><div className="mt-10"><h2 className="text-xl font-semibold">{quote.title}</h2>{quote.customer && <div className="mt-6 text-sm"><p className="font-medium">Till</p><p className="mt-1">{quote.customer.name}</p>{quote.customer.address && <p>{quote.customer.address}</p>}<p>{[quote.customer.postalCode, quote.customer.city].filter(Boolean).join(" ")}</p></div>}{quote.introText && <p className="mt-7 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-[#40534b]">{quote.introText}</p>}</div><div className="mt-10 overflow-hidden border border-[#dce3de]"><div className="grid grid-cols-[1fr_auto] bg-[#f5f7f5] px-4 py-3 text-xs font-medium uppercase tracking-wide text-[#6f7d77]"><span>Beskrivning</span><span>Summa</span></div>{rows.map((row) => <div key={`${row.name}-${row.total}`} className="grid grid-cols-[1fr_auto] border-t border-[#e8eeea] px-4 py-4 text-sm"><div><p className="font-medium">{row.name}</p>{row.quantity && <p className="mt-1 text-xs text-[#6f7d77]">{row.quantity}</p>}</div><span className="font-medium">{formatSek(row.total)}</span></div>)}</div><div className="ml-auto mt-7 w-full max-w-xs space-y-3 text-sm"><div className="flex justify-between"><span className="text-[#6f7d77]">Delsumma exkl. moms</span><span>{formatSek(quote.subtotal)}</span></div><div className="flex justify-between"><span className="text-[#6f7d77]">Moms</span><span>{formatSek(quote.vatAmount)}</span></div><div className="flex justify-between border-t border-[#dce3de] pt-3 text-base font-semibold"><span>Totalt inkl. moms</span><span>{formatSek(quote.total)}</span></div></div>{quote.terms && <section className="mt-12 border-t border-[#dce3de] pt-6"><h3 className="text-sm font-semibold">Villkor</h3><p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-[#6f7d77]">{quote.terms}</p></section>}</article></div>;
}
