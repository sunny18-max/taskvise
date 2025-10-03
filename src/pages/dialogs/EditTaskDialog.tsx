// dialogs/EditTaskDialog.tsx
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
import type { Task } from '../types/managerTypes';

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onTaskUpdated: (taskId: string, updateData: any) => Promise<boolean>;
  user: any;
}

export const EditTaskDialog = ({
  open,
  onOpenChange,
  task,
  onTaskUpdated,
  user
}: EditTaskDialogProps) => {
  const { toast } = useToast();
  const [editedTask, setEditedTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: '',
    status: 'pending' as 'pending' | 'in-progress' | 'completed' | 'overdue',
    estimatedHours: 0,
    actualHours: 0
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setEditedTask({
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        status: task.status,
        estimatedHours: task.estimatedHours || 0,
        actualHours: task.actualHours || 0
      });
    }
  }, [task]);

  const updateTask = async () => {
    if (!task) return;

    try {
      setSaving(true);
      const success = await onTaskUpdated(task.id, editedTask);
      
      if (success) {
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update task",
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
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update task details and status
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="editTaskTitle">Task Title *</Label>
            <Input
              id="editTaskTitle"
              placeholder="Enter task title"
              value={editedTask.title}
              onChange={(e) => setEditedTask({...editedTask, title: e.target.value})}
            />
          </div>
          
          <div>
            <Label htmlFor="editTaskDescription">Description</Label>
            <Textarea
              id="editTaskDescription"
              placeholder="Enter task description"
              value={editedTask.description}
              onChange={(e) => setEditedTask({...editedTask, description: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="editPriority">Priority</Label>
              <Select value={editedTask.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setEditedTask({...editedTask, priority: value})}>
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
            
            <div>
              <Label htmlFor="editStatus">Status</Label>
              <Select value={editedTask.status} onValueChange={(value: 'pending' | 'in-progress' | 'completed' | 'overdue') => setEditedTask({...editedTask, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="editDueDate">Due Date *</Label>
              <Input
                id="editDueDate"
                type="date"
                value={editedTask.dueDate}
                onChange={(e) => setEditedTask({...editedTask, dueDate: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="editEstimatedHours">Estimated Hours</Label>
              <Input
                id="editEstimatedHours"
                type="number"
                placeholder="0"
                value={editedTask.estimatedHours}
                onChange={(e) => setEditedTask({...editedTask, estimatedHours: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="editActualHours">Actual Hours</Label>
            <Input
              id="editActualHours"
              type="number"
              placeholder="0"
              value={editedTask.actualHours}
              onChange={(e) => setEditedTask({...editedTask, actualHours: parseInt(e.target.value) || 0})}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={updateTask} disabled={saving || !editedTask.title || !editedTask.dueDate}>
            {saving ? 'Updating...' : 'Update Task'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};