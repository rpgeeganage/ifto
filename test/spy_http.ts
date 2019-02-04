import 'mocha';
import * as req from 'request-promise-native';
import * as should from 'should';
import * as sinon from 'sinon';
import { SpyHttp } from '../lib/spy_modules';
import { SizeRestrictedLog } from '../lib/util';

describe('Ifto', () => {
  describe('Spy Http', () => {
    describe('Log records', () => {
      it('add log the request', async () => {
        const log = sinon.createStubInstance(SizeRestrictedLog);
        SpyHttp.init(log as any);
        SpyHttp.start();
        try {
          await req.get('http://foobar/');
        } catch (err) {}
        const args = log.add.args[0];
        should(log.add.calledOnce).be.true();
        should(args[0]).match(/^\w+$/);
        should(args[1]).eql('http://foobar/');
      });

      it('remove log if request completed', async () => {
        const log = sinon.createStubInstance(SizeRestrictedLog);
        SpyHttp.init(log as any);
        SpyHttp.start();
        try {
          await req.get('http://foobar/');
        } catch (err) {}
        should(log.remove.calledOnce).be.true();
        const addArgs = log.add.args[0];
        const removeArgs = log.remove.args[0];
        should(removeArgs[0]).eql(addArgs[0]);
      });

      it('should extract url from option', async () => {
        const log = sinon.createStubInstance(SizeRestrictedLog);
        SpyHttp.init(log as any);
        SpyHttp.start();
        try {
          await req({
            uri: 'http://foobar/',
            method: 'POST'
          });
        } catch (err) {}
        const args = log.add.args[0];
        should(log.add.calledOnce).be.true();
        should(args[0]).match(/^\w+$/);
        should(args[1]).eql('http://foobar/');
      });

      it('should throw an error if original request is not preserved', async () => {
        const log = sinon.createStubInstance(SizeRestrictedLog);
        SpyHttp.init(log as any);
        SpyHttp.start();
        SpyHttp.originalRequest = undefined;
        should(
          req({
            uri: 'http://foobar/',
            method: 'POST'
          })
        ).rejectedWith(
          'Error: Unable locate the preserved request method from http module'
        );
      });
    });
  });
});
