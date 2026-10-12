import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoClient, DEMO_STORAGE_KEY } from '../src/demo.js';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

function harness(storage = memoryStorage()) {
  let time = 1_791_730_900_000;
  let nextId = 0;
  const jobs = new Map();
  const snapshots = [];
  const options = {
    storage,
    now: () => time,
    random: () => 0.34567,
    setTimeout: (fn, delay) => { const id = ++nextId; jobs.set(id, { fn, at: time + delay }); return id; },
    clearTimeout: id => jobs.delete(id),
    setInterval: (fn, delay) => { const id = ++nextId; jobs.set(id, { fn, at: time + delay, interval: delay }); return id; },
    clearInterval: id => jobs.delete(id),
  };
  let latest;
  const onState = state => { latest = state; snapshots.push(state); };
  const client = createDemoClient(onState, options);
  return {
    client, storage, snapshots, options, onState,
    get state() { return latest; },
    get system() { return latest.tanks[0].systems['demo-main']; },
    get pendingTimers() { return jobs.size; },
    advance(duration) {
      const target = time + duration;
      for (;;) {
        const next = [...jobs].filter(([, job]) => job.at <= target).sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
        if (!next) break;
        const [id, job] = next;
        time = job.at;
        if (job.interval) job.at += job.interval;
        else jobs.delete(id);
        job.fn();
      }
      time = target;
    },
  };
}

test('demo starts with fresh bounded sensor records and keeps snapshots isolated', () => {
  const h = harness();
  assert.equal(h.state.mode, 'demo');
  assert.equal(h.state.user.uid, 'demo');
  assert.equal(h.state.tanks.length, 2);
  const originalTimestamp = h.system.reported.sensors.waterTemperature.updatedAt;
  h.state.tanks[0].meta.name = 'Mutated snapshot';
  h.advance(5000);
  assert.equal(h.state.tanks[0].meta.name, 'Bể thủy sinh');
  assert.equal(h.system.reported.lastSeen, h.state.serverNow);
  assert.equal(h.system.reported.sensors.waterTemperature.updatedAt, h.state.serverNow);
  assert.equal(h.system.reported.sensors.waterTemperature.updatedAt - originalTimestamp, 5000);
  assert.ok(h.system.reported.sensors.waterTemperature.value > 26 && h.system.reported.sensors.waterTemperature.value < 28);
  h.client.dispose();
});

test('creating a tank leaves systems empty; explicit topology and profile persist across reload', async () => {
  const h = harness();
  const { tankId } = await h.client.createTank({ name: '  Bể mới  ', location: 'Ban công', volumeLiters: 45 });
  assert.deepEqual(h.state.tanks.find(tank => tank.id === tankId).systems, {});
  const { systemId } = await h.client.createSystem(tankId, ' Máy điều khiển ');
  assert.equal(h.state.tanks.find(tank => tank.id === tankId).systems[systemId].meta.name, 'Máy điều khiển');
  await h.client.updateTank(tankId, { volumeLiters: 50 });
  await h.client.saveProfile('  Người chăm bể  ');
  h.client.dispose();
  const reloaded = createDemoClient(h.onState, h.options);
  assert.equal(h.state.user.displayName, 'Người chăm bể');
  assert.equal(h.state.tanks.find(tank => tank.id === tankId).meta.volumeLiters, 50);
  await reloaded.deleteSystem(tankId, systemId);
  assert.deepEqual(h.state.tanks.find(tank => tank.id === tankId).systems, {});
  await reloaded.deleteTank(tankId);
  assert.equal(h.state.tanks.find(tank => tank.id === tankId), undefined);
  reloaded.dispose();
});

test('output simulation distinguishes requested and applied; rapid updates apply the newest value', async () => {
  const h = harness();
  await h.client.setOutput('demo-planted', 'demo-main', 'fan', true);
  assert.equal(h.system.desired.fan, true);
  assert.equal(h.system.reported.outputs.fan, false);
  h.advance(300);
  await h.client.setOutput('demo-planted', 'demo-main', 'fan', false);
  await h.client.setOutput('demo-planted', 'demo-main', 'led2', true);
  h.advance(600);
  assert.equal(h.system.reported.outputs.fan, false);
  assert.equal(h.system.reported.outputs.led2, true);
  await assert.rejects(h.client.setOutput('demo-planted', 'demo-main', 'fan', 'true'));
  await assert.rejects(h.client.setOutput('demo-planted', 'demo-main', 'unknown', true));
  h.client.dispose();
});

test('one-shot command advances through accepted, executing, applied exactly once', async () => {
  const h = harness();
  const { id } = await h.client.sendCommand('demo-planted', 'demo-main', 'servo', 90);
  assert.equal(h.system.commands[id].angle, 90);
  assert.equal(h.system.acks[id], undefined);
  h.advance(200);
  assert.equal(h.system.acks[id].status, 'accepted');
  h.advance(450);
  assert.equal(h.system.acks[id].status, 'executing');
  h.advance(750);
  assert.equal(h.system.acks[id].status, 'applied');
  const completedAt = h.system.acks[id].processedAt;
  const notifications = h.state.notifications.length;
  h.advance(10_000);
  assert.equal(h.system.acks[id].processedAt, completedAt);
  assert.equal(h.state.notifications.length, notifications);
  h.client.dispose();
  const reloaded = createDemoClient(h.onState, h.options);
  h.advance(5000);
  assert.equal(h.system.acks[id].status, 'applied');
  assert.equal(h.system.acks[id].processedAt, completedAt);
  assert.equal(h.state.notifications.length, notifications);
  reloaded.dispose();
});

test('reload never resumes an uncertain one-shot command and dispose cancels all timers', async () => {
  const h = harness();
  const { id } = await h.client.sendCommand('demo-planted', 'demo-main', 'buzzer', 500);
  h.advance(650);
  assert.equal(h.system.acks[id].status, 'executing');
  h.client.dispose();
  assert.equal(h.pendingTimers, 0);
  const reloaded = createDemoClient(h.onState, h.options);
  assert.equal(h.system.acks[id].status, 'error');
  h.advance(20_000);
  assert.equal(h.system.acks[id].status, 'error');
  assert.equal(h.state.notifications.filter(item => item.title === 'Lệnh mô phỏng đã hoàn tất').length, 0);
  reloaded.dispose();
});

test('threshold crossing produces one notification until recovery and read timestamps stay stable', async () => {
  const h = harness();
  const initialCount = h.state.notifications.length;
  await h.client.saveConfig('demo-planted', 'demo-main', {
    servo: { minAngle: 10, maxAngle: 170 },
    thresholds: { minWaterTemperature: 23, maxWaterTemperature: 29, maxTds: 100, minAdapterVoltage: 10.5 },
  });
  assert.equal(h.state.notifications.length, initialCount + 1);
  h.advance(15_000);
  assert.equal(h.state.notifications.length, initialCount + 1);
  await h.client.markAllRead();
  const readAt = h.state.notifications[0].readAt;
  h.advance(1000);
  await h.client.markRead(h.state.notifications[0].id);
  assert.equal(h.state.notifications[0].readAt, readAt);
  await h.client.saveConfig('demo-planted', 'demo-main', {
    servo: { minAngle: 10, maxAngle: 170 },
    thresholds: { minWaterTemperature: 23, maxWaterTemperature: 29, maxTds: 700, minAdapterVoltage: 10.5 },
  });
  assert.equal(h.state.notifications.length, initialCount + 2);
  h.client.dispose();
});

test('corrupt saved data and unavailable storage preserve a usable demo', async () => {
  const storage = memoryStorage();
  storage.setItem(DEMO_STORAGE_KEY, '{broken');
  const h = harness(storage);
  assert.equal(h.state.tanks.length, 2);
  await assert.rejects(h.client.createTank({ name: ' ', location: '', volumeLiters: 30 }));
  assert.equal(h.state.tanks.length, 2);
  h.client.dispose();
  const blocked = harness({ getItem() { throw new Error('Blocked'); }, setItem() { throw new Error('Quota'); } });
  await blocked.client.saveProfile('Demo riêng tư');
  assert.equal(blocked.state.user.displayName, 'Demo riêng tư');
  assert.match(blocked.state.storageWarning, /phiên hiện tại/);
  blocked.client.dispose();
});

test('absent storage warns immediately and changes survive only for the current session', async () => {
  const h = harness(null);
  assert.match(h.state.storageWarning, /phiên hiện tại/);
  await h.client.saveProfile('Hồ sơ tạm thời');
  assert.equal(h.state.user.displayName, 'Hồ sơ tạm thời');
  h.client.dispose();
  const reloaded = createDemoClient(h.onState, h.options);
  assert.equal(h.state.user.displayName, 'Người dùng demo');
  assert.match(h.state.storageWarning, /phiên hiện tại/);
  reloaded.dispose();
});
