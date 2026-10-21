/**
 * 本地存储封装
 * 支持 localStorage / sessionStorage，带命名空间、过期时间与 JSON 序列化
 */
import { isDef, isString } from './is';

type StorageType = 'local' | 'session';

interface SetOptions {
  /** 有效期（毫秒），不传表示永久 */
  ttl?: number;
  /** 存储介质 */
  type?: StorageType;
}

interface StorageItem<T> {
  value: T;
  /** 过期时间戳 */
  expires?: number;
}

function getStorage(type: StorageType = 'local'): Storage {
  const storage = type === 'local' ? window.localStorage : window.sessionStorage;
  if (!storage) {
    throw new Error('当前环境不支持 Web Storage');
  }
  return storage;
}

export class WebStorage {
  private prefix: string;

  constructor(prefix = 'admin:') {
    this.prefix = prefix;
  }

  private key(key: string) {
    return `${this.prefix}${key}`;
  }

  set<T>(key: string, value: T, options: SetOptions = {}) {
    const { ttl, type = 'local' } = options;
    const item: StorageItem<T> = { value };
    if (isDef(ttl) && ttl > 0) item.expires = Date.now() + ttl;
    try {
      getStorage(type).setItem(this.key(key), JSON.stringify(item));
      return true;
    } catch (err) {
      console.error('[storage] set failed', err);
      return false;
    }
  }

  get<T = unknown>(key: string, defaultValue?: T, type: StorageType = 'local'): T | undefined {
    const raw = getStorage(type).getItem(this.key(key));
    if (raw === null) return defaultValue;
    try {
      const item = JSON.parse(raw) as StorageItem<T>;
      if (isDef(item.expires) && Date.now() > item.expires) {
        this.remove(key, type);
        return defaultValue;
      }
      return item.value;
    } catch {
      // 兼容历史数据：非 JSON 结构
      return isString(raw) ? (raw as unknown as T) : defaultValue;
    }
  }

  remove(key: string, type: StorageType = 'local') {
    getStorage(type).removeItem(this.key(key));
  }

  has(key: string, type: StorageType = 'local'): boolean {
    return getStorage(type).getItem(this.key(key)) !== null;
  }

  clear(type?: StorageType) {
    if (type) {
      getStorage(type).clear();
      return;
    }
    getStorage('local').clear();
    getStorage('session').clear();
  }

  /** 读取一次后即删除 */
  take<T = unknown>(key: string, type: StorageType = 'local'): T | undefined {
    const value = this.get<T>(key, undefined, type);
    this.remove(key, type);
    return value;
  }
}

/** 默认实例：localStorage，命名空间 admin: */
export const storage = new WebStorage('admin:');

/** session 级实例 */
export const sessionStorage$ = new WebStorage('admin-session:');

/** token 读写（独立命名空间，避免被 clear 误删） */
const TOKEN_KEY = 'ACCESS_TOKEN';
const REFRESH_KEY = 'REFRESH_TOKEN';

export const tokenStorage = {
  get: () => storage.get<string>(TOKEN_KEY, ''),
  set: (token: string, ttl?: number) => storage.set(TOKEN_KEY, token, { ttl }),
  getRefresh: () => storage.get<string>(REFRESH_KEY, ''),
  setRefresh: (token: string) => storage.set(REFRESH_KEY, token),
  clear: () => {
    storage.remove(TOKEN_KEY);
    storage.remove(REFRESH_KEY);
  },
};
