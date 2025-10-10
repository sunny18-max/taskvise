// dialogs/EditProjectDialog.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onProjectUpdated: (projectId: string, updateData: any) => Promise<boolean>;
  user: any;
  employees?: Employee[];
}

export const EditProjectDialog = ({
  open,
  onOpenChange,
  project,
  onProjectUpdated,
  user,
  employees = []
}: EditProjectDialogProps) => {
  const { toast } = useToast();
  const [editedProject, setEditedProject] = useState({
    name: '',
    description: '',
    deadline: '',
    teamMembers: [] as string[],
    status: 'planning' as 'planning' | 'active' | 'completed' | 'on-hold',
    progress: 0
  });
  const [saving, setSaving] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  // Validate form whenever editedProject changes
  useEffect(() => {
    const isValid = editedProject.name.trim() !== '' && editedProject.deadline !== '';
    setIsFormValid(isValid);
  }, [editedProject]);

  useEffect(() => {
    if (project && open) {
      // Handle deadline properly - it might be a Date object, string, or Firebase Timestamp
      let deadlineString = '';
      
      try {
        if (project.deadline) {
          if (typeof project.deadline === 'string') {
            // If it's already a string, use it directly
            deadlineString = project.deadline.split('T')[0];
          } else if (project.deadline.toDate && typeof project.deadline.toDate === 'function') {
            // Firebase Timestamp with toDate method
            deadlineString = project.deadline.toDate().toISOString().split('T')[0];
          } else if (project.deadline instanceof Date) {
            // Date object
            deadlineString = project.deadline.toISOString().split('T')[0];
          } else if (project.deadline.seconds !== undefined) {
            // Firebase Timestamp with seconds property
            const timestamp = project.deadline.seconds * 1000;
            deadlineString = new Date(timestamp).toISOString().split('T')[0];
          } else if (typeof project.deadline === 'object' && project.deadline._seconds) {
            // Alternative Firebase Timestamp format
            const timestamp = project.deadline._seconds * 1000;
            deadlineString = new Date(timestamp).toISOString().split('T')[0];
          } else {
            console.warn('Unknown deadline format:', project.deadline);
            // Try to parse as date string or timestamp
            try {
              const date = new Date(project.deadline);
              if (!isNaN(date.getTime())) {
                deadlineString = date.toISOString().split('T')[0];
              } else {
                deadlineString = '';
              }
            } catch {
              deadlineString = '';
            }
          }
        }
      } catch (error) {
        console.error('Error parsing deadline:', error);
        // Fallback to empty string if parsing fails
        deadlineString = '';
      }

      setEditedProject({
        name: project.name || '',
        description: project.description || '',
        deadline: deadlineString,
        teamMembers: project.teamMembers || [],
        status: project.status || 'planning',
        progress: project.progress || 0
      });
    }
  }, [project, open]);

  const updateProject = async () => {
    if (!project) return;

    try {
      setSaving(true);
      
      // Validate required fields again
      if (!editedProject.name.trim() || !editedProject.deadline) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      const success = await onProjectUpdated(project.id, editedProject);
      
      if (success) {
        onOpenChange(false);
        toast({
          title: "Success",
          description: "Project updated successfully",
        });
      } else {
        throw new Error("Failed to update project");
      }
    } catch (error: any) {
      console.error('Error updating project:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update project",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Filter active employees only - with safe property access
  const activeEmployees = employees.filter(emp => {
    // Safe check for isActive - default to true if undefined
    const isActive = emp.isActive !== false;
    // Safe check for role - default to 'employee' if undefined
    const role = emp.role || 'employee';
    return isActive && role !== 'admin';
  });

  const handleAddTeamMember = (value: string) => {
    if (value && !editedProject.teamMembers.includes(value)) {
      setEditedProject({
        ...editedProject,
        teamMembers: [...editedProject.teamMembers, value]
      });
    }
  };

  const handleRemoveTeamMember = (memberId: string) => {
    setEditedProject({
      ...editedProject,
      teamMembers: editedProject.teamMembers.filter(id => id !== memberId)
    });
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    const progress = Math.min(100, Math.max(0, value)); // Ensure progress is between 0-100
    setEditedProject({...editedProject, progress});
  };

  const handleNameChange = (value: string) => {
    setEditedProject({...editedProject, name: value});
  };

  const handleDeadlineChange = (value: string) => {
    setEditedProject({...editedProject, deadline: value});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update project details and team members
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="editProjectName">Project Name *</Label>
            <Input
              id="editProjectName"
              placeholder="Enter project name"
              value={editedProject.name}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="editProjectDescription">Description</Label>
            <Textarea
              id="editProjectDescription"
              placeholder="Enter project description"
              value={editedProject.description}
              onChange={(e) => setEditedProject({...editedProject, description: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="editProjectDeadline">Deadline *</Label>
              <Input
                id="editProjectDeadline"
                type="date"
                value={editedProject.deadline}
                onChange={(e) => handleDeadlineChange(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="editProjectStatus">Status</Label>
              <Select 
                value={editedProject.status} 
                onValueChange={(value: 'planning' | 'active' | 'completed' | 'on-hold') => 
                  setEditedProject({...editedProject, status: value})
                }
              >
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
            <Label htmlFor="editProjectProgress">Progress</Label>
            <div className="space-y-2">
              <Progress value={editedProject.progress} className="h-2" />
              <Input
                id="editProjectProgress"
                type="number"
                min="0"
                max="100"
                value={editedProject.progress}
                onChange={handleProgressChange}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="editTeamMembers">Team Members</Label>
            <Select onValueChange={handleAddTeamMember}>
              <SelectTrigger>
                <SelectValue placeholder="Add team members" />
              </SelectTrigger>
              <SelectContent>
                {activeEmployees && activeEmployees.length > 0 ? (
                  activeEmployees.map((employee) => {
                    // Safe property access with fallbacks
                    const fullName = employee.fullName || 'Unknown Employee';
                    const designation = employee.designation || employee.role || 'Employee';
                    
                    return (
                      <SelectItem key={employee.id} value={employee.id}>
                        {fullName} - {designation}
                      </SelectItem>
                    );
                  })
                ) : (
                  <SelectItem value="no-employees" disabled>
                    No active employees available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            
            {editedProject.teamMembers.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {editedProject.teamMembers.map(memberId => {
                  const employee = employees.find(emp => emp.id === memberId);
                  // Safe property access with fallbacks
                  const fullName = employee?.fullName || 'Unknown Employee';
                  
                  return employee ? (
                    <Badge key={memberId} variant="secondary" className="flex items-center gap-1">
                      {fullName}
                      <button
                        type="button"
                        onClick={() => handleRemoveTeamMember(memberId)}
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
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={saving}
          >
            Cancel
          </Button>
          <Button 
            onClick={updateProject} 
            disabled={saving || !isFormValid}
          >
            {saving ? 'Updating...' : 'Update Project'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};