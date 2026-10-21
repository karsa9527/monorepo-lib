import { env } from '../env';
import { Request, type RequestHooks, type RequestInstanceOptions } from './request';

export * from './types';
export * from './error';
export { Request, SUCCESS_CODES } from './request';

/**
 * 默认实例配置
 *
 * 走 env 而不是直接读 import.meta.env：本包会以 npm 依赖形式被 webpack / Node / SSR
 * 消费，那里没有 Vite 注入的变量，直接访问会在模块加载阶段就抛错。
 */
const defaultOptions: RequestInstanceOptions = {
  baseURL: env.BASE_URL,
  timeout: env.TIMEOUT,
  withCredentials: false,
};

/** 全局默认实例 */
export const http = new Request(defaultOptions);

/** 供 App 初始化时注入 UI 相关钩子 */
export function setupRequestHooks(hooks: RequestHooks) {
  http.setHooks(hooks);
  return http;
}

/** 创建独立实例（对接第三方接口 / 不同 baseURL） */
export function createRequest(options: RequestInstanceOptions = {}, hooks: RequestHooks = {}) {
  return new Request({ ...defaultOptions, ...options }, hooks);
}
