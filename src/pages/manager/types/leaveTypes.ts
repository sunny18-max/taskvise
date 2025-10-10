// types/leaveTypes.ts
export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail?: string;
  startDate: string;
  endDate: string;
  type: 'sick' | 'vacation' | 'personal' | 'emergency' | 'other';
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  comments?: string;
  duration: number; // in days
}

export type LeaveType = 'sick' | 'vacation' | 'personal' | 'emergency' | 'other';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';