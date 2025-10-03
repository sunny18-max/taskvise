import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Task {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  progress: number;
  assignee: string;
  priority: 'low' | 'medium' | 'high';
  status: 'not_started' | 'in_progress' | 'completed';
}

interface GanttChartProps {
  tasks: Task[];
  title: string;
}

export const GanttChart = ({ tasks, title }: GanttChartProps) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'in_progress':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card className="card-professional border-0 shadow-lg hover-lift">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-gradient-primary"></div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="p-4 bg-muted/20 rounded-lg border">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{task.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {task.startDate} - {task.endDate}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Assigned to: {task.assignee}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge
                    variant="outline"
                    className={`text-xs ${getPriorityColor(task.priority)} text-white border-0`}
                  >
                    {task.priority}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {task.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Progress</span>
                  <span className="text-xs font-medium">{task.progress}%</span>
                </div>
                <Progress value={task.progress} className="h-2" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};