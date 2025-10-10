import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Home,
  Users,
  UserPlus,
  Calendar,
  BarChart3,
  Bell,
  User,
  Plus,
  LogOut,
  Menu,
  Settings
} from 'lucide-react';
import type { DashboardView } from './types/hrTypes';

interface HRSidebarProps {
  sidebarOpen: boolean;
  activeView: DashboardView;
  stats: any;
  profile: any;
  onToggleSidebar: () => void;
  onViewChange: (view: DashboardView) => void;
  onAddEmployee: () => void;
}

const navigationItems = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'employees', label: 'Employees', icon: Users },
  { id: 'recruitment', label: 'Recruitment', icon: UserPlus },
  { id: 'attendance', label: 'Attendance', icon: Calendar },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'profile', label: 'Profile', icon: User },
];

export const HRSidebar = ({
  sidebarOpen,
  activeView,
  stats,
  profile,
  onToggleSidebar,
  onViewChange,
  onAddEmployee,
}: HRSidebarProps) => {
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
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold">HR Manager</span>
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

          {/* Quick Actions */}
          <div className="p-4 space-y-2">
            <Button
              onClick={onAddEmployee}
              className="w-full justify-start gap-2 bg-purple-600 hover:bg-purple-700"
              size="sm"
            >
              <UserPlus className="h-4 w-4" />
              Add Employee
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              size="sm"
            >
              <Calendar className="h-4 w-4" />
              Manage Leaves
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
                  {profile?.fullName?.split(' ').map(n => n[0]).join('') || 'HR'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {profile?.fullName || 'HR Manager'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {profile?.department || 'Human Resources'}
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