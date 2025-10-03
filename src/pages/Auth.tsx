import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';
import { UnifiedSignupForm } from '@/components/auth/UnifiedSignupForm';
import { EnhancedCredentials } from '@/components/auth/EnhancedCredentials';
import { useAuth } from '@/components/auth/AuthProvider';

export const Auth = () => {
  const [mode, setMode] = useState<'login' | 'signup' | 'credentials'>('login');
  const [credentials, setCredentials] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile, isLoading } = useAuth();

  // Check for mode parameter in URL
  useEffect(() => {
    const urlMode = searchParams.get('mode');
    if (urlMode === 'signup') {
      setMode('signup');
    }
  }, [searchParams]);

  // Handle manual redirect if needed
  useEffect(() => {
    if (user && profile && (window.location.pathname === '/auth' || window.location.pathname === '/')) {
      // User is authenticated and on auth page, but AuthProvider should handle redirect
      // If stuck, provide a manual redirect option
      const timer = setTimeout(() => {
        console.log('Manual redirect triggered');
        if (profile.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else if (profile.role === 'manager') {
          navigate('/manager/dashboard', { replace: true });
        } else {
          navigate('/employee/dashboard', { replace: true });
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [user, profile, navigate]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is already authenticated, show a redirect message with manual option
  if (user && profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Redirecting to your dashboard</h2>
          <p className="text-muted-foreground mb-4">Please wait...</p>
          <button
            onClick={() => {
              if (profile.role === 'admin') {
                navigate('/admin/dashboard', { replace: true });
              } else if (profile.role === 'manager') {
                navigate('/manager/dashboard', { replace: true });
              } else {
                navigate('/employee/dashboard', { replace: true });
              }
            }}
            className="text-primary hover:underline"
          >
            Click here if not redirected automatically
          </button>
        </div>
      </div>
    );
  }

  const handleToggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
  };

  const handleCredentialsGenerated = (creds: any) => {
    setCredentials(creds);
    setMode('credentials');
  };

  const handleCreateAnother = () => {
    setMode('signup');
    setCredentials(null);
  };

  const handleGoToSignIn = () => {
    setMode('login');
    setCredentials(null);
  };

  if (mode === 'credentials' && credentials) {
    return (
      <EnhancedCredentials
        employeeName={credentials.employeeData.fullName}
        username={credentials.username}
        password={credentials.password}
        role={credentials.employeeData.role}
        onCreateAnother={handleCreateAnother}
        onGoToSignIn={handleGoToSignIn}
      />
    );
  }

  if (mode === 'signup') {
    return (
      <UnifiedSignupForm
        onToggleMode={handleToggleMode}
        onCredentialsGenerated={handleCredentialsGenerated}
      />
    );
  }

  return (
    <LoginForm onToggleMode={handleToggleMode} />
  );
};