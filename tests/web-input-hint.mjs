// DOM API fixtures only: no browser, network, engine state or focus changes.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const source = await fs.readFile(new URL('../web/input-hint.mjs', import.meta.url), 'utf8');
const flag = 'export const STANDALONE_INPUT_HINT = false;';
assert.equal(source.split(flag).length, 2, 'The upload-packager flag must remain explicit and unique');
async function moduleFor(enabled) {
  const code = source.replace(flag, `export const STANDALONE_INPUT_HINT = ${enabled};`);
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
}
const disabled = await moduleFor(false), enabled = await moduleFor(true);
let checks = 0;
function check(value, message) { checks++; assert(value, message); }
function fixture({fine = true, hovered = false} = {}) {
  const listeners = new Map(), events = [];
  const hint = {hidden:true};
  let queries = 0, mediaQueries = 0;
  const root = {
    matches(selector) { assert.equal(selector, ':hover'); return hovered; },
    addEventListener(name, callback, options) {
      assert.deepEqual(options, {capture:true,passive:true});
      assert(!listeners.has(name), `Duplicate listener: ${name}`);
      listeners.set(name, {callback,options});
      events.push(['add',name]);
    },
    removeEventListener(name, callback, options) {
      const listener = listeners.get(name);
      assert.equal(listener.callback, callback);
      assert.equal(listener.options, options);
      listeners.delete(name);
      events.push(['remove',name]);
    }
  };
  const host = {
    document:{documentElement:root,querySelector(selector) { queries++; assert.equal(selector, '#input-hint'); return hint; }},
    matchMedia(query) { mediaQueries++; assert.equal(query, '(hover: hover) and (pointer: fine)'); return {matches:fine}; },
    focus() { throw Error('The hint must not force focus'); },
    get localStorage() { throw Error('Dismissal belongs only to the current page'); }
  };
  function dispatch(name, pointerType) {
    listeners.get(name)?.callback({pointerType,
      preventDefault() { throw Error('The hint must not consume input'); },
      stopPropagation() { throw Error('The hint must not stop propagation'); }
    });
  }
  return {host,hint,listeners,events,dispatch,queries:()=>queries,mediaQueries:()=>mediaQueries};
}
const off = fixture();
disabled.installInputHint(off.host)();
check(off.hint.hidden && off.listeners.size === 0 && off.queries() === 0 && off.mediaQueries() === 0, 'Disabled Pages flag touched the hint or installed listeners');
const alreadyInside = fixture({hovered:true});
enabled.installInputHint(alreadyInside.host);
check(alreadyInside.hint.hidden && alreadyInside.listeners.size === 0 && alreadyInside.events.length === 0, 'Pointer already inside showed the prompt or added listeners');
for (const pointerType of ['mouse','pen']) for (const event of ['pointerenter','pointerover','pointermove']) {
  const f = fixture();
  const cleanup = enabled.installInputHint(f.host);
  check(!f.hint.hidden && f.listeners.size === 5, 'Enabled prompt did not appear while waiting for input');
  f.dispatch(event, pointerType);
  check(f.hint.hidden && f.listeners.size === 0 && f.events.filter(([action]) => action === 'remove').length === 5, `${pointerType} ${event} did not dismiss and remove all listeners`);
  f.dispatch('pointerenter', pointerType);
  check(enabled.installInputHint(f.host) === cleanup && f.hint.hidden && f.listeners.size === 0, 'A second event or install displayed the prompt again');
  cleanup();
  check(f.events.length === 10, 'Repeated cleanup removed listeners twice');
}
const touch = fixture({fine:false,hovered:true});
enabled.installInputHint(touch.host);
check(!touch.hint.hidden, 'Touch hover incorrectly suppressed the initial prompt');
touch.dispatch('pointerenter','touch'); touch.dispatch('pointerover','touch'); touch.dispatch('pointermove','touch');
check(!touch.hint.hidden && touch.listeners.size === 5, 'Touch hover/movement dismissed before the first tap');
touch.dispatch('pointerdown','touch');
check(touch.hint.hidden && touch.listeners.size === 0, 'First touch did not dismiss without consuming the tap');
for (const pointerType of ['mouse', 'pen']) {
  const click = fixture();
  delete click.host.matchMedia;
  enabled.installInputHint(click.host);
  check(!click.hint.hidden, 'Missing hover detection prevented the prompt from appearing');
  click.dispatch('pointerdown', pointerType);
  check(click.hint.hidden && click.listeners.size === 0, `${pointerType} click without earlier movement did not dismiss the prompt`);
}
const keyboard = fixture();
enabled.installInputHint(keyboard.host);
keyboard.dispatch('keydown');
check(keyboard.hint.hidden && keyboard.listeners.size === 0, 'Keyboard access did not dismiss the prompt');
const explicit = fixture();
const cleanup = enabled.installInputHint(explicit.host);
cleanup();
check(explicit.hint.hidden && explicit.listeners.size === 0, 'Explicit cleanup left an overlay or input listeners');
const noHint = fixture();
noHint.host.document.querySelector = () => null;
enabled.installInputHint(noHint.host)();
check(noHint.listeners.size === 0, 'A shell without the optional overlay installed listeners');
console.log(JSON.stringify({suite:'web-input-hint',checks,status:'passed',verification:'DOM API fixtures; no browser or network'}));
