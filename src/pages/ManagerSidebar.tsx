// ManagerSidebar.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Users, 
  Target, 
  BarChart3, 
  Bell,
  User,
  Plus,
  FileText,
  Home,
  ChevronDown,
  ChevronRight,
  Calendar
} from 'lucide-react';
import type { DashboardView, Stats } from './types/managerTypes';

interface ManagerSidebarProps {
  sidebarOpen: boolean;
  activeView: DashboardView;
  stats: Stats;
  profile: any;
  onToggleSidebar: () => void;
  onViewChange: (view: DashboardView) => void;
  onAssignTask: () => void;
  onCreateProject: () => void;
}

export const ManagerSidebar = ({
  sidebarOpen,
  activeView,
  stats,
  profile,
  onToggleSidebar,
  onViewChange,
  onAssignTask,
  onCreateProject
}: ManagerSidebarProps) => {
  const [openSections, setOpenSections] = useState({
    employees: false,
    projects: false,
    tasks: false,
    leave: false
  });

  const toggleSection = (section: keyof typeof openSections) => {
    // Close all sections first
    const updatedSections = {
      employees: false,
      projects: false,
      tasks: false,
      leave: false
    };
    
    // If the clicked section is not already open, open it
    if (!openSections[section]) {
      updatedSections[section] = true;
    }
    
    setOpenSections(updatedSections);
  };

  return (
    <>
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggleSidebar}
        />
      )}
      
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-80 bg-white/95 backdrop-blur-lg border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col h-screen
      `}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              TV
            </div>
            <div>
              <h1 className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TaskVise
              </h1>
              <p className="text-sm text-muted-foreground">Manager Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* Main Navigation */}
          <button
            onClick={() => onViewChange('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
              activeView === 'overview' 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Home className="h-5 w-5" />
            <span className="font-medium">Overview</span>
          </button>

          {/* Employees Section */}
          <Collapsible
            open={openSections.employees}
            onOpenChange={() => toggleSection('employees')}
          >
            <CollapsibleTrigger className="w-full">
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                activeView.startsWith('employees') 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}>
                <Users className="h-5 w-5" />
                <span className="font-medium flex-1">Team</span>
                {openSections.employees ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-8 mt-2 space-y-1">
              <button
                onClick={() => onViewChange('employees')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 text-gray-600"
              >
                All Employees ({stats.totalEmployees})
              </button>
              <button
                onClick={() => onViewChange('employees')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 text-gray-600"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Active ({stats.activeEmployees})
              </button>
            </CollapsibleContent>
          </Collapsible>

          {/* Projects Section */}
          <Collapsible
            open={openSections.projects}
            onOpenChange={() => toggleSection('projects')}
          >
            <CollapsibleTrigger className="w-full">
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                activeView.startsWith('projects') 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}>
                <Target className="h-5 w-5" />
                <span className="font-medium flex-1">Projects</span>
                {openSections.projects ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-8 mt-2 space-y-1">
              <button
                onClick={() => onViewChange('projects')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 text-gray-600"
              >
                All Projects ({stats.totalProjects})
              </button>
              <button
                onClick={() => onViewChange('projects')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 text-gray-600"
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Active ({stats.activeProjects})
              </button>
            </CollapsibleContent>
          </Collapsible>

          {/* Tasks Section */}
          <Collapsible
            open={openSections.tasks}
            onOpenChange={() => toggleSection('tasks')}
          >
            <CollapsibleTrigger className="w-full">
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                activeView.startsWith('tasks') 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}>
                <FileText className="h-5 w-5" />
                <span className="font-medium flex-1">Tasks</span>
                {openSections.tasks ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-8 mt-2 space-y-1">
              <button
                onClick={() => onViewChange('tasks')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 text-gray-600"
              >
                All Tasks ({stats.totalTasks})
              </button>
              <button
                onClick={() => onViewChange('tasks')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 text-gray-600"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Completed ({stats.completedTasks})
              </button>
              <button
                onClick={() => onViewChange('tasks')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 text-gray-600"
              >
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Overdue ({stats.overdueTasks})
              </button>
            </CollapsibleContent>
          </Collapsible>

          {/* Leave Management Section */}
          <Collapsible
            open={openSections.leave}
            onOpenChange={() => toggleSection('leave')}
          >
            <CollapsibleTrigger className="w-full">
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                activeView === 'leave' 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}>
                <Calendar className="h-5 w-5" />
                <span className="font-medium flex-1">Leave Management</span>
                {openSections.leave ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-8 mt-2 space-y-1">
              <button
                onClick={() => onViewChange('leave')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 text-gray-600"
              >
                Team Calendar
              </button>
              <button
                onClick={() => onViewChange('leave')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 text-gray-600"
              >
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                Pending Requests
              </button>
              <button
                onClick={() => onViewChange('leave')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 text-gray-600"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Approved Leaves
              </button>
            </CollapsibleContent>
          </Collapsible>

          {/* Reports */}
          <button
            onClick={() => onViewChange('reports')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
              activeView === 'reports' 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            <span className="font-medium">Reports</span>
          </button>

          {/* Notifications */}
          <button
            onClick={() => onViewChange('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
              activeView === 'notifications' 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Bell className="h-5 w-5" />
            <span className="font-medium">Notifications</span>
            {stats.unreadNotifications > 0 && (
              <Badge variant="destructive" className="ml-auto">
                {stats.unreadNotifications}
              </Badge>
            )}
          </button>

          {/* Profile */}
          <button
            onClick={() => onViewChange('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
              activeView === 'profile' 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <User className="h-5 w-5" />
            <span className="font-medium">Profile</span>
          </button>
        </nav>

        {/* Quick Actions */}
        <div className="p-4 border-t border-gray-200">
          <div className="space-y-2">
            <Button 
              className="w-full" 
              onClick={onAssignTask}
            >
              <Plus className="h-4 w-4 mr-2" />
              Assign Task
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={onCreateProject}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {profile?.fullName?.split(' ').map(n => n[0]).join('') || 'M'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {profile?.fullName || 'Manager'}
              </p>
              <p className="text-xs text-muted-foreground truncate">Manager</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};