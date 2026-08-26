import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Phone, Calendar, ShieldCheck, ArrowRight, RefreshCw, KeyRound, AlertCircle, Sparkles } from 'lucide-react';
import { apiClient } from '../services/apiClient.ts';
import { UserProfile, Occupation, Category, Gender } from '../types.ts';
import { ClerkAuthControls } from './ClerkAuthControls.tsx';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [step, setStep] = useState<'form' | 'otp'>('form');

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('1990-01-01');
  const [gender, setGender] = useState<Gender>('male');
  const [occupation, setOccupation] = useState<Occupation>('Farmer');
  const [annualIncome, setAnnualIncome] = useState('120000');
  const [category, setCategory] = useState<Category>('OBC');
  const [landHoldingAcres, setLandHoldingAcres] = useState('2.5');
  const [hasBPLCard, setHasBPLCard] = useState(true);
  const [stateName, setStateName] = useState('Uttar Pradesh');

  // OTP State
  const [otpCode, setOtpCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(300); // 5 mins
  const [canResend, setCanResend] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setStep('form');
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [initialMode, isOpen]);

  // OTP Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'otp' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, otpTimer]);

  if (!isOpen) return null;

  const handleFillDemoUser = () => {
    setEmail('ramesh.sharma@example.gov.in');
    setPassword('Citizen@123');
    setErrorMsg(null);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password || !fullName) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.auth.sendEmailOtp(email, fullName, 'registration');
      if (res.success) {
        setStep('otp');
        setOtpTimer(300);
        setCanResend(false);
        setSuccessMsg(res.message ?? null);

        // Fetch recent dev OTP for testing convenience
        const devRes = await apiClient.dev.getLastOtp();
        if (devRes.success && (devRes.deliveries?.length ?? 0) > 0){
          const match = devRes.deliveries?.find((d: any) => d.email.toLowerCase() === email.toLowerCase());
          if (match) {
            setDevOtpHint(match.otpForTestingOnly);
          }
        }
      } else {
        setErrorMsg(res.message ?? null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not send verification OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!otpCode || otpCode.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      // 1. Verify OTP
      const verifyRes = await apiClient.auth.verifyEmailOtp(email, otpCode, 'registration');
      if (!verifyRes.success) {
        setErrorMsg(verifyRes.message ?? null);
        setLoading(false);
        return;
      }

      // 2. Complete Registration
      const regRes = await apiClient.auth.register({
        fullName,
        email,
        password,
        mobileNumber,
        dateOfBirth,
        gender,
        address: {
          state: stateName,
          city: 'Citizen City',
          pincode: '201001'
        },
        occupation,
        annualIncome: Number(annualIncome),
        category,
        landHoldingAcres: Number(landHoldingAcres),
        hasBPLCard,
        emailVerified: true
      });

      if (regRes.success && regRes.user) {
        onSuccess(regRes.user);
        onClose();
      } else {
        setErrorMsg(regRes.message ?? null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await apiClient.auth.login(email, password);
      if (res.success && res.user) {
        onSuccess(res.user);
        onClose();
      } else {
        setErrorMsg(res.message ?? null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {mode === 'login' ? 'Citizen Portal Sign In' : 'New Citizen Registration'}
              </h3>
              <p className="text-xs text-slate-400">
                Secure JWT Authentication & Hashed Email OTP Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-1">
          <button
            onClick={() => {
              setMode('login');
              setStep('form');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              mode === 'login'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In Existing Citizen
          </button>
          <button
            onClick={() => {
              setMode('register');
              setStep('form');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              mode === 'register'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register New Citizen
          </button>
        </div>

        {/* Error / Feedback Alert */}
        {errorMsg && (
          <div className="m-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="m-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Dev OTP Helper Banner */}
        {devOtpHint && step === 'otp' && (
          <div className="mx-4 mb-2 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-mono">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Dev Sandbox OTP: <strong>{devOtpHint}</strong></span>
            </div>
            <button
              onClick={() => setOtpCode(devOtpHint)}
              className="text-[11px] bg-amber-500/20 hover:bg-amber-500/30 px-2 py-0.5 rounded text-amber-200 font-semibold"
            >
              Auto-Fill
            </button>
          </div>
        )}

        {/* Body Form Content */}
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {/* Clerk Fast Authentication Section */}
          <div className="mb-4">
            <ClerkAuthControls
              variant="expanded"
              onClerkUserSync={(clerkUser) => {
                if (clerkUser) {
                  const email = clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress || '';
                  const fullName = clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Citizen';
                  const now = new Date().toISOString();
                  onSuccess({
                    _id: clerkUser.id,
                    fullName,
                    email,
                    emailVerified: true,
                    aadhaarVerificationStatus: 'pending',
                    digilockerVerificationStatus: 'pending',
                    mobileNumber: clerkUser.primaryPhoneNumber?.phoneNumber || '',
                    createdAt: now,
                    updatedAt: now,
                  });
                  onClose();
                }
              }}
            />
          </div>

          <div className="relative my-4 flex items-center justify-center">
            <div className="border-t border-slate-800 w-full"></div>
            <span className="bg-slate-900 px-3 text-[10px] text-slate-500 font-medium uppercase tracking-wider absolute">
              or continue with portal credentials
            </span>
          </div>

          {mode === 'login' ? (
            /* Sign In Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="citizen@example.gov.in"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Demo Pre-fill helper button */}
              <div className="pt-1 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleFillDemoUser}
                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium text-[11px]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Use Pre-seeded Demo Citizen Account
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 mt-4"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Sign In to Citizen Dashboard'}
              </button>
            </form>
          ) : step === 'form' ? (
            /* Registration Form */
            <form onSubmit={handleSendOtp} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name (as in Aadhaar/Govt ID) *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar Sharma"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="citizen@example.gov.in"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={e => setMobileNumber(e.target.value)}
                    placeholder="9876543210"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={e => setDateOfBirth(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value as Gender)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="transgender">Transgender</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Socio-Economic Profiling for Scheme Matcher */}
              <div className="pt-2 border-t border-slate-800">
                <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                  Demographic & Benefit Eligibility Profiling
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Primary Occupation</label>
                    <select
                      value={occupation}
                      onChange={e => setOccupation(e.target.value as Occupation)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Farmer">Farmer</option>
                      <option value="Laborer / Daily Wage">Laborer / Daily Wage</option>
                      <option value="Artisan / Small Business">Artisan / Small Business</option>
                      <option value="Student">Student</option>
                      <option value="Unemployed">Unemployed</option>
                      <option value="Salaried Private">Salaried Private</option>
                      <option value="Senior Citizen / Retired">Senior Citizen / Retired</option>
                      <option value="Homemaker">Homemaker</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Annual Family Income (₹)</label>
                    <input
                      type="number"
                      value={annualIncome}
                      onChange={e => setAnnualIncome(e.target.value)}
                      placeholder="120000"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                    </input>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value as Category)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="General">General</option>
                      <option value="OBC">OBC</option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                      <option value="EWS">EWS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Land Holding (Acres)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={landHoldingAcres}
                      onChange={e => setLandHoldingAcres(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">State</label>
                    <input
                      type="text"
                      value={stateName}
                      onChange={e => setStateName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="bplCardCheck"
                    checked={hasBPLCard}
                    onChange={e => setHasBPLCard(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 bg-slate-950 border-slate-700 focus:ring-0"
                  />
                  <label htmlFor="bplCardCheck" className="text-xs text-slate-300 cursor-pointer">
                    Family possesses a BPL / Priority Ration Card (NFSA)
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Proceed to Email OTP Verification
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* OTP Verification Screen */
            <form onSubmit={handleVerifyOtpAndRegister} className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
                <KeyRound className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">Enter 6-Digit Email OTP</h4>
                <p className="text-xs text-slate-400 mt-1">
                  We have dispatched a cryptographic verification code to <strong className="text-slate-200">{email}</strong>
                </p>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-48 mx-auto text-center font-mono tracking-widest text-lg bg-slate-950 border border-emerald-500/50 rounded-xl py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="text-xs text-slate-400">
                {otpTimer > 0 ? (
                  <span>Code expires in: <strong className="text-emerald-400">{Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}</strong></span>
                ) : (
                  <span className="text-rose-400 font-medium">OTP has expired.</span>
                )}
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
                >
                  Edit Information
                </button>
                <button
                  type="button"
                  disabled={!canResend || loading}
                  onClick={handleSendOtp}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                    canResend
                      ? 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
                      : 'text-slate-600 cursor-not-allowed'
                  }`}
                >
                  Resend Code
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 mt-4"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Verify Code & Complete Registration'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
