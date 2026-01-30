import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { IExternalApiClient, ApiRequest, RequestConfig } from '../../application/interfaces/IExternalApiClient';
import { Logger } from '../../utils/logger';
import { IntegrationError } from '../../utils/errors';
import { config } from '../../config/environment';

/**
 * External API Client Implementation
 * Handles REST API calls with retry logic and error handling
 */
export class ExternalApiClient implements IExternalApiClient {
  private client: AxiosInstance;
  private readonly logger: Logger;

  constructor() {
    this.logger = new Logger({ service: 'ExternalApiClient' });

    this.client = axios.create({
      baseURL: config.externalApi.baseUrl,
      timeout: config.externalApi.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': config.app.serviceName,
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        this.logger.debug('Outgoing API request', {
          method: config.method,
          url: config.url,
        });
        return config;
      },
      (error) => {
        this.logger.error('Request interceptor error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug('API response received', {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      async (error: AxiosError) => {
        return this.handleError(error);
      }
    );
  }

  async call<T = any>(request: ApiRequest): Promise<T> {
    const axiosConfig: AxiosRequestConfig = {
      method: request.method,
      url: request.endpoint,
      data: request.data,
      headers: request.headers,
      params: request.params,
      timeout: request.timeout || config.externalApi.timeout,
    };

    try {
      const response = await this.retryRequest(() => this.client.request<T>(axiosConfig));
      return response.data;
    } catch (error) {
      this.logger.error('API call failed', { request, error });
      throw new IntegrationError(`API call failed: ${(error as Error).message}`);
    }
  }

  async get<T = any>(endpoint: string, requestConfig?: RequestConfig): Promise<T> {
    return this.call<T>({
      method: 'GET',
      endpoint,
      headers: requestConfig?.headers,
      params: requestConfig?.params,
      timeout: requestConfig?.timeout,
    });
  }

  async post<T = any>(endpoint: string, data: unknown, requestConfig?: RequestConfig): Promise<T> {
    return this.call<T>({
      method: 'POST',
      endpoint,
      data,
      headers: requestConfig?.headers,
      params: requestConfig?.params,
      timeout: requestConfig?.timeout,
    });
  }

  async put<T = any>(endpoint: string, data: unknown, requestConfig?: RequestConfig): Promise<T> {
    return this.call<T>({
      method: 'PUT',
      endpoint,
      data,
      headers: requestConfig?.headers,
      params: requestConfig?.params,
      timeout: requestConfig?.timeout,
    });
  }

  async delete<T = any>(endpoint: string, requestConfig?: RequestConfig): Promise<T> {
    return this.call<T>({
      method: 'DELETE',
      endpoint,
      headers: requestConfig?.headers,
      params: requestConfig?.params,
      timeout: requestConfig?.timeout,
    });
  }

  /**
   * Retry logic with exponential backoff
   */
  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt >= config.externalApi.retryAttempts) {
        throw error;
      }

      if (this.isRetryableError(error as AxiosError)) {
        const delay = config.externalApi.retryDelay * Math.pow(2, attempt - 1);
        this.logger.warn(`Retrying request (attempt ${attempt + 1})`, { delay });

        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.retryRequest(requestFn, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Determines if an error is retryable
   */
  private isRetryableError(error: AxiosError): boolean {
    if (!error.response) {
      return true; // Network errors are retryable
    }

    const status = error.response.status;
    return status === 429 || status === 503 || status >= 500;
  }

  /**
   * Handles API errors
   */
  private async handleError(error: AxiosError): Promise<never> {
    if (error.response) {
      this.logger.error('API error response', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
      });
    } else if (error.request) {
      this.logger.error('No response received from API', {
        url: error.config?.url,
      });
    } else {
      this.logger.error('Error setting up API request', { message: error.message });
    }

    throw error;
  }
}
