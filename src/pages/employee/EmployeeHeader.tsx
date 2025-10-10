import { Bell, RefreshCw, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmployeeHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  fetchUserData: () => void;
  setActiveView: (view: string) => void; // Add this line
  unreadNotifications: number;
  pendingLeaveRequests?: number;
}

export const EmployeeHeader = ({
  sidebarOpen,
  setSidebarOpen,
  fetchUserData,
  setActiveView,
  unreadNotifications
}: EmployeeHeaderProps) => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 z-30">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-muted-foreground">Active</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchUserData}
          >
            <RefreshCw className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveView('notifications')}
            className="relative"
          >
            <Bell className="h-5 w-5" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};