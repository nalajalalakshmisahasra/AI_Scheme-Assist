import React from 'react';
import { Shield, Sparkles, Award, CheckCircle2, Lock, ArrowRight, Layers, FileCheck2, UserCheck, HelpCircle, User, Zap } from 'lucide-react';
import { SignInButton, SignUpButton, useSafeAuth } from '../context/AuthContext.tsx';

interface WelcomeAuthScreenProps {
  onOpenSignIn?: () => void;
  onOpenSignUp?: () => void;
}

export const WelcomeAuthScreen: React.FC<WelcomeAuthScreenProps> = ({ onOpenSignIn, onOpenSignUp }) => {
  const { signInWithDemo } = useSafeAuth();
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-white tracking-tight">Scheme Assist</span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold">
                    Citizen Portal
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  National Welfare Scheme Eligibility & Verification Platform
                </p>
              </div>
            </div>

            {/* Auth Action Buttons */}
            <div className="flex items-center gap-3">
              <SignInButton mode="modal">
                <button className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700/80 transition shadow-xs hover:border-slate-600">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center gap-1.5">
                  Sign Up
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </SignUpButton>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Welcome Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
        {/* Main Hero Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden text-center max-w-4xl mx-auto">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mt-20"></div>

          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              AI-Powered Citizen Benefit & Government Scheme Assistant
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Discover Government Welfare Schemes Tailored for You
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Scheme Assist analyzes your demographic profile, occupation, income criteria, and certificates to find eligible Central & State welfare programs, detect missed benefits, and guide direct applications.
            </p>

            {/* CTA Buttons in Hero */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <SignUpButton mode="modal">
                <button className="w-full sm:w-auto px-7 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-2xl shadow-xl shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer">
                  Get Started with Scheme Assist
                  <ArrowRight className="w-4 h-4" />
                </button>
              </SignUpButton>

              <SignInButton mode="modal">
                <button className="w-full sm:w-auto px-7 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-2xl border border-slate-700 transition cursor-pointer">
                  Already registered? Sign In
                </button>
              </SignInButton>
            </div>

            {/* Instant Demo Sandbox Access */}
            <div className="pt-3 flex flex-col items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Or Try Instant Demo Citizen Personas (Zero Signup Needed)
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => signInWithDemo('farmer')}
                  className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  Ramesh Sharma (Farmer, UP)
                </button>
                <button
                  type="button"
                  onClick={() => signInWithDemo('student')}
                  className="px-3 py-1.5 bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  Priya Nair (Student, Kerala)
                </button>
                <button
                  type="button"
                  onClick={() => signInWithDemo('artisan')}
                  className="px-3 py-1.5 bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <User className="w-3.5 h-3.5 text-purple-400" />
                  Rajesh Kumar (Artisan / MSME)
                </button>
                <button
                  type="button"
                  onClick={() => signInWithDemo('admin')}
                  className="px-3 py-1.5 bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-mono font-medium transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  Admin Console Mode
                </button>
              </div>
            </div>

            {/* Compliance badges */}
            <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>UIDAI Aadhaar e-KYC Compliant</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-blue-400" />
                <span>DigiLocker Integration Ready</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Gemini AI Welfare Engine</span>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works - 3 Step Flow */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">How Scheme Assist Works</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Three simple steps to unlock your government scheme entitlements
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3 relative overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="text-sm font-bold text-white">Sign In Securely</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Authenticate with Clerk using your email or phone for secure single sign-on access to your personal citizen workspace.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3 relative overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="text-sm font-bold text-white">Provide Citizen Details</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter your basic demographic attributes: state of residence, income bracket, occupation, and social category.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3 relative overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="text-sm font-bold text-white">View Matched Schemes</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Receive personalized eligibility evaluations, calculate total annual financial benefits, and get direct application links.
              </p>
            </div>
          </div>
        </div>

        {/* Informational Scheme Preview Banner */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">500+ Central & State Schemes Covered</h4>
              <p className="text-[11px] text-slate-400">
                PM-KISAN, Ayushman Bharat, PMAY-G, National Scholarships, PM Vishwakarma, Atal Pension Yojana & more.
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <SignInButton mode="modal">
              <button className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-xl border border-emerald-500/40 transition">
                Sign in to view personalized eligibility
              </button>
            </SignInButton>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2025 Scheme Assist • AI-Powered Citizen Benefit & Government Scheme Assistant</p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>UIDAI Compliant</span>
            <span>•</span>
            <span>DigiLocker Gateway Ready</span>
            <span>•</span>
            <span>Gemini AI Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
