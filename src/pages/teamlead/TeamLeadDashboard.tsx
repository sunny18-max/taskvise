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
  Target,
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  Menu,
  RefreshCw
} from 'lucide-react';

// Import components
import { TeamLeadSidebar } from './TeamLeadSidebar';
import { OverviewView } from './views/OverviewView';
import { TeamMembersView } from './views/TeamMembersView';
import { ProjectsView } from './views/ProjectsView';
import { TasksView } from './views/TasksView';
import { ReportsView } from './views/ReportsView';
import { NotificationsView } from './views/NotificationsView';
import { ProfileView } from './views/ProfileView';
import { AssignTaskDialog } from './dialogs/AssignTaskDialog';
import { CreateProjectDialog } from './dialogs/CreateProjectDialog';
import { TeamMemberDetailsDialog } from './dialogs/TeamMemberDetailsDialog';

// Import types
import type { 
  Task, 
  Employee, 
  Project, 
  WorkSession, 
  Notification,
  DashboardView 
} from './types/teamLeadTypes';

export const TeamLeadDashboard = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<Employee[]>([]);
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
  const [teamMemberDetailsOpen, setTeamMemberDetailsOpen] = useState(false);
  const [selectedTeamMember, setSelectedTeamMember] = useState<Employee | null>(null);

  // Get Firebase token for API calls
  const getAuthToken = async (): Promise<string | null> => {
    try {
      // Try to get from localStorage first
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        console.log('Using stored token');
        return storedToken;
      }
      
      // Try Firebase auth
      const currentUser = (window as any).firebase?.auth()?.currentUser;
      if (currentUser) {
        console.log('Getting Firebase token');
        const firebaseToken = await currentUser.getIdToken();
        localStorage.setItem('authToken', firebaseToken);
        return firebaseToken;
      }
      
      // Try AuthProvider user
      if (user) {
        console.log('Getting AuthProvider token');
        const token = await user.getIdToken();
        localStorage.setItem('authToken', token);
        return token;
      }
      
      console.error('No authentication token found - user not authenticated');
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

      console.log(`Making request to: ${url}`);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      console.log(`Response status: ${response.status} for ${url}`);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      return response;
    } catch (error: any) {
      console.error(`API request failed for ${url}:`, error);
      throw new Error(error.message || 'Network request failed');
    }
  };

  // Fetch team members
  const fetchTeamMembers = async (): Promise<Employee[]> => {
    try {
      console.log('Fetching team members...');
      const response = await makeAuthenticatedRequest('http://localhost:3001/api/team-members');
      
      const teamData = await response.json();
      console.log('Team members raw data:', teamData);
      
      if (!teamData || !Array.isArray(teamData)) {
        console.log('No team members data found or invalid format');
        return [];
      }
      
      // Transform team members data
      const transformedTeamMembers: Employee[] = teamData.map((emp: any) => ({
        id: emp.id || emp.uid || `emp-${Math.random().toString(36).substr(2, 9)}`,
        uid: emp.uid || emp.id,
        fullName: emp.fullName || emp.name || 'Unknown Team Member',
        email: emp.email || 'No email',
        phone: emp.phone || 'Not provided',
        designation: emp.designation || emp.role || 'Team Member',
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
        totalHours: emp.totalHours || 0,
        projects: emp.projects || 0
      }));

      console.log(`Transformed ${transformedTeamMembers.length} team members`);
      return transformedTeamMembers;
      
    } catch (error: any) {
      console.error('Error fetching team members:', error);
      toast({
        title: "Error",
        description: `Failed to fetch team members: ${error.message}`,
        variant: "destructive",
      });
      return [];
    }
  };

  // Fetch tasks for team
  const fetchTasks = async (teamMembersData: Employee[]): Promise<Task[]> => {
    try {
      console.log('Fetching tasks...');
      const response = await makeAuthenticatedRequest('http://localhost:3001/api/tasks');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch tasks`);
      }

      const tasksData = await response.json();
      console.log('Tasks raw data:', tasksData);

      if (!tasksData || !Array.isArray(tasksData)) {
        console.log('No tasks data found or invalid format');
        return [];
      }

      // Get team member IDs for filtering
      const teamMemberIds = teamMembersData.map(member => member.id);
      console.log('Team member IDs for filtering:', teamMemberIds);

      // Filter tasks assigned to team members and transform data
      const filteredTasks: Task[] = tasksData
        .filter((task: any) => {
          const isAssignedToTeam = teamMemberIds.includes(task.assignedTo);
          console.log(`Task ${task.id} assigned to ${task.assignedTo} - in team: ${isAssignedToTeam}`);
          return isAssignedToTeam;
        })
        .map((task: any) => ({
          id: task.id || `task-${Math.random().toString(36).substr(2, 9)}`,
          title: task.title || 'Untitled Task',
          description: task.description || 'No description',
          status: task.status || 'pending',
          priority: task.priority || 'medium',
          dueDate: task.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          assignedTo: task.assignedTo,
          assignedToName: task.assignedToName || 'Unassigned',
          projectId: task.projectId,
          projectName: task.projectName || 'No Project',
          estimatedHours: task.estimatedHours || 0,
          actualHours: task.actualHours || 0,
          createdAt: task.createdAt || new Date().toISOString(),
          updatedAt: task.updatedAt || new Date().toISOString()
        }));

      console.log(`Filtered ${filteredTasks.length} tasks for team`);
      return filteredTasks;
      
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: `Failed to fetch tasks: ${error.message}`,
        variant: "destructive",
      });
      return [];
    }
  };

  // Fetch team projects
  const fetchProjects = async (): Promise<Project[]> => {
    try {
      console.log('Fetching projects...');
      const response = await makeAuthenticatedRequest('http://localhost:3001/api/projects');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch projects`);
      }

      const projectsData = await response.json();
      console.log('Projects raw data:', projectsData);

      if (!projectsData || !Array.isArray(projectsData)) {
        console.log('No projects data found or invalid format');
        return [];
      }

      // Filter projects where current user is team lead or part of the team
      const filteredProjects: Project[] = projectsData
        .filter((project: any) => {
          const isTeamLead = project.teamLead === user?.uid;
          const isTeamMember = project.teamMembers?.includes(user?.uid);
          console.log(`Project ${project.id} - teamLead: ${project.teamLead}, user: ${user?.uid}, isTeamLead: ${isTeamLead}, isTeamMember: ${isTeamMember}`);
          return isTeamLead || isTeamMember;
        })
        .map((project: any) => ({
          id: project.id || `project-${Math.random().toString(36).substr(2, 9)}`,
          name: project.name || 'Unnamed Project',
          description: project.description || 'No description',
          status: project.status || 'planning',
          progress: project.progress || 0,
          teamLead: project.teamLead,
          teamMembers: project.teamMembers || [],
          teamMemberNames: project.teamMemberNames || [],
          deadline: project.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          totalTasks: project.totalTasks || 0,
          completedTasks: project.completedTasks || 0,
          totalHours: project.totalHours || 0,
          completedHours: project.completedHours || 0,
          createdAt: project.createdAt || new Date().toISOString()
        }));

      console.log(`Filtered ${filteredProjects.length} projects`);
      return filteredProjects;
      
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: `Failed to fetch projects: ${error.message}`,
        variant: "destructive",
      });
      return [];
    }
  };

  // Fetch notifications - with better error handling
  const fetchNotifications = async (): Promise<Notification[]> => {
    try {
      console.log('Fetching notifications...');
      
      // Skip if no user
      if (!user?.uid) {
        console.log('No user ID, skipping notifications fetch');
        return [];
      }

      const response = await makeAuthenticatedRequest(
        `http://localhost:3001/api/notifications?userId=${user.uid}`
      );
      
      const notificationsData = await response.json();
      console.log('Notifications raw data:', notificationsData);
      
      return notificationsData || [];
      
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      // Don't show toast for notifications as they're not critical
      // Return mock notifications for development
      return [
        {
          id: 'notif-1',
          title: 'Welcome to Team Lead Dashboard',
          message: 'You can now manage your team and projects efficiently.',
          type: 'info',
          read: false,
          createdAt: new Date().toISOString()
        }
      ];
    }
  };

  // Fetch all data
  useEffect(() => {
    if (user?.uid) {
      fetchTeamLeadData();
    }
  }, [user?.uid]);

  const fetchTeamLeadData = async () => {
    try {
      setLoading(true);
      console.log('Starting data fetch...');
      
      // First fetch team members, then use their IDs to filter tasks
      const teamMembersData = await fetchTeamMembers();
      setTeamMembers(teamMembersData);

      // Now fetch other data that depends on team members
      const [tasksData, projectsData, notificationsData] = await Promise.allSettled([
        fetchTasks(teamMembersData),
        fetchProjects(),
        fetchNotifications()
      ]);

      setTasks(tasksData.status === 'fulfilled' ? tasksData.value : []);
      setProjects(projectsData.status === 'fulfilled' ? projectsData.value : []);
      setNotifications(notificationsData.status === 'fulfilled' ? notificationsData.value : []);

      console.log('Data fetch completed:', {
        teamMembers: teamMembersData.length,
        tasks: tasksData.status === 'fulfilled' ? tasksData.value.length : 0,
        projects: projectsData.status === 'fulfilled' ? projectsData.value.length : 0,
        notifications: notificationsData.status === 'fulfilled' ? notificationsData.value.length : 0
      });

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
    totalTeamMembers: teamMembers.length,
    activeTeamMembers: teamMembers.filter(member => {
      if (!member.lastActive) return true;
      const lastActive = new Date(member.lastActive);
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
    productivity: teamMembers.length > 0 ? 
      Math.round(teamMembers.reduce((sum, member) => sum + (member.productivity || 0), 0) / teamMembers.length) : 0,
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
          title: "Task Assigned",
          description: "Task has been successfully assigned to team member",
        });
        return true;
      } else {
        const errorText = await response.text();
        let errorMessage = 'Failed to assign task';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error assigning task:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign task",
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
          teamLead: user?.uid,
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
          title: "Project Created",
          description: "Project has been successfully created",
        });
        return true;
      } else {
        const errorText = await response.text();
        let errorMessage = 'Failed to create project';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
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
        const updatedTask = await response.json();
        setTasks(prev => prev.map(task => 
          task.id === taskId ? updatedTask : task
        ));
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

  // Handle view team member
  const handleViewTeamMember = (member: Employee) => {
    setSelectedTeamMember(member);
    setTeamMemberDetailsOpen(true);
  };

  // Handle manage team
  const handleManageTeam = () => {
    setActiveView('team-members');
  };

  // Handle schedule meeting
  const handleScheduleMeeting = () => {
    toast({
      title: "Schedule Meeting",
      description: "Meeting scheduling functionality would open here",
    });
  };

  // Main Content based on active view
  const renderMainContent = () => {
    const commonProps = {
      tasks,
      teamMembers,
      projects,
      notifications,
      stats,
      onAssignTask: () => setAssignTaskOpen(true),
      onCreateProject: () => setCreateProjectOpen(true),
      onViewTeamMember: handleViewTeamMember,
      onMarkNotificationAsRead: markNotificationAsRead,
      onAddTask: handleAddTask,
      onUpdateTask: handleUpdateTask,
      onAddProject: handleAddProject,
      onManageTeam: handleManageTeam,
      onScheduleMeeting: handleScheduleMeeting,
      user,
      onRefreshData: fetchTeamLeadData
    };

    switch (activeView) {
      case 'team-members':
        return <TeamMembersView {...commonProps} />;
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <TeamLeadSidebar
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
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Team Lead
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
                <Button variant="ghost" size="sm" onClick={fetchTeamLeadData}>
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
        teamMembers={teamMembers}
        projects={projects}
        onTaskAssigned={handleAddTask}
        user={user}
      />

      <CreateProjectDialog
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
        teamMembers={teamMembers}
        onProjectCreated={handleAddProject}
        user={user}
      />

      <TeamMemberDetailsDialog
        open={teamMemberDetailsOpen}
        onOpenChange={setTeamMemberDetailsOpen}
        teamMember={selectedTeamMember}
      />
    </div>
  );
};