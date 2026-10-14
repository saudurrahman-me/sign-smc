import React from 'react';
import { Link } from 'react-router-dom';
import { X, Lock, UserPlus, LogIn, ArrowRight } from 'lucide-react';

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginRequiredModal: React.FC<LoginRequiredModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 sm:p-8 space-y-5 text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#016533] border border-emerald-200 flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#016533] block mb-1">
            Student Verification Required
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Sign In to Apply
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
            To submit your official SIGN SMC membership application and upload your payment proof,
            please sign in with your account first.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs text-slate-600 space-y-1.5">
          <p className="font-semibold text-slate-800">Why sign in first?</p>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500">
            <li>Your application is securely linked to your student identity.</li>
            <li>Track your membership review and approval status in real-time.</li>
            <li>Receive official chapter notices and verified membership credentials.</li>
          </ul>
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          <Link
            to="/login?apply=true"
            onClick={onClose}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#016533] via-emerald-600 to-[#016533] hover:from-[#015229] hover:to-emerald-500 shadow-md shadow-emerald-950/20 transition-all"
          >
            <LogIn className="w-4 h-4" />
            Sign In with Existing Account
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>

          <Link
            to="/register?apply=true"
            onClick={onClose}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
          >
            <UserPlus className="w-4 h-4 text-emerald-700" />
            Create New Student Account
          </Link>
        </div>
      </div>
    </div>
  );
};
