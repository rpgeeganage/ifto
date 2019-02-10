import 'mocha';
import * as should from 'should';
import { Spy, SpyHttp } from '../lib/spy_modules';
describe('Ifto', () => {
  describe('Spy Http', () => {
    it('should initialize the modules', () => {
      Spy.getInstance(100);
      should(SpyHttp.logs.size).eql(100);
    });

    it('should accept the default log size', () => {
      Spy.getInstance();
      should(SpyHttp.logs.size).eql(10);
    });
  });
});
