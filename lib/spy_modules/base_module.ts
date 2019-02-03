import { SizeRestrictedLog } from '../util';
export interface Entries {
  module: string;
  remark: string;
  log: SizeRestrictedLog;
}

export abstract class BaseModule {
  abstract start(): void;
  abstract stop(): void;
  abstract getRemark(): string;
  abstract getEntries(): Entries;
}
