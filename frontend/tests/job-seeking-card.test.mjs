import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Exercise the actual component callbacks with controlled network completion
// order. Hook/JSX substitutes avoid needing a DOM or a new test dependency.
const source = readFileSync(
  new URL('../src/components/candidate/JobSeekingCard.tsx', import.meta.url),
  'utf8',
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

async function flush() {
  for (let i = 0; i < 12; i++) await Promise.resolve();
}

function harness(visible) {
  const initial = {
    enabled: visible,
    visible,
    canEnable: true,
    profileReady: true,
    visibleUntil: new Date(Date.now() + 86400000).toISOString(),
    packageName: 'Pro',
  };
  const states = [initial, true, false, false, null];
  const refs = [];
  const effects = [];
  const reads = [];
  const writes = [];
  const listeners = new Map();
  let stateIndex = 0,
    refIndex = 0;
  const jsx = (type, props) => ({ type, props });
  const componentModule = { exports: {} };
  const sandbox = {
    module: componentModule,
    exports: componentModule.exports,
    Date,
    Error,
    setTimeout: () => 1,
    clearTimeout: () => {},
    window: {
      addEventListener: (event, callback) => listeners.set(event, callback),
      removeEventListener: (event) => listeners.delete(event),
    },
    require: (name) => {
      if (name === 'react')
        return {
          useState: () => {
            const index = stateIndex++;
            return [
              states[index],
              (value) => {
                states[index] = value;
              },
            ];
          },
          useRef: (value) => {
            const index = refIndex++;
            return (refs[index] ??= { current: value });
          },
          useCallback: (callback) => callback,
          useEffect: (callback) => effects.push(callback),
        };
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === 'next/link') return { default: 'link' };
      if (name === 'lucide-react') return { BriefcaseBusiness: 'icon', Loader2: 'loader' };
      if (name === '@/lib/supabase/client')
        return {
          createClient: () => ({
            auth: { getSession: async () => ({ data: { session: { access_token: 'token' } } }) },
          }),
        };
      if (name === '@/lib/candidate-api')
        return {
          getJobSeekingStatus: () => {
            const request = deferred();
            reads.push(request);
            return request.promise;
          },
          updateJobSeekingStatus: (_token, enabled) => {
            const request = deferred();
            writes.push({ ...request, enabled });
            return request.promise;
          },
        };
      throw new Error(`Unexpected import: ${name}`);
    },
  };
  runInNewContext(compiled, sandbox);
  const tree = componentModule.exports.JobSeekingCard({ onEditProfile: () => {} });
  const cleanup = effects[0]();
  function findSwitch(node) {
    if (Array.isArray(node)) return node.map(findSwitch).find(Boolean);
    if (!node || typeof node !== 'object') return undefined;
    return node.props?.role === 'switch' ? node : findSwitch(node.props?.children);
  }
  return {
    initial,
    reads,
    writes,
    get status() {
      return states[0];
    },
    get saving() {
      return states[3];
    },
    get error() {
      return states[4];
    },
    focus: () => listeners.get('focus')(),
    toggle: () => findSwitch(tree).props.onClick(),
    cleanup,
  };
}

for (const visible of [true, false]) {
  test(`ignores a stale GET after ${visible ? 'disabling' : 'enabling'} sharing`, async () => {
    const h = harness(visible);
    h.focus();
    await flush();
    h.toggle();
    await flush();
    assert.equal(h.writes[0].enabled, !visible);
    h.writes[0].resolve({ ...h.initial, enabled: !visible, visible: !visible });
    await flush();
    h.reads[0].resolve(h.initial);
    await flush();
    assert.equal(h.status.visible, !visible);
    assert.equal(h.saving, false);
  });
}

test('ignores a stale GET error after a successful toggle', async () => {
  const h = harness(true);
  h.focus();
  await flush();
  h.toggle();
  await flush();
  h.writes[0].resolve({ ...h.initial, enabled: false, visible: false });
  await flush();
  h.reads[0].reject(new Error('Old request timed out'));
  await flush();
  assert.equal(h.status.visible, false);
  assert.equal(h.error, null);
});

test('pauses background GETs and duplicate toggles until the mutation settles', async () => {
  const h = harness(true);
  h.toggle();
  await flush();
  h.focus();
  h.toggle();
  await flush();
  assert.equal(h.reads.length, 0);
  assert.equal(h.writes.length, 1);
  h.writes[0].reject(new Error('Save failed'));
  await flush();
  assert.equal(h.saving, false);
  assert.equal(h.error, 'Save failed');
  h.focus();
  await flush();
  assert.equal(h.reads.length, 1);
  h.reads[0].resolve({ ...h.initial, visible: false });
  await flush();
  assert.equal(h.status.visible, false);
  assert.equal(h.error, null);
});

test('keeps the latest background read when GET responses arrive out of order', async () => {
  const h = harness(true);
  h.focus();
  await flush();
  h.focus();
  await flush();
  h.reads[1].resolve({ ...h.initial, visible: false });
  await flush();
  h.reads[0].resolve(h.initial);
  await flush();
  assert.equal(h.status.visible, false);
});

test('discards responses after unmount', async () => {
  const h = harness(true);
  h.focus();
  await flush();
  h.cleanup();
  h.reads[0].resolve({ ...h.initial, visible: false });
  await flush();
  assert.equal(h.status.visible, true);
});
