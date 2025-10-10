// views/EmployeesView.tsx
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Eye, Download } from 'lucide-react';
import type { Employee, Stats } from '../types/managerTypes';

interface EmployeesViewProps {
  employees: Employee[];
  stats: Stats;
  onViewEmployee: (employee: Employee) => void;
}

export const EmployeesView = ({ employees, stats, onViewEmployee }: EmployeesViewProps) => {
  // Filter out admins, managers, and HR, keep only employees
  const filteredEmployees = employees.filter(employee => 
    employee.role.toLowerCase() !== 'admin' && 
    employee.role.toLowerCase() !== 'manager' &&
    employee.role.toLowerCase() !== 'hr'
  );

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gradient">Team Management</h1>
            <p className="text-muted-foreground">Manage and monitor your team members</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Employee List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => (
          <Card key={employee.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {employee.fullName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{employee.fullName}</h3>
                    <p className="text-sm text-muted-foreground">{employee.role}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewEmployee(employee)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Productivity</span>
                  <span className="font-medium">{employee.productivity}%</span>
                </div>
                <Progress value={employee.productivity} className="h-2" />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Tasks</p>
                    <p className="font-medium">{employee.completedTasks}/{employee.totalTasks}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Hours</p>
                    <p className="font-medium">{employee.totalHours}h</p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">
                    Last active: {new Date(employee.lastActive).toLocaleDateString()}
                  </span>
                  <Badge variant={
                    employee.productivity >= 80 ? "default" :
                    employee.productivity >= 60 ? "secondary" : "destructive"
                  }>
                    {employee.productivity >= 80 ? "Excellent" :
                     employee.productivity >= 60 ? "Good" : "Needs Improvement"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};