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

  it('should not override global object', () => {
    const dummyIfto = Object.create({ test: 1 });
    const globalObject = {
      Ifto: dummyIfto
    };
    start(globalObject as any);
    should(globalObject)
      .have.property('Ifto')
      .deepEqual(dummyIfto);
  });
});
