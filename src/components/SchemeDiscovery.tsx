import React, { useState, useEffect } from 'react';
import { Sparkles, IndianRupee, CheckCircle2, AlertCircle, ExternalLink, FileText, Send, RefreshCw, Layers, ShieldCheck, ChevronRight, HelpCircle, ArrowUpRight } from 'lucide-react';
import { UserProfile, SchemeMatchResult, GovernmentScheme } from '../types.ts';
import { apiClient } from '../services/apiClient.ts';

interface SchemeDiscoveryProps {
  user: UserProfile | null;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
}

export const SchemeDiscovery: React.FC<SchemeDiscoveryProps> = ({
  user,
  onOpenAuth,
  onOpenProfile
}) => {
  const [matchData, setMatchData] = useState<{
    totalSchemesEvaluated: number;
    eligibleSchemes: SchemeMatchResult[];
    missedBenefits: SchemeMatchResult[];
    totalAnnualBenefitValue: number;
    aiExecutiveSummary: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'eligible' | 'missed' | 'catalog'>('eligible');
  const [catalogSchemes, setCatalogSchemes] = useState<GovernmentScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // AI Chat Assistant
  const [chatQuery, setChatQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'Namaste! I am your AI Citizen Benefit Advisor. You can ask me how to apply for any central or state scheme, check required documents, or link your bank account for Direct Benefit Transfer (DBT).'
    }
  ]);
  const [aiThinking, setAiThinking] = useState(false);

  const loadBenefitMatches = async () => {
    setLoading(true);
    try {
      // 1. Run eligibility match engine with current user profile
      const matchRes = await apiClient.schemes.match(user || undefined, user?.clerkUserId || user?._id);
      if (matchRes.success && matchRes.data) {
        setMatchData(matchRes.data);
      }

      // 2. Fetch full catalog
      const catRes = await apiClient.schemes.list();
      if (catRes.success && catRes.schemes) {
        setCatalogSchemes(catRes.schemes);
      }
    } catch (err) {
      console.error('Error fetching scheme matches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBenefitMatches();
  }, [user]);

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim() || aiThinking) return;

    const userPrompt = chatQuery.trim();
    setChatQuery('');
    setChatHistory(prev => [...prev, { role: 'user', text: userPrompt }]);
    setAiThinking(true);

    try {
      const res = await apiClient.schemes.askAI(userPrompt);
      if (res.success && res.answer) {
        setChatHistory(prev => [...prev, { role: 'assistant', text: res.answer ?? '' }]);
      } else {
        setChatHistory(prev => [
          ...prev,
          { role: 'assistant', text: 'I could not process your query at this moment. Please check your eligibility in the dashboard.' }
        ]);
      }
    } catch (err: any) {
      setChatHistory(prev => [
        ...prev,
        { role: 'assistant', text: err.message || 'AI Assistant is currently busy.' }
      ]);
    } finally {
      setAiThinking(false);
    }
  };

  const filteredEligible = matchData?.eligibleSchemes.filter(s => {
    const matchCat = selectedCategoryFilter === 'all' || s.scheme.category.toLowerCase() === selectedCategoryFilter.toLowerCase();
    const matchSearch = !searchQuery || s.scheme.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.scheme.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  }) || [];

  const filteredMissed = matchData?.missedBenefits.filter(s => {
    const matchCat = selectedCategoryFilter === 'all' || s.scheme.category.toLowerCase() === selectedCategoryFilter.toLowerCase();
    const matchSearch = !searchQuery || s.scheme.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  }) || [];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Hero Welfare Entitlement Summary Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Left stats & AI summary */}
          <div className="lg:col-span-2 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              AI Benefit Match Engine Powered by Gemini
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Personalized Citizen Welfare & Scheme Matcher
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {matchData?.aiExecutiveSummary ||
                'Analyzing demographic attributes, income ceilings, landholdings, and category quotas against Central & State schemes.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onOpenProfile}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1.5"
              >
                Adjust Profile Attributes
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={loadBenefitMatches}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                title="Recalculate Eligibility"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Right: Big Benefit Callout Card */}
          <div className="bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-6 shadow-xl text-center space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Estimated Total Annual Entitlement
            </span>

            <div className="flex items-center justify-center gap-1 text-3xl sm:text-4xl font-extrabold text-emerald-400">
              <IndianRupee className="w-8 h-8 flex-shrink-0" />
              <span>{(matchData?.totalAnnualBenefitValue || 0).toLocaleString('en-IN')}</span>
              <span className="text-xs text-slate-400 font-normal self-end mb-1">/ year</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-left text-xs">
              <div className="p-2 bg-slate-900 rounded-xl">
                <span className="text-slate-400 text-[10px]">Eligible Schemes</span>
                <p className="text-base font-bold text-white mt-0.5">
                  {matchData?.eligibleSchemes.length || 0} Programs
                </p>
              </div>
              <div className="p-2 bg-slate-900 rounded-xl">
                <span className="text-slate-400 text-[10px]">Catalog Audited</span>
                <p className="text-base font-bold text-white mt-0.5">
                  {matchData?.totalSchemesEvaluated || 0} Schemes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Schemes Explorer + AI Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Matched Schemes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filter Bar & Tabs */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Tab Selector */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setActiveTab('eligible')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    activeTab === 'eligible'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Eligible for You ({matchData?.eligibleSchemes.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('missed')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    activeTab === 'missed'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Potential / Near Match ({matchData?.missedBenefits.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    activeTab === 'catalog'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Schemes ({catalogSchemes.length})
                </button>
              </div>

              {/* Search */}
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search scheme name..."
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-full sm:w-48"
              />
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs text-slate-400">
              <span className="text-[11px] font-medium mr-1 text-slate-500">Sector:</span>
              {['all', 'Agriculture', 'Healthcare', 'Social Security', 'Education', 'Housing', 'Women & Child', 'Financial Inclusion'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition ${
                    selectedCategoryFilter.toLowerCase() === cat.toLowerCase()
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {cat === 'all' ? 'All Sectors' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Scheme List Items */}
          {loading ? (
            <div className="py-16 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-500" />
              <p className="text-xs">Running AI demographic eligibility analysis...</p>
            </div>
          ) : activeTab === 'eligible' ? (
            <div className="space-y-4">
              {filteredEligible.length === 0 ? (
                <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
                  No matching schemes found for the selected filter. Try updating your citizen profile attributes.
                </div>
              ) : (
                filteredEligible.map(({ scheme, matchScore, eligibleReasons, actionPlan }) => (
                  <div
                    key={scheme.id}
                    className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 shadow-xl transition space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                            {scheme.category}
                          </span>
                          <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
                            {scheme.shortCode}
                          </span>
                          <span className="text-[11px] text-slate-400">{scheme.ministry}</span>
                        </div>

                        <h3 className="text-base font-bold text-white mt-1.5">{scheme.name}</h3>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">{scheme.description}</p>
                      </div>

                      {/* Benefit Callout Badge */}
                      <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-right sm:min-w-[170px] flex-shrink-0">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Grant / Benefit</span>
                        <span className="text-sm font-bold text-emerald-400 block">{scheme.benefitAmountText}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">{scheme.benefitFrequency}</span>
                      </div>
                    </div>

                    {/* Eligibility Match Breakdown */}
                    <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Why You Qualify ({matchScore}% Match):
                        </span>
                      </div>
                      <ul className="text-xs text-slate-300 space-y-1 pl-5 list-disc">
                        {eligibleReasons.map((reason, idx) => (
                          <li key={idx}>{reason}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Required Documents Pill List */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                      <span className="text-slate-500 text-[11px] font-medium mr-1 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        Required Proofs:
                      </span>
                      {scheme.requiredDocuments.map((doc, idx) => (
                        <span key={idx} className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px]">
                          {doc}
                        </span>
                      ))}
                    </div>

                    {/* Footer Application Link */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">Portal: {scheme.portalName}</span>
                      <a
                        href={scheme.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition"
                      >
                        Apply on Official Portal
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'missed' ? (
            <div className="space-y-4">
              {filteredMissed.map(({ scheme, matchScore, ineligibleReasons }) => (
                <div
                  key={scheme.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 opacity-90"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                          Near Match ({matchScore}%)
                        </span>
                        <span className="text-[11px] text-slate-400">{scheme.ministry}</span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-1">{scheme.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">{scheme.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-bold text-slate-300">{scheme.benefitAmountText}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/20 text-xs">
                    <span className="font-semibold text-amber-300 flex items-center gap-1 mb-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      Eligibility Gap:
                    </span>
                    <ul className="text-slate-300 space-y-1 pl-4 list-disc text-[11px]">
                      {ineligibleReasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* All Schemes Catalog View */
            <div className="space-y-4">
              {catalogSchemes.map(scheme => (
                <div key={scheme.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
                          {scheme.shortCode}
                        </span>
                        <span className="text-[11px] text-slate-400">{scheme.ministry}</span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-1">{scheme.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">{scheme.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-400 block">{scheme.benefitAmountText}</span>
                      <span className="text-[10px] text-slate-500">{scheme.benefitFrequency}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                    <span className="text-slate-500 text-[11px]">Portal: {scheme.portalName}</span>
                    <a
                      href={scheme.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center gap-1 font-medium"
                    >
                      Visit Official Portal <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: AI Citizen Benefit Assistant Chat */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[640px]">
            {/* Chat Header */}
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Scheme Assist AI Advisor</h3>
                <p className="text-[10px] text-emerald-400 font-medium">Gemini 3.7 Flash • Online</p>
              </div>
            </div>

            {/* Chat Message Scroll Box */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[88%] p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-none shadow-md'
                        : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>
                </div>
              ))}

              {aiThinking && (
                <div className="flex justify-start">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl rounded-bl-none text-xs text-slate-400 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    <span>Analyzing Government Verify database...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Inquiry Prompts */}
            <div className="p-2 bg-slate-950/60 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[10px]">
              <button
                onClick={() => setChatQuery('How to seed Aadhaar with bank account for DBT?')}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg whitespace-nowrap"
              >
                Bank DBT Seeding?
              </button>
              <button
                onClick={() => setChatQuery('What documents do I need for PM-KISAN?')}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg whitespace-nowrap"
              >
                PM-KISAN proofs?
              </button>
            </div>

            {/* Chat Input */}
            <form onSubmit={handleAskAI} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={chatQuery}
                onChange={e => setChatQuery(e.target.value)}
                placeholder="Ask about any scheme, criteria, DBT..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={aiThinking || !chatQuery.trim()}
                className="p-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl shadow-md shadow-emerald-600/20 transition flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
