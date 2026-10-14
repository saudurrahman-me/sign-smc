import React, { useState } from 'react';
import {
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  Building2,
  GraduationCap,
  Sparkles,
  Phone,
  User,
  Mail,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { MembershipApplication } from '../../types/database.types';

interface MembershipApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplicationSubmitted?: (app: MembershipApplication) => void;
}

export const MembershipApplicationModal: React.FC<MembershipApplicationModalProps> = ({
  isOpen,
  onClose,
  onApplicationSubmitted,
}) => {
  const { user, profile } = useAuth();

  // Form Fields
  const [fullName, setFullName] = useState<string>(profile?.full_name || '');
  const [email, setEmail] = useState<string>(user?.email || profile?.email || '');
  const [phone, setPhone] = useState<string>('');
  
  // College Name
  const [collegeName, setCollegeName] = useState<string>('Saidu Medical College');
  const [otherCollege, setOtherCollege] = useState<string>('');

  // Degree
  const [degree, setDegree] = useState<'MBBS' | 'BDS'>('MBBS');

  // Year Of Study
  const [yearOfStudy, setYearOfStudy] = useState<string>('1st Year');

  // Expected Graduation Year
  const [gradYear, setGradYear] = useState<string>('2028');
  const [otherGradYear, setOtherGradYear] = useState<string>('');

  // Payment Proof
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [paymentPreview, setPaymentPreview] = useState<string | null>(null);

  // Previous Experience
  const [previousExperience, setPreviousExperience] = useState<string>('');

  // State Management
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size exceeds 10MB limit. Please upload a smaller image.');
      return;
    }

    setPaymentFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPaymentPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setErrorMessage(null);
  };

  const handleClear = () => {
    setFullName(profile?.full_name || '');
    setPhone('');
    setCollegeName('Saidu Medical College');
    setOtherCollege('');
    setDegree('MBBS');
    setYearOfStudy('1st Year');
    setGradYear('2028');
    setOtherGradYear('');
    setPaymentFile(null);
    setPaymentPreview(null);
    setPreviousExperience('');
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!user) {
      setErrorMessage('Authentication required. Please sign in to submit your application.');
      return;
    }

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full legal name.');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!phone.trim()) {
      setErrorMessage('Please provide your WhatsApp contact number.');
      return;
    }

    const finalCollege = collegeName === 'Other' ? otherCollege.trim() : collegeName;
    if (!finalCollege) {
      setErrorMessage('Please specify your college name.');
      return;
    }

    const finalGradYear = gradYear === 'Other' ? otherGradYear.trim() : gradYear;
    if (!finalGradYear) {
      setErrorMessage('Please specify your expected year of graduation.');
      return;
    }

    if (!paymentPreview && !paymentFile) {
      setErrorMessage('Please upload proof of your Easypaisa membership fee payment (Rs. 300).');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalPaymentProofUrl = paymentPreview || '';

      // Upload to Supabase Storage if configured and file is selected
      if (isSupabaseConfigured && paymentFile && user.id && !user.id.startsWith('dev-')) {
        try {
          const fileExt = paymentFile.name.split('.').pop() || 'png';
          const fileName = `receipt_${user.id}_${Date.now()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('applicant-documents')
            .upload(filePath, paymentFile, { upsert: true });

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('applicant-documents')
              .getPublicUrl(filePath);
            if (urlData?.publicUrl) {
              finalPaymentProofUrl = urlData.publicUrl;
            }
          }
        } catch (uploadErr) {
          console.warn('[SIGN Membership] Supabase storage upload notice:', uploadErr);
          // Retain base64 paymentPreview so proof is never lost
        }
      }

      const isDevSession = !isSupabaseConfigured || Boolean(user.id?.startsWith('dev-'));

      const newApplicationData: Partial<MembershipApplication> = {
        id: isDevSession ? `app-${Date.now()}` : undefined,
        user_id: user.id,
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        mbbs_year: `${degree} - ${yearOfStudy}`,
        student_id: null,
        college_name: finalCollege,
        degree: degree,
        year_of_study: yearOfStudy,
        expected_graduation_year: finalGradYear,
        payment_proof_url: finalPaymentProofUrl,
        previous_experience: previousExperience.trim() || null,
        motivation: `Application for SIGN SMC Chapter. College: ${finalCollege}, Degree: ${degree}, Stage: ${yearOfStudy}, Expected Grad: ${finalGradYear}. Experience: ${previousExperience.trim() || 'None recorded'}.`,
        research_interests: previousExperience.trim() || null,
        agreed_to_terms: true,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (isDevSession) {
        // Persist to session storage for demo
        try {
          sessionStorage.setItem('sign_user_application', JSON.stringify(newApplicationData));
        } catch {
          // ignore
        }
        setIsSuccess(true);
        if (onApplicationSubmitted) {
          onApplicationSubmitted(newApplicationData as MembershipApplication);
        }
        return;
      }

      // Try full column insert first
      let { data, error } = await supabase
        .from('membership_applications')
        .insert({
          user_id: user.id,
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          mbbs_year: `${degree} - ${yearOfStudy}`,
          college_name: finalCollege,
          degree: degree,
          year_of_study: yearOfStudy,
          expected_graduation_year: finalGradYear,
          payment_proof_url: finalPaymentProofUrl,
          previous_experience: previousExperience.trim() || null,
          motivation: `College: ${finalCollege} | Degree: ${degree} | Year: ${yearOfStudy} | Expected Grad: ${finalGradYear} | Experience: ${previousExperience.trim() || 'None'}`,
          research_interests: previousExperience.trim() || null,
          agreed_to_terms: true,
          status: 'pending',
        })
        .select()
        .single();

      // If remote Supabase table has not run the latest column additions yet, fallback safely
      if (error && error.message?.includes('column')) {
        const fallbackRes = await supabase
          .from('membership_applications')
          .insert({
            user_id: user.id,
            full_name: fullName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            mbbs_year: `${degree} - ${yearOfStudy} (${finalCollege})`,
            motivation: `College: ${finalCollege} | Degree: ${degree} | Year: ${yearOfStudy} | Expected Grad: ${finalGradYear} | Proof: ${finalPaymentProofUrl.slice(0, 50)}...`,
            research_interests: previousExperience.trim() || null,
            agreed_to_terms: true,
            status: 'pending',
          })
          .select()
          .single();
        data = fallbackRes.data;
        error = fallbackRes.error;
      }

      if (error) {
        if (error.code === '23505') {
          throw new Error('You have already submitted a membership application. Admin review is in progress.');
        }
        throw error;
      }

      setIsSuccess(true);
      if (onApplicationSubmitted && data) {
        onApplicationSubmitted(data as MembershipApplication);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit application. Please check your network connection.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Sticky Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#016533] text-white flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <FileText className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                SIGN SMC Membership Form
              </h2>
              <span className="text-[11px] text-emerald-200 font-medium">
                Student Interest Group in Neurology • Saidu Medical College
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto flex-1 p-6 sm:p-8 space-y-6 text-slate-800">
          {isSuccess ? (
            <div className="py-12 px-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#016533] flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Application Submitted!</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Thank you, <strong className="text-slate-900">{fullName}</strong>. Your official SIGN SMC
                membership application and Easypaisa payment proof have been received.
              </p>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-[#016533] max-w-md mx-auto text-left space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  What happens next?
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Your application is now marked as <span className="font-semibold text-emerald-800">Pending Review</span>.
                  The SIGN SMC Executive Committee will verify your payment and student record.
                  Once approved, your account role will automatically upgrade to <span className="font-semibold text-emerald-800">Member</span>!
                </p>
              </div>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#016533] hover:bg-[#015229] transition-all shadow-md"
                >
                  Done & Return to Website
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 text-xs sm:text-sm">
              {/* Card 1: Form Introductory Header */}
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-slate-50 to-emerald-50/30 border border-emerald-200/80 space-y-3">
                <h3 className="text-base sm:text-lg font-extrabold text-[#016533]">
                  Why become a member of SIGN SMC?
                </h3>
                <p className="text-slate-700 leading-relaxed text-xs">
                  SIGN SMC is a student community where you can learn, take part in activities, and connect with other
                  students who are interested in research and academics.
                </p>
                <div className="text-xs space-y-1.5 text-slate-700 pt-1">
                  <p className="font-semibold text-slate-900">As a member, you can:</p>
                  <ul className="space-y-1 list-disc list-inside text-[11.5px] text-slate-600 leading-relaxed pl-1">
                    <li>Learn how to <strong className="text-slate-800">get started with medical research</strong>.</li>
                    <li>Take part in <strong className="text-slate-800">research sessions, workshops, seminars, and journal clubs</strong>.</li>
                    <li>Get opportunities to work and collaborate with <strong className="text-slate-800">other medical students</strong>.</li>
                    <li>Improve your <strong className="text-slate-800">poster and oral presentation skills</strong>.</li>
                    <li>Learn about <strong className="text-slate-800">research writing, publications, and conferences</strong>.</li>
                    <li>Get guidance from <strong className="text-slate-800">seniors and experienced students/researchers</strong>.</li>
                    <li>Participate in <strong className="text-slate-800">academic activities, competitions, and events</strong>.</li>
                    <li>Contribute to <strong className="text-slate-800">community awareness and outreach initiatives</strong> and help promote better health knowledge among the public.</li>
                    <li>Receive <strong className="text-slate-800">certificates for eligible activities and participation</strong>.</li>
                    <li>Stay updated about <strong className="text-slate-800">research opportunities, conferences, workshops, and other useful events</strong>.</li>
                    <li>Most importantly, get a chance to <strong className="text-slate-800">learn, ask questions, share ideas, and gain experience</strong> outside the usual classroom setting.</li>
                  </ul>
                </div>

                {/* Easypaisa Payment Notice */}
                <div className="mt-4 p-4 rounded-xl bg-white border border-emerald-300 shadow-sm space-y-1">
                  <div className="flex items-center gap-2 text-[#016533] font-extrabold text-sm">
                    <CreditCard className="w-4 h-4" />
                    <span>Membership Fee: Rs. 300</span>
                  </div>
                  <p className="text-xs text-slate-700">
                    <strong className="text-slate-900">Account name:</strong> Waqar Younas (Finance Secretary)
                  </p>
                  <p className="text-xs text-slate-700">
                    <strong className="text-slate-900">Easypaisa Account:</strong>{' '}
                    <span className="font-mono font-bold text-[#016533] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      03179752692
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-500 italic pt-1">
                    Join SIGN SMC and be part of a group where we learn, work, and grow together.
                  </p>
                </div>

                <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-emerald-200/60">
                  <span>Logged in as: <strong className="text-slate-700">{user?.email}</strong></span>
                  <span className="text-red-500 font-semibold">* Indicates required question</span>
                </div>
              </div>

              {errorMessage && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Field 1: Full Name */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-900">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your answer"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#016533] focus:ring-1 focus:ring-[#016533]"
                  />
                </div>
              </div>

              {/* Field 2: Email Address */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-900">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your answer"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#016533] focus:ring-1 focus:ring-[#016533]"
                  />
                </div>
              </div>

              {/* Field 3: WhatsApp Number */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-900">
                  WhatsApp Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0312-3456789"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#016533] focus:ring-1 focus:ring-[#016533]"
                  />
                </div>
              </div>

              {/* Field 4: College Name */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                <label className="block text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#016533]" />
                  College Name <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2.5">
                  {['Saidu Medical College', 'Saidu College Of Dentistry', 'Swat Medical College'].map((col) => (
                    <label key={col} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="collegeName"
                        value={col}
                        checked={collegeName === col}
                        onChange={() => setCollegeName(col)}
                        className="w-4 h-4 text-[#016533] focus:ring-[#016533] border-slate-300"
                      />
                      <span className="text-xs sm:text-sm text-slate-700 group-hover:text-slate-900">
                        {col}
                      </span>
                    </label>
                  ))}
                  <div className="flex items-center gap-3 pt-1">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="collegeName"
                        value="Other"
                        checked={collegeName === 'Other'}
                        onChange={() => setCollegeName('Other')}
                        className="w-4 h-4 text-[#016533] focus:ring-[#016533] border-slate-300"
                      />
                      <span className="text-xs sm:text-sm text-slate-700">Other:</span>
                    </label>
                    {collegeName === 'Other' && (
                      <input
                        type="text"
                        value={otherCollege}
                        onChange={(e) => setOtherCollege(e.target.value)}
                        placeholder="Please specify institution name"
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:border-[#016533] focus:ring-1 focus:ring-[#016533]"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Field 5: Degree */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                <label className="block text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-[#016533]" />
                  Degree <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2.5">
                  {['MBBS', 'BDS'].map((deg) => (
                    <label key={deg} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="degree"
                        value={deg}
                        checked={degree === deg}
                        onChange={() => setDegree(deg as 'MBBS' | 'BDS')}
                        className="w-4 h-4 text-[#016533] focus:ring-[#016533] border-slate-300"
                      />
                      <span className="text-xs sm:text-sm text-slate-700 group-hover:text-slate-900 font-medium">
                        {deg}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Field 6: Year Of Study */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                <label className="block text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#016533]" />
                  Year Of Study <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2.5">
                  {['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'].map((yr) => (
                    <label key={yr} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="yearOfStudy"
                        value={yr}
                        checked={yearOfStudy === yr}
                        onChange={() => setYearOfStudy(yr)}
                        className="w-4 h-4 text-[#016533] focus:ring-[#016533] border-slate-300"
                      />
                      <span className="text-xs sm:text-sm text-slate-700 group-hover:text-slate-900">
                        {yr}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Field 7: Expected Year of Graduation */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                <label className="block text-xs sm:text-sm font-bold text-slate-900">
                  What is your expected year of graduation? <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2.5">
                  {['2027', '2028', '2029', '2030', '2031'].map((yr) => (
                    <label key={yr} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="gradYear"
                        value={yr}
                        checked={gradYear === yr}
                        onChange={() => setGradYear(yr)}
                        className="w-4 h-4 text-[#016533] focus:ring-[#016533] border-slate-300"
                      />
                      <span className="text-xs sm:text-sm text-slate-700 group-hover:text-slate-900">
                        {yr}
                      </span>
                    </label>
                  ))}
                  <div className="flex items-center gap-3 pt-1">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="gradYear"
                        value="Other"
                        checked={gradYear === 'Other'}
                        onChange={() => setGradYear('Other')}
                        className="w-4 h-4 text-[#016533] focus:ring-[#016533] border-slate-300"
                      />
                      <span className="text-xs sm:text-sm text-slate-700">Other:</span>
                    </label>
                    {gradYear === 'Other' && (
                      <input
                        type="text"
                        value={otherGradYear}
                        onChange={(e) => setOtherGradYear(e.target.value)}
                        placeholder="e.g. 2026 or 2032"
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:border-[#016533] focus:ring-1 focus:ring-[#016533]"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Field 8: Upload Membership Fee Payment Proof (Rs. 300) */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                <label className="block text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-[#016533]" />
                  Upload Membership Fee Payment Proof (Rs. 300) <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Please transfer the membership fee via <strong className="text-slate-900">Easypaisa</strong> to{' '}
                  <span className="font-mono font-bold text-[#016533]">03179752692</span> (Waqar Younas) and upload a
                  screenshot of the successful transaction here.{' '}
                  <strong className="text-slate-900">Make sure the Transaction ID is clearly visible.</strong>
                </p>

                {paymentPreview ? (
                  <div className="relative rounded-xl border border-emerald-300 bg-emerald-50/40 p-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={paymentPreview}
                        alt="Payment Proof Receipt"
                        className="w-16 h-16 rounded-lg object-cover border border-emerald-300 shadow-sm"
                      />
                      <div className="min-w-0 text-xs">
                        <span className="font-bold text-slate-900 block truncate">
                          {paymentFile?.name || 'Payment Receipt Screenshot'}
                        </span>
                        <span className="text-[11px] text-emerald-700 block mt-0.5">
                          ✓ Payment proof attached
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentFile(null);
                        setPaymentPreview(null);
                      }}
                      className="text-xs text-red-600 hover:text-red-800 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-[#016533] rounded-2xl p-6 flex flex-col items-center justify-center gap-2 hover:bg-emerald-50/30 transition-all text-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#016533] flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        Click to select payment screenshot
                      </span>
                      <span className="text-[11px] text-slate-400">
                        PNG, JPG, or PDF up to 10MB
                      </span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Field 9: Previous Experience in Club Activities */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-900">
                  Previous experience in club activities or leadership roles{' '}
                  <span className="text-slate-400 font-normal">(if any)</span>
                </label>
                <textarea
                  rows={3}
                  value={previousExperience}
                  onChange={(e) => setPreviousExperience(e.target.value)}
                  placeholder="Your answer"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#016533] focus:ring-1 focus:ring-[#016533]"
                />
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear form
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#016533] via-emerald-600 to-[#016533] hover:from-[#015229] hover:to-emerald-500 shadow-md shadow-emerald-950/20 disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit'
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
