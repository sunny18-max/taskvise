export type DashboardView = 
  | 'overview' 
  | 'employees' 
  | 'recruitment' 
  | 'attendance' 
  | 'reports' 
  | 'notifications' 
  | 'profile';

export interface Employee {
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
  totalTasks?: number;
  completedTasks?: number;
  productivity?: number;
  totalHours?: number;
  avatarUrl?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  type: 'vacation' | 'sick' | 'personal' | 'emergency' | 'other';
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  duration: number;
  createdAt: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  comments?: string;
}

export interface Attendance {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  present: boolean;
  hoursWorked?: number;
  status: 'present' | 'absent' | 'late' | 'half-day';
  notes?: string;
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

export interface HRStats {
  totalEmployees: number;
  activeEmployees: number;
  newHiresThisMonth: number;
  pendingApprovals: number;
  attendanceRate: number;
  unreadNotifications: number;
}