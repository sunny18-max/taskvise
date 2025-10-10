// views/NotificationsView.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, RefreshCw, Bell } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import type { Notification } from '../types/managerTypes';

interface NotificationsViewProps {
  notifications?: Notification[];
  onMarkNotificationAsRead?: (notificationId: string) => void;
  showMarkAllAsRead?: boolean;
}

export const NotificationsView = ({ 
  notifications: externalNotifications, 
  onMarkNotificationAsRead: externalMarkAsRead,
  showMarkAllAsRead = true 
}: NotificationsViewProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  // Use external notifications if provided, otherwise fetch internally
  const displayNotifications = externalNotifications || notifications;

  // Fetch notifications if not provided externally
  useEffect(() => {
    if (!externalNotifications) {
      fetchNotifications();
    }
  }, [externalNotifications]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken(); // You'll need to implement this based on your auth setup
      
      const response = await fetch('/api/notifications/my-notifications?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshNotifications = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
    toast({
      title: 'Refreshed',
      description: 'Notifications updated',
    });
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );

      // Call external handler if provided
      if (externalMarkAsRead) {
        externalMarkAsRead(notificationId);
      }

      toast({
        title: 'Success',
        description: 'Notification marked as read',
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = await getAuthToken();
      
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );

      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        variant: 'destructive',
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return '📋';
      case 'task_completed':
        return '✅';
      case 'project_assigned':
        return '📁';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return 'border-l-blue-500';
      case 'task_completed':
        return 'border-l-green-500';
      case 'project_assigned':
        return 'border-l-purple-500';
      default:
        return 'border-l-orange-500';
    }
  };

  // Helper function to get auth token (you'll need to implement this based on your auth setup)
  const getAuthToken = async (): Promise<string> => {
    // This depends on how you handle authentication in your app
    // Example implementations:
    
    // If using Firebase Auth:
    // const user = auth.currentUser;
    // return user ? await user.getIdToken() : '';
    
    // If storing token in localStorage:
    // return localStorage.getItem('authToken') || '';
    
    // If using context:
    // const { user } = useAuth();
    // return user?.token || '';
    
    // For now, return empty string - you'll need to implement this
    return '';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const unreadCount = displayNotifications.filter(notif => !notif.read).length;

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gradient flex items-center gap-2">
              <Bell className="h-8 w-8" />
              Notifications
            </h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 
                ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                : 'All caught up!'
              }
            </p>
          </div>
          <div className="flex gap-2">
            {showMarkAllAsRead && unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={markAllAsRead}
                disabled={refreshing}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark All as Read
              </Button>
            )}
            <Button
              variant="outline"
              onClick={refreshNotifications}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {displayNotifications.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notifications</h3>
              <p className="text-muted-foreground">
                You're all caught up! Notifications will appear here when you have new updates.
              </p>
            </CardContent>
          </Card>
        ) : (
          displayNotifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`border-0 shadow-lg transition-all duration-300 hover:shadow-xl ${
                notification.read 
                  ? 'opacity-75 hover:opacity-100' 
                  : `${getNotificationColor(notification.type)} border-l-4 bg-blue-50/50 dark:bg-blue-950/20`
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-2xl mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{notification.title}</h3>
                        {!notification.read && (
                          <Badge variant="default" className="bg-blue-500">
                            New
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {notification.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-3">{notification.message}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                          {new Date(notification.createdAt).toLocaleTimeString()}
                        </span>
                        {notification.taskId && (
                          <Badge variant="secondary" className="text-xs">
                            Task: {notification.taskId.slice(0, 8)}...
                          </Badge>
                        )}
                        {notification.projectId && (
                          <Badge variant="secondary" className="text-xs">
                            Project: {notification.projectId.slice(0, 8)}...
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markNotificationAsRead(notification.id)}
                      className="ml-4"
                      title="Mark as read"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsView;