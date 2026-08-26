/**
 * Frontend API Client & State Management
 * Connects React UI directly to Express backend /api/* routes with automatic JWT header injection.
 */

import { UserProfile, DocumentItem, GovernmentScheme, SchemeMatchResult, ApiResponse } from '../types.ts';

const TOKEN_KEY = 'citizen_assistant_jwt_token';

export const apiClient = {
  // Token Storage Helpers
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  // Base HTTP Request Wrapper
  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({
        success: false,
        message: `HTTP ${response.status} ${response.statusText}`
      }));

      if (!response.ok && !data.message) {
        data.message = `Request failed with status code ${response.status}`;
      }

      return data;
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Network connection failed. Please verify server connectivity.'
      };
    }
  },

  // Authentication Endpoints
  auth: {
    async sendEmailOtp(email: string, fullName?: string, purpose: string = 'registration') {
      return apiClient.request('/api/auth/send-email-otp', {
        method: 'POST',
        body: JSON.stringify({ email, fullName, purpose })
      });
    },

    async verifyEmailOtp(email: string, otp: string, purpose: string = 'registration') {
      return apiClient.request('/api/auth/verify-email-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp, purpose })
      });
    },

    async register(userData: any) {
      const res = await apiClient.request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      if (res.success && res.token) {
        apiClient.setToken(res.token);
      }
      return res;
    },

    async login(email: string, password: string) {
      const res = await apiClient.request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (res.success && res.token) {
        apiClient.setToken(res.token);
      }
      return res;
    },

    async getMe(): Promise<ApiResponse<{ user: UserProfile }>> {
      return apiClient.request('/api/auth/me', { method: 'GET' });
    },

    async logout() {
      apiClient.removeToken();
      return apiClient.request('/api/auth/logout', { method: 'POST' });
    }
  },

  // User Profile
  users: {
    async getProfile(): Promise<ApiResponse<{ user: UserProfile }>> {
      return apiClient.request('/api/users/profile', { method: 'GET' });
    },

    async getClerkProfile(clerkUserId: string): Promise<ApiResponse<{ user: UserProfile | null; hasProfile: boolean }>> {
      return apiClient.request(`/api/users/clerk/${encodeURIComponent(clerkUserId)}`, { method: 'GET' });
    },

    async saveClerkProfile(clerkUserId: string, profileData: Partial<UserProfile>): Promise<ApiResponse<{ user: UserProfile }>> {
      return apiClient.request('/api/users/clerk-onboard', {
        method: 'POST',
        body: JSON.stringify({ clerkUserId, profileData })
      });
    },

    async updateProfile(updates: Partial<UserProfile>): Promise<ApiResponse<{ user: UserProfile }>> {
      return apiClient.request('/api/users/profile/update', {
        method: 'POST',
        body: JSON.stringify(updates)
      });
    },

    async getStats() {
      return apiClient.request('/api/users/stats', { method: 'GET' });
    }
  },

  // Aadhaar e-KYC Verification
  aadhaar: {
    async initiate(aadhaarNumber: string) {
      return apiClient.request('/api/aadhaar/initiate', {
        method: 'POST',
        body: JSON.stringify({ aadhaarNumber })
      });
    },

    async verifyOtp(transactionId: string, otp: string) {
      return apiClient.request('/api/aadhaar/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ transactionId, otp })
      });
    },

    async getStatus() {
      return apiClient.request('/api/aadhaar/status', { method: 'GET' });
    }
  },

  // DigiLocker Verification
  digilocker: {
    async authorize() {
      return apiClient.request('/api/digilocker/authorize', { method: 'GET' });
    },

    async callback(code: string, state: string) {
      return apiClient.request('/api/digilocker/callback', {
        method: 'POST',
        body: JSON.stringify({ code, state })
      });
    },

    async getStatus() {
      return apiClient.request('/api/digilocker/status', { method: 'GET' });
    }
  },

  // Private Document Vault
  documents: {
    async upload(file: File, documentType: string, title?: string) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      if (title) formData.append('title', title);

      return apiClient.request('/api/documents/upload', {
        method: 'POST',
        body: formData
      });
    },

    async list(): Promise<ApiResponse<{ documents: DocumentItem[] }>> {
      return apiClient.request('/api/documents', { method: 'GET' });
    },

    async delete(id: string) {
      return apiClient.request(`/api/documents/${id}`, { method: 'DELETE' });
    }
  },

  // Government Schemes & AI Assistant
  schemes: {
    async list(filters?: { category?: string; search?: string }): Promise<ApiResponse<{ schemes: GovernmentScheme[] }>> {
      const queryParams = new URLSearchParams();
      if (filters?.category) queryParams.set('category', filters.category);
      if (filters?.search) queryParams.set('search', filters.search);
      const qs = queryParams.toString();
      return apiClient.request(`/api/schemes${qs ? `?${qs}` : ''}`, { method: 'GET' });
    },

    async match(customProfile?: Partial<UserProfile>, clerkUserId?: string): Promise<ApiResponse<{
      totalSchemesEvaluated: number;
      eligibleSchemes: SchemeMatchResult[];
      missedBenefits: SchemeMatchResult[];
      totalAnnualBenefitValue: number;
      aiExecutiveSummary: string;
    }>> {
      return apiClient.request('/api/schemes/match', {
        method: 'POST',
        body: JSON.stringify({ ...(customProfile || {}), ...(clerkUserId ? { clerkUserId } : {}) })
      });
    },

    async askAI(query: string): Promise<ApiResponse<{ answer: string }>> {
      return apiClient.request('/api/schemes/ask-ai', {
        method: 'POST',
        body: JSON.stringify({ query })
      });
    }
  },

  // Dev & Health Sandbox
  dev: {
    async getHealth() {
      return apiClient.request('/api/health', { method: 'GET' });
    },

    async getLastOtp() {
      return apiClient.request('/api/dev/last-otp', { method: 'GET' });
    }
  }
};
