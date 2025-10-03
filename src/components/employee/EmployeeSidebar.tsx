import { useState } from 'react'; 
import { 
  Home, 
  CheckSquare, 
  Target, 
  Timer, 
  BarChart3, 
  Bell, 
  User, 
  ChevronDown, 
  ChevronRight,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface EmployeeSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeView: string;
  setActiveView: (view: string) => void;
  openSections: { tasks: boolean; projects: boolean; tools: boolean; leave: boolean };
  setOpenSections: (sections: any) => void;
  profile: any;
  stats: any;
  activeTimer: string | null;
  elapsedTime: number;
  stopTimer: () => void;
  formatTime: (seconds: number) => string;
  projects: any[];
}

export const EmployeeSidebar = ({
  sidebarOpen,
  setSidebarOpen,
  activeView,
  setActiveView,
  openSections,
  setOpenSections,
  profile,
  stats,
  activeTimer,
  elapsedTime,
  stopTimer,
  formatTime,
  projects = []
}: EmployeeSidebarProps) => {

  const handleSectionToggle = (section: keyof typeof openSections) => {
    // Close all sections first
    const updatedSections = {
      tasks: false,
      projects: false,
      tools: false,
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
          onClick={() => setSidebarOpen(false)}
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
              <p className="text-sm text-muted-foreground">Employee Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button
            onClick={() => setActiveView('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
              activeView === 'overview' 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Home className="h-5 w-5" />
            <span className="font-medium">Overview</span>
          </button>

          {/* Tasks Section */}
          <Collapsible
            open={openSections.tasks}
            onOpenChange={() => handleSectionToggle('tasks')}
          >
            <CollapsibleTrigger className="w-full">
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                activeView.startsWith('tasks') 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}>
                <CheckSquare className="h-5 w-5" />
                <span className="font-medium flex-1">My Tasks</span>
                {openSections.tasks ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-8 mt-2 space-y-1">
              <button
                onClick={() => setActiveView('tasks')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 text-gray-600"
              >
                All Tasks ({stats.totalTasks})
              </button>
              <button
                onClick={() => setActiveView('tasks')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 text-gray-600"
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                In Progress ({stats.inProgressTasks})
              </button>
              <button
                onClick={() => setActiveView('tasks')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 text-gray-600"
              >
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Overdue ({stats.overdueTasks})
              </button>
            </CollapsibleContent>
          </Collapsible>

          {/* Projects Section */}
          <Collapsible
            open={openSections.projects}
            onOpenChange={() => handleSectionToggle('projects')}
          >
            <CollapsibleTrigger className="w-full">
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                activeView.startsWith('projects') 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}>
                <Target className="h-5 w-5" />
                <span className="font-medium flex-1">My Projects</span>
                {openSections.projects ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-8 mt-2 space-y-1">
              <button
                onClick={() => setActiveView('projects')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 text-gray-600"
              >
                All Projects ({projects.length})
              </button>
              <button
                onClick={() => setActiveView('projects')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 text-gray-600"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Active ({projects.filter((p: any) => p.status === 'active').length})
              </button>
              <button
                onClick={() => setActiveView('projects')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 text-gray-600"
              >
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                On Hold ({projects.filter((p: any) => p.status === 'on-hold').length})
              </button>
            </CollapsibleContent>
          </Collapsible>

          {/* Leave Management Section */}
          <Collapsible
            open={openSections.leave}
            onOpenChange={() => handleSectionToggle('leave')}
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
                onClick={() => setActiveView('leave')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 text-gray-600"
              >
                My Leave Calendar
              </button>
              <button
                onClick={() => setActiveView('leave')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 text-gray-600"
              >
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                Pending Requests
              </button>
              <button
                onClick={() => setActiveView('leave')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 text-gray-600"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Approved Leaves
              </button>
            </CollapsibleContent>
          </Collapsible>

          {/* Time Tracking */}
          <button
            onClick={() => setActiveView('time')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
              activeView === 'time' 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Timer className="h-5 w-5" />
            <span className="font-medium">Time Tracking</span>
          </button>

          {/* Reports */}
          <button
            onClick={() => setActiveView('reports')}
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
            onClick={() => setActiveView('notifications')}
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
            onClick={() => setActiveView('profile')}
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

        {/* Active Timer */}
        {activeTimer && (
          <div className="p-4 border-t border-gray-200">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Timer className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">Active Timer</span>
              </div>
              <div className="text-2xl font-bold text-blue-900 mb-2">
                {formatTime(elapsedTime)}
              </div>
              <Button 
                size="sm" 
                variant="destructive" 
                className="w-full"
                onClick={stopTimer}
              >
                Stop Timer
              </Button>
            </div>
          </div>
        )}

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {profile?.fullName?.split(' ').map((n: string) => n[0]).join('') || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {profile?.fullName || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">{profile?.role || 'Employee'}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};