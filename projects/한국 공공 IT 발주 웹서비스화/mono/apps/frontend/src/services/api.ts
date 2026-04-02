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

  private async request<T>(path: string, options: RequestInit = {}): Promise<APIResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> ?? {}),
    };

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    const data = await response.json();

    // 토큰 만료 시 갱신 시도
    if (response.status === 401 && data.code === 401001) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        const retryResponse = await fetch(`${this.baseUrl}${path}`, {
          ...options,
          headers,
          credentials: 'include',
        });
        return retryResponse.json();
      }
    }

    if (!response.ok) {
      throw data;
    }

    return data;
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        window.location.href = '/login';
        return false;
      }

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
