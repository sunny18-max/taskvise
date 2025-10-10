import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Download,
  FileText,
  Users,
  Calendar,
  TrendingUp,
  PieChart
} from 'lucide-react';

interface ReportsViewProps {
  employees: any[];
  leaveRequests: any[];
  attendance: any[];
}

export const ReportsView = ({
  employees,
  leaveRequests,
  attendance
}: ReportsViewProps) => {
  // Calculate department distribution
  const departmentDistribution = employees.reduce((acc, employee) => {
    acc[employee.department] = (acc[employee.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate leave statistics
  const leaveStats = leaveRequests.reduce((acc, leave) => {
    acc[leave.status] = (acc[leave.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate attendance statistics
  const presentCount = attendance.filter(a => a.present).length;
  const absentCount = attendance.filter(a => !a.present).length;
  const lateCount = attendance.filter(a => a.status === 'late').length;
  const totalAttendance = attendance.length;
  const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

  const reports = [
    {
      title: "Employee Directory",
      description: "Complete list of all employees with contact details",
      icon: Users,
      type: "employee"
    },
    {
      title: "Attendance Report",
      description: "Monthly attendance summary and statistics",
      icon: Calendar,
      type: "attendance"
    },
    {
      title: "Leave Analysis",
      description: "Leave requests and approval rates",
      icon: FileText,
      type: "leave"
    },
    {
      title: "Department Overview",
      description: "Employee distribution across departments",
      icon: PieChart,
      type: "department"
    }
  ];

  const generateReport = (type: string) => {
    // In a real application, this would generate and download a report
    console.log(`Generating ${type} report...`);
    // Mock download
    alert(`Downloading ${type} report...`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Reports</h1>
          <p className="text-muted-foreground">
            Generate and download HR reports and analytics
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all departments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">
              Current month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaveStats.pending || 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Hires</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employees.filter(emp => {
                const joinDate = new Date(emp.joinDate);
                const today = new Date();
                return joinDate.getMonth() === today.getMonth() && 
                       joinDate.getFullYear() === today.getFullYear();
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
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
                    onClick={() => generateReport(report.type)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                  <Button variant="outline">
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Analytics Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(departmentDistribution).map(([dept, count]) => {
                const percentage = (count / employees.length) * 100;
                return (
                  <div key={dept} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{dept}</span>
                      <span>{count} employees ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Leave Status */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Request Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(leaveStats).map(([status, count]) => {
                const totalLeaves = leaveRequests.length;
                const percentage = totalLeaves > 0 ? (count / totalLeaves) * 100 : 0;
                let color = 'bg-gray-500';
                if (status === 'approved') color = 'bg-green-500';
                else if (status === 'pending') color = 'bg-yellow-500';
                else if (status === 'rejected') color = 'bg-red-500';
                
                return (
                  <div key={status} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{status}</span>
                      <span>{count} requests ({percentage.toFixed(1)}%)</span>
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

      {/* Attendance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 rounded-lg border">
              <div className="text-2xl font-bold text-green-600">{presentCount}</div>
              <p className="text-sm text-muted-foreground">Present</p>
            </div>
            <div className="text-center p-4 rounded-lg border">
              <div className="text-2xl font-bold text-red-600">{absentCount}</div>
              <p className="text-sm text-muted-foreground">Absent</p>
            </div>
            <div className="text-center p-4 rounded-lg border">
              <div className="text-2xl font-bold text-yellow-600">{lateCount}</div>
              <p className="text-sm text-muted-foreground">Late Arrivals</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};