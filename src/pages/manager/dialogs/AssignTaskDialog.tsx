// dialogs/AssignTaskDialog.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { useToast } from '@/hooks/use-toast';
import type { Task, Employee, Project } from '../types/managerTypes';

interface AssignTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  projects: Project[];
  onTaskAssigned: (taskData: any) => Promise<boolean>;
  user: any;
}

export const AssignTaskDialog = ({
  open,
  onOpenChange,
  employees,
  projects,
  onTaskAssigned,
  user
}: AssignTaskDialogProps) => {
  const { toast } = useToast();
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    project: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: '',
    estimatedHours: 0,
    area: ''
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
      setNewTask({
        title: '',
        description: '',
        assignedTo: '',
        project: '',
        priority: 'medium',
        dueDate: '',
        estimatedHours: 0,
        area: ''
      });
    }
  }, [open]);

  const assignTask = async () => {
    try {
      // Validate required fields
      if (!newTask.title || !newTask.assignedTo || !newTask.dueDate) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      setSaving(true);
      
      // Get assigned employee name for display
      const assignedEmployee = employees.find(emp => emp.id === newTask.assignedTo);
      const assignedToName = assignedEmployee?.fullName || 'Unknown';

      const taskData = {
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        dueDate: newTask.dueDate,
        assignedTo: newTask.assignedTo,
        assignedToName: assignedToName,
        project: newTask.project,
        area: newTask.area,
        estimatedHours: newTask.estimatedHours,
        actualHours: 0,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      const success = await onTaskAssigned(taskData);
      
      if (success) {
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Error assigning task:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign task",
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
          <DialogTitle>Assign New Task</DialogTitle>
          <DialogDescription>
            Create and assign a new task to a team member
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="taskTitle">Task Title *</Label>
            <Input
              id="taskTitle"
              placeholder="Enter task title"
              value={newTask.title}
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
            />
          </div>
          
          <div>
            <Label htmlFor="taskDescription">Description</Label>
            <Textarea
              id="taskDescription"
              placeholder="Enter task description"
              value={newTask.description}
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="assignedTo">Assign To *</Label>
              <Select value={newTask.assignedTo} onValueChange={(value) => setNewTask({...newTask, assignedTo: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
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
            </div>
            
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={newTask.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setNewTask({...newTask, priority: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="estimatedHours">Estimated Hours</Label>
              <Input
                id="estimatedHours"
                type="number"
                placeholder="0"
                value={newTask.estimatedHours}
                onChange={(e) => setNewTask({...newTask, estimatedHours: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="project">Project</Label>
              <Select value={newTask.project} onValueChange={(value) => setNewTask({...newTask, project: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects && projects.length > 0 ? (
                    projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-projects" disabled>
                      No projects available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="area">Area/Department</Label>
              <Input
                id="area"
                placeholder="e.g., Development, Marketing"
                value={newTask.area}
                onChange={(e) => setNewTask({...newTask, area: e.target.value})}
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={assignTask} disabled={saving || !newTask.title || !newTask.assignedTo || !newTask.dueDate}>
            {saving ? 'Assigning...' : 'Assign Task'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};