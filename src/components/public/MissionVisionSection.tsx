import React from 'react';
import { Target, Eye, CheckCircle2, Brain, Activity, Users, FileText, Network, GraduationCap } from 'lucide-react';
import { OFFICIAL_CONTENT } from '../../data/fallback-content';

export const MissionVisionSection: React.FC = () => {
  const objectiveIcons = [
    <Brain className="w-5 h-5 text-[#016533]" key="1" />,
    <Activity className="w-5 h-5 text-[#016533]" key="2" />,
    <GraduationCap className="w-5 h-5 text-[#016533]" key="3" />,
    <FileText className="w-5 h-5 text-[#016533]" key="4" />,
    <Users className="w-5 h-5 text-[#016533]" key="5" />,
    <Network className="w-5 h-5 text-[#016533]" key="6" />,
  ];

  return (
    <section id="mission" className="py-24 bg-slate-50/70 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#016533] border border-emerald-200 mb-4">
            <Target className="w-3.5 h-3.5 text-[#016533]" />
            Strategic Mandate
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Mission, Vision & Objectives
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            Framing neurological excellence across clinical skills, community advocacy, and scholarly publishing.
          </p>
        </div>

        {/* Mission & Vision Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Mission Card */}
          <div className="rounded-2xl bg-white p-8 sm:p-10 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#016533] to-emerald-500" />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#016533] flex items-center justify-center">
                <Target className="w-6 h-6 text-[#016533]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Mission Statement</h3>
                <span className="text-xs font-medium text-slate-500">Student Empowerment & Clinical Growth</span>
              </div>
            </div>
            <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
              {OFFICIAL_CONTENT.mission.content}
            </p>
          </div>

          {/* Vision Card */}
          <div className="rounded-2xl bg-white p-8 sm:p-10 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-600 to-[#016533]" />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#016533] flex items-center justify-center">
                <Eye className="w-6 h-6 text-[#016533]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Vision Statement</h3>
                <span className="text-xs font-medium text-slate-500">Regional Impact in Khyber Pakhtunkhwa</span>
              </div>
            </div>
            <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
              {OFFICIAL_CONTENT.vision.content}
            </p>
          </div>
        </div>

        {/* Core Objectives Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="text-2xl font-bold text-slate-900">Core Objectives</h3>
            <p className="text-sm text-slate-500 mt-1">
              Six actionable pillars guiding our student chapters events, research cohorts, and community initiatives.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {OFFICIAL_CONTENT.objectives.items.map((item, idx) => (
              <div
                key={item.number}
                className="flex flex-col p-6 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-emerald-50/20 hover:border-emerald-300/60 transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-xs group-hover:scale-105 transition-transform">
                    {objectiveIcons[idx]}
                  </div>
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-slate-200/80 text-slate-700 font-mono">
                    0{item.number}
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2">{item.title}</h4>
                <p className="text-sm text-slate-600 leading-relaxed flex-1">
                  {item.description}
                </p>
                <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-200/60 text-xs font-semibold text-[#016533]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#016533]" />
                  Mandated Goal
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
