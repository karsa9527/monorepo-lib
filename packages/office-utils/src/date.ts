/** 日期时间工具（基于 dayjs） */
import dayjs from 'dayjs';
import { isDef } from './is';

export const DATE_FORMAT = 'YYYY-MM-DD';
export const TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

export { dayjs };

/** 格式化：不传 format 默认 YYYY-MM-DD HH:mm:ss */
export function formatDate(
  value?: dayjs.ConfigType,
  format = TIME_FORMAT,
  emptyText = '-',
): string {
  if (!isDef(value) || value === '') return emptyText;
  const d = dayjs(value as dayjs.ConfigType);
  return d.isValid() ? d.format(format) : emptyText;
}

/** 相对时间：3 分钟前 / 2 天前 */
export function fromNow(value?: dayjs.ConfigType): string {
  if (!isDef(value) || value === '') return '-';
  const target = dayjs(value as dayjs.ConfigType);
  if (!target.isValid()) return '-';
  const diff = Date.now() - target.valueOf();
  const abs = Math.abs(diff);
  const suffix = diff >= 0 ? '前' : '后';
  const MINUTE = 60_000;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;

  if (abs < MINUTE) return '刚刚';
  if (abs < HOUR) return `${Math.floor(abs / MINUTE)} 分钟${suffix}`;
  if (abs < DAY) return `${Math.floor(abs / HOUR)} 小时${suffix}`;
  if (abs < 30 * DAY) return `${Math.floor(abs / DAY)} 天${suffix}`;
  if (abs < 365 * DAY) return `${Math.floor(abs / (30 * DAY))} 个月${suffix}`;
  return `${Math.floor(abs / (365 * DAY))} 年${suffix}`;
}

/** 获取起止时间戳（今日/近7天/近30天） */
export function getRange(days: number): [string, string] {
  return [
    dayjs()
      .subtract(days - 1, 'day')
      .startOf('day')
      .format(TIME_FORMAT),
    dayjs().endOf('day').format(TIME_FORMAT),
  ];
}

/** 持续时长格式化（毫秒 -> 01:02:03） */
export function formatDuration(ms?: number): string {
  if (!isDef(ms) || ms < 0) return '-';
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}
