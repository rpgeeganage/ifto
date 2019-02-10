import 'mocha';
import * as should from 'should';
import * as sinon from 'sinon';
import {
  ENV_VAR_FLUSH_LOGS_WHEN_DIFFERENCE_LESS_THAN_MILLISECONDS,
  ENV_VAR_MONITORING_START_NAME,
  ENV_VAR_MONITORING_START_VALUE,
  Ifto,
  defaults
} from '../lib/';

describe('Ifto', () => {
  it('return a Ifto instance', () => {
    should(Ifto.getInstance()).be.instanceof(Ifto);
  });

  it('should assign default values', () => {
    const ifto = Ifto.getInstance();
    should(ifto.getOutputFunction()).be.eql(defaults.output);
    should(ifto.getFlushLogsWhenDifferenceLessThanMilliseconds()).be.eql(
      defaults.flushLogsWhenDifferenceLessThanMilliseconds
    );
  });

  describe('Lambda context', () => {
    /**
     * Fixture to generate new lambda context
     *
     * @param {sinon.stub} sub
     * @returns
     */
    function getContext(sub: sinon.SinonStub) {
      return {
        getRemainingTimeInMillis: sub
      };
    }
    it('should add lambda context', () => {
      const stub = sinon.stub();
      const ifto = Ifto.getInstance();
      const lambdaContext = getContext(stub) as any;

      should(ifto.getLambdaContext()).be.undefined();
      ifto.addLambdaContext(lambdaContext);
      should(ifto.getLambdaContext()).not.be.undefined();
      should(ifto.getLambdaContext()).eql(lambdaContext);
    });

    it('should update lambda context', () => {
      const ifto = Ifto.getInstance();
      const newOpFunction = () => {};

      should(ifto.getOutputFunction()).be.eql(defaults.output);
      ifto.updateOutputFunction(newOpFunction);
      should(ifto.getOutputFunction()).be.eql(newOpFunction);
    });
  });

  describe('Attach to global', () => {
    it('should attach to global object', () => {
      const ifto = Ifto.getInstance();
      const globalObject = {};
      ifto.attach(globalObject as any);
      should(globalObject)
        .have.property('Ifto')
        .and.instanceOf(Ifto);
    });

    it('should not attach to global object, if already attached', () => {
      const ifto = Ifto.getInstance();
      const globalObject = {
        Ifto: Object.create({})
      };
      ifto.attach(globalObject as any);
      should(globalObject)
        .have.property('Ifto')
        .and.not.instanceOf(Ifto);
    });
  });

  describe('Log', () => {
    it('should log', () => {
      const ifto = Ifto.getInstance();
      const logEntry = 'test entry';
      should(ifto.getLogEntries())
        .instanceOf(Array)
        .size(0);
      const iftoLog = ifto.log(logEntry).getLogEntries();
      should(iftoLog)
        .instanceOf(Array)
        .size(1);
      should(iftoLog[0]).match(new RegExp(logEntry));
    });

    it('should format log', () => {
      sinon.useFakeTimers(new Date(1547963625847));
      const ifto = Ifto.getInstance();
      const logEntry1 = 'test entry1';
      const logEntry2 = 'test entry2';
      const iftoLog = ifto
        .log(logEntry1)
        .log(logEntry2)
        .getLogEntries();
      should(iftoLog[0]).eql(`2019-01-20T06:53:45.847 0: ${logEntry1}`);
      should(iftoLog[1]).eql(`2019-01-20T06:53:45.847 1: ${logEntry2}`);
      sinon.restore();
    });
  });

  describe('init', () => {
    it('should not be allowed to monitor without providing the parameter', () => {
      const ifto = Ifto.getInstance();
      should(ifto.isAllowedToMonitor()).false();
    });

    it('should allow to monitor when set', () => {
      const ifto = Ifto.getInstance();
      ifto.init({
        [ENV_VAR_MONITORING_START_NAME]: ENV_VAR_MONITORING_START_VALUE
      } as any);

      should(ifto.isAllowedToMonitor()).true();
    });

    it('should not allow to monitor when different value set', () => {
      const ifto = Ifto.getInstance();
      ifto.init({ [ENV_VAR_MONITORING_START_NAME]: 'other' } as any);

      should(ifto.isAllowedToMonitor()).false();
    });

    it('should not update flushLogsWhenDifferenceLessThanMilliseconds if not set', () => {
      const ifto = Ifto.getInstance();
      ifto.init({
        test: '123'
      } as any);

      should(ifto.getFlushLogsWhenDifferenceLessThanMilliseconds()).be.eql(
        defaults.flushLogsWhenDifferenceLessThanMilliseconds
      );
    });

    it('should update flushLogsWhenDifferenceLessThanMilliseconds', () => {
      const ifto = Ifto.getInstance();
      ifto.init({
        [ENV_VAR_FLUSH_LOGS_WHEN_DIFFERENCE_LESS_THAN_MILLISECONDS]: '10'
      } as any);

      should(ifto.getFlushLogsWhenDifferenceLessThanMilliseconds()).be.eql(10);
    });

    it('should not update flushLogsWhenDifferenceLessThanMilliseconds for none numeric values', () => {
      const ifto = Ifto.getInstance();
      ifto.init({
        [ENV_VAR_FLUSH_LOGS_WHEN_DIFFERENCE_LESS_THAN_MILLISECONDS]: 'other'
      } as any);

      should(ifto.getFlushLogsWhenDifferenceLessThanMilliseconds()).be.eql(
        defaults.flushLogsWhenDifferenceLessThanMilliseconds
      );
    });
  });

  describe('monitor', () => {
    function getContext(numberOfMillisecond: number = 100): any {
      return {
        getRemainingTimeInMillis: () => numberOfMillisecond
      };
    }

    it('should not flus log if lambda context is not set', async () => {
      const ifto = Ifto.getInstance();
      const opFunction = sinon.spy();
      ifto.updateOutputFunction(opFunction);
      await ifto.monitor(Promise.resolve('test'));
      should(opFunction.callCount).eql(0);
    });

    it('should not flus log if not allowed', async () => {
      const ifto = Ifto.getInstance();
      const opFunction = sinon.spy();
      ifto.updateOutputFunction(opFunction).addLambdaContext(getContext());
      await ifto.monitor(Promise.resolve('test'));
      should(opFunction.callCount).eql(0);
    });

    it('should not flus log if finished before timeout', async () => {
      const ifto = Ifto.getInstance();
      const opFunction = sinon.spy();
      ifto
        .init({
          [ENV_VAR_MONITORING_START_NAME]: ENV_VAR_MONITORING_START_VALUE
        } as any)
        .updateOutputFunction(opFunction)
        .addLambdaContext(getContext());
      await ifto.monitor(Promise.resolve('test'));
      should(opFunction.callCount).eql(0);
    });

    it('should flus log if finished before timeout', async () => {
      const f = () =>
        new Promise((resolve) => setTimeout(() => resolve('test'), 1000));
      const ifto = Ifto.getInstance();
      const opFunction = sinon.spy();
      ifto
        .init({
          [ENV_VAR_MONITORING_START_NAME]: ENV_VAR_MONITORING_START_VALUE
        } as any)
        .updateOutputFunction(opFunction)
        .addLambdaContext(getContext());
      await ifto.monitor(f());
      should(opFunction.callCount).eql(1);
    });

    describe('Handling handler op', () => {
      it('should return value if success', async () => {
        const returnValue = { test: 1 };
        const f = () =>
          new Promise((resolve) => setTimeout(() => resolve(returnValue), 10));
        const ifto = Ifto.getInstance();
        const opFunction = sinon.spy();
        ifto
          .init({
            [ENV_VAR_MONITORING_START_NAME]: ENV_VAR_MONITORING_START_VALUE
          } as any)
          .updateOutputFunction(opFunction)
          .addLambdaContext(getContext());
        const op = await ifto.monitor(f());
        op.should.deepEqual(returnValue);
      });

      it('should throw value if fails', async () => {
        const error = new Error('error');
        const f = () =>
          new Promise((resolve, reject) => setTimeout(() => reject(error), 10));
        const ifto = Ifto.getInstance();
        const opFunction = sinon.spy();
        ifto
          .init({
            [ENV_VAR_MONITORING_START_NAME]: ENV_VAR_MONITORING_START_VALUE
          } as any)
          .updateOutputFunction(opFunction)
          .addLambdaContext(getContext());
        should(ifto.monitor(f())).rejectedWith(error);
      });
    });
  });
});
