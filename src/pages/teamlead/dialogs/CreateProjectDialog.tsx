import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamMembers: any[];
  onProjectCreated: (projectData: any) => Promise<boolean>;
  user: any;
}

export const CreateProjectDialog = ({
  open,
  onOpenChange,
  teamMembers,
  onProjectCreated,
  user
}: CreateProjectDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    deadline: '',
    status: 'planning',
    teamMembers: [] as string[]
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await onProjectCreated(formData);
      
      if (success) {
        setFormData({
          name: '',
          description: '',
          deadline: '',
          status: 'planning',
          teamMembers: []
        });
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleTeamMember = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.includes(memberId)
        ? prev.teamMembers.filter(id => id !== memberId)
        : [...prev.teamMembers, memberId]
    }));
  };

  const getMemberName = (memberId: string) => {
    const member = teamMembers.find(m => m.id === memberId);
    return member ? member.fullName : '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Set up a new project and assign team members
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter project name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe the project goals and objectives..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => handleChange('deadline', e.target.value)}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Team Members</Label>
            <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
              {teamMembers
                .filter(member => member.isActive && !member.onLeave)
                .map(member => (
                <div key={member.id} className="flex items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    id={`member-${member.id}`}
                    checked={formData.teamMembers.includes(member.id)}
                    onChange={() => toggleTeamMember(member.id)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label 
                    htmlFor={`member-${member.id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div>
                      <p className="font-medium text-sm">{member.fullName}</p>
                      <p className="text-xs text-muted-foreground">{member.designation}</p>
                    </div>
                  </label>
                </div>
              ))}
            </div>
            
            {/* Selected Members */}
            {formData.teamMembers.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Team Members</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.teamMembers.map(memberId => (
                    <Badge key={memberId} variant="secondary" className="flex items-center gap-1">
                      {getMemberName(memberId)}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => toggleTeamMember(memberId)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating Project...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};