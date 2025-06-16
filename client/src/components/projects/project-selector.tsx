import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Project } from "@shared/schema";

interface ProjectSelectorProps {
  projects: Project[];
  selectedProject: Project | null;
  onProjectChange: (project: Project) => void;
}

export default function ProjectSelector({ projects, selectedProject, onProjectChange }: ProjectSelectorProps) {
  const handleValueChange = (value: string) => {
    const project = projects.find(p => p.id.toString() === value);
    if (project) {
      onProjectChange(project);
    }
  };

  return (
    <div className="min-w-48">
      <Select value={selectedProject?.id.toString() || ""} onValueChange={handleValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Выберите проект" />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id.toString()}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
