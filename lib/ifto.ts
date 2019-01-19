import { Context } from 'aws-lambda';

export type OutputFunction = (...arg: any[]) => void;
export const ENV_VAR_MONITORING_START_NAME = 'ifto_start';
export const ENV_VAR_MONITORING_START_VALUE = 'true';
export const ENV_VAR_FLUSH_LOGS_WHEN_DIFFERENCE_LESS_THAN_MILLISECONDS =
  'ifto_flush_when';

export interface ExtendedNodeJsGlobal extends NodeJS.Global {
  Ifto?: Ifto;
}

export interface Options {
  flushLogsWhenDifferenceLessThanMilliseconds: number;
  output: OutputFunction;
}

const defaults: Options = {
  flushLogsWhenDifferenceLessThanMilliseconds: 50,
  output: console.log
};

export class Ifto {
  private readyToCache = false;
  private logEntries: string[] = [];
  private flushLogsWhenDifferenceLessThanMilliseconds: number;
  private output: OutputFunction;
  private lambdaContext?: Context;

  constructor() {
    this.flushLogsWhenDifferenceLessThanMilliseconds =
      defaults.flushLogsWhenDifferenceLessThanMilliseconds;
    this.output = defaults.output;
  }

  static getInstance() {
    return new Ifto();
  }

  addContext(lambdaContext: Context) {
    this.lambdaContext = lambdaContext;

    return this;
  }

  updateOutputFunction(output: OutputFunction) {
    this.output = output;

    return this;
  }

  attachToGlobal(globalObject: ExtendedNodeJsGlobal) {
    if (!globalObject.Ifto) {
      globalObject.Ifto = this;
    }

    return this;
  }

  init(currentProcess: NodeJS.Process) {
    const envValue = currentProcess.env[ENV_VAR_MONITORING_START_NAME];
    this.readyToCache = !!(
      envValue &&
      envValue.toLocaleLowerCase() === ENV_VAR_MONITORING_START_VALUE
    );
    if (
      currentProcess.env[
        ENV_VAR_FLUSH_LOGS_WHEN_DIFFERENCE_LESS_THAN_MILLISECONDS
      ]
    ) {
      const timeout = parseInt(
        currentProcess.env[
          ENV_VAR_FLUSH_LOGS_WHEN_DIFFERENCE_LESS_THAN_MILLISECONDS
        ] as string,
        10
      );
      if (!isNaN(timeout)) {
        this.flushLogsWhenDifferenceLessThanMilliseconds = timeout;
      }
    }

    return this;
  }

  monitor(executor: Promise<any>) {
    return new Promise((resolve, reject) => {
      let interval: NodeJS.Timeout;
      if (this.readyToCache && this.lambdaContext) {
        interval = setInterval(() => {
          this.output(this.logEntries.join('\n'));
        }, this.lambdaContext.getRemainingTimeInMillis() - this.flushLogsWhenDifferenceLessThanMilliseconds);
      }

      executor
        .then((data: any) => {
          this.clearLogging(interval);

          return resolve(data);
        })
        .catch((err) => {
          this.clearLogging(interval);

          return reject(err);
        });
    });
  }

  log(entry: string) {
    this.logEntries.push(this.getLogEntry(this.logEntries, entry));

    return this;
  }

  private clearLogging(interval?: NodeJS.Timeout) {
    if (interval) {
      clearInterval(interval);
    }
  }

  private getLogEntry(logArray: string[], entry: string) {
    const date = this.getTime();
    return `${date.y}-${date.mon}-${date.d}T${date.h}:${date.m}:${date.s}.${
      date.ms
    } ${logArray.length}: ${entry}`;
  }

  private getTime() {
    const date = new Date();
    return {
      y: date.getUTCFullYear(),
      mon: date.getUTCMonth(),
      d: date.getUTCDay(),
      h: date.getUTCHours(),
      m: date.getUTCMinutes(),
      s: date.getUTCSeconds(),
      ms: date.getUTCMilliseconds()
    };
  }
}
