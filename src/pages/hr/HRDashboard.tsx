import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell,
  Users,
  UserPlus,
  Calendar,
  FileText,
  TrendingUp,
  Menu,
  RefreshCw
} from 'lucide-react';

// Import components
import { HRSidebar } from './HRSidebar';
import { OverviewView } from './views/OverviewView';
import { EmployeesView } from './views/EmployeesView';
import { RecruitmentView } from './views/RecruitmentView';
import { AttendanceView } from './views/AttendanceView';
import { ReportsView } from './views/ReportsView';
import { NotificationsView } from './views/NotificationsView';
import { ProfileView } from './views/ProfileView';
import { AddEmployeeDialog } from './dialogs/AddEmployeeDialog';
import { EmployeeDetailsDialog } from './dialogs/EmployeeDetailsDialog';

// Import types
import type { 
  Employee, 
  LeaveRequest, 
  Attendance,
  Notification,
  DashboardView 
} from './types/hrTypes';

export const HRDashboard = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<DashboardView>('overview');

  // Dialog states
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [employeeDetailsOpen, setEmployeeDetailsOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Get Firebase token for API calls
  const getAuthToken = async (): Promise<string | null> => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        return token;
      }
      
      const currentUser = (window as any).firebase?.auth()?.currentUser;
      if (currentUser) {
        const firebaseToken = await currentUser.getIdToken();
        localStorage.setItem('authToken', firebaseToken);
        return firebaseToken;
      }
      
      if (user) {
        const token = await user.getIdToken();
        localStorage.setItem('authToken', token);
        return token;
      }
      
      console.error('No authentication token found');
      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  // Helper function for authenticated requests
  const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
    try {
      const token = await getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const defaultOptions: RequestInit = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      };

      const response = await fetch(url, {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      return response;
    } catch (error: any) {
      console.error('API request failed:', error);
      throw new Error(error.message || 'Network request failed');
    }
  };

  // Fetch all employees
  const fetchEmployees = async (): Promise<Employee[]> => {
    try {
      const response = await makeAuthenticatedRequest('http://localhost:3001/api/employees');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch employees: ${response.status}`);
      }
      
      const employeesData = await response.json();
      
      if (!employeesData || !Array.isArray(employeesData)) {
        console.log('No employees data found');
        return [];
      }
      
      const transformedEmployees: Employee[] = employeesData.map((emp: any) => ({
        id: emp.id || emp.uid,
        uid: emp.uid || emp.id,
        fullName: emp.fullName || 'Unknown',
        email: emp.email || 'No email',
        phone: emp.phone || 'Not provided',
        designation: emp.designation || emp.role || 'Employee',
        role: emp.role || 'employee',
        department: emp.department || 'General',
        skills: emp.skills || [],
        isActive: emp.isActive !== false,
        onLeave: emp.onLeave || false,
        joinDate: emp.joinDate || new Date().toISOString().split('T')[0],
        lastActive: emp.lastActive || new Date().toISOString(),
        totalTasks: emp.totalTasks || 0,
        completedTasks: emp.completedTasks || 0,
        productivity: emp.productivity || 0,
        totalHours: emp.totalHours || 0
      }));

      return transformedEmployees;
      
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      
      if (error.message.includes('authentication') || error.message.includes('token')) {
        toast({
          title: "Authentication Error",
          description: "Please log in again",
          variant: "destructive",
        });
        localStorage.removeItem('authToken');
        window.location.href = '/auth';
      }
      
      throw error;
    }
  };

  // Fetch leave requests
  const fetchLeaveRequests = async (): Promise<LeaveRequest[]> => {
    try {
      const response = await makeAuthenticatedRequest('http://localhost:3001/api/leave-requests');
      if (response.ok) {
        const leaveData = await response.json();
        return leaveData || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      return [];
    }
  };

  // Fetch attendance data
  const fetchAttendance = async (): Promise<Attendance[]> => {
    try {
      const response = await makeAuthenticatedRequest('http://localhost:3001/api/attendance');
      if (response.ok) {
        const attendanceData = await response.json();
        return attendanceData || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching attendance:', error);
      return [];
    }
  };

  // Fetch notifications
  const fetchNotifications = async (): Promise<Notification[]> => {
    try {
      const response = await makeAuthenticatedRequest(`http://localhost:3001/api/notifications?userId=${user?.uid}`);
      if (response.ok) {
        const notificationsData = await response.json();
        return notificationsData || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  };

  // Fetch all data
  useEffect(() => {
    if (user?.uid) {
      fetchHRData();
    }
  }, [user?.uid]);

  const fetchHRData = async () => {
    try {
      setLoading(true);
      
      const [employeesData, leaveRequestsData, attendanceData, notificationsData] = await Promise.allSettled([
        fetchEmployees(),
        fetchLeaveRequests(),
        fetchAttendance(),
        fetchNotifications()
      ]);

      setEmployees(employeesData.status === 'fulfilled' ? employeesData.value : []);
      setLeaveRequests(leaveRequestsData.status === 'fulfilled' ? leaveRequestsData.value : []);
      setAttendance(attendanceData.status === 'fulfilled' ? attendanceData.value : []);
      setNotifications(notificationsData.status === 'fulfilled' ? notificationsData.value : []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data from server",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Stats calculations
  const stats = {
    totalEmployees: employees.length,
    activeEmployees: employees.filter(emp => emp.isActive).length,
    newHiresThisMonth: employees.filter(emp => {
      const joinDate = new Date(emp.joinDate);
      const today = new Date();
      const thisMonth = today.getMonth();
      const thisYear = today.getFullYear();
      return joinDate.getMonth() === thisMonth && joinDate.getFullYear() === thisYear;
    }).length,
    pendingApprovals: leaveRequests.filter(req => req.status === 'pending').length,
    attendanceRate: attendance.length > 0 ? 
      Math.round((attendance.filter(a => a.present).length / attendance.length) * 100) : 0,
    unreadNotifications: notifications.filter(n => !n.read).length
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await makeAuthenticatedRequest(`http://localhost:3001/api/notifications/${notificationId}`, {
        method: 'PUT',
        body: JSON.stringify({ read: true })
      });

      setNotifications(prev => prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Add new employee function
  const handleAddEmployee = async (employeeData: any) => {
    try {
      const response = await makeAuthenticatedRequest('http://localhost:3001/api/auth/create-employee', {
        method: 'POST',
        body: JSON.stringify(employeeData)
      });

      if (response.ok) {
        const newEmployee = await response.json();
        setEmployees(prev => [...prev, newEmployee.user]);
        toast({
          title: "Employee Added",
          description: "Employee account has been successfully created",
        });
        return true;
      } else {
        const errorText = await response.text();
        let errorMessage = 'Failed to add employee';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error adding employee:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add employee",
        variant: "destructive",
      });
      return false;
    }
  };

  // Handle view employee
  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEmployeeDetailsOpen(true);
  };

  // Main Content based on active view
  const renderMainContent = () => {
    const commonProps = {
      employees,
      leaveRequests,
      attendance,
      notifications,
      stats,
      onAddEmployee: () => setAddEmployeeOpen(true),
      onViewEmployee: handleViewEmployee,
      onMarkNotificationAsRead: markNotificationAsRead,
      onAddEmployee: handleAddEmployee,
      user,
      onRefreshData: fetchHRData
    };

    switch (activeView) {
      case 'employees':
        return <EmployeesView {...commonProps} />;
      case 'recruitment':
        return <RecruitmentView {...commonProps} />;
      case 'attendance':
        return <AttendanceView {...commonProps} />;
      case 'reports':
        return <ReportsView {...commonProps} />;
      case 'notifications':
        return <NotificationsView {...commonProps} />;
      case 'profile':
        return <ProfileView profile={profile} />;
      default:
        return <OverviewView {...commonProps} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-muted-foreground">Loading HR dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <HRSidebar
          sidebarOpen={sidebarOpen}
          activeView={activeView}
          stats={stats}
          profile={profile}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onViewChange={setActiveView}
          onAddEmployee={() => setAddEmployeeOpen(true)}
        />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 z-30">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    HR Manager
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={fetchHRData}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="relative"
                  onClick={() => setActiveView('notifications')}
                >
                  <Bell className="h-5 w-5" />
                  {stats.unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {stats.unreadNotifications}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </header>
          
          {/* Page Content - REMOVED FIXED PADDING */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-6">
              {renderMainContent()}
            </div>
          </main>
        </div>
      </div>

      {/* Dialogs */}
      <AddEmployeeDialog
        open={addEmployeeOpen}
        onOpenChange={setAddEmployeeOpen}
        onEmployeeAdded={handleAddEmployee}
      />

      <EmployeeDetailsDialog
        open={employeeDetailsOpen}
        onOpenChange={setEmployeeDetailsOpen}
        employee={selectedEmployee}
      />
    </div>
  );
};