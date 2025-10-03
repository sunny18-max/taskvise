import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/navigation/Navbar';
import { 
  Users, 
  FolderKanban, 
  CheckSquare, 
  BarChart3, 
  Calendar,
  Shield,
  Clock,
  Target,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

export const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: "Resource Management",
      description: "Efficiently manage employees, interns, and track skills, availability, and workload."
    },
    {
      icon: FolderKanban,
      title: "Project & Task Tracking",
      description: "Organize projects with task dependencies, priorities, and automated progress tracking."
    },
    {
      icon: Calendar,
      title: "Leave Management",
      description: "Handle leave requests with conflict detection and workload optimization."
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Real-time dashboards, utilization reports, and exportable analytics."
    },
    {
      icon: Clock,
      title: "Smart Scheduling",
      description: "AI-powered recommendations for optimal employee-task assignments."
    },
    {
      icon: Shield,
      title: "Role-Based Access",
      description: "Secure access control for Admin, Manager, and Employee roles."
    }
  ];

  const benefits = [
    "50% reduction in resource conflicts",
    "Improved task completion rates",
    "Reduced missed deadlines by 80%",
    "Real-time workload visibility",
    "Automated conflict detection",
    "Comprehensive reporting suite"
  ];

  const handleGetStarted = () => {
    navigate('/auth?mode=signup'); // Default to signup for "Get Started"
  };

  const handleSignUpClick = () => {
    navigate('/auth?mode=signup'); // Explicitly go to signup form
  };

  const handleSignInClick = () => {
    navigate('/auth?mode=login'); // Explicitly go to login form
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar
        showAuthButtons={true} 
        onSignUpClick={handleSignUpClick}  // Fixed: Now goes to signup
        onSignInClick={handleSignInClick}  // Fixed: Now goes to login
      />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-4 px-4 py-2">
              Professional Workforce Management
            </Badge>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl">
              Optimize Your{' '}
              <span className="text-gradient">Workforce</span>{' '}
              with TaskVise
            </h1>
            <p className="mb-8 text-xl text-muted-foreground sm:text-2xl">
              Streamline resource allocation, track projects efficiently, and maximize team productivity with our comprehensive manpower planning solution.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="hero" 
                size="lg" 
                onClick={handleGetStarted}
                className="text-lg px-8 py-4 h-auto"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="text-lg px-8 py-4 h-auto"
              >
                View Demo
              </Button>
            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 animate-float">
          <Card className="p-4 shadow-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <span className="text-sm font-medium">Task Completed</span>
            </div>
          </Card>
        </div>
        <div className="absolute top-32 right-10 animate-float" style={{ animationDelay: '1s' }}>
          <Card className="p-4 shadow-lg">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">98% Efficiency</span>
            </div>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl mb-4">
              Everything You Need for Workforce Management
            </h2>
            <p className="text-xl text-muted-foreground">
              Comprehensive tools designed to optimize your team's performance and productivity.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="card-professional p-6 hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                  </div>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl font-bold sm:text-4xl mb-6">
                Proven Results for Modern Teams
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join hundreds of organizations that have transformed their workforce management with TaskVise.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
              <Button 
                variant="hero" 
                size="lg" 
                onClick={handleGetStarted}
                className="mt-8"
              >
                Start Your Free Trial
              </Button>
            </div>
            
            <div className="lg:order-first">
              <Card className="card-professional p-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Team Efficiency</span>
                    <span className="text-2xl font-bold text-success">+85%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Project Delivery</span>
                    <span className="text-2xl font-bold text-primary">+92%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Resource Utilization</span>
                    <span className="text-2xl font-bold text-warning">+78%</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl mb-6">
              Ready to Transform Your Workforce Management?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of teams already using TaskVise to optimize their operations.
            </p>
            <Button 
              variant="hero" 
              size="lg" 
              onClick={handleGetStarted}
              className="text-lg px-8 py-4 h-auto"
            >
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};