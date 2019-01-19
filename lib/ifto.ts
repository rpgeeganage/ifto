import { Context } from 'aws-lambda';

type OutputFunction = (...arg: any[]) => void;
export const ENV_VAR_NAME = 'ifto';
export const ENV_VAR_EXPECTED_VALUE = '1';

export interface ExtendedNodeJsGlobal extends NodeJS.Global {
  Ifto?: Ifto;
}

export interface Options {
  flushLogsWhenDifferenceIs: number;
  output: OutputFunction;
}

const defaults: Options = {
  flushLogsWhenDifferenceIs: 50,
  output: console.log
};

export class Ifto {
  private logEntries: string[] = [];
  private flushLogsWhenDifferenceIs: number;
  private output: OutputFunction;
  private lambdaContext?: Context;

  constructor() {
    this.flushLogsWhenDifferenceIs = defaults.flushLogsWhenDifferenceIs;
    this.output = defaults.output;
  }

  static getInstance() {
    return new Ifto();
  }

  addContext(lambdaContext: Context) {
    this.lambdaContext = lambdaContext;
  }

  updateConfigs(options: Partial<Options>) {
    if (options.flushLogsWhenDifferenceIs) {
      this.flushLogsWhenDifferenceIs = options.flushLogsWhenDifferenceIs;
    }

    if (options.output) {
      this.output = options.output;
    }
  }

  attachToGlobal(globalObject: ExtendedNodeJsGlobal) {
    globalObject.Ifto = this;
  }

  log(entry: string) {
    this.logEntries.push(entry);
  }

  start(currentProcess: NodeJS.Process) {
    const envValue = currentProcess.env[ENV_VAR_NAME];
    if (envValue && envValue.toLocaleLowerCase() === ENV_VAR_EXPECTED_VALUE) {
      this.hookIntoProcess(currentProcess);
    }
  }

  private hookIntoProcess(currentProcess: NodeJS.Process) {
    if (!this.lambdaContext) {
      throw new Error('Lambda context is not set');
    }

    if (
      this.lambdaContext.getRemainingTimeInMillis() <=
      this.flushLogsWhenDifferenceIs
    ) {
      this.output(this.logEntries.join(','));
    } else {
      currentProcess.nextTick(() => {
        this.hookIntoProcess(currentProcess);
      });
    }
  }
}
