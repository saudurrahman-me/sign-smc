import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const UnauthorizedPage: React.FC = () => {
  const { user, profile } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 bg-neural-pattern">
      <div className="max-w-md w-full bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-5">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">
          Access Restricted (403)
        </h2>
        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
          The requested administrative view requires elevated permissions that are not assigned to your account.
        </p>

        {user && (
          <div className="mb-6 p-3.5 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-slate-400 text-left">
            <div className="flex justify-between mb-1">
              <span>Account:</span>
              <span className="text-slate-200 font-semibold">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span>Assigned Role:</span>
              <span className="text-teal-400 font-mono font-semibold">
                {profile?.role || 'member'}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-teal-400 to-cyan-300 hover:from-teal-300 hover:to-cyan-200 transition-all shadow-md"
          >
            <Home className="w-4 h-4" />
            Return to Homepage
          </Link>
          <Link
            to="/membership-status"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            My Application
          </Link>
        </div>
      </div>
    </div>
  );
};
