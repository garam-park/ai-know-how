const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

interface APIResponse<T = unknown> {
  code: number;
  message?: string;
  result: T;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<APIResponse<T>> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> ?? {}),
    };

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    // 토큰 만료 시 갱신 시도
    if (response.status === 401 && data.code === 401001) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        headers.Authorization = `Bearer ${this.getToken()}`;
        const retryResponse = await fetch(`${this.baseUrl}${path}`, { ...options, headers });
        return retryResponse.json();
      }
    }

    if (!response.ok) {
      throw data;
    }

    return data;
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return false;
      }

      const data = await response.json();
      localStorage.setItem('accessToken', data.result.accessToken);
      localStorage.setItem('refreshToken', data.result.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  get<T>(path: string): Promise<APIResponse<T>> {
    return this.request<T>(path);
  }

  post<T>(path: string, body?: unknown): Promise<APIResponse<T>> {
    return this.request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
  }

  patch<T>(path: string, body?: unknown): Promise<APIResponse<T>> {
    return this.request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
  }

  delete<T>(path: string): Promise<APIResponse<T>> {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_BASE);
