import { SizeRestrictedLog } from '../util';
/**
 * Structure of the entry returned by a spy module
 *
 * @export
 * @interface Entries
 */
export interface Entries {
  module: string;
  remark: string;
  log: SizeRestrictedLog;
}

/****
 * Blue print of the spy. Every spy be inherited from this
 */
export abstract class BaseModule {
  /**
   * Please override the start method in each spy module
   *
   * @static
   * @memberof BaseModule
   */
  static start() {
    throw new Error('write your own implementation');
  }

  /**
   * Please override the stop method in each spy module
   *
   * @static
   * @memberof BaseModule
   */
  static stop() {
    throw new Error('write your own implementation');
  }

  /**
   * Please override the getRemark method in each spy module
   *
   * @static
   * @memberof BaseModule
   */
  static getRemark(): string {
    throw new Error('write your own implementation');
  }

  /**
   * Please override the getEntries method in each spy module
   *
   * @static
   * @memberof BaseModule
   */
  static getEntries(): Entries {
    throw new Error('write your own implementation');
  }
}
