import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Building2, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavbarProps {
  showAuthButtons?: boolean;
  onSignUpClick?: () => void;
  onSignInClick?: () => void;
}

export const Navbar = ({ 
  showAuthButtons = true, 
  onSignUpClick, 
  onSignInClick 
}: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isAuthPage = location.pathname === '/auth';

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo - Increased size */}
          <Link to="/" className="flex items-center space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold text-gradient">TaskVise</span>
              <p className="text-sm text-muted-foreground hidden sm:block">
                Streamline Your Workflow
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {showAuthButtons && !isAuthPage && (
              <>
                <Button 
                  variant="ghost" 
                  onClick={onSignInClick}
                  className="hover:bg-accent text-base"
                >
                  Sign In
                </Button>
                <Button 
                  variant="hero" 
                  onClick={onSignUpClick}
                  className="shadow-md text-base px-6 py-2"
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-10 w-10"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t py-4">
            <div className="flex flex-col space-y-4">
              {showAuthButtons && !isAuthPage && (
                <>
                  <Button 
                    variant="ghost" 
                    onClick={onSignInClick}
                    className="justify-start text-base h-12"
                  >
                    Sign In
                  </Button>
                  <Button 
                    variant="hero" 
                    onClick={onSignUpClick}
                    className="justify-center text-base h-12"
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};