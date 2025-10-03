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
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient">TaskVise</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {showAuthButtons && !isAuthPage && (
              <>
                <Button 
                  variant="ghost" 
                  onClick={onSignInClick}
                  className="hover:bg-accent"
                >
                  Sign In
                </Button>
                <Button 
                  variant="hero" 
                  onClick={onSignUpClick}
                  className="shadow-md"
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
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t py-4">
            <div className="flex flex-col space-y-3">
              {showAuthButtons && !isAuthPage && (
                <>
                  <Button 
                    variant="ghost" 
                    onClick={onSignInClick}
                    className="justify-start"
                  >
                    Sign In
                  </Button>
                  <Button 
                    variant="hero" 
                    onClick={onSignUpClick}
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