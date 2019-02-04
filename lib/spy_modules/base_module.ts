import { SizeRestrictedLog } from '../util';
export interface Entries {
  module: string;
  remark: string;
  log: SizeRestrictedLog;
}

export abstract class BaseModule {
  static start() {
    throw new Error('write your own implementation');
  }
  static stop() {
    throw new Error('write your own implementation');
  }
  static getRemark(): string {
    throw new Error('write your own implementation');
  }
  static getEntries(): Entries {
    throw new Error('write your own implementation');
  }
}
