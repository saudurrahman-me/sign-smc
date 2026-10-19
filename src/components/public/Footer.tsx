import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Award } from 'lucide-react';
import { SignLogo } from '../brand/SignLogo';
import { FacebookIcon, InstagramIcon } from '../brand/SocialIcons';
import { APP_VERSION } from '../../config/version';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { name: 'Home', href: '/#home', isRoute: false },
    { name: 'About Chapter', href: '/#about', isRoute: false },
    { name: 'Mission & Vision', href: '/#mission', isRoute: false },
    { name: 'Leadership', href: '/#leadership', isRoute: false },
    { name: 'Events Calendar', href: '/#events', isRoute: false },
    { name: 'Event Certificates', href: '/certificates', isRoute: true },
    { name: 'Apply for Membership', href: '/#membership', isRoute: false },
    { name: 'Contact Inquiries', href: '/#contact', isRoute: false },
  ];

  return (
    <footer className="bg-[#02160C] text-slate-300 pt-16 pb-12 border-t border-emerald-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-emerald-950/80">
          {/* Brand & Identity Column */}
          <div className="md:col-span-2">
            <SignLogo variant="full" size="md" inverted={true} />
            <p className="mt-4 text-xs sm:text-sm text-emerald-100/70 max-w-md leading-relaxed">
              Student Interest Group in Neurology (SIGN) Chapter at Saidu Medical College (SMC), Swat.
              Nurturing clinically grounded, research-oriented physicians championing neurological health.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-md text-[11px] bg-[#031D12] border border-emerald-900/60 text-emerald-200/90">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Saidu Medical College, Saidu Sharif, Swat, KPK
            </div>

            {/* Official Digital Channels & Direct Contact */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <a
                href="https://www.facebook.com/signsmc"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-[#031D12] hover:bg-emerald-900/60 border border-emerald-900/60 hover:border-emerald-500/50 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-sm"
                title="Official Facebook Community"
                aria-label="SIGN SMC Facebook"
              >
                <FacebookIcon className="w-4 h-4 text-blue-400" />
              </a>
              <a
                href="https://www.instagram.com/sign.smc"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-[#031D12] hover:bg-emerald-900/60 border border-emerald-900/60 hover:border-emerald-500/50 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-sm"
                title="Official Instagram Channel"
                aria-label="SIGN SMC Instagram"
              >
                <InstagramIcon className="w-4 h-4 text-pink-400" />
              </a>
              <a
                href="mailto:signsmc.official@gmail.com"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#031D12] hover:bg-emerald-900/60 border border-emerald-900/60 hover:border-emerald-500/50 text-xs text-slate-300 hover:text-white transition-all"
                title="Official Inquiries Email"
              >
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                signsmc.official@gmail.com
              </a>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-xs">
              {footerLinks.map((link) => (
                <li key={link.name}>
                  {link.isRoute ? (
                    <Link
                      to={link.href}
                      className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{link.name}</span>
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-slate-400 hover:text-emerald-400 transition-colors"
                    >
                      {link.name}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Institutional Governance & Privacy Notice */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Governance & Policies
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <a href="#membership" className="hover:text-emerald-400 transition-colors">
                  Membership Charter
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-emerald-400 transition-colors">
                  Institutional Charter
                </a>
              </li>
              <li>
                <span className="text-slate-500 block text-[11px] mt-2 leading-relaxed">
                  Student Data Privacy Notice: Applicant data is held strictly for academic vetting
                  and is never sold or published.
                </span>
              </li>
            </ul>
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
          <p className="text-[11px] text-slate-400 text-center md:text-right max-w-xl">
            Disclaimer: SIGN is a student-led academic society established under the auspices of Saidu Medical College.
          </p>
        </div>
      </div>
    </footer>
  );
};
