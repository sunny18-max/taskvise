import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Monitor, 
  Moon, 
  Sun, 
  Shield,
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';

export const SettingsPage = () => {
  // FIX: Changed from updatePassword to changePassword
  const { profile, changePassword } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    taskReminders: true,
    deadlineAlerts: true,
    theme: 'system',
    language: 'en',
    timezone: 'UTC',
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleSaveSettings = () => {
    // In a real app, this would save to backend
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  const handleExportData = () => {
    // Export user data
    toast({
      title: "Data exported",
      description: "Your data has been exported successfully.",
    });
  };

  const handleImportData = () => {
    // Import user data
    toast({
      title: "Data imported",
      description: "Your data has been imported successfully.",
    });
  };

  const handleDeleteAccount = () => {
    // Delete account with confirmation
    toast({
      title: "Account deletion requested",
      description: "Please contact admin to delete your account.",
      variant: "destructive",
    });
  };

  const handlePasswordChange = async () => {
    // Validate passwords
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New password and confirmation do not match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "New password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingPassword(true);

    try {
      // FIX: Using changePassword instead of updatePassword
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });

      // Clear password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Password update error:', error);
      
      let errorMessage = "Failed to update password. Please try again.";
      
      if (error.message.includes('Current password is incorrect')) {
        errorMessage = "Current password is incorrect.";
      } else if (error.message.includes('too weak')) {
        errorMessage = "New password is too weak. Please choose a stronger password.";
      } else if (error.message.includes('log in again')) {
        errorMessage = "For security, please log in again before changing your password.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handlePasswordInputChange = (field: keyof typeof passwordData, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6 p-6">
      <div className="animate-slide-up">
        <h1 className="text-3xl font-bold text-gradient">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and application settings</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 animate-slide-up animate-delay-100">
        {/* Notification Settings */}
        <Card className="card-professional border-0 shadow-lg hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive task updates via email</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, emailNotifications: checked })
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Browser push notifications</p>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, pushNotifications: checked })
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Task Reminders</Label>
                <p className="text-sm text-muted-foreground">Remind me about upcoming tasks</p>
              </div>
              <Switch
                checked={settings.taskReminders}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, taskReminders: checked })
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Deadline Alerts</Label>
                <p className="text-sm text-muted-foreground">Alert me about approaching deadlines</p>
              </div>
              <Switch
                checked={settings.deadlineAlerts}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, deadlineAlerts: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card className="card-professional border-0 shadow-lg hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select
                value={settings.theme}
                onValueChange={(value) => setSettings({ ...settings, theme: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      Light
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      Dark
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      System
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Language</Label>
              <Select
                value={settings.language}
                onValueChange={(value) => setSettings({ ...settings, language: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select
                value={settings.timezone}
                onValueChange={(value) => setSettings({ ...settings, timezone: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="EST">Eastern Time</SelectItem>
                  <SelectItem value="PST">Pacific Time</SelectItem>
                  <SelectItem value="GMT">Greenwich Mean Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="card-professional border-0 shadow-lg hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? 'text' : 'password'}
                  placeholder="Enter current password"
                  value={passwordData.currentPassword}
                  onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Password must be at least 6 characters long
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handlePasswordChange}
              disabled={isUpdatingPassword}
            >
              {isUpdatingPassword ? 'Updating Password...' : 'Update Password'}
            </Button>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="card-professional border-0 shadow-lg hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              onClick={handleExportData}
              className="w-full flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export My Data
            </Button>
            
            <Button
              variant="outline"
              onClick={handleImportData}
              className="w-full flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Import Data
            </Button>
            
            {profile?.role !== 'admin' && (
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                className="w-full flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Request Account Deletion
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Save Settings Button */}
      <div className="flex justify-end animate-slide-up animate-delay-200">
        <Button onClick={handleSaveSettings} className="px-8">
          Save All Settings
        </Button>
      </div>
    </div>
  );
};