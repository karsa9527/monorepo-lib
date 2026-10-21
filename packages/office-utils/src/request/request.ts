import type { AxiosError } from 'axios';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import type { Method, InternalRequestConfig, RequestOptions, ResponseResult } from './types';
import {
  ERROR_CODE_CANCEL,
  ERROR_CODE_NETWORK,
  ERROR_CODE_TIMEOUT,
  ERROR_CODE_UNAUTHORIZED,
  RequestError,
  STATUS_MESSAGE,
} from './error';

/** 业务成功码（与后端约定；按需扩展） */
export const SUCCESS_CODES = [0, 200];

/** 全局钩子：把请求库与 UI（toast / 路由 / store）解耦 */
export interface RequestHooks {
  /** 获取 token，由 AuthStore 注入 */
  getToken?: () => string | null | undefined;
  /** 统一错误提示 */
  onError?: (error: RequestError) => void;
  /** 成功提示 */
  onSuccess?: (message: string) => void;
  /** 401：清理登录态并跳转登录页 */
  onUnauthorized?: (error: RequestError) => void;
  /** 请求中数量变化，用于全局 loading */
  onLoadingChange?: (pending: number) => void;
  /** 自定义请求头，每次请求都会调用 */
  getExtraHeaders?: () => Record<string, string>;
}

export interface RequestInstanceOptions extends RequestOptions {
  /** 全局默认重试次数 */
  retry?: number;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * 请求库核心类
 *
 * 能力：
 * - 统一 baseURL / timeout / 请求头
 * - token 自动注入
 * - 业务码解析：默认直接返回 data，raw=true 时返回完整响应体
 * - 统一错误对象 RequestError + 错误提示钩子
 * - 401 自动登出跳转
 * - 重复请求自动取消（可关闭）
 * - 网络异常自动重试（次数与退避间隔可配）
 * - 全局请求中计数
 */
export class Request {
  readonly instance: AxiosInstance;
  hooks: RequestHooks = {};

  /** 进行中的请求，key -> AbortController */
  private pending = new Map<string, AbortController>();
  private pendingCount = 0;

  constructor(options: RequestInstanceOptions = {}, hooks: RequestHooks = {}) {
    this.hooks = hooks;
    this.instance = axios.create({
      baseURL: options.baseURL ?? '/api',
      timeout: options.timeout ?? 15000,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        ...(options.headers ?? {}),
      },
      ...options,
    });
    this.setupInterceptors();
  }

  /** 覆盖 / 合并钩子 */
  setHooks(hooks: RequestHooks) {
    this.hooks = { ...this.hooks, ...hooks };
  }

  private setupInterceptors() {
    // ---------- 请求拦截 ----------
    this.instance.interceptors.request.use(
      (config) => {
        const cfg = config as InternalRequestConfig;
        const opts = cfg as RequestOptions;

        // 1. token 注入
        if (opts.withToken !== false) {
          const token = opts.token ?? this.hooks.getToken?.();
          if (token) {
            cfg.headers.set?.(
              'Authorization',
              token.startsWith('Bearer ') ? token : `Bearer ${token}`,
            );
          }
        }

        // 2. 自定义请求头
        const extra = this.hooks.getExtraHeaders?.();
        if (extra) Object.entries(extra).forEach(([k, v]) => cfg.headers.set?.(k, v));

        // 3. 重复请求取消
        const dedupeKey = this.buildDedupeKey(cfg);
        cfg.__dedupeKey = dedupeKey;
        if (opts.cancelDuplicate !== false && this.pending.has(dedupeKey)) {
          this.pending.get(dedupeKey)?.abort();
          this.pending.delete(dedupeKey);
          this.decreasePending();
        }
        const controller = new AbortController();
        cfg.signal = controller.signal;
        this.pending.set(dedupeKey, controller);

        // 4. loading 计数
        if (opts.loading !== false) this.increasePending();

        return cfg;
      },
      (error) => Promise.reject(error),
    );

    // ---------- 响应拦截 ----------
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ResponseResult>) => response,
      (error: AxiosError<ResponseResult>) => this.handleError(error),
    );
  }

  /** 业务响应处理：拆包 + 业务码判定 */
  private unwrap<T>(response: AxiosResponse<ResponseResult<T>>, config: RequestOptions): T {
    const cfg = (response.config ?? config) as InternalRequestConfig;
    this.finish(cfg);

    const body = response.data;
    // 非标准结构（如文件流、第三方接口）直接透传
    if (!body || typeof body !== 'object' || !('code' in body)) {
      return body as unknown as T;
    }

    const result = body as ResponseResult<T>;
    if (SUCCESS_CODES.includes(result.code)) {
      if (cfg.showSuccess && cfg.successMessage) {
        this.hooks.onSuccess?.(cfg.successMessage);
      }
      // raw=true 时返回完整响应体，调用方自行处理 code/message
      return (cfg.raw ? result : result.data) as T;
    }

    // 业务失败
    const error = new RequestError(result.message || '请求失败', result.code, response, cfg);
    if (cfg.showError !== false) this.hooks.onError?.(error);
    if (error.code === ERROR_CODE_UNAUTHORIZED) this.hooks.onUnauthorized?.(error);
    throw error;
  }

  /** 异常统一处理 */
  private handleError(error: AxiosError<ResponseResult>): Promise<never> {
    const cfg = (error.config ?? {}) as InternalRequestConfig;
    this.finish(cfg);

    // 主动取消：静默处理，不提示
    if (error.code === 'ERR_CANCELED' || axios.isCancel?.(error)) {
      return Promise.reject(new RequestError('请求已取消', ERROR_CODE_CANCEL, error.response, cfg));
    }

    let code = ERROR_CODE_NETWORK;
    let message = '网络连接异常，请检查网络后重试';

    if (error.response) {
      const status = error.response.status;
      code = error.response.data?.code ?? status;
      message = error.response.data?.message || STATUS_MESSAGE[status] || `请求失败（${status}）`;
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      code = ERROR_CODE_TIMEOUT;
      message = '请求超时，请稍后重试';
    }

    const reqError = new RequestError(message, code, error.response, cfg);

    if (code === ERROR_CODE_UNAUTHORIZED) {
      this.hooks.onUnauthorized?.(reqError);
      if (cfg.showError !== false) this.hooks.onError?.(reqError);
    } else if (cfg.showError !== false) {
      this.hooks.onError?.(reqError);
    }

    return Promise.reject(reqError);
  }

  /** 请求完成后清理 pending 与 loading */
  private finish(cfg: InternalRequestConfig) {
    if (cfg.__dedupeKey) {
      this.pending.delete(cfg.__dedupeKey);
    }
    if ((cfg as RequestOptions).loading !== false) this.decreasePending();
  }

  private buildDedupeKey(cfg: InternalRequestConfig): string {
    const method = (cfg.method || 'get').toUpperCase();
    const url = cfg.url || '';
    const params = JSON.stringify(cfg.params ?? {});
    const data = typeof cfg.data === 'string' ? cfg.data : JSON.stringify(cfg.data ?? {});
    return `${method}|${url}|${params}|${data}`;
  }

  private increasePending() {
    this.pendingCount += 1;
    this.hooks.onLoadingChange?.(this.pendingCount);
  }

  private decreasePending() {
    this.pendingCount = Math.max(0, this.pendingCount - 1);
    this.hooks.onLoadingChange?.(this.pendingCount);
  }

  /** 当前进行中的请求数量 */
  get pendingRequestCount() {
    return this.pendingCount;
  }

  /** 判断异常是否值得重试：仅网络错误 / 超时 / 5xx */
  private shouldRetry(error: unknown): boolean {
    if (!(error instanceof RequestError)) return false;
    if (error.isCancel || error.isUnauthorized) return false;
    if (error.code === ERROR_CODE_NETWORK || error.code === ERROR_CODE_TIMEOUT) return true;
    const status = error.response?.status ?? 0;
    return status >= 500;
  }

  /**
   * 核心请求方法
   * @returns 默认返回业务 data；raw=true 时返回 { code, data, message }
   */
  async request<T = unknown>(config: RequestOptions): Promise<T> {
    const { retry = 0, retryDelay = 300 } = config;
    let lastError: unknown;

    for (let attempt = 0; attempt <= retry; attempt += 1) {
      try {
        const response = await this.instance.request<ResponseResult<T>>(config);
        return this.unwrap<T>(response, config);
      } catch (error) {
        lastError = error;
        if (attempt === retry || !this.shouldRetry(error)) break;
        await sleep(retryDelay * (attempt + 1));
      }
    }
    throw lastError;
  }

  get<T = unknown>(url: string, params?: unknown, config: RequestOptions = {}) {
    return this.request<T>({ ...config, url, method: 'GET', params });
  }

  post<T = unknown>(url: string, data?: unknown, config: RequestOptions = {}) {
    return this.request<T>({ ...config, url, method: 'POST', data });
  }

  put<T = unknown>(url: string, data?: unknown, config: RequestOptions = {}) {
    return this.request<T>({ ...config, url, method: 'PUT', data });
  }

  patch<T = unknown>(url: string, data?: unknown, config: RequestOptions = {}) {
    return this.request<T>({ ...config, url, method: 'PATCH', data });
  }

  delete<T = unknown>(url: string, params?: unknown, config: RequestOptions = {}) {
    return this.request<T>({ ...config, url, method: 'DELETE', params });
  }

  /** 上传文件：自动切 multipart，且不走 JSON 序列化 */
  upload<T = unknown>(url: string, file: File | Blob, field = 'file', config: RequestOptions = {}) {
    const formData = new FormData();
    formData.append(field, file);
    return this.request<T>({
      ...config,
      url,
      method: 'POST',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data', ...(config.headers ?? {}) },
    });
  }

  /** 下载二进制文件 */
  async download(url: string, params?: unknown, filename?: string, config: RequestOptions = {}) {
    const res = await this.instance.request<Blob>({
      ...config,
      url,
      method: 'GET',
      params,
      responseType: 'blob',
    });
    const blob = res.data;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename ?? 'download';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  /** 取消所有进行中的请求 */
  cancelAll(reason = '页面切换，取消请求') {
    this.pending.forEach((controller) => controller.abort(reason));
    this.pending.clear();
    this.pendingCount = 0;
    this.hooks.onLoadingChange?.(0);
  }

  /** 取消指定请求 */
  cancel(url: string, method: Method = 'GET') {
    const key = `${method.toUpperCase()}|${url}|{}|{}`;
    this.pending.get(key)?.abort();
    this.pending.delete(key);
  }
}
