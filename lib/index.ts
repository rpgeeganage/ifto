import { Ifto } from './ifto';

/**
 * New declaration of the Global variable with Ifto instance
 */
declare global {
  const Ifto: Ifto;
}

/**
 * Export Ifto class and interface
 */
export * from './ifto';

/**
 * Start Ifto. Attach to global object
 *
 * @export
 * @param {NodeJS.Global} globalObject
 */
export function start(globalObject: NodeJS.Global) {
  const ifTo = Ifto.getInstance();
  ifTo.attachToGlobal(globalObject);
}

/**
 * Start the Ifto
*/
start(global);
