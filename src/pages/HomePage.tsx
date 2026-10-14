import React from 'react';
import { Navbar } from '../components/public/Navbar';
import { HeroSection } from '../components/public/HeroSection';
import { AboutSection } from '../components/public/AboutSection';
import { MissionVisionSection } from '../components/public/MissionVisionSection';
import { LeadershipSection } from '../components/public/LeadershipSection';
import { EventsSection } from '../components/public/EventsSection';
import { MembershipSection } from '../components/public/MembershipSection';
import { ContactSection } from '../components/public/ContactSection';
import { Footer } from '../components/public/Footer';
import { isSupabaseConfigured } from '../lib/supabase';
import { Info, ExternalLink } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Configuration Assistant Banner (shown if Supabase URL/Key need setup) */}
      {!isSupabaseConfigured && (
        <div className="bg-gradient-to-r from-[#021A0F] via-[#042817] to-slate-950 text-white text-xs px-4 py-2.5 border-b border-emerald-500/30 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              <strong className="text-emerald-300">Supabase Setup Notice:</strong> Real-time persistence and auth require configuring{' '}
              <code className="bg-emerald-950/80 px-1.5 py-0.5 rounded text-emerald-200 border border-emerald-800/60">VITE_SUPABASE_URL</code> in{' '}
              <code className="bg-emerald-950/80 px-1.5 py-0.5 rounded text-emerald-200 border border-emerald-800/60">.env</code>. The public single-page website is fully active and browsing in preview mode.
            </span>
          </div>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 transition-all font-semibold"
          >
            Supabase Console
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Main Single Page Layout */}
      <Navbar />

      <main className="flex-1">
        <HeroSection />
        <AboutSection />
        <MissionVisionSection />
        <LeadershipSection />
        <EventsSection />
        <MembershipSection />
        <ContactSection />
      </main>

      <Footer />
    </div>
  );
};
