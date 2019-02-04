import { SizeRestrictedLog } from '../util';
import { Entries } from './base_module';
import { SpyHttp } from './spy_http';

export class Spy {
  constructor(logSize: number) {
    SpyHttp.init(SizeRestrictedLog.getInstance(logSize));
  }

  static getInstance(logSize = 10) {
    return new Spy(logSize);
  }

  start() {
    SpyHttp.start();
  }

  stop() {
    SpyHttp.stop();
  }

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
