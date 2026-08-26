import React, { useState } from 'react';
import { User, ShieldCheck, Mail, Phone, Calendar, MapPin, Briefcase, IndianRupee, Layers, CheckCircle2, AlertCircle, Save, RefreshCw, Lock, Sparkles, Terminal, Code2 } from 'lucide-react';
import { UserProfile, Occupation, Category, Gender, UserRole } from '../types.ts';
import { apiClient } from '../services/apiClient.ts';

interface CitizenProfileProps {
  user: UserProfile;
  onUserUpdate: (updatedUser: UserProfile) => void;
  onOpenAadhaar: () => void;
  onOpenDigiLocker: () => void;
}

export const CitizenProfile: React.FC<CitizenProfileProps> = ({
  user,
  onUserUpdate,
  onOpenAadhaar,
  onOpenDigiLocker
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states
  const [fullName, setFullName] = useState(user.fullName);
  const [mobileNumber, setMobileNumber] = useState(user.mobileNumber || '');
  const [dateOfBirth, setDateOfBirth] = useState(user.dateOfBirth || '1990-01-01');
  const [gender, setGender] = useState<Gender>(user.gender || 'male');
  const [occupation, setOccupation] = useState<Occupation>(user.occupation || 'Farmer');
  const [annualIncome, setAnnualIncome] = useState(user.annualIncome?.toString() || '120000');
  const [category, setCategory] = useState<Category>(user.category || 'OBC');
  const [landHoldingAcres, setLandHoldingAcres] = useState(user.landHoldingAcres?.toString() || '2.5');
  const [hasBPLCard, setHasBPLCard] = useState(!!user.hasBPLCard);
  const [rationCardNumber, setRationCardNumber] = useState(user.rationCardNumber || '');
  const [role, setRole] = useState<UserRole>(user.role || 'citizen');
  const [stateName, setStateName] = useState(user.address?.state || 'Uttar Pradesh');
  const [district, setDistrict] = useState(user.address?.district || 'Bilaspur');
  const [city, setCity] = useState(user.address?.city || 'Bilaspur');
  const [pincode, setPincode] = useState(user.address?.pincode || '201301');

  const isAadhaarVerified = user.aadhaarVerificationStatus === 'verified';
  const isDigiLockerVerified = user.digilockerVerificationStatus === 'verified';
  const isEmailVerified = !!user.emailVerified;

  const trustScore = (isEmailVerified ? 30 : 0) + (isAadhaarVerified ? 40 : 0) + (isDigiLockerVerified ? 30 : 0);

  const handleRoleQuickToggle = async (newRole: UserRole) => {
    setRole(newRole);
    setLoading(true);
    setFeedback(null);
    try {
      const res = await apiClient.users.updateProfile({
        role: newRole
      });
      if (res.success && res.user) {
        onUserUpdate(res.user);
        setFeedback({
          type: 'success',
          message: newRole === 'developer'
            ? 'Developer Mode enabled: API Sandbox is now accessible in top navigation.'
            : 'Citizen Mode enabled: Clean citizen view active; API Sandbox hidden.'
        });
      } else {
        // Local fallback update
        const updatedLocal = { ...user, role: newRole };
        onUserUpdate(updatedLocal);
      }
    } catch {
      const updatedLocal = { ...user, role: newRole };
      onUserUpdate(updatedLocal);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const res = await apiClient.users.updateProfile({
        fullName,
        mobileNumber,
        dateOfBirth,
        gender,
        occupation,
        annualIncome: Number(annualIncome),
        category,
        landHoldingAcres: Number(landHoldingAcres),
        hasBPLCard,
        rationCardNumber,
        role,
        address: {
          state: stateName,
          district,
          city,
          pincode
        }
      });

      if (res.success && res.user) {
        onUserUpdate(res.user);
        setIsEditing(false);
        setFeedback({ type: 'success', message: 'Citizen profile and eligibility criteria updated successfully.' });
      } else {
        // Update locally
        const updated = {
          ...user,
          fullName,
          mobileNumber,
          dateOfBirth,
          gender,
          occupation,
          annualIncome: Number(annualIncome),
          category,
          landHoldingAcres: Number(landHoldingAcres),
          hasBPLCard,
          rationCardNumber,
          role,
          address: {
            state: stateName,
            district,
            city,
            pincode
          }
        };
        onUserUpdate(updated);
        setIsEditing(false);
        setFeedback({ type: 'success', message: 'Citizen profile attributes saved successfully.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Profile update error.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner with Trust Score & Verification Quick Badges */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-emerald-600/30">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-white">{user.fullName || 'Citizen User'}</h1>
                <span className="bg-slate-800 text-slate-300 border border-slate-700 text-xs px-2.5 py-0.5 rounded-full font-medium">
                  {user.occupation || 'Citizen'}
                </span>
                {user.role === 'developer' || user.role === 'admin' ? (
                  <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold flex items-center gap-1">
                    <Code2 className="w-3 h-3" />
                    Developer Role
                  </span>
                ) : (
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2 py-0.5 rounded-full font-medium">
                    Standard Citizen
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                <span>{user.email}</span>
                <span>•</span>
                <span>Role: <strong className="text-slate-200 capitalize">{user.role || 'citizen'}</strong></span>
                <span>•</span>
                <span className="font-mono text-[11px] text-slate-500">ID: {user._id}</span>
              </p>
            </div>
          </div>

          {/* Verification Cards */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Email OTP Card */}
            <div className="flex-1 min-w-[130px] bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Email Auth</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xs font-semibold text-emerald-400 mt-1">Verified</p>
            </div>

            {/* Aadhaar e-KYC Card */}
            <div className="flex-1 min-w-[150px] bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Aadhaar e-KYC</span>
                {isAadhaarVerified ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <button
                    onClick={onOpenAadhaar}
                    className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded hover:bg-amber-500/20 font-medium cursor-pointer"
                  >
                    Verify
                  </button>
                )}
              </div>
              <p className="text-xs font-semibold text-white mt-1 font-mono">
                {isAadhaarVerified ? user.aadhaarMaskedNumber : 'Unverified'}
              </p>
            </div>

            {/* DigiLocker Card */}
            <div className="flex-1 min-w-[150px] bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">DigiLocker</span>
                {isDigiLockerVerified ? (
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                ) : (
                  <button
                    onClick={onOpenDigiLocker}
                    className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded hover:bg-blue-500/20 font-medium cursor-pointer"
                  >
                    Authorize
                  </button>
                )}
              </div>
              <p className="text-xs font-semibold text-white mt-1">
                {isDigiLockerVerified ? 'Consent Granted' : 'Pending Consent'}
              </p>
            </div>

            {/* Trust Index */}
            <div className="flex-1 min-w-[120px] bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3">
              <span className="text-[11px] text-emerald-300 font-medium">Trust Score</span>
              <p className="text-sm font-bold text-emerald-400 mt-1">{trustScore}% Verified</p>
            </div>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Role & Access Management Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Account Access Level & Portal Role</h3>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              By default, normal citizens access standard scheme matching, document vault, and security compliance. 
              Developers & administrators can unlock the interactive <strong>API Sandbox</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => handleRoleQuickToggle('citizen')}
              disabled={loading}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                (user.role || 'citizen') === 'citizen'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Citizen (Standard)
            </button>
            <button
              type="button"
              onClick={() => handleRoleQuickToggle('developer')}
              disabled={loading}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                user.role === 'developer' || user.role === 'admin'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Developer / Admin
            </button>
          </div>
        </div>
      </div>

      {/* Main Profile Form & Details */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div>
            <h2 className="text-base font-bold text-white">Citizen Socio-Economic & Eligibility Profile</h2>
            <p className="text-xs text-slate-400">
              The AI scheme matcher uses these attributes to calculate accurate welfare eligibility and entitlements.
            </p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              isEditing
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
            }`}
          >
            {isEditing ? 'Cancel Edit' : 'Edit Profile Attributes'}
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Basic Identity */}
          <div>
            <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              1. Basic Identity & Contact Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full bg-slate-950 disabled:bg-slate-950/50 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Email (Authenticated)</label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  disabled={!isEditing}
                  value={mobileNumber}
                  onChange={e => setMobileNumber(e.target.value)}
                  className="w-full bg-slate-950 disabled:bg-slate-950/50 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Date of Birth</label>
                <input
                  type="date"
                  disabled={!isEditing}
                  value={dateOfBirth}
                  onChange={e => setDateOfBirth(e.target.value)}
                  className="w-full bg-slate-950 disabled:bg-slate-950/50 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Gender</label>
                <select
                  disabled={!isEditing}
                  value={gender}
                  onChange={e => setGender(e.target.value as Gender)}
                  className="w-full bg-slate-950 disabled:bg-slate-950/50 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="transgender">Transgender</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Social Category</label>
                <select
                  disabled={!isEditing}
                  value={category}
                  onChange={e => setCategory(e.target.value as Category)}
                  className="w-full bg-slate-950 disabled:bg-slate-950/50 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="General">General</option>
                  <option value="OBC">OBC (Other Backward Class)</option>
                  <option value="SC">SC (Scheduled Caste)</option>
                  <option value="ST">ST (Scheduled Tribe)</option>
                  <option value="EWS">EWS (Economically Weaker Section)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Socio-Economic Profile */}
          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              2. Socio-Economic & Occupation Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Primary Occupation</label>
                <select
                  disabled={!isEditing}
                  value={occupation}
                  onChange={e => setOccupation(e.target.value as Occupation)}
                  className="w-full bg-slate-950 disabled:bg-slate-950/50 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Farmer">Farmer (Agricultural Landowner)</option>
                  <option value="Laborer / Daily Wage">Laborer / Daily Wage Worker</option>
                  <option value="Artisan / Small Business">Artisan / Small Business / Street Vendor</option>
                  <option value="Student">Student</option>
                  <option value="Unemployed">Unemployed</option>
                  <option value="Salaried Private">Salaried Private Sector</option>
                  <option value="Government Employee">Government Employee</option>
                  <option value="Senior Citizen / Retired">Senior Citizen / Retired</option>
                  <option value="Homemaker">Homemaker</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Annual Family Income (₹ INR)</label>
                <input
                  type="number"
                  disabled={!isEditing}
                  value={annualIncome}
                  onChange={e => setAnnualIncome(e.target.value)}
                  className="w-full bg-slate-950 disabled:bg-slate-950/50 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Agricultural Landholding (Acres)</label>
                <input
                  type="number"
                  step="0.1"
                  disabled={!isEditing}
                  value={landHoldingAcres}
                  onChange={e => setLandHoldingAcres(e.target.value)}
                  className="w-full bg-slate-950 disabled:bg-slate-950/50 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Geographic Residence */}
          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              3. Geographic Domicile & Address
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">State of Domicile</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={stateName}
                  onChange={e => setStateName(e.target.value)}
                  className="w-full bg-slate-950 disabled:bg-slate-950/50 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">District</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  className="w-full bg-slate-950 disabled:bg-slate-950/50 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">City / Tehsil</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full bg-slate-950 disabled:bg-slate-950/50 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">PIN Code</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={pincode}
                  onChange={e => setPincode(e.target.value)}
                  className="w-full bg-slate-950 disabled:bg-slate-950/50 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Welfare Program Identifiers */}
          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              4. Welfare Identifiers & Cards
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Ration Card Number</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={rationCardNumber}
                  onChange={e => setRationCardNumber(e.target.value)}
                  placeholder="e.g. UP-NFSA-2024-99881"
                  className="w-full bg-slate-950 disabled:bg-slate-950/50 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!isEditing}
                    checked={hasBPLCard}
                    onChange={e => setHasBPLCard(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 bg-slate-950 border-slate-700 focus:ring-0"
                  />
                  <span>Holds BPL / Priority Ration Card</span>
                </label>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Discard Changes
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Profile & Recalculate</>}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
