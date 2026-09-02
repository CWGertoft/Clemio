import { notFound } from "next/navigation";
import { NewCalculation } from "@/features/calculations/new-calculation";
import { getProject } from "@/lib/data";

export default async function NewProjectCalculationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();
  return <NewCalculation project={project} />;
}
