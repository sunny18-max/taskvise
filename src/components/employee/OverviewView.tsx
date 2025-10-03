import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckSquare, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  Target
} from 'lucide-react';

interface OverviewViewProps {
  profile: any;
  stats: any;
  tasks: any[];
  projects: any[];
}

export const OverviewView = ({ profile, stats, tasks, projects }: OverviewViewProps) => {
  const recentTasks = tasks.slice(0, 5);
  const activeProjects = projects.filter(project => 
    project.status === 'active' || project.status === 'planning'
  ).slice(0, 3);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gradient">Employee Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {profile?.fullName || 'Employee'}! Here's your work overview.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold">{stats.totalTasks}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {stats.completedTasks} completed
                  </Badge>
                </div>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckSquare className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hours Worked</p>
                <p className="text-2xl font-bold">{Math.round(stats.totalHours * 10) / 10}h</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">
                    {stats.estimatedHours}h estimated
                  </Badge>
                </div>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Productivity</p>
                <p className="text-2xl font-bold">{stats.productivity}%</p>
                <Progress value={stats.productivity} className="h-2 mt-2" />
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold">{projects.filter(p => p.status === 'active').length}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    {stats.overdueTasks} overdue
                  </Badge>
                </div>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Recent Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTasks.length > 0 ? (
                recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.project || 'No Project'}</p>
                    </div>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status.replace('-', ' ')}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No tasks assigned yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Projects */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeProjects.length > 0 ? (
                activeProjects.map((project) => (
                  <div key={project.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-sm">{project.name}</p>
                      <Badge variant="outline">
                        {project.completedTasks || 0}/{project.totalTasks || 0} tasks
                      </Badge>
                    </div>
                    <Progress value={project.progress || 0} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>Progress</span>
                      <span>{project.progress || 0}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No active projects assigned yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};