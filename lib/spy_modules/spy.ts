import { SizeRestrictedLog } from '../util';
import { Entries } from './base_module';
import { SpyHttp } from './spy_http';

/**
 * Main class which handle the spy operations
 *
 * @export
 * @class Spy
 */
export class Spy {
  /**
   * Creates an instance of Spy.
   * @param {number} logSize
   * @memberof Spy
   */
  constructor(readonly logSize: number) {
    SpyHttp.init(SizeRestrictedLog.getInstance(logSize));
  }

  /**
   * Get an instance of spy
   *
   * @static
   * @param {number} [logSize=10]
   * @returns
   * @memberof Spy
   */
  static getInstance(logSize = 10) {
    return new Spy(logSize);
  }

  /**
   * Execute start() in each spy module
   *
   * @memberof Spy
   */
  start() {
    SpyHttp.start();
  }

  /**
   * Execute stop() in each spy  module
   *
   * @memberof Spy
   */
  stop() {
    SpyHttp.stop();
  }

  /**
   * Print the formated logs from each spy
   *
   * @returns {string}
   * @memberof Spy
   */
  printEntries(): string {
    const op = [];
    const entriesSpyHttp = SpyHttp.getEntries();
    op.push(this.buildPrintOutput(entriesSpyHttp));
    return `
  ******************
  Spied module logs:
  ******************
  ${op.join('')}`;
  }

  private buildPrintOutput(entries: Entries) {
    return `
${entries.module}

${entries.remark}
${entries.log.toString()}
`;
  }
}
