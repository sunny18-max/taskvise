import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { ChatBot } from '@/components/Chatbot';
import { 
  Bell,
  Home,
  Settings,
  Menu,
  RefreshCw,
  Zap,
  BookOpen,
  MessageSquare
} from 'lucide-react';

// Import components
import { ManagerSidebar } from './ManagerSidebar';
import { OverviewView } from './views/OverviewView';
import { EmployeesView } from './views/EmployeesView';
import { ProjectsView } from './views/ProjectsView';
import { TasksView } from './views/TasksView';
import { ReportsView } from './views/ReportsView';
import { NotificationsView } from './views/NotificationsView';
import { ProfileView } from './views/ProfileView';
import { AssignTaskDialog } from './dialogs/AssignTaskDialog';
import { CreateProjectDialog } from './dialogs/CreateProjectDialog';
import { EmployeeDetailsDialog } from './dialogs/EmployeeDetailsDialog';
import { EditProjectDialog } from './dialogs/EditProjectDialog';
import { LeaveManagementView } from './views/LeaveManagementView';
import { EditTaskDialog } from './dialogs/EditTaskDialog';

import { WorkloadBalancer } from './views/WorkloadBalancer';
import { SkillRecommendations } from './views/SkillRecommendations';
import { TeamCollaborationNotes } from './views/TeamCollaborationNotes';

// Import types
import type { 
  Task, 
  Employee, 
  Project, 
  WorkSession, 
  Notification,
  DashboardView 
} from './types/managerTypes';

export const ManagerDashboard = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<DashboardView>('overview');

  // Dialog states
  const [assignTaskOpen, setAssignTaskOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [employeeDetailsOpen, setEmployeeDetailsOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTaskOpen, setEditTaskOpen] = useState(false);

  // Get Firebase token for API calls
  const getAuthToken = async (): Promise<string | null> => {
    try {
      // Try to get token from localStorage first
      const token = localStorage.getItem('authToken');
      if (token) {
        return token;
      }
      
      // If not in localStorage, try to get from Firebase Auth
      const currentUser = (window as any).firebase?.auth()?.currentUser;
      if (currentUser) {
        const firebaseToken = await currentUser.getIdToken();
        // Store it for future use
        localStorage.setItem('authToken', firebaseToken);
        return firebaseToken;
      }
      
      // If no token found, use user's token from AuthProvider
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

  // Fetch employees from Firebase with proper error handling - FIXED VERSION
  const fetchEmployees = async (): Promise<Employee[]> => {
    try {
      const response = await makeAuthenticatedRequest('http://localhost:3001/api/employees');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch employees: ${response.status}`);
      }
      
      const employeesData = await response.json();
      
      // Handle case when no employees exist
      if (!employeesData || !Array.isArray(employeesData)) {
        console.log('No employees data found or invalid format');
        return [];
      }
      
      // The backend now provides properly formatted data, so minimal transformation needed
      const transformedEmployees: Employee[] = employeesData.map((emp: any) => ({
        // Core properties
        id: emp.id || emp.uid,
        uid: emp.uid || emp.id,
        
        // Personal info
        fullName: emp.fullName || 'Unknown',
        email: emp.email || 'No email',
        phone: emp.phone || 'Not provided',
        
        // Role and designation
        designation: emp.designation || emp.role || 'Employee',
        role: emp.role || 'employee',
        department: emp.department || 'General',
        skills: emp.skills || [],
        skillGaps: emp.skillGaps || [],
        
        // Status
        isActive: emp.isActive !== false,
        onLeave: emp.onLeave || false,
        pendingApproval: emp.pendingApproval || false,
        
        // Dates
        joinDate: emp.joinDate || new Date().toISOString().split('T')[0],
        lastActive: emp.lastActive || new Date().toISOString(),
        
        // Stats
        totalTasks: emp.totalTasks || 0,
        completedTasks: emp.completedTasks || 0,
        productivity: emp.productivity || 0,
        totalHours: emp.totalHours || 0,
        projects: emp.projects || 0,
        currentWorkload: emp.currentWorkload || 0,
        maxCapacity: emp.maxCapacity || 40,
        assignedTasks: emp.assignedTasks || 0,
        completedTrainings: emp.completedTrainings || 0,
        lastTraining: emp.lastTraining
      }));

      return transformedEmployees;
      
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      
      // Check if it's an authentication error
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

  // Fetch tasks from backend
  const fetchTasks = async (): Promise<Task[]> => {
    try {
      const response = await makeAuthenticatedRequest('http://localhost:3001/api/tasks');
      if (response.ok) {
        const tasksData = await response.json();
        return tasksData || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  };

  // Fetch projects from backend
  const fetchProjects = async (): Promise<Project[]> => {
    try {
      const response = await makeAuthenticatedRequest('http://localhost:3001/api/projects');
      if (response.ok) {
        const projectsData = await response.json();
        return projectsData || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  };

  // Fetch notifications from backend - FIXED VERSION
  const fetchNotifications = async (): Promise<Notification[]> => {
    try {
      const response = await makeAuthenticatedRequest(`http://localhost:3001/api/notifications?userId=${user?.uid}`);
      if (response.ok) {
        const notificationsData = await response.json();
        return notificationsData || [];
      }
      return [];
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      // Don't throw error for notifications - it's not critical
      return [];
    }
  };

  // Fetch all data from database
  useEffect(() => {
    if (user?.uid) {
      fetchManagerData();
    }
  }, [user?.uid]);

  const fetchManagerData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel for better performance
      const [employeesData, tasksData, projectsData, notificationsData] = await Promise.allSettled([
        fetchEmployees(),
        fetchTasks(),
        fetchProjects(),
        fetchNotifications()
      ]);

      // Handle successful and failed promises
      setEmployees(employeesData.status === 'fulfilled' ? employeesData.value : []);
      setTasks(tasksData.status === 'fulfilled' ? tasksData.value : []);
      setProjects(projectsData.status === 'fulfilled' ? projectsData.value : []);
      setNotifications(notificationsData.status === 'fulfilled' ? notificationsData.value : []);

      // Show warning if notifications failed
      if (notificationsData.status === 'rejected') {
        console.warn('Failed to fetch notifications, but continuing with other data');
      }

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

  // Stats calculations based on real data
  const stats = {
    totalEmployees: employees.length,
    activeEmployees: employees.filter(emp => {
      if (!emp.lastActive) return true;
      const lastActive = new Date(emp.lastActive);
      const today = new Date();
      return (today.getTime() - lastActive.getTime()) < 24 * 60 * 60 * 1000;
    }).length,
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'active').length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    overdueTasks: tasks.filter(t => {
      if (t.status === 'completed') return false;
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      const today = new Date();
      return dueDate < today;
    }).length,
    totalHours: tasks.reduce((sum, task) => sum + (task.actualHours || 0), 0),
    productivity: employees.length > 0 ? 
      Math.round(employees.reduce((sum, emp) => sum + (emp.productivity || 0), 0) / employees.length) : 0,
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

  // Add new task function
  const handleAddTask = async (taskData: any) => {
    try {
      const response = await makeAuthenticatedRequest('http://localhost:3001/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          ...taskData,
          createdAt: new Date().toISOString(),
          status: 'pending',
          actualHours: 0
        })
      });

      if (response.ok) {
        const newTask = await response.json();
        setTasks(prev => [newTask, ...prev]);
        toast({
          title: "Task Added",
          description: "Task has been successfully created",
        });
        return true;
      } else {
        const errorText = await response.text();
        let errorMessage = 'Failed to add task';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error adding task:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add task",
        variant: "destructive",
      });
      return false;
    }
  };

  // Add new project function
  const handleAddProject = async (projectData: any) => {
    try {
      const response = await makeAuthenticatedRequest('http://localhost:3001/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          ...projectData,
          createdAt: new Date().toISOString(),
          progress: 0,
          totalTasks: 0,
          completedTasks: 0,
          totalHours: 0,
          completedHours: 0
        })
      });

      if (response.ok) {
        const newProject = await response.json();
        setProjects(prev => [newProject, ...prev]);
        toast({
          title: "Project Added",
          description: "Project has been successfully created",
        });
        return true;
      } else {
        const errorText = await response.text();
        let errorMessage = 'Failed to add project';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error adding project:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add project",
        variant: "destructive",
      });
      return false;
    }
  };

  // Update task function
  const handleUpdateTask = async (taskId: string, updateData: any) => {
    try {
      const response = await makeAuthenticatedRequest(`http://localhost:3001/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        // Refresh tasks to get updated data
        const updatedTasks = await fetchTasks();
        setTasks(updatedTasks);
        toast({
          title: "Task Updated",
          description: "Task has been successfully updated",
        });
        return true;
      } else {
        const errorText = await response.text();
        let errorMessage = 'Failed to update task';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update task",
        variant: "destructive",
      });
      return false;
    }
  };

  // Update project function
  const handleUpdateProject = async (projectId: string, updateData: any) => {
    try {
      const response = await makeAuthenticatedRequest(`http://localhost:3001/api/projects/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        // Refresh projects to get updated data
        const updatedProjects = await fetchProjects();
        setProjects(updatedProjects);
        toast({
          title: "Project Updated",
          description: "Project has been successfully updated",
        });
        return true;
      } else {
        const errorText = await response.text();
        let errorMessage = 'Failed to update project';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error updating project:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update project",
        variant: "destructive",
      });
      return false;
    }
  };

  // Delete task function
  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await makeAuthenticatedRequest(`http://localhost:3001/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTasks(prev => prev.filter(task => task.id !== taskId));
        toast({
          title: "Task Deleted",
          description: "Task has been successfully deleted",
        });
        return true;
      } else {
        const errorText = await response.text();
        let errorMessage = 'Failed to delete task';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete task",
        variant: "destructive",
      });
      return false;
    }
  };

  // Delete project function
  const handleDeleteProject = async (projectId: string) => {
    try {
      const response = await makeAuthenticatedRequest(`http://localhost:3001/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProjects(prev => prev.filter(project => project.id !== projectId));
        toast({
          title: "Project Deleted",
          description: "Project has been successfully deleted",
        });
        return true;
      } else {
        const errorText = await response.text();
        let errorMessage = 'Failed to delete project';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete project",
        variant: "destructive",
      });
      return false;
    }
  };

  // Handle edit project
  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setEditProjectOpen(true);
  };

  // Handle edit task
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditTaskOpen(true);
  };

  // Handle view employee
  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEmployeeDetailsOpen(true);
  };

  // Handle task assignment from Workload Balancer
  const handleAssignTaskFromBalancer = async (taskId: string, employeeId: string) => {
    try {
      await handleUpdateTask(taskId, { assignedTo: employeeId });
      toast({
        title: "Task Assigned",
        description: "Task has been successfully assigned",
      });
    } catch (error) {
      console.error('Error assigning task:', error);
    }
  };

  // Main Content based on active view
  const renderMainContent = () => {
    const commonProps = {
      tasks,
      employees,
      projects,
      notifications,
      stats,
      onAssignTask: () => setAssignTaskOpen(true),
      onCreateProject: () => setCreateProjectOpen(true),
      onViewEmployee: handleViewEmployee,
      onMarkNotificationAsRead: markNotificationAsRead,
      onAddTask: handleAddTask,
      onUpdateTask: handleUpdateTask,
      onDeleteTask: handleDeleteTask,
      onAddProject: handleAddProject,
      onUpdateProject: handleUpdateProject,
      onDeleteProject: handleDeleteProject,
      onEditProject: handleEditProject,
      onEditTask: handleEditTask,
      user,
      onRefreshData: fetchManagerData
    };

    switch (activeView) {
      case 'employees':
        return <EmployeesView {...commonProps} />;
      case 'projects':
        return <ProjectsView {...commonProps} />;
      case 'tasks':
        return <TasksView {...commonProps} />;
      case 'reports':
        return <ReportsView {...commonProps} />;
      case 'notifications':
        return <NotificationsView {...commonProps} />;
      case 'profile':
        return <ProfileView profile={profile} />;
      case 'leave':
        return <LeaveManagementView employees={employees} user={user} />;
      case 'workload-balancer':
        return <WorkloadBalancer 
          employees={employees} 
          tasks={tasks} 
          onAssignTask={handleAssignTaskFromBalancer} 
        />;
      case 'skill-recommendations':
        return <SkillRecommendations 
          employees={employees} 
          projects={projects} 
        />;
      case 'team-notes':
        return <TeamCollaborationNotes 
          teamMembers={employees} 
          currentUser={user} 
        />;
      default:
        return <OverviewView {...commonProps} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <ManagerSidebar
          sidebarOpen={sidebarOpen}
          activeView={activeView}
          stats={stats}
          profile={profile}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onViewChange={setActiveView}
          onAssignTask={() => setAssignTaskOpen(true)}
          onCreateProject={() => setCreateProjectOpen(true)}
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
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Manager
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
                <Button variant="ghost" size="sm" onClick={fetchManagerData}>
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
          
          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-6">
              {renderMainContent()}
            </div>
          </main>
        </div>
      </div>

      {/* Dialogs */}
      <AssignTaskDialog
        open={assignTaskOpen}
        onOpenChange={setAssignTaskOpen}
        employees={employees}
        projects={projects}
        onTaskAssigned={handleAddTask}
        user={user}
      />

      <CreateProjectDialog
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
        employees={employees}
        onProjectCreated={handleAddProject}
        user={user}
      />

      <EmployeeDetailsDialog
        open={employeeDetailsOpen}
        onOpenChange={setEmployeeDetailsOpen}
        employee={selectedEmployee}
      />

      <EditProjectDialog
        open={editProjectOpen}
        onOpenChange={setEditProjectOpen}
        project={editingProject}
        onProjectUpdated={handleUpdateProject}
        user={user}
        employees={employees}
      />

      <EditTaskDialog
        open={editTaskOpen}
        onOpenChange={setEditTaskOpen}
        task={editingTask}
        onTaskUpdated={handleUpdateTask}
        user={user}
      />
      <ChatBot dashboardType="manager" />
    </div>
  );
};