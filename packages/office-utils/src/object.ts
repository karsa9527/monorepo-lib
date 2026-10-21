/** 对象 / 数组通用工具 */

/** 深拷贝（结构化克隆优先，回退 JSON） */
export function deepClone<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value);
    } catch {
      /* 存在函数等不可克隆值时回退 */
    }
  }
  if (value === null || typeof value !== 'object') return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

/** 深合并：后者覆盖前者，对象递归 */
export function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target } as Record<string, unknown>;
  Object.keys(source ?? {}).forEach((key) => {
    const sv = (source as Record<string, unknown>)[key];
    const tv = result[key];
    if (
      sv &&
      tv &&
      typeof sv === 'object' &&
      typeof tv === 'object' &&
      !Array.isArray(sv) &&
      !Array.isArray(tv)
    ) {
      result[key] = deepMerge(tv as Record<string, unknown>, sv as Record<string, unknown>);
    } else if (sv !== undefined) {
      result[key] = sv;
    }
  });
  return result as T;
}

/** 移除对象中的空值（undefined / null / ''），常用于查询参数 */
export function omitEmpty<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (value !== undefined && value !== null && value !== '') {
      result[key as keyof T] = value as T[keyof T];
    }
  });
  return result;
}

/** 剔除指定字段 */
export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((k) => delete result[k]);
  return result as Omit<T, K>;
}

/** 只保留指定字段 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach((k) => {
    if (k in obj) result[k] = obj[k];
  });
  return result;
}

/** 按 key 取值，支持 'a.b.c' 路径 */
export function get<T = unknown>(obj: unknown, path: string, defaultValue?: T): T | undefined {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return (current === undefined ? defaultValue : current) as T | undefined;
}

/** 数组去重：支持基础类型与按 key 去重 */
export function unique<T>(arr: T[], key?: keyof T): T[] {
  if (!key) return Array.from(new Set(arr));
  const seen = new Set<unknown>();
  return arr.filter((item) => {
    const k = item?.[key];
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** 数组分组 */
export function groupBy<T, K extends keyof T>(arr: T[], key: K): Record<string, T[]> {
  return arr.reduce(
    (acc, item) => {
      const k = String(item?.[key]);
      (acc[k] ??= []).push(item);
      return acc;
    },
    {} as Record<string, T[]>,
  );
}

/** 数组转字典 */
export function toMap<T, K extends keyof T>(arr: T[], key: K): Map<T[K], T> {
  return new Map(arr.map((item) => [item[key], item]));
}

/** 数组分块 */
export function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

/** 求和 */
export function sum<T>(arr: T[], selector?: (item: T) => number): number {
  return arr.reduce((acc, item) => {
    const v = selector ? selector(item) : item;
    return acc + (typeof v === 'number' ? v : Number(v) || 0);
  }, 0);
}

/** 排序（不改变原数组） */
export function sortBy<T>(
  arr: T[],
  selector: (item: T) => number | string,
  order: 'asc' | 'desc' = 'asc',
): T[] {
  return [...arr].sort((a, b) => {
    const va = selector(a);
    const vb = selector(b);
    if (va === vb) return 0;
    const flag = va > vb ? 1 : -1;
    return order === 'asc' ? flag : -flag;
  });
}
