import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/navigation/Navbar';
import { UserPlus, Building2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase'; // Import auth from firebase config
import { signOut } from 'firebase/auth'; // Import signOut from firebase/auth

const employeeSchema = z.object({
  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name must not exceed 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string()
    .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
  designation: z.string().min(1, 'Designation is required'),
  department: z.string().min(1, 'Department is required'),
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
  role: z.enum(['admin', 'manager', 'employee', 'hr', 'teamlead'], {
    required_error: 'Please select a role',
  }),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface GeneratedCredentials {
  username: string;
  password: string;
  employeeData: EmployeeFormData;
}

interface EmployeeSignupFormProps {
  onToggleMode: () => void;
  onCredentialsGenerated: (credentials: GeneratedCredentials) => void;
}

export const UnifiedSignupForm = ({ onToggleMode, onCredentialsGenerated }: EmployeeSignupFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [skillsInput, setSkillsInput] = useState('');
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const { toast } = useToast();
  const { signUp } = useAuth();

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

  const watchedRole = watch('role');

  const generatePassword = (): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const specialChars = '!@#$%^&*';
    
    let password = '';
    
    // Generate 8-10 characters
    for (let i = 0; i < 8 + Math.floor(Math.random() * 3); i++) {
      password += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    // Add 1-2 special characters
    const specialCount = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < specialCount; i++) {
      const insertPos = Math.floor(Math.random() * (password.length + 1));
      const specialChar = specialChars.charAt(Math.floor(Math.random() * specialChars.length));
      password = password.slice(0, insertPos) + specialChar + password.slice(insertPos);
    }
    
    return password;
  };

  const addSkill = () => {
    if (skillsInput.trim() && !skillsList.includes(skillsInput.trim())) {
      const newSkills = [...skillsList, skillsInput.trim()];
      setSkillsList(newSkills);
      setValue('skills', newSkills);
      setSkillsInput('');
    }
  };

  const removeSkill = (skill: string) => {
    const newSkills = skillsList.filter(s => s !== skill);
    setSkillsList(newSkills);
    setValue('skills', newSkills);
  };

  const storeEmployeeDataInFirestore = async (uid: string, employeeData: any, email: string) => {
    try {
      // Store additional employee data in Firestore
      const employeeDoc = {
        uid: uid,
        email: email,
        fullName: employeeData.fullName,
        phone: employeeData.phone,
        designation: employeeData.designation,
        department: employeeData.department,
        skills: employeeData.skills,
        role: employeeData.role,
        createdAt: serverTimestamp(),
        isActive: true,
        lastLogin: null, // Important: Set lastLogin to null for new users
        passwordLastChanged: serverTimestamp(),
      };

      await setDoc(doc(db, 'employees', uid), employeeDoc);
      
      // Also store in a separate collection for role-based access
      await setDoc(doc(db, 'users', uid), {
        uid: uid,
        email: email,
        role: employeeData.role,
        fullName: employeeData.fullName,
        createdAt: serverTimestamp(),
        isActive: true,
      });

      return true;
    } catch (error) {
      console.error('Error storing employee data:', error);
      throw new Error('Failed to store employee data');
    }
  };

  const onSubmit = async (data: EmployeeFormData) => {
    setIsLoading(true);
    try {
      // Generate secure password
      const password = generatePassword();
      
      // Create employee data object with all details
      const employeeData = {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        role: data.role,
        department: data.department,
        designation: data.designation,
        skills: skillsList,
      };

      // Use AuthProvider's signUp method to create Firebase Auth user
      // This will create the account but NOT log the user in automatically
      const userCredential = await signUp(data.email, password, data.fullName, employeeData);
      
      if (userCredential && userCredential.user) {
        // Store additional employee data in Firestore
        await storeEmployeeDataInFirestore(userCredential.user.uid, employeeData, data.email);

        // Sign out the automatically logged-in user so they have to login separately
        // This ensures the flow: Create Account → Show Credentials → User Logs In
        await signOut(auth);

        const credentials: GeneratedCredentials = {
          username: data.email,
          password: password,
          employeeData: {
            ...data,
            skills: skillsList,
          },
        };

        toast({
          title: "Employee Created Successfully!",
          description: `Account created for ${data.fullName}. They can now login with the credentials.`,
          variant: "default",
        });

        onCredentialsGenerated(credentials);
        
        // Reset form
        reset();
        setSkillsList([]);
      }
      
    } catch (error: any) {
      console.error('Error creating employee:', error);
      toast({
        title: "Error Creating Employee",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar showAuthButtons={false} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Side - Future expansion area */}
          <div className="hidden lg:block">
            <div className="sticky top-8">
              <Card className="card-professional p-8">
                <div className="text-center space-y-6">
                  <div className="mx-auto w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center">
                    <UserPlus className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Admin Portal</h2>
                    <p className="text-muted-foreground">
                      Create and manage employee accounts with complete profile data
                    </p>
                  </div>
                  <div className="space-y-4 text-left">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm">Complete profile storage</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm">Secure Firebase authentication</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm">Role-based access control</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm">Credentials shown after creation</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Right Side - Signup Form */}
          <div className="w-full max-w-2xl mx-auto lg:mx-0">
            <Card className="card-professional shadow-xl">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold">Create Employee Account</CardTitle>
                <CardDescription>
                  Enter employee details to create a complete profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        placeholder="John Doe"
                        {...register('fullName')}
                        className={errors.fullName ? 'border-destructive' : ''}
                      />
                      {errors.fullName && (
                        <p className="text-sm text-destructive">{errors.fullName.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@company.com"
                        {...register('email')}
                        className={errors.email ? 'border-destructive' : ''}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        placeholder="1234567890"
                        {...register('phone')}
                        className={errors.phone ? 'border-destructive' : ''}
                      />
                      {errors.phone && (
                        <p className="text-sm text-destructive">{errors.phone.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Role *</Label>
                      <Select onValueChange={(value) => setValue('role', value as any)}>
                        <SelectTrigger className={errors.role ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="hr">HR</SelectItem>
                          <SelectItem value="teamlead">Team Lead</SelectItem>
                          <SelectItem value="employee">Employee</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.role && (
                        <p className="text-sm text-destructive">{errors.role.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="designation">Designation *</Label>
                      <Select onValueChange={(value) => setValue('designation', value)}>
                        <SelectTrigger className={errors.designation ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select designation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Software Engineer">Software Engineer</SelectItem>
                          <SelectItem value="Senior Software Engineer">Senior Software Engineer</SelectItem>
                          <SelectItem value="Lead Developer">Lead Developer</SelectItem>
                          <SelectItem value="Frontend Developer">Frontend Developer</SelectItem>
                          <SelectItem value="Backend Developer">Backend Developer</SelectItem>
                          <SelectItem value="Full Stack Developer">Full Stack Developer</SelectItem>
                          <SelectItem value="DevOps Engineer">DevOps Engineer</SelectItem>
                          <SelectItem value="UI/UX Designer">UI/UX Designer</SelectItem>
                          <SelectItem value="Product Manager">Product Manager</SelectItem>
                          <SelectItem value="Project Manager">Project Manager</SelectItem>
                          <SelectItem value="Team Lead">Team Lead</SelectItem>
                          <SelectItem value="Technical Architect">Technical Architect</SelectItem>
                          <SelectItem value="Quality Assurance">Quality Assurance</SelectItem>
                          <SelectItem value="Business Analyst">Business Analyst</SelectItem>
                          <SelectItem value="Data Analyst">Data Analyst</SelectItem>
                          <SelectItem value="Marketing Specialist">Marketing Specialist</SelectItem>
                          <SelectItem value="Sales Representative">Sales Representative</SelectItem>
                          <SelectItem value="HR Specialist">HR Specialist</SelectItem>
                          <SelectItem value="Operations Manager">Operations Manager</SelectItem>
                          <SelectItem value="Finance Manager">Finance Manager</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.designation && (
                        <p className="text-sm text-destructive">{errors.designation.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="department">Department *</Label>
                      <Select onValueChange={(value) => setValue('department', value)}>
                        <SelectTrigger className={errors.department ? 'border-destructive' : ''}>
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
                          <SelectItem value="Quality Assurance">Quality Assurance</SelectItem>
                          <SelectItem value="DevOps">DevOps</SelectItem>
                          <SelectItem value="Data Science">Data Science</SelectItem>
                          <SelectItem value="Business Development">Business Development</SelectItem>
                          <SelectItem value="Customer Support">Customer Support</SelectItem>
                          <SelectItem value="Legal">Legal</SelectItem>
                          <SelectItem value="IT">IT</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.department && (
                        <p className="text-sm text-destructive">{errors.department.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skills">Skills *</Label>
                    <div className="flex space-x-2">
                      <Input
                        value={skillsInput}
                        onChange={(e) => setSkillsInput(e.target.value)}
                        placeholder="Add a skill"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                      />
                      <Button type="button" onClick={addSkill} variant="outline">
                        Add
                      </Button>
                    </div>
                    {skillsList.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {skillsList.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {skill}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeSkill(skill)}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                    {errors.skills && (
                      <p className="text-sm text-destructive">{errors.skills.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    variant="hero"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating Employee Account...' : 'Create Employee Account'}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Already have credentials?{' '}
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto font-semibold"
                      onClick={onToggleMode}
                    >
                      Sign in instead
                    </Button>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};