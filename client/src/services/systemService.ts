/**
 * System Telemetry & Gateway Connectivity Service
 */

import { apiClient, ApiError } from './apiClient';
import { API_ENDPOINTS } from './endpoints';

export interface HealthResponse {
  status: string;
  message: string;
  timestamp: string;
}

export interface ConnectionTestResult {
  ok: boolean;
  latencyMs: number;
  message: string;
  endpoint: string;
}

export const systemService = {
  /**
   * Ping backend API gateway health endpoint
   */
  async checkHealth(): Promise<HealthResponse> {
    return apiClient.get<HealthResponse>(API_ENDPOINTS.SYSTEM.HEALTH);
  },

  /**
   * Test connection to any target API gateway URL and measure RTT latency
   */
  async testConnection(targetUrl?: string): Promise<ConnectionTestResult> {
    const raw = (targetUrl || 'http://localhost:5001/api/v1').trim();
    let url = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `http://${raw}`;
    url = url.replace(/\/+$/, '');

    // Resolve exact health endpoint
    let healthUrl = url;
    if (url.endsWith('/health')) {
      healthUrl = url;
    } else if (url.endsWith('/api/v1')) {
      healthUrl = `${url}/health`;
    } else {
      healthUrl = `${url}/api/v1/health`;
    }

    const start = performance.now();
    try {
      const res = await fetch(healthUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      });

      const latencyMs = Math.max(2, Math.round(performance.now() - start));

      if (!res.ok) {
        throw new ApiError(`HTTP ${res.status}: ${res.statusText}`, res.status);
      }

      const data = await res.json().catch(() => ({}));
      return {
        ok: true,
        latencyMs,
        message: data.message || 'API Gateway is online and healthy',
        endpoint: healthUrl,
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      return {
        ok: false,
        latencyMs,
        message: err.message || 'Connection failed',
        endpoint: healthUrl,
      };
    }
  },
};

