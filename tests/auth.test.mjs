import test from 'node:test';
import assert from 'node:assert/strict';
import { authProfileName, createGoogleSignIn } from '../src/auth.js';

test('provider profile names stay within Rules bounds without cutting Unicode characters', () => {
  assert.equal(authProfileName({ displayName: '  Mai  ' }), 'Mai');
  assert.equal(authProfileName({ displayName: '  ', email: 'owner@example.invalid' }), 'owner');
  assert.equal(authProfileName({ displayName: null }), 'Người dùng');
  assert.equal(authProfileName({ displayName: '🐠'.repeat(50) }), '🐠'.repeat(40));
  assert.equal(authProfileName({ displayName: 'a'.repeat(79) + '🐠' }), 'a'.repeat(79));
});

function harness() {
  const events = [];
  let resolvePopup, rejectPopup, resolveSession;
  const auth = {};
  const login = createGoogleSignIn({ auth, authSdk: {
    GoogleAuthProvider: class { setCustomParameters(params) { events.push(['parameters', params]); } },
    signInWithPopup(actualAuth) {
      assert.equal(actualAuth, auth);
      events.push('popup');
      return new Promise((resolve, reject) => { resolvePopup = resolve; rejectPopup = reject; });
    },
    getAdditionalUserInfo: result => ({ isNewUser: result.newUser }),
  }, awaitSession: user => {
    events.push(['session', user.uid]);
    return new Promise(resolve => { resolveSession = resolve; });
  } });
  return { login, events, popup: value => resolvePopup(value), fail: error => rejectPopup(error), session: () => resolveSession() };
}

test('Google opens synchronously and completes only after the correct owner session is initialized', async () => {
  const h = harness();
  const result = h.login();
  assert.equal(h.events.at(-1), 'popup');
  let settled = false;
  result.then(() => { settled = true; });
  h.popup({ user: { uid: 'google-owner' }, newUser: true });
  await Promise.resolve();
  assert.deepEqual(h.events.at(-1), ['session', 'google-owner']);
  assert.equal(settled, false);
  h.session();
  assert.deepEqual(await result, { isNewUser: true });
});

test('duplicate clicks do not create another popup; cancellation permits a fresh attempt', async () => {
  const h = harness();
  const first = h.login();
  await assert.rejects(h.login(), { code: 'auth/cancelled-popup-request' });
  assert.equal(h.events.filter(x => x === 'popup').length, 1);
  h.fail(Object.assign(new Error(), { code: 'auth/popup-closed-by-user' }));
  await assert.rejects(first, { code: 'auth/popup-closed-by-user' });
  const retry = h.login();
  h.popup({ user: { uid: 'existing-owner' }, newUser: false });
  await Promise.resolve();
  h.session();
  assert.deepEqual(await retry, { isNewUser: false });
});

test('a failed owner session never reports successful Google login or retries authentication', async () => {
  let attempts = 0;
  const login = createGoogleSignIn({ auth: {}, authSdk: {
    GoogleAuthProvider: class { setCustomParameters() {} },
    signInWithPopup() { attempts++; return Promise.resolve({ user: { uid: 'denied-owner' } }); },
    getAdditionalUserInfo() { throw new Error('must not reach success'); },
  }, awaitSession: () => Promise.reject(new Error('Database denied')) });
  await assert.rejects(login(), /Database denied/);
  assert.equal(attempts, 1);
});
