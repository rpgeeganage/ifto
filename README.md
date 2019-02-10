# IFTO - If (Lambda) Timeout
[![License](https://img.shields.io/github/license/rpgeeganage/ifto.svg)](https://img.shields.io/github/license/rpgeeganage/ifto.svg)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/rpgeeganage/ifto.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/rpgeeganage/ifto/context:javascript)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/b9cab5f9a44143c48fd12df6fe1819ee)](https://www.codacy.com/app/rpgeeganage/ifto?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=rpgeeganage/ifto&amp;utm_campaign=Badge_Grade)
[![Codacy Badge](https://api.codacy.com/project/badge/Coverage/b9cab5f9a44143c48fd12df6fe1819ee)](https://www.codacy.com/app/rpgeeganage/ifto?utm_source=github.com&utm_medium=referral&utm_content=rpgeeganage/ifto&utm_campaign=Badge_Coverage)
[![Build Status](https://travis-ci.org/rpgeeganage/ifto.svg?branch=master)](https://travis-ci.org/rpgeeganage/ifto)
[![Known Vulnerabilities](https://snyk.io/test/github/rpgeeganage/ifto/badge.svg?targetFile=package.json)](https://snyk.io/test/github/rpgeeganage/ifto?targetFile=package.json)
[![Maintainability](https://api.codeclimate.com/v1/badges/5a3c79b82c052f0ac4ca/maintainability)](https://codeclimate.com/github/rpgeeganage/ifto/maintainability)

### TypeScript Doc: [https://rpgeeganage.github.io/ifto/doc/](https://rpgeeganage.github.io/ifto/doc/)

The purpose of this module is to work as a debugging tool during a timeout. It is hard to debug when a lambda exit exists with ```Task timed out after 2.00 seconds```.

* One solution is to increase the ```Timeout``` value. Although this fixed the problem (sometimes), there is no guarantee that, a timeout may not occur again until proper debugging has done.

* Another solution is to a use a module like [```Debug```](https://www.npmjs.com/package/debug) and enable logging. The problem is this, will create log entries irrespective of the ```timeout```.

## How is this module work?
This package [calculates](https://github.com/rpgeeganage/ifto#ifto_flush_when) possible ```timeout``` errors using ```getRemainingTimeInMillis()``` provided in the [```Context```](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html) object. [```Context```](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html) is passed during the executing of the lambda as mentioned below.

```ts
async handler(event: SQSEvent, context: Context) {
  ...
}
```

## Configuration

###### (Environment variables)

* **ifto_start** or **IFTO_START**

Please set the ```ifto_start``` as ```true``` in environment variables to allow the monitoring. (Monitoring will not start without setting the value as mentioned.)

* **ifto_flush_when** or **IFTO_FLUSH_WHEN**

This indicates the ```minimum``` number of ```milliseconds``` remaining in ```context.getRemainingTimeInMillis()```, before flushing the logs to the output. (default setting is to write using ```console.log```). See the below.

   (Default value is ***50***)
```
if context.getRemainingTimeInMillis() <= ifto_flush_when then
  flush the logs to standard output
end if
```

## How to use it?
Assume that you lambda is structured as follows.

	index.ts
	lib/handler.ts

##### modifications in ```index.ts```

```ts
/**
 * Just import the Ifto module.
 * This will, create a Ifto in the "global" name space.
 * So other files can use Ifto module without creating a object
 */
import 'Ifto';
import { Context, SQSEvent } from 'aws-lambda';
import { handler } from './lib/handler';

export async function myLambda(event: SQSEvent, context: Context) {
  Ifto
    .addLambdaContext(context) // Add the context module
    .init(process.env); // Add the process.env inorder to read the required configurations.

  // Use Ifto.log() to add log entry
  Ifto
    .log('My lambda execution started.');


  // Use Ifto.monitor() function to start monitoring, if configured properly.
  return Ifto.monitor(
    // Pass the handler function
    handler(event)
  );
}
```

##### modifications in ``lib/handler.ts``

```ts
/**
 * below import statement will required, only if you write individual unit tests for this file
 */
import 'Ifto';
import { SQSEvent } from 'aws-lambda';

/*
 * You don't have to pass the context object here
 */
export async function handler(event: SQSEvent) {
  ...
  Ifto.log('log entry 1');

  ...
  Ifto.log('log entry 2');

  ...
  Ifto.log('log entry 3');

}
```

## Methods
* **Ifto.addLambdaContext(```context```);**

set ```Context``` object passed to the lambda function.
* **Ifto.init(```process.env```);**

Pass the ```process.env``` to read the environment variables defined.
* **Ifto. log(```logMessage```);**

  Adds the log message, so in the case of ```timeout```, this message will be flushed to the standard output.
* **Ifto.monitor(```Promise```);**

Accepts the handler function to in order to monitoring. (This won't change the ```return values``` or ```errors thrown``` buy the handler function).


## Final output - (in case of ```Timeout error```)
```
2019-01-20T11:27:26.578Z    ccbc1d49-3336-47c2-9d49-c1d47ffc23de
Expecting a possible lambda timeout.
Only 50 milliseconds remaining.
(If this is a false positive error, change value by setting up environment variable "ifto_flush_when").
Current log:
2019-0-0T11:27:24.629 0: My lambda execution started.
2019-0-0T11:27:24.919 1: log entry 1
2019-0-0T11:27:24.956 2: log entry 2
2019-0-0T11:27:25.236 3: log entry 3
```

## Spy modules
These modules are used to spy on operations which can take more execution time.
Currently I have added a ```HTTP / HTTPS``` spy module.

### HTTP / HTTPS spy module
This module keeps track and output the ```url``` of any ```http or https request``` which is not complete at the time of flushing the logs.

### Output with spy modules
```
START RequestId: 55ca052e-45ae-49c5-89ef-bd1e5bfb0abf Version: $LATEST
2019-02-10T16:24:45.737Z	55ca052e-45ae-49c5-89ef-bd1e5bfb0abf
Expecting a possible lambda timeout.
Only 50 milliseconds remaining.
(If this is a false positive error change the value by setting up the environment variable "ifto_flush_when").
Current log:
2019-02-10T17:24:43.41 0: Handler entry
2019-02-10T17:24:43.53 1: GarbageCollector getInstance
2019-02-10T17:24:43.54 2: GarbageCollector collect
2019-02-10T17:24:45.35 3: runLong collect

******************
Spied module logs:
******************

http

Possible unfinished HTTP requests
2019-02-10T17:24:45.53 https://ifto-spy-testing.free.beeceptor.com/a-request-which-takes-long-time-to-process-004
2019-02-10T17:24:45.41 https://ifto-spy-testing.free.beeceptor.com/a-request-which-takes-long-time-to-process-003
2019-02-10T17:24:45.40 https://ifto-spy-testing.free.beeceptor.com/a-request-which-takes-long-time-to-process-002
2019-02-10T17:24:45.38 https://ifto-spy-testing.free.beeceptor.com/a-request-which-takes-long-time-to-process-001

END RequestId: 55ca052e-45ae-49c5-89ef-bd1e5bfb0abf
REPORT RequestId: 55ca052e-45ae-49c5-89ef-bd1e5bfb0abf	Duration: 3003.15 ms	Billed Duration: 3000 ms 	Memory Size: 512 MB	Max Memory Used: 226 MB
2019-02-10T16:24:45.789Z 55ca052e-45ae-49c5-89ef-bd1e5bfb0abf Task timed out after 3.00 seconds
```

## Important note
* The default of ```ifto_flush_when``` is ``50`` and it was decided by running couple of lambdas and printing ```context.getRemainingTimeInMillis()``` value. In case of ```false positive``` change this value.
* I haven't run any analysis on ``memory usage``.
* I would thankfull to hear ``thoughts`` and ``bugs``.
