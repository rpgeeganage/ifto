import 'mocha';
import * as should from 'should';
import { Ifto, start } from '../lib/';

describe('Ifto', () => {
  it('should attach to global object', () => {
    const globalObject = {};
    start(globalObject as any);
    should(globalObject)
      .have.property('Ifto')
      .instanceOf(Ifto);
  });
});
