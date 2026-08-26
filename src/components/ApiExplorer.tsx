import React, { useState } from 'react';
import { Terminal, Play, CheckCircle2, AlertCircle, Copy, Check, RefreshCw, Key, Shield, Layers, Code } from 'lucide-react';
import { apiClient } from '../services/apiClient.ts';

interface ApiEndpoint {
  id: string;
  category: 'Auth' | 'Aadhaar' | 'DigiLocker' | 'Users' | 'Documents' | 'Schemes' | 'Health';
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  requiresAuth: boolean;
  defaultPayload?: any;
}

const API_ENDPOINTS: ApiEndpoint[] = [
  {
    id: 'health',
    category: 'Health',
    name: 'Backend Health & Stats',
    method: 'GET',
    path: '/api/health',
    description: 'Returns backend operational status, verification modes, database stats, and security parameters.',
    requiresAuth: false
  },
  {
    id: 'auth-send-otp',
    category: 'Auth',
    name: 'Send Email OTP',
    method: 'POST',
    path: '/api/auth/send-email-otp',
    description: 'Dispatches cryptographically generated 6-digit OTP to citizen email with rate-limiting and expiration timer.',
    requiresAuth: false,
    defaultPayload: {
      email: 'citizen@example.gov.in',
      fullName: 'Ramesh Kumar Sharma',
      purpose: 'registration'
    }
  },
  {
    id: 'auth-verify-otp',
    category: 'Auth',
    name: 'Verify Email OTP',
    method: 'POST',
    path: '/api/auth/verify-email-otp',
    description: 'Validates submitted OTP against secure server-side salt hash.',
    requiresAuth: false,
    defaultPayload: {
      email: 'citizen@example.gov.in',
      otp: '123456',
      purpose: 'registration'
    }
  },
  {
    id: 'auth-login',
    category: 'Auth',
    name: 'Citizen Login',
    method: 'POST',
    path: '/api/auth/login',
    description: 'Authenticates citizen with bcrypt password hashing and issues signed JWT access token.',
    requiresAuth: false,
    defaultPayload: {
      email: 'ramesh.sharma@example.gov.in',
      password: 'Citizen@123'
    }
  },
  {
    id: 'auth-me',
    category: 'Auth',
    name: 'Get Current Session User',
    method: 'GET',
    path: '/api/auth/me',
    description: 'Returns authenticated citizen profile extracted from Bearer JWT token header.',
    requiresAuth: true
  },
  {
    id: 'aadhaar-initiate',
    category: 'Aadhaar',
    name: 'Initiate Aadhaar e-KYC',
    method: 'POST',
    path: '/api/aadhaar/initiate',
    description: 'Validates 12-digit format via Verhoeff checksum algorithm and invokes authorized UIDAI e-KYC gateway.',
    requiresAuth: true,
    defaultPayload: {
      aadhaarNumber: '234567890123'
    }
  },
  {
    id: 'aadhaar-verify',
    category: 'Aadhaar',
    name: 'Verify Aadhaar OTP',
    method: 'POST',
    path: '/api/aadhaar/verify-otp',
    description: 'Authenticates OTP with authorized provider; updates user profile with masked Aadhaar (XXXX-XXXX-1234).',
    requiresAuth: true,
    defaultPayload: {
      transactionId: 'txn_mock_123',
      otp: '123456'
    }
  },
  {
    id: 'aadhaar-status',
    category: 'Aadhaar',
    name: 'Aadhaar Verification Status',
    method: 'GET',
    path: '/api/aadhaar/status',
    description: 'Returns masked Aadhaar and UIDAI compliance audit info.',
    requiresAuth: true
  },
  {
    id: 'digilocker-authorize',
    category: 'DigiLocker',
    name: 'Initiate DigiLocker Consent',
    method: 'GET',
    path: '/api/digilocker/authorize',
    description: 'Generates authorized MeriPehchan / DigiLocker OAuth2 consent URI with cryptographic CSRF state token.',
    requiresAuth: true
  },
  {
    id: 'digilocker-callback',
    category: 'DigiLocker',
    name: 'DigiLocker OAuth2 Callback',
    method: 'POST',
    path: '/api/digilocker/callback',
    description: 'Exchanges authorization code for access token and auto-imports verified government issued certificates.',
    requiresAuth: false,
    defaultPayload: {
      code: 'dl_auth_code_sample',
      state: 'state_token_sample'
    }
  },
  {
    id: 'users-profile',
    category: 'Users',
    name: 'Get Citizen Profile',
    method: 'GET',
    path: '/api/users/profile',
    description: 'Retrieves complete demographic and socio-economic welfare attributes.',
    requiresAuth: true
  },
  {
    id: 'users-update',
    category: 'Users',
    name: 'Update Citizen Demographics',
    method: 'POST',
    path: '/api/users/profile/update',
    description: 'Updates income, landholding, category, or occupation for real-time welfare re-evaluation.',
    requiresAuth: true,
    defaultPayload: {
      occupation: 'Farmer',
      annualIncome: 140000,
      landHoldingAcres: 3.5,
      hasBPLCard: true
    }
  },
  {
    id: 'documents-list',
    category: 'Documents',
    name: 'List Stored Documents',
    method: 'GET',
    path: '/api/documents',
    description: 'Returns citizen private vault documents with signed, temporary download URLs.',
    requiresAuth: true
  },
  {
    id: 'schemes-list',
    category: 'Schemes',
    name: 'Catalog of Government Schemes',
    method: 'GET',
    path: '/api/schemes',
    description: 'Returns all registered Central & State welfare initiatives.',
    requiresAuth: false
  },
  {
    id: 'schemes-match',
    category: 'Schemes',
    name: 'AI Scheme Eligibility Matching',
    method: 'POST',
    path: '/api/schemes/match',
    description: 'Evaluates citizen attributes against scheme quotas with deterministic rules + Gemini AI synthesis.',
    requiresAuth: false,
    defaultPayload: {
      occupation: 'Farmer',
      annualIncome: 120000,
      category: 'OBC',
      landHoldingAcres: 2.5,
      hasBPLCard: true
    }
  },
  {
    id: 'schemes-ask-ai',
    category: 'Schemes',
    name: 'Gemini AI Citizen Advisor',
    method: 'POST',
    path: '/api/schemes/ask-ai',
    description: 'Invokes Gemini 3.7 Flash server-side to provide accurate government scheme advice.',
    requiresAuth: false,
    defaultPayload: {
      query: 'What are the required documents for PM-KISAN Samman Nidhi?'
    }
  }
];

export const ApiExplorer: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint>(API_ENDPOINTS[0]);
  const [requestPayload, setRequestPayload] = useState<string>(
    API_ENDPOINTS[0].defaultPayload ? JSON.stringify(API_ENDPOINTS[0].defaultPayload, null, 2) : ''
  );
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseBody, setResponseBody] = useState<any>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSelectEndpoint = (ep: ApiEndpoint) => {
    setSelectedEndpoint(ep);
    setRequestPayload(ep.defaultPayload ? JSON.stringify(ep.defaultPayload, null, 2) : '');
    setResponseBody(null);
    setResponseStatus(null);
    setResponseTime(null);
  };

  const handleExecute = async () => {
    setLoading(true);
    setResponseBody(null);
    setResponseStatus(null);

    const token = apiClient.getToken();
    const headers: Record<string, string> = {};

    if (selectedEndpoint.requiresAuth && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (selectedEndpoint.method !== 'GET') {
      headers['Content-Type'] = 'application/json';
    }

    const startTime = performance.now();
    try {
      let body: string | undefined = undefined;
      if (selectedEndpoint.method !== 'GET' && requestPayload) {
        body = requestPayload;
      }

      const res = await fetch(selectedEndpoint.path, {
        method: selectedEndpoint.method,
        headers,
        body
      });

      const endTime = performance.now();
      setResponseTime(Math.round(endTime - startTime));
      setResponseStatus(res.status);

      const json = await res.json().catch(() => ({ message: 'Non-JSON response' }));
      setResponseBody(json);
    } catch (err: any) {
      setResponseStatus(0);
      setResponseBody({ error: err.message || 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const copyResponse = () => {
    if (responseBody) {
      navigator.clipboard.writeText(JSON.stringify(responseBody, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getMethodColor = (m: string) => {
    switch (m) {
      case 'GET': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'POST': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'PUT': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'DELETE': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default: return 'bg-slate-800 text-slate-300';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Interactive REST API Tester & Sandbox</h1>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2 py-0.5 rounded-full font-mono font-medium">
              Live Express Backend
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Test all authentication, Aadhaar e-KYC, DigiLocker OAuth2, document storage, and AI scheme matching endpoints.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">JWT Session:</span>
          <span className="font-mono bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-emerald-400">
            {apiClient.getToken() ? 'Authenticated (Bearer Active)' : 'Unauthenticated'}
          </span>
        </div>
      </div>

      {/* Main Grid: Endpoint Sidebar + Request/Response Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Endpoint List (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 max-h-[720px] overflow-y-auto">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
            API Endpoints ({API_ENDPOINTS.length})
          </h2>

          <div className="space-y-1.5">
            {API_ENDPOINTS.map(ep => (
              <button
                key={ep.id}
                onClick={() => handleSelectEndpoint(ep)}
                className={`w-full text-left p-2.5 rounded-xl text-xs transition border flex flex-col gap-1 ${
                  selectedEndpoint.id === ep.id
                    ? 'bg-slate-800 border-emerald-500/50 shadow-sm'
                    : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-800/50 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${getMethodColor(ep.method)}`}>
                    {ep.method}
                  </span>
                  <span className="text-[10px] text-slate-500">{ep.category}</span>
                </div>
                <span className="font-semibold text-white truncate">{ep.name}</span>
                <span className="font-mono text-[10px] text-slate-400 truncate">{ep.path}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Studio: Request & Response Inspector (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Endpoint Details & Execution Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-mono font-bold border ${getMethodColor(selectedEndpoint.method)}`}>
                  {selectedEndpoint.method}
                </span>
                <span className="font-mono text-sm font-bold text-white">{selectedEndpoint.path}</span>
              </div>

              <button
                onClick={handleExecute}
                disabled={loading}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Play className="w-4 h-4" /> Send Request</>}
              </button>
            </div>

            <p className="text-xs text-slate-300">{selectedEndpoint.description}</p>

            {selectedEndpoint.requiresAuth && (
              <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2">
                <Key className="w-4 h-4 flex-shrink-0" />
                <span>Requires Bearer JWT Authorization header in request.</span>
              </div>
            )}
          </div>

          {/* Request Payload Editor */}
          {selectedEndpoint.method !== 'GET' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Request Body (JSON)</span>
                <span className="text-[10px] text-slate-500 font-mono">Content-Type: application/json</span>
              </div>
              <textarea
                rows={5}
                value={requestPayload}
                onChange={e => setRequestPayload(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 font-mono text-xs text-emerald-400 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>
          )}

          {/* Live Response Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-300">API Response</span>
                {responseStatus !== null && (
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                      responseStatus >= 200 && responseStatus < 300
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    HTTP {responseStatus}
                  </span>
                )}
                {responseTime !== null && (
                  <span className="text-[11px] text-slate-400 font-mono">{responseTime} ms</span>
                )}
              </div>

              {responseBody && (
                <button
                  onClick={copyResponse}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-lg transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy JSON'}
                </button>
              )}
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 min-h-[180px] max-h-[380px] overflow-y-auto font-mono text-xs">
              {loading ? (
                <div className="h-32 flex items-center justify-center text-slate-500 gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Executing HTTP request...</span>
                </div>
              ) : responseBody ? (
                <pre className="text-emerald-400 whitespace-pre-wrap">
                  {JSON.stringify(responseBody, null, 2)}
                </pre>
              ) : (
                <div className="h-32 flex items-center justify-center text-slate-600">
                  Click "Send Request" above to execute endpoint.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
