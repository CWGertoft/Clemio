import { redirect } from "next/navigation";

export default async function NewCalculationPage() {
  redirect("/app/projects/new");
}
