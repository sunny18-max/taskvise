import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Users, Target, Clock, BarChart3, Download, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsData {
  totalEmployees: number;
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  totalHours: number;
  productivity: number;
  departmentStats: {
    department: string;
    employeeCount: number;
    projectCount: number;
    taskCount: number;
    productivity: number;
  }[];
  monthlyStats: {
    month: string;
    tasks: number;
    completed: number;
    hours: number;
  }[];
}

export const Analytics = () => {
  const { toast } = useToast();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');

  const getAuthToken = async (): Promise<string | null> => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) return token;
      
      const currentUser = (window as any).firebase?.auth()?.currentUser;
      if (currentUser) {
        const firebaseToken = await currentUser.getIdToken();
        localStorage.setItem('authToken', firebaseToken);
        return firebaseToken;
      }
      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Network request failed');
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch employees
      const employeesResponse = await makeAuthenticatedRequest('http://localhost:3001/api/employees');
      const employeesData = await employeesResponse.json();
      
      // Fetch projects
      const projectsResponse = await makeAuthenticatedRequest('http://localhost:3001/api/projects');
      const projectsData = await projectsResponse.json();
      
      // Fetch tasks
      const tasksResponse = await makeAuthenticatedRequest('http://localhost:3001/api/tasks');
      const tasksData = await tasksResponse.json();

      // Calculate analytics
      const totalEmployees = employeesData.length;
      const totalProjects = projectsData.length;
      const totalTasks = tasksData.length;
      const completedTasks = tasksData.filter((task: any) => task.status === 'completed').length;
      const totalHours = tasksData.reduce((sum: number, task: any) => sum + (task.actualHours || 0), 0);
      const productivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Department stats
      const departmentStats = employeesData.reduce((acc: any[], employee: any) => {
        const dept = employee.department || 'General';
        const existingDept = acc.find(d => d.department === dept);
        
        if (existingDept) {
          existingDept.employeeCount++;
        } else {
          acc.push({
            department: dept,
            employeeCount: 1,
            projectCount: projectsData.filter((p: any) => p.department === dept).length,
            taskCount: tasksData.filter((t: any) => {
              const project = projectsData.find((p: any) => p.id === t.project);
              return project?.department === dept;
            }).length,
            productivity: 0
          });
        }
        return acc;
      }, []);

      // Calculate department productivity
      departmentStats.forEach(dept => {
        const deptTasks = tasksData.filter((t: any) => {
          const project = projectsData.find((p: any) => p.id === t.project);
          return project?.department === dept.department;
        });
        const completedDeptTasks = deptTasks.filter((t: any) => t.status === 'completed').length;
        dept.productivity = deptTasks.length > 0 ? Math.round((completedDeptTasks / deptTasks.length) * 100) : 0;
      });

      // Mock monthly stats (in a real app, you'd fetch this from your backend)
      const monthlyStats = [
        { month: 'Jan', tasks: 45, completed: 38, hours: 120 },
        { month: 'Feb', tasks: 52, completed: 45, hours: 145 },
        { month: 'Mar', tasks: 48, completed: 42, hours: 135 },
        { month: 'Apr', tasks: 55, completed: 48, hours: 160 },
        { month: 'May', tasks: 60, completed: 52, hours: 175 },
        { month: 'Jun', tasks: 58, completed: 50, hours: 168 },
      ];

      setAnalyticsData({
        totalEmployees,
        totalProjects,
        totalTasks,
        completedTasks,
        totalHours,
        productivity,
        departmentStats,
        monthlyStats
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <p className="text-muted-foreground">No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-2">Comprehensive overview of your organization's performance</p>
          </div>
          
          <div className="flex space-x-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                  <p className="text-2xl font-bold">{analyticsData.totalEmployees}</p>
                  <p className="text-xs text-green-600 mt-1">+12% from last month</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                  <p className="text-2xl font-bold">{analyticsData.totalProjects}</p>
                  <p className="text-xs text-green-600 mt-1">+5% from last month</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Task Completion</p>
                  <p className="text-2xl font-bold">{analyticsData.productivity}%</p>
                  <p className="text-xs text-green-600 mt-1">+8% from last month</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                  <p className="text-2xl font-bold">{Math.round(analyticsData.totalHours)}</p>
                  <p className="text-xs text-green-600 mt-1">+15% from last month</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Department Performance */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Department Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.departmentStats.map((dept, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-semibold">{dept.department}</p>
                      <p className="text-sm text-muted-foreground">
                        {dept.employeeCount} employees • {dept.projectCount} projects
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        dept.productivity >= 80 ? 'default' :
                        dept.productivity >= 60 ? 'secondary' : 'outline'
                      }>
                        {dept.productivity}%
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {dept.taskCount} tasks
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Progress */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Monthly Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.monthlyStats.map((month, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{month.month}</span>
                      <span>{month.completed}/{month.tasks} tasks ({Math.round((month.completed/month.tasks)*100)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(month.completed / month.tasks) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{month.hours} hours logged</span>
                      <span>Avg: {Math.round(month.hours / month.tasks)}h/task</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task Distribution */}
        <Card className="border-0 shadow-lg mt-8">
          <CardHeader>
            <CardTitle>Task Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 border rounded-lg">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Completed</h3>
                <p className="text-2xl font-bold text-green-600">{analyticsData.completedTasks}</p>
                <p className="text-sm text-muted-foreground mt-1">Tasks</p>
              </div>
              
              <div className="text-center p-6 border rounded-lg">
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">In Progress</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {analyticsData.totalTasks - analyticsData.completedTasks}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Tasks</p>
              </div>
              
              <div className="text-center p-6 border rounded-lg">
                <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Productivity</h3>
                <p className="text-2xl font-bold text-orange-600">{analyticsData.productivity}%</p>
                <p className="text-sm text-muted-foreground mt-1">Overall Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};