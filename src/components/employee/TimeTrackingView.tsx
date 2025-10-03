import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PlayCircle, PauseCircle, Clock, Calendar, BarChart3, AlertCircle } from 'lucide-react';

interface TimeTrackingViewProps {
  workSessions: any[];
  tasks: any[];
  activeTimer: string | null;
  elapsedTime: number;
  startTimer: (taskId: string) => void;
  stopTimer: () => void;
  formatTime: (seconds: number) => string;
}

export const TimeTrackingView = ({
  workSessions,
  tasks,
  activeTimer,
  elapsedTime,
  startTimer,
  stopTimer,
  formatTime
}: TimeTrackingViewProps) => {
  // Calculate today's work sessions
  const today = new Date().toISOString().split('T')[0];
  const todaySessions = workSessions.filter(session => session.date === today);
  const todayTotalMinutes = todaySessions.reduce((total, session) => total + (session.duration || 0), 0);

  // Calculate weekly statistics
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  const weeklyData = last7Days.map(date => {
    const daySessions = workSessions.filter(session => session.date === date);
    const totalMinutes = daySessions.reduce((total, session) => total + (session.duration || 0), 0);
    
    return {
      date,
      day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      hours: Math.round((totalMinutes / 60) * 10) / 10,
      sessions: daySessions.length
    };
  });

  // Tasks available for timing (not completed and not currently being timed)
  const availableTasks = tasks.filter(task => 
    task.status !== 'completed' && task.id !== activeTimer
  );

  // Current active task
  const activeTask = tasks.find(task => task.id === activeTimer);

  // Calculate total hours across all work sessions
  const totalHoursWorked = workSessions.reduce((total, session) => 
    total + (session.duration || 0) / 60, 0
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gradient">Time Tracking</h1>
        <p className="text-muted-foreground">Monitor your work sessions and time allocation</p>
      </div>

      {/* Active Timer Section */}
      {activeTimer && activeTask && (
        <Card className="border-0 shadow-lg mb-6 border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Active Timer</h3>
                  <p className="text-muted-foreground">
                    Working on: {activeTask.title}
                  </p>
                  {activeTask.project && (
                    <p className="text-sm text-muted-foreground">
                      Project: {activeTask.project}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {formatTime(elapsedTime)}
                </div>
                <Button 
                  variant="destructive" 
                  onClick={stopTimer}
                  className="gap-2"
                >
                  <PauseCircle className="h-4 w-4" />
                  Stop Timer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(totalHoursWorked * 10) / 10}h
            </div>
            <div className="text-sm text-muted-foreground">Total Hours</div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {workSessions.length}
            </div>
            <div className="text-sm text-muted-foreground">Total Sessions</div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(todayTotalMinutes / 60)}h {todayTotalMinutes % 60}m
            </div>
            <div className="text-sm text-muted-foreground">Today</div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {availableTasks.length}
            </div>
            <div className="text-sm text-muted-foreground">Available Tasks</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Start Tasks */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5" />
              Quick Start Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availableTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{task.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {task.project && <span>{task.project}</span>}
                      <span>Estimated: {task.estimatedHours}h</span>
                      <span>Actual: {Math.round(task.actualHours * 10) / 10}h</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => startTimer(task.id)}
                    className="gap-2"
                  >
                    <PlayCircle className="h-4 w-4" />
                    Start
                  </Button>
                </div>
              ))}
              
              {availableTasks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <PlayCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No tasks available for timing</p>
                  <p className="text-sm">
                    {tasks.length === 0 
                      ? "You don't have any tasks assigned." 
                      : "All tasks are either completed or being tracked"
                    }
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Today's Summary */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {Math.round(todayTotalMinutes / 60)}h {todayTotalMinutes % 60}m
                </div>
                <p className="text-sm text-blue-700">Total time worked today</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="font-bold text-lg">{todaySessions.length}</div>
                  <div className="text-muted-foreground">Sessions</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="font-bold text-lg">
                    {todaySessions.length > 0 
                      ? Math.round(todayTotalMinutes / todaySessions.length) 
                      : 0
                    }m
                  </div>
                  <div className="text-muted-foreground">Avg. Session</div>
                </div>
              </div>

              {todaySessions.length > 0 && (
                <div>
                  <p className="font-medium text-sm mb-2">Today's Sessions</p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {todaySessions.map((session, index) => {
                      const task = tasks.find(t => t.id === session.taskId);
                      return (
                        <div key={session.id} className="flex justify-between items-center text-xs p-2 border rounded">
                          <span className="truncate flex-1">
                            {index + 1}. {task?.title || 'Unknown Task'}
                          </span>
                          <Badge variant="outline">
                            {session.duration}m
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Overview */}
        <Card className="border-0 shadow-lg lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Weekly Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-2">
                {weeklyData.map((dayData) => (
                  <div key={dayData.date} className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">{dayData.day}</div>
                    <div className="h-24 bg-gray-100 rounded-lg relative">
                      {dayData.hours > 0 && (
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-lg transition-all duration-300"
                          style={{ height: `${Math.min(dayData.hours * 15, 100)}%` }}
                        ></div>
                      )}
                    </div>
                    <div className="text-xs font-medium mt-1">{dayData.hours}h</div>
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="font-bold text-lg text-green-600">
                    {weeklyData.reduce((sum, day) => sum + day.hours, 0).toFixed(1)}h
                  </div>
                  <div className="text-green-700">Total This Week</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="font-bold text-lg text-blue-600">
                    {Math.max(...weeklyData.map(d => d.hours)).toFixed(1)}h
                  </div>
                  <div className="text-blue-700">Most Productive Day</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="font-bold text-lg text-purple-600">
                    {workSessions.length}
                  </div>
                  <div className="text-purple-700">Total Sessions</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Sessions History */}
        <Card className="border-0 shadow-lg lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Work Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workSessions.slice(-10).reverse().map((session) => {
                const task = tasks.find(t => t.id === session.taskId);
                return (
                  <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Clock className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{task?.title || 'Unknown Task'}</p>
                        <p className="text-xs text-muted-foreground">
                          {task?.project} • {new Date(session.startTime).toLocaleDateString()} • {session.duration} minutes
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {task?.priority || 'unknown'}
                    </Badge>
                  </div>
                );
              })}
              
              {workSessions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No work sessions recorded</p>
                  <p className="text-sm">Start tracking your time to see sessions here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};