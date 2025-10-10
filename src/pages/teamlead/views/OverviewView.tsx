import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Target, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  TrendingUp,
  Calendar
} from 'lucide-react';

interface OverviewViewProps {
  tasks: any[];
  teamMembers: any[];
  projects: any[];
  notifications: any[];
  stats: any;
  onAssignTask: () => void;
  onCreateProject: () => void;
  onViewTeamMember: (member: any) => void;
  onManageTeam: () => void;
  onScheduleMeeting: () => void;
}

export const OverviewView = ({
  tasks,
  teamMembers,
  projects,
  notifications,
  stats,
  onAssignTask,
  onCreateProject,
  onViewTeamMember,
  onManageTeam,
  onScheduleMeeting
}: OverviewViewProps) => {
  // Filter out admins, managers, HR, and team leads
  const filteredTeamMembers = teamMembers.filter(member => {
    const role = member.role?.toLowerCase() || member.designation?.toLowerCase() || '';
    return role !== 'admin' && 
           role !== 'manager' && 
           role !== 'hr' && 
           role !== 'team lead' &&
           role !== 'teamlead';
  });

  const recentTasks = tasks.slice(0, 5);
  const activeProjects = projects.filter(p => p.status === 'active').slice(0, 3);
  const topPerformers = [...filteredTeamMembers]
    .sort((a, b) => (b.productivity || 0) - (a.productivity || 0))
    .slice(0, 3);

  const statsCards = [
    {
      label: "Team Members",
      value: filteredTeamMembers.length.toString(),
      icon: Users,
      color: "bg-blue-500",
      description: `${filteredTeamMembers.filter(m => m.isActive && !m.onLeave).length} active`
    },
    {
      label: "Active Projects",
      value: stats.activeProjects.toString(),
      icon: Target,
      color: "bg-green-500",
      description: `${stats.totalProjects} total`
    },
    {
      label: "Completed Tasks",
      value: stats.completedTasks.toString(),
      icon: CheckCircle,
      color: "bg-purple-500",
      description: `${stats.totalTasks} total`
    },
    {
      label: "Overdue Tasks",
      value: stats.overdueTasks.toString(),
      icon: Clock,
      color: "bg-yellow-500",
      description: "Need attention"
    }
  ];

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800"
    };
    return variants[priority as keyof typeof variants] || variants.medium;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800",
      'in-progress': "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      overdue: "bg-red-100 text-red-800"
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Overview</h1>
          <p className="text-muted-foreground">
            Manage your team and track project progress
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onAssignTask}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Assign Task
          </Button>
          <Button onClick={onCreateProject} variant="outline">
            <Target className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.label}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color.replace('bg-', 'text-')}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Recent Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{task.title}</p>
                      <Badge className={getPriorityBadge(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Assigned to: {task.assignedToName}</span>
                      <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Badge className={getStatusBadge(task.status)}>
                    {task.status}
                  </Badge>
                </div>
              ))}
              {recentTasks.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No tasks assigned yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeProjects.map((project) => (
                <div key={project.id} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{project.name}</h4>
                    <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                      {project.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {project.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{project.completedTasks}/{project.totalTasks} tasks</span>
                      <span>Due: {new Date(project.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
              {activeProjects.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No active projects
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Team Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Team Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredTeamMembers.map((member) => (
                <div 
                  key={member.id} 
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                  onClick={() => onViewTeamMember(member)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {member.fullName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium">{member.fullName}</p>
                      <p className="text-sm text-muted-foreground">{member.designation}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{member.completedTasks}/{member.totalTasks}</span>
                      <span className="text-sm text-muted-foreground">tasks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={member.productivity} className="w-20 h-2" />
                      <span className="text-xs text-muted-foreground">{member.productivity}%</span>
                    </div>
                  </div>
                </div>
              ))}
              {filteredTeamMembers.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No team members found
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Top Performers */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" onClick={onAssignTask}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Assign New Task
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={onCreateProject}>
                <Target className="mr-2 h-4 w-4" />
                Create Project
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={onManageTeam}>
                <Users className="mr-2 h-4 w-4" />
                Manage Team
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={onScheduleMeeting}>
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Meeting
              </Button>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPerformers.map((member, index) => (
                  <div 
                    key={member.id} 
                    className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer"
                    onClick={() => onViewTeamMember(member)}
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{member.fullName}</p>
                      <p className="text-xs text-muted-foreground">{member.productivity}% productivity</p>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {member.completedTasks} tasks
                    </Badge>
                  </div>
                ))}
                {topPerformers.length === 0 && (
                  <p className="text-center text-muted-foreground py-2 text-sm">
                    No performance data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};