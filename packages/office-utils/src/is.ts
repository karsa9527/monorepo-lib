/** 类型判断工具集 */

const toString = Object.prototype.toString;

export function is(val: unknown, type: string): boolean {
  return toString.call(val) === `[object ${type}]`;
}

export const isDef = <T = unknown>(val?: T): val is T => val !== undefined && val !== null;
export const isUndef = (val: unknown): val is undefined | null => val === undefined || val === null;

export const isString = (val: unknown): val is string => is(val, 'String');
export const isNumber = (val: unknown): val is number => is(val, 'Number') && !Number.isNaN(val);
export const isBoolean = (val: unknown): val is boolean => is(val, 'Boolean');
export const isFunction = <T extends (...args: never[]) => unknown>(val: unknown): val is T =>
  typeof val === 'function';
export const isObject = (val: unknown): val is Record<string, unknown> =>
  val !== null && is(val, 'Object');
export const isArray = Array.isArray;
export const isDate = (val: unknown): val is Date => is(val, 'Date');
export const isRegExp = (val: unknown): val is RegExp => is(val, 'RegExp');
export const isPromise = <T = unknown>(val: unknown): val is Promise<T> =>
  is(val, 'Promise') || (isObject(val) && isFunction(val.then) && isFunction(val.catch));
export const isSymbol = (val: unknown): val is symbol => is(val, 'Symbol');
export const isBlob = (val: unknown): val is Blob => is(val, 'Blob');
export const isFile = (val: unknown): val is File => is(val, 'File');
export const isFormData = (val: unknown): val is FormData => is(val, 'FormData');
export const isMap = (val: unknown): val is Map<unknown, unknown> => is(val, 'Map');
export const isSet = (val: unknown): val is Set<unknown> => is(val, 'Set');
export const isWindow = (val: unknown): val is Window =>
  typeof window !== 'undefined' && is(val, 'Window');

export const isElement = (val: unknown): val is Element =>
  isDef(val) && typeof HTMLElement !== 'undefined' && val instanceof HTMLElement;

/** 是否为空：undefined / null / 空字符串 / 空数组 / 空对象 / 空 MapSet */
export function isEmpty(val: unknown): boolean {
  if (val === undefined || val === null) return true;
  if (isString(val)) return val.trim().length === 0;
  if (isArray(val)) return val.length === 0;
  if (isMap(val) || isSet(val)) return val.size === 0;
  if (isObject(val)) return Object.keys(val).length === 0;
  return false;
}

/** 是否是外链 */
export function isExternal(path: string): boolean {
  return /^(https?:|mailto:|tel:|\/\/)/.test(path);
}

/** 是否是合法的 http/https 地址 */
export function isUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/** 移动端判定 */
export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|Mobile/i.test(navigator.userAgent);
}

/** 判断值是否为数字字符串 */
export const isNumeric = (val: unknown): boolean =>
  !isUndef(val) &&
  !isArray(val) &&
  !isBoolean(val) &&
  String(val).trim() !== '' &&
  !Number.isNaN(Number(val));
