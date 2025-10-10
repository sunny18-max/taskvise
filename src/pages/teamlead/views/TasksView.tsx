import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Search, 
  Filter,
  Plus,
  Clock,
  AlertTriangle,
  Calendar,
  User,
  Target,
  MoreHorizontal,
  Edit,
  Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TasksViewProps {
  tasks: any[];
  teamMembers: any[];
  projects: any[];
  onAssignTask: () => void;
  onUpdateTask: (taskId: string, updateData: any) => Promise<boolean>;
  onEditTask: (task: any) => void;
  onViewTask: (task: any) => void;
}

export const TasksView = ({
  tasks,
  teamMembers,
  projects,
  onAssignTask,
  onUpdateTask,
  onEditTask,
  onViewTask
}: TasksViewProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});

  // Debug: Log tasks to see what's being passed
  useEffect(() => {
    console.log('TasksView received tasks:', tasks);
    console.log('Tasks count:', tasks?.length);
    if (tasks && tasks.length > 0) {
      console.log('First task sample:', tasks[0]);
    }
  }, [tasks]);

  // Ensure tasks is always an array
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const filteredTasks = safeTasks.filter(task => {
    if (!task) return false;
    
    const matchesSearch = 
      (task.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (task.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (task.assignedToName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { class: "bg-yellow-100 text-yellow-800", icon: Clock },
      'in-progress': { class: "bg-blue-100 text-blue-800", icon: Clock },
      completed: { class: "bg-green-100 text-green-800", icon: CheckCircle },
      overdue: { class: "bg-red-100 text-red-800", icon: AlertTriangle }
    };
    const config = variants[status as keyof typeof variants] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={config.class}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800"
    };
    return <Badge className={variants[priority as keyof typeof variants] || variants.medium}>
      {priority}
    </Badge>;
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    setLoadingStates(prev => ({ ...prev, [taskId]: true }));
    try {
      await onUpdateTask(taskId, { status: newStatus });
    } catch (error) {
      console.error('Failed to update task status:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const handleEditTask = (task: any) => {
    onEditTask(task);
  };

  const handleViewTask = (task: any) => {
    onViewTask(task);
  };

  // Format date safely
  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Manage and track tasks assigned to your team
          </p>
        </div>
        <Button onClick={onAssignTask}>
          <Plus className="mr-2 h-4 w-4" />
          Assign Task
        </Button>
      </div>

      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="text-sm">
              <strong>Debug Info:</strong> Showing {filteredTasks.length} of {safeTasks.length} total tasks
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks by title, description, or assignee..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
              <select
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle>All Tasks ({filteredTasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTasks.map((task) => {
              if (!task) return null;
              
              const overdue = isOverdue(task.dueDate) && task.status !== 'completed';
              const isLoading = loadingStates[task.id];
              
              return (
                <div key={task.id} className={`p-4 rounded-lg border ${
                  overdue ? 'border-red-200 bg-red-50' : 'hover:bg-gray-50'
                } ${isLoading ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleStatusChange(
                              task.id, 
                              task.status === 'completed' ? 'pending' : 'completed'
                            )}
                            disabled={isLoading}
                          >
                            <div className={`h-4 w-4 rounded border-2 ${
                              task.status === 'completed' 
                                ? 'bg-green-600 border-green-600' 
                                : 'border-gray-300'
                            }`}>
                              {task.status === 'completed' && (
                                <CheckCircle className="h-4 w-4 text-white" />
                              )}
                            </div>
                          </Button>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{task.title || 'Untitled Task'}</h4>
                            {task.priority && getPriorityBadge(task.priority)}
                            {overdue && (
                              <Badge variant="destructive">Overdue</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {task.description || 'No description provided'}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <span>{task.assignedToName || 'Unassigned'}</span>
                            </div>
                            {task.projectName && (
                              <div className="flex items-center gap-1">
                                <Target className="h-4 w-4" />
                                <span>{task.projectName}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>Due: {formatDate(task.dueDate)}</span>
                            </div>
                            {(task.estimatedHours || task.estimatedHours === 0) && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{task.estimatedHours}h estimated</span>
                              </div>
                            )}
                            {task.actualHours > 0 && (
                              <div className="flex items-center gap-1">
                                <span>{task.actualHours}h spent</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {getStatusBadge(overdue ? 'overdue' : (task.status || 'pending'))}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={isLoading}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(task.id, 'in-progress')}
                            disabled={task.status === 'in-progress' || isLoading}
                          >
                            Mark In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(task.id, 'completed')}
                            disabled={task.status === 'completed' || isLoading}
                          >
                            Mark Complete
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditTask(task)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Task
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewTask(task)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredTasks.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Try adjusting your search criteria' 
                  : 'Get started by assigning your first task'
                }
              </p>
              <Button onClick={onAssignTask}>
                <Plus className="mr-2 h-4 w-4" />
                Assign Task
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Statistics */}
      {filteredTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Task Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center p-4 rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">{safeTasks.length}</div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
              </div>
              <div className="text-center p-4 rounded-lg border">
                <div className="text-2xl font-bold text-green-600">
                  {safeTasks.filter(t => t.status === 'completed').length}
                </div>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <div className="text-center p-4 rounded-lg border">
                <div className="text-2xl font-bold text-yellow-600">
                  {safeTasks.filter(t => t.status === 'in-progress').length}
                </div>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
              <div className="text-center p-4 rounded-lg border">
                <div className="text-2xl font-bold text-red-600">
                  {safeTasks.filter(t => isOverdue(t.dueDate) && t.status !== 'completed').length}
                </div>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};