import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Target, 
  Zap,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

interface Employee {
  id: string;
  fullName: string;
  email: string;
  role: string;
  department: string;
  skills: string[];
  currentWorkload: number;
  maxCapacity: number;
  assignedTasks: number;
  completedTasks: number;
  productivity: number;
}

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedHours: number;
  requiredSkills: string[];
  status: 'pending' | 'in-progress' | 'completed';
  assignedTo?: string;
}

interface WorkloadBalancerProps {
  employees: Employee[];
  tasks: Task[];
  onAssignTask: (taskId: string, employeeId: string) => void;
}

export const WorkloadBalancer = ({ employees, tasks, onAssignTask }: WorkloadBalancerProps) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Calculate optimal assignments
  const getOptimalAssignments = () => {
    const unassignedTasks = tasks.filter(task => !task.assignedTo && task.status === 'pending');
    const assignments: { task: Task; employee: Employee; score: number }[] = [];

    unassignedTasks.forEach(task => {
      const employeeScores = employees.map(employee => {
        let score = 0;

        // Workload factor (40% weight)
        const workloadPercentage = (employee.currentWorkload / employee.maxCapacity) * 100;
        const workloadScore = Math.max(0, 100 - workloadPercentage);
        score += workloadScore * 0.4;

        // Skill match factor (35% weight)
        const skillMatch = task.requiredSkills.filter(skill => 
          employee.skills.includes(skill)
        ).length / task.requiredSkills.length;
        score += skillMatch * 100 * 0.35;

        // Productivity factor (25% weight)
        score += employee.productivity * 0.25;

        // Penalty for overload
        if (workloadPercentage > 90) {
          score *= 0.5; // Reduce score by 50% if nearly overloaded
        }

        return { employee, score };
      });

      // Sort by score and take top 3
      const topCandidates = employeeScores
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      topCandidates.forEach(candidate => {
        assignments.push({
          task,
          employee: candidate.employee,
          score: candidate.score
        });
      });
    });

    return assignments;
  };

  const optimalAssignments = getOptimalAssignments();
  const unassignedTasks = tasks.filter(task => !task.assignedTo && task.status === 'pending');

  const getWorkloadColor = (percentage: number) => {
    if (percentage < 60) return 'text-green-600';
    if (percentage < 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getWorkloadIcon = (percentage: number) => {
    if (percentage < 60) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (percentage < 85) return <Clock className="h-4 w-4 text-yellow-600" />;
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  const handleAutoAssign = () => {
    optimalAssignments.forEach(assignment => {
      if (assignment.score > 70) { // Only assign if confidence is high
        onAssignTask(assignment.task.id, assignment.employee.id);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Workload Balancer</h2>
          <p className="text-gray-600 mt-1">
            Optimize task assignments based on availability, skills, and workload
          </p>
        </div>
        <Button onClick={handleAutoAssign} className="bg-gradient-to-r from-blue-600 to-purple-600">
          <Zap className="h-4 w-4 mr-2" />
          Auto-Assign Tasks
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Workload Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Team Workload Distribution
            </CardTitle>
            <CardDescription>
              Current workload and capacity of your team members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {employees.map(employee => {
                const workloadPercentage = (employee.currentWorkload / employee.maxCapacity) * 100;
                return (
                  <div key={employee.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {employee.fullName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{employee.fullName}</div>
                          <div className="text-xs text-gray-500">{employee.department}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${getWorkloadColor(workloadPercentage)}`}>
                          {workloadPercentage.toFixed(0)}%
                        </span>
                        {getWorkloadIcon(workloadPercentage)}
                      </div>
                    </div>
                    <Progress value={workloadPercentage} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{employee.assignedTasks} tasks assigned</span>
                      <span>{employee.completedTasks} completed</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Optimal Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              Recommended Assignments
            </CardTitle>
            <CardDescription>
              AI-suggested optimal task assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {optimalAssignments.length > 0 ? (
                optimalAssignments.map((assignment, index) => (
                  <div key={`${assignment.task.id}-${assignment.employee.id}`} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm mb-1">{assignment.task.title}</div>
                        <div className="text-xs text-gray-500 mb-2">
                          Requires: {assignment.task.requiredSkills.join(', ')}
                        </div>
                      </div>
                      <Badge variant={assignment.score > 80 ? 'default' : 'secondary'} className="ml-2">
                        {assignment.score.toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs">
                          {assignment.employee.fullName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-xs text-gray-600">{assignment.employee.fullName}</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => onAssignTask(assignment.task.id, assignment.employee.id)}
                        disabled={assignment.score < 60}
                      >
                        Assign
                      </Button>
                    </div>
                    {assignment.score < 60 && (
                      <div className="text-xs text-yellow-600 mt-2 text-center">
                        Low confidence score - manual review recommended
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p>All tasks are optimally assigned!</p>
                  <p className="text-sm">No additional assignments needed</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unassigned Tasks Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Unassigned Tasks Overview</CardTitle>
          <CardDescription>
            {unassignedTasks.length} tasks waiting for assignment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">{unassignedTasks.length}</div>
              <div className="text-sm text-gray-600">Total Unassigned</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {unassignedTasks.filter(t => t.priority === 'high').length}
              </div>
              <div className="text-sm text-gray-600">High Priority</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {unassignedTasks.reduce((sum, task) => sum + task.estimatedHours, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Hours</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};