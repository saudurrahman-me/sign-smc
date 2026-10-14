import React from 'react';
import { BookOpen, Award, Compass, Stethoscope } from 'lucide-react';
import { OFFICIAL_CONTENT } from '../../data/fallback-content';

interface AboutSectionProps {
  customContent?: string;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ customContent }) => {
  const preambleText = customContent || OFFICIAL_CONTENT.preamble.content;

  return (
    <section id="about" className="py-24 bg-white border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#016533] border border-emerald-200 mb-4">
            <BookOpen className="w-3.5 h-3.5 text-[#016533]" />
            Institutional Foundation
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            About SIGN Chapter
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-500 font-medium">
            Saidu Medical College, Swat
          </p>
        </div>

        {/* Preamble Academic Card */}
        <div className="relative rounded-2xl bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 p-8 sm:p-12 border border-slate-200/90 shadow-sm">
          {/* Subtle quotation marker */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#016533]/10 text-[#016533] flex items-center justify-center font-bold">
              <Compass className="w-5 h-5 text-[#016533]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Preamble</h3>
              <p className="text-xs text-slate-500">Official Charter of the Society</p>
            </div>
          </div>

          <blockquote className="text-lg sm:text-xl text-slate-700 leading-relaxed font-normal border-l-4 border-[#016533] pl-6 my-4 italic">
            "{preambleText}"
          </blockquote>

          {/* Three Pillars Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 pt-8 border-t border-slate-200/80">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-[#016533] mt-0.5">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">At the Bedside</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Clinically grounded diagnostic acuity and compassionate patient care in neurology.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-[#016533] mt-0.5">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">In the Community</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Public awareness on stroke, epilepsy, dementia, and mitigating neurological stigma.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-[#016533] mt-0.5">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">In Scientific Literature</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Rigorous student-led inquiry, case reports, journal clubs, and peer-reviewed publishing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
