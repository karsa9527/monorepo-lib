/** 常用校验规则 */

export const RULES = {
  phone: /^1[3-9]\d{9}$/,
  email: /^[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(?:\.[\w-]+)+$/,
  idCard: /(^\d{15}$)|(^\d{18}$)|(^\d{17}([\dXx])$)/,
  /** 不含中文、空格 */
  username: /^[a-zA-Z0-9_-]{3,20}$/,
  /** 6-20 位，必须同时包含字母与数字 */
  password: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&._-]{6,20}$/,
  /** 正数（含小数） */
  positiveNumber: /^\d+(\.\d+)?$/,
  /** 整数 */
  integer: /^-?\d+$/,
  /** URL */
  url: /^https?:\/\/[\w-]+(\.[\w-]+)+([\w\-.,@?^=%&:/~+#]*)?$/,
  /** 中文 */
  chinese: /^[\u4e00-\u9fa5]+$/,
  /** IPv4 */
  ipv4: /^((25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)$/,
  /** 车牌号（含新能源） */
  licensePlate:
    /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z][A-Z][A-Z0-9]{4,5}[A-Z0-9挂学警港澳]$/,
} as const;

export type RuleName = keyof typeof RULES;

const validators: Record<string, (v: string) => boolean> = {
  required: (v) => v !== undefined && v !== null && String(v).trim() !== '',
  phone: (v) => RULES.phone.test(v),
  email: (v) => RULES.email.test(v),
  idCard: (v) => RULES.idCard.test(v),
  username: (v) => RULES.username.test(v),
  password: (v) => RULES.password.test(v),
  positiveNumber: (v) => RULES.positiveNumber.test(v),
  integer: (v) => RULES.integer.test(v),
  url: (v) => RULES.url.test(v),
  chinese: (v) => RULES.chinese.test(v),
  ipv4: (v) => RULES.ipv4.test(v),
  licensePlate: (v) => RULES.licensePlate.test(v),
  number: (v) => v !== '' && !Number.isNaN(Number(v)),
};

/** 单项校验 */
export function validate(value: unknown, rule: RuleName | 'required' | 'number'): boolean {
  const fn = validators[rule];
  if (!fn) throw new Error(`未知的校验规则: ${rule}`);
  return fn(value === undefined || value === null ? '' : String(value));
}

/** 组合校验：全部通过返回 true */
export function validateAll(
  value: unknown,
  rules: Array<RuleName | 'required' | 'number'>,
): boolean {
  return rules.every((rule) => validate(value, rule));
}

/** 手机号 */
export const isPhone = (v: string) => validators.phone(v);
/** 邮箱 */
export const isEmail = (v: string) => validators.email(v);
/** 身份证 */
export const isIdCard = (v: string) => validators.idCard(v);
/** 强密码 */
export const isStrongPassword = (v: string) => validators.password(v);
/** 密码强度：0~4 */
export function passwordStrength(v: string): number {
  let score = 0;
  if (v.length >= 8) score += 1;
  if (/[a-z]/.test(v) && /[A-Z]/.test(v)) score += 1;
  if (/\d/.test(v)) score += 1;
  if (/[^A-Za-z0-9]/.test(v)) score += 1;
  return score;
}
