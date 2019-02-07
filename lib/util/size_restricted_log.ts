import { formatedDate } from '../util';
export interface LogEntry {
  key: string;
  value: string;
  [k: string]: string;
}
/**
 * Log which can hold maximum of given size. rotates if exceeded.
 *
 * @export
 * @class SizeRestrictedLog
 */
export class SizeRestrictedLog {
  /**
   * log entries
   *
   * @private
   * @type {string[]}
   * @memberof SizeRestrictedLog
   */
  private log: LogEntry[] = [];

  /**
   * Creates an instance of SizeRestrictedLog.
   * @param {number} size
   * @memberof SizeRestrictedLog
   */
  constructor(public readonly size: number) {}

  /**
   * Get an instance of SizeRestrictedLog
   *
   * @static
   * @param {number} size
   * @returns {SizeRestrictedLog}
   * @memberof SizeRestrictedLog
   */
  static getInstance(size: number): SizeRestrictedLog {
    return new SizeRestrictedLog(size);
  }

  /**
   * Insert entry to the log
   *
   * @param {string} entry
   * @memberof SizeRestrictedLog
   */
  add(key: string, entry: string) {
    this.purge();
    this.log.push({
      key: key,
      value: `${formatedDate()} ${entry}`
    });
  }

  /**
   * Remove given key from the log
   *
   * @param {string} key
   * @memberof SizeRestrictedLog
   */
  remove(key: string) {
    this.log = this.log.filter((l: LogEntry) => l.key !== key);
  }

  /**
   * Get stringified version of log
   *
   * @returns
   * @memberof SizeRestrictedLog
   */
  toString() {
    return this.log
      .reverse()
      .map((l: LogEntry) => {
        return l.value;
      })
      .join('\n');
  }

  /**
   * Get log JSON format
   *
   * @returns
   * @memberof SizeRestrictedLog
   */
  toJSON() {
    return this.log.reverse().map((l: LogEntry) => {
      return l.value;
    });
  }

  /**
   * Get log entries
   *
   * @returns {LogEntry[]}
   * @memberof SizeRestrictedLog
   */
  getLogEntries(): LogEntry[] {
    return this.log;
  }
  /**
   * Purge the log
   *
   * @private
   * @memberof SizeRestrictedLog
   */
  private purge() {
    if (this.log.length >= this.size) {
      this.log.shift();
    }
  }
}
