// views/ProjectsView.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { Project, Stats, Employee } from '../types/managerTypes';
import { EditProjectDialog } from '../dialogs/EditProjectDialog';

interface ProjectsViewProps {
  projects: Project[];
  employees: Employee[];
  stats: Stats;
  onCreateProject: () => void;
  onUpdateProject: (projectId: string, updateData: any) => Promise<boolean>;
  onDeleteProject: (projectId: string) => Promise<boolean>;
  onEditProject: (project: Project) => void;
  user: any;
}

export const ProjectsView = ({ 
  projects, 
  employees, 
  stats, 
  onCreateProject, 
  onUpdateProject, 
  onDeleteProject,
  onEditProject,
  user 
}: ProjectsViewProps) => {
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editProjectOpen, setEditProjectOpen] = useState(false);

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setEditProjectOpen(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      await onDeleteProject(projectId);
    }
  };

  const handleUpdateProject = async (projectId: string, updateData: any) => {
    const success = await onUpdateProject(projectId, updateData);
    if (success) {
      setEditProjectOpen(false);
      setEditingProject(null);
    }
    return success;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'active': return 'secondary';
      case 'on-hold': return 'outline';
      default: return 'destructive';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gradient">Projects</h1>
            <p className="text-muted-foreground">Manage and track all projects</p>
          </div>
          <Button onClick={onCreateProject}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {projects.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground mb-4">
              <p className="text-lg">No projects found</p>
              <p className="text-sm">Create your first project to get started</p>
            </div>
            <Button onClick={onCreateProject}>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Badge variant={getStatusBadgeVariant(project.status)}>
                      {project.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditProject(project)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteProject(project.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{project.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{project.progress || 0}%</span>
                  </div>
                  <Progress value={project.progress || 0} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Tasks</p>
                    <p className="font-medium">{project.completedTasks || 0}/{project.totalTasks || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Hours</p>
                    <p className="font-medium">{project.completedHours || 0}/{project.totalHours || 0}h</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Deadline</p>
                    <p className="font-medium">
                      {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Team</p>
                    <p className="font-medium">{project.teamMembers?.length || 0} members</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Project Dialog */}
      <EditProjectDialog
        open={editProjectOpen}
        onOpenChange={setEditProjectOpen}
        project={editingProject}
        onProjectUpdated={handleUpdateProject}
        user={user}
        employees={employees}
      />
    </div>
  );
};