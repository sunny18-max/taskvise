import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calendar, FileText, Settings, Users, BarChart3 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';

export const QuickActions = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const getActionsForRole = () => {
    const role = profile?.role || 'employee';
    
    if (role === 'admin') {
      return [
        { icon: Users, label: 'Add Employee', action: () => navigate('/admin/users'), variant: 'default' as const },
        { icon: Plus, label: 'New Project', action: () => navigate('/admin/projects'), variant: 'default' as const },
        { icon: BarChart3, label: 'View Reports', action: () => navigate('/admin/reports'), variant: 'outline' as const },
        { icon: Settings, label: 'System Settings', action: () => navigate('/admin/settings'), variant: 'outline' as const },
      ];
    } else if (role === 'manager') {
      return [
        { icon: Plus, label: 'Assign Task', action: () => navigate('/manager/tasks'), variant: 'default' as const },
        { icon: Calendar, label: 'Team Calendar', action: () => navigate('/manager/workload'), variant: 'default' as const },
        { icon: FileText, label: 'Leave Requests', action: () => navigate('/manager/leave'), variant: 'outline' as const },
        { icon: BarChart3, label: 'Team Reports', action: () => navigate('/manager/reports'), variant: 'outline' as const },
      ];
    } else {
      return [
        { icon: Plus, label: 'Update Task', action: () => navigate('/employee/tasks'), variant: 'default' as const },
        { icon: Calendar, label: 'Request Leave', action: () => navigate('/employee/leave'), variant: 'default' as const },
        { icon: FileText, label: 'My Reports', action: () => navigate('/employee/reports'), variant: 'outline' as const },
        { icon: Settings, label: 'Profile', action: () => navigate('/profile'), variant: 'outline' as const },
      ];
    }
  };

  return (
    <Card className="card-professional border-0 shadow-[var(--shadow-card)]">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-gradient-primary"></div>
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {getActionsForRole().map((action, index) => (
            <Button
              key={action.label}
              variant={action.variant}
              className="justify-start gap-3 h-auto py-3 px-4 transition-all duration-200 hover:scale-105"
              onClick={action.action}
            >
              <action.icon className="h-4 w-4" />
              <span>{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};