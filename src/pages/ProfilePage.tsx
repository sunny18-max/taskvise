import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  Award,
  Edit,
  Save,
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const ProfilePage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: '',
    location: '',
    skills: '',
  });

  // Initialize editedProfile when profile loads
  useEffect(() => {
    if (profile) {
      setEditedProfile({
        fullName: profile.fullName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        department: profile.department || '',
        location: profile.location || '',
        skills: profile.skills?.join(', ') || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user || !profile) return;

    setIsLoading(true);
    try {
      // Update profile in Firestore
      await updateDoc(doc(db, 'employees', user.uid), {
        phone: editedProfile.phone,
        location: editedProfile.location,
        skills: editedProfile.skills.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0),
      });

      // Refresh profile data
      await refreshProfile();

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: "There was an error updating your profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setEditedProfile({
        fullName: profile.fullName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        department: profile.department || '',
        location: profile.location || '',
        skills: profile.skills?.join(', ') || '',
      });
    }
    setIsEditing(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'manager': return 'default';
      case 'employee': return 'secondary';
      default: return 'secondary';
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Profile...</h1>
          <p className="text-muted-foreground">Please wait while we load your profile information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="animate-slide-up">
        <h1 className="text-3xl font-bold text-gradient">My Profile</h1>
        <p className="text-muted-foreground">Manage your personal information and settings</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 animate-slide-up animate-delay-100">
        {/* Profile Overview */}
        <Card className="card-professional border-0 shadow-lg hover-lift">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-primary text-white text-2xl font-bold">
              {profile.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
            </div>
            <CardTitle className="text-xl">{profile.fullName}</CardTitle>
            <Badge variant={getRoleColor(profile.role || 'employee')} className="mx-auto">
              {profile.role?.charAt(0).toUpperCase() + profile.role?.slice(1)}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{profile.email}</span>
            </div>
            {profile.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{profile.phone}</span>
              </div>
            )}
            {profile.department && (
              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{profile.department}</span>
              </div>
            )}
            {profile.location && (
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{profile.location}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="lg:col-span-2 card-professional border-0 shadow-lg hover-lift">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  className="flex items-center gap-2"
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="flex items-center gap-2"
                  disabled={isLoading}
                >
                  <Save className="h-4 w-4" />
                  {isLoading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                {isEditing ? (
                  <Input
                    id="fullName"
                    value={editedProfile.fullName}
                    onChange={(e) => setEditedProfile({ ...editedProfile, fullName: e.target.value })}
                    disabled={profile.role === 'employee'} // Employees can't edit name
                  />
                ) : (
                  <p className="text-sm font-medium">{profile.fullName}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={editedProfile.email}
                    onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                    disabled={profile.role === 'employee'} // Employees can't edit email
                  />
                ) : (
                  <p className="text-sm font-medium">{profile.email}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    value={editedProfile.phone}
                    onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <p className="text-sm font-medium">{profile.phone || 'Not provided'}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                {isEditing ? (
                  <Input
                    id="department"
                    value={editedProfile.department}
                    onChange={(e) => setEditedProfile({ ...editedProfile, department: e.target.value })}
                    disabled={profile.role === 'employee'} // Employees can't edit department
                  />
                ) : (
                  <p className="text-sm font-medium">{profile.department || 'Not assigned'}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                {isEditing ? (
                  <Input
                    id="location"
                    value={editedProfile.location}
                    onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                    placeholder="Enter your location"
                  />
                ) : (
                  <p className="text-sm font-medium">{profile.location || 'Not provided'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="designation">Designation</Label>
                <p className="text-sm font-medium">{profile.designation || 'Not assigned'}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="skills">Skills</Label>
              {isEditing ? (
                <Textarea
                  id="skills"
                  placeholder="Comma-separated skills (e.g., JavaScript, React, Node.js)"
                  value={editedProfile.skills}
                  onChange={(e) => setEditedProfile({ ...editedProfile, skills: e.target.value })}
                  rows={3}
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.skills && profile.skills.length > 0 ? (
                    profile.skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        <Award className="h-3 w-3 mr-1" />
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No skills listed</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};