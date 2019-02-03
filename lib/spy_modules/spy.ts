import { BaseModule } from './base_module';
import { SpyHttp } from './spy_http';

export class Spy {
  private spies: BaseModule[] = [];
  constructor(logSize: number) {
    this.spies.push(SpyHttp.getInstance(logSize));
  }

  static getInstance(logSize = 10) {
    return new Spy(logSize);
  }

  start() {
    this.spies.forEach((s: BaseModule) => {
      s.start();
    });
  }

  stop() {
    this.spies.forEach((s: BaseModule) => {
      s.stop();
    });
  }

  printEntries(): string {
    return this.spies
      .map((s: BaseModule) => {
        const entries = s.getEntries();
        return `
      ******************
      Spied module logs:
      ******************
      ${entries.module}

      ${entries.remark}
      ${entries.log.toString()}
      `;
      })
      .join('');
  }
}
