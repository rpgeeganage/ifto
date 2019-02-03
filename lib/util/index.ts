import { randomBytes } from 'crypto';
export * from './size_restricted_log';

/**
 * Generate random Id
 *
 * @export
 * @returns {string}
 */
export function getId(): string {
  return randomBytes(10).toString('hex');
}

/**
 * Get formated date string
 *
 * format returned is: year-month-day T hour:minute:second.milliseconds
 * @export
 * @returns
 */
export function formatedDate() {
  const date = getTime();
  return `${date.y}-${date.mon}-${date.d}T${date.h}:${date.m}:${date.s}.${
    date.ms
  }`;
}

/**
 * Get date time
 *
 * @export
 * @returns
 */
export function getTime() {
  const date = new Date();
  return {
    y: date.getUTCFullYear(),
    mon: date.getUTCMonth(),
    d: date.getUTCDay(),
    h: date.getUTCHours(),
    m: date.getUTCMinutes(),
    s: date.getUTCSeconds(),
    ms: date.getUTCMilliseconds()
  };
}
