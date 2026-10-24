// Enabled only in the upload package. Observe input without consuming it.
export const STANDALONE_INPUT_HINT = false;
const installations = new WeakMap();

export function installInputHint(host = window) {
  if (!STANDALONE_INPUT_HINT) return () => {};
  if (installations.has(host)) return installations.get(host);
  const root = host.document.documentElement;
  const hint = host.document.querySelector('#input-hint');
  if (!root || !hint) return () => {};
  const options = {capture:true, passive:true};
  let listening = false;
  function dismiss() {
    hint.hidden = true;
    if (listening) {
      for (const [name, callback] of listeners) root.removeEventListener(name, callback, options);
      listening = false;
    }
  }
  function pointer(event) {
    if (event.pointerType === 'mouse' || event.pointerType === 'pen') dismiss();
  }
  function press(event) {
    if (['mouse', 'pen', 'touch'].includes(event.pointerType)) dismiss();
  }
  const listeners = [
    ['pointerenter', pointer], ['pointerover', pointer], ['pointermove', pointer],
    ['pointerdown', press], ['keydown', dismiss]
  ];
  // Retain this installation after dismissal, including across game restarts.
  // A reload creates a new window/module and can display the prompt again.
  installations.set(host, dismiss);
  if (host.matchMedia?.('(hover: hover) and (pointer: fine)').matches && root.matches(':hover')) {
    dismiss();
    return dismiss;
  }
  hint.hidden = false;
  listening = true;
  for (const [name, callback] of listeners) root.addEventListener(name, callback, options);
  return dismiss;
}
