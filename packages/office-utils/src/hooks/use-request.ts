import { useCallback, useEffect, useRef, useState } from 'react';
import { RequestError } from '../request';

/** 判断是否为“请求被取消”（重复请求去重或组件卸载触发） */
function isCancelError(error: unknown): boolean {
  if (error instanceof RequestError) return error.isCancel;
  return (error as { name?: string } | null)?.name === 'CanceledError';
}

export interface UseRequestOptions<T> {
  /** 是否手动触发，默认 false（挂载即请求） */
  manual?: boolean;
  /** 默认参数 */
  defaultParams?: unknown[];
  onSuccess?: (data: T) => void;
  onError?: (error: unknown) => void;
}

export interface UseRequestResult<T, P extends unknown[]> {
  data: T | undefined;
  loading: boolean;
  error: unknown;
  /** 手动触发 */
  run: (...args: P) => Promise<T>;
  /** 用上一次参数重新请求 */
  refresh: () => Promise<T | undefined>;
  setData: (data: T | undefined) => void;
}

/**
 * 轻量请求 hook：负责 loading / data / error 三态
 * 复杂场景可替换为 swr / react-query
 */
export function useRequest<T, P extends unknown[] = unknown[]>(
  service: (...args: P) => Promise<T>,
  options: UseRequestOptions<T> = {},
): UseRequestResult<T, P> {
  const { manual = false, defaultParams, onSuccess, onError } = options;

  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(!manual);
  const [error, setError] = useState<unknown>(null);

  const mounted = useRef(true);
  const serviceRef = useRef(service);
  const lastParams = useRef<P>((defaultParams ?? []) as P);
  const callbacks = useRef({ onSuccess, onError });

  serviceRef.current = service;
  callbacks.current = { onSuccess, onError };

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async (...args: P) => {
    lastParams.current = args;
    setLoading(true);
    try {
      const result = await serviceRef.current(...args);
      if (mounted.current) {
        setData(result);
        setError(null);
        callbacks.current.onSuccess?.(result);
      }
      return result;
    } catch (err) {
      // 请求被取消属于预期行为（重复请求去重 / 页面切换），静默忽略
      if (isCancelError(err)) {
        return undefined as unknown as T;
      }
      if (mounted.current) {
        setError(err);
        callbacks.current.onError?.(err);
      }
      throw err;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => run(...lastParams.current), [run]);

  useEffect(() => {
    if (!manual) {
      void run(...((defaultParams ?? []) as P));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, loading, error, run, refresh, setData };
}

export default useRequest;
