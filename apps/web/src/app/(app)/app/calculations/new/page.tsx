import { NewCalculation } from "@/features/calculations/new-calculation";
import { getCustomers } from "@/lib/data";

export default async function NewCalculationPage() {
  const customers = await getCustomers();
  return <NewCalculation customers={customers} />;
}
