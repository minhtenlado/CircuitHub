import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deviceOnline, sensorValue, canControl, commandState, validateTank, validateConfig, validateCommand, DEFAULT_CONFIG,
} from '../src/policy.js';

const now = 1_790_000_000_000;
const system = () => ({
  config: structuredClone(DEFAULT_CONFIG), reported: { lastSeen: now, sensors: {
    waterTemperature: { valid: true, value: 26.4, updatedAt: now },
  } },
});

test('Firebase connectivity cannot substitute for a live device and reliable server clock', () => {
  const state = { mode: 'live', user: { uid: 'owner' }, connected: true, serverOffset: 0 };
  assert.equal(canControl(state, system(), now), true);
  assert.equal(canControl({ ...state, connected: false }, system(), now), false);
  assert.equal(canControl({ ...state, serverOffset: null }, system(), now), false);
  assert.equal(canControl({ ...state, user: null }, system(), now), false);
  assert.equal(canControl(state, { reported: { lastSeen: now - 30_001 } }, now), false);
  assert.equal(canControl(state, { reported: { lastSeen: now + 1 } }, now), false);
  assert.equal(deviceOnline({ reported: { lastSeen: now - 30_000 } }, now), true);
  assert.equal(deviceOnline({ reported: { lastSeen: now + 5001 } }, now), false);
});

test('invalid, stale, absent, or out-of-range sensor readings never appear as real measurements', () => {
  assert.equal(sensorValue(system(), 'waterTemperature', now), 26.4);
  for (const reading of [
    { valid: false, value: 0, updatedAt: now }, { valid: true, updatedAt: now },
    { valid: true, value: NaN, updatedAt: now }, { valid: true, value: -127, updatedAt: now },
    { valid: true, value: 26, updatedAt: now - 60_001 }, { valid: true, value: 26, updatedAt: now + 5001 },
  ]) {
    const value = system(); value.reported.sensors.waterTemperature = reading;
    assert.equal(sensorValue(value, 'waterTemperature', now), null);
  }
  const offline = system(); offline.reported.lastSeen = now - 30_001;
  assert.equal(sensorValue(offline, 'waterTemperature', now), null);
  assert.equal(sensorValue(system(), 'unrecognizedSensor', now), null);
});

test('only applied ACK confirms completion; transport failure and local expiry remain uncertain', () => {
  const command = { createdAt: now, expiresAt: now + 15_000, clientStatus: 'sending' };
  assert.equal(commandState(command, null, now).status, 'sending');
  assert.equal(commandState(command, { status: 'accepted' }, now).pending, true);
  assert.equal(commandState({ ...command, clientStatus: 'unknown' }, null, now).pending, true);
  assert.equal(commandState(command, null, now + 15_000).status, 'unknown');
  assert.equal(commandState(command, { status: 'applied' }, now + 20_000).status, 'applied');
  assert.equal(commandState(command, { status: 'expired' }, now).status, 'expired');
  assert.equal(commandState(command, { status: 'error' }, now).status, 'error');
});

test('execution can complete after command TTL without creating another command', () => {
  const command = { createdAt: now, expiresAt: now + 15_000 };
  const ack = { status: 'executing', processedAt: now + 14_000 };
  assert.equal(commandState(command, ack, now + 16_000).pending, true);
  assert.equal(commandState(command, ack, now + 24_000).status, 'unknown');
  assert.equal(commandState(command, { status: 'applied' }, now + 25_000).status, 'applied');
});

test('servo and buzzer inputs respect hardware configuration and integer limits', () => {
  assert.deepEqual(validateCommand('servo', 10, system()), { angle: 10 });
  assert.deepEqual(validateCommand('buzzer', 100, system()), { durationMs: 100 });
  for (const value of [9, 171, 90.5, NaN]) assert.throws(() => validateCommand('servo', value, system()));
  for (const value of [99, 5001, 100.5]) assert.throws(() => validateCommand('buzzer', value, system()));
  assert.throws(() => validateCommand('servo', 90, {}));
  assert.throws(() => validateCommand('unknown', 90, system()));
});

test('metadata and configuration validation reject non-finite numbers and inverted ranges', () => {
  assert.deepEqual(validateTank({ name: ' Bể nhỏ ', location: ' Phòng khách ', volumeLiters: 45 }),
    { name: 'Bể nhỏ', location: 'Phòng khách', volumeLiters: 45 });
  assert.throws(() => validateTank({ name: 'Bể', volumeLiters: Infinity }));
  assert.throws(() => validateTank({ name: ' ', volumeLiters: 45 }));
  assert.deepEqual(validateConfig(DEFAULT_CONFIG), DEFAULT_CONFIG);
  assert.throws(() => validateConfig({ ...DEFAULT_CONFIG, servo: { minAngle: 170, maxAngle: 10 } }));
  assert.throws(() => validateConfig({ ...DEFAULT_CONFIG, thresholds: { ...DEFAULT_CONFIG.thresholds, maxTds: NaN } }));
});
