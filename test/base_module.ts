import 'mocha';
import * as should from 'should';
import { BaseModule } from '../lib/spy_modules/base_module';

describe('Ifto', () => {
  describe('BaseModule', () => {
    it('should throw error on start', () => {
      should(() => BaseModule.start()).throw('write your own implementation');
    });

    it('should throw error on stop', () => {
      should(() => BaseModule.stop()).throw('write your own implementation');
    });

    it('should throw error on getRemark', () => {
      should(() => BaseModule.getRemark()).throw(
        'write your own implementation'
      );
    });

    it('should throw error on getEntries', () => {
      should(() => BaseModule.getEntries()).throw(
        'write your own implementation'
      );
    });
  });
});
