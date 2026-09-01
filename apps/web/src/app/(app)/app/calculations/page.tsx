import { CalculationList } from "@/features/calculations/calculation-list";
import { getCalculations } from "@/lib/data";
export default async function CalculationsPage() { return <CalculationList calculations={await getCalculations()} />; }
