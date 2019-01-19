import { Ifto } from './ifto';
declare global {
  const Ifto: Ifto;
}
export * from './ifto';
export function start(globalObject: NodeJS.Global) {
  const ifTo = Ifto.getInstance();
  ifTo.attachToGlobal(globalObject);
}

start(global);
