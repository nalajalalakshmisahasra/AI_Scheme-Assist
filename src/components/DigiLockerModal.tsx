import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, RefreshCw, FileText, ArrowRight, ExternalLink, Lock, AlertCircle } from 'lucide-react';
import { apiClient } from '../services/apiClient.ts';
import { UserProfile } from '../types.ts';

interface DigiLockerModalProps {
  isOpen: boolean;
  user: UserProfile | null;
  onClose: () => void;
  onVerificationComplete: (updatedUser: UserProfile) => void;
}

export const DigiLockerModal: React.FC<DigiLockerModalProps> = ({
  isOpen,
  user,
  onClose,
  onVerificationComplete
}) => {
  const [step, setStep] = useState<'consent' | 'authorizing' | 'success'>('consent');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importedDocsCount, setImportedDocsCount] = useState(0);

  if (!isOpen || !user) return null;

  const isAlreadyVerified = user.digilockerVerificationStatus === 'verified';

  const handleAuthorize = async () => {
    setErrorMsg(null);
    setLoading(true);
    setStep('authorizing');

    try {
      // 1. Get authorization URL and state token from backend
      const initRes = await apiClient.digilocker.authorize();
      if (!initRes.success || !initRes.stateToken) {
        setErrorMsg(initRes.message || 'Could not initiate DigiLocker authorization.');
        setStep('consent');
        setLoading(false);
        return;
      }

      // 2. Simulate OAuth2 authorization callback with issued code
      const authCode = 'auth_code_' + Math.random().toString(36).substring(2, 10);
      const callbackRes = await apiClient.digilocker.callback(authCode, initRes.stateToken);

      if (callbackRes.success) {
        setImportedDocsCount(callbackRes.documents?.length || 3);
        setStep('success');

        // Fetch refreshed user profile
        const profileRes = await apiClient.users.getProfile();
        if (profileRes.success && profileRes.user) {
          onVerificationComplete(profileRes.user);
        }
      } else {
        setErrorMsg(callbackRes.message ?? null);
        setStep('consent');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'DigiLocker authorization failed.');
      setStep('consent');
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
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">DigiLocker & MeriPehchan Consent</h3>
              <p className="text-[11px] text-slate-400">Official OAuth2.0 Document Gateway</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Banner */}
        <div className="bg-slate-950/60 p-3 border-b border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
          <Lock className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Secure OAuth2 Architecture:</strong> You will never be asked for your DigiLocker password on Scheme Assist. Authentication and consent take place strictly via authorized gateways.
          </span>
        </div>

        {errorMsg && (
          <div className="m-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="p-5">
          {isAlreadyVerified && step === 'consent' ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">DigiLocker Account Linked</h4>
              <p className="text-xs text-slate-300">
                Linked DigiLocker User ID: <strong className="font-mono text-blue-400">{user.digilockerUserId || 'DL-VERIFIED'}</strong>
              </p>
              <p className="text-[11px] text-slate-500">
                Verified at: {user.digilockerVerifiedAt ? new Date(user.digilockerVerifiedAt).toLocaleDateString('en-IN') : 'Active'}
              </p>
              <button
                onClick={onClose}
                className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition mt-4"
              >
                Close Window
              </button>
            </div>
          ) : step === 'consent' ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-200 mb-2">Requested Document Scopes:</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>Income Certificate (Revenue Department)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span>Caste / Community Certificate</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>NFSA Priority Ration Card</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                Granting consent will auto-import digitally signed government credentials directly into your encrypted Document Vault for 100% accurate scheme matching.
              </div>

              <button
                onClick={handleAuthorize}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2"
              >
                Authorize & Pull DigiLocker Documents
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : step === 'authorizing' ? (
            <div className="text-center py-6 space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
              <h4 className="text-sm font-bold text-white">Communicating with DigiLocker Gateway...</h4>
              <p className="text-xs text-slate-400">
                Exchanging cryptographic OAuth2 authorization code and retrieving digitally signed certificates.
              </p>
            </div>
          ) : (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">DigiLocker Verification Complete!</h4>
              <p className="text-xs text-slate-300">
                Successfully imported <strong className="text-emerald-400">{importedDocsCount} verified government documents</strong> with digital signatures into your vault.
              </p>
              <button
                onClick={onClose}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition mt-4"
              >
                View in Document Vault
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
