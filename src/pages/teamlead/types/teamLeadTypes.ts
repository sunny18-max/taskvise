export type DashboardView = 
  | 'overview' 
  | 'team-members' 
  | 'projects' 
  | 'tasks' 
  | 'reports' 
  | 'notifications' 
  | 'profile';

export interface TeamMember {
  id: string;
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  designation: string;
  role: string;
  department: string;
  skills: string[];
  isActive: boolean;
  onLeave: boolean;
  joinDate: string;
  lastActive: string;
  totalTasks: number;
  completedTasks: number;
  productivity: number;
  totalHours: number;
  projects: number;
  avatarUrl?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  assignedTo: string;
  assignedToName: string;
  assignedBy: string;
  assignedByName: string;
  project: string;
  projectName: string;
  estimatedHours: number;
  actualHours: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  progress: number;
  deadline: string;
  teamLead: string;
  teamMembers: string[];
  teamMemberNames: string[];
  totalTasks: number;
  completedTasks: number;
  totalHours: number;
  completedHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  userId: string;
  createdAt: string;
  relatedId?: string;
}

export interface TeamLeadStats {
  totalTeamMembers: number;
  activeTeamMembers: number;
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalHours: number;
  productivity: number;
  unreadNotifications: number;
}