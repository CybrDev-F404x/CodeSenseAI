import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── JWT Interceptor ────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Error Handling Interceptor ────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;

    if (status === 401) {
      localStorage.removeItem('access_token');
      if (!window.location.pathname.includes('/login')) {
        toast.error('Session expired. Please login again.');
        window.location.href = '/login';
      }
    } else if (status === 403) {
      toast.error('You do not have permission to perform this action.');
    } else if (status >= 500) {
      toast.error('Server error. Please try again later.');
    }

    return Promise.reject(err);
  },
);

// ── Auth Service ───────────────────────────────────────────────
export const authService = {
  async login(email: string, password: string) {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    const { data } = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data as { access_token: string; token_type: string };
  },

  async register(payload: { email: string; password: string; full_name?: string }) {
    const { data } = await api.post('/auth/register', payload);
    return data;
  },
};

// ── User Service ───────────────────────────────────────────────
export const userService = {
  async getMe() {
    const { data } = await api.get('/users/me');
    return data;
  },

  async updateMe(payload: {
    email?: string;
    full_name?: string;
    password?: string;
    preferences?: Record<string, unknown>;
  }) {
    const { data } = await api.put('/users/me', payload);
    return data;
  },

  /** Soft-delete: sets is_active=False on the backend. */
  async deleteMe(): Promise<void> {
    await api.delete('/users/me');
  },
};

// ── Audit Service ──────────────────────────────────────────────
export interface AuditPayload {
  language: 'python' | 'csharp';
  code_snippet: string;
}

export interface Audit {
  id: string;
  user_id: string;
  language: string;
  code_snippet: string;
  status: string;
  created_at: string;
}

export const auditService = {
  async list(): Promise<Audit[]> {
    const { data } = await api.get('/audits/');
    return data;
  },

  async create(payload: AuditPayload): Promise<Audit> {
    const { data } = await api.post('/audits/', payload);
    return data;
  },

  async get(id: string): Promise<Audit> {
    const { data } = await api.get(`/audits/${id}`);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/audits/${id}`);
  },

  async analyze(auditId: string): Promise<Report> {
    const { data } = await api.post(`/reports/audit/${auditId}`);
    return data;
  },
};

// ── Report Service ─────────────────────────────────────────────
export interface ReportFinding {
  type: string;
  severity: string;
  line: number;
  message: string;
  suggestion?: string;
}

export interface Report {
  id: string;
  audit_id: string;
  findings: { issues: ReportFinding[]; summary: string };
  score: number;
  created_at: string;
}

export const reportService = {
  async getByAudit(auditId: string): Promise<Report> {
    const { data } = await api.get(`/reports/audit/${auditId}`);
    return data;
  },

  async list(): Promise<Report[]> {
    const { data } = await api.get('/reports/');
    return data;
  },
};

export default api;
