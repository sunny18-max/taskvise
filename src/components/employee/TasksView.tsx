import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Filter, PlayCircle, CheckCircle2, Eye, Clock, Calendar, X, AlertCircle } from 'lucide-react';

interface TasksViewProps {
  tasks: any[];
  filteredTasks: any[];
  taskFilters: any;
  setTaskFilters: (filters: any) => void;
  updateTaskStatus: (taskId: string, status: string) => Promise<void>;
  startTimer: (taskId: string) => void;
  setSelectedTask: (task: any) => void;
  setTaskDetailsOpen: (open: boolean) => void;
  activeTimer: string | null;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
}

export const TasksView = ({
  tasks,
  filteredTasks,
  taskFilters,
  setTaskFilters,
  updateTaskStatus,
  startTimer,
  setSelectedTask,
  setTaskDetailsOpen,
  activeTimer,
  getStatusColor,
  getPriorityColor
}: TasksViewProps) => {
  const projects = Array.from(new Set(tasks.map(task => task.project).filter(Boolean)));
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTaskState] = useState<any>(null);
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTaskClick = (task: any) => {
    setSelectedTaskState(task);
    setSelectedTask(task);
    setIsTaskDetailsOpen(true);
    setTaskDetailsOpen(true);
  };

  const handleCloseTaskDetails = () => {
    setIsTaskDetailsOpen(false);
    setSelectedTaskState(null);
    setSelectedTask(null);
    setTaskDetailsOpen(false);
    setError(null);
  };

  const handleUpdateStatus = async (taskId: string, status: string) => {
    try {
      setUpdatingTaskId(taskId);
      setError(null);
      console.log('Updating task status:', { taskId, status });
      
      // Validate task exists
      const taskExists = tasks.find(task => task.id === taskId);
      if (!taskExists) {
        const errorMsg = 'Task not found';
        setError(errorMsg);
        console.error(errorMsg, taskId);
        return;
      }

      // Validate status
      const validStatuses = ['pending', 'in-progress', 'completed', 'overdue'];
      if (!validStatuses.includes(status)) {
        const errorMsg = 'Invalid status provided';
        setError(errorMsg);
        console.error(errorMsg, status);
        return;
      }

      // Call the update function
      await updateTaskStatus(taskId, status);
      console.log('Task status updated successfully');
      
      // If we're viewing this task's details, update the local state
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTaskState({
          ...selectedTask,
          status: status
        });
      }
      
    } catch (error) {
      const errorMsg = `Failed to update task status: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setError(errorMsg);
      console.error('Error updating task status:', error);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const getTimeRemaining = (dueDate: string) => {
    if (!dueDate) return { days: 0, status: 'normal' };
    
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { days: Math.abs(diffDays), status: 'overdue' };
    if (diffDays === 0) return { days: 0, status: 'today' };
    if (diffDays <= 3) return { days: diffDays, status: 'urgent' };
    return { days: diffDays, status: 'normal' };
  };

  const getDueDateColor = (status: string) => {
    switch (status) {
      case 'overdue': return 'text-red-600 bg-red-50 border-red-200';
      case 'today': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'urgent': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
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

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  // Further filter by search term
  const finalFilteredTasks = filteredTasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Task Details Modal Component
  const TaskDetailsModal = () => {
    if (!selectedTask) return null;

    const timeRemaining = getTimeRemaining(selectedTask.dueDate);
    const isTaskCompleted = selectedTask.status === 'completed';

    return (
      <Dialog open={isTaskDetailsOpen} onOpenChange={handleCloseTaskDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Task Details</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseTaskDetails}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
            <DialogDescription>
              Detailed information about the selected task
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Task Header */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="text-xl font-semibold">{selectedTask.title}</h3>
                <div className="flex gap-2 flex-wrap justify-end">
                  <Badge variant={getPriorityBadgeVariant(selectedTask.priority)}>
                    {selectedTask.priority} Priority
                  </Badge>
                  <Badge variant={getStatusBadgeVariant(selectedTask.status)}>
                    {selectedTask.status.replace('-', ' ')}
                  </Badge>
                  {selectedTask.dueDate && (
                    <Badge variant="outline" className={getDueDateColor(timeRemaining.status)}>
                      <Calendar className="h-3 w-3 mr-1" />
                      {timeRemaining.status === 'overdue' ? `${timeRemaining.days}d overdue` :
                       timeRemaining.status === 'today' ? 'Due today' :
                       timeRemaining.status === 'urgent' ? `${timeRemaining.days}d left` :
                       `${timeRemaining.days}d left`}
                    </Badge>
                  )}
                </div>
              </div>
              
              <p className="text-muted-foreground">
                {selectedTask.description || 'No description available'}
              </p>
            </div>

            {/* Task Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Project</label>
                  <p className="font-medium">{selectedTask.project || 'No project'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Area</label>
                  <p className="font-medium">{selectedTask.area || 'No area specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Assigned By</label>
                  <p className="font-medium">{selectedTask.assignedByName || 'Unknown'}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                  <p className="font-medium">
                    {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : 'No due date'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Time Estimate</label>
                  <p className="font-medium">
                    Estimated: {selectedTask.estimatedHours || 0}h | 
                    Actual: {Math.round((selectedTask.actualHours || 0) * 10) / 10}h
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="font-medium">
                    {selectedTask.createdAt ? new Date(selectedTask.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>

            {/* Task Actions */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Task Actions</h4>
              <div className="flex flex-wrap gap-2">
                {!isTaskCompleted && (
                  <>
                    <Button
                      onClick={() => handleUpdateStatus(selectedTask.id, 'in-progress')}
                      disabled={updatingTaskId === selectedTask.id || selectedTask.status === 'in-progress'}
                      variant="outline"
                      size="sm"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      {updatingTaskId === selectedTask.id ? 'Updating...' : 'Mark In Progress'}
                    </Button>
                    
                    <Button
                      onClick={() => startTimer(selectedTask.id)}
                      disabled={activeTimer !== null && activeTimer !== selectedTask.id}
                      variant="outline"
                      size="sm"
                    >
                      <PlayCircle className={`h-4 w-4 mr-2 ${activeTimer === selectedTask.id ? 'text-green-600' : ''}`} />
                      {activeTimer === selectedTask.id ? 'Timer Running' : 'Start Timer'}
                    </Button>

                    <Button
                      onClick={() => handleUpdateStatus(selectedTask.id, 'completed')}
                      disabled={updatingTaskId === selectedTask.id}
                      variant="default"
                      size="sm"
                    >
                      <CheckCircle2 className={`h-4 w-4 mr-2 ${updatingTaskId === selectedTask.id ? 'animate-spin' : ''}`} />
                      {updatingTaskId === selectedTask.id ? 'Marking...' : 'Mark Completed'}
                    </Button>
                  </>
                )}
                
                {selectedTask.status === 'in-progress' && (
                  <Button
                    onClick={() => handleUpdateStatus(selectedTask.id, 'pending')}
                    disabled={updatingTaskId === selectedTask.id}
                    variant="outline"
                    size="sm"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    {updatingTaskId === selectedTask.id ? 'Updating...' : 'Mark Pending'}
                  </Button>
                )}

                {isTaskCompleted && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Task Completed</span>
                    {selectedTask.completedAt && (
                      <span className="text-xs text-muted-foreground">
                        on {new Date(selectedTask.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Additional Information */}
            {selectedTask.screenshot && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Screenshot</h4>
                <div className="border rounded-lg p-4">
                  <img 
                    src={selectedTask.screenshot} 
                    alt="Task screenshot" 
                    className="max-w-full h-auto rounded"
                  />
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gradient">My Tasks</h1>
            <p className="text-muted-foreground">Manage and track your assigned tasks</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setTaskFilters({ status: 'all', priority: 'all', project: 'all' });
                setSearchTerm('');
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <div className="lg:col-span-1">
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        <Select 
          value={taskFilters.status} 
          onValueChange={(value) => setTaskFilters({...taskFilters, status: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={taskFilters.priority} 
          onValueChange={(value) => setTaskFilters({...taskFilters, priority: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={taskFilters.project} 
          onValueChange={(value) => setTaskFilters({...taskFilters, project: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map(project => (
              <SelectItem key={project} value={project}>{project}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="mt-2 text-red-600 hover:text-red-800"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Tasks Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{tasks.length}</div>
            <div className="text-sm text-muted-foreground">Total Tasks</div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {tasks.filter(t => t.status === 'completed').length}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {tasks.filter(t => t.status === 'in-progress').length}
            </div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {tasks.filter(t => t.status === 'overdue').length}
            </div>
            <div className="text-sm text-muted-foreground">Overdue</div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {finalFilteredTasks.map((task) => {
          const timeRemaining = getTimeRemaining(task.dueDate);
          const isUpdating = updatingTaskId === task.id;
          
          return (
            <Card key={task.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{task.title}</h3>
                      <Badge variant={getPriorityBadgeVariant(task.priority)}>
                        {task.priority}
                      </Badge>
                      <Badge variant={getStatusBadgeVariant(task.status)}>
                        {task.status.replace('-', ' ')}
                        {isUpdating && <span className="ml-1">...</span>}
                      </Badge>
                      {task.dueDate && (
                        <Badge variant="outline" className={getDueDateColor(timeRemaining.status)}>
                          <Calendar className="h-3 w-3 mr-1" />
                          {timeRemaining.status === 'overdue' ? `${timeRemaining.days}d overdue` :
                           timeRemaining.status === 'today' ? 'Due today' :
                           timeRemaining.status === 'urgent' ? `${timeRemaining.days}d left` :
                           `${timeRemaining.days}d left`}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-muted-foreground mb-3 line-clamp-2">
                      {task.description || 'No description available'}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      {task.project && (
                        <span className="flex items-center gap-1">
                          Project: <span className="font-medium">{task.project}</span>
                        </span>
                      )}
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          Due: <span className="font-medium">{new Date(task.dueDate).toLocaleDateString()}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        Estimated: <span className="font-medium">{task.estimatedHours || 0}h</span>
                      </span>
                      <span className="flex items-center gap-1">
                        Actual: <span className="font-medium">{Math.round((task.actualHours || 0) * 10) / 10}h</span>
                      </span>
                      {task.assignedByName && (
                        <span className="flex items-center gap-1">
                          By: <span className="font-medium">{task.assignedByName}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTaskClick(task)}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {task.status !== 'completed' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startTimer(task.id)}
                          disabled={activeTimer !== null && activeTimer !== task.id}
                          title={activeTimer === task.id ? "Timer running" : "Start timer"}
                        >
                          <PlayCircle className={`h-4 w-4 ${activeTimer === task.id ? 'text-green-600' : ''}`} />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(task.id, 'completed')}
                          disabled={isUpdating}
                          title="Mark as completed"
                        >
                          <CheckCircle2 className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
                        </Button>
                      </>
                    )}
                    
                    {task.status === 'in-progress' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(task.id, 'pending')}
                        disabled={isUpdating}
                        title="Mark as pending"
                      >
                        <Clock className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {finalFilteredTasks.length === 0 && (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No tasks found</p>
                <p className="text-sm">
                  {tasks.length === 0 
                    ? "You don't have any tasks assigned yet." 
                    : "No tasks match your current filters."
                  }
                </p>
                {(taskFilters.status !== 'all' || taskFilters.priority !== 'all' || taskFilters.project !== 'all' || searchTerm) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTaskFilters({ status: 'all', priority: 'all', project: 'all' });
                      setSearchTerm('');
                    }}
                    className="mt-4"
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Task Details Modal */}
      <TaskDetailsModal />
    </div>
  );
};