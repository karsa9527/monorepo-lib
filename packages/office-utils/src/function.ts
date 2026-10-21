/** 函数工具：防抖 / 节流 / 重试 / 睡眠 / 单次执行 */

export interface DebounceOptions {
  /** 首次是否立即执行 */
  immediate?: boolean;
}

export interface Debounced<T extends (...args: never[]) => unknown> {
  (...args: Parameters<T>): ReturnType<T> | undefined;
  cancel: () => void;
  flush: () => ReturnType<T> | undefined;
}

/** 防抖：停止触发 wait ms 后执行 */
export function debounce<T extends (...args: never[]) => unknown>(
  fn: T,
  wait = 300,
  options: DebounceOptions = {},
): Debounced<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const invoke = () => {
    if (!lastArgs) return undefined;
    const args = lastArgs;
    lastArgs = null;
    return fn(...args) as ReturnType<T>;
  };

  const debounced = ((...args: Parameters<T>) => {
    lastArgs = args;
    if (timer) clearTimeout(timer);
    if (options.immediate && timer === null) {
      const result = invoke();
      timer = setTimeout(() => {
        timer = null;
      }, wait);
      return result;
    }
    timer = setTimeout(() => {
      timer = null;
      invoke();
    }, wait);
    return undefined;
  }) as Debounced<T>;

  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    lastArgs = null;
  };
  debounced.flush = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    return invoke();
  };
  return debounced;
}

/** 节流：wait ms 内最多执行一次 */
export function throttle<T extends (...args: never[]) => unknown>(
  fn: T,
  wait = 300,
  options: { leading?: boolean; trailing?: boolean } = {},
): Debounced<T> {
  const { leading = true, trailing = true } = options;
  let lastTime = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const invoke = (args: Parameters<T>) => {
    lastTime = Date.now();
    return fn(...args) as ReturnType<T>;
  };

  const throttled = ((...args: Parameters<T>) => {
    const now = Date.now();
    const remain = wait - (now - lastTime);
    lastArgs = args;
    if (remain <= 0 || remain > wait) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      return leading ? invoke(args) : undefined;
    }
    if (!timer && trailing) {
      timer = setTimeout(() => {
        timer = null;
        if (lastArgs) invoke(lastArgs);
      }, remain);
    }
    return undefined;
  }) as Debounced<T>;

  throttled.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    lastArgs = null;
    lastTime = 0;
  };
  throttled.flush = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    return lastArgs ? invoke(lastArgs) : undefined;
  };
  return throttled;
}

/** 睡眠 */
export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** 异步重试 */
export async function retry<T>(task: () => Promise<T>, times = 3, delay = 500): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < times; i += 1) {
    try {
      return await task();
    } catch (err) {
      lastError = err;
      if (i < times - 1 && delay > 0) await sleep(delay * (i + 1));
    }
  }
  throw lastError;
}

/** 只执行一次 */
export function once<T extends (...args: never[]) => unknown>(fn: T): T {
  let called = false;
  let result: unknown;
  return ((...args: Parameters<T>) => {
    if (!called) {
      called = true;
      result = fn(...args);
    }
    return result;
  }) as T;
}

/** 串行执行 promise 工厂 */
export async function sequential<T>(tasks: Array<() => Promise<T>>): Promise<T[]> {
  const results: T[] = [];
  for (const task of tasks) {
    results.push(await task());
  }
  return results;
}

/** 安全的 JSON 解析 */
export function safeJsonParse<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

/** 捕获异常并返回 [err, data]，避免 try/catch 嵌套 */
export async function to<T, E = Error>(promise: Promise<T>): Promise<[E | null, T | undefined]> {
  try {
    const data = await promise;
    return [null, data];
  } catch (err) {
    return [err as E, undefined];
  }
}
