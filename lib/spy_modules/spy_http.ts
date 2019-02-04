import { SizeRestrictedLog, getId } from '../util';
import { BaseModule, Entries } from './base_module';

const http = require('http');

export class SpyHttp extends BaseModule {
  /**
   * Logs from http call
   *
   * @static
   * @type {SizeRestrictedLog}
   * @memberof SpyHttp
   */
  static logs: SizeRestrictedLog;

  /**
   * Original Request method from http request
   *
   * @static
   * @memberof SpyHttp
   */
  static originalRequest?: (
    arg1: any,
    arg2: any,
    cb: (...a: any) => void
  ) => {};

  /**
   * Get instance of Spy
   *
   * @static
   * @param {number} logSize
   * @returns
   * @memberof SpyHttp
   */
  static init(logs: SizeRestrictedLog) {
    SpyHttp.logs = logs;
    SpyHttp.stop();
    SpyHttp.originalRequest = undefined;
  }

  /**
   * Start logging
   *
   * @memberof SpyHttp
   */
  static start() {
    SpyHttp.originalRequest = http.request;
    http.request = SpyHttp.request;
  }

  /**
   * Stop logging
   *
   * @memberof SpyHttp
   */
  static stop() {
    if (SpyHttp.originalRequest) {
      http.request = SpyHttp.originalRequest;
    }
  }

  /**
   * Get entries
   *
   * @returns {Entries}
   * @memberof SpyHttp
   */
  static getEntries(): Entries {
    return {
      module: 'http',
      remark: SpyHttp.getRemark(),
      log: SpyHttp.logs
    };
  }

  /**
   * Get remark string
   *
   * @returns
   * @memberof SpyHttp
   */
  static getRemark() {
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
  static request(urlOrOptions: any, options: any, cb: (...args: any) => {}) {
    if (!SpyHttp.originalRequest) {
      throw new Error(
        'Unable locate the preserved request method from http module'
      );
    }

    const id = getId();
    if (typeof urlOrOptions === 'string') {
      SpyHttp.logs.add(id, urlOrOptions);
    } else {
      SpyHttp.logs.add(id, urlOrOptions.href);
    }

    const clientRequest = SpyHttp.originalRequest(
      urlOrOptions,
      options,
      cb
    ) as any;

    // Backing up the original finish request
    const originalFinish = clientRequest._finish;
    clientRequest._finish = () => {
      SpyHttp.logs.remove(id);
      return originalFinish.apply(clientRequest);
    };

    return clientRequest;
  }
}
