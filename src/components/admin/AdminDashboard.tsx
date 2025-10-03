import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  FolderKanban, 
  CheckSquare, 
  Clock,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Activity,
  Search,
  Filter,
  Download,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  LogOut,
  ChevronUp,
  ChevronDown,
  Calendar,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Employee {
  id: string;
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  designation: string;
  skills: string[];
  role: 'admin' | 'manager' | 'employee';
  projects: number;
  isActive: boolean;
  department: string;
  joinDate: string;
  onLeave?: boolean;
  pendingApproval?: boolean;
  createdAt?: any;
  lastActive?: any;
  totalTasks?: number;
  completedTasks?: number;
  productivity?: number;
  totalHours?: number;
}

type SortField = 'id' | 'fullName' | 'email' | 'designation' | 'role' | 'projects' | 'department';
type SortDirection = 'asc' | 'desc';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [skillsFilter, setSkillsFilter] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>('fullName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newEmployeeSkills, setNewEmployeeSkills] = useState<string[]>([]);
  const [skillsInput, setSkillsInput] = useState('');
  const [saving, setSaving] = useState(false);
  const itemsPerPage = 10;

  // New employee form state
  const [newEmployee, setNewEmployee] = useState({
    fullName: '',
    email: '',
    phone: '',
    designation: '',
    department: 'Engineering',
    role: 'employee' as 'admin' | 'manager' | 'employee',
    password: '', // Temporary password
  });

  // Fixed: Get Firebase token for API calls
  const getAuthToken = async (): Promise<string | null> => {
    try {
      // Try to get token from localStorage first
      const token = localStorage.getItem('authToken');
      if (token) {
        return token;
      }
      
      // If not in localStorage, try to get from Firebase Auth
      const currentUser = (window as any).firebase?.auth()?.currentUser;
      if (currentUser) {
        const firebaseToken = await currentUser.getIdToken();
        // Store it for future use
        localStorage.setItem('authToken', firebaseToken);
        return firebaseToken;
      }
      
      // If no token found, redirect to login
      console.error('No authentication token found');
      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  // Helper function for authenticated requests
  const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
    try {
      const token = await getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const defaultOptions: RequestInit = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      };

      const response = await fetch(url, {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      return response;
    } catch (error: any) {
      console.error('API request failed:', error);
      throw new Error(error.message || 'Network request failed');
    }
  };

  // Fetch employees from Firebase - UPDATED
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      
      const response = await makeAuthenticatedRequest('http://localhost:3001/api/employees');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch employees: ${response.status}`);
      }
      
      const employeesData = await response.json();
      
      // Handle case when no employees exist
      if (!employeesData || !Array.isArray(employeesData)) {
        console.log('No employees data found or invalid format');
        setEmployees([]);
        setFilteredEmployees([]);
        return;
      }
      
      // Transform the data to match our interface
      const transformedEmployees: Employee[] = employeesData.map((emp: any) => ({
        id: emp.uid || emp.id,
        uid: emp.uid,
        fullName: emp.fullName || 'Unknown',
        email: emp.email || 'No email',
        phone: emp.phone || '',
        designation: emp.designation || 'Employee',
        skills: emp.skills || [],
        role: emp.role || 'employee',
        projects: emp.totalTasks || 0,
        isActive: emp.isActive !== false,
        department: emp.department || 'General',
        joinDate: emp.createdAt ? 
          (emp.createdAt._seconds ? 
            new Date(emp.createdAt._seconds * 1000).toISOString().split('T')[0] : 
            new Date(emp.createdAt).toISOString().split('T')[0]
          ) : new Date().toISOString().split('T')[0],
        onLeave: false,
        pendingApproval: false,
        totalTasks: emp.totalTasks || 0,
        completedTasks: emp.completedTasks || 0,
        productivity: emp.productivity || 0,
        totalHours: emp.totalHours || 0,
      }));

      setEmployees(transformedEmployees);
      setFilteredEmployees(transformedEmployees);
      
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      
      // Check if it's an authentication error
      if (error.message.includes('authentication') || error.message.includes('token')) {
        toast({
          title: "Authentication Error",
          description: "Please log in again",
          variant: "destructive",
        });
        // Redirect to login
        localStorage.removeItem('authToken');
        navigate('/auth');
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to load employees data",
          variant: "destructive",
        });
      }
      
      // Set empty arrays on error
      setEmployees([]);
      setFilteredEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // Create new employee in Firebase - UPDATED
  const createEmployee = async (employeeData: any): Promise<boolean> => {
    try {
      const response = await makeAuthenticatedRequest('http://localhost:3001/api/auth/create-employee', {
        method: 'POST',
        body: JSON.stringify(employeeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create employee');
      }

      return true;
    } catch (error: any) {
      console.error('Error creating employee:', error);
      throw new Error(error.message || 'Failed to create employee');
    }
  };

  // Delete employee from Firebase - UPDATED
  const deleteEmployee = async (employeeId: string): Promise<boolean> => {
    try {
      const response = await makeAuthenticatedRequest(`http://localhost:3001/api/auth/user/${employeeId}`, {
        method: 'DELETE',
      });

      return response.ok;
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      throw new Error(error.message || 'Failed to delete employee');
    }
  };

  // Update employee in Firebase
  const updateEmployee = async (employeeId: string, updateData: any): Promise<boolean> => {
    try {
      const token = await getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://localhost:3001/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updateData,
          uid: employeeId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update employee');
      }

      return true;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [searchTerm, roleFilter, skillsFilter, employees, sortField, sortDirection]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredEmployees]);

  const filterEmployees = () => {
    let filtered = employees;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(emp =>
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.skills.some(skill => 
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(emp => emp.role === roleFilter);
    }

    // Skills filter
    if (skillsFilter.length > 0) {
      filtered = filtered.filter(emp =>
        skillsFilter.every(skill => emp.skills.includes(skill))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'fullName' || sortField === 'email' || sortField === 'designation' || sortField === 'department') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredEmployees(filtered);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmployees(currentPageEmployees.map(emp => emp.id));
    } else {
      setSelectedEmployees([]);
    }
  };

  const handleSelectEmployee = (employeeId: string, checked: boolean) => {
    if (checked) {
      setSelectedEmployees(prev => [...prev, employeeId]);
    } else {
      setSelectedEmployees(prev => prev.filter(id => id !== employeeId));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEmployees.length === 0) return;

    if (window.confirm(`Are you sure you want to delete ${selectedEmployees.length} employee(s)?`)) {
      try {
        setLoading(true);
        const deletePromises = selectedEmployees.map(employeeId => deleteEmployee(employeeId));
        await Promise.all(deletePromises);
        
        setEmployees(employees.filter(emp => !selectedEmployees.includes(emp.id)));
        setSelectedEmployees([]);
        
        toast({
          title: "Employees Deleted",
          description: `${selectedEmployees.length} employee(s) have been removed successfully.`,
        });
      } catch (error: any) {
        toast({
          title: "Delete Failed",
          description: error.message || "Failed to delete employees",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBulkRoleChange = async (newRole: 'admin' | 'manager' | 'employee') => {
    if (selectedEmployees.length === 0) return;

    try {
      setLoading(true);
      const updatePromises = selectedEmployees.map(employeeId => 
        updateEmployee(employeeId, { role: newRole })
      );
      await Promise.all(updatePromises);
      
      setEmployees(employees.map(emp => 
        selectedEmployees.includes(emp.id) ? { ...emp, role: newRole } : emp
      ));
      setSelectedEmployees([]);
      
      toast({
        title: "Roles Updated",
        description: `${selectedEmployees.length} employee(s) have been assigned the ${newRole} role.`,
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update roles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Updated Add Employee functionality
  const handleAddEmployee = () => {
    setShowAddEmployee(true);
  };

  const addSkill = () => {
    const skill = skillsInput.trim();
    if (skill && !newEmployeeSkills.includes(skill)) {
      setNewEmployeeSkills(prev => [...prev, skill]);
      setSkillsInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setNewEmployeeSkills(prev => prev.filter(skill => skill !== skillToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const handleAddEmployeeSubmit = async () => {
    if (!newEmployee.fullName || !newEmployee.email || !newEmployee.phone || !newEmployee.designation || !newEmployee.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields including password.",
        variant: "destructive",
      });
      return;
    }

    if (newEmployeeSkills.length === 0) {
      toast({
        title: "Skills Required",
        description: "Please add at least one skill.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const employeeData = {
        email: newEmployee.email,
        password: newEmployee.password,
        fullName: newEmployee.fullName,
        role: newEmployee.role,
        department: newEmployee.department,
        designation: newEmployee.designation,
        phone: newEmployee.phone,
        skills: newEmployeeSkills,
      };

      await createEmployee(employeeData);
      
      // Refresh employees list
      await fetchEmployees();
      
      // Reset form
      setNewEmployee({
        fullName: '',
        email: '',
        phone: '',
        designation: '',
        department: 'Engineering',
        role: 'employee',
        password: '',
      });
      setNewEmployeeSkills([]);
      setSkillsInput('');
      setShowAddEmployee(false);

      toast({
        title: "Employee Added",
        description: `${employeeData.fullName} has been added successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to Add Employee",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditEmployee = (employeeId: string) => {
    navigate(`/admin/employees/edit/${employeeId}`);
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        setLoading(true);
        await deleteEmployee(employeeId);
        setEmployees(employees.filter(emp => emp.id !== employeeId));
        toast({
          title: "Employee Deleted",
          description: "Employee has been removed successfully.",
        });
      } catch (error: any) {
        toast({
          title: "Delete Failed",
          description: error.message || "Failed to delete employee",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Designation', 'Skills', 'Role', 'Projects', 'Department', 'Join Date'];
    const csvData = filteredEmployees.map(emp => [
      emp.id,
      emp.fullName,
      emp.email,
      emp.phone,
      emp.designation,
      emp.skills.join('; '),
      emp.role,
      emp.projects.toString(),
      emp.department,
      emp.joinDate
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employees.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Employee data has been exported to CSV.",
    });
  };

  const allSkills = Array.from(new Set(employees.flatMap(emp => emp.skills)));

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const currentPageEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats - Calculate from real data
  const totalEmployees = employees.length;
  const activeProjects = employees.reduce((sum, emp) => sum + (emp.totalTasks || 0), 0);
  const onLeaveToday = 0; // You'll need to implement this based on your data
  const pendingApprovals = 0; // You'll need to implement this based on your data

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading employees data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-gradient">TaskVise</span>
              </div>
            </div>

            {/* Sign Out */}
            <div className="flex items-center">
              <Button 
                variant="outline" 
                onClick={() => {
                  localStorage.removeItem('authToken');
                  navigate('/auth');
                }}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your workforce efficiently with comprehensive employee tracking
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                  <p className="text-2xl font-bold">{totalEmployees}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                  <p className="text-2xl font-bold">{activeProjects}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <FolderKanban className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-muted-foreground">On Leave Today</p>
                    {onLeaveToday > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {onLeaveToday}
                      </Badge>
                    )}
                  </div>
                  <p className="text-2xl font-bold">{onLeaveToday}</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                    {pendingApprovals > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        Urgent
                      </Badge>
                    )}
                  </div>
                  <p className="text-2xl font-bold">{pendingApprovals}</p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleAddEmployee} className="bg-gradient-primary hover:opacity-90">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export to CSV
            </Button>

            {/* Bulk Actions */}
            {selectedEmployees.length > 0 && (
              <div className="flex items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      Bulk Actions ({selectedEmployees.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkRoleChange('admin')}>
                      Set as Admin
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkRoleChange('manager')}>
                      Set as Manager
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkRoleChange('employee')}>
                      Set as Employee
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleBulkDelete}
                      className="text-red-600"
                    >
                      Delete Selected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground">
            Showing {filteredEmployees.length} of {employees.length} employees
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
              </SelectContent>
            </Select>

            {/* Skills Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="justify-start">
                  <Filter className="h-4 w-4 mr-2" />
                  Skills {skillsFilter.length > 0 && `(${skillsFilter.length})`}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                {allSkills.map((skill) => (
                  <DropdownMenuCheckboxItem
                    key={skill}
                    checked={skillsFilter.includes(skill)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSkillsFilter([...skillsFilter, skill]);
                      } else {
                        setSkillsFilter(skillsFilter.filter(s => s !== skill));
                      }
                    }}
                  >
                    {skill}
                  </DropdownMenuCheckboxItem>
                ))}
                {skillsFilter.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSkillsFilter([])}>
                      Clear Filters
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Employees Table */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedEmployees.length === currentPageEmployees.length && currentPageEmployees.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead 
                      className="font-semibold cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={() => handleSort('id')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>ID</span>
                        <SortIcon field="id" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={() => handleSort('fullName')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Name</span>
                        <SortIcon field="fullName" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Email</span>
                        <SortIcon field="email" />
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">Phone</TableHead>
                    <TableHead 
                      className="font-semibold cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={() => handleSort('designation')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Designation</span>
                        <SortIcon field="designation" />
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">Skills</TableHead>
                    <TableHead 
                      className="font-semibold cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={() => handleSort('role')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Role</span>
                        <SortIcon field="role" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={() => handleSort('projects')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Projects</span>
                        <SortIcon field="projects" />
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentPageEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center space-y-3">
                          <Users className="h-12 w-12 text-gray-300" />
                          <div>
                            <p className="text-lg font-medium">No employees found</p>
                            <p className="text-sm">
                              {employees.length === 0 
                                ? "No employees in the system yet. Add your first employee to get started."
                                : "No employees match your current filters."
                              }
                            </p>
                          </div>
                          {employees.length === 0 && (
                            <Button onClick={handleAddEmployee} className="mt-2">
                              <UserPlus className="h-4 w-4 mr-2" />
                              Add First Employee
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentPageEmployees.map((employee) => (
                      <TableRow 
                        key={employee.id} 
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedEmployees.includes(employee.id)}
                            onCheckedChange={(checked) => 
                              handleSelectEmployee(employee.id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="font-medium">{employee.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 bg-gradient-primary rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {employee.fullName.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">{employee.fullName}</div>
                              <div className="text-sm text-muted-foreground">{employee.department}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>{employee.phone}</TableCell>
                        <TableCell>{employee.designation}</TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                  {employee.skills.slice(0, 3).map((skill, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                  {employee.skills.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{employee.skills.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="max-w-xs">
                                  <p className="font-semibold mb-1">All Skills:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {employee.skills.map((skill, index) => (
                                      <Badge key={index} variant="secondary" className="text-xs">
                                        {skill}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              employee.role === 'admin' ? 'default' :
                              employee.role === 'manager' ? 'secondary' : 'outline'
                            }
                            className={
                              employee.role === 'admin' ? 'bg-red-100 text-red-800' :
                              employee.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }
                          >
                            {employee.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <FolderKanban className="h-4 w-4 text-muted-foreground" />
                            <span>{employee.projects}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditEmployee(employee.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteEmployee(employee.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} entries
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Employee Dialog */}
      <Dialog open={showAddEmployee} onOpenChange={setShowAddEmployee}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>
              Enter the new employee's details and assign appropriate permissions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={newEmployee.fullName}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={newEmployee.phone}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="designation">Designation *</Label>
                <Input
                  id="designation"
                  value={newEmployee.designation}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, designation: e.target.value }))}
                  placeholder="Enter job title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select value={newEmployee.department} onValueChange={(value) => setNewEmployee(prev => ({ ...prev, department: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Product">Product</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Human Resources">Human Resources</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={newEmployee.role} onValueChange={(value: 'admin' | 'manager' | 'employee') => setNewEmployee(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Temporary Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newEmployee.password}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter temporary password"
                />
                <p className="text-xs text-muted-foreground">
                  Employee will use this password for first login
                </p>
              </div>
            </div>

            {/* Skills Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="skills">Skills *</Label>
                <div className="flex space-x-2">
                  <Input
                    id="skills"
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter a skill and press Enter or click Add"
                    className="flex-1"
                  />
                  <Button type="button" onClick={addSkill} variant="outline">
                    Add
                  </Button>
                </div>
              </div>

              {/* Skills Display */}
              {newEmployeeSkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {newEmployeeSkills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-2 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddEmployee(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddEmployeeSubmit}
                disabled={saving}
                className="bg-gradient-primary hover:opacity-90 min-w-24"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Employee
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};