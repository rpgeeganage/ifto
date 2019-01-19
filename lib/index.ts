import { Ifto } from './ifto';
export function IftoProcess() {
  const ifTo = Ifto.getInstance();
  ifTo.attachToGlobal(global);
}
