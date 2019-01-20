import { Ifto } from './ifto';
export interface ExtendedGlobalObject extends NodeJS.Global {
  Ifto?: Ifto;
}

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
 * @param {ExtendedGlobalObject} globalObject
 */
export function start(globalObject: ExtendedGlobalObject) {
  if (!globalObject.Ifto) {
    const ifto = Ifto.getInstance();
    ifto.attach(globalObject);
  }
}

/**
 * Start the Ifto
 */
start(global);
