// EmployeeDashboard.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { EmployeeSidebar } from '../components/employee/EmployeeSidebar';
import { EmployeeHeader } from '../components/employee/EmployeeHeader';
import { OverviewView } from '../components/employee/OverviewView';
import { TasksView } from '../components/employee/TasksView';
import { ProjectsView } from '../components/employee/ProjectsView';
import { TimeTrackingView } from '../components/employee/TimeTrackingView';
import { LeaveManagementView } from '../components/employee/LeaveManagementView';
import { ReportsView } from '../components/employee/ReportsView';
import { NotificationsView } from '../components/employee/NotificationsView';
import { ProfileView } from '../components/employee/ProfileView';

// Import types and interfaces
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  assignedBy: string;
  assignedByName: string;
  project: string;
  area: string;
  estimatedHours: number;
  actualHours: number;
  completedAt?: string;
  screenshot?: string;
  createdAt: string;
  assignedTo: string;
  assignedToName: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  progress: number;
  deadline: string;
  totalTasks: number;
  completedTasks: number;
  totalHours: number;
  completedHours: number;
  teamMembers: string[];
  teamMemberNames: string[];
  status: 'planning' | 'active' | 'completed' | 'on-hold';
  createdAt: string;
  updatedAt: string;
}

interface WorkSession {
  id: string;
  taskId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  date: string;
  userId: string;
  employeeName: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'task_assigned' | 'task_updated' | 'project_update' | 'system' | 'task_completed' | 'project_assigned';
  read: boolean;
  createdAt: string;
  userId: string;
  taskId?: string;
  projectId?: string;
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  type: 'sick' | 'vacation' | 'personal' | 'emergency' | 'other';
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  duration: number;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  comments?: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  projects: string[];
  department: string;
  avatar?: string;
}

type DashboardView = 'overview' | 'tasks' | 'projects' | 'time' | 'reports' | 'profile' | 'notifications' | 'leave';

export const EmployeeDashboard = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<DashboardView>('overview');
  const [openSections, setOpenSections] = useState({
    tasks: true,
    projects: true,
    tools: true
  });

  // Timer state
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [timerStart, setTimerStart] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Task state
  const [taskFilters, setTaskFilters] = useState({
    status: 'all',
    priority: 'all',
    project: 'all'
  });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDetailsOpen, setTaskDetailsOpen] = useState(false);

  // API base URL - Fixed for Vite environment
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  // Enhanced API helper function with better error handling
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  };

  // Calculate filtered tasks
  const filteredTasks = tasks.filter(task => {
    if (taskFilters.status !== 'all' && task.status !== taskFilters.status) return false;
    if (taskFilters.priority !== 'all' && task.priority !== taskFilters.priority) return false;
    if (taskFilters.project !== 'all' && task.project !== taskFilters.project) return false;
    return true;
  });

  // Calculate stats - Updated to include leave requests
  const stats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(task => task.status === 'completed').length,
    pendingTasks: tasks.filter(task => task.status === 'pending').length,
    overdueTasks: tasks.filter(task => task.status === 'overdue').length,
    inProgressTasks: tasks.filter(task => task.status === 'in-progress').length,
    totalHours: tasks.reduce((sum, task) => sum + (task.actualHours || 0), 0),
    estimatedHours: tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0),
    productivity: tasks.length > 0 ? 
      Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0,
    unreadNotifications: notifications.filter(n => !n.read).length,
    pendingLeaveRequests: leaveRequests.filter(req => req.status === 'pending').length,
    approvedLeaveRequests: leaveRequests.filter(req => req.status === 'approved').length,
    totalLeaveRequests: leaveRequests.length
  };

  // Enhanced data fetching functions with proper error handling
  const fetchTasks = async () => {
    try {
      console.log('Fetching tasks from API...');
      
      // Try multiple possible endpoints
      let data;
      try {
        data = await apiCall(`/tasks/employee/${user?.uid}`);
      } catch (error) {
        console.log('Trying alternative task endpoint...');
        data = await apiCall(`/tasks?employeeId=${user?.uid}`);
      }
      
      if (Array.isArray(data)) {
        setTasks(data);
      } else if (data && data.tasks) {
        setTasks(data.tasks);
      } else if (data && data.data) {
        setTasks(data.data);
      } else {
        console.log('No tasks data found, using empty array');
        setTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    }
  };

  const fetchProjects = async () => {
    try {
      console.log('Fetching projects from API...');
      
      // Try multiple possible endpoints
      let data;
      try {
        data = await apiCall(`/projects/employee/${user?.uid}`);
      } catch (error) {
        console.log('Trying alternative project endpoint...');
        data = await apiCall(`/projects?employeeId=${user?.uid}`);
      }
      
      if (Array.isArray(data)) {
        setProjects(data);
      } else if (data && data.projects) {
        setProjects(data.projects);
      } else if (data && data.data) {
        setProjects(data.data);
      } else {
        console.log('No projects data found, using empty array');
        setProjects([]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    }
  };

  const fetchWorkSessions = async () => {
    try {
      console.log('Fetching work sessions from API...');
      
      let data;
      try {
        data = await apiCall(`/work-sessions/employee/${user?.uid}`);
      } catch (error) {
        console.log('Trying alternative work sessions endpoint...');
        data = await apiCall(`/work-sessions?employeeId=${user?.uid}`);
      }
      
      if (Array.isArray(data)) {
        setWorkSessions(data);
      } else if (data && data.sessions) {
        setWorkSessions(data.sessions);
      } else if (data && data.data) {
        setWorkSessions(data.data);
      } else {
        console.log('No work sessions data found, using empty array');
        setWorkSessions([]);
      }
    } catch (error) {
      console.error('Error fetching work sessions:', error);
      setWorkSessions([]);
    }
  };

  const fetchNotifications = async () => {
    try {
      console.log('Fetching notifications from API...');
      
      let data;
      try {
        data = await apiCall(`/notifications/employee/${user?.uid}`);
      } catch (error) {
        console.log('Trying alternative notifications endpoint...');
        data = await apiCall(`/notifications?employeeId=${user?.uid}`);
      }
      
      if (Array.isArray(data)) {
        setNotifications(data);
      } else if (data && data.notifications) {
        setNotifications(data.notifications);
      } else if (data && data.data) {
        setNotifications(data.data);
      } else {
        console.log('No notifications data found, using empty array');
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      console.log('Fetching leave requests from API...');
      
      if (!user?.uid) {
        console.log('No user ID available for fetching leave requests');
        setLeaveRequests([]);
        return;
      }

      let data;
      try {
        data = await apiCall(`/leave-requests/employee/${user?.uid}`);
      } catch (error) {
        console.log('Trying alternative leave requests endpoint...');
        data = await apiCall(`/leave-requests?employeeId=${user?.uid}`);
      }
      
      if (Array.isArray(data)) {
        setLeaveRequests(data);
        console.log(`Loaded ${data.length} leave requests`);
      } else if (data && data.leaveRequests) {
        setLeaveRequests(data.leaveRequests);
      } else if (data && data.data) {
        setLeaveRequests(data.data);
      } else {
        console.log('No leave requests data found, using empty array');
        setLeaveRequests([]);
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      setLeaveRequests([]);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      console.log('Fetching team members from API...');
      
      let data;
      try {
        data = await apiCall(`/team-members`);
      } catch (error) {
        console.log('Trying alternative team members endpoint...');
        data = await apiCall(`/employees`);
      }
      
      if (Array.isArray(data)) {
        setTeamMembers(data);
      } else if (data && data.teamMembers) {
        setTeamMembers(data.teamMembers);
      } else if (data && data.data) {
        setTeamMembers(data.data);
      } else {
        console.log('No team members data found, using empty array');
        setTeamMembers([]);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      setTeamMembers([]);
    }
  };

  // Enhanced fetchUserData to include all data
  const fetchUserData = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch all data in parallel but handle individual failures
      await Promise.allSettled([
        fetchTasks(),
        fetchProjects(),
        fetchWorkSessions(),
        fetchNotifications(),
        fetchLeaveRequests(),
        fetchTeamMembers()
      ]);

      setDataLoaded(true);
      
      toast({
        title: "Dashboard Updated",
        description: "Your data has been refreshed",
      });

    } catch (error) {
      console.error('Error in fetchUserData:', error);
      toast({
        title: "Warning",
        description: "Some data may not have loaded correctly",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Timer functions
  const startTimer = async (taskId: string) => {
    try {
      const response = await apiCall('/work-sessions/start', {
        method: 'POST',
        body: JSON.stringify({ 
          taskId,
          employeeId: user?.uid,
          startTime: new Date().toISOString()
        })
      });

      setActiveTimer(taskId);
      setTimerStart(new Date());
      setElapsedTime(0);
      
      toast({
        title: "Timer Started",
        description: "Time tracking has begun for this task",
      });
    } catch (error) {
      console.error('Error starting timer:', error);
      toast({
        title: "Error",
        description: "Failed to start timer",
        variant: "destructive",
      });
    }
  };

  const stopTimer = async () => {
    if (activeTimer && timerStart) {
      try {
        const duration = Math.floor((new Date().getTime() - timerStart.getTime()) / 1000 / 60);
        
        await apiCall('/work-sessions/stop', {
          method: 'POST',
          body: JSON.stringify({
            taskId: activeTimer,
            employeeId: user?.uid,
            endTime: new Date().toISOString(),
            duration: duration
          })
        });

        // Refresh tasks to get updated actual hours
        await fetchTasks();
        await fetchWorkSessions();

        setActiveTimer(null);
        setTimerStart(null);
        
        toast({
          title: "Timer Stopped",
          description: `Work session recorded: ${duration} minutes`,
        });
      } catch (error) {
        console.error('Error stopping timer:', error);
        toast({
          title: "Error",
          description: "Failed to stop timer",
          variant: "destructive",
        });
      }
    }
  };

  // Task functions
  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      await apiCall(`/tasks/${taskId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: newStatus,
          completedAt: newStatus === 'completed' ? new Date().toISOString() : null
        })
      });

      // Refresh tasks to get updated data
      await fetchTasks();

      toast({
        title: "Status Updated",
        description: `Task marked as ${newStatus.replace('-', ' ')}`,
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  // Notification functions
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await apiCall(`/notifications/${notificationId}/read`, {
        method: 'PUT'
      });

      // Refresh notifications
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await apiCall(`/notifications/${notificationId}`, {
        method: 'DELETE'
      });

      // Refresh notifications
      await fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await apiCall('/notifications/mark-all-read', {
        method: 'PUT',
        body: JSON.stringify({ employeeId: user?.uid })
      });

      // Refresh notifications
      await fetchNotifications();

      toast({
        title: "Notifications Updated",
        description: "All notifications marked as read",
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      });
    }
  };

  // Leave request functions for real-time updates
  const refreshLeaveRequests = async () => {
    try {
      await fetchLeaveRequests();
      toast({
        title: "Leave Requests Updated",
        description: "Your leave requests have been refreshed",
      });
    } catch (error) {
      console.error('Error refreshing leave requests:', error);
    }
  };

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Effects
  useEffect(() => {
    if (user?.uid && !dataLoaded) {
      fetchUserData();
    }
  }, [user?.uid, dataLoaded]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTimer && timerStart) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((new Date().getTime() - timerStart.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer, timerStart]);

  // Set up real-time listeners for all data
  useEffect(() => {
    if (!user?.uid) return;

    const refreshInterval = setInterval(() => {
      fetchUserData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [user?.uid]);

  // Effect to refresh leave requests when notifications change
  useEffect(() => {
    const leaveNotifications = notifications.filter(notification => 
      notification.type.includes('leave') && !notification.read
    );
    
    if (leaveNotifications.length > 0) {
      fetchLeaveRequests();
    }
  }, [notifications]);

  // Render main content based on active view
  const renderMainContent = () => {
    if (loading && !dataLoaded) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      );
    }

    switch (activeView) {
      case 'overview':
        return (
          <OverviewView 
            profile={profile}
            stats={stats}
            tasks={tasks}
            projects={projects}
            leaveRequests={leaveRequests}
          />
        );
      case 'tasks':
        return (
          <TasksView
            tasks={tasks}
            filteredTasks={filteredTasks}
            taskFilters={taskFilters}
            setTaskFilters={setTaskFilters}
            updateTaskStatus={updateTaskStatus}
            startTimer={startTimer}
            setSelectedTask={setSelectedTask}
            setTaskDetailsOpen={setTaskDetailsOpen}
            activeTimer={activeTimer}
            getStatusColor={getStatusColor}
            getPriorityColor={getPriorityColor}
          />
        );
      case 'projects':
        return (
          <ProjectsView 
            projects={projects}
            tasks={tasks}
            teamMembers={teamMembers}
          />
        );
      case 'time':
        return (
          <TimeTrackingView
            workSessions={workSessions}
            tasks={tasks}
            activeTimer={activeTimer}
            elapsedTime={elapsedTime}
            startTimer={startTimer}
            stopTimer={stopTimer}
            formatTime={formatTime}
          />
        );
      case 'reports':
        return (
          <ReportsView
            tasks={tasks}
            workSessions={workSessions}
            projects={projects}
            stats={stats}
            leaveRequests={leaveRequests}
          />
        );
      case 'notifications':
        return (
          <NotificationsView
            notifications={notifications}
            setNotifications={setNotifications}
            markAsRead={markNotificationAsRead}
            deleteNotification={deleteNotification}
            markAllAsRead={markAllNotificationsAsRead}
          />
        );
      case 'profile':
        return (
          <ProfileView
            profile={profile}
            stats={stats}
            tasks={tasks}
            leaveRequests={leaveRequests}
          />
        );
      case 'leave':
        return (
          <LeaveManagementView 
            employeeId={user?.uid || ''}
            employeeName={profile?.fullName || 'Employee'}
            leaveRequests={leaveRequests}
            refreshLeaveRequests={refreshLeaveRequests}
          />
        );
      default:
        return <OverviewView profile={profile} stats={stats} tasks={tasks} projects={projects} leaveRequests={leaveRequests} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="flex">
        {/* Sidebar */}
        <EmployeeSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeView={activeView}
          setActiveView={setActiveView}
          openSections={openSections}
          setOpenSections={setOpenSections}
          profile={profile}
          stats={stats}
          activeTimer={activeTimer}
          elapsedTime={elapsedTime}
          stopTimer={stopTimer}
          formatTime={formatTime}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          <EmployeeHeader
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            fetchUserData={fetchUserData}
            setActiveView={setActiveView}
            unreadNotifications={stats.unreadNotifications}
            pendingLeaveRequests={stats.pendingLeaveRequests}
          />

          <main className="flex-1 p-6 overflow-auto">
            {renderMainContent()}
          </main>
        </div>
      </div>
    </div>
  );
};