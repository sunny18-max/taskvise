import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Mail, 
  Phone, 
  Calendar, 
  Building, 
  Edit,
  MapPin,
  Shield
} from 'lucide-react';

interface EmployeeDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: any;
}

export const EmployeeDetailsDialog = ({
  open,
  onOpenChange,
  employee
}: EmployeeDetailsDialogProps) => {
  if (!employee) return null;

  const getStatusBadge = () => {
    if (!employee.isActive) {
      return <Badge variant="destructive">Inactive</Badge>;
    }
    if (employee.onLeave) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">On Leave</Badge>;
    }
    return <Badge variant="default" className="bg-green-50 text-green-700">Active</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Employee Details</DialogTitle>
          <DialogDescription>
            Detailed information about {employee.fullName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={employee.avatarUrl} />
              <AvatarFallback className="text-lg">
                {employee.fullName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold">{employee.fullName}</h3>
                  <p className="text-muted-foreground">{employee.designation}</p>
                </div>
                <div className="flex gap-2">
                  {getStatusBadge()}
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
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
                    <p className="text-sm text-muted-foreground">{employee.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">
                      {employee.phone || 'Not provided'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Join Date</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(employee.joinDate).toLocaleDateString()}
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
                    <p className="text-sm text-muted-foreground">{employee.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Role</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {employee.role?.replace('_', ' ') || 'employee'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Employee ID</p>
                    <p className="text-sm text-muted-foreground">{employee.uid}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Skills */}
          {employee.skills && employee.skills.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {employee.skills.map((skill: string, index: number) => (
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
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 rounded-lg border">
                <p className="text-2xl font-bold text-blue-600">{employee.totalTasks || 0}</p>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="text-2xl font-bold text-green-600">{employee.completedTasks || 0}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="text-2xl font-bold text-purple-600">{employee.productivity || 0}%</p>
                <p className="text-sm text-muted-foreground">Productivity</p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="text-2xl font-bold text-orange-600">{employee.totalHours || 0}h</p>
                <p className="text-sm text-muted-foreground">Total Hours</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Employee
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};