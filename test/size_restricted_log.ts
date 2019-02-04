import 'mocha';
import * as should from 'should';
import * as sinon from 'sinon';
import { SizeRestrictedLog } from '../lib/util';

describe('Ifto', () => {
  describe('SizeRestrictedLog', () => {
    it('should get an instance', () => {
      should(SizeRestrictedLog.getInstance(5)).instanceOf(SizeRestrictedLog);
    });

    it('should only holds given number of entries', () => {
      const log = SizeRestrictedLog.getInstance(5);
      for (let i = 0; i < 100; i++) {
        log.add(`k-${i}`, `v-${i}`);
      }
      const logEntries = log.getLogEntries();
      should(logEntries)
        .instanceOf(Array)
        .and.not.empty();
      should(logEntries).size(5);
      should(logEntries[0]).have.property('key');
      should(logEntries[0]).have.property('value');
    });

    it('should remove from key', () => {
      const log = SizeRestrictedLog.getInstance(4);
      log.add('k-1', 'v-1');
      log.add('k-2', 'v-2');
      log.add('k-3', 'v-3');
      log.add('k-4', 'v-4');

      log.remove('k-2');
      const logEntries = log.getLogEntries();
      should(logEntries).size(3);
      should(logEntries[0].key).eql('k-1');
      should(logEntries[1].key).eql('k-3');
      should(logEntries[2].key).eql('k-4');
    });

    it('should not remove from key, if key is not set', () => {
      const log = SizeRestrictedLog.getInstance(4);
      log.add('k-1', 'v-1');
      log.add('k-2', 'v-2');
      log.add('k-3', 'v-3');
      log.add('k-4', 'v-4');

      log.remove('k-100');
      const logEntries = log.getLogEntries();
      should(logEntries).size(4);
      should(logEntries[0].key).eql('k-1');
      should(logEntries[1].key).eql('k-2');
      should(logEntries[2].key).eql('k-3');
      should(logEntries[3].key).eql('k-4');
    });

    it('should build the log with time stamp', () => {
      sinon.useFakeTimers(new Date(1547963625847));
      const log = SizeRestrictedLog.getInstance(2);
      log.add('k-1', 'v-1');
      log.add('k-2', 'v-2');

      const logEntries = log.getLogEntries();
      should(logEntries).deepEqual([
        { key: 'k-1', value: '2019-0-0T5:53:45.847 v-1' },
        { key: 'k-2', value: '2019-0-0T5:53:45.847 v-2' }
      ]);
      sinon.restore();
    });

    it('should convert to string properly', () => {
      sinon.useFakeTimers(new Date(1547963625847));
      const log = SizeRestrictedLog.getInstance(2);
      log.add('k-1', 'v-1');
      log.add('k-2', 'v-2');
      should(log.toString()).eql(
        `2019-0-0T5:53:45.847 v-2\n2019-0-0T5:53:45.847 v-1`
      );
      sinon.restore();
    });

    it('should convert to JSON properly', () => {
      sinon.useFakeTimers(new Date(1547963625847));
      const log = SizeRestrictedLog.getInstance(2);
      log.add('k-1', 'v-1');
      log.add('k-2', 'v-2');
      should(log.toJSON()).deepEqual([
        '2019-0-0T5:53:45.847 v-2',
        '2019-0-0T5:53:45.847 v-1'
      ]);
      sinon.restore();
    });
  });
});
