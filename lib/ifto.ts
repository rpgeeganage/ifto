import { Context } from 'aws-lambda';

/**
 * Function signature of the expected output function
 */
export type OutputFunction = (...arg: any[]) => void;

/**
 * Environment variable to indicate monitoring should start
 */
export const ENV_VAR_MONITORING_START_NAME = 'ifto_start';

/**
 * Environment variable to enable to disable monitoring
 */
export const ENV_VAR_MONITORING_START_VALUE = 'true';

/**
 * Environment variable to configure "flushLogsWhenDifferenceLessThanMilliseconds"
 */
export const ENV_VAR_FLUSH_LOGS_WHEN_DIFFERENCE_LESS_THAN_MILLISECONDS =
  'ifto_flush_when';

/**
 * Extended Global variable.
 * Holds the Ifto instance
 * @export
 * @interface ExtendedNodeJsGlobal
 * @extends {NodeJS.Global}
 */
export interface ExtendedNodeJsGlobal extends NodeJS.Global {
  Ifto?: Ifto;
}

/**
 * Option interface
 *
 * @interface Options
 */
interface Options {
  flushLogsWhenDifferenceLessThanMilliseconds: number;
  output: OutputFunction;
}

/**
 * Default options
 */
const defaults: Options = {
  flushLogsWhenDifferenceLessThanMilliseconds: 50,
  output: console.log
};

/**
 * If lambda Timeout (Ifto) main class.
 *
 * @export
 * @class Ifto
 */
export class Ifto {
  /**
   * flag indicates monitoring should enable or not
   *
   * @private
   * @memberof Ifto
   */
  private readyMonitor = false;

  /**
   * Holds the log entries
   *
   * @private
   * @type {string[]}
   * @memberof Ifto
   */
  private logEntries: string[] = [];

  /**
   * This holds minimum time difference (in milliseconds) value to flush the logs.
   *
   * Lambda context contains 'getRemainingTimeInMillis()' function which give how many milliseconds
   * left for execution. flushLogsWhenDifferenceLessThanMilliseconds defines minimum milliseconds left,
   * before flushing logs.
   * Eg:
   * if (context.getRemainingTimeInMillis() <= flushLogsWhenDifferenceLessThanMilliseconds) {
   *  flush the logs
   * }
   * 
   * @private
   * @type {number}
   * @memberof Ifto
   */
  private flushLogsWhenDifferenceLessThanMilliseconds: number;

  /**
   * Holds the output function
   *
   * @private
   * @type {OutputFunction}
   * @memberof Ifto
   */
  private output: OutputFunction;

  /**
   * Holds the lambda Context object
   *
   * @private
   * @type {Context}
   * @memberof Ifto
   */
  private lambdaContext?: Context;

  /**
   * Creates an instance of Ifto.
   * @memberof Ifto
   */
  constructor() {
    this.flushLogsWhenDifferenceLessThanMilliseconds =
      defaults.flushLogsWhenDifferenceLessThanMilliseconds;
    this.output = defaults.output;
  }

  /**
   * Get instance of Ifto
   *
   * @static
   * @returns {Ifto}
   * @memberof Ifto
   */
  static getInstance(): Ifto {
    return new Ifto();
  }

  /**
   * Add Lambda function context
   *
   * @param {Context} lambdaContext
   * @returns
   * @memberof Ifto
   */
  addContext(lambdaContext: Context) {
    this.lambdaContext = lambdaContext;

    return this;
  }

  /**
   * Update output function
   *
   * @param {OutputFunction} output
   * @returns
   * @memberof Ifto
   */
  updateOutputFunction(output: OutputFunction) {
    this.output = output;

    return this;
  }

  /**
   * Attach to Global object
   *
   * @param {ExtendedNodeJsGlobal} globalObject
   * @returns
   * @memberof Ifto
   */
  attachToGlobal(globalObject: ExtendedNodeJsGlobal) {
    if (!globalObject.Ifto) {
      globalObject.Ifto = this;
    }

    return this;
  }

  /**
   * Initialize the Ifto process
   *
   * @param {NodeJS.Process} currentProcess
   * @returns
   * @memberof Ifto
   */
  init(currentProcess: NodeJS.Process) {
    const envValue = currentProcess.env[ENV_VAR_MONITORING_START_NAME];
    this.readyMonitor = !!(
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

  /**
   * Start monitoring
   *
   * @param {Promise<any>} executor
   * @returns
   * @memberof Ifto
   */
  monitor(executor: Promise<any>) {
    return new Promise((resolve, reject) => {
      let interval: NodeJS.Timeout;
      if (this.readyMonitor && this.lambdaContext) {
        interval = setInterval(() => {
          this.output(this.logEntries.join('\n'));
        }, this.lambdaContext.getRemainingTimeInMillis() - this.flushLogsWhenDifferenceLessThanMilliseconds);
      }

      executor
        .then((data: any) => {
          this.monitoringLogging(interval);

          return resolve(data);
        })
        .catch((err) => {
          this.monitoringLogging(interval);

          return reject(err);
        });
    });
  }

  /**
   * Log data
   *
   * @param {string} entry
   * @returns
   * @memberof Ifto
   */
  log(entry: string) {
    this.logEntries.push(this.getLogEntry(this.logEntries, entry));

    return this;
  }

  /**
   * Clear
   *
   * @private
   * @param {NodeJS.Timeout} [interval]
   * @memberof Ifto
   */
  private monitoringLogging(interval?: NodeJS.Timeout) {
    if (interval) {
      clearInterval(interval);
    }
  }

  /**
   * Get formated log entry
   *
   * @private
   * @param {string[]} logArray
   * @param {string} entry
   * @returns
   * @memberof Ifto
   */
  private getLogEntry(logArray: string[], entry: string) {
    const date = this.getTime();
    return `${date.y}-${date.mon}-${date.d}T${date.h}:${date.m}:${date.s}.${
      date.ms
    } ${logArray.length}: ${entry}`;
  }

  /**
   * Get time value
   *
   * @private
   * @returns { y: number, mon: number, d: number, h: number, m: number, s: number, ms: number}
    }
   * @memberof Ifto
   */
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
