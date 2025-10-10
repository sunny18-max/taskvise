import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Download,
  FileText,
  Users,
  Target,
  CheckCircle,
  TrendingUp,
  Calendar,
  BarChart3,
  PieChart,
  BarChart
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface ReportsViewProps {
  tasks: any[];
  teamMembers: any[];
  projects: any[];
  stats: any;
}

export const ReportsView = ({
  tasks,
  teamMembers,
  projects,
  stats
}: ReportsViewProps) => {
  // Filter out admins, managers, HR, and team leads
  const filteredTeamMembers = teamMembers.filter(member => {
    const role = member.role?.toLowerCase() || member.designation?.toLowerCase() || '';
    return role !== 'admin' && 
           role !== 'manager' && 
           role !== 'hr' && 
           role !== 'team lead' &&
           role !== 'teamlead';
  });

  // Calculate task distribution by status
  const taskStatusDistribution = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate project distribution by status
  const projectStatusDistribution = projects.reduce((acc, project) => {
    acc[project.status] = (acc[project.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate team performance metrics
  const teamPerformance = filteredTeamMembers.map(member => ({
    name: member.fullName,
    role: member.role || member.designation,
    productivity: member.productivity || 0,
    completedTasks: member.completedTasks || 0,
    totalTasks: member.totalTasks || 0,
    completionRate: member.totalTasks > 0 ? Math.round((member.completedTasks / member.totalTasks) * 100) : 0,
    totalHours: member.totalHours || 0
  }));

  const reports = [
    {
      title: "Team Performance Report",
      description: "Detailed analysis of team member productivity and task completion",
      icon: Users,
      type: "team-performance"
    },
    {
      title: "Project Progress Report",
      description: "Comprehensive overview of all projects and their status",
      icon: Target,
      type: "project-progress"
    },
    {
      title: "Task Completion Report",
      description: "Analysis of task completion rates and timelines",
      icon: CheckCircle,
      type: "task-completion"
    },
    {
      title: "Weekly Summary",
      description: "Weekly overview of team activities and achievements",
      icon: Calendar,
      type: "weekly-summary"
    }
  ];

  const generatePDFReport = (type: string) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const currentDate = new Date().toLocaleDateString();

    // Add header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text(`${type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Report`, pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${currentDate}`, pageWidth / 2, 28, { align: 'center' });

    let yPosition = 40;

    switch (type) {
      case 'team-performance':
        generateTeamPerformanceReport(doc, yPosition);
        break;
      case 'project-progress':
        generateProjectProgressReport(doc, yPosition);
        break;
      case 'task-completion':
        generateTaskCompletionReport(doc, yPosition);
        break;
      case 'weekly-summary':
        generateWeeklySummaryReport(doc, yPosition);
        break;
    }

    doc.save(`${type}-report-${currentDate}.pdf`);
  };

  const generateTeamPerformanceReport = (doc: jsPDF, startY: number) => {
    let yPosition = startY;

    // Team Statistics
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('Team Performance Overview', 14, yPosition);
    yPosition += 10;

    const teamStats = [
      ['Total Team Members', filteredTeamMembers.length.toString()],
      ['Average Productivity', `${Math.round(filteredTeamMembers.reduce((sum, m) => sum + (m.productivity || 0), 0) / filteredTeamMembers.length)}%`],
      ['Total Tasks Completed', filteredTeamMembers.reduce((sum, m) => sum + (m.completedTasks || 0), 0).toString()],
      ['Total Hours Worked', Math.round(filteredTeamMembers.reduce((sum, m) => sum + (m.totalHours || 0), 0)).toString()]
    ];

    (doc as any).autoTable({
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: teamStats,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 10 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Individual Performance Table
    doc.setFontSize(16);
    doc.text('Individual Performance Details', 14, yPosition);
    yPosition += 10;

    const performanceData = teamPerformance.map(member => [
      member.name,
      member.role,
      `${member.productivity}%`,
      `${member.completedTasks}/${member.totalTasks}`,
      `${member.completionRate}%`,
      `${member.totalHours}h`
    ]);

    (doc as any).autoTable({
      startY: yPosition,
      head: [['Name', 'Role', 'Productivity', 'Tasks', 'Completion Rate', 'Hours']],
      body: performanceData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9 }
    });
  };

  const generateProjectProgressReport = (doc: jsPDF, startY: number) => {
    let yPosition = startY;

    // Project Statistics
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('Project Progress Overview', 14, yPosition);
    yPosition += 10;

    const projectStats = [
      ['Total Projects', projects.length.toString()],
      ['Active Projects', projects.filter(p => p.status === 'active').length.toString()],
      ['Completed Projects', projects.filter(p => p.status === 'completed').length.toString()],
      ['Average Progress', `${Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)}%`]
    ];

    (doc as any).autoTable({
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: projectStats,
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] },
      styles: { fontSize: 10 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Project Details Table
    doc.setFontSize(16);
    doc.text('Project Details', 14, yPosition);
    yPosition += 10;

    const projectData = projects.map(project => [
      project.name,
      project.status.charAt(0).toUpperCase() + project.status.slice(1),
      `${project.progress || 0}%`,
      `${project.completedTasks || 0}/${project.totalTasks || 0}`,
      project.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/A',
      project.teamMembers?.length || 0
    ]);

    (doc as any).autoTable({
      startY: yPosition,
      head: [['Project Name', 'Status', 'Progress', 'Tasks', 'Deadline', 'Team Size']],
      body: projectData,
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] },
      styles: { fontSize: 9 }
    });
  };

  const generateTaskCompletionReport = (doc: jsPDF, startY: number) => {
    let yPosition = startY;

    // Task Statistics
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('Task Completion Overview', 14, yPosition);
    yPosition += 10;

    const taskStats = [
      ['Total Tasks', tasks.length.toString()],
      ['Completed Tasks', tasks.filter(t => t.status === 'completed').length.toString()],
      ['In Progress', tasks.filter(t => t.status === 'in-progress').length.toString()],
      ['Overdue Tasks', tasks.filter(t => t.status === 'overdue').length.toString()],
      ['Completion Rate', `${Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)}%`]
    ];

    (doc as any).autoTable({
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: taskStats,
      theme: 'grid',
      headStyles: { fillColor: [168, 85, 247] },
      styles: { fontSize: 10 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Task Distribution Chart Data
    doc.setFontSize(16);
    doc.text('Task Distribution by Status', 14, yPosition);
    yPosition += 10;

    const taskDistributionData = Object.entries(taskStatusDistribution).map(([status, count]) => [
      status.charAt(0).toUpperCase() + status.slice(1),
      count.toString(),
      `${((count / tasks.length) * 100).toFixed(1)}%`
    ]);

    (doc as any).autoTable({
      startY: yPosition,
      head: [['Status', 'Count', 'Percentage']],
      body: taskDistributionData,
      theme: 'grid',
      headStyles: { fillColor: [168, 85, 247] },
      styles: { fontSize: 10 }
    });
  };

  const generateWeeklySummaryReport = (doc: jsPDF, startY: number) => {
    let yPosition = startY;

    // Weekly Summary
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('Weekly Performance Summary', 14, yPosition);
    yPosition += 10;

    const weeklyStats = [
      ['Team Productivity', `${stats.productivity}%`],
      ['Tasks Completed This Week', stats.weeklyCompletedTasks || '25'],
      ['New Tasks Assigned', stats.weeklyNewTasks || '18'],
      ['Active Team Members', filteredTeamMembers.filter(m => m.isActive && !m.onLeave).length.toString()],
      ['Projects Updated', stats.weeklyUpdatedProjects || '8']
    ];

    (doc as any).autoTable({
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: weeklyStats,
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11] },
      styles: { fontSize: 10 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Top Performers
    doc.setFontSize(16);
    doc.text('Top Performers This Week', 14, yPosition);
    yPosition += 10;

    const topPerformers = [...filteredTeamMembers]
      .sort((a, b) => (b.productivity || 0) - (a.productivity || 0))
      .slice(0, 5)
      .map(member => [
        member.fullName,
        member.role || member.designation,
        `${member.productivity}%`,
        member.completedTasks.toString()
      ]);

    (doc as any).autoTable({
      startY: yPosition,
      head: [['Name', 'Role', 'Productivity', 'Tasks Completed']],
      body: topPerformers,
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11] },
      styles: { fontSize: 10 }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Generate reports and analyze team performance
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Productivity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.productivity}%</div>
            <p className="text-xs text-muted-foreground">
              Average team productivity
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((stats.completedTasks / stats.totalTasks) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.completedTasks}/{stats.totalTasks} tasks
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalProjects} total projects
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Hours</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.totalHours)}</div>
            <p className="text-xs text-muted-foreground">
              Total hours worked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Available Reports */}
      <div className="grid gap-6 md:grid-cols-2">
        {reports.map((report, index) => {
          const Icon = report.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {report.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {report.description}
                </p>
                <div className="flex gap-2">
                  <Button 
                    className="flex-1"
                    onClick={() => generatePDFReport(report.type)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                  <Button variant="outline" onClick={() => generatePDFReport(report.type)}>
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Analytics Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Task Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Task Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(taskStatusDistribution).map(([status, count]) => {
                const percentage = (count / tasks.length) * 100;
                let color = 'bg-gray-500';
                if (status === 'completed') color = 'bg-green-500';
                else if (status === 'in-progress') color = 'bg-blue-500';
                else if (status === 'pending') color = 'bg-yellow-500';
                else if (status === 'overdue') color = 'bg-red-500';
                
                return (
                  <div key={status} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{status.replace('-', ' ')}</span>
                      <span>{count} tasks ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`${color} h-2 rounded-full`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Project Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Project Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(projectStatusDistribution).map(([status, count]) => {
                const percentage = (count / projects.length) * 100;
                let color = 'bg-gray-500';
                if (status === 'active') color = 'bg-green-500';
                else if (status === 'planning') color = 'bg-blue-500';
                else if (status === 'on-hold') color = 'bg-yellow-500';
                else if (status === 'completed') color = 'bg-purple-500';
                
                return (
                  <div key={status} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{status.replace('-', ' ')}</span>
                      <span>{count} projects ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`${color} h-2 rounded-full`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamPerformance.map((member, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {member.completedTasks}/{member.totalTasks} tasks completed
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Progress value={member.completionRate} className="w-24 h-2" />
                    <span className="text-sm font-medium">{member.completionRate}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {member.productivity}% productivity
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center p-4 rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">
                {filteredTeamMembers.length}
              </div>
              <p className="text-sm text-muted-foreground">Team Members</p>
            </div>
            <div className="text-center p-4 rounded-lg border">
              <div className="text-2xl font-bold text-green-600">
                {tasks.filter(t => t.status === 'completed').length}
              </div>
              <p className="text-sm text-muted-foreground">Tasks Completed</p>
            </div>
            <div className="text-center p-4 rounded-lg border">
              <div className="text-2xl font-bold text-purple-600">
                {projects.filter(p => p.status === 'completed').length}
              </div>
              <p className="text-sm text-muted-foreground">Projects Completed</p>
            </div>
            <div className="text-center p-4 rounded-lg border">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(stats.totalHours)}
              </div>
              <p className="text-sm text-muted-foreground">Total Hours</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};