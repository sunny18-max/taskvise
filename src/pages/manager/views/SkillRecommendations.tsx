import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Users, 
  Target,
  TrendingUp,
  Clock,
  Award
} from 'lucide-react';

interface Employee {
  id: string;
  fullName: string;
  email: string;
  role: string;
  department: string;
  skills: string[];
  skillGaps: string[];
  completedTrainings: number;
  productivity: number;
  lastTraining?: string;
}

interface Project {
  id: string;
  name: string;
  requiredSkills: string[];
  teamMembers: string[];
  status: 'planning' | 'active' | 'completed';
}

interface SkillRecommendationsProps {
  employees: Employee[];
  projects: Project[];
}

export const SkillRecommendations = ({ employees, projects }: SkillRecommendationsProps) => {
  // Safe function to get required skills from project
  const getProjectRequiredSkills = (project: Project): string[] => {
    return Array.isArray(project.requiredSkills) ? project.requiredSkills : [];
  };

  // Safe function to get employee skills
  const getEmployeeSkills = (employee: Employee): string[] => {
    return Array.isArray(employee.skills) ? employee.skills : [];
  };

  // Analyze skill gaps across the team
  const analyzeSkillGaps = () => {
    // Get all required skills from active/planning projects
    const allRequiredSkills = projects
      .filter(project => project.status === 'active' || project.status === 'planning')
      .flatMap(project => getProjectRequiredSkills(project));

    const uniqueRequiredSkills = [...new Set(allRequiredSkills)];
    
    // If no required skills found, return empty array
    if (uniqueRequiredSkills.length === 0) {
      return [];
    }
    
    const skillGapAnalysis = uniqueRequiredSkills.map(skill => {
      const employeesWithSkill = employees.filter(emp => 
        getEmployeeSkills(emp).includes(skill)
      ).length;
      
      const coveragePercentage = employees.length > 0 ? 
        (employeesWithSkill / employees.length) * 100 : 0;
      
      const priority = coveragePercentage < 50 ? 'high' : coveragePercentage < 75 ? 'medium' : 'low';

      const projectsUsing = projects.filter(p => 
        getProjectRequiredSkills(p).includes(skill)
      ).length;

      return {
        skill,
        coveragePercentage,
        employeesWithSkill,
        totalEmployees: employees.length,
        priority,
        projectsUsing
      };
    });

    return skillGapAnalysis.sort((a, b) => a.coveragePercentage - b.coveragePercentage);
  };

  const skillGapAnalysis = analyzeSkillGaps();
  const highPriorityGaps = skillGapAnalysis.filter(gap => gap.priority === 'high');

  // Get training recommendations for employees
  const getTrainingRecommendations = () => {
    const recommendations: {
      employee: Employee;
      recommendedSkills: string[];
      reason: string;
      urgency: 'high' | 'medium' | 'low';
    }[] = [];

    employees.forEach(employee => {
      const recommendedSkills: string[] = [];
      let reason = '';
      let urgency: 'high' | 'medium' | 'low' = 'low';

      const employeeSkills = getEmployeeSkills(employee);

      // Check current projects for skill requirements
      const employeeProjects = projects.filter(project => {
        const teamMembers = Array.isArray(project.teamMembers) ? project.teamMembers : [];
        return teamMembers.includes(employee.id) && 
               (project.status === 'active' || project.status === 'planning');
      });

      employeeProjects.forEach(project => {
        const requiredSkills = getProjectRequiredSkills(project);
        requiredSkills.forEach(skill => {
          if (!employeeSkills.includes(skill) && !recommendedSkills.includes(skill)) {
            recommendedSkills.push(skill);
            reason = `Required for project: ${project.name}`;
            urgency = 'high';
          }
        });
      });

      // Check for critical team skill gaps
      highPriorityGaps.forEach(gap => {
        if (!employeeSkills.includes(gap.skill) && !recommendedSkills.includes(gap.skill)) {
          recommendedSkills.push(gap.skill);
          reason = reason || 'Critical team skill gap';
          urgency = urgency === 'high' ? 'high' : 'medium';
        }
      });

      // Add general skill development if no specific gaps found
      if (recommendedSkills.length === 0 && employeeSkills.length > 0) {
        // Suggest skills that other team members have but this employee doesn't
        const teamSkills = new Set<string>();
        employees.forEach(emp => {
          if (emp.id !== employee.id) {
            getEmployeeSkills(emp).forEach(skill => teamSkills.add(skill));
          }
        });
        
        const missingSkills = Array.from(teamSkills).filter(skill => 
          !employeeSkills.includes(skill)
        ).slice(0, 2); // Limit to 2 suggestions
        
        if (missingSkills.length > 0) {
          recommendedSkills.push(...missingSkills);
          reason = 'Skill development opportunity';
          urgency = 'low';
        }
      }

      if (recommendedSkills.length > 0) {
        recommendations.push({
          employee,
          recommendedSkills,
          reason,
          urgency
        });
      }
    });

    return recommendations.sort((a, b) => {
      const urgencyOrder = { high: 3, medium: 2, low: 1 };
      return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
    });
  };

  const trainingRecommendations = getTrainingRecommendations();

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  // Calculate overall statistics
  const totalSkillsInTeam = new Set(
    employees.flatMap(emp => getEmployeeSkills(emp))
  ).size;

  const employeesNeedingTraining = trainingRecommendations.length;
  const totalCompletedTrainings = employees.reduce((sum, emp) => sum + (emp.completedTrainings || 0), 0);
  const averageProductivity = employees.length > 0 ? 
    Math.round(employees.reduce((sum, emp) => sum + (emp.productivity || 0), 0) / employees.length) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Skill Development</h2>
        <p className="text-gray-600 mt-1">
          Identify skill gaps and recommend training opportunities
        </p>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Target className="h-6 w-6 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{highPriorityGaps.length}</div>
            <div className="text-sm text-gray-600">Critical Gaps</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{employeesNeedingTraining}</div>
            <div className="text-sm text-gray-600">Need Training</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Award className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{totalCompletedTrainings}</div>
            <div className="text-sm text-gray-600">Completed Trainings</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{averageProductivity}%</div>
            <div className="text-sm text-gray-600">Avg Productivity</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Skill Gaps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-red-500" />
              Critical Skill Gaps
            </CardTitle>
            <CardDescription>
              Skills needed across active projects with low team coverage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {skillGapAnalysis.length > 0 ? (
                skillGapAnalysis.slice(0, 5).map((gap, index) => (
                  <div key={gap.skill} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{gap.skill}</span>
                        <Badge className={getPriorityColor(gap.priority)}>
                          {gap.priority}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-600">
                        {gap.employeesWithSkill}/{gap.totalEmployees} employees
                      </span>
                    </div>
                    <Progress value={gap.coveragePercentage} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{gap.coveragePercentage.toFixed(0)}% coverage</span>
                      <span>{gap.projectsUsing} project{gap.projectsUsing !== 1 ? 's' : ''} need{gap.projectsUsing !== 1 ? '' : 's'} this</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p>No skill gaps identified</p>
                  <p className="text-sm">All required skills are covered by your team</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Training Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              Training Recommendations
            </CardTitle>
            <CardDescription>
              Personalized training suggestions for team members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trainingRecommendations.length > 0 ? (
                trainingRecommendations.slice(0, 4).map((recommendation, index) => (
                  <div key={recommendation.employee.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {recommendation.employee.fullName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{recommendation.employee.fullName}</div>
                          <div className="text-xs text-gray-500">{recommendation.employee.department}</div>
                        </div>
                      </div>
                      <Badge className={getUrgencyColor(recommendation.urgency)}>
                        {recommendation.urgency}
                      </Badge>
                    </div>
                    <div className="mb-2">
                      <div className="text-xs text-gray-600 mb-1">Recommended Skills:</div>
                      <div className="flex flex-wrap gap-1">
                        {recommendation.recommendedSkills.map(skill => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {recommendation.reason}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p>No training recommendations</p>
                  <p className="text-sm">All team members have the required skills</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Team Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Team Skill Insights</CardTitle>
          <CardDescription>
            Overview of your team's skill distribution and development opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{totalSkillsInTeam}</div>
              <div className="text-sm text-gray-600">Unique Skills in Team</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {employees.filter(emp => getEmployeeSkills(emp).length >= 5).length}
              </div>
              <div className="text-sm text-gray-600">Multi-skilled Members (5+ skills)</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(employees.reduce((sum, emp) => sum + getEmployeeSkills(emp).length, 0) / employees.length) || 0}
              </div>
              <div className="text-sm text-gray-600">Avg Skills per Member</div>
            </div>
          </div>
          
          {employees.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-sm mb-3">Top Skills in Team:</h4>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const skillCounts: { [key: string]: number } = {};
                  employees.forEach(emp => {
                    getEmployeeSkills(emp).forEach(skill => {
                      skillCounts[skill] = (skillCounts[skill] || 0) + 1;
                    });
                  });
                  
                  return Object.entries(skillCounts)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 8)
                    .map(([skill, count]) => (
                      <Badge key={skill} variant="secondary">
                        {skill} ({count})
                      </Badge>
                    ));
                })()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};