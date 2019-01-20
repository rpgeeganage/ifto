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
