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
    <footer className="relative bg-gradient-to-b from-[#032D20] via-[#042F23] to-[#022219] text-slate-300 pt-16 pb-12 border-t border-[#064632]/80 overflow-hidden">
      {/* Top Subtle Understated Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#7BE495]/40 to-transparent pointer-events-none" />

      {/* Decorative Neuroscience Background Atmosphere (Behind Content) */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
        {/* Soft Ambient Radial Illumination */}
        <div className="absolute -top-12 right-0 w-[520px] h-[360px] bg-gradient-to-bl from-[#064632]/45 via-[#7BE495]/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-16 left-0 w-[460px] h-[300px] bg-gradient-to-tr from-[#064632]/40 via-[#A7F3D0]/08 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-0 left-1/3 w-[500px] h-32 bg-[#7BE495]/05 rounded-full blur-3xl" />

        {/* Microscopic Scientific Dot Texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#7BE495_1px,transparent_1px)] [background-size:26px_26px] opacity-[0.035]" />

        {/* Subtle Neuroscience Neural Network Pattern (Synapses & Axonal Connections) */}
        <svg
          viewBox="0 0 1440 500"
          className="absolute inset-0 w-full h-full object-cover opacity-75"
          preserveAspectRatio="xMidYMid slice"
        >
          <g stroke="#7BE495" strokeWidth="0.85" strokeOpacity="0.14" strokeLinecap="round" fill="none">
            {/* Left Neural Cluster */}
            <path d="M 90,80 Q 180,120 270,95" />
            <path d="M 270,95 Q 360,135 440,110" />
            <path d="M 90,80 Q 70,180 80,260" />
            <path d="M 270,95 Q 240,200 220,290" />
            <path d="M 80,260 Q 150,285 220,290" />
            <path d="M 220,290 Q 280,340 330,380" />
            <path d="M 440,110 Q 480,170 510,220" />
            <path d="M 270,95 Q 370,80 440,110" />

            {/* Right Neural Synaptic Arborization */}
            <path d="M 980,90 Q 1080,70 1170,95" />
            <path d="M 1170,95 Q 1260,65 1360,85" />
            <path d="M 1170,95 Q 1140,165 1090,220" />
            <path d="M 1090,220 Q 1180,230 1250,250" />
            <path d="M 1250,250 Q 1310,235 1380,260" />
            <path d="M 1260,65 Q 1255,165 1250,250" />
            <path d="M 980,90 Q 930,160 880,210" />
            <path d="M 880,210 Q 960,255 1030,295" />
            <path d="M 1030,295 Q 1110,320 1180,345" />
            <path d="M 1090,220 Q 1060,260 1030,295" />

            {/* Subtle Peripheral Nerve Projections */}
            <path d="M 1360,85 Q 1410,75 1450,70" strokeOpacity="0.08" />
            <path d="M 1380,260 Q 1425,280 1460,290" strokeOpacity="0.08" />
            <path d="M 880,210 Q 820,230 760,245" strokeOpacity="0.08" />
            <path d="M 510,220 Q 570,250 630,265" strokeOpacity="0.08" />
          </g>

          {/* Synaptic Junction Nodes */}
          <g>
            {/* Left Cluster Nodes */}
            <circle cx="90" cy="80" r="4.5" fill="#7BE495" fillOpacity="0.08" />
            <circle cx="90" cy="80" r="1.6" fill="#A7F3D0" fillOpacity="0.5" />

            <circle cx="270" cy="95" r="5" fill="#7BE495" fillOpacity="0.09" />
            <circle cx="270" cy="95" r="2" fill="#7BE495" fillOpacity="0.65" />

            <circle cx="440" cy="110" r="4" fill="#7BE495" fillOpacity="0.07" />
            <circle cx="440" cy="110" r="1.5" fill="#A7F3D0" fillOpacity="0.45" />

            <circle cx="80" cy="260" r="4" fill="#7BE495" fillOpacity="0.07" />
            <circle cx="80" cy="260" r="1.5" fill="#A7F3D0" fillOpacity="0.45" />

            <circle cx="220" cy="290" r="5" fill="#7BE495" fillOpacity="0.09" />
            <circle cx="220" cy="290" r="1.8" fill="#7BE495" fillOpacity="0.6" />

            <circle cx="330" cy="380" r="3.5" fill="#7BE495" fillOpacity="0.06" />
            <circle cx="330" cy="380" r="1.3" fill="#A7F3D0" fillOpacity="0.4" />

            {/* Right Cluster Nodes */}
            <circle cx="980" cy="90" r="4.5" fill="#7BE495" fillOpacity="0.08" />
            <circle cx="980" cy="90" r="1.6" fill="#A7F3D0" fillOpacity="0.5" />

            <circle cx="1170" cy="95" r="5.5" fill="#7BE495" fillOpacity="0.1" />
            <circle cx="1170" cy="95" r="2.2" fill="#7BE495" fillOpacity="0.75" />

            <circle cx="1260" cy="65" r="4" fill="#7BE495" fillOpacity="0.07" />
            <circle cx="1260" cy="65" r="1.5" fill="#A7F3D0" fillOpacity="0.45" />

            <circle cx="1360" cy="85" r="3.5" fill="#7BE495" fillOpacity="0.06" />
            <circle cx="1360" cy="85" r="1.3" fill="#A7F3D0" fillOpacity="0.4" />

            <circle cx="1090" cy="220" r="5" fill="#7BE495" fillOpacity="0.09" />
            <circle cx="1090" cy="220" r="1.9" fill="#7BE495" fillOpacity="0.65" />

            <circle cx="1250" cy="250" r="4.5" fill="#7BE495" fillOpacity="0.08" />
            <circle cx="1250" cy="250" r="1.7" fill="#A7F3D0" fillOpacity="0.55" />

            <circle cx="1380" cy="260" r="3.5" fill="#7BE495" fillOpacity="0.06" />
            <circle cx="1380" cy="260" r="1.3" fill="#A7F3D0" fillOpacity="0.4" />

            <circle cx="880" cy="210" r="4" fill="#7BE495" fillOpacity="0.07" />
            <circle cx="880" cy="210" r="1.5" fill="#A7F3D0" fillOpacity="0.45" />

            <circle cx="1030" cy="295" r="4.5" fill="#7BE495" fillOpacity="0.08" />
            <circle cx="1030" cy="295" r="1.7" fill="#7BE495" fillOpacity="0.55" />

            <circle cx="1180" cy="345" r="3.5" fill="#7BE495" fillOpacity="0.06" />
            <circle cx="1180" cy="345" r="1.3" fill="#A7F3D0" fillOpacity="0.4" />
          </g>
        </svg>

        {/* Refined Vector-Scalable SIGN SMC Watermark (Seamlessly Adaptive across 90%, 100%, 150%+ Zoom) */}
        <div className="absolute -bottom-1 left-0 right-0 w-full px-4 sm:px-8 flex justify-center items-end">
          <svg
            viewBox="0 0 1000 120"
            className="w-full max-w-5xl h-auto max-h-24 sm:max-h-32 md:max-h-36"
            preserveAspectRatio="xMidYMid meet"
          >
            <text
              x="50%"
              y="78%"
              textAnchor="middle"
              className="font-black uppercase fill-[#A7F3D0]/[0.035]"
              style={{
                fontSize: '108px',
                fontWeight: 900,
                letterSpacing: '0.14em',
                fontFamily: 'inherit',
              }}
            >
              SIGN SMC
            </text>
          </svg>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#064632]/80">
          {/* Brand & Identity Column */}
          <div className="md:col-span-2">
            <SignLogo variant="full" size="md" inverted={true} />
            <p className="mt-4 text-xs sm:text-sm text-[#A7F3D0]/80 max-w-md leading-relaxed">
              Student Interest Group in Neurology (SIGN) Chapter at Saidu Medical College (SMC), Swat.
              Nurturing clinically grounded, research-oriented physicians championing neurological health.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] bg-[#042F23]/80 border border-[#064632] hover:border-[#7BE495]/30 text-[#A7F3D0] backdrop-blur-xs transition-colors shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#7BE495] animate-pulse" />
              <span>Saidu Medical College, Saidu Sharif, Swat, KPK</span>
            </div>

            {/* Official Digital Channels & Direct Contact */}
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <a
                href="https://www.facebook.com/signsmc"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-[#042F23]/80 hover:bg-[#064632] border border-[#064632] hover:border-[#7BE495]/40 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-xs"
                title="Official Facebook Community"
                aria-label="SIGN SMC Facebook"
              >
                <FacebookIcon className="w-4 h-4 text-blue-400" />
              </a>
              <a
                href="https://www.instagram.com/sign.smc"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-[#042F23]/80 hover:bg-[#064632] border border-[#064632] hover:border-[#7BE495]/40 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-xs"
                title="Official Instagram Channel"
                aria-label="SIGN SMC Instagram"
              >
                <InstagramIcon className="w-4 h-4 text-pink-400" />
              </a>
              <a
                href="mailto:signsmc.official@gmail.com"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#042F23]/80 hover:bg-[#064632] border border-[#064632] hover:border-[#7BE495]/40 text-xs text-slate-300 hover:text-white transition-all shadow-xs"
                title="Official Inquiries Email"
              >
                <Mail className="w-3.5 h-3.5 text-[#7BE495]" />
                <span>signsmc.official@gmail.com</span>
              </a>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7BE495]" />
              <span>Navigation</span>
            </h4>
            <ul className="space-y-2.5 text-xs">
              {footerLinks.map((link) => (
                <li key={link.name}>
                  {link.isRoute ? (
                    <Link
                      to={link.href}
                      className="text-slate-300 hover:text-[#7BE495] transition-colors flex items-center gap-1.5 group"
                    >
                      <Award className="w-3.5 h-3.5 text-[#7BE495] shrink-0" />
                      <span>{link.name}</span>
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-slate-300 hover:text-[#7BE495] transition-colors"
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
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7BE495]" />
              <span>Governance &amp; Policies</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li>
                <a href="#membership" className="hover:text-[#7BE495] transition-colors">
                  Membership Charter
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-[#7BE495] transition-colors">
                  Institutional Charter
                </a>
              </li>
              <li>
                <div className="mt-3 p-3 rounded-xl bg-[#042F23]/60 border border-[#064632]/80 text-[11px] text-slate-300/80 leading-relaxed backdrop-blur-xs">
                  <span className="font-semibold text-[#A7F3D0] block mb-0.5">Student Data Privacy Notice</span>
                  Applicant data is held strictly for academic vetting under Saidu Medical College ethics guidelines and is never sold or published.
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar & Disclaimer */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#042F23] border border-[#064632] text-[#A7F3D0] shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7BE495] animate-pulse" />
              {APP_VERSION}
            </span>
            <p className="text-slate-400">
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
