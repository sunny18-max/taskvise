import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calender';
import { format, parseISO, eachDayOfInterval, isSameDay } from 'date-fns';
import { CheckCircle, XCircle, Clock, Users, Calendar as CalendarIcon } from 'lucide-react';

interface LeaveRequest {
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
  duration: number;
}

interface Employee {
  id: string;
  fullName: string;
  email: string;
  department: string;
}

interface LeaveManagementViewProps {
  employees: Employee[];
  user: any;
}

export const LeaveManagementView = ({ employees, user }: LeaveManagementViewProps) => {
  const { toast } = useToast();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending'>('pending');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const data = await makeAuthenticatedRequest(`${API_BASE_URL}/leave-requests`);
      setLeaveRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      toast({
        title: "Error",
        description: "Failed to load leave requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateLeaveRequest = async (requestId: string, status: 'approved' | 'rejected', comments?: string) => {
    try {
      await makeAuthenticatedRequest(`${API_BASE_URL}/leave-requests/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({
          status,
          reviewedBy: user?.uid,
          reviewedByName: user?.displayName || 'Manager',
          reviewedAt: new Date().toISOString(),
          comments
        })
      });

      toast({
        title: "Success",
        description: `Leave request ${status}`,
      });

      fetchLeaveRequests();
    } catch (error) {
      console.error('Error updating leave request:', error);
      toast({
        title: "Error",
        description: `Failed to ${status} leave request`,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  // Calendar date modifiers for all employees
  const getDateModifiers = () => {
    const modifiers: { [key: string]: Date[] } = {
      approved: [],
      pending: [],
    };

    leaveRequests.forEach(request => {
      if (request.status === 'cancelled' || request.status === 'rejected') return;

      const start = parseISO(request.startDate);
      const end = parseISO(request.endDate);
      const dates = eachDayOfInterval({ start, end });

      dates.forEach(date => {
        modifiers[request.status].push(date);
      });
    });

    return modifiers;
  };

  const modifiers = getDateModifiers();

  const filteredRequests = leaveRequests.filter(request => 
    filter === 'all' || request.status === filter
  );

  const pendingRequests = leaveRequests.filter(request => request.status === 'pending');

  const getStatusIcon = (status: LeaveRequest['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: LeaveRequest['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading leave data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Leave Management</h1>
        <div className="flex gap-2">
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
          >
            <Clock className="h-4 w-4 mr-2" />
            Pending ({pendingRequests.length})
          </Button>
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            <Users className="h-4 w-4 mr-2" />
            All Requests
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Calendar View */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Team Leave Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              modifiers={modifiers}
              modifierClassNames={{
                approved: 'bg-green-100 text-green-800 hover:bg-green-200',
                pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
              }}
            />
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                <span className="text-sm">Approved Leave</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
                <span className="text-sm">Pending Approval</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leave Requests Management */}
        <Card>
          <CardHeader>
            <CardTitle>
              {filter === 'pending' ? 'Pending Approval' : 'All Leave Requests'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No {filter === 'pending' ? 'pending' : ''} leave requests found
                </p>
              ) : (
                filteredRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{request.employeeName}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(request.status)}
                          <Badge variant="secondary" className={getStatusColor(request.status)}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>
                          <Badge variant="outline">{request.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(request.startDate), 'MMM dd, yyyy')} - {format(parseISO(request.endDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-sm mb-3">{request.reason}</p>
                    
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground">
                        Duration: {request.duration} day{request.duration > 1 ? 's' : ''} • 
                        Submitted: {format(parseISO(request.createdAt), 'MMM dd, yyyy')}
                      </p>
                      
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => updateLeaveRequest(request.id, 'approved')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateLeaveRequest(request.id, 'rejected')}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Pending</span>
            </div>
            <p className="text-2xl font-bold mt-2">{pendingRequests.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Approved</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {leaveRequests.filter(r => r.status === 'approved').length}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Rejected</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {leaveRequests.filter(r => r.status === 'rejected').length}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total</span>
            </div>
            <p className="text-2xl font-bold mt-2">{leaveRequests.length}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};