import { useState } from 'react';
import { Activity, Users, AlertCircle, CheckCircle, Clock, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  assignedBy: string;
  assignedByName: string;
  project: string;
  area: string;
  estimatedHours: number;
  actualHours: number;
  completedAt?: string;
  createdAt: string;
  assignedTo: string;
  assignedToName: string;
  helpRequested?: boolean;
  collaborators?: string[];
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  projects: string[];
  department: string;
  avatar?: string;
  currentWorkload?: 'light' | 'balanced' | 'heavy';
  fullName?: string; // Added to match OverviewView structure
}

interface HelpRequest {
  id: string;
  taskId: string;
  taskTitle: string;
  requesterId: string;
  requesterName: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  createdAt: string;
  collaborators?: string[];
}

interface WorkloadViewProps {
  tasks: Task[];
  projects: any[];
  teamMembers: TeamMember[];
  workload: 'light' | 'balanced' | 'heavy';
  getWorkloadColor: (workload: string) => string;
  requestHelp: (taskId: string, message: string) => void;
  helpRequests: HelpRequest[];
}

export const WorkloadView = ({
  tasks,
  projects,
  teamMembers,
  workload,
  getWorkloadColor,
  requestHelp,
  helpRequests
}: WorkloadViewProps) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [helpMessage, setHelpMessage] = useState('');
  const [selectedTeammate, setSelectedTeammate] = useState('');

  const pendingTasks = tasks.filter(task => 
    task.status === 'pending' || task.status === 'in-progress'
  );
  
  const highPriorityTasks = tasks.filter(task => 
    task.priority === 'high' && (task.status === 'pending' || task.status === 'in-progress')
  );

  const overdueTasks = tasks.filter(task => task.status === 'overdue');

  // Filter out managers, admins, and HRs - only show regular employees
  const filteredTeamMembers = teamMembers.filter(member => {
    const role = member.role?.toLowerCase() || '';
    const name = member.name || member.fullName || '';
    return !role.includes('manager') && 
           !role.includes('admin') && 
           !role.includes('hr') &&
           !role.includes('teamhead') &&
           (role.includes('employee') || name !== '');
  });

  // Safe function to get initials from name (using logic from OverviewView)
  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
  };

  // Get display name - prioritize fullName, then name, then fallback
  const getDisplayName = (member: TeamMember) => {
    return member.fullName || member.name || 'Employee';
  };

  const calculateTeamWorkload = (member: TeamMember) => {
    const memberTasks = tasks.filter(task => task.assignedTo === member.id);
    const pendingMemberTasks = memberTasks.filter(task => 
      task.status === 'pending' || task.status === 'in-progress'
    );
    
    const highPriorityMemberTasks = memberTasks.filter(task => 
      task.priority === 'high' && (task.status === 'pending' || task.status === 'in-progress')
    );

    const overdueMemberTasks = memberTasks.filter(task => task.status === 'overdue');

    if (overdueMemberTasks.length > 2 || highPriorityMemberTasks.length > 3 || pendingMemberTasks.length > 8) {
      return 'heavy';
    } else if (pendingMemberTasks.length > 4 || highPriorityMemberTasks.length > 1) {
      return 'balanced';
    } else {
      return 'light';
    }
  };

  const handleRequestHelp = () => {
    if (selectedTask && helpMessage.trim()) {
      requestHelp(selectedTask.id, helpMessage);
      setHelpMessage('');
      setSelectedTask(null);
    }
  };

  const getWorkloadIcon = (workloadLevel: string) => {
    switch (workloadLevel) {
      case 'heavy':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'balanced':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workload & Collaboration</h1>
          <p className="text-gray-600 mt-2">Monitor your workload and get help from teammates</p>
        </div>
      </div>

      {/* Workload Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Your Current Workload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getWorkloadColor(workload)} mb-3`}>
              {getWorkloadIcon(workload)}
              {workload.charAt(0).toUpperCase() + workload.slice(1)}
            </div>
            <p className="text-sm text-gray-600">
              {workload === 'heavy' 
                ? 'You have a heavy workload. Consider requesting help or prioritizing tasks.'
                : workload === 'balanced'
                ? 'Your workload is manageable. Keep up the good work!'
                : 'Your workload is light. You can take on more tasks if needed.'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Task Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pending Tasks</span>
                <span className="font-medium">{pendingTasks.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">High Priority</span>
                <span className="font-medium text-red-600">{highPriorityTasks.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Overdue</span>
                <span className="font-medium text-red-600">{overdueTasks.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Help Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Requests</span>
                <span className="font-medium">{helpRequests.filter(req => req.status === 'pending').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="font-medium text-green-600">{helpRequests.filter(req => req.status === 'completed').length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks Needing Help */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Tasks That Might Need Help
            </CardTitle>
            <CardDescription>
              Tasks that are overdue, high priority, or taking longer than expected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks
                .filter(task => 
                  task.status === 'overdue' || 
                  (task.priority === 'high' && task.status !== 'completed') ||
                  (task.estimatedHours > 0 && task.actualHours > task.estimatedHours * 1.5)
                )
                .map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{task.title}</span>
                        <Badge variant={task.status === 'overdue' ? 'destructive' : 'secondary'} className="text-xs">
                          {task.status}
                        </Badge>
                        {task.priority === 'high' && (
                          <Badge variant="destructive" className="text-xs">High Priority</Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedTask(task)}
                        >
                          Request Help
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Request Help for Task</DialogTitle>
                          <DialogDescription>
                            Describe what kind of help you need for "{task.title}"
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Help Message</label>
                            <Textarea
                              placeholder="Describe what you need help with..."
                              value={helpMessage}
                              onChange={(e) => setHelpMessage(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Suggest Teammate (Optional)</label>
                            <Select value={selectedTeammate} onValueChange={setSelectedTeammate}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a teammate" />
                              </SelectTrigger>
                              <SelectContent>
                                {filteredTeamMembers
                                  .filter(member => member.id !== task.assignedTo)
                                  .map(member => {
                                    const memberWorkload = calculateTeamWorkload(member);
                                    return (
                                      <SelectItem key={member.id} value={member.id}>
                                        {getDisplayName(member)} - {member.role} ({memberWorkload})
                                      </SelectItem>
                                    );
                                  })
                                }
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setSelectedTask(null)}>
                            Cancel
                          </Button>
                          <Button onClick={handleRequestHelp} disabled={!helpMessage.trim()}>
                            Send Help Request
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                ))
              }
              {tasks.filter(task => 
                task.status === 'overdue' || 
                (task.priority === 'high' && task.status !== 'completed') ||
                (task.estimatedHours > 0 && task.actualHours > task.estimatedHours * 1.5)
              ).length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p>No tasks currently need help. Great job!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team Workload Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Team Workload
            </CardTitle>
            <CardDescription>
              Current workload status of your teammates (Employees only)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredTeamMembers && filteredTeamMembers.length > 0 ? (
                filteredTeamMembers.map(member => {
                  const memberWorkload = calculateTeamWorkload(member);
                  const memberTasks = tasks.filter(task => task.assignedTo === member.id);
                  const pendingMemberTasks = memberTasks.filter(task => 
                    task.status === 'pending' || task.status === 'in-progress'
                  );

                  return (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {/* Using the same avatar logic from OverviewView */}
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {getInitials(getDisplayName(member))}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{getDisplayName(member)}</div>
                          <div className="text-xs text-gray-500 capitalize">{member.role || 'Employee'}</div>
                          {member.department && (
                            <div className="text-xs text-gray-400">{member.department}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{pendingMemberTasks.length} tasks</span>
                        <Badge 
                          variant={
                            memberWorkload === 'heavy' ? 'destructive' : 
                            memberWorkload === 'balanced' ? 'secondary' : 'default'
                          }
                          className="text-xs"
                        >
                          {getWorkloadIcon(memberWorkload)}
                          {memberWorkload}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p>No team members found</p>
                  <p className="text-sm">Team members will appear here when available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Help Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-purple-500" />
            My Help Requests
          </CardTitle>
          <CardDescription>
            Track your requests for help from teammates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {helpRequests && helpRequests.length > 0 ? (
              helpRequests.map(request => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{request.taskTitle}</span>
                      <Badge 
                        variant={
                          request.status === 'pending' ? 'secondary' :
                          request.status === 'accepted' ? 'default' :
                          request.status === 'completed' ? 'default' : 'destructive'
                        }
                        className={
                          request.status === 'completed' ? 'bg-green-100 text-green-800' : ''
                        }
                      >
                        {request.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{request.message}</p>
                    <div className="text-xs text-gray-500">
                      Requested on {new Date(request.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {request.collaborators && request.collaborators.length > 0 && (
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-700">Helpers</div>
                      <div className="text-xs text-gray-500">
                        {request.collaborators.map(id => {
                          const helper = teamMembers.find(m => m.id === id);
                          return helper ? getDisplayName(helper) : 'Unknown Teammate';
                        }).join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p>No help requests yet</p>
                <p className="text-sm">Request help on tasks that need assistance</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};