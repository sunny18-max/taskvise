// dialogs/CreateProjectDialog.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Project, Employee } from '../types/managerTypes';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  onProjectCreated: (projectData: any) => Promise<boolean>;
  user: any;
}

export const CreateProjectDialog = ({
  open,
  onOpenChange,
  employees,
  onProjectCreated,
  user
}: CreateProjectDialogProps) => {
  const { toast } = useToast();
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    deadline: '',
    teamMembers: [] as string[],
    status: 'planning' as 'planning' | 'active' | 'completed' | 'on-hold'
  });
  const [saving, setSaving] = useState(false);

  // Filter out admins, managers, and HR, keep only employees
  const filteredEmployees = employees.filter(employee => 
    employee.role.toLowerCase() !== 'admin' && 
    employee.role.toLowerCase() !== 'manager' &&
    employee.role.toLowerCase() !== 'hr'
  );

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setNewProject({
        name: '',
        description: '',
        deadline: '',
        teamMembers: [],
        status: 'planning'
      });
    }
  }, [open]);

  const createProject = async () => {
    try {
      // Validate required fields
      if (!newProject.name || !newProject.deadline) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      setSaving(true);
      
      // Get team member names for display
      const teamMemberNames = newProject.teamMembers.map(memberId => {
        const employee = employees.find(emp => emp.id === memberId);
        return employee?.fullName || 'Unknown';
      });

      const projectData = {
        name: newProject.name,
        description: newProject.description,
        deadline: newProject.deadline,
        teamMembers: newProject.teamMembers,
        teamMemberNames: teamMemberNames,
        status: newProject.status,
        createdAt: new Date().toISOString(),
        progress: 0,
        totalTasks: 0,
        completedTasks: 0,
        totalHours: 0,
        completedHours: 0
      };

      const success = await onProjectCreated(projectData);
      
      if (success) {
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Set up a new project and assign team members
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="projectName">Project Name *</Label>
            <Input
              id="projectName"
              placeholder="Enter project name"
              value={newProject.name}
              onChange={(e) => setNewProject({...newProject, name: e.target.value})}
            />
          </div>
          
          <div>
            <Label htmlFor="projectDescription">Description</Label>
            <Textarea
              id="projectDescription"
              placeholder="Enter project description"
              value={newProject.description}
              onChange={(e) => setNewProject({...newProject, description: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="projectDeadline">Deadline *</Label>
              <Input
                id="projectDeadline"
                type="date"
                value={newProject.deadline}
                onChange={(e) => setNewProject({...newProject, deadline: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="projectStatus">Status</Label>
              <Select value={newProject.status} onValueChange={(value: 'planning' | 'active' | 'completed' | 'on-hold') => setNewProject({...newProject, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="teamMembers">Team Members</Label>
            <Select onValueChange={(value) => {
              if (value && !newProject.teamMembers.includes(value)) {
                setNewProject({
                  ...newProject,
                  teamMembers: [...newProject.teamMembers, value]
                });
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Add team members" />
              </SelectTrigger>
              <SelectContent>
                {filteredEmployees && filteredEmployees.length > 0 ? (
                  filteredEmployees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.fullName} - {employee.role}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-employees" disabled>
                    No employees available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            
            {newProject.teamMembers.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {newProject.teamMembers.map(memberId => {
                  const employee = employees.find(emp => emp.id === memberId);
                  return employee ? (
                    <Badge key={memberId} variant="secondary" className="flex items-center gap-1">
                      {employee.fullName}
                      <button
                        type="button"
                        onClick={() => setNewProject({
                          ...newProject,
                          teamMembers: newProject.teamMembers.filter(id => id !== memberId)
                        })}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={createProject} disabled={saving || !newProject.name || !newProject.deadline}>
            {saving ? 'Creating...' : 'Create Project'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};