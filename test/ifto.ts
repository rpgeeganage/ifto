import 'mocha';
import { Ifto } from '../lib/';

describe('Ifto', () => {
  it('should work 1 :)', () => {
    const ifto = Ifto.getInstance();
    ifto.preserve();
    console.log('=====>', 'test');
  });
});
