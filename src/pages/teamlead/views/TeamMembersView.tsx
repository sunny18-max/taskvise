import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Search, 
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  Target,
  CheckCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TeamMembersViewProps {
  teamMembers: any[];
  onViewTeamMember: (member: any) => void;
  onAssignTask: () => void;
}

export const TeamMembersView = ({
  teamMembers,
  onViewTeamMember,
  onAssignTask
}: TeamMembersViewProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter out admins, managers, HR, and team leads, keep only employees
  const filteredTeamMembers = teamMembers.filter(member => {
    const role = member.role?.toLowerCase() || member.designation?.toLowerCase() || '';
    return role !== 'admin' && 
           role !== 'manager' && 
           role !== 'hr' && 
           role !== 'team lead' &&
           role !== 'teamlead';
  });

  const filteredMembers = filteredTeamMembers.filter(member => {
    const matchesSearch = member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.designation.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && member.isActive && !member.onLeave) ||
                         (statusFilter === 'on-leave' && member.onLeave) ||
                         (statusFilter === 'inactive' && !member.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (member: any) => {
    if (!member.isActive) {
      return <Badge variant="destructive">Inactive</Badge>;
    }
    if (member.onLeave) {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
          <p className="text-muted-foreground">
            Manage and monitor your team members
          </p>
        </div>
        <Button onClick={onAssignTask}>
          <CheckCircle className="mr-2 h-4 w-4" />
          Assign Task
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search team members..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="on-leave">On Leave</option>
                <option value="inactive">Inactive</option>
              </select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div 
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => onViewTeamMember(member)}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {member.fullName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{member.fullName}</CardTitle>
                    <p className="text-sm text-muted-foreground">{member.designation}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewTeamMember(member)}>
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onAssignTask}>
                      Assign Task
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Send Message
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {member.email}
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                {member.phone || 'Not provided'}
              </div>

              <div className="flex items-center justify-between">
                <Badge variant="secondary">{member.department}</Badge>
                {getStatusBadge(member)}
              </div>

              {/* Performance Metrics */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Productivity</span>
                  <span className={`font-medium ${getProductivityColor(member.productivity)}`}>
                    {member.productivity}%
                  </span>
                </div>
                <Progress value={member.productivity} className="h-2" />
                
                <div className="grid grid-cols-2 gap-4 text-center text-xs">
                  <div>
                    <Target className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                    <span className="font-medium">{member.totalTasks}</span>
                    <p className="text-muted-foreground">Total Tasks</p>
                  </div>
                  <div>
                    <CheckCircle className="h-4 w-4 mx-auto mb-1 text-green-600" />
                    <span className="font-medium">{member.completedTasks}</span>
                    <p className="text-muted-foreground">Completed</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  className="flex-1" 
                  variant="outline"
                  onClick={() => onViewTeamMember(member)}
                >
                  View Profile
                </Button>
                <Button 
                  size="sm"
                  onClick={onAssignTask}
                >
                  Assign Task
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No team members found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search criteria' 
                : 'No team members available'
              }
            </p>
            <Button onClick={onAssignTask}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Assign Your First Task
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Team Statistics */}
      {filteredMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Team Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center p-4 rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">
                  {filteredTeamMembers.length}
                </div>
                <p className="text-sm text-muted-foreground">Total Members</p>
              </div>
              <div className="text-center p-4 rounded-lg border">
                <div className="text-2xl font-bold text-green-600">
                  {filteredTeamMembers.filter(m => m.isActive && !m.onLeave).length}
                </div>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
              <div className="text-center p-4 rounded-lg border">
                <div className="text-2xl font-bold text-yellow-600">
                  {filteredTeamMembers.filter(m => m.onLeave).length}
                </div>
                <p className="text-sm text-muted-foreground">On Leave</p>
              </div>
              <div className="text-center p-4 rounded-lg border">
                <div className="text-2xl font-bold text-purple-600">
                  {filteredTeamMembers.length > 0 
                    ? Math.round(filteredTeamMembers.reduce((sum, m) => sum + (m.productivity || 0), 0) / filteredTeamMembers.length)
                    : 0
                  }%
                </div>
                <p className="text-sm text-muted-foreground">Avg Productivity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};