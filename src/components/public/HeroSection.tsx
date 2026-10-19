import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Calendar, BookOpen, Clock } from 'lucide-react';
import { OFFICIAL_SETTINGS } from '../../data/fallback-content';
import { evaluateMembershipIntake } from '../../lib/membership-schedule';
import type { SiteSettings } from '../../types/database.types';

export const HeroSection: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(OFFICIAL_SETTINGS);

  useEffect(() => {
    try {
      const cached =
        localStorage.getItem('sign_site_settings') ||
        sessionStorage.getItem('sign_site_settings');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed) setSiteSettings((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore
    }

    const handleSettingsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<SiteSettings>;
      if (customEvent.detail) {
        setSiteSettings((prev) => ({ ...prev, ...customEvent.detail }));
      }
    };
    window.addEventListener('sign_settings_updated', handleSettingsUpdated);
    return () => window.removeEventListener('sign_settings_updated', handleSettingsUpdated);
  }, []);

  const intakeEval = evaluateMembershipIntake(siteSettings);

  // Subtle interactive neural canvas network animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 650);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || 650;
    };
    window.addEventListener('resize', handleResize);

    // Generate neural nodes
    const nodeCount = Math.min(Math.floor((width * height) / 18000), 45);
    const nodes: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      phase: number;
    }> = [];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 2.2 + 1.2,
        phase: Math.random() * Math.PI * 2,
      });
    }

    let time = 0;
    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      // Connect synaptic axons between adjacent nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 135;

          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.28;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(1, 101, 51, ${alpha * 0.4})`;
            ctx.lineWidth = 1.0;
            ctx.stroke();
          }
        }
      }

      // Render synaptic nodes with gentle pulse
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        const pulse = 1 + Math.sin(time + node.phase) * 0.25;
        const currentRadius = node.radius * pulse;

        // Dark Green / Emerald Pulse Glow
        const grad = ctx.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          currentRadius * 2.8
        );
        grad.addColorStop(0, 'rgba(1, 101, 51, 0.75)');
        grad.addColorStop(0.5, 'rgba(16, 185, 129, 0.3)');
        grad.addColorStop(1, 'rgba(235, 247, 238, 0)');

        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius * 2.8, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#016533';
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <section
      id="home"
      className="relative min-h-[92vh] flex items-center justify-center bg-neural-light pt-28 pb-16 overflow-hidden"
    >
      {/* Background Neural Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-65 z-0"
        aria-hidden="true"
      />

      {/* Decorative Radial Lighting in Subtle Emerald */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[540px] h-[540px] bg-emerald-400/20 rounded-full blur-3xl pointer-events-none z-0"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Official Society Emblem Badge Display - Box size kept exact, logo enlarged */}
        <div className="flex justify-center mb-5">
          <div className="relative inline-flex items-center justify-center w-[104px] h-[104px] rounded-2xl bg-[#022415] border border-emerald-500/40 shadow-xl shadow-emerald-950/25 backdrop-blur-md group transition-all duration-300 hover:border-emerald-400/60 hover:shadow-emerald-950/30">
            <img
              src="/sign-smc-logo-white.png"
              alt="SIGN-SMC Official Logo"
              className="h-[88px] w-auto object-contain drop-shadow transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </div>

        {/* Main Society Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
          Student Interest Group in <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-[#016533] via-emerald-700 to-[#015229] bg-clip-text text-transparent">
            Neurology (SIGN)
          </span>
        </h1>

        {/* Institutional Location */}
        <p className="text-xl sm:text-2xl font-bold text-[#016533] mb-6 tracking-wide">
          Saidu Medical College, Swat
        </p>

        {/* Concise Supporting Statement */}
        <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-700 leading-relaxed mb-10 font-normal">
          Dedicated to promoting neuroscience education, clinical neurology, student research,
          academic discourse, and neurological health awareness in Khyber Pakhtunkhwa.
        </p>

        {/* Primary Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#membership"
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold transition-all transform hover:-translate-y-0.5 ${
              intakeEval.isOpen
                ? 'text-white bg-gradient-to-r from-[#016533] via-emerald-600 to-[#016533] hover:from-[#015229] hover:to-emerald-500 shadow-lg shadow-emerald-950/20 border border-emerald-400/30'
                : 'text-amber-300 bg-amber-950/80 hover:bg-amber-900 border border-amber-600/40 shadow-xs'
            }`}
          >
            {!intakeEval.isOpen && <Clock className="w-4 h-4 text-amber-400" />}
            <span>{intakeEval.isOpen ? 'Apply for Membership' : intakeEval.badgeText}</span>
            {intakeEval.isOpen && <ArrowRight className="w-4 h-4" />}
          </a>

          <a
            href="#events"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-800 bg-white hover:bg-emerald-50/70 border border-slate-300 hover:border-emerald-500/60 shadow-sm transition-all transform hover:-translate-y-0.5"
          >
            <Calendar className="w-4 h-4 text-[#016533]" />
            Upcoming Events
          </a>

          <a
            href="#about"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-[#016533] hover:text-[#015229] bg-emerald-100/70 hover:bg-emerald-100 border border-emerald-200/80 transition-all"
          >
            <BookOpen className="w-4 h-4 text-[#016533]" />
            Explore SIGN
          </a>
        </div>
      </div>
    </section>
  );
};
