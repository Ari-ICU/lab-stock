/**
 * Universal API Client with Dynamic Gateway Resolution, Auth Headers, and Error Handling
 */

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
  timeoutMs?: number;
}

export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    try {
      const savedConfig = localStorage.getItem('csd_api_config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        if (parsed.url && typeof parsed.url === 'string') {
          let url = parsed.url.trim().replace(/\/+$/, '');
          if (url.endsWith('/health')) url = url.replace(/\/health$/, '');
          if (!url.endsWith('/api/v1') && !url.includes('/api/')) {
            url = `${url}/api/v1`;
          }
          return url;
        }
      }
    } catch {
      // ignore
    }
  }

  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
};

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const directToken = localStorage.getItem('lab_auth_token');
    if (directToken) return directToken;

    const storedUser = localStorage.getItem('lab_auth_user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      return parsed.token || null;
    }
  } catch {
    // ignore
  }
  return null;
};

/**
 * Core HTTP Request Dispatcher
 */
async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, timeoutMs = 4000, headers: customHeaders, ...fetchOptions } = options;

  const baseUrl = getApiBaseUrl().replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  let url = `${baseUrl}${cleanEndpoint}`;

  // Append query string parameters
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  // Construct request headers
  const headers = new Headers(customHeaders);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  // Auto-set Content-Type for JSON payloads if not already set
  if (
    fetchOptions.body &&
    typeof fetchOptions.body === 'string' &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach Authorization Bearer token if available
  const token = getAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Handle request timeout with AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Parse JSON body or return empty for 204 No Content
    if (response.status === 204) {
      return null as T;
    }

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMessage =
        (typeof data === 'object' && data?.message) ||
        (typeof data === 'string' && data) ||
        `HTTP ${response.status}: ${response.statusText}`;
      throw new ApiError(errorMessage, response.status, data);
    }

    return data as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new ApiError(`Request timed out after ${timeoutMs}ms: ${url}`, 408);
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err.message || 'Failed to connect to gateway', 0, err);
  }
}

/**
 * Universal REST API Client methods
 */
export const apiClient = {
  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    });
  },

  put<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    });
  },

  patch<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    });
  },

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'DELETE' });
  },
};
