// DashboardLayout.tsx - Updated
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
  Menu,
  X
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
          { path: '/admin/employees', label: 'Employees', icon: User },
          ...baseItems
        ];
      case 'manager':
        return [
          { path: '/manager/dashboard', label: 'Dashboard', icon: Building2 },
          ...baseItems
        ];
      case 'employee':
        return [
          { path: '/employee/dashboard', label: 'Dashboard', icon: Building2 },
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
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-primary">
                <Building2 className="h-5 w-5 text-white" />
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

      {/* Sidebar for mobile */}
      {sidebarOpen && (
        <div className="md:hidden">
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed top-16 left-0 z-50 w-64 h-[calc(100vh-4rem)] bg-background border-r p-4">
            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <Button
                  key={item.path}
                  variant={location.pathname === item.path ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {children || <Outlet />}
      </main>
    </div>
  );
};