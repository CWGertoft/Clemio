import { notFound } from "next/navigation";
import { CalculationEditor } from "@/features/calculations/calculation-editor";
import { getCalculation, getCustomers, getLatestReviewSuggestions, getLibrary } from "@/lib/data";
export default async function CalculationPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const [calculation, customers, library] = await Promise.all([getCalculation(id), getCustomers(), getLibrary()]); if (!calculation) notFound(); const review = await getLatestReviewSuggestions(id); return <CalculationEditor calculation={calculation} customers={customers} library={library} review={review} />; }
