import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Mail, 
  Phone, 
  Calendar, 
  Building, 
  Target,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';

interface TeamMemberDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamMember: any;
}

export const TeamMemberDetailsDialog = ({
  open,
  onOpenChange,
  teamMember
}: TeamMemberDetailsDialogProps) => {
  if (!teamMember) return null;

  const getStatusBadge = () => {
    if (!teamMember.isActive) {
      return <Badge variant="destructive">Inactive</Badge>;
    }
    if (teamMember.onLeave) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">On Leave</Badge>;
    }
    return <Badge variant="default" className="bg-green-50 text-green-700">Active</Badge>;
  };

  const getProductivityColor = (productivity: number) => {
    if (productivity >= 80) return 'text-green-600';
    if (productivity >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Team Member Details</DialogTitle>
          <DialogDescription>
            Detailed information about {teamMember.fullName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={teamMember.avatarUrl} />
              <AvatarFallback className="text-lg">
                {teamMember.fullName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold">{teamMember.fullName}</h3>
                  <p className="text-muted-foreground">{teamMember.designation}</p>
                </div>
                {getStatusBadge()}
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Personal Information */}
            <div className="space-y-4">
              <h4 className="font-semibold">Personal Information</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{teamMember.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">
                      {teamMember.phone || 'Not provided'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Join Date</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(teamMember.joinDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4">
              <h4 className="font-semibold">Professional Information</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Department</p>
                    <p className="text-sm text-muted-foreground">{teamMember.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Role</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {teamMember.role?.replace('_', ' ') || 'team member'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Employee ID</p>
                    <p className="text-sm text-muted-foreground">{teamMember.uid}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Skills */}
          {teamMember.skills && teamMember.skills.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {teamMember.skills.map((skill: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Performance Metrics */}
          <div className="space-y-4">
            <h4 className="font-semibold">Performance Metrics</h4>
            
            {/* Productivity */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Productivity</span>
                <span className={`font-medium ${getProductivityColor(teamMember.productivity)}`}>
                  {teamMember.productivity}%
                </span>
              </div>
              <Progress value={teamMember.productivity} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 rounded-lg border">
                <Target className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <p className="text-xl font-bold text-blue-600">{teamMember.totalTasks}</p>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
              </div>
              <div className="p-3 rounded-lg border">
                <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-xl font-bold text-green-600">{teamMember.completedTasks}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <div className="p-3 rounded-lg border">
                <Clock className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <p className="text-xl font-bold text-purple-600">{teamMember.totalHours}h</p>
                <p className="text-sm text-muted-foreground">Total Hours</p>
              </div>
              <div className="p-3 rounded-lg border">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                <p className="text-xl font-bold text-orange-600">{teamMember.projects}</p>
                <p className="text-sm text-muted-foreground">Projects</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button>
              Send Message
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};