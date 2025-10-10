import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  UserPlus, 
  Calendar, 
  FileText, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface OverviewViewProps {
  employees: any[];
  leaveRequests: any[];
  attendance: any[];
  notifications: any[];
  stats: any;
  onAddEmployee: () => void;
  onViewEmployee: (employee: any) => void;
}

export const OverviewView = ({
  employees,
  leaveRequests,
  attendance,
  notifications,
  stats,
  onAddEmployee,
  onViewEmployee
}: OverviewViewProps) => {
  const recentEmployees = employees.slice(0, 5);
  const pendingLeaves = leaveRequests.filter(leave => leave.status === 'pending').slice(0, 5);

  const statsCards = [
    {
      label: "Total Employees",
      value: stats.totalEmployees.toString(),
      icon: Users,
      color: "bg-blue-500",
      description: `${stats.activeEmployees} active`
    },
    {
      label: "New Hires This Month",
      value: stats.newHiresThisMonth.toString(),
      icon: UserPlus,
      color: "bg-green-500",
      description: "Recent additions"
    },
    {
      label: "Pending Approvals",
      value: stats.pendingApprovals.toString(),
      icon: FileText,
      color: "bg-yellow-500",
      description: "Leave requests"
    },
    {
      label: "Attendance Rate",
      value: `${stats.attendanceRate}%`,
      icon: TrendingUp,
      color: "bg-purple-500",
      description: "This month"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Overview</h1>
          <p className="text-muted-foreground">
            Manage employees, attendance, and HR operations
          </p>
        </div>
        <Button onClick={onAddEmployee}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Employees */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEmployees.map((employee) => (
                <div 
                  key={employee.id} 
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                  onClick={() => onViewEmployee(employee)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {employee.fullName.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{employee.fullName}</p>
                      <p className="text-xs text-muted-foreground">{employee.designation}</p>
                    </div>
                  </div>
                  <Badge variant={employee.isActive ? "default" : "secondary"}>
                    {employee.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
              {recentEmployees.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No employees found
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Leave Requests */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Pending Leave Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingLeaves.map((leave) => (
                <div key={leave.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{leave.employeeName}</p>
                    <p className="text-xs text-muted-foreground">
                      {leave.type} • {leave.duration} days
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                    Pending
                  </Badge>
                </div>
              ))}
              {pendingLeaves.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No pending leave requests
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" onClick={onAddEmployee}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add New Employee
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Generate Payroll
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="mr-2 h-4 w-4" />
              Manage Attendance
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <TrendingUp className="mr-2 h-4 w-4" />
              View Reports
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center gap-3 p-4 rounded-lg border">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{attendance.filter(a => a.present).length}</p>
                <p className="text-sm text-muted-foreground">Present</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg border">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{attendance.filter(a => !a.present).length}</p>
                <p className="text-sm text-muted-foreground">Absent</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg border">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{attendance.filter(a => a.status === 'late').length}</p>
                <p className="text-sm text-muted-foreground">Late</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg border">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.attendanceRate}%</p>
                <p className="text-sm text-muted-foreground">Overall Rate</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};