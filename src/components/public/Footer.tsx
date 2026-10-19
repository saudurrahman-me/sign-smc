import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Award, MapPin, ArrowUp, ChevronRight, ShieldCheck, Sparkles } from 'lucide-react';
import { SignLogo } from '../brand/SignLogo';
import { FacebookIcon, InstagramIcon } from '../brand/SocialIcons';
import { APP_VERSION } from '../../config/version';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const navigationLinks = [
    { name: 'Home', href: '/#home', isRoute: false },
    { name: 'About Chapter', href: '/#about', isRoute: false },
    { name: 'Mission & Vision', href: '/#mission', isRoute: false },
    { name: 'Executive Leadership', href: '/#leadership', isRoute: false },
    { name: 'Events Calendar', href: '/#events', isRoute: false },
    { name: 'Apply for Membership', href: '/#membership', isRoute: false },
    { name: 'Contact Inquiries', href: '/#contact', isRoute: false },
  ];

  const academicLinks = [
    { name: 'Event Certificates', href: '/certificates', isRoute: true },
    { name: 'Verify Authenticity', href: '/certificates?tab=verify', isRoute: true },
    { name: 'Apply for Certificate', href: '/certificates?tab=apply', isRoute: true },
    { name: 'CME & Clinical Sessions', href: '/#events', isRoute: false },
    { name: 'Research Workshops', href: '/#events', isRoute: false },
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-gradient-to-b from-[#02150C] via-[#010E07] to-[#010804] text-slate-300 pt-16 pb-12 border-t border-emerald-900/50 overflow-hidden">
      {/* Top Ambient Glow & Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-5xl h-36 bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-96 h-96 bg-emerald-600/5 blur-3xl pointer-events-none" />

      {/* Large Background Typography Watermark */}
      <div
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 pointer-events-none select-none overflow-hidden w-full text-center z-0 opacity-40"
        aria-hidden="true"
      >
        <span className="text-[85px] sm:text-[140px] md:text-[190px] lg:text-[230px] font-black tracking-tight text-emerald-500/[0.045] leading-none block whitespace-nowrap">
          SIGN • SMC
        </span>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Interactive Academic Brand Showcase */}
        <div className="relative mb-14 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950/70 via-[#032316]/80 to-emerald-950/70 border border-emerald-500/25 shadow-2xl shadow-black/50 backdrop-blur-md overflow-hidden group hover:border-emerald-500/40 transition-all">
          {/* Subtle Ambient Light Glow inside the card */}
          <div className="absolute -right-20 -top-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 max-w-2xl">
              <div className="relative shrink-0 w-16 h-16 rounded-2xl bg-[#021A0F] border border-emerald-500/40 p-2 flex items-center justify-center shadow-lg shadow-emerald-950/40 group">
                <img
                  src="/sign-smc-logo-white.png"
                  alt="SIGN-SMC Emblem"
                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110 select-none"
                />
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#021A0F] animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <span className="text-xl sm:text-2xl font-black text-white tracking-wide">SIGN-SMC</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                    Official Chapter
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium">
                  Student Interest Group in Neurology • Saidu Medical College, Swat
                </p>
                <p className="text-xs text-slate-400">
                  Advancing clinical neuroscience, research innovation, and academic medical training.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-end shrink-0">
              <Link
                to="/certificates?tab=verify"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900/90 hover:bg-slate-800 border border-emerald-500/40 hover:border-emerald-400 transition-all shadow-md group cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Verify Certificate</span>
              </Link>
              <a
                href="/#membership"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#016533] via-emerald-600 to-[#016533] hover:from-[#015229] hover:to-emerald-500 border border-emerald-400/40 transition-all shadow-lg shadow-emerald-950/60 transform hover:-translate-y-0.5"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>Apply for Membership</span>
              </a>
            </div>
          </div>
        </div>

        {/* Structured Column Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-emerald-900/40">
          {/* Brand & Identity Column (Spans 2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <SignLogo variant="full" size="md" inverted={true} />
            <p className="text-xs sm:text-sm text-emerald-100/75 max-w-md leading-relaxed">
              Student-led academic neurology chapter at Saidu Medical College (SMC), Swat.
              Dedicated to cultivating clinical insight, neuroscience research, and professional medical development.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs bg-emerald-950/50 border border-emerald-900/60 text-emerald-200 shadow-xs">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Saidu Medical College, Saidu Sharif, Swat, KPK</span>
            </div>

            {/* Official Digital Channels & Direct Contact */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <a
                href="https://www.facebook.com/signsmc"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/50 hover:border-emerald-500/60 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-sm group"
                title="Official Facebook Community"
                aria-label="SIGN SMC Facebook"
              >
                <FacebookIcon className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
              </a>
              <a
                href="https://www.instagram.com/sign.smc"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/50 hover:border-emerald-500/60 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-sm group"
                title="Official Instagram Channel"
                aria-label="SIGN SMC Instagram"
              >
                <InstagramIcon className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
              </a>
              <a
                href="mailto:signsmc.official@gmail.com"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/50 hover:border-emerald-500/60 text-xs text-slate-300 hover:text-white transition-all shadow-sm"
                title="Official Inquiries Email"
              >
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>signsmc.official@gmail.com</span>
              </a>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Navigation</span>
            </h4>
            <ul className="space-y-2 text-xs">
              {navigationLinks.map((link) => (
                <li key={link.name}>
                  {link.isRoute ? (
                    <Link
                      to={link.href}
                      className="group text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5 py-0.5"
                    >
                      <ChevronRight className="w-3 h-3 text-emerald-500/50 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      <span>{link.name}</span>
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="group text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5 py-0.5"
                    >
                      <ChevronRight className="w-3 h-3 text-emerald-500/50 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      <span>{link.name}</span>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Academic & Certification Portals */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Academic Hub</span>
            </h4>
            <ul className="space-y-2 text-xs">
              {academicLinks.map((link) => (
                <li key={link.name}>
                  {link.isRoute ? (
                    <Link
                      to={link.href}
                      className="group text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5 py-0.5"
                    >
                      <ChevronRight className="w-3 h-3 text-emerald-500/50 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      {link.name === 'Event Certificates' && <Award className="w-3 h-3 text-emerald-400 shrink-0" />}
                      <span>{link.name}</span>
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="group text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5 py-0.5"
                    >
                      <ChevronRight className="w-3 h-3 text-emerald-500/50 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      <span>{link.name}</span>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Institutional Governance & Data Privacy */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Institutional</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a href="/#membership" className="hover:text-emerald-400 transition-colors block py-0.5">
                  Membership Charter
                </a>
              </li>
              <li>
                <a href="/#about" className="hover:text-emerald-400 transition-colors block py-0.5">
                  Institutional Mandate
                </a>
              </li>
            </ul>

            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-900/50 text-[11px] text-slate-400 leading-relaxed">
              <span className="font-semibold text-emerald-300 block mb-1">Student Privacy Guarantee</span>
              Applicant records and certificate submissions are held strictly for academic verification under Saidu Medical College ethics guidelines.
            </div>
          </div>
        </div>

        {/* Bottom Bar & Disclaimer */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#031D12] border border-emerald-800/60 text-emerald-300 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {APP_VERSION}
            </span>
            <p>
              &copy; {currentYear} SIGN Chapter — Saidu Medical College, Swat. All rights reserved.
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap justify-center">
            <p className="text-[11px] text-slate-400 text-center md:text-right max-w-md">
              Disclaimer: SIGN is an official student-led academic society established under the auspices of Saidu Medical College.
            </p>
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-800/50 hover:border-emerald-500/50 transition-all cursor-pointer shadow-xs group"
              title="Scroll to top of page"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform text-emerald-400" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
