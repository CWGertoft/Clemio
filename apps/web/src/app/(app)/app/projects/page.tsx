import { ProjectList } from "@/features/projects/project-list";
import { getProjects } from "@/lib/data";

export default async function ProjectsPage() {
  return <ProjectList projects={await getProjects()} />;
}
