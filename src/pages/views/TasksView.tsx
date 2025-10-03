// views/TasksView.tsx
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Filter, Edit, Trash2 } from 'lucide-react';
import type { Task, Stats } from '../types/managerTypes';
import { EditTaskDialog } from '../dialogs/EditTaskDialog';

interface TasksViewProps {
  tasks: Task[];
  stats: Stats;
  onAssignTask: () => void;
  onUpdateTask: (taskId: string, updateData: any) => Promise<boolean>;
  onDeleteTask: (taskId: string) => Promise<boolean>;
  onEditTask: (task: Task) => void;
  user: any;
}

export const TasksView = ({ 
  tasks, 
  stats, 
  onAssignTask, 
  onUpdateTask, 
  onDeleteTask,
  onEditTask,
  user 
}: TasksViewProps) => {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTaskOpen, setEditTaskOpen] = useState(false);

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditTaskOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await onDeleteTask(taskId);
    }
  };

  const handleUpdateTask = async (taskId: string, updateData: any) => {
    const success = await onUpdateTask(taskId, updateData);
    if (success) {
      setEditTaskOpen(false);
      setEditingTask(null);
    }
    return success;
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in-progress': return 'secondary';
      case 'overdue': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gradient">Tasks</h1>
            <p className="text-muted-foreground">Manage and track all tasks</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button onClick={onAssignTask}>
              <Plus className="h-4 w-4 mr-2" />
              Assign Task
            </Button>
          </div>
        </div>
      </div>

      {tasks.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground mb-4">
              <p className="text-lg">No tasks found</p>
              <p className="text-sm">Assign your first task to get started</p>
            </div>
            <Button onClick={onAssignTask}>
              <Plus className="h-4 w-4 mr-2" />
              Assign Task
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <Card key={task.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{task.title}</h3>
                      <Badge variant={getPriorityBadgeVariant(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-4">{task.description}</p>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Assigned To</p>
                        <p className="font-medium">{task.assignedToName || 'Unassigned'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Due Date</p>
                        <p className="font-medium">
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Project</p>
                        <p className="font-medium">{task.project || 'No Project'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Hours</p>
                        <p className="font-medium">{task.actualHours || 0}/{task.estimatedHours || 0}h</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <Badge variant={getStatusBadgeVariant(task.status)}>
                      {task.status}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTask(task)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Task Dialog */}
      <EditTaskDialog
        open={editTaskOpen}
        onOpenChange={setEditTaskOpen}
        task={editingTask}
        onTaskUpdated={handleUpdateTask}
        user={user}
      />
    </div>
  );
};