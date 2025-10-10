import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { EmployeeSidebar } from './EmployeeSidebar';
import { EmployeeHeader } from './EmployeeHeader';
import { OverviewView } from './views/OverviewView';
import { TasksView } from './views/TasksView';
import { ProjectsView } from './views/ProjectsView';
import { WorkloadView } from './views/WorkloadView';
import { LeaveManagementView } from './views/LeaveManagementView';
import { ReportsView } from './views/ReportsView';
import { NotificationsView } from './views/NotificationsView';
import { ProfileView } from './views/ProfileView';
import { ChatBot } from '@/components/Chatbot';

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
  helpRequested?: boolean;
  collaborators?: string[];
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
  type: 'task_assigned' | 'task_updated' | 'project_update' | 'system' | 'task_completed' | 'project_assigned' | 'help_request';
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
  currentWorkload?: 'light' | 'balanced' | 'heavy';
}

interface HelpRequest {
  id: string;
  taskId: string;
  taskTitle: string;
  requesterId: string;
  requesterName: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  createdAt: string;
  collaborators?: string[];
}

type DashboardView = 'overview' | 'tasks' | 'projects' | 'workload' | 'reports' | 'profile' | 'notifications' | 'leave';

export const EmployeeDashboard = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<DashboardView>('overview');
  const [openSections, setOpenSections] = useState({
    tasks: true,
    projects: true,
    tools: true
  });

  const [taskFilters, setTaskFilters] = useState({
    status: 'all',
    priority: 'all',
    project: 'all'
  });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDetailsOpen, setTaskDetailsOpen] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    try {
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
        if (response.status === 500) {
          console.warn(`Server error (500) for endpoint: ${endpoint}`);
          if (endpoint.includes('/work-sessions') || 
              endpoint.includes('/notifications') || 
              endpoint.includes('/leave-requests') ||
              endpoint.includes('/help-requests')) {
            return [];
          }
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      
      if (endpoint.includes('/work-sessions') || 
          endpoint.includes('/notifications') || 
          endpoint.includes('/leave-requests') ||
          endpoint.includes('/help-requests')) {
        return [];
      }
      
      throw error;
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (taskFilters.status !== 'all' && task.status !== taskFilters.status) return false;
    if (taskFilters.priority !== 'all' && task.priority !== taskFilters.priority) return false;
    if (taskFilters.project !== 'all' && task.project !== taskFilters.project) return false;
    return true;
  });

  // Calculate workload
  const calculateWorkload = () => {
    const pendingTasks = tasks.filter(task => 
      task.status === 'pending' || task.status === 'in-progress'
    ).length;
    
    const highPriorityTasks = tasks.filter(task => 
      task.priority === 'high' && (task.status === 'pending' || task.status === 'in-progress')
    ).length;

    const overdueTasks = tasks.filter(task => task.status === 'overdue').length;

    if (overdueTasks > 2 || highPriorityTasks > 3 || pendingTasks > 8) {
      return 'heavy';
    } else if (pendingTasks > 4 || highPriorityTasks > 1) {
      return 'balanced';
    } else {
      return 'light';
    }
  };

  const workload = calculateWorkload();

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
    totalLeaveRequests: leaveRequests.length,
    workload,
    helpRequestsCount: helpRequests.filter(req => req.status === 'pending').length
  };

  const fetchTasks = async () => {
    try {
      let data;
      try {
        data = await apiCall(`/tasks?assignedTo=${user?.uid}`);
      } catch (error) {
        data = await apiCall(`/tasks`);
      }
      
      if (Array.isArray(data)) {
        const userTasks = data.filter((task: Task) => task.assignedTo === user?.uid);
        setTasks(userTasks);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    }
  };

  const fetchProjects = async () => {
    try {
      let data;
      try {
        data = await apiCall(`/projects`);
      } catch (error) {
        data = await apiCall(`/projects`);
      }
      
      if (Array.isArray(data)) {
        const userProjects = data.filter((project: Project) => 
          project.teamMembers && project.teamMembers.includes(user?.uid || '')
        );
        setProjects(userProjects);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    }
  };

  const fetchWorkSessions = async () => {
    try {
      let data;
      try {
        data = await apiCall(`/work-sessions?userId=${user?.uid}`);
      } catch (error) {
        data = await apiCall(`/work-sessions`);
      }
      
      if (Array.isArray(data)) {
        const userSessions = data.filter((session: WorkSession) => session.userId === user?.uid);
        setWorkSessions(userSessions);
      } else {
        setWorkSessions([]);
      }
    } catch (error) {
      console.error('Error fetching work sessions:', error);
      setWorkSessions([]);
    }
  };

  const fetchNotifications = async () => {
    try {
      let data;
      try {
        data = await apiCall(`/notifications/my-notifications`);
      } catch (error) {
        data = await apiCall(`/notifications`);
      }
      
      if (Array.isArray(data)) {
        const userNotifications = data.filter((notification: Notification) => 
          notification.userId === user?.uid
        );
        setNotifications(userNotifications);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      if (!user?.uid) {
        setLeaveRequests([]);
        return;
      }

      let data;
      try {
        data = await apiCall(`/leave-requests/my-requests`);
      } catch (error) {
        console.log('Trying fallback endpoint for leave requests');
        data = await apiCall(`/leave-requests`);
      }
      
      if (Array.isArray(data)) {
        const userLeaveRequests = data.filter((request: LeaveRequest) => 
          request.employeeId === user?.uid
        );
        setLeaveRequests(userLeaveRequests);
      } else {
        setLeaveRequests([]);
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      setLeaveRequests([]);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      let data;
      try {
        data = await apiCall(`/team-members`);
      } catch (error) {
        data = await apiCall(`/employees`);
      }
      
      if (Array.isArray(data)) {
        setTeamMembers(data);
      } else {
        setTeamMembers([]);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      setTeamMembers([]);
    }
  };

  const fetchHelpRequests = async () => {
    try {
      let data;
      try {
        data = await apiCall(`/help-requests/my-requests`);
      } catch (error) {
        data = await apiCall(`/help-requests`);
      }
      
      if (Array.isArray(data)) {
        const userHelpRequests = data.filter((request: HelpRequest) => 
          request.requesterId === user?.uid
        );
        setHelpRequests(userHelpRequests);
      } else {
        setHelpRequests([]);
      }
    } catch (error) {
      console.error('Error fetching help requests:', error);
      setHelpRequests([]);
    }
  };

  const fetchUserData = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      await Promise.allSettled([
        fetchTasks(),
        fetchProjects(),
        fetchWorkSessions(),
        fetchNotifications(),
        fetchLeaveRequests(),
        fetchTeamMembers(),
        fetchHelpRequests()
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

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      await apiCall(`/tasks/${taskId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: newStatus,
          completedAt: newStatus === 'completed' ? new Date().toISOString() : null
        })
      });

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

  const requestHelp = async (taskId: string, message: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Task not found');

      await apiCall('/help-requests', {
        method: 'POST',
        body: JSON.stringify({
          taskId,
          taskTitle: task.title,
          requesterId: user?.uid,
          requesterName: profile?.fullName || 'Employee',
          message,
          status: 'pending'
        })
      });

      await fetchHelpRequests();

      toast({
        title: "Help Request Sent",
        description: "Your teammates have been notified",
      });
    } catch (error) {
      console.error('Error requesting help:', error);
      toast({
        title: "Error",
        description: "Failed to send help request",
        variant: "destructive",
      });
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await apiCall(`/notifications/${notificationId}/read`, {
        method: 'PUT'
      });

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

      await fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await apiCall('/notifications/mark-all-read', {
        method: 'PUT'
      });

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

  const getWorkloadColor = (workload: string) => {
    switch (workload) {
      case 'heavy': return 'bg-red-100 text-red-800';
      case 'balanced': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  useEffect(() => {
    if (user?.uid && !dataLoaded) {
      fetchUserData();
    }
  }, [user?.uid, dataLoaded]);

  useEffect(() => {
    if (!user?.uid) return;

    const refreshInterval = setInterval(() => {
      fetchUserData();
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, [user?.uid]);

  useEffect(() => {
    const leaveNotifications = notifications.filter(notification => 
      notification.type.includes('leave') && !notification.read
    );
    
    if (leaveNotifications.length > 0) {
      fetchLeaveRequests();
    }
  }, [notifications]);

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
            teamMembers={teamMembers}
            workload={workload}
            getWorkloadColor={getWorkloadColor}
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
            setSelectedTask={setSelectedTask}
            setTaskDetailsOpen={setTaskDetailsOpen}
            getStatusColor={getStatusColor}
            getPriorityColor={getPriorityColor}
            requestHelp={requestHelp}
            teamMembers={teamMembers}
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
      case 'workload':
        return (
          <WorkloadView
            tasks={tasks}
            projects={projects}
            teamMembers={teamMembers}
            workload={workload}
            getWorkloadColor={getWorkloadColor}
            requestHelp={requestHelp}
            helpRequests={helpRequests}
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
            fetchLeaveRequests={fetchLeaveRequests}
          />
        );
      default:
        return <OverviewView profile={profile} stats={stats} tasks={tasks} projects={projects} leaveRequests={leaveRequests} teamMembers={teamMembers} workload={workload} getWorkloadColor={getWorkloadColor} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="flex">
        <EmployeeSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeView={activeView}
          setActiveView={setActiveView}
          openSections={openSections}
          setOpenSections={setOpenSections}
          profile={profile}
          stats={stats}
          projects={projects}
        />

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
      <ChatBot dashboardType="employee" />
    </div>
  );
};