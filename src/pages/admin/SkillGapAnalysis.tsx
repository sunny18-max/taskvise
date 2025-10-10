// SkillGapAnalysis.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, AlertTriangle, CheckCircle, Users, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
}

interface Project {
  id: string;
  name: string;
  description: string;
  requiredSkills: string[];
  status: 'planning' | 'active' | 'completed' | 'on-hold';
  teamMembers: string[];
  startDate: string;
  endDate: string;
  department: string;
}

interface SkillGap {
  projectId: string;
  projectName: string;
  requiredSkills: string[];
  availableSkills: string[];
  missingSkills: string[];
  gapSeverity: 'low' | 'medium' | 'high';
  employeesWithSkills: number;
  totalEmployeesNeeded: number;
}

// Firebase integration functions
const getAuthToken = async (): Promise<string | null> => {
  try {
    const token = localStorage.getItem('authToken');
    if (token) return token;
    
    const currentUser = (window as any).firebase?.auth()?.currentUser;
    if (currentUser) {
      const firebaseToken = await currentUser.getIdToken();
      localStorage.setItem('authToken', firebaseToken);
      return firebaseToken;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return response;
  } catch (error: any) {
    console.error('API request failed:', error);
    throw new Error(error.message || 'Network request failed');
  }
};

export const SkillGapAnalysis = () => {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
  const [filteredGaps, setFilteredGaps] = useState<SkillGap[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Fetch employees and projects data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch employees
        const employeesResponse = await makeAuthenticatedRequest('http://localhost:3001/api/employees');
        const employeesData = await employeesResponse.json();
        
        // Fetch projects (you'll need to implement this endpoint)
        const projectsResponse = await makeAuthenticatedRequest('http://localhost:3001/api/projects');
        const projectsData = await projectsResponse.json();

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
        }));

        const transformedProjects: Project[] = projectsData.map((proj: any) => ({
          id: proj.id || proj.projectId,
          name: proj.name || 'Unnamed Project',
          description: proj.description || '',
          requiredSkills: proj.requiredSkills || proj.skills || [],
          status: proj.status || 'planning',
          teamMembers: proj.teamMembers || proj.assignedEmployees || [],
          startDate: proj.startDate || new Date().toISOString().split('T')[0],
          endDate: proj.endDate || '',
          department: proj.department || 'General',
        }));

        setEmployees(transformedEmployees);
        setProjects(transformedProjects);
        
      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load data for skill gap analysis",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Calculate skill gaps
  useEffect(() => {
    if (employees.length === 0 || projects.length === 0) return;

    const gaps: SkillGap[] = projects.map(project => {
      // Get all unique skills from employees assigned to this project
      const assignedEmployees = employees.filter(emp => 
        project.teamMembers.includes(emp.id) || project.teamMembers.includes(emp.uid)
      );
      
      const availableSkills = Array.from(new Set(
        assignedEmployees.flatMap(emp => emp.skills)
      ));

      // Find missing skills
      const missingSkills = project.requiredSkills.filter(
        skill => !availableSkills.includes(skill)
      );

      // Calculate gap severity
      const missingPercentage = (missingSkills.length / project.requiredSkills.length) * 100;
      let gapSeverity: 'low' | 'medium' | 'high' = 'low';
      
      if (missingPercentage > 50) gapSeverity = 'high';
      else if (missingPercentage > 20) gapSeverity = 'medium';

      // Count employees with required skills
      const employeesWithRequiredSkills = assignedEmployees.filter(emp =>
        project.requiredSkills.some(skill => emp.skills.includes(skill))
      ).length;

      return {
        projectId: project.id,
        projectName: project.name,
        requiredSkills: project.requiredSkills,
        availableSkills,
        missingSkills,
        gapSeverity,
        employeesWithSkills: employeesWithRequiredSkills,
        totalEmployeesNeeded: Math.max(project.teamMembers.length, 1), // At least 1 needed
      };
    });

    setSkillGaps(gaps);
    setFilteredGaps(gaps);
  }, [employees, projects]);

  // Apply filters
  useEffect(() => {
    let filtered = skillGaps;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(gap =>
        gap.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gap.missingSkills.some(skill => 
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        gap.requiredSkills.some(skill => 
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Project filter
    if (projectFilter !== 'all') {
      filtered = filtered.filter(gap => gap.projectId === projectFilter);
    }

    // Severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(gap => gap.gapSeverity === severityFilter);
    }

    // Department filter
    if (departmentFilter !== 'all') {
      const departmentProjects = projects
        .filter(proj => proj.department === departmentFilter)
        .map(proj => proj.id);
      
      filtered = filtered.filter(gap => departmentProjects.includes(gap.projectId));
    }

    setFilteredGaps(filtered);
  }, [searchTerm, projectFilter, severityFilter, departmentFilter, skillGaps, projects]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSkillMatchPercentage = (gap: SkillGap) => {
    const matchedSkills = gap.requiredSkills.filter(skill => 
      gap.availableSkills.includes(skill)
    ).length;
    return Math.round((matchedSkills / gap.requiredSkills.length) * 100);
  };

  const getRecommendation = (gap: SkillGap) => {
    const percentage = getSkillMatchPercentage(gap);
    
    if (percentage >= 80) {
      return "Well-staffed project";
    } else if (percentage >= 50) {
      return "Consider training existing team members";
    } else {
      return "Urgent: Hire new talent or reassign resources";
    }
  };

  const allDepartments = Array.from(new Set(projects.map(proj => proj.department)));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading skill gap analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Skill Gap Analysis</h1>
          <p className="text-muted-foreground mt-2">
            Identify missing skills required for upcoming or ongoing projects
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                  <p className="text-2xl font-bold">{projects.length}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">High Priority Gaps</p>
                  <p className="text-2xl font-bold text-red-600">
                    {skillGaps.filter(gap => gap.gapSeverity === 'high').length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                  <p className="text-2xl font-bold">{employees.length}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg. Skill Match</p>
                  <p className="text-2xl font-bold">
                    {skillGaps.length > 0 
                      ? Math.round(skillGaps.reduce((sum, gap) => sum + getSkillMatchPercentage(gap), 0) / skillGaps.length)
                      : 0
                    }%
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Project Filter */}
              <div className="space-y-2">
                <Label htmlFor="project-filter">Project</Label>
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Severity Filter */}
              <div className="space-y-2">
                <Label htmlFor="severity-filter">Gap Severity</Label>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Severities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Department Filter */}
              <div className="space-y-2">
                <Label htmlFor="department-filter">Department</Label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {allDepartments.map(dept => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skill Gaps Table */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Skill Gap Analysis</CardTitle>
            <CardDescription>
              Overview of missing skills across all projects with recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Project</TableHead>
                    <TableHead className="font-semibold">Required Skills</TableHead>
                    <TableHead className="font-semibold">Available Skills</TableHead>
                    <TableHead className="font-semibold">Missing Skills</TableHead>
                    <TableHead className="font-semibold">Match Rate</TableHead>
                    <TableHead className="font-semibold">Gap Severity</TableHead>
                    <TableHead className="font-semibold">Recommendation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGaps.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center space-y-3">
                          <CheckCircle className="h-12 w-12 text-green-300" />
                          <div>
                            <p className="text-lg font-medium">No skill gaps found</p>
                            <p className="text-sm">
                              {skillGaps.length === 0 
                                ? "No projects to analyze or all skill requirements are met."
                                : "No skill gaps match your current filters."
                              }
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredGaps.map((gap) => (
                      <TableRow key={gap.projectId} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-semibold">{gap.projectName}</p>
                            <p className="text-sm text-muted-foreground">
                              {projects.find(p => p.id === gap.projectId)?.department}
                            </p>
                          </div>
                        </TableCell>
                        
                        {/* Required Skills */}
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {gap.requiredSkills.map((skill, index) => (
                              <Badge 
                                key={index} 
                                variant="outline" 
                                className="text-xs bg-blue-50 border-blue-200"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        
                        {/* Available Skills */}
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                  {gap.availableSkills.slice(0, 3).map((skill, index) => (
                                    <Badge 
                                      key={index} 
                                      variant="secondary" 
                                      className="text-xs bg-green-100 text-green-800 border-green-200"
                                    >
                                      {skill}
                                    </Badge>
                                  ))}
                                  {gap.availableSkills.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{gap.availableSkills.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="max-w-xs">
                                  <p className="font-semibold mb-1">All Available Skills:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {gap.availableSkills.map((skill, index) => (
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
                        
                        {/* Missing Skills */}
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {gap.missingSkills.map((skill, index) => (
                              <Badge 
                                key={index} 
                                variant="outline" 
                                className="text-xs bg-red-100 text-red-800 border-red-200"
                              >
                                {skill}
                              </Badge>
                            ))}
                            {gap.missingSkills.length === 0 && (
                              <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-200">
                                None
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        
                        {/* Match Rate */}
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  getSkillMatchPercentage(gap) >= 80 ? 'bg-green-500' :
                                  getSkillMatchPercentage(gap) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${getSkillMatchPercentage(gap)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">
                              {getSkillMatchPercentage(gap)}%
                            </span>
                          </div>
                        </TableCell>
                        
                        {/* Gap Severity */}
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={getSeverityColor(gap.gapSeverity)}
                          >
                            {gap.gapSeverity.charAt(0).toUpperCase() + gap.gapSeverity.slice(1)}
                          </Badge>
                        </TableCell>
                        
                        {/* Recommendation */}
                        <TableCell>
                          <div className="max-w-[200px]">
                            <p className="text-sm">{getRecommendation(gap)}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {gap.employeesWithSkills}/{gap.totalEmployeesNeeded} employees have required skills
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Visualization Section */}
        {filteredGaps.length > 0 && (
          <Card className="border-0 shadow-lg mt-6">
            <CardHeader>
              <CardTitle>Skill Gap Visualization</CardTitle>
              <CardDescription>
                Visual representation of missing skills across projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bar Chart - Missing Skills Count */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Missing Skills by Project</h3>
                  <div className="space-y-3">
                    {filteredGaps.slice(0, 8).map((gap) => (
                      <div key={gap.projectId} className="flex items-center space-x-3">
                        <div className="w-32 text-sm truncate">{gap.projectName}</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-4">
                          <div 
                            className="bg-red-500 h-4 rounded-full"
                            style={{ 
                              width: `${Math.min((gap.missingSkills.length / Math.max(...filteredGaps.map(g => g.missingSkills.length))) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                        <div className="w-8 text-sm font-medium text-right">
                          {gap.missingSkills.length}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Donut Chart - Gap Severity Distribution */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Gap Severity Distribution</h3>
                  <div className="flex items-center justify-center">
                    <div className="relative w-40 h-40">
                      {/* Simplified donut chart */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{filteredGaps.length}</div>
                          <div className="text-sm text-muted-foreground">Projects</div>
                        </div>
                      </div>
                      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                        {(() => {
                          const highCount = filteredGaps.filter(g => g.gapSeverity === 'high').length;
                          const mediumCount = filteredGaps.filter(g => g.gapSeverity === 'medium').length;
                          const lowCount = filteredGaps.filter(g => g.gapSeverity === 'low').length;
                          
                          const total = filteredGaps.length;
                          let accumulated = 0;

                          return (
                            <>
                              <circle 
                                cx="50" cy="50" r="40" 
                                fill="none" 
                                stroke="#ef4444" 
                                strokeWidth="20" 
                                strokeDasharray={`${(highCount / total) * 251.2} 251.2`}
                              />
                              <circle 
                                cx="50" cy="50" r="40" 
                                fill="none" 
                                stroke="#eab308" 
                                strokeWidth="20" 
                                strokeDasharray={`${(mediumCount / total) * 251.2} 251.2`}
                                strokeDashoffset={-((highCount / total) * 251.2)}
                              />
                              <circle 
                                cx="50" cy="50" r="40" 
                                fill="none" 
                                stroke="#22c55e" 
                                strokeWidth="20" 
                                strokeDasharray={`${(lowCount / total) * 251.2} 251.2`}
                                strokeDashoffset={-(((highCount + mediumCount) / total) * 251.2)}
                              />
                            </>
                          );
                        })()}
                      </svg>
                    </div>
                  </div>
                  <div className="flex justify-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>High: {filteredGaps.filter(g => g.gapSeverity === 'high').length}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span>Medium: {filteredGaps.filter(g => g.gapSeverity === 'medium').length}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Low: {filteredGaps.filter(g => g.gapSeverity === 'low').length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};