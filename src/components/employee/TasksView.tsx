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
import { Filter, PlayCircle, CheckCircle2, Eye, Clock, Calendar } from 'lucide-react';

interface TasksViewProps {
  tasks: any[];
  filteredTasks: any[];
  taskFilters: any;
  setTaskFilters: (filters: any) => void;
  updateTaskStatus: (taskId: string, status: string) => void;
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

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setTaskDetailsOpen(true);
  };

  const handleUpdateStatus = async (taskId: string, status: string) => {
    try {
      setUpdatingTaskId(taskId);
      console.log('Updating task status:', { taskId, status });
      
      // Validate task exists
      const taskExists = tasks.find(task => task.id === taskId);
      if (!taskExists) {
        console.error('Task not found:', taskId);
        return;
      }

      // Call the update function
      await updateTaskStatus(taskId, status);
      console.log('Task status updated successfully');
      
    } catch (error) {
      console.error('Error updating task status:', error);
      // You can add a toast notification here if you have a toast system
      // toast.error('Failed to update task status');
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

  // Further filter by search term
  const finalFilteredTasks = filteredTasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
              onClick={() => setTaskFilters({ status: '', priority: '', project: '' })}
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
          
          return (
            <Card key={task.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{task.title}</h3>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.replace('-', ' ')}
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
                    
                    <p className="text-muted-foreground mb-3">{task.description || 'No description available'}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      {task.project && <span>Project: {task.project}</span>}
                      {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                      <span>Estimated: {task.estimatedHours || 0}h</span>
                      <span>Actual: {Math.round((task.actualHours || 0) * 10) / 10}h</span>
                      {task.assignedByName && <span>Assigned by: {task.assignedByName}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTaskClick(task)}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {task.status !== 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startTimer(task.id)}
                        disabled={activeTimer !== null && activeTimer !== task.id}
                        title={activeTimer === task.id ? "Timer running" : "Start timer"}
                      >
                        <PlayCircle className={`h-4 w-4 ${activeTimer === task.id ? 'text-green-600' : ''}`} />
                      </Button>
                    )}
                    
                    {task.status !== 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(task.id, 'completed')}
                        disabled={updatingTaskId === task.id}
                        title="Mark as completed"
                      >
                        <CheckCircle2 className={`h-4 w-4 ${updatingTaskId === task.id ? 'animate-spin' : ''}`} />
                      </Button>
                    )}
                    
                    {task.status === 'in-progress' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(task.id, 'pending')}
                        disabled={updatingTaskId === task.id}
                        title="Mark as pending"
                      >
                        <Clock className={`h-4 w-4 ${updatingTaskId === task.id ? 'animate-spin' : ''}`} />
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
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};