// dialogs/EmployeeDetailsDialog.tsx
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Employee } from '../types/managerTypes';

interface EmployeeDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
}

export const EmployeeDetailsDialog = ({
  open,
  onOpenChange,
  employee
}: EmployeeDetailsDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Employee Details</DialogTitle>
      </DialogHeader>
      
      {employee && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
              {employee.fullName.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h3 className="text-xl font-semibold">{employee.fullName}</h3>
              <p className="text-muted-foreground">{employee.role}</p>
              <p className="text-sm text-muted-foreground">{employee.department}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{employee.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Productivity</p>
              <p className="font-medium">{employee.productivity}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Tasks</p>
              <p className="font-medium">{employee.completedTasks}/{employee.totalTasks}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Hours</p>
              <p className="font-medium">{employee.totalHours}h</p>
            </div>
          </div>
          
          <div>
            <p className="text-muted-foreground text-sm mb-2">Performance</p>
            <Progress value={employee.productivity} className="h-2" />
          </div>
          
          <div>
            <p className="text-muted-foreground text-sm mb-2">Last Active</p>
            <p className="font-medium">
              {new Date(employee.lastActive).toLocaleString()}
            </p>
          </div>
        </div>
      )}
      
      <div className="flex justify-end pt-4">
        <Button onClick={() => onOpenChange(false)}>
          Close
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);