import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Home,
  Users,
  Target,
  CheckSquare,
  BarChart3,
  Bell,
  User,
  Plus,
  LogOut,
  Menu,
  Settings,
  Calendar
} from 'lucide-react';
import type { DashboardView } from './types/teamLeadTypes';

interface TeamLeadSidebarProps {
  sidebarOpen: boolean;
  activeView: DashboardView;
  stats: any;
  profile: any;
  onToggleSidebar: () => void;
  onViewChange: (view: DashboardView) => void;
  onAssignTask: () => void;
  onCreateProject: () => void;
}

const navigationItems = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'team-members', label: 'Team Members', icon: Users },
  { id: 'projects', label: 'Projects', icon: Target },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'profile', label: 'Profile', icon: User },
];

export const TeamLeadSidebar = ({
  sidebarOpen,
  activeView,
  stats,
  profile,
  onToggleSidebar,
  onViewChange,
  onAssignTask,
  onCreateProject,
}: TeamLeadSidebarProps) => {
  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/90 backdrop-blur-lg border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } flex flex-col`}
        >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold">Team Lead</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSidebar}
              className="lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="p-4 border-b border-gray-200">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Team Members</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {stats.totalTeamMembers}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Active Projects</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {stats.activeProjects}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Tasks Completed</span>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  {stats.completedTasks}
                </Badge>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 space-y-2">
            <Button
              onClick={onAssignTask}
              className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Assign Task
            </Button>
            <Button
              onClick={onCreateProject}
              variant="outline"
              className="w-full justify-start gap-2"
              size="sm"
            >
              <Target className="h-4 w-4" />
              New Project
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className="w-full justify-start gap-3"
                  onClick={() => onViewChange(item.id as DashboardView)}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {item.id === 'notifications' && stats.unreadNotifications > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {stats.unreadNotifications}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={profile?.avatarUrl} />
                <AvatarFallback>
                  {profile?.fullName?.split(' ').map(n => n[0]).join('') || 'TL'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {profile?.fullName || 'Team Lead'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {profile?.department || 'Team Lead'}
                </p>
              </div>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};