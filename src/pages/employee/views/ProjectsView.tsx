import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Users, 
  Target, 
  Clock, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp,
  Eye,
  BarChart3,
  User,
  CheckCircle2,
  Clock4
} from 'lucide-react';

interface ProjectsViewProps {
  projects: any[];
  tasks: any[];
  teamMembers?: any[]; // Made optional with default value
}

interface ProjectStats {
  totalHours: number;
  completedHours: number;
  taskDistribution: {
    completed: number;
    inProgress: number;
    pending: number;
    overdue: number;
  };
  memberContributions: {
    memberId: string;
    name: string;
    completedTasks: number;
    totalTasks: number;
    hoursContributed: number;
  }[];
  weeklyProgress: {
    week: string;
    completedTasks: number;
    hours: number;
  }[];
}

export const ProjectsView = ({ projects, tasks, teamMembers = [] }: ProjectsViewProps) => {
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [detailedViewProject, setDetailedViewProject] = useState<string | null>(null);

  const getProjectTasks = (projectId: string) => {
    return tasks.filter(task => task.project === projectId);
  };

  const getProjectProgress = (project: any) => {
    const projectTasks = getProjectTasks(project.id);
    const completedTasks = projectTasks.filter(task => task.status === 'completed').length;
    const totalTasks = projectTasks.length;
    
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  const getTimeRemaining = (deadline: string) => {
    const today = new Date();
    const dueDate = new Date(deadline);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { days: Math.abs(diffDays), status: 'overdue' };
    if (diffDays === 0) return { days: 0, status: 'today' };
    if (diffDays <= 7) return { days: diffDays, status: 'urgent' };
    return { days: diffDays, status: 'normal' };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      case 'today': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'urgent': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'planning': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'in-progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'overdue': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getProjectStats = (projectId: string): ProjectStats => {
    const projectTasks = getProjectTasks(projectId);
    
    // Safe team members filtering with null check
    const projectTeamMembers = Array.isArray(teamMembers) 
      ? teamMembers.filter(member => 
          member?.projects?.includes(projectId)
        )
      : [];

    // Calculate task distribution
    const taskDistribution = {
      completed: projectTasks.filter(task => task.status === 'completed').length,
      inProgress: projectTasks.filter(task => task.status === 'in-progress').length,
      pending: projectTasks.filter(task => task.status === 'pending').length,
      overdue: projectTasks.filter(task => task.status === 'overdue').length,
    };

    // Calculate member contributions with safe access
    const memberContributions = projectTeamMembers.map(member => {
      const memberTasks = projectTasks.filter(task => task.assignedTo === member?.id);
      return {
        memberId: member?.id || 'unknown',
        name: member?.name || 'Unknown Member',
        completedTasks: memberTasks.filter(task => task.status === 'completed').length,
        totalTasks: memberTasks.length,
        hoursContributed: memberTasks
          .filter(task => task.status === 'completed')
          .reduce((sum, task) => sum + (task.estimatedHours || 0), 0)
      };
    });

    // Generate sample weekly progress data
    const weeklyProgress = [
      { week: 'Week 1', completedTasks: Math.floor(Math.random() * 5), hours: Math.floor(Math.random() * 20) },
      { week: 'Week 2', completedTasks: Math.floor(Math.random() * 8), hours: Math.floor(Math.random() * 25) },
      { week: 'Week 3', completedTasks: Math.floor(Math.random() * 10), hours: Math.floor(Math.random() * 30) },
      { week: 'Week 4', completedTasks: Math.floor(Math.random() * 12), hours: Math.floor(Math.random() * 35) },
    ];

    return {
      totalHours: projectTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0),
      completedHours: projectTasks
        .filter(task => task.status === 'completed')
        .reduce((sum, task) => sum + (task.estimatedHours || 0), 0),
      taskDistribution,
      memberContributions,
      weeklyProgress
    };
  };

  const toggleProjectExpand = (projectId: string) => {
    setExpandedProject(expandedProject === projectId ? null : projectId);
  };

  const openDetailedView = (projectId: string) => {
    setDetailedViewProject(projectId);
  };

  const closeDetailedView = () => {
    setDetailedViewProject(null);
  };

  // Detailed Statistics View Component
  const DetailedStatisticsView = ({ project }: { project: any }) => {
    if (!project) return null;
    
    const stats = getProjectStats(project.id);
    const projectTasks = getProjectTasks(project.id);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">{project.name} - Detailed Statistics</h2>
              <Button variant="outline" onClick={closeDetailedView}>
                Close
              </Button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Project Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Project Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{projectTasks.length}</p>
                    <p className="text-sm text-muted-foreground">Total Tasks</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{stats.completedHours}h</p>
                    <p className="text-sm text-muted-foreground">Hours Completed</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{stats.totalHours}h</p>
                    <p className="text-sm text-muted-foreground">Total Hours</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">
                      {stats.totalHours > 0 ? Math.round((stats.completedHours / stats.totalHours) * 100) : 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">Hours Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Task Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Task Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{stats.taskDistribution.completed}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{stats.taskDistribution.inProgress}</p>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-gray-600">{stats.taskDistribution.pending}</p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{stats.taskDistribution.overdue}</p>
                    <p className="text-sm text-muted-foreground">Overdue</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Member Contributions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Contributions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.memberContributions.length > 0 ? (
                    stats.memberContributions.map((member) => (
                      <div key={member.memberId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {member.completedTasks}/{member.totalTasks} tasks
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{member.hoursContributed}h</p>
                          <p className="text-sm text-muted-foreground">contributed</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No team member data available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Weekly Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock4 className="h-5 w-5" />
                  Weekly Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.weeklyProgress.map((week, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium">{week.week}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm">{week.completedTasks} tasks</span>
                        <span className="text-sm">{week.hours}h</span>
                        <Progress 
                          value={(week.completedTasks / Math.max(...stats.weeklyProgress.map(w => w.completedTasks), 1)) * 100} 
                          className="w-24 h-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gradient">My Projects</h1>
        <p className="text-muted-foreground">Track progress on your assigned projects</p>
      </div>

      {/* Project Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold">{projects.length}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Tasks</p>
                <p className="text-2xl font-bold">
                  {tasks.filter(t => t.status === 'in-progress').length}
                </p>
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
                <p className="text-sm font-medium text-muted-foreground">Completed Tasks</p>
                <p className="text-2xl font-bold">
                  {tasks.filter(t => t.status === 'completed').length}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Progress</p>
                <p className="text-2xl font-bold">
                  {projects.length > 0 
                    ? Math.round(projects.reduce((sum, project) => sum + getProjectProgress(project), 0) / projects.length)
                    : 0
                  }%
                </p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Dropdown View */}
      <div className="space-y-4">
        {projects.map((project) => {
          const projectTasks = getProjectTasks(project.id);
          const completedTasks = projectTasks.filter(task => task.status === 'completed').length;
          const totalTasks = projectTasks.length;
          const progress = getProjectProgress(project);
          const timeRemaining = getTimeRemaining(project.deadline);
          const isExpanded = expandedProject === project.id;

          return (
            <Card key={project.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4 cursor-pointer" onClick={() => toggleProjectExpand(project.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetailedView(project.id);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={getProjectStatusColor(project.status)}>
                        {project.status.replace('-', ' ')}
                      </Badge>
                      <Badge className={getStatusColor(timeRemaining.status)}>
                        {timeRemaining.status === 'overdue' ? 'Overdue' : 
                         timeRemaining.status === 'today' ? 'Due Today' :
                         timeRemaining.status === 'urgent' ? `${timeRemaining.days}d` : 
                         `${timeRemaining.days}d`}
                      </Badge>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground ml-9">
                  {project.description || 'No description available'}
                </p>
                
                {/* Progress Bar always visible */}
                <div className="ml-9 mt-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Overall Progress</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </CardHeader>

              {/* Expandable Content */}
              {isExpanded && (
                <CardContent className="border-t pt-4 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center p-3 border rounded-lg">
                      <p className="text-muted-foreground">Tasks</p>
                      <p className="font-medium text-lg">{completedTasks}/{totalTasks}</p>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <p className="text-muted-foreground">Team Size</p>
                      <p className="font-medium text-lg">{project.teamMembers?.length || 1}</p>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <p className="text-muted-foreground">Deadline</p>
                      <p className="font-medium text-lg">{new Date(project.deadline).toLocaleDateString()}</p>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <p className="text-muted-foreground">Hours</p>
                      <p className="font-medium text-lg">
                        {Math.round(project.completedHours || 0)}/{Math.round(project.totalHours || 0)}h
                      </p>
                    </div>
                  </div>

                  {/* Project Tasks */}
                  {projectTasks.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-3">Project Tasks</p>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {projectTasks.map((task) => (
                          <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3 flex-1">
                              <span className="truncate">{task.title}</span>
                              {task.assignedTo && (
                                <Badge variant="outline" className="text-xs">
                                  {Array.isArray(teamMembers) 
                                    ? teamMembers.find(m => m.id === task.assignedTo)?.name || 'Unassigned'
                                    : 'Unassigned'
                                  }
                                </Badge>
                              )}
                            </div>
                            <Badge 
                              variant="outline" 
                              className={getTaskStatusColor(task.status)}
                            >
                              {task.status.replace('-', ' ')}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}

        {projects.length === 0 && (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No projects assigned</p>
                <p className="text-sm">You haven't been assigned to any projects yet.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detailed Statistics Modal */}
      {detailedViewProject && (
        <DetailedStatisticsView 
          project={projects.find(p => p.id === detailedViewProject)} 
        />
      )}
    </div>
  );
};