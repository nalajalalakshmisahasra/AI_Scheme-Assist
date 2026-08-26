import React, { useState } from 'react';
import { Shield, Sparkles, User, CheckCircle2, ArrowRight, RefreshCw, AlertCircle, Building2, MapPin, IndianRupee, Briefcase, GraduationCap, Users } from 'lucide-react';
import { UserProfile, Gender, Category, Occupation } from '../types.ts';
import { apiClient } from '../services/apiClient.ts';
import { useUser, UserButton } from '../context/AuthContext.tsx';

interface CitizenOnboardingScreenProps {
  onProfileComplete: (profile: UserProfile) => void;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Delhi', 'Jammu and Kashmir',
  'Ladakh', 'Puducherry'
];

const OCCUPATIONS: Occupation[] = [
  'Farmer',
  'Laborer / Daily Wage',
  'Artisan / Small Business',
  'Student',
  'Unemployed',
  'Salaried Private',
  'Government Employee',
  'Senior Citizen / Retired',
  'Homemaker'
];

const CATEGORIES: Category[] = ['General', 'OBC', 'SC', 'ST', 'EWS'];

const EDUCATION_LEVELS = [
  'No formal education',
  'Primary (Up to Class 5)',
  'Middle (Class 6 - 8)',
  'Secondary / 10th Standard',
  'Higher Secondary / 12th Standard',
  'Diploma / ITI',
  'Graduate / Bachelor Degree',
  'Post Graduate / Higher'
];

export const CitizenOnboardingScreen: React.FC<CitizenOnboardingScreenProps> = ({ onProfileComplete }) => {
  const { user: clerkUser } = useUser();

  const defaultEmail = clerkUser?.primaryEmailAddress?.emailAddress || clerkUser?.emailAddresses?.[0]?.emailAddress || '';
  const defaultName = clerkUser?.fullName || `${clerkUser?.firstName || ''} ${clerkUser?.lastName || ''}`.trim() || 'Citizen';

  const [fullName, setFullName] = useState(defaultName);
  const [email] = useState(defaultEmail);
  const [mobileNumber, setMobileNumber] = useState(clerkUser?.primaryPhoneNumber?.phoneNumber || '');
  const [dateOfBirth, setDateOfBirth] = useState('1995-05-15');
  const [gender, setGender] = useState<Gender>('male');
  const [state, setState] = useState('Uttar Pradesh');
  const [district, setDistrict] = useState('Varanasi');
  const [pincode, setPincode] = useState('221001');
  const [occupation, setOccupation] = useState<Occupation>('Farmer');
  const [education, setEducation] = useState('Secondary / 10th Standard');
  const [annualIncome, setAnnualIncome] = useState<number>(120000);
  const [category, setCategory] = useState<Category>('OBC');
  const [minorityStatus, setMinorityStatus] = useState(false);
  const [disabilityStatus, setDisabilityStatus] = useState(false);
  const [disabilityPercentage, setDisabilityPercentage] = useState(0);
  const [landHoldingAcres, setLandHoldingAcres] = useState(2.0);
  const [hasBPLCard, setHasBPLCard] = useState(true);
  const [familyMembersCount, setFamilyMembersCount] = useState(4);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clerkUser?.id) {
      setErrorMsg('User authentication is not available. Please sign in again.');
      return;
    }

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const profileData: Partial<UserProfile> = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      mobileNumber: mobileNumber.trim(),
      dateOfBirth,
      gender,
      address: {
        state,
        district: district.trim(),
        pincode: pincode.trim(),
        city: district.trim()
      },
      occupation,
      education,
      annualIncome: Number(annualIncome),
      category,
      minorityStatus,
      disabilityStatus,
      disabilityPercentage: disabilityStatus ? Number(disabilityPercentage) : 0,
      landHoldingAcres: occupation === 'Farmer' ? Number(landHoldingAcres) : 0,
      hasBPLCard,
      familyMembersCount: Number(familyMembersCount)
    };

    try {
      const res = await apiClient.users.saveClerkProfile(clerkUser.id, profileData);
      if (res.success && res.user) {
        onProfileComplete(res.user);
      } else {
        setErrorMsg(res.message || 'Could not save citizen profile. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving your citizen profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-white tracking-tight">Scheme Assist</span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold">
                    Citizen Onboarding
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  National Welfare Scheme Eligibility & Verification Platform
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 hidden sm:inline">{email}</span>
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
          {/* Header Title */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome to Scheme Assist
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
              Complete your citizen profile to find government schemes you may be eligible for and calculate your maximum benefits.
            </p>
          </div>

          {errorMsg && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Basic Identity */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <User className="w-4 h-4" /> 1. Personal & Contact Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Enter full name as per Aadhaar"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-400 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Number (Aadhaar linked)</label>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={e => setMobileNumber(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={e => setDateOfBirth(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Gender *</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value as Gender)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="transgender">Transgender</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Family Members Count</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={familyMembersCount}
                    onChange={e => setFamilyMembersCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Residential Location */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> 2. Residential Location
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">State of Residence *</label>
                  <select
                    value={state}
                    onChange={e => setState(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                  >
                    {INDIAN_STATES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">District / City *</label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    placeholder="e.g. Varanasi"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pincode}
                    onChange={e => setPincode(e.target.value)}
                    placeholder="6-digit pincode"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Socio-Economic & Occupation */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> 3. Socio-Economic & Eligibility Attributes
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Occupation *</label>
                  <select
                    value={occupation}
                    onChange={e => setOccupation(e.target.value as Occupation)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                  >
                    {OCCUPATIONS.map(occ => (
                      <option key={occ} value={occ}>{occ}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Highest Education Level</label>
                  <select
                    value={education}
                    onChange={e => setEducation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                  >
                    {EDUCATION_LEVELS.map(lvl => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Annual Family Income (INR ₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="5000"
                    value={annualIncome}
                    onChange={e => setAnnualIncome(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Current: ₹{Number(annualIncome || 0).toLocaleString('en-IN')} / year
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Social Category *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as Category)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {occupation === 'Farmer' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Agricultural Landholding (Acres)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={landHoldingAcres}
                      onChange={e => setLandHoldingAcres(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                )}
              </div>

              {/* Checkbox Attributes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <label className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2.5 cursor-pointer hover:border-slate-700 transition">
                  <input
                    type="checkbox"
                    checked={hasBPLCard}
                    onChange={e => setHasBPLCard(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700 focus:ring-0"
                  />
                  <span className="text-xs text-slate-300">BPL / Ration Card Holder</span>
                </label>

                <label className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2.5 cursor-pointer hover:border-slate-700 transition">
                  <input
                    type="checkbox"
                    checked={minorityStatus}
                    onChange={e => setMinorityStatus(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700 focus:ring-0"
                  />
                  <span className="text-xs text-slate-300">Minority Community Status</span>
                </label>

                <label className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2.5 cursor-pointer hover:border-slate-700 transition">
                  <input
                    type="checkbox"
                    checked={disabilityStatus}
                    onChange={e => setDisabilityStatus(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700 focus:ring-0"
                  />
                  <span className="text-xs text-slate-300">Specially Abled / Disability</span>
                </label>
              </div>

              {disabilityStatus && (
                <div className="max-w-xs">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Disability Percentage (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={disabilityPercentage}
                    onChange={e => setDisabilityPercentage(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-2xl shadow-xl shadow-emerald-600/30 transition flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving Citizen Profile...
                  </>
                ) : (
                  <>
                    Save Citizen Profile & Unlock Matched Schemes
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
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
