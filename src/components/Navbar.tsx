import React from 'react';
import { Shield, CheckCircle2, AlertCircle, FileText, User, Sparkles, Terminal, LogOut, LogIn, Lock, Code2 } from 'lucide-react';
import { UserProfile, UserRole } from '../types.ts';
import { UserButton, SignedIn, SignedOut, SignInButton } from '../context/AuthContext.tsx';

interface NavbarProps {
  user: UserProfile | null;
  activeTab: 'schemes' | 'profile' | 'documents' | 'api-explorer' | 'security';
  setActiveTab: (tab: 'schemes' | 'profile' | 'documents' | 'api-explorer' | 'security') => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onLogout: () => void;
  onOpenAadhaar: () => void;
  onOpenDigiLocker: () => void;
  onToggleRole?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onOpenAuth,
  onLogout,
  onOpenAadhaar,
  onOpenDigiLocker,
  onToggleRole
}) => {
  const userRole: UserRole = user?.role || 'citizen';
  const isDevOrAdmin = userRole === 'developer' || userRole === 'admin';

  const isAadhaarVerified = user?.aadhaarVerificationStatus === 'verified';
  const isDigiLockerVerified = user?.digilockerVerificationStatus === 'verified';

  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white sticky top-0 z-40 shadow-xl">
      {/* 1. Subtle System Status & Architecture Sub-Bar */}
      <div className="bg-slate-950/90 px-4 sm:px-6 lg:px-8 py-1.5 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] text-slate-400">
          {/* Left: Operational & Compliance Status */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 font-medium text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Backend API: Operational</span>
            </div>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <span className="text-slate-400 hidden sm:inline">UIDAI & DigiLocker Authorized Architecture</span>
          </div>

          {/* Right: Environment & Role Information */}
          <div className="flex items-center gap-2.5 ml-auto">
            <span className="text-slate-500 hidden md:inline">Mode:</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-mono">
              Sandbox Verification
            </span>

            {isDevOrAdmin && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-mono font-semibold flex items-center gap-1">
                <Code2 className="w-3 h-3 text-indigo-400" />
                {userRole.toUpperCase()} ACCESS
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 lg:gap-6">
          {/* Left: Scheme Assist Branding */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none shrink-0 group py-1"
            onClick={() => setActiveTab('schemes')}
            id="nav-brand-logo"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400/30 group-hover:scale-105 transition-transform shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white tracking-tight group-hover:text-emerald-300 transition-colors">
                  Scheme Assist
                </span>
                <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded leading-none">
                  Citizen Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight hidden xl:block">
                National Welfare Scheme Eligibility Platform
              </p>
            </div>
          </div>

          {/* Center: Clean Role-Aware Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800/90 shrink-0 shadow-inner">
            <button
              onClick={() => setActiveTab('schemes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'schemes'
                  ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
              id="nav-tab-schemes"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Scheme Matcher</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'profile'
                  ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
              id="nav-tab-profile"
            >
              <User className="w-3.5 h-3.5" />
              <span>Citizen Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'documents'
                  ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
              id="nav-tab-documents"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Document Vault</span>
            </button>

            {/* API Sandbox Tab: ONLY visible to Admin / Developer users */}
            {isDevOrAdmin && (
              <button
                onClick={() => setActiveTab('api-explorer')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'api-explorer'
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-indigo-300 hover:text-white hover:bg-indigo-950/40'
                }`}
                id="nav-tab-api-explorer"
                title="Interactive REST API Sandbox & Developer Console"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>API Sandbox</span>
                <span className="text-[9px] bg-indigo-400/20 text-indigo-200 border border-indigo-400/30 px-1 rounded font-mono">
                  DEV
                </span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'security'
                  ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
              id="nav-tab-security"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Security Architecture</span>
            </button>
          </nav>

          {/* Right: Unified Controls, Verification Badges & User Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Aadhaar & DigiLocker Status Badges */}
                <div className="hidden lg:flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={onOpenAadhaar}
                    title={isAadhaarVerified ? `Aadhaar Verified: ${user.aadhaarMaskedNumber}` : 'Click to complete Aadhaar e-KYC'}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                      isAadhaarVerified
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-300 border border-amber-500/25 hover:bg-amber-500/20'
                    }`}
                    id="nav-aadhaar-badge"
                  >
                    {isAadhaarVerified ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-amber-400" />
                    )}
                    <span>Aadhaar</span>
                  </button>

                  <button
                    onClick={onOpenDigiLocker}
                    title={isDigiLockerVerified ? 'DigiLocker Verified' : 'Click to authorize DigiLocker documents'}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                      isDigiLockerVerified
                        ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-slate-200'
                    }`}
                    id="nav-digilocker-badge"
                  >
                    {isDigiLockerVerified ? (
                      <CheckCircle2 className="w-3 h-3 text-blue-400" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-slate-400" />
                    )}
                    <span>DigiLocker</span>
                  </button>
                </div>

                {/* Citizen User Profile Info & Clerk User Avatar */}
                <div className="flex items-center gap-2 bg-slate-950/60 pl-2.5 pr-1.5 py-1 rounded-xl border border-slate-800">
                  <div className="text-right hidden sm:block max-w-[130px]">
                    <p className="text-xs font-semibold text-white leading-tight truncate">
                      {user.fullName || 'Citizen'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {userRole === 'developer' ? 'Developer' : userRole === 'admin' ? 'Admin' : (user.occupation || 'Citizen')}
                    </p>
                  </div>

                  <div className="flex items-center">
                    <UserButton
                      appearance={{
                        elements: {
                          userButtonAvatarBox: 'w-7 h-7 ring-2 ring-emerald-500/40 rounded-full',
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-2 rounded-xl bg-slate-950/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 transition flex items-center justify-center cursor-pointer"
                  id="nav-logout-btn"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30 transition cursor-pointer"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 3. Mobile Navigation Tab Strip (Responsive) */}
        <div className="md:hidden flex items-center overflow-x-auto py-2.5 border-t border-slate-800 gap-1.5 text-xs no-scrollbar">
          <button
            onClick={() => setActiveTab('schemes')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
              activeTab === 'schemes' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 bg-slate-950/40 border border-slate-800'
            }`}
          >
            Scheme Matcher
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
              activeTab === 'profile' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 bg-slate-950/40 border border-slate-800'
            }`}
          >
            Citizen Profile
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
              activeTab === 'documents' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 bg-slate-950/40 border border-slate-800'
            }`}
          >
            Document Vault
          </button>

          {/* Only shown on mobile for Admin / Developer */}
          {isDevOrAdmin && (
            <button
              onClick={() => setActiveTab('api-explorer')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
                activeTab === 'api-explorer' ? 'bg-indigo-600 text-white font-semibold' : 'text-indigo-300 bg-indigo-950/30 border border-indigo-800/40'
              }`}
            >
              API Sandbox
            </button>
          )}

          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
              activeTab === 'security' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 bg-slate-950/40 border border-slate-800'
            }`}
          >
            Security
          </button>
        </div>
      </div>
    </header>
  );
};
