// views/ProfileView.tsx
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProfileViewProps {
  profile: any;
}

export const ProfileView = ({ profile }: ProfileViewProps) => (
  <div>
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gradient">Profile Settings</h1>
      <p className="text-muted-foreground">Manage your account and preferences</p>
    </div>
    <Card className="border-0 shadow-lg max-w-2xl">
      <CardContent className="p-6">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {profile?.fullName?.split(' ').map(n => n[0]).join('') || 'M'}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{profile?.fullName || 'Manager'}</h2>
            <p className="text-muted-foreground">Manager</p>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" value={profile?.fullName || ''} readOnly />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={profile?.email || ''} readOnly />
          </div>
          <div>
            <Label htmlFor="department">Department</Label>
            <Input id="department" value="Management" readOnly />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Input id="role" value="Manager" readOnly />
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);