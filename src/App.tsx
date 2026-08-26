/**
 * AI-Powered Citizen Benefit Assistant (Scheme Assist)
 * Authentication-Gated User Flow with Clerk & Role-Protected Access
 */

import React, { useState, useEffect } from 'react';
import { useSafeAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { WelcomeAuthScreen } from './components/WelcomeAuthScreen.tsx';
import { CitizenOnboardingScreen } from './components/CitizenOnboardingScreen.tsx';
import { SchemeDiscovery } from './components/SchemeDiscovery.tsx';
import { CitizenProfile } from './components/CitizenProfile.tsx';
import { DocumentVault } from './components/DocumentVault.tsx';
import { ApiExplorer } from './components/ApiExplorer.tsx';
import { SecurityComplianceCard } from './components/SecurityComplianceCard.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { AadhaarVerificationModal } from './components/AadhaarVerificationModal.tsx';
import { DigiLockerModal } from './components/DigiLockerModal.tsx';
import { apiClient } from './services/apiClient.ts';
import { UserProfile } from './types.ts';
import { Shield, CheckCircle2, RefreshCw, Lock, Sparkles, User, Terminal } from 'lucide-react';

export default function App() {
  const {
    user: clerkUser,
    isLoaded,
    isSignedIn,
    userProfile,
    hasProfile,
    loadingProfile,
    authModalOpen,
    authModalMode,
    openSignIn,
    openSignUp,
    closeAuthModal,
    signOut,
    setUserProfile,
    setHasProfile,
    loginWithProfile
  } = useSafeAuth();

  const [activeTab, setActiveTab] = useState<'schemes' | 'profile' | 'documents' | 'api-explorer' | 'security'>('schemes');

  // Modals
  const [aadhaarModalOpen, setAadhaarModalOpen] = useState(false);
  const [digiLockerModalOpen, setDigiLockerModalOpen] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const userRole = userProfile?.role || 'citizen';
  const isDevOrAdmin = userRole === 'developer' || userRole === 'admin';

  // Automatically redirect regular citizen users if they try to access api-explorer
  useEffect(() => {
    if (activeTab === 'api-explorer' && !isDevOrAdmin && hasProfile) {
      showToast('API Sandbox is restricted to Developer & Admin roles.', 'info');
      setActiveTab('schemes');
    }
  }, [activeTab, isDevOrAdmin, hasProfile]);

  const handleOpenAuth = (mode: 'login' | 'register') => {
    if (mode === 'register') {
      openSignUp();
    } else {
      openSignIn();
    }
  };

  const handleLogout = async () => {
    await signOut();
    showToast('You have signed out securely.', 'info');
  };

  const handleProfileComplete = (profile: UserProfile) => {
    loginWithProfile(profile);
    showToast('Citizen profile saved successfully! Unlocked personalized scheme matches.');
  };

  const handleUserUpdate = async (updatedUser: UserProfile) => {
    setUserProfile(updatedUser);
    if (clerkUser?.id) {
      await apiClient.users.saveClerkProfile(clerkUser.id, updatedUser);
    }
    showToast('Citizen profile updated successfully.');
  };

  const handleAadhaarSuccess = async (updatedUser: UserProfile) => {
    setUserProfile(updatedUser);
    if (clerkUser?.id) {
      await apiClient.users.saveClerkProfile(clerkUser.id, updatedUser);
    }
    showToast('Aadhaar e-KYC verified successfully with UIDAI authorized provider.');
  };

  const handleDigiLockerSuccess = async (updatedUser: UserProfile) => {
    setUserProfile(updatedUser);
    if (clerkUser?.id) {
      await apiClient.users.saveClerkProfile(clerkUser.id, updatedUser);
    }
    showToast('DigiLocker consent granted and verified certificates imported.');
  };

  // 1. Loading Clerk authentication state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 font-sans">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center shadow-xl shadow-emerald-500/20">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-lg font-bold text-white tracking-tight">Scheme Assist</h1>
            <p className="text-xs text-slate-400">Initializing National Welfare Assistant...</p>
          </div>
          <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin mt-2" />
        </div>
      </div>
    );
  }

  // 2. Unauthenticated User Flow -> Welcome Screen
  if (!isSignedIn) {
    return (
      <>
        <WelcomeAuthScreen
          onOpenSignIn={() => openSignIn()}
          onOpenSignUp={() => openSignUp()}
        />
        <AuthModal
          isOpen={authModalOpen}
          initialMode={authModalMode}
          onClose={closeAuthModal}
          onSuccess={profile => {
            loginWithProfile(profile);
            showToast(`Welcome, ${profile.fullName}!`);
          }}
        />
      </>
    );
  }

  // 3. Authenticated User - Loading Citizen Profile
  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin" />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-base font-bold text-white">Loading Citizen Profile</h1>
            <p className="text-xs text-slate-400">Synchronizing database records...</p>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authenticated User - Missing Citizen Profile -> Basic Details Onboarding Form
  if (!hasProfile || !userProfile) {
    return (
      <>
        <CitizenOnboardingScreen
          onProfileComplete={handleProfileComplete}
        />
        <AuthModal
          isOpen={authModalOpen}
          initialMode={authModalMode}
          onClose={closeAuthModal}
          onSuccess={profile => {
            loginWithProfile(profile);
            showToast(`Welcome, ${profile.fullName}!`);
          }}
        />
      </>
    );
  }

  // 5. Authenticated User with Complete Profile -> Full Citizen Dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification Alert */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-emerald-500/40 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium">{toast.message}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        user={userProfile}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onOpenAadhaar={() => setAadhaarModalOpen(true)}
        onOpenDigiLocker={() => setDigiLockerModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'schemes' && (
          <SchemeDiscovery
            user={userProfile}
            onOpenAuth={() => handleOpenAuth('register')}
            onOpenProfile={() => setActiveTab('profile')}
          />
        )}

        {activeTab === 'profile' && (
          <CitizenProfile
            user={userProfile}
            onUserUpdate={handleUserUpdate}
            onOpenAadhaar={() => setAadhaarModalOpen(true)}
            onOpenDigiLocker={() => setDigiLockerModalOpen(true)}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentVault
            onOpenDigiLocker={() => setDigiLockerModalOpen(true)}
          />
        )}

        {activeTab === 'api-explorer' && (
          isDevOrAdmin ? (
            <ApiExplorer />
          ) : (
            <div className="max-w-xl mx-auto my-12 p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-5 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-white">API Sandbox Access Restricted</h2>
                <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                  The API Sandbox and interactive developer endpoints are restricted to Administrator and Developer roles. Citizen accounts do not have developer console permissions.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={() => setActiveTab('schemes')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Return to Scheme Matcher
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  View Citizen Profile
                </button>
              </div>
            </div>
          )
        )}

        {activeTab === 'security' && <SecurityComplianceCard />}
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={closeAuthModal}
        onSuccess={profile => {
          loginWithProfile(profile);
          showToast(`Welcome, ${profile.fullName}!`);
        }}
      />

      <AadhaarVerificationModal
        isOpen={aadhaarModalOpen}
        user={userProfile}
        onClose={() => setAadhaarModalOpen(false)}
        onVerificationComplete={handleAadhaarSuccess}
      />

      <DigiLockerModal
        isOpen={digiLockerModalOpen}
        user={userProfile}
        onClose={() => setDigiLockerModalOpen(false)}
        onVerificationComplete={handleDigiLockerSuccess}
      />

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
}
