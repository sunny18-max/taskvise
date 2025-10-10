import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calender';
import { format, parseISO, eachDayOfInterval } from 'date-fns';
import { Plus, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Calendar as CalendarIcon, Users, BarChart3 } from 'lucide-react';

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  type: 'sick' | 'vacation' | 'personal' | 'emergency' | 'other';
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  duration: number;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  comments?: string;
}

interface LeaveStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  totalDays: number;
  byType: {
    vacation: number;
    sick: number;
    personal: number;
    emergency: number;
    other: number;
  };
}

interface LeaveManagementViewProps {
  employeeId: string;
  employeeName: string;
  userRole?: string;
}

export const LeaveManagementView = ({ 
  employeeId, 
  employeeName,
  userRole = 'employee'
}: LeaveManagementViewProps) => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveStats, setLeaveStats] = useState<LeaveStats | null>(null);
  const [teamCalendar, setTeamCalendar] = useState<LeaveRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'my-leaves' | 'team-calendar' | 'stats'>('my-leaves');

  const [newRequest, setNewRequest] = useState({
    startDate: '',
    endDate: '',
    type: 'vacation' as LeaveRequest['type'],
    reason: ''
  });

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        // Handle 404 specifically for "no leave requests found" scenario
        if (response.status === 404 && endpoint.includes('/leave-requests')) {
          // Return empty array for 404 on leave requests (no requests exist yet)
          if (endpoint.includes('/my-requests') || endpoint.includes('/team-calendar')) {
            return [];
          }
          // Return null for 404 on stats
          if (endpoint.includes('/stats')) {
            return null;
          }
        }

        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || `HTTP Error: ${response.status}` };
        }
        throw new Error(errorData.message || errorData.error || `Request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      
      const data = await apiCall(`/leave-requests/my-requests`);
      
      if (Array.isArray(data)) {
        setLeaveRequests(data);
      } else {
        // If data is not an array (might be null or undefined), set empty array
        setLeaveRequests([]);
      }
    } catch (error: any) {
      console.error('Error fetching leave requests:', error);
      
      // Don't show error toast for "no requests found" scenario
      if (!error.message.includes('Leave request not found') && !error.message.includes('404')) {
        toast({
          title: "Error",
          description: error.message || "Failed to load leave requests",
          variant: "destructive",
        });
      }
      
      setLeaveRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveStats = async () => {
    try {
      setStatsLoading(true);
      const data = await apiCall(`/leave-requests/stats/employee/${employeeId}`);
      
      if (data) {
        setLeaveStats(data);
      } else {
        // Set default stats if no data found
        setLeaveStats({
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          cancelled: 0,
          totalDays: 0,
          byType: {
            vacation: 0,
            sick: 0,
            personal: 0,
            emergency: 0,
            other: 0
          }
        });
      }
    } catch (error: any) {
      console.error('Error fetching leave stats:', error);
      
      // Only show error if it's not a "not found" scenario
      if (!error.message.includes('404')) {
        toast({
          title: "Error",
          description: "Failed to load leave statistics",
          variant: "destructive",
        });
      }
      
      // Set default stats on error
      setLeaveStats({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
        totalDays: 0,
        byType: {
          vacation: 0,
          sick: 0,
          personal: 0,
          emergency: 0,
          other: 0
        }
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchTeamCalendar = async () => {
    try {
      if (userRole !== 'admin' && userRole !== 'manager') return;
      
      setLoading(true);
      const data = await apiCall('/leave-requests/team-calendar');
      setTeamCalendar(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error fetching team calendar:', error);
      
      // Don't show error for "no team requests" scenario
      if (!error.message.includes('404')) {
        toast({
          title: "Error",
          description: "Failed to load team calendar",
          variant: "destructive",
        });
      }
      
      setTeamCalendar([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchLeaveRequests();
    if (activeTab === 'stats') fetchLeaveStats();
    if (activeTab === 'team-calendar') fetchTeamCalendar();
  };

  useEffect(() => {
    if (employeeId) {
      fetchLeaveRequests();
      fetchLeaveStats();
    }
  }, [employeeId]);

  useEffect(() => {
    if (activeTab === 'team-calendar') {
      fetchTeamCalendar();
    }
  }, [activeTab]);

  const createLeaveRequest = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);

      if (!newRequest.startDate || !newRequest.endDate || !newRequest.reason.trim()) {
        toast({
          title: "Missing Information",
          description: "Please fill all required fields",
          variant: "destructive",
        });
        return;
      }

      const start = new Date(newRequest.startDate);
      const end = new Date(newRequest.endDate);
      
      if (start > end) {
        toast({
          title: "Invalid Dates",
          description: "End date cannot be before start date",
          variant: "destructive",
        });
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (start < today) {
        toast({
          title: "Invalid Start Date",
          description: "Start date cannot be in the past",
          variant: "destructive",
        });
        return;
      }

      const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const requestData = {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        type: newRequest.type,
        reason: newRequest.reason.trim(),
        employeeId: employeeId,
        employeeName: employeeName,
        duration: duration
      };

      await apiCall('/leave-requests', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      toast({
        title: "Success!",
        description: "Your leave request has been submitted for approval",
      });

      setShowNewRequest(false);
      setNewRequest({ 
        startDate: '', 
        endDate: '', 
        type: 'vacation', 
        reason: '' 
      });
      
      await fetchLeaveRequests();
      await fetchLeaveStats();
      
    } catch (error: any) {
      console.error('Error creating leave request:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit leave request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const cancelLeaveRequest = async (requestId: string) => {
    try {
      await apiCall(`/leave-requests/${requestId}/cancel`, {
        method: 'PUT'
      });

      toast({
        title: "Request Cancelled",
        description: "Your leave request has been cancelled",
      });

      await fetchLeaveRequests();
      await fetchLeaveStats();

    } catch (error: any) {
      console.error('Error cancelling leave request:', error);
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel leave request",
        variant: "destructive",
      });
    }
  };

  const updateLeaveRequestStatus = async (requestId: string, status: 'approved' | 'rejected', comments?: string) => {
    try {
      await apiCall(`/leave-requests/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({ status, comments })
      });

      toast({
        title: "Status Updated",
        description: `Leave request ${status} successfully`,
      });

      await fetchLeaveRequests();
      if (activeTab === 'team-calendar') {
        await fetchTeamCalendar();
      }

    } catch (error: any) {
      console.error('Error updating leave request:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update leave request",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: LeaveRequest['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: LeaveRequest['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: LeaveRequest['type']) => {
    switch (type) {
      case 'vacation':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sick':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'personal':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'emergency':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCalendarModifiers = () => {
    const modifiers: any = {
      approved: [],
      pending: [],
      rejected: []
    };

    leaveRequests.forEach(request => {
      if (request.status === 'cancelled') return;

      try {
        const start = parseISO(request.startDate);
        const end = parseISO(request.endDate);
        
        const dateRange = eachDayOfInterval({ start, end });
        
        dateRange.forEach(date => {
          modifiers[request.status].push(date);
        });
      } catch (error) {
        console.error('Error processing date interval for request:', request.id, error);
      }
    });

    return modifiers;
  };

  const calendarModifiers = getCalendarModifiers();

  const renderMyLeaves = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>My Leave Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
            modifiers={calendarModifiers}
            modifierClassNames={{
              approved: 'bg-green-100 text-green-800 hover:bg-green-200',
              pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
              rejected: 'bg-red-100 text-red-800 hover:bg-red-200',
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
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
              <span className="text-sm">Rejected Leave</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading leave requests...</p>
              </div>
            ) : leaveRequests.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground mb-2">No leave requests found</div>
                <Button 
                  onClick={() => setShowNewRequest(true)}
                  variant="outline"
                  size="sm"
                >
                  Create Your First Request
                </Button>
              </div>
            ) : (
              leaveRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {getStatusIcon(request.status)}
                        <Badge variant="secondary" className={getStatusColor(request.status)}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>
                        <Badge variant="outline" className={getTypeColor(request.type)}>
                          {request.type.charAt(0).toUpperCase() + request.type.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(request.startDate), 'MMM dd, yyyy')} - {format(parseISO(request.endDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    {request.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelLeaveRequest(request.id)}
                        className="ml-2"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                  
                  <p className="text-sm mb-2">{request.reason}</p>
                  
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>
                      Duration: {request.duration} day{request.duration > 1 ? 's' : ''}
                    </span>
                    <span>
                      Submitted: {format(parseISO(request.createdAt), 'MMM dd, yyyy')}
                    </span>
                  </div>

                  {(request.status === 'approved' || request.status === 'rejected') && request.reviewedByName && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                      <span className="font-medium">
                        {request.status === 'approved' ? 'Approved' : 'Rejected'} by {request.reviewedByName}
                      </span>
                      {request.reviewedAt && (
                        <span className="ml-2">
                          on {format(parseISO(request.reviewedAt), 'MMM dd, yyyy')}
                        </span>
                      )}
                      {request.comments && (
                        <div className="mt-1">Comment: {request.comments}</div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTeamCalendar = () => (
    <Card>
      <CardHeader>
        <CardTitle>Team Leave Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading team calendar...</p>
            </div>
          ) : teamCalendar.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">No team leave requests found</div>
            </div>
          ) : (
            teamCalendar.map((request) => (
              <div key={request.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {getStatusIcon(request.status)}
                      <Badge variant="secondary" className={getStatusColor(request.status)}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                      <Badge variant="outline" className={getTypeColor(request.type)}>
                        {request.type.charAt(0).toUpperCase() + request.type.slice(1)}
                      </Badge>
                    </div>
                    <p className="font-medium">{request.employeeName}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(request.startDate), 'MMM dd, yyyy')} - {format(parseISO(request.endDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  {request.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateLeaveRequestStatus(request.id, 'approved')}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateLeaveRequestStatus(request.id, 'rejected')}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
                
                <p className="text-sm mb-2">{request.reason}</p>
                
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>
                    Duration: {request.duration} day{request.duration > 1 ? 's' : ''}
                  </span>
                  <span>
                    Submitted: {format(parseISO(request.createdAt), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderStats = () => (
    <div className="space-y-6">
      {statsLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading statistics...</p>
        </div>
      ) : leaveStats ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{leaveStats.total}</div>
                <div className="text-sm text-muted-foreground">Total Requests</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{leaveStats.pending}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{leaveStats.approved}</div>
                <div className="text-sm text-muted-foreground">Approved</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{leaveStats.rejected}</div>
                <div className="text-sm text-muted-foreground">Rejected</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-600">{leaveStats.cancelled}</div>
                <div className="text-sm text-muted-foreground">Cancelled</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Leave Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(leaveStats.byType).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="capitalize">{type}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Approved Days:</span>
                    <span className="font-semibold">{leaveStats.totalDays} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Approval Rate:</span>
                    <span className="font-semibold">
                      {leaveStats.total > 0 ? Math.round((leaveStats.approved / leaveStats.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <div className="text-muted-foreground">No statistics available</div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground">
            Manage your leave requests and view your leave calendar
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowNewRequest(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Leave Request
          </Button>
        </div>
      </div>

      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('my-leaves')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'my-leaves'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CalendarIcon className="h-4 w-4" />
            My Leaves
          </button>
          
          {(userRole === 'admin' || userRole === 'manager') && (
            <button
              onClick={() => setActiveTab('team-calendar')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'team-calendar'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="h-4 w-4" />
              Team Calendar
            </button>
          )}
          
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'stats'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Statistics
          </button>
        </nav>
      </div>

      {activeTab === 'my-leaves' && renderMyLeaves()}
      {activeTab === 'team-calendar' && renderTeamCalendar()}
      {activeTab === 'stats' && renderStats()}

      {showNewRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">New Leave Request</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Leave Type *</label>
                <select
                  value={newRequest.type}
                  onChange={(e) => setNewRequest({...newRequest, type: e.target.value as LeaveRequest['type']})}
                  className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="vacation">Vacation</option>
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal</option>
                  <option value="emergency">Emergency</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Start Date *</label>
                <input
                  type="date"
                  value={newRequest.startDate}
                  onChange={(e) => {
                    setNewRequest({...newRequest, startDate: e.target.value});
                    if (newRequest.endDate && e.target.value > newRequest.endDate) {
                      setNewRequest(prev => ({...prev, endDate: e.target.value}));
                    }
                  }}
                  className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">End Date *</label>
                <input
                  type="date"
                  value={newRequest.endDate}
                  onChange={(e) => setNewRequest({...newRequest, endDate: e.target.value})}
                  className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={newRequest.startDate || new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Reason *</label>
                <textarea
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest({...newRequest, reason: e.target.value})}
                  className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Please provide a detailed reason for your leave request..."
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your reason will be reviewed by your manager
                </p>
              </div>

              {newRequest.startDate && newRequest.endDate && (
                <div className="p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800">
                    Leave Duration: {Math.ceil((new Date(newRequest.endDate).getTime() - new Date(newRequest.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <Button 
                onClick={createLeaveRequest} 
                className="flex-1"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowNewRequest(false);
                  setNewRequest({ startDate: '', endDate: '', type: 'vacation', reason: '' });
                }}
                className="flex-1"
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};