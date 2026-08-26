import React, { useState } from 'react';
import { X, ShieldCheck, AlertCircle, RefreshCw, KeyRound, CheckCircle2, Lock, ArrowRight } from 'lucide-react';
import { apiClient } from '../services/apiClient.ts';
import { UserProfile } from '../types.ts';
import { isValidAadhaar } from '../backend/utils/validators.ts';

interface AadhaarVerificationModalProps {
  isOpen: boolean;
  user: UserProfile | null;
  onClose: () => void;
  onVerificationComplete: (updatedUser: UserProfile) => void;
}

export const AadhaarVerificationModal: React.FC<AadhaarVerificationModalProps> = ({
  isOpen,
  user,
  onClose,
  onVerificationComplete
}) => {
  const [step, setStep] = useState<'input' | 'otp' | 'success'>('input');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [maskedAadhaar, setMaskedAadhaar] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [disclaimer, setDisclaimer] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const isAlreadyVerified = user.aadhaarVerificationStatus === 'verified';

  const formatAadhaarInput = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 12);
    const parts = [];
    for (let i = 0; i < raw.length; i += 4) {
      parts.push(raw.slice(i, i + 4));
    }
    return parts.join(' ');
  };

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const raw = aadhaarNumber.replace(/\s/g, '');
    if (raw.length !== 12 || !isValidAadhaar(raw)) {
      setErrorMsg('Invalid Aadhaar number. Please enter a valid 12-digit number verified by Verhoeff checksum.');
      return;
    }

    if (!consentChecked) {
      setErrorMsg('Please grant explicit consent for identity verification in accordance with the Aadhaar Act.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.aadhaar.initiate(raw);
      if (res.success && res.transactionId) {
        setTransactionId(res.transactionId);
        setMaskedAadhaar(res.maskedAadhaar || 'XXXX-XXXX-XXXX');
        setDisclaimer(res.disclaimer || '');
        setStep('otp');
      } else {
        setErrorMsg(res.message ?? null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not initiate Aadhaar verification.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!otpCode || otpCode.length !== 6) {
      setErrorMsg('Please enter a 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.aadhaar.verifyOtp(transactionId, otpCode);
      if (res.success && res.maskedAadhaar) {
        setMaskedAadhaar(res.maskedAadhaar);
        setStep('success');

        // Fetch refreshed user profile
        const profileRes = await apiClient.users.getProfile();
        if (profileRes.success && profileRes.user) {
          onVerificationComplete(profileRes.user);
        }
      } else {
        setErrorMsg(res.message ?? null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Aadhaar e-KYC Verification</h3>
              <p className="text-[11px] text-slate-400">Authorized UIDAI Integration Architecture</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Regulatory Disclaimer Banner */}
        <div className="bg-slate-950/60 p-3 border-b border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
          <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <span>
            <strong>UIDAI Data-Minimization Compliance:</strong> Raw 12-digit Aadhaar numbers are never logged or stored. Only masked reference (e.g. XXXX-XXXX-1234) and verification timestamps are saved.
          </span>
        </div>

        {errorMsg && (
          <div className="m-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="p-5">
          {isAlreadyVerified && step === 'input' ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Aadhaar Already Verified</h4>
              <p className="text-xs text-slate-300">
                Your profile is linked to masked Aadhaar: <strong className="font-mono text-emerald-400">{user.aadhaarMaskedNumber}</strong>
              </p>
              <p className="text-[11px] text-slate-500">
                Verified at: {user.aadhaarVerifiedAt ? new Date(user.aadhaarVerifiedAt).toLocaleDateString('en-IN') : 'Active'}
              </p>
              <button
                onClick={onClose}
                className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition mt-4"
              >
                Close Window
              </button>
            </div>
          ) : step === 'input' ? (
            <form onSubmit={handleInitiate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  12-Digit Aadhaar Number
                </label>
                <input
                  type="text"
                  required
                  value={aadhaarNumber}
                  onChange={e => setAadhaarNumber(formatAadhaarInput(e.target.value))}
                  placeholder="2345 6789 0123"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-mono tracking-wider text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Format is validated automatically via Verhoeff checksum algorithm.
                </p>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-start gap-2">
                <input
                  type="checkbox"
                  id="consentCheck"
                  checked={consentChecked}
                  onChange={e => setConsentChecked(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700 focus:ring-0 mt-0.5"
                />
                <label htmlFor="consentCheck" className="text-[11px] text-slate-300 leading-snug cursor-pointer">
                  I hereby give my voluntary consent to Scheme Assist to authenticate my identity via authorized UIDAI e-KYC services for government welfare benefit matching.
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>Request Authorized UIDAI OTP <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          ) : step === 'otp' ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>

              <div>
                <h4 className="text-xs font-bold text-white">Enter Aadhaar OTP</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  OTP dispatched by authorized provider for <strong className="font-mono text-slate-200">{maskedAadhaar}</strong>
                </p>
                {disclaimer && (
                  <p className="text-[10px] text-amber-300/80 bg-amber-500/10 p-2 rounded-lg mt-2 border border-amber-500/20">
                    {disclaimer}
                  </p>
                )}
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-40 mx-auto text-center font-mono tracking-widest text-lg bg-slate-950 border border-emerald-500/50 rounded-xl py-2 text-white focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="flex-1 py-2 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm e-KYC'}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">e-KYC Successfully Verified!</h4>
              <p className="text-xs text-slate-300">
                Masked Aadhaar: <strong className="font-mono text-emerald-400">{maskedAadhaar}</strong>
              </p>
              <p className="text-[11px] text-slate-500">
                Your verification status has been permanently updated in your citizen profile.
              </p>
              <button
                onClick={onClose}
                className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition mt-4"
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
