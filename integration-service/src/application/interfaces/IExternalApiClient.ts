/**
 * External API Client Interface
 * Abstraction for HTTP/SOAP API calls
 */
export interface IExternalApiClient {
  /**
   * Makes an API call
   */
  call<T = any>(request: ApiRequest): Promise<T>;

  /**
   * Makes a GET request
   */
  get<T = any>(endpoint: string, config?: RequestConfig): Promise<T>;

  /**
   * Makes a POST request
   */
  post<T = any>(endpoint: string, data: unknown, config?: RequestConfig): Promise<T>;

  /**
   * Makes a PUT request
   */
  put<T = any>(endpoint: string, data: unknown, config?: RequestConfig): Promise<T>;

  /**
   * Makes a DELETE request
   */
  delete<T = any>(endpoint: string, config?: RequestConfig): Promise<T>;
}

export interface ApiRequest {
  method: string;
  endpoint: string;
  data?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  timeout?: number;
}

export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string>;
  timeout?: number;
}
