import type { AxiosResponse } from 'axios';
import type { RequestOptions, ResponseResult } from './types';

/** 请求被主动取消 */
export const ERROR_CODE_CANCEL = -1;
/** 网络中断 / 无法连接 */
export const ERROR_CODE_NETWORK = -2;
/** 请求超时 */
export const ERROR_CODE_TIMEOUT = -3;
/** 未登录或登录态失效 */
export const ERROR_CODE_UNAUTHORIZED = 401;

export const STATUS_MESSAGE: Record<number, string> = {
  400: '请求参数错误',
  401: '登录状态已失效，请重新登录',
  403: '没有权限访问该资源',
  404: '请求的资源不存在',
  405: '请求方法不被允许',
  408: '请求超时',
  409: '资源冲突',
  422: '参数校验未通过',
  429: '操作过于频繁，请稍后再试',
  500: '服务器开小差了，请稍后重试',
  502: '网关异常',
  503: '服务暂时不可用',
  504: '网关超时',
};

/** 统一的请求错误对象，携带业务码与原始响应 */
export class RequestError extends Error {
  /** 业务码 / HTTP 状态码，网络异常时为负数常量 */
  readonly code: number;
  /** 原始响应 */
  readonly response?: AxiosResponse<ResponseResult>;
  /** 请求配置 */
  readonly config?: RequestOptions;
  /** 后端响应体 */
  readonly result?: ResponseResult;

  constructor(
    message: string,
    code: number,
    response?: AxiosResponse<ResponseResult>,
    config?: RequestOptions,
  ) {
    super(message);
    this.name = 'RequestError';
    this.code = code;
    this.response = response;
    this.config = config;
    this.result = response?.data;
  }

  get isCancel(): boolean {
    return this.code === ERROR_CODE_CANCEL;
  }

  get isUnauthorized(): boolean {
    return this.code === ERROR_CODE_UNAUTHORIZED;
  }
}
