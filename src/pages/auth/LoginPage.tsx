import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SignLogo } from '../../components/brand/SignLogo';
import { Mail, Lock, User, ArrowLeft, AlertCircle, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { signIn, signUp, resetPassword, devSignIn, isConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) {
          setErrorMsg(error.message);
        } else {
          navigate(from, { replace: true });
        }
      } else if (mode === 'signup') {
        if (!fullName.trim()) {
          setErrorMsg('Please enter your full name as registered at SMC.');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg('Password must be at least 6 characters.');
          setIsLoading(false);
          return;
        }
        const { error } = await signUp(email, password, fullName);
        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg(
            'Account registration initiated! If email confirmation is enabled on your Supabase project, check your inbox.'
          );
        }
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg('Password reset instructions have been dispatched to your email.');
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failure';
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#031D12] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-neural-pattern">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Public Website
        </Link>

        <div className="flex justify-center mb-4">
          <SignLogo variant="icon" size="lg" inverted={true} />
        </div>

        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          {mode === 'signin'
            ? 'Sign in to SIGN SMC'
            : mode === 'signup'
            ? 'Create Student Account'
            : 'Reset Account Password'}
        </h2>
        <p className="mt-2 text-xs text-slate-400">
          Student Interest Group in Neurology • Saidu Medical College, Swat
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-[#052919]/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-emerald-900/60">
          {/* Quick Dev Demo Access when in development or Supabase is unconfigured */}
          {(!isConfigured || import.meta.env.DEV) && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-emerald-950/90 via-slate-900 to-[#032014] border border-emerald-500/40 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white tracking-wide">
                    Instant Admin Access
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-semibold uppercase bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Dev Mode
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                Click below to immediately enter the admin control center:
              </p>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    devSignIn('super_admin');
                    navigate(from === '/' ? '/admin' : from, { replace: true });
                  }}
                  className="w-full py-2.5 px-3 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-950/40 flex items-center justify-between transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-200" />
                    <span>Enter as Super Admin (Full Control)</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-200" />
                </button>

                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      devSignIn('website_admin');
                      navigate(from === '/' ? '/admin' : from, { replace: true });
                    }}
                    className="py-2 px-2.5 rounded-lg text-[11px] font-semibold text-slate-200 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/30 text-center transition-colors cursor-pointer"
                  >
                    Website Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      devSignIn('event_manager');
                      navigate(from === '/' ? '/admin' : from, { replace: true });
                    }}
                    className="py-2 px-2.5 rounded-lg text-[11px] font-semibold text-slate-200 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 hover:border-teal-500/30 text-center transition-colors cursor-pointer"
                  >
                    Event Manager
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-emerald-900/60 mb-6 text-xs font-bold">
            <button
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`pb-3 flex-1 text-center border-b-2 transition-all ${
                mode === 'signin'
                  ? 'border-emerald-400 text-emerald-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`pb-3 flex-1 text-center border-b-2 transition-all ${
                mode === 'signup'
                  ? 'border-emerald-400 text-emerald-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Register
            </button>
            <button
              onClick={() => {
                setMode('forgot');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`pb-3 flex-1 text-center border-b-2 transition-all ${
                mode === 'forgot'
                  ? 'border-emerald-400 text-emerald-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Help
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full name as registered at SMC"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.edu.pk"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#016533] via-emerald-600 to-[#016533] hover:from-[#015229] hover:to-emerald-500 disabled:opacity-50 transition-all shadow-md shadow-emerald-950/30 mt-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : mode === 'signin' ? (
                'Sign In'
              ) : mode === 'signup' ? (
                'Create Account'
              ) : (
                'Send Password Reset Link'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
