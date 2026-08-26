import React from 'react';
import { ShieldCheck, Lock, FileCheck, KeyRound, Server, EyeOff, CheckCircle2, ShieldAlert } from 'lucide-react';

export const SecurityComplianceCard: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Government & Regulatory Security Architecture</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict adherence to UIDAI e-KYC guidelines, MeriPehchan DigiLocker OAuth2 standards, and data minimization.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Security Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Pillar 1: UIDAI Compliance */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <EyeOff className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">1. UIDAI Aadhaar Act Compliance</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Raw 12-digit Aadhaar numbers are <strong>never stored or logged</strong> in any database table or server logs. Only masked representations (e.g. <span className="font-mono text-emerald-400">XXXX-XXXX-7821</span>) and official provider transaction reference tokens are retained.
          </p>
          <ul className="text-[11px] text-slate-400 space-y-1.5 pt-2 border-t border-slate-800">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Verhoeff checksum validation algorithm
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Audit logging redacts all sensitive numbers
            </li>
          </ul>
        </div>

        {/* Pillar 2: DigiLocker OAuth2 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <FileCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">2. MeriPehchan / DigiLocker OAuth2</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Direct integration with authorized DigiLocker gateways using standard Authorization Code Flow. Cryptographic CSRF state tokens prevent session hijacking during identity consent.
          </p>
          <ul className="text-[11px] text-slate-400 space-y-1.5 pt-2 border-t border-slate-800">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              Automatic import of issuer-signed XML/PDFs
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              Zero password collection on client portal
            </li>
          </ul>
        </div>

        {/* Pillar 3: Cryptographic Storage */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">3. Passwords & OTP Cryptography</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Citizen passwords hashed via <strong>bcrypt</strong> (10 salt rounds). Email OTPs are salted and hashed via SHA-256 HMAC, stored with 5-minute expirations and 3-attempt maximum retry limits.
          </p>
          <ul className="text-[11px] text-slate-400 space-y-1.5 pt-2 border-t border-slate-800">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              One-way hash verification for OTP tokens
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              Anti-brute-force rate limiting middleware
            </li>
          </ul>
        </div>

        {/* Pillar 4: Private Document Vault */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">4. Private Document Vault</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Uploaded proofs and issued certificates are stored privately. Files are never publicly exposed; downloads require short-lived, signed cryptographic access tokens.
          </p>
          <ul className="text-[11px] text-slate-400 space-y-1.5 pt-2 border-t border-slate-800">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              SHA-256 integrity checksum verification
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              Scoped signed URLs with 15-minute expiry
            </li>
          </ul>
        </div>

        {/* Pillar 5: Server-Side Gemini AI */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/30 flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">5. Server-Side AI Execution</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            The Gemini 3.7 Flash AI reasoning engine operates strictly in the Express backend using <span className="font-mono text-emerald-400">@google/genai</span>. Secret API keys are never leaked to the browser.
          </p>
          <ul className="text-[11px] text-slate-400 space-y-1.5 pt-2 border-t border-slate-800">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              Zero browser API key exposure
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              Sanitized contextual prompts
            </li>
          </ul>
        </div>

        {/* Pillar 6: Environment Switch */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">6. Verification Mode Toggle</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            The backend supports seamless switching between development testing sandbox and production UIDAI/DigiLocker providers via <span className="font-mono text-cyan-400">VERIFICATION_MODE=mock|production</span>.
          </p>
          <ul className="text-[11px] text-slate-400 space-y-1.5 pt-2 border-t border-slate-800">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              Standardized API contracts across environments
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              Simulated ASA/KUA e-KYC response envelopes
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
