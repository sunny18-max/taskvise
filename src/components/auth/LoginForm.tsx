import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/navigation/Navbar';
import { Eye, EyeOff, Building2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const loginSchema = z.object({
  username: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onToggleMode: () => void;
}

export const LoginForm = ({ onToggleMode }: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const { toast } = useToast();
  const { signIn, resetPassword } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      // Import Firebase auth directly
      const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth');
      
      // Get the Firebase auth instance
      const auth = getAuth();
      if (!auth) {
        throw new Error('Firebase auth not available');
      }

      // Sign in with email and password
      const userCredential = await signInWithEmailAndPassword(auth, data.username, data.password);
      const user = userCredential.user;
      
      // Get the token and store it in localStorage
      const token = await user.getIdToken();
      localStorage.setItem('authToken', token);
      
      console.log('Token stored successfully:', token);
      
      // Now call the AuthProvider's signIn method to handle role-based redirection
      await signIn(data.username, data.password);
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific Firebase auth errors
      let errorMessage = 'Invalid email or password';
      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError('password', {
        type: 'manual',
        message: errorMessage
      });
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsSendingReset(true);
    try {
      await resetPassword(forgotPasswordEmail);
      toast({
        title: "Reset email sent",
        description: "Check your email for password reset instructions",
      });
      setForgotPasswordOpen(false);
      setForgotPasswordEmail('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar showAuthButtons={false} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Welcome Content */}
          <div className="hidden lg:block">
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold mb-4">
                  Welcome to <span className="text-gradient">TaskVise</span>
                </h1>
                <p className="text-xl text-muted-foreground">
                  Your comprehensive workforce management solution
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Efficient resource management</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Real-time project tracking</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Advanced analytics and reporting</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Role-based access control</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <Card className="card-professional shadow-xl">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                <CardDescription>
                  Sign in to your TaskVise account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Email Address</Label>
                    <Input
                      id="username"
                      type="email"
                      placeholder="Enter your email address"
                      {...register('username')}
                      className={errors.username ? 'border-destructive' : ''}
                    />
                    {errors.username && (
                      <p className="text-sm text-destructive flex items-center space-x-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>{errors.username.message}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        {...register('password')}
                        className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive flex items-center space-x-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>{errors.password.message}</span>
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="link"
                          className="p-0 h-auto text-xs"
                        >
                          Forgot password?
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reset Password</DialogTitle>
                          <DialogDescription>
                            Enter your email address and we'll send you instructions to reset your password.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            type="email"
                            placeholder="Enter your email"
                            value={forgotPasswordEmail}
                            onChange={(e) => setForgotPasswordEmail(e.target.value)}
                          />
                          <Button 
                            onClick={handleForgotPassword} 
                            disabled={isSendingReset}
                            className="w-full"
                          >
                            {isSendingReset ? 'Sending...' : 'Send Reset Instructions'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    variant="hero"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Need to create employee accounts?{' '}
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto font-semibold"
                      onClick={onToggleMode}
                    >
                      Admin Sign Up
                    </Button>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};