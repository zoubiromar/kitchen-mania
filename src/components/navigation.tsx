'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import { useRouter } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  // Only show protected pages when logged in
  const navItems = user ? [
    { href: '/', label: 'Home' },
    { href: '/pantry', label: 'My Pantry' },
    { href: '/recipes', label: 'Recipes' },
    { href: '/tracker', label: 'Price Tracker' },
  ] : [
    { href: '/', label: 'Home' },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-white shadow-sm border-b relative">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-xl font-bold text-gray-900">
              🍳 KitchenMania
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={pathname === item.href ? 'default' : 'ghost'}
                  size="sm"
                >
                  {item.label}
                </Button>
              </Link>
            ))}
            {user ? (
              <>
                <Link href="/account">
                  <Button
                    variant={pathname === '/account' ? 'default' : 'ghost'}
                    size="sm"
                  >
                    <User className="w-4 h-4 mr-1" />
                    My Account
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button
                  variant={pathname === '/login' ? 'default' : 'ghost'}
                  size="sm"
                >
                  Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b shadow-lg z-50">
            <div className="py-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div
                    className={`px-4 py-3 hover:bg-gray-100 ${
                      pathname === item.href ? 'bg-gray-100 font-semibold' : ''
                    }`}
                  >
                    {item.label}
                  </div>
                </Link>
              ))}
              
              {/* Divider */}
              <div className="border-t my-2"></div>
              
              {user ? (
                <>
                  <Link
                    href="/account"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div
                      className={`px-4 py-3 hover:bg-gray-100 flex items-center ${
                        pathname === '/account' ? 'bg-gray-100 font-semibold' : ''
                      }`}
                    >
                      <User className="w-4 h-4 mr-2" />
                      My Account
                    </div>
                  </Link>
                  <div
                    onClick={handleSignOut}
                    className="px-4 py-3 hover:bg-gray-100 flex items-center cursor-pointer text-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </div>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div
                    className={`px-4 py-3 hover:bg-gray-100 ${
                      pathname === '/login' ? 'bg-gray-100 font-semibold' : ''
                    }`}
                  >
                    Login
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
} 