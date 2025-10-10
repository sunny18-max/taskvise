// types/managerTypes.ts - Add missing types
export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  assignedBy: string;
  assignedTo: string;
  assignedToName: string;
  project: string;
  area: string;
  estimatedHours: number;
  actualHours: number;
  completedAt?: string;
  screenshot?: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  uid: string;
  email: string;
  fullName: string;
  role: string;
  department: string;
  totalTasks: number;
  completedTasks: number;
  productivity: number;
  totalHours: number;
  avatar?: string;
  lastActive: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  progress: number;
  deadline: string;
  totalTasks: number;
  completedTasks: number;
  teamMembers: string[];
  totalHours: number;
  completedHours: number;
  status: 'planning' | 'active' | 'completed' | 'on-hold';
}

export interface WorkSession {
  id: string;
  taskId: string;
  userId: string;
  employeeName: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  date: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'task_assigned' | 'task_completed' | 'project_assigned' | 'system';
  read: boolean;
  userId: string;
  taskId?: string;
  projectId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Stats {
  totalEmployees: number;
  activeEmployees: number;
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalHours: number;
  productivity: number;
  unreadNotifications: number;
}

export type DashboardView = 'overview' | 'employees' | 'projects' | 'tasks' | 'reports' | 'notifications' | 'profile' | 'leave' | 'workload-balancer' | 'skill-recommendations' | 'team-notes';

// Add these interface extensions for the view props
export interface BaseViewProps {
  tasks: Task[];
  employees: Employee[];
  projects: Project[];
  notifications: Notification[];
  stats: Stats;
  onAssignTask: () => void;
  onCreateProject: () => void;
  onViewEmployee: (employee: Employee) => void;
  onMarkNotificationAsRead: (notificationId: string) => void;
  onAddTask: (taskData: any) => Promise<boolean>;
  onUpdateTask: (taskId: string, updateData: any) => Promise<boolean>;
  onDeleteTask: (taskId: string) => Promise<boolean>;
  onAddProject: (projectData: any) => Promise<boolean>;
  onUpdateProject: (projectId: string, updateData: any) => Promise<boolean>;
  onDeleteProject: (projectId: string) => Promise<boolean>;
}