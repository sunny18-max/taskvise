import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Search, 
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface AttendanceViewProps {
  attendance: any[];
}

export const AttendanceView = ({ attendance }: AttendanceViewProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const filteredAttendance = attendance.filter(record => {
    const matchesSearch = record.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || record.date === dateFilter;
    return matchesSearch && matchesDate;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800">Present</Badge>;
      case 'absent':
        return <Badge variant="destructive">Absent</Badge>;
      case 'late':
        return <Badge className="bg-yellow-100 text-yellow-800">Late</Badge>;
      case 'half-day':
        return <Badge className="bg-blue-100 text-blue-800">Half Day</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'late':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  // Calculate summary statistics
  const presentCount = attendance.filter(a => a.present).length;
  const absentCount = attendance.filter(a => !a.present).length;
  const lateCount = attendance.filter(a => a.status === 'late').length;
  const totalRecords = attendance.length;
  const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
          <p className="text-muted-foreground">
            Track and manage employee attendance
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">
              Overall attendance rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{presentCount}</div>
            <p className="text-xs text-muted-foreground">
              Employees present
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{absentCount}</div>
            <p className="text-xs text-muted-foreground">
              Employees absent
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lateCount}</div>
            <p className="text-xs text-muted-foreground">
              Late arrivals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-40"
              />
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-12 gap-4 p-4 font-semibold border-b bg-muted/50">
              <div className="col-span-3">Employee</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-2">Check In</div>
              <div className="col-span-2">Check Out</div>
              <div className="col-span-2">Hours</div>
              <div className="col-span-1">Status</div>
            </div>
            <div className="divide-y">
              {filteredAttendance.map((record) => (
                <div key={record.id} className="grid grid-cols-12 gap-4 p-4 items-center">
                  <div className="col-span-3 font-medium">{record.employeeName}</div>
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {new Date(record.date).toLocaleDateString()}
                  </div>
                  <div className="col-span-2 text-sm">
                    {record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '--:--'}
                  </div>
                  <div className="col-span-2 text-sm">
                    {record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '--:--'}
                  </div>
                  <div className="col-span-2 text-sm">
                    {record.hoursWorked ? `${record.hoursWorked}h` : '--'}
                  </div>
                  <div className="col-span-1">
                    {getStatusBadge(record.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {filteredAttendance.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No attendance records found</h3>
              <p className="text-muted-foreground">
                {searchTerm || dateFilter 
                  ? 'Try adjusting your search criteria' 
                  : 'No attendance data available for the selected period'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">January 2024</span>
              <span className="text-sm text-muted-foreground">{attendanceRate}% attendance rate</span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 31 }, (_, i) => {
                const day = i + 1;
                const dayAttendance = attendance.filter(a => {
                  const date = new Date(a.date);
                  return date.getDate() === day && date.getMonth() === 0; // January
                });
                
                const presentCount = dayAttendance.filter(a => a.present).length;
                const totalCount = dayAttendance.length;
                const rate = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;
                
                let bgColor = 'bg-gray-100';
                if (rate > 80) bgColor = 'bg-green-500';
                else if (rate > 60) bgColor = 'bg-yellow-500';
                else if (rate > 0) bgColor = 'bg-red-500';
                
                return (
                  <div key={day} className="text-center">
                    <div className={`h-8 rounded ${bgColor} mb-1`}></div>
                    <span className="text-xs">{day}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>80-100%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>60-79%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>0-59%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-100 rounded"></div>
                <span>No data</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};