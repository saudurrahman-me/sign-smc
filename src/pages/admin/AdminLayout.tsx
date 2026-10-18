import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SignLogo } from '../../components/brand/SignLogo';
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileCheck,
  ShieldCheck,
  Settings,
  History,
  Home,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, profile, isSuperAdmin, isWebsiteAdmin, isEventManager, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Role-aware navigation links
  const navItems = [
    {
      name: 'Overview',
      path: '/admin',
      icon: LayoutDashboard,
      visible: true,
    },
    {
      name: 'Events Management',
      path: '/admin/events',
      icon: Calendar,
      visible: isEventManager || isSuperAdmin || isWebsiteAdmin,
    },
    {
      name: 'Leadership & Nominees',
      path: '/admin/leadership',
      icon: Users,
      visible: isWebsiteAdmin || isSuperAdmin,
    },
    {
      name: 'Membership Applications',
      path: '/admin/applications',
      icon: FileCheck,
      visible: isSuperAdmin || isWebsiteAdmin,
    },
    {
      name: 'Content & Settings',
      path: '/admin/settings',
      icon: Settings,
      visible: isWebsiteAdmin || isSuperAdmin,
    },
    {
      name: 'Users & Roles',
      path: '/admin/users',
      icon: ShieldCheck,
      visible: isSuperAdmin, // Strictly Super Admin
    },
    {
      name: 'Security Audit Logs',
      path: '/admin/audit',
      icon: History,
      visible: isSuperAdmin, // Strictly Super Admin
    },
  ].filter((item) => item.visible);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'super_admin':
        return { label: 'Super Admin', color: 'bg-purple-900/60 text-purple-300 border-purple-500/40' };
      case 'website_admin':
        return { label: 'Website Admin', color: 'bg-emerald-900/60 text-emerald-300 border-emerald-500/40' };
      case 'event_manager':
        return { label: 'Event Manager', color: 'bg-[#016533]/40 text-emerald-300 border-emerald-500/40' };
      default:
        return { label: 'Authorized Member', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const badge = getRoleBadge(profile?.role);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col bg-slate-900 border-r border-slate-800 p-4 justify-between">
        <div>
          {/* Logo Brand Header */}
          <div className="pb-6 mb-6 border-b border-slate-800">
            <Link to="/" className="block">
              <SignLogo variant="full" size="sm" inverted={true} />
            </Link>
            <div className="mt-4 flex items-center justify-between">
              <span
                className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${badge.color}`}
              >
                {badge.label}
              </span>
              <span className="text-[11px] text-slate-500">v1.0.0</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1" aria-label="Admin Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#016533]/25 text-emerald-300 border border-emerald-500/35'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <div className="px-3 py-2 rounded-xl bg-slate-800/40 text-xs">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">
              Authenticated Operator
            </span>
            <span className="text-slate-200 font-medium truncate block" title={user?.email}>
              {profile?.full_name || user?.email}
            </span>
          </div>

          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Public Website</span>
          </Link>

          <button
            onClick={() => {
              signOut();
              navigate('/');
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
        <SignLogo variant="icon" size="sm" />
        <span
          className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${badge.color}`}
        >
          {badge.label}
        </span>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-300"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold ${
                  isActive
                    ? 'bg-[#016533]/25 text-emerald-300'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <Link to="/" className="text-xs text-slate-400 hover:text-emerald-400">
              Public Site
            </Link>
            <button
              onClick={() => {
                signOut();
                navigate('/');
              }}
              className="text-xs text-rose-400"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Admin Content Body */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
