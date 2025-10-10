import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  UserPlus, 
  Users, 
  FileText, 
  Calendar,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

interface RecruitmentViewProps {
  employees: any[];
  onAddEmployee: () => void;
}

export const RecruitmentView = ({
  employees,
  onAddEmployee
}: RecruitmentViewProps) => {
  const newHiresThisMonth = employees.filter(emp => {
    const joinDate = new Date(emp.joinDate);
    const today = new Date();
    return joinDate.getMonth() === today.getMonth() && 
           joinDate.getFullYear() === today.getFullYear();
  });

  const jobOpenings = [
    {
      id: 1,
      title: "Senior Frontend Developer",
      department: "Engineering",
      applicants: 24,
      status: "active",
      postedDate: "2024-01-15"
    },
    {
      id: 2,
      title: "Product Manager",
      department: "Product",
      applicants: 18,
      status: "active",
      postedDate: "2024-01-10"
    },
    {
      id: 3,
      title: "UX Designer",
      department: "Design",
      applicants: 32,
      status: "closed",
      postedDate: "2024-01-05"
    }
  ];

  const recruitmentStats = [
    {
      label: "Total Applicants",
      value: "74",
      change: "+12%",
      trend: "up"
    },
    {
      label: "Interview Rate",
      value: "42%",
      change: "+5%",
      trend: "up"
    },
    {
      label: "Time to Hire",
      value: "28 days",
      change: "-3 days",
      trend: "down"
    },
    {
      label: "Offer Acceptance",
      value: "85%",
      change: "+8%",
      trend: "up"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recruitment</h1>
          <p className="text-muted-foreground">
            Manage job postings and track applicants
          </p>
        </div>
        <Button onClick={onAddEmployee}>
          <UserPlus className="mr-2 h-4 w-4" />
          Post New Job
        </Button>
      </div>

      {/* Recruitment Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {recruitmentStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Job Openings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Active Job Openings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {jobOpenings.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{job.title}</h4>
                      <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                        {job.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {job.department} • {job.applicants} applicants
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Posted on {new Date(job.postedDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Hires */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Hires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {newHiresThisMonth.slice(0, 5).map((employee) => (
                <div key={employee.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {employee.fullName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{employee.fullName}</p>
                    <p className="text-xs text-muted-foreground">{employee.designation}</p>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    New
                  </Badge>
                </div>
              ))}
              {newHiresThisMonth.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No new hires this month
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Application Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>Application Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold">Applied</h4>
              <p className="text-2xl font-bold text-blue-600">74</p>
              <p className="text-xs text-muted-foreground">Candidates</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <h4 className="font-semibold">Screening</h4>
              <p className="text-2xl font-bold text-yellow-600">32</p>
              <p className="text-xs text-muted-foreground">In review</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-semibold">Interview</h4>
              <p className="text-2xl font-bold text-purple-600">18</p>
              <p className="text-xs text-muted-foreground">Scheduled</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-semibold">Hired</h4>
              <p className="text-2xl font-bold text-green-600">8</p>
              <p className="text-xs text-muted-foreground">This month</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};