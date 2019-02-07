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
   * Original Get method from http request
   *
   * @static
   * @memberof SpyHttp
   */
  static originalGet?: (arg1: any, arg2: any, cb: (...a: any) => void) => {};

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
    SpyHttp.originalGet = undefined;
  }

  /**
   * Start logging
   *
   * @memberof SpyHttp
   */
  static start() {
    SpyHttp.stop();
    SpyHttp.originalRequest = http.request;
    SpyHttp.originalGet = http.get;
    http.request = SpyHttp.proxyRequest;
    http.get = SpyHttp.proxyGet;
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

    if (SpyHttp.originalGet) {
      http.get = SpyHttp.originalGet;
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
  static proxyRequest(
    urlOrOptions: any,
    options: any,
    cb: (...args: any) => {}
  ) {
    if (!SpyHttp.originalRequest) {
      throw new Error(
        'Unable locate the preserved request method from http module'
      );
    }

    const id = SpyHttp.addLogEntry(urlOrOptions);
    const clientRequest = SpyHttp.originalRequest(
      urlOrOptions,
      options,
      cb
    ) as any;

    return SpyHttp.proxyFinish(id, clientRequest);
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
  static proxyGet(urlOrOptions: any, options: any, cb: (...args: any) => {}) {
    if (!SpyHttp.originalGet) {
      throw new Error(
        'Unable locate the preserved Get method from http module'
      );
    }

    const id = SpyHttp.addLogEntry(urlOrOptions);

    const clientRequest = SpyHttp.originalGet(urlOrOptions, options, cb) as any;

    return SpyHttp.proxyFinish(id, clientRequest);
  }

  /**
   * Add a new log entry and return the id of the log
   *
   * @static
   * @param {*} urlOrOptions
   * @returns
   * @memberof SpyHttp
   */
  static addLogEntry(urlOrOptions: any) {
    const id = getId();
    if (typeof urlOrOptions === 'string') {
      SpyHttp.logs.add(id, urlOrOptions);
    } else {
      SpyHttp.logs.add(id, urlOrOptions.href);
    }

    return id;
  }

  /**
   * Proxy finish method for Http stream
   *
   * @static
   * @param {string} id
   * @param {*} clientRequest
   * @returns
   * @memberof SpyHttp
   */
  static proxyFinish(id: string, clientRequest: any) {
    const originalFinish = clientRequest._finish;
    clientRequest._finish = () => {
      SpyHttp.logs.remove(id);
      return originalFinish.apply(clientRequest);
    };

    return clientRequest;
  }
}