import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Building, 
  Target,
  Award,
  Calendar,
  Edit,
  Save,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { useState } from 'react';

interface ProfileViewProps {
  profile: any;
  stats: any;
  tasks: any[];
}

export const ProfileView = ({ profile, stats, tasks }: ProfileViewProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);

  const handleSave = () => {
    // Here you would typically make an API call to update the profile
    setIsEditing(false);
    // Update the profile in the parent component
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  // Calculate additional statistics
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const avgCompletionTime = completedTasks.length > 0 
    ? completedTasks.reduce((sum, task) => {
        const assigned = new Date(task.createdAt);
        const completed = new Date(task.completedAt || new Date());
        return sum + (completed.getTime() - assigned.getTime()) / (1000 * 60 * 60 * 24);
      }, 0) / completedTasks.length
    : 0;

  const skillDistribution = tasks.reduce((acc, task) => {
    task.skills?.forEach((skill: string) => {
      acc[skill] = (acc[skill] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const topSkills = Object.entries(skillDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([skill, count]) => ({ skill, count }));

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gradient">My Profile</h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>
          <Button
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
            className="gap-2"
          >
            {isEditing ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
            {isEditing ? 'Save Changes' : 'Edit Profile'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information Card */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  {isEditing ? (
                    <Input
                      id="fullName"
                      value={editedProfile?.fullName || ''}
                      onChange={(e) => setEditedProfile({...editedProfile, fullName: e.target.value})}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>{profile?.fullName || 'Not set'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={editedProfile?.email || ''}
                      onChange={(e) => setEditedProfile({...editedProfile, email: e.target.value})}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{profile?.email || 'Not set'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={editedProfile?.phone || ''}
                      onChange={(e) => setEditedProfile({...editedProfile, phone: e.target.value})}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{profile?.phone || 'Not set'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  {isEditing ? (
                    <Input
                      id="designation"
                      value={editedProfile?.designation || ''}
                      onChange={(e) => setEditedProfile({...editedProfile, designation: e.target.value})}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50">
                      <Briefcase className="h-4 w-4 text-gray-500" />
                      <span>{profile?.designation || 'Not set'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  {isEditing ? (
                    <Input
                      id="department"
                      value={editedProfile?.department || ''}
                      onChange={(e) => setEditedProfile({...editedProfile, department: e.target.value})}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span>{profile?.department || 'Not set'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <div className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50">
                    <Award className="h-4 w-4 text-gray-500" />
                    <span className="capitalize">{profile?.role || 'employee'}</span>
                    <Badge 
                      variant="secondary" 
                      className={
                        profile?.role === 'admin' ? 'bg-red-100 text-red-800' :
                        profile?.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }
                    >
                      {profile?.role || 'employee'}
                    </Badge>
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-3 mt-6 pt-4 border-t">
                  <Button onClick={handleSave} className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={handleCancel} className="flex-1">
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skills Card */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Skills & Expertise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {profile?.skills?.map((skill: string, index: number) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1 text-sm">
                    {skill}
                  </Badge>
                ))}
                {(!profile?.skills || profile.skills.length === 0) && (
                  <p className="text-muted-foreground">No skills added yet</p>
                )}
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Top Skills by Task Count</h4>
                {topSkills.map(({ skill, count }) => (
                  <div key={skill} className="flex items-center justify-between">
                    <span className="text-sm">{skill}</span>
                    <div className="flex items-center gap-2">
                      <Progress value={(count / tasks.length) * 100} className="w-20 h-2" />
                      <span className="text-xs text-muted-foreground w-8">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics Sidebar */}
        <div className="space-y-6">
          {/* Profile Summary */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="h-20 w-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {profile?.fullName?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                </div>
                <h3 className="text-lg font-semibold">{profile?.fullName || 'User'}</h3>
                <p className="text-muted-foreground">{profile?.designation || 'Employee'}</p>
                <Badge variant="outline" className="mt-2">
                  {profile?.department || 'General'}
                </Badge>
                
                <div className="mt-4 pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Member since</span>
                    <span>{profile?.joinDate ? new Date(profile.joinDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Stats */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Performance Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Completion Rate</span>
                </div>
                <span className="font-semibold">{stats.productivity}%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Avg. Time/Task</span>
                </div>
                <span className="font-semibold">{avgCompletionTime.toFixed(1)} days</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">On Time Rate</span>
                </div>
                <span className="font-semibold">
                  {tasks.length > 0 
                    ? Math.round(((tasks.length - stats.overdueTasks) / tasks.length) * 100)
                    : 100
                  }%
                </span>
              </div>

              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Total Tasks</span>
                  <span className="font-medium">{stats.totalTasks}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-medium text-green-600">{stats.completedTasks}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Achievements */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Recent Achievements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {completedTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-2 border rounded-lg">
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Completed {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'Recently'}
                    </p>
                  </div>
                </div>
              ))}
              
              {completedTasks.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Complete tasks to see achievements here
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};