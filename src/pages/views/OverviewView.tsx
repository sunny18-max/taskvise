// views/OverviewView.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Target, 
  FileText, 
  TrendingUp 
} from 'lucide-react';
import type { Task, Employee, Stats } from '../types/managerTypes';

interface OverviewViewProps {
  tasks: Task[];
  employees: Employee[];
  stats: Stats;
}

export const OverviewView = ({ tasks, employees, stats }: OverviewViewProps) => (
  <>
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gradient">Manager Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome back! Here's your team overview.
      </p>
    </div>

    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
              <h3 className="text-2xl font-bold">{stats.totalEmployees}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {stats.activeEmployees} active
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
              <h3 className="text-2xl font-bold">{stats.totalProjects}</h3>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Target className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {stats.activeProjects} active
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
              <h3 className="text-2xl font-bold">{stats.totalTasks}</h3>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2">
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              {stats.overdueTasks} overdue
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Team Productivity</p>
              <h3 className="text-2xl font-bold">{stats.productivity}%</h3>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-2">
            <Progress value={stats.productivity} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Recent Activity */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Recent Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Assigned to: {task.assignedToName}
                  </p>
                </div>
                <Badge variant={
                  task.status === 'completed' ? 'default' :
                  task.status === 'in-progress' ? 'secondary' :
                  task.status === 'overdue' ? 'destructive' : 'outline'
                }>
                  {task.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employees.slice(0, 5).map((employee) => (
              <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    {employee.fullName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{employee.fullName}</p>
                    <p className="text-xs text-muted-foreground">{employee.department}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">{employee.productivity}%</p>
                  <p className="text-xs text-muted-foreground">
                    {employee.completedTasks}/{employee.totalTasks} tasks
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </>
);