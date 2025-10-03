import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, X, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const employeeSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  designation: z.string().min(1, 'Designation is required'),
  department: z.string().min(1, 'Department is required'),
  role: z.enum(['admin', 'manager', 'employee']),
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

// Firebase integration functions
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

const fetchEmployee = async (employeeId: string) => {
  try {
    const response = await makeAuthenticatedRequest('http://localhost:3001/api/employees');
    
    if (response.ok) {
      const employeesData = await response.json();
      // Find the specific employee from the list
      return employeesData.find((emp: any) => emp.uid === employeeId || emp.id === employeeId);
    }
    return null;
  } catch (error) {
    console.error('Error fetching employee:', error);
    return null;
  }
};

const updateEmployee = async (employeeId: string, updateData: any) => {
  try {
    const response = await makeAuthenticatedRequest(`http://localhost:3001/api/auth/profile`, {
      method: 'PUT',
      body: JSON.stringify({
        ...updateData,
        uid: employeeId,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error updating employee:', error);
    return false;
  }
};

export const EditEmployeeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [skillsInput, setSkillsInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
  });

  const skills = watch('skills') || [];
  const department = watch('department');
  const role = watch('role');

  useEffect(() => {
    const loadEmployeeData = async () => {
      if (!id) {
        toast({
          title: "Error",
          description: "No employee ID provided",
          variant: "destructive",
        });
        navigate('/admin/employees');
        return;
      }

      try {
        setLoading(true);
        const employee = await fetchEmployee(id);
        
        if (employee) {
          reset({
            fullName: employee.fullName || '',
            email: employee.email || '',
            phone: employee.phone || '',
            designation: employee.designation || '',
            department: employee.department || '',
            role: employee.role || 'employee',
            skills: employee.skills || [],
          });
        } else {
          toast({
            title: "Error",
            description: "Employee not found",
            variant: "destructive",
          });
          navigate('/admin/employees');
        }
      } catch (error) {
        console.error('Error loading employee data:', error);
        toast({
          title: "Error",
          description: "Failed to load employee data",
          variant: "destructive",
        });
        navigate('/admin/employees');
      } finally {
        setLoading(false);
      }
    };

    loadEmployeeData();
  }, [id, reset, navigate, toast]);

  const addSkill = () => {
    const skill = skillsInput.trim();
    if (skill && !skills.includes(skill)) {
      const newSkills = [...skills, skill];
      setValue('skills', newSkills, { shouldValidate: true });
      setSkillsInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const newSkills = skills.filter(skill => skill !== skillToRemove);
    setValue('skills', newSkills, { shouldValidate: true });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const onSubmit = async (data: EmployeeFormData) => {
    if (!id) {
      toast({
        title: "Error",
        description: "No employee ID provided",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const success = await updateEmployee(id, data);
      
      if (success) {
        toast({
          title: "Employee Updated",
          description: `${data.fullName}'s profile has been updated successfully.`,
        });
        navigate('/admin/employees');
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update employee profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading employee data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/employees')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Employees
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Employee</h1>
          <p className="text-muted-foreground mt-2">
            Update employee information and permissions
          </p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Employee Details</CardTitle>
            <CardDescription>
              Update the employee's personal information, role, and skills
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    {...register('fullName')}
                    placeholder="Enter full name"
                    className={errors.fullName ? 'border-red-500' : ''}
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-sm">{errors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="Enter email address"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    placeholder="Enter phone number"
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm">{errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    {...register('designation')}
                    placeholder="Enter job title"
                    className={errors.designation ? 'border-red-500' : ''}
                  />
                  {errors.designation && (
                    <p className="text-red-500 text-sm">{errors.designation.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={department} onValueChange={(value) => setValue('department', value)}>
                    <SelectTrigger className={errors.department ? 'border-red-500' : ''}>
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
                  {errors.department && (
                    <p className="text-red-500 text-sm">{errors.department.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={(value: 'admin' | 'manager' | 'employee') => setValue('role', value)}>
                    <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && (
                    <p className="text-red-500 text-sm">{errors.role.message}</p>
                  )}
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="skills">Skills</Label>
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
                  {errors.skills && (
                    <p className="text-red-500 text-sm">{errors.skills.message}</p>
                  )}
                </div>

                {/* Skills Display */}
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
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
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/employees')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="min-w-24">
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};