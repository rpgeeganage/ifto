import { SizeRestrictedLog, getId } from '../util';
import { BaseModule, Entries } from './base_module';

const http = require('http');
const https = require('https');

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
  static originalRequest?: (...args: any[]) => {};

  /**
   * Original Request method from https request
   *
   * @static
   * @memberof SpyHttp
   */
  static originalRequestSecure?: (...args: any[]) => {};

  /**
   * Original Get method from http request
   *
   * @static
   * @memberof SpyHttp
   */
  static originalGet?: (...args: any[]) => {};

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
    SpyHttp.originalRequestSecure = undefined;
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
    SpyHttp.originalRequestSecure = https.request;
    SpyHttp.originalGet = http.get;

    http.request = SpyHttp.proxyRequest;
    https.request = SpyHttp.proxyHttpsRequest;
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

    if (SpyHttp.originalRequestSecure) {
      https.request = SpyHttp.originalRequestSecure;
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
  static proxyRequest(...args: any[]) {
    if (!SpyHttp.originalRequest) {
      throw new Error(
        'Unable locate the preserved request method from http module'
      );
    }

    const clientRequest = SpyHttp.originalRequest(
      ...SpyHttp.getMockedRequestArgs(...args)
    );

    return SpyHttp.handleClientRequest(args[0], clientRequest);
  }

  /**
   * Proxy https request method
   * @private
   * @param {*} arg1
   * @param {*} arg2
   * @param {(a: any) => {}} cb
   * @returns
   * @memberof SpyHttp
   */
  static proxyHttpsRequest(...args: any[]) {
    if (!SpyHttp.originalRequestSecure) {
      throw new Error(
        'Unable locate the preserved request method from https module'
      );
    }

    return SpyHttp.originalRequestSecure(...args);
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
  static proxyGet(...args: any[]) {
    if (!SpyHttp.originalGet) {
      throw new Error(
        'Unable locate the preserved Get method from http module'
      );
    }

    return SpyHttp.originalGet(...SpyHttp.getMockedRequestArgs(...args));
  }

  /**
   * Get Modified arguments with fake cb
   *
   * @static
   * @param {...any[]} args
   * @returns
   * @memberof SpyHttp
   */
  static getMockedRequestArgs(...args: any[]) {
    if (args.length === 1) {
      return args;
    }
    const urlOrOptions = args[0];
    const id = SpyHttp.addLogEntry(urlOrOptions);
    const cb = args[args.length - 1];

    const fakeCb = (err: any, res: any, body: any) => {
      const currentId = id;
      SpyHttp.logs.remove(currentId);
      return cb(err, res, body);
    };

    args[args.length - 1] = fakeCb;

    return args;
  }

  /**
   * Handles http stream
   *
   * @static
   * @param {*} urlOrOptions
   * @param {*} clientRequest
   * @returns
   * @memberof SpyHttp
   */
  static handleClientRequest(urlOrOptions: any, clientRequest: any) {
    const id = SpyHttp.addLogEntry(urlOrOptions);

    clientRequest.on('response', () => {
      const currentId = id;
      SpyHttp.logs.remove(currentId);
    });

    clientRequest.on('error', (error: any) => {
      const currentId = id;
      SpyHttp.logs.remove(currentId);
    });

    return clientRequest;
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
    } else if (urlOrOptions.href) {
      SpyHttp.logs.add(id, urlOrOptions.href);
    } else {
      const url = `${urlOrOptions.protocol}//${urlOrOptions.hostname}${
        urlOrOptions.port ? ':' + urlOrOptions.port : ''
      }${urlOrOptions.path}`;
      SpyHttp.logs.add(id, url);
    }

    return id;
  }
}
