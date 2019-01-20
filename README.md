# IFTO - If (Lambda) Timeout
The purpose of this module is to work as a debugging tool during a timeout. It is hard to debug when a lambda exit exists with ```Task timed out after 2.00 seconds```.

* One solution is to increase the ```Timout``` value. Although this fixed the problem (sometimes), there is no guarantee that, a timeout may not occur again until proper debugging has done.

* Another solution is to a use a module like [```Debug```](https://www.npmjs.com/package/debug) and enable logging. The problem is this, will create log entries irrespective of the ```timeout```.

## How is this module work?
This package is designed to manage ```timeout``` errors using ```getRemainingTimeInMillis()``` provided in the [```Context```](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html) object. [```Context```](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html) is passed during the executing of the lambda as mentioned below.
```ts
async handler(event: SQSEvent, context: Context) {
  ...
}
```
## Configuration
###### (Environment variables)
* #### ifto_start
    Please set the ```ifto_start``` as ```true``` in environment variables to allow the monitoring. (Monitoring will not start without setting the value as mentioned.)
* #### ifto_flush_when
    This indicates the ```minimum``` number of ```milliseconds``` remaining in ```context.getRemainingTimeInMillis()```, before flushing the logs to the output. (default setting is to write using ```console.log```). See the below.

   (Default value is ***50***)
```
if context.getRemainingTimeInMillis() <= ifto_flush_when then
  flush the logs to standard output
end if
```
## How to use it?
Assume that you lambda is structured as follows.

```o
|-- index.ts
`-- lib
    `-- handler.ts
```
* ##### modifications in ```index.ts```
```index.ts``` contains the expose the ```handler``` function.
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
* ##### modifications in ```lib/handler.ts```
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
* #### Ifto.addLambdaContext(```context```);
  set ```Context``` object passed to the lambda function.
* #### Ifto.init(```process.env```);
  Pass the ```process.env``` to read the environment variables defined.
* #### Ifto. log(```logMessage```);
  Adds the log message, so in the case of ```timeout```, this message will be flushed to the standard output.
* #### Ifto.monitor(```Promise```);
  Accepts the handler function to in order to monitoring. (This won't change the ```return values``` or ```errors thrown``` buy the handler function)

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
## Important note
* The default of ```ifto_flush_when``` is ``50`` and it was decided by running couple of lambdas and printing ```context.getRemainingTimeInMillis()``` value. In case of ```false positive``` change this value.
* I haven't run any analysis on ``memory usage``.
* I would thankfull to hear ``thoughts`` and ``bugs``.
