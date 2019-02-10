import { Context } from 'aws-lambda';
import { Spy } from './spy_modules';
import { formatedDate } from './util';

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
export const defaults: Options = {
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
  private allowedToMonitor = false;

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
  addLambdaContext(lambdaContext: Context) {
    this.lambdaContext = lambdaContext;

    return this;
  }

  /**
   * Return lambda Context
   *
   * @returns {Context}
   * @memberof Ifto
   */
  getLambdaContext() {
    return this.lambdaContext;
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
   * Get output function
   *
   * @returns {OutputFunction}
   * @memberof Ifto
   */
  getOutputFunction() {
    return this.output;
  }

  /**
   * Get log entries
   *
   * @returns
   * @memberof Ifto
   */
  getLogEntries() {
    return this.logEntries;
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
   * Get value for flushLogsWhenDifferenceLessThanMilliseconds
   *
   * @returns
   * @memberof Ifto
   */
  getFlushLogsWhenDifferenceLessThanMilliseconds() {
    return this.flushLogsWhenDifferenceLessThanMilliseconds;
  }

  /**
   * Attach to Global object
   *
   * @param {ExtendedNodeJsGlobal} globalObject
   * @returns
   * @memberof Ifto
   */
  attach(globalObject: ExtendedNodeJsGlobal) {
    if (!globalObject.Ifto) {
      globalObject.Ifto = this;
    }

    return this;
  }

  /**
   * Indicates whether the monitoring should start or not
   *
   * @returns
   * @memberof Ifto
   */
  isAllowedToMonitor() {
    return this.allowedToMonitor;
  }

  /**
   * Initialize the Ifto process
   *
   * @param {NodeJS.Process} currentProcess
   * @returns
   * @memberof Ifto
   */
  init(params: NodeJS.ProcessEnv) {
    // Initializing the monitoring flag
    const envValue = this.getValueFromProcessEnv(
      params,
      ENV_VAR_MONITORING_START_NAME
    );

    this.allowedToMonitor = !!(
      envValue &&
      envValue.toLocaleLowerCase() === ENV_VAR_MONITORING_START_VALUE
    );

    // Initializing flush time value
    const flushTimeValue = this.getValueFromProcessEnv(
      params,
      ENV_VAR_FLUSH_LOGS_WHEN_DIFFERENCE_LESS_THAN_MILLISECONDS
    );

    if (flushTimeValue) {
      const timeout = parseInt(flushTimeValue as string, 10);
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
  async monitor(handler: Promise<any>): Promise<any> {
    let interval: NodeJS.Timeout | undefined;
    if (this.allowedToMonitor && this.lambdaContext) {
      const spy = Spy.getInstance(10);
      spy.start();
      interval = setInterval(() => {
        spy.stop();
        this.output(
          `${this.getWarningString()}\n${this.logEntries.join(
            '\n'
          )}\n${spy.printEntries()}`
        );
        this.clearMonitoringInterval(interval);
      }, this.lambdaContext.getRemainingTimeInMillis() - this.flushLogsWhenDifferenceLessThanMilliseconds);
    }

    try {
      const result = await handler;
      this.clearMonitoringInterval(interval);

      return result;
    } catch (error) {
      this.clearMonitoringInterval(interval);

      throw error;
    }
  }

  /**
   * Clear
   *
   * @private
   * @param {NodeJS.Timeout} [interval]
   * @memberof Ifto
   */
  private clearMonitoringInterval(interval?: NodeJS.Timeout) {
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
    return `${formatedDate()} ${logArray.length}: ${entry}`;
  }

  /**
   * Get the warning header
   *
   * @private
   * @returns
   * @memberof Ifto
   */
  private getWarningString() {
    return `
Expecting a possible lambda timeout.
Only ${this.flushLogsWhenDifferenceLessThanMilliseconds} milliseconds remaining.
(If this is a false positive error change the value by setting up the environment variable "${ENV_VAR_FLUSH_LOGS_WHEN_DIFFERENCE_LESS_THAN_MILLISECONDS}").
Current log:`;
  }

  /**
   * try to extract lower case or upper case values
   *
   * @private
   * @param {NodeJS.ProcessEnv} params
   * @param {string} valueKey
   * @returns
   * @memberof Ifto
   */
  private getValueFromProcessEnv(params: NodeJS.ProcessEnv, valueKey: string) {
    return params[valueKey] || params[valueKey.toUpperCase()];
  }
}
