import { SizeRestrictedLog, getId } from '../util';
import { BaseModule, Entries } from './base_module';

const http = require('http');

export class SpyHttp extends BaseModule {
  /**
   * Logs from http call
   *
   * @private
   * @type {SizeRestrictedLog}
   * @memberof SpyHttp
   */
  private logs: SizeRestrictedLog;

  /**
   * Original Request method from http request
   *
   * @private
   * @memberof SpyHttp
   */
  private originalRequest?: (arg1: any, arg2: any, cb: (a: any) => {}) => {};

  /**
   * Creates an instance of SpyHttp.
   * @param {number} logSize
   * @memberof SpyHttp
   */
  constructor(logSize: number) {
    super();
    this.logs = SizeRestrictedLog.getInstance(logSize);
  }

  /**
   * Get instance of Spy
   *
   * @static
   * @param {number} logSize
   * @returns
   * @memberof SpyHttp
   */
  static getInstance(logSize: number) {
    return new SpyHttp(logSize);
  }

  /**
   * Start logging
   *
   * @memberof SpyHttp
   */
  start() {
    this.originalRequest = http.request;
    http.request = this.request;
  }

  /**
   * Stop logging
   *
   * @memberof SpyHttp
   */
  stop() {
    if (this.originalRequest) {
      http.request = this.originalRequest;
    }
  }

  /**
   * Get entries
   *
   * @returns {Entries}
   * @memberof SpyHttp
   */
  getEntries(): Entries {
    return {
      module: 'http',
      remark: this.getRemark(),
      log: this.logs
    };
  }

  /**
   * Get remark string
   *
   * @returns
   * @memberof SpyHttp
   */
  getRemark() {
    return 'Possible unfinished HTTP requests';
  }

  /**
   * Proxy request method
   *
   * function request(options: RequestOptions | string | URL, callback?: (res: IncomingMessage) => void): ClientRequest;
   * function request(url: string | URL, options: RequestOptions, callback?: (res: IncomingMessage) => void): ClientRequest;
   * @private
   * @param {*} arg1
   * @param {*} arg2
   * @param {(a: any) => {}} cb
   * @returns
   * @memberof SpyHttp
   */
  private request(urlOrOptions: any, options: any, cb: (a: any) => {}) {
    if (!this.originalRequest) {
      throw new Error(
        'Unable locate the preserved request method from http module'
      );
    }

    const id = getId();
    if (typeof urlOrOptions === 'string') {
      this.logs.add(id, urlOrOptions);
    } else {
      this.logs.add(id, urlOrOptions.href);
    }

    return this.originalRequest(urlOrOptions, options, (...args) => {
      this.logs.remove(id);
      return cb(...args);
    });
  }
}
