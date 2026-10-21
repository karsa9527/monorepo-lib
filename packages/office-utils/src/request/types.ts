import type { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

/** 后端统一响应体：{ code, data, message } */
export interface ResponseResult<T = unknown> {
  code: number;
  data: T;
  message: string;
}

/** 单次请求可配置的扩展项（在 axios config 之上扩展） */
export interface RequestOptions extends AxiosRequestConfig {
  /** 是否自动携带 token，默认 true */
  withToken?: boolean;
  /** 自定义 token，优先级高于全局 getToken */
  token?: string;
  /** 业务失败 / 网络异常时是否自动弹出错误提示，默认 true */
  showError?: boolean;
  /** 成功时是否自动弹出提示 */
  showSuccess?: boolean;
  successMessage?: string;
  /** 是否自动取消重复的未完成请求（同 method + url + 参数），默认 true */
  cancelDuplicate?: boolean;
  /** 网络异常自动重试次数，默认 0 */
  retry?: number;
  /** 重试基础间隔(ms)，实际按 1x/2x/3x 递增，默认 300 */
  retryDelay?: number;
  /** 是否返回完整响应体（含 code/message），默认 false，直接返回 data */
  raw?: boolean;
  /** 是否计入全局请求中计数，默认 true */
  loading?: boolean;
  /** 透传的元数据，可在拦截器 / hooks 中读取 */
  meta?: Record<string, unknown>;
}

/** 拦截器内部使用的合并类型 */
export type InternalRequestConfig<D = unknown> = InternalAxiosRequestConfig<D> &
  RequestOptions & {
    /** 内部：去重 key */
    __dedupeKey?: string;
    /** 内部：当前重试次数 */
    __retryCount?: number;
  };

/** HTTP 方法简写 */
export type Method =
  | 'get'
  | 'GET'
  | 'delete'
  | 'DELETE'
  | 'head'
  | 'HEAD'
  | 'options'
  | 'OPTIONS'
  | 'post'
  | 'POST'
  | 'put'
  | 'PUT'
  | 'patch'
  | 'PATCH';

export type { AxiosRequestConfig, AxiosResponse };
