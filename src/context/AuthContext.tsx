import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserRole } from '../types.ts';
import { apiClient } from '../services/apiClient.ts';
import { User, LogIn, UserPlus, LogOut, Shield, ChevronDown, CheckCircle2 } from 'lucide-react';

export interface SafeClerkUser {
  id: string;
  fullName: string | null;
  firstName?: string | null;
  lastName?: string | null;
  primaryEmailAddress?: { emailAddress: string };
  emailAddresses?: Array<{ emailAddress: string }>;
  primaryPhoneNumber?: { phoneNumber: string };
  imageUrl?: string;
}

interface AuthContextType {
  user: SafeClerkUser | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  userProfile: UserProfile | null;
  hasProfile: boolean;
  loadingProfile: boolean;
  authModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openSignIn: () => void;
  openSignUp: () => void;
  closeAuthModal: () => void;
  signOut: () => Promise<void>;
  setUserProfile: (profile: UserProfile | null) => void;
  setHasProfile: (has: boolean) => void;
  signInWithDemo: (demoType?: 'farmer' | 'student' | 'artisan' | 'admin') => Promise<UserProfile>;
  loginWithProfile: (profile: UserProfile, token?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_PRESETS: Record<string, Partial<UserProfile>> = {
  farmer: {
    fullName: 'Ramesh Sharma',
    email: 'ramesh.sharma@example.gov.in',
    mobileNumber: '+91 98765 43210',
    dateOfBirth: '1984-06-15',
    gender: 'male',
    address: {
      street: 'Gram Panchayat Kothapet, House No 42',
      district: 'Varanasi',
      state: 'Uttar Pradesh',
      pincode: '221001'
    },
    occupation: 'Farmer',
    education: 'Secondary / 10th Standard',
    annualIncome: 120000,
    category: 'OBC',
    minorityStatus: false,
    disabilityStatus: false,
    landHoldingAcres: 2.5,
    familyMembersCount: 4,
    hasBPLCard: true,
    rationCardNumber: 'UP-BPL-8849201',
    role: 'citizen',
    aadhaarVerificationStatus: 'verified',
    aadhaarMaskedNumber: 'XXXXXXXX4892',
    digilockerVerificationStatus: 'verified'
  },
  student: {
    fullName: 'Priya Nair',
    email: 'priya.nair@student.ac.in',
    mobileNumber: '+91 98112 34567',
    dateOfBirth: '2003-09-22',
    gender: 'female',
    address: {
      street: 'TC 14/205, University Road',
      district: 'Thiruvananthapuram',
      state: 'Kerala',
      pincode: '695034'
    },
    occupation: 'Student',
    education: 'Graduate / Bachelor Degree',
    annualIncome: 180000,
    category: 'OBC',
    minorityStatus: false,
    disabilityStatus: false,
    landHoldingAcres: 0,
    familyMembersCount: 3,
    hasBPLCard: false,
    role: 'citizen',
    aadhaarVerificationStatus: 'verified',
    aadhaarMaskedNumber: 'XXXXXXXX7124',
    digilockerVerificationStatus: 'unverified'
  },
  artisan: {
    fullName: 'Rajesh Kumar Vishwakarma',
    email: 'rajesh.artisan@gov.in',
    mobileNumber: '+91 97234 56789',
    dateOfBirth: '1988-11-04',
    gender: 'male',
    address: {
      street: 'Shop 12, Handloom Cluster, Sector 4',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '411001'
    },
    occupation: 'Artisan / Small Business',
    education: 'Diploma / ITI',
    annualIncome: 240000,
    category: 'General',
    minorityStatus: false,
    disabilityStatus: false,
    landHoldingAcres: 0,
    familyMembersCount: 5,
    hasBPLCard: true,
    role: 'citizen',
    aadhaarVerificationStatus: 'verified',
    aadhaarMaskedNumber: 'XXXXXXXX3319',
    digilockerVerificationStatus: 'verified'
  },
  admin: {
    fullName: 'Administrator (Developer Mode)',
    email: 'admin.schemeassist@gov.in',
    mobileNumber: '+91 99999 00000',
    dateOfBirth: '1985-01-01',
    gender: 'other',
    address: {
      street: 'NIC Government Complex, CGO Complex',
      district: 'New Delhi',
      state: 'Delhi',
      pincode: '110003'
    },
    occupation: 'Government Employee',
    annualIncome: 850000,
    category: 'General',
    role: 'developer',
    aadhaarVerificationStatus: 'verified',
    digilockerVerificationStatus: 'verified'
  }
};

const LOCAL_USER_KEY = 'scheme_assist_local_user';
const LOCAL_PROFILE_KEY = 'scheme_assist_citizen_profile';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SafeClerkUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);
  const [hasProfile, setHasProfile] = useState<boolean>(false);

  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Initialize session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUserJson = localStorage.getItem(LOCAL_USER_KEY);
        const storedProfileJson = localStorage.getItem(LOCAL_PROFILE_KEY);

        if (storedUserJson) {
          const parsedUser = JSON.parse(storedUserJson);
          setUser(parsedUser);

          if (storedProfileJson) {
            const parsedProfile = JSON.parse(storedProfileJson);
            setUserProfile(parsedProfile);
            setHasProfile(true);
          } else {
            // Check from backend
            try {
              const res = await apiClient.users.getClerkProfile(parsedUser.id);
              if (res.success && res.hasProfile && res.user) {
                setUserProfile(res.user);
                setHasProfile(true);
                localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(res.user));
              }
            } catch (err) {
              console.warn('Profile fetch error:', err);
            }
          }
        } else {
          // Check if token exists in apiClient
          const token = apiClient.getToken();
          if (token) {
            try {
              const meRes = await apiClient.auth.getMe();
              if (meRes.success && meRes.user) {
                const safeClerk: SafeClerkUser = {
                  id: meRes.user._id,
                  fullName: meRes.user.fullName,
                  firstName: meRes.user.fullName.split(' ')[0],
                  primaryEmailAddress: { emailAddress: meRes.user.email },
                  emailAddresses: [{ emailAddress: meRes.user.email }],
                  primaryPhoneNumber: meRes.user.mobileNumber ? { phoneNumber: meRes.user.mobileNumber } : undefined
                };
                setUser(safeClerk);
                setUserProfile(meRes.user);
                setHasProfile(true);
                localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(safeClerk));
                localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(meRes.user));
              }
            } catch {
              apiClient.removeToken();
            }
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoaded(true);
      }
    };

    initializeAuth();
  }, []);

  const openSignIn = () => {
    setAuthModalMode('login');
    setAuthModalOpen(true);
  };

  const openSignUp = () => {
    setAuthModalMode('register');
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const signOut = async () => {
    try {
      await apiClient.auth.logout();
    } catch {
      // Ignore
    }
    localStorage.removeItem(LOCAL_USER_KEY);
    localStorage.removeItem(LOCAL_PROFILE_KEY);
    apiClient.removeToken();
    setUser(null);
    setUserProfile(null);
    setHasProfile(false);
  };

  const loginWithProfile = (profile: UserProfile, token?: string) => {
    const safeClerk: SafeClerkUser = {
      id: profile.clerkUserId || profile._id,
      fullName: profile.fullName,
      firstName: profile.fullName.split(' ')[0],
      primaryEmailAddress: { emailAddress: profile.email },
      emailAddresses: [{ emailAddress: profile.email }],
      primaryPhoneNumber: profile.mobileNumber ? { phoneNumber: profile.mobileNumber } : undefined
    };

    if (token) {
      apiClient.setToken(token);
    }

    setUser(safeClerk);
    setUserProfile(profile);
    setHasProfile(true);
    setAuthModalOpen(false);

    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(safeClerk));
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
  };

  const signInWithDemo = async (demoType: 'farmer' | 'student' | 'artisan' | 'admin' = 'farmer'): Promise<UserProfile> => {
    setLoadingProfile(true);
    try {
      const preset = DEMO_PRESETS[demoType] || DEMO_PRESETS.farmer;
      const demoClerkId = `demo_user_${demoType}_${Date.now()}`;

      // Save to backend database
      const res = await apiClient.users.saveClerkProfile(demoClerkId, preset);
      const savedProfile = res.user || {
        _id: demoClerkId,
        ...preset,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as UserProfile;

      loginWithProfile(savedProfile);
      return savedProfile;
    } finally {
      setLoadingProfile(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoaded,
        isSignedIn: !!user,
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
        signInWithDemo,
        loginWithProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useSafeAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSafeAuth must be used within an AuthProvider');
  }
  return context;
};

// Drop-in compatibility with @clerk/clerk-react
export const useUser = () => {
  const { user, isLoaded, isSignedIn } = useSafeAuth();
  return { user, isLoaded, isSignedIn };
};

export const useClerk = () => {
  const { openSignIn, openSignUp, signOut } = useSafeAuth();
  return { openSignIn, openSignUp, signOut };
};

export const SignedIn: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isSignedIn } = useSafeAuth();
  if (!isSignedIn) return null;
  return <>{children}</>;
};

export const SignedOut: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isSignedIn } = useSafeAuth();
  if (isSignedIn) return null;
  return <>{children}</>;
};

export const SignInButton: React.FC<{ mode?: string; children?: ReactNode }> = ({ children }) => {
  const { openSignIn } = useSafeAuth();
  if (!children) {
    return (
      <button
        onClick={openSignIn}
        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
      >
        Sign In
      </button>
    );
  }

  return (
    <span onClick={openSignIn} className="inline-block cursor-pointer">
      {children}
    </span>
  );
};

export const SignUpButton: React.FC<{ mode?: string; children?: ReactNode }> = ({ children }) => {
  const { openSignUp } = useSafeAuth();
  if (!children) {
    return (
      <button
        onClick={openSignUp}
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition"
      >
        Sign Up
      </button>
    );
  }

  return (
    <span onClick={openSignUp} className="inline-block cursor-pointer">
      {children}
    </span>
  );
};

export const UserButton: React.FC<{ appearance?: any }> = () => {
  const { user, signOut, signInWithDemo } = useSafeAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 p-1 pl-2 pr-3 bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 rounded-xl text-slate-200 transition cursor-pointer text-xs shadow-sm"
      >
        <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-[11px] ring-1 ring-emerald-400/40">
          {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
        </div>
        <span className="font-medium max-w-[100px] truncate">{user.fullName || 'Citizen'}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {dropdownOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-2 border-b border-slate-800/80 text-xs">
              <p className="font-semibold text-white truncate">{user.fullName || 'Citizen User'}</p>
              <p className="text-slate-400 text-[11px] truncate">{user.primaryEmailAddress?.emailAddress || ''}</p>
            </div>

            <div className="px-1 py-1">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  signInWithDemo('admin');
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-indigo-300 hover:bg-indigo-950/40 rounded-lg flex items-center gap-2 transition"
              >
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                Switch to Admin / Dev Role
              </button>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  signOut();
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-950/30 rounded-lg flex items-center gap-2 transition mt-1"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
