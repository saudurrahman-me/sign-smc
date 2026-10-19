import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Shield, User as UserIcon, LogOut, Award } from 'lucide-react';
import { SignLogo } from '../brand/SignLogo';
import { useAuth } from '../../context/AuthContext';
import { APP_VERSION } from '../../config/version';

export const Navbar: React.FC = () => {
  const { user, profile, isWebsiteAdmin, isEventManager, isSuperAdmin, signOut } = useAuth();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home', isRoute: false },
    { name: 'About', href: '#about', isRoute: false },
    { name: 'Mission & Vision', href: '#mission', isRoute: false },
    { name: 'Leadership', href: '#leadership', isRoute: false },
    { name: 'Events', href: '#events', isRoute: false },
    { name: 'Certificates', href: '/certificates', isRoute: true },
    { name: 'Membership', href: '#membership', isRoute: false },
    { name: 'Contact', href: '#contact', isRoute: false },
  ];

  const hasAdminAccess = isSuperAdmin || isWebsiteAdmin || isEventManager;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'glass-nav py-2.5 shadow-lg shadow-black/40 border-b border-emerald-900/50'
          : 'bg-[#031D12]/95 backdrop-blur-md py-3.5 border-b border-emerald-900/40'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 lg:gap-4 flex-nowrap">
          {/* Logo Branding */}
          <Link
            to="/"
            className="shrink-0 flex items-center focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded-lg group"
          >
            <SignLogo variant="full" size="md" inverted={true} />
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            className="hidden lg:flex items-center gap-1 xl:gap-2 2xl:gap-3 shrink min-w-0"
            aria-label="Main Navigation"
          >
            {navLinks.map((link) => {
              if (link.isRoute) {
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={`px-2.5 xl:px-3 py-1.5 rounded-lg text-xs xl:text-sm font-medium transition-all focus:outline-none flex items-center gap-1.5 whitespace-nowrap ${
                      isActive
                        ? 'text-emerald-400 font-semibold bg-emerald-950/70 border border-emerald-800/50 shadow-xs'
                        : 'text-slate-300 hover:text-emerald-300 hover:bg-emerald-950/40'
                    }`}
                  >
                    {link.name === 'Certificates' && <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    <span>{link.name}</span>
                  </Link>
                );
              }

              const targetHref = isHomePage ? link.href : `/${link.href}`;
              const isMission = link.name === 'Mission & Vision';
              return (
                <a
                  key={link.name}
                  href={targetHref}
                  className="px-2.5 xl:px-3 py-1.5 rounded-lg text-xs xl:text-sm font-medium text-slate-300 hover:text-emerald-300 hover:bg-emerald-950/40 transition-all focus:outline-none focus:text-emerald-400 whitespace-nowrap"
                >
                  {isMission ? (
                    <>
                      <span className="hidden xl:inline">Mission &amp; Vision</span>
                      <span className="xl:hidden">Mission</span>
                    </>
                  ) : (
                    link.name
                  )}
                </a>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-3 shrink-0">
            {user ? (
              <div className="flex items-center gap-2">
                {hasAdminAccess && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#016533]/30 text-emerald-300 border border-emerald-500/40 hover:bg-[#016533]/50 transition-all whitespace-nowrap"
                  >
                    <Shield className="w-3.5 h-3.5 shrink-0" />
                    <span>Admin Panel</span>
                  </Link>
                )}
                <Link
                  to="/membership-status"
                  className="inline-flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700 hover:text-white hover:bg-slate-700 transition-all whitespace-nowrap"
                  title={user.email}
                >
                  <UserIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="max-w-[100px] xl:max-w-[130px] truncate">{profile?.full_name || 'My Application'}</span>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all cursor-pointer"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all whitespace-nowrap"
                >
                  Sign In
                </Link>
                <a
                  href="#membership"
                  className="inline-flex items-center justify-center px-3 xl:px-4 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#016533] via-emerald-600 to-[#016533] hover:from-[#015229] hover:to-emerald-500 shadow-md shadow-emerald-950/40 transition-all transform hover:-translate-y-0.5 whitespace-nowrap"
                >
                  <span className="hidden xl:inline">Apply for Membership</span>
                  <span className="xl:hidden">Apply</span>
                </a>
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger Button */}
          <div className="flex lg:hidden items-center gap-2 shrink-0">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="lg:hidden border-t border-emerald-900/50 bg-[#031D12]/98 px-4 pt-3 pb-6 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => {
              if (link.isRoute) {
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-emerald-950/60 text-emerald-400 font-bold border border-emerald-800/40'
                        : 'text-slate-200 hover:text-emerald-400 hover:bg-emerald-950/40'
                    }`}
                  >
                    {link.name === 'Certificates' && <Award className="w-4 h-4 text-emerald-400" />}
                    <span>{link.name}</span>
                  </Link>
                );
              }

              const targetHref = isHomePage ? link.href : `/${link.href}`;
              return (
                <a
                  key={link.name}
                  href={targetHref}
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:text-emerald-400 hover:bg-emerald-950/40 transition-colors"
                >
                  {link.name}
                </a>
              );
            })}

            <div className="pt-4 mt-2 border-t border-slate-800 flex flex-col gap-2">
              {user ? (
                <>
                  <div className="px-3 py-2 text-xs text-slate-400 bg-slate-800/40 rounded-lg">
                    Signed in as <span className="font-semibold text-slate-200">{profile?.full_name || user.email}</span>
                  </div>
                  {hasAdminAccess && (
                    <Link
                      to="/admin"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-[#016533]/20 text-emerald-300 border border-emerald-500/30"
                    >
                      <Shield className="w-4 h-4" />
                      Admin Dashboard
                    </Link>
                  )}
                  <Link
                    to="/membership-status"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-200 bg-slate-800"
                  >
                    <UserIcon className="w-4 h-4 text-emerald-400" />
                    My Application Status
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="w-full text-center px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 transition-all"
                  >
                    Sign In
                  </Link>
                  <a
                    href="#membership"
                    onClick={() => setIsOpen(false)}
                    className="w-full text-center px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-[#016533] via-emerald-600 to-[#016533] shadow-md transition-all"
                  >
                    Apply for Membership
                  </a>
                </>
              )}
              <div className="pt-2 text-center border-t border-emerald-950/60 mt-1">
                <span className="text-[10px] font-mono text-emerald-400/80">SIGN SMC • {APP_VERSION}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
