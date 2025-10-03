import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Eye, EyeOff, UserCheck, CheckCircle, Shield, Users, UserPlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import AOS from 'aos';
import 'aos/dist/aos.css';

interface EnhancedCredentialsProps {
  employeeName: string;
  username: string;
  password: string;
  role: 'admin' | 'manager' | 'employee';
  onCreateAnother: () => void;
  onGoToSignIn: () => void;
}

export const EnhancedCredentials = ({ 
  employeeName, 
  username, 
  password,
  role,
  onCreateAnother,
  onGoToSignIn
}: EnhancedCredentialsProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    AOS.init({
      duration: 600,
      easing: 'ease-out-cubic',
      once: true,
    });
  }, []);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard`,
    });
  };

  const getRoleIcon = () => {
    switch (role) {
      case 'admin':
        return Shield;
      case 'manager':
        return Users;
      default:
        return UserCheck;
    }
  };

  const getRoleColor = () => {
    switch (role) {
      case 'admin':
        return 'bg-red-500';
      case 'manager':
        return 'bg-green-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getRoleTitle = () => {
    switch (role) {
      case 'admin':
        return 'Admin Credentials Generated!';
      case 'manager':
        return 'Manager Credentials Generated!';
      default:
        return 'Employee Credentials Generated!';
    }
  };

  const getRoleDescription = () => {
    switch (role) {
      case 'admin':
        return 'Administrator account with full system access';
      case 'manager':
        return 'Manager account with team management access';
      default:
        return 'Employee account created successfully';
    }
  };

  const RoleIcon = getRoleIcon();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <div data-aos="zoom-in" className="w-full max-w-md">
        <Card className="shadow-lg border-0 bg-card/95 backdrop-blur">
          <CardHeader className="text-center">
            <div data-aos="bounce" data-aos-delay="200" className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${getRoleColor()} shadow-lg`}>
              <RoleIcon className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gradient">
              {getRoleTitle()}
            </CardTitle>
            <CardDescription className="text-base">
              {getRoleDescription()}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Success Animation */}
            <div data-aos="fade-up" data-aos-delay="300" className="text-center">
              <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="text-sm text-success font-medium">Account created and ready to use</p>
            </div>

            {/* Employee Name - Prominent Display */}
            <div data-aos="fade-up" data-aos-delay="400" className={`text-center p-6 ${getRoleColor()}/10 rounded-xl border border-primary/20`}>
              <p className="text-sm text-muted-foreground mb-2">{role.charAt(0).toUpperCase() + role.slice(1)} Name</p>
              <h2 className="text-2xl font-bold text-gradient">{employeeName}</h2>
            </div>

            {/* Credentials Section */}
            <div data-aos="fade-up" data-aos-delay="500" className="space-y-4">
              <h3 className="text-lg font-semibold text-center">Login Credentials</h3>
              
              {/* Username */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Username</label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 p-3 bg-muted/30 rounded-lg border font-mono text-sm">
                    {username}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(username, 'Username')}
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Password</label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 p-3 bg-muted/30 rounded-lg border font-mono text-sm">
                    {showPassword ? password : '••••••••'}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="shrink-0"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(password, 'Password')}
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div data-aos="fade-up" data-aos-delay="600" className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Important:</h4>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• Share these credentials with the employee</li>
                <li>• Employee must login separately to access their dashboard</li>
                <li>• {role === 'admin' ? 'Admin access includes all system privileges' : role === 'manager' ? 'Manager access includes team management features' : 'Employee can access personal dashboard and tasks'}</li>
                <li>• Change password after first login</li>
                <li>• Contact admin for any access issues</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div data-aos="fade-up" data-aos-delay="700" className="space-y-3">
              <Button 
                onClick={onCreateAnother}
                className="w-full"
                variant="outline"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Create Another Account
              </Button>
              
              <Button 
                onClick={onGoToSignIn}
                className="w-full"
                variant="default"
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Go to Sign In
              </Button>
            </div>

            {/* Dashboard Access Info */}
            <div data-aos="fade-up" data-aos-delay="800" className="text-center p-4 bg-muted/20 rounded-lg">
              <p className="text-sm text-muted-foreground">
                After signing in, you'll be directed to your{' '}
                <span className="font-medium text-primary">{role} dashboard</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};