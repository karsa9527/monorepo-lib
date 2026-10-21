/**
 * 环境变量与运行环境判定
 *
 * 读取 Vite 注入的 import.meta.env，但对「非 Vite 宿主」做降级：
 * 发布成 npm 包后可能被 webpack / Node / SSR 消费，那里没有 import.meta.env，
 * 直接取属性会在模块加载阶段抛 TypeError，因此统一走 safeEnv 兜底。
 */

/** 安全读取 import.meta.env：任何异常都退回空对象，最终拿到默认值 */
function safeEnv(): Record<string, string | undefined> {
  try {
    const meta = import.meta as ImportMeta & {
      env?: Record<string, string | number | boolean | undefined>;
    };
    const raw = meta.env;
    if (!raw || typeof raw !== 'object') return {};
    return raw as Record<string, string | undefined>;
  } catch {
    return {};
  }
}

const rawEnv = safeEnv();

function pick<T extends string = string>(key: string, fallback: T): T {
  const value = rawEnv[key];
  return (value === undefined || value === '' ? fallback : value) as T;
}

export const env = {
  get BASE_URL() {
    return pick('VITE_API_BASE_URL', '/api');
  },
  get TIMEOUT() {
    return Number(pick('VITE_REQUEST_TIMEOUT', '15000'));
  },
  get APP_TITLE() {
    return pick('VITE_APP_TITLE', '后台管理系统');
  },
  get USE_MOCK() {
    return pick<string>('VITE_USE_MOCK', 'false') === 'true';
  },
  get ROUTER_MODE(): 'hash' | 'browser' {
    return pick<'hash' | 'browser'>('VITE_ROUTER_MODE', 'hash');
  },
  get MODE(): string {
    return pick<string>('MODE', 'development');
  },
  get isDev() {
    return this.MODE === 'development' || this.MODE === 'dev';
  },
  get isProd() {
    return this.MODE === 'production';
  },
  /** 是否为浏览器环境（SSR 安全） */
  get isBrowser() {
    return typeof window !== 'undefined';
  },
};

export default env;
