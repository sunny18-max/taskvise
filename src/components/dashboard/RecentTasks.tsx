import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  assignee: {
    name: string;
    avatar?: string;
  };
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'review' | 'completed' | 'blocked';
  progress: number;
  dueDate: string;
  isOverdue: boolean;
}

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Update user authentication system',
    assignee: { name: 'John Doe' },
    priority: 'high',
    status: 'in_progress',
    progress: 75,
    dueDate: '2024-09-25',
    isOverdue: false,
  },
  {
    id: '2',
    title: 'Design new dashboard layout',
    assignee: { name: 'Jane Smith' },
    priority: 'medium',
    status: 'review',
    progress: 90,
    dueDate: '2024-09-24',
    isOverdue: true,
  },
  {
    id: '3',
    title: 'Fix responsive issues on mobile',
    assignee: { name: 'Mike Johnson' },
    priority: 'low',
    status: 'todo',
    progress: 0,
    dueDate: '2024-09-28',
    isOverdue: false,
  },
];

const getPriorityVariant = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'default';
    case 'low':
      return 'secondary';
    default:
      return 'default';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'todo':
      return 'text-slate-600';
    case 'in_progress':
      return 'text-blue-600';
    case 'review':
      return 'text-yellow-600';
    case 'completed':
      return 'text-green-600';
    case 'blocked':
      return 'text-red-600';
    default:
      return 'text-slate-600';
  }
};

export const RecentTasks = () => {
  return (
    <Card className="card-professional border-0 shadow-[var(--shadow-card)] bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-gradient-primary"></div>
          Recent Tasks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-start space-x-4 p-4 rounded-lg border bg-card/30 hover:bg-accent/30 transition-all duration-200 hover:shadow-md"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={task.assignee.avatar} />
                <AvatarFallback className="bg-gradient-primary text-white text-xs">
                  {task.assignee.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <h4 className="text-sm font-medium leading-none">
                    {task.title}
                  </h4>
                  <div className="flex items-center space-x-2">
                    {task.isOverdue && (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                    <Badge variant={getPriorityVariant(task.priority)} className="text-xs">
                      {task.priority}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={cn("text-xs capitalize font-medium", getStatusColor(task.status))}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{task.dueDate}</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Progress</span>
                    <span>{task.progress}%</span>
                  </div>
                  <Progress value={task.progress} className="h-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};