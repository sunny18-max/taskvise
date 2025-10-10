import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/components/auth/AuthProvider';
import { 
  Building2, 
  LogOut, 
  User, 
  Settings,
  Bell,
  Users,
  UserPlus,
  Target,
  BarChart3,
  Calendar,
  FileText
} from 'lucide-react';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';

interface DashboardLayoutProps {
  children?: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500';
      case 'manager':
        return 'bg-green-500';
      case 'hr':
        return 'bg-purple-500';
      case 'teamlead':
        return 'bg-orange-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'manager':
        return 'Manager';
      case 'hr':
        return 'HR Manager';
      case 'teamlead':
        return 'Team Lead';
      default:
        return 'Employee';
    }
  };

  // Navigation items based on role
  const getNavigationItems = () => {
    const baseItems = [
      { path: '/profile', label: 'Profile', icon: User },
      { path: '/settings', label: 'Settings', icon: Settings },
    ];

    switch (profile?.role) {
      case 'admin':
        return [
          { path: '/admin/dashboard', label: 'Dashboard', icon: Building2 },
          { path: '/admin/employees', label: 'Employees', icon: Users },
          { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
          { path: '/admin/reports', label: 'Reports', icon: FileText },
          ...baseItems
        ];
      case 'manager':
        return [
          { path: '/manager/dashboard', label: 'Dashboard', icon: Building2 },
          { path: '/manager/team', label: 'My Team', icon: Users },
          { path: '/manager/projects', label: 'Projects', icon: Target },
          { path: '/manager/calendar', label: 'Calendar', icon: Calendar },
          ...baseItems
        ];
      case 'hr':
        return [
          { path: '/hr/dashboard', label: 'Dashboard', icon: Building2 },
          { path: '/hr/employees', label: 'Employees', icon: Users },
          { path: '/hr/recruitment', label: 'Recruitment', icon: UserPlus },
          { path: '/hr/attendance', label: 'Attendance', icon: Calendar },
          { path: '/hr/reports', label: 'HR Reports', icon: FileText },
          ...baseItems
        ];
      case 'teamlead':
        return [
          { path: '/teamlead/dashboard', label: 'Dashboard', icon: Building2 },
          { path: '/teamlead/team', label: 'My Team', icon: Users },
          { path: '/teamlead/projects', label: 'Projects', icon: Target },
          { path: '/teamlead/tasks', label: 'Tasks', icon: FileText },
          ...baseItems
        ];
      case 'employee':
        return [
          { path: '/employee/dashboard', label: 'Dashboard', icon: Building2 },
          { path: '/employee/tasks', label: 'My Tasks', icon: FileText },
          { path: '/employee/schedule', label: 'Schedule', icon: Calendar },
          ...baseItems
        ];
      default:
        return baseItems;
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex h-16 items-center justify-between px-6">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-gradient-primary">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-gradient">TaskVise</span>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {getRoleName(profile?.role || 'employee')} Portal
                </p>
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={`${getRoleColor(profile?.role || 'employee')} text-white text-xs`}>
                      {profile?.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{profile?.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {profile?.email}
                    </p>
                    <p className="text-xs text-primary font-medium">
                      {getRoleName(profile?.role || 'employee')}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content - REMOVED SIDEBAR LAYOUT */}
      <div className="flex flex-col flex-1">
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children || <Outlet />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};