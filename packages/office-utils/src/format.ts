/** 格式化工具：金额、数字、文件大小、手机号、脱敏等 */
import { isDef, isNumeric } from './is';

/** 千分位：formatNumber(1234567.891, 2) -> '1,234,567.89' */
export function formatNumber(value?: number | string, decimals = 2): string {
  if (!isDef(value) || value === '' || !isNumeric(value)) return '-';
  const num = Number(value);
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** 金额：formatMoney(1234.5) -> '¥1,234.50' */
export function formatMoney(value?: number | string, decimals = 2, symbol = '¥'): string {
  if (!isDef(value) || value === '' || !isNumeric(value)) return `${symbol}0.00`;
  return `${symbol}${formatNumber(value, decimals)}`;
}

/** 紧凑金额：12345678 -> '1.23亿' / '1234.57万' */
export function formatCompactMoney(value?: number | string, symbol = '¥'): string {
  if (!isDef(value) || !isNumeric(value)) return `${symbol}0`;
  const num = Number(value);
  const abs = Math.abs(num);
  if (abs >= 1e8) return `${symbol}${(num / 1e8).toFixed(2)}亿`;
  if (abs >= 1e4) return `${symbol}${(num / 1e4).toFixed(2)}万`;
  return `${symbol}${num.toFixed(2)}`;
}

/** 百分比：formatPercent(0.1234) -> '12.34%' */
export function formatPercent(value?: number | string, decimals = 2): string {
  if (!isDef(value) || !isNumeric(value)) return '-';
  return `${(Number(value) * 100).toFixed(decimals)}%`;
}

/** 文件大小 */
export function formatFileSize(bytes?: number): string {
  if (!isDef(bytes) || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

/** 手机号脱敏：138****8888 */
export function maskPhone(phone?: string): string {
  if (!phone || phone.length < 7) return phone ?? '';
  return phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
}

/** 身份证脱敏 */
export function maskIdCard(id?: string): string {
  if (!id || id.length < 8) return id ?? '';
  return id.replace(/^(.{4}).*(.{4})$/, '$1********$2');
}

/** 邮箱脱敏 */
export function maskEmail(email?: string): string {
  if (!email || !email.includes('@')) return email ?? '';
  const [name, domain] = email.split('@');
  const masked =
    name.length <= 2 ? `${name[0]}*` : `${name[0]}${'*'.repeat(name.length - 2)}${name.slice(-1)}`;
  return `${masked}@${domain}`;
}

/** 通用脱敏：保留头尾 */
export function mask(value?: string, head = 1, tail = 1, maskChar = '*'): string {
  if (!value) return '';
  const len = value.length;
  if (len <= head + tail) return value;
  return `${value.slice(0, head)}${maskChar.repeat(len - head - tail)}${value.slice(len - tail)}`;
}

/** 银行卡每 4 位加空格 */
export function formatBankCard(card?: string): string {
  if (!card) return '';
  return card.replace(/\s/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
}

/** 首字母大写 */
export const capitalize = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1);

/** 驼峰转短横线：userName -> user-name */
export const kebabCase = (str: string): string =>
  str
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');

/** 短横线转驼峰：user-name -> userName */
export const camelCase = (str: string): string =>
  str.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());

/** 生成随机字符串 */
export function randomString(length = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/** 生成 uuid v4 */
export function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  const s = randomString(36);
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-4${s.slice(13, 16)}-${s.slice(16, 20)}-${s.slice(20, 32)}`;
}
