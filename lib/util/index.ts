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
    mon: (date.getUTCMonth() + 1).toString().padStart(2, '0'),
    d: date
      .getUTCDate()
      .toString()
      .padStart(2, '0'),
    h: (date.getUTCHours() + 1).toString().padStart(2, '0'),
    m: date
      .getUTCMinutes()
      .toString()
      .padStart(2, '0'),
    s: date
      .getUTCSeconds()
      .toString()
      .padStart(2, '0'),
    ms: date.getUTCMilliseconds()
  };
}
