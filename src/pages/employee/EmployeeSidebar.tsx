import { 
  Home, 
  CheckSquare, 
  Target, 
  BarChart3, 
  Bell, 
  User, 
  ChevronDown, 
  ChevronRight,
  Calendar,
  Users,
  Activity
} from 'lucide-react';
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
  projects = []
}: EmployeeSidebarProps) => {

  const handleSectionToggle = (section: keyof typeof openSections) => {
    const updatedSections = {
      tasks: false,
      projects: false,
      tools: false,
      leave: false
    };
    
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
        flex flex-col
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

          {/* Workload & Collaboration */}
          <button
            onClick={() => setActiveView('workload')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
              activeView === 'workload' 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Activity className="h-5 w-5" />
            <span className="font-medium">Workload & Help</span>
            {stats.helpRequestsCount > 0 && (
              <Badge variant="destructive" className="ml-auto">
                {stats.helpRequestsCount}
              </Badge>
            )}
          </button>

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
                Pending Requests ({stats.pendingLeaveRequests})
              </button>
              <button
                onClick={() => setActiveView('leave')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 text-gray-600"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Approved Leaves ({stats.approvedLeaveRequests})
              </button>
            </CollapsibleContent>
          </Collapsible>

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

        {/* Workload Indicator */}
        <div className="p-4 border-t border-gray-200">
          <div className={`p-4 rounded-xl border ${
            stats.workload === 'heavy' 
              ? 'bg-red-50 border-red-200' 
              : stats.workload === 'balanced' 
              ? 'bg-yellow-50 border-yellow-200' 
              : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center gap-3 mb-2">
              <Activity className={`h-5 w-5 ${
                stats.workload === 'heavy' 
                  ? 'text-red-600' 
                  : stats.workload === 'balanced' 
                  ? 'text-yellow-600' 
                  : 'text-green-600'
              }`} />
              <span className={`font-medium ${
                stats.workload === 'heavy' 
                  ? 'text-red-900' 
                  : stats.workload === 'balanced' 
                  ? 'text-yellow-900' 
                  : 'text-green-900'
              }`}>
                Current Workload
              </span>
            </div>
            <div className={`text-lg font-bold mb-1 ${
              stats.workload === 'heavy' 
                ? 'text-red-700' 
                : stats.workload === 'balanced' 
                ? 'text-yellow-700' 
                : 'text-green-700'
            }`}>
              {stats.workload?.charAt(0).toUpperCase() + stats.workload?.slice(1)}
            </div>
            <div className={`text-sm ${
              stats.workload === 'heavy' 
                ? 'text-red-600' 
                : stats.workload === 'balanced' 
                ? 'text-yellow-600' 
                : 'text-green-600'
            }`}>
              {stats.workload === 'heavy' 
                ? 'Consider requesting help' 
                : stats.workload === 'balanced' 
                ? 'Manageable workload' 
                : 'Light workload'
              }
            </div>
          </div>
        </div>

        {/* Team Members Count */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
            <Users className="h-5 w-5 text-blue-600" />
            <div>
              <div className="text-sm font-medium text-blue-900">Team Members</div>
              <div className="text-lg font-bold text-blue-700">{stats.teamMembersCount}</div>
            </div>
          </div>
        </div>

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