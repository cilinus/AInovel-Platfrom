import { handleMockRequest } from '../mocks/handler';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3101/api';

// 백엔드 미구현 엔드포인트 (미리보기용 목 폴백 허용)
// 백엔드에 새 엔드포인트 구현 완료 시 해당 패턴을 이 목록에서 제거할 것
const PREVIEW_ONLY_PATTERNS: RegExp[] = [];

function isPreviewOnly(path: string): boolean {
  return PREVIEW_ONLY_PATTERNS.some(pattern => pattern.test(path));
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
  private refreshPromise: Promise<string> | null = null;
  private onAuthFailure: (() => void) | null = null;
  private onTokenRefreshed: ((token: string) => void) | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  enableMock() {
    this.useMock = true;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  setOnAuthFailure(callback: () => void) {
    this.onAuthFailure = callback;
  }

  setOnTokenRefreshed(callback: (token: string) => void) {
    this.onTokenRefreshed = callback;
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      try {
        const res = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Refresh failed');
        const json = await res.json();
        const data = json?.data ?? json;
        const newToken = data.accessToken;
        this.accessToken = newToken;
        this.onTokenRefreshed?.(newToken);
        return newToken;
      } catch {
        this.accessToken = null;
        this.onAuthFailure?.();
        throw new ApiError(401, 'AUTH_EXPIRED', '세션이 만료되었습니다.');
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      });
    }
    return url.toString();
  }

  private buildMockPath(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    if (!params) return path;
    const searchParts: string[] = [];
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
      }
    });
    return searchParts.length > 0 ? `${path}?${searchParts.join('&')}` : path;
  }

  private tryMock<T>(path: string, options: RequestOptions = {}): T | null {
    const { body, params, method } = options;
    const mockPath = this.buildMockPath(path, params);
    const result = handleMockRequest(mockPath, {
      method: (method as string) ?? 'GET',
      body: body ? JSON.stringify(body) : undefined,
      params: params
        ? Object.fromEntries(
            Object.entries(params)
              .filter(([, v]) => v !== undefined)
              .map(([k, v]) => [k, String(v)]),
          )
        : undefined,
    });
    if (result === null) return null;
    return result as T;
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    if (response.status === 204) return undefined as T;
    const json = await response.json();
    if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
      return json.data as T;
    }
    return json as T;
  }

  private throwFromResponse(response: Response, body: Record<string, any> | null): never {
    const code = body?.error?.code ?? body?.code ?? `HTTP_${response.status}`;
    const message = body?.error?.message ?? body?.message ?? response.statusText;
    throw new ApiError(response.status, code, message);
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    // Mock mode: 구현 완료 엔드포인트는 실제 API 호출, 미구현만 목 제공
    if (this.useMock) {
      if (!isPreviewOnly(path)) {
        console.warn(
          `[ApiClient] Mock mode active but ${path} is implemented. Attempting real API.`,
        );
        // 구현 완료 엔드포인트는 아래 실제 fetch 로직으로 진행
      } else {
        const mockResult = this.tryMock<T>(path, options);
        if (mockResult !== null) {
          console.info(`[ApiClient] 미리보기: ${path}`);
          return mockResult;
        }
        throw new ApiError(404, 'NOT_FOUND', `No mock handler for: ${path}`);
      }
    }

    const { body, params, headers: customHeaders, ...rest } = options;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders as Record<string, string>,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(this.buildUrl(path, params), {
        ...rest,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
      });

      if (!response.ok) {
        // 401이고 refresh 시도 가능한 경우: 자동 갱신 후 재시도
        if (response.status === 401 && this.accessToken && !path.startsWith('/auth/')) {
          const newToken = await this.refreshAccessToken();
          const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
          const retryResponse = await fetch(this.buildUrl(path, params), {
            ...rest,
            headers: retryHeaders,
            body: body ? JSON.stringify(body) : undefined,
            credentials: 'include',
          });
          if (!retryResponse.ok) {
            const retryError = await retryResponse.json().catch(() => null);
            this.throwFromResponse(retryResponse, retryError);
          }
          return this.parseResponse<T>(retryResponse);
        }

        const errBody = await response.json().catch(() => null);
        this.throwFromResponse(response, errBody);
      }

      return this.parseResponse<T>(response);
    } catch (fetchError) {
      // If it is an ApiError (HTTP error, not network error), rethrow immediately
      if (fetchError instanceof ApiError) {
        throw fetchError;
      }

      const errMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);
      console.error(`[ApiClient] ${path} 요청 실패:`, errMsg, fetchError);

      // 구현 완료 엔드포인트: 에러 표시, 목 폴백 금지
      if (!isPreviewOnly(path)) {
        throw new ApiError(
          0,
          'NETWORK_ERROR',
          `서버 요청 실패 (${path}): ${errMsg}`,
        );
      }

      // 미구현 엔드포인트: 미리보기용 목 폴백 허용
      console.info(`[ApiClient] 미리보기 모드: ${path} (백엔드 미구현)`);
      const mockResult = this.tryMock<T>(path, options);
      if (mockResult !== null) return mockResult;
      throw fetchError;
    }
  }

  get<T>(path: string, params?: Record<string, string | number | boolean | undefined>) {
    return this.request<T>(path, { method: 'GET', params });
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'POST', body });
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'PATCH', body });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }

  async uploadFile<T>(path: string, file: File, fieldName = 'file'): Promise<T> {
    const headers: Record<string, string> = {};
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    // Content-Type은 설정하지 않음 - 브라우저가 boundary 포함하여 자동 설정
    const formData = new FormData();
    formData.append(fieldName, file);

    const response = await fetch(this.buildUrl(path), {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => null);
      this.throwFromResponse(response, errBody);
    }

    return this.parseResponse<T>(response);
  }
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiClient = new ApiClient(API_BASE);
