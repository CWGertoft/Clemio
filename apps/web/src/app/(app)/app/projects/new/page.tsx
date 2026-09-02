import { NewProject } from "@/features/projects/new-project";
import { getCustomers } from "@/lib/data";

export default async function NewProjectPage() {
  return <NewProject customers={await getCustomers()} />;
}
