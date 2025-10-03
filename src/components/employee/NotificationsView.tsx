import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle2, Trash2, Filter, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface NotificationsViewProps {
  notifications: any[];
  setNotifications: (notifications: any[]) => void;
  markAsRead: (notificationId: string) => void;
  deleteNotification: (notificationId: string) => void;
  markAllAsRead: () => void;
}

export const NotificationsView = ({ 
  notifications, 
  setNotifications,
  markAsRead,
  deleteNotification,
  markAllAsRead
}: NotificationsViewProps) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(notif => !notif.read)
    : notifications;

  const clearAll = () => {
    // Delete all notifications via API
    notifications.forEach(notif => {
      deleteNotification(notif.id);
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return '🎯';
      case 'task_updated':
        return '📝';
      case 'task_completed':
        return '✅';
      case 'project_update':
        return '📊';
      case 'project_assigned':
        return '👥';
      case 'system':
        return '⚙️';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'task_updated':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'task_completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'project_update':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'project_assigned':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'system':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const unreadCount = notifications.filter(notif => !notif.read).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gradient">Notifications</h1>
        <p className="text-muted-foreground">Stay updated with your work activities</p>
      </div>

      {/* Notification Actions */}
      <Card className="border-0 shadow-lg mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600" />
                <span className="font-medium">
                  {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All ({notifications.length})
                </Button>
                <Button
                  variant={filter === 'unread' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('unread')}
                >
                  Unread ({unreadCount})
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Mark All Read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAll}
                  className="gap-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          {filteredNotifications.length > 0 ? (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border rounded-lg transition-all duration-200 ${
                    notification.read 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-blue-50 border-blue-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-lg ${
                        notification.read ? 'bg-gray-200' : 'bg-blue-200'
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className={`font-semibold ${
                            notification.read ? 'text-gray-700' : 'text-blue-900'
                          }`}>
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <Badge className="bg-blue-100 text-blue-800">
                              New
                            </Badge>
                          )}
                          <Badge 
                            variant="outline" 
                            className={getNotificationColor(notification.type)}
                          >
                            {notification.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        
                        <p className="text-xs text-gray-500">
                          {new Date(notification.createdAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAsRead(notification.id)}
                          className="h-8 w-8 p-0"
                          title="Mark as read"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteNotification(notification.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        title="Delete notification"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Bell className="h-8 w-8 text-gray-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No notifications
              </h3>
              <p className="text-muted-foreground">
                {filter === 'unread' 
                  ? "You're all caught up! No unread notifications."
                  : "You don't have any notifications yet."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Statistics */}
      {notifications.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{notifications.length}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {notifications.filter(n => n.type === 'task_assigned').length}
              </div>
              <div className="text-sm text-muted-foreground">Task Assignments</div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {notifications.filter(n => n.type === 'project_assigned' || n.type === 'project_update').length}
              </div>
              <div className="text-sm text-muted-foreground">Project Updates</div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {notifications.filter(n => n.type === 'task_updated' || n.type === 'task_completed').length}
              </div>
              <div className="text-sm text-muted-foreground">Task Updates</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};