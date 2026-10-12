import test from 'node:test';
import assert from 'node:assert/strict';
import { createSparkOperations, sparkTankPath, sparkSystemPath } from '../src/spark.js';

function harness() {
  const writes = [];
  const tanks = new Map([['owned-tank', { systems: { 'owned-system': {} } }]]);
  const auth = { currentUser: { uid: 'owner-a' } };
  let connected = true;
  let failure = null;
  const write = async (method, path, data) => {
    if (failure) throw failure;
    writes.push({ method, path, ...(data === undefined ? {} : { data: structuredClone(data) }) });
  };
  const client = createSparkOperations({
    db: {}, auth,
    dbSdk: {
      ref: (_, path) => path,
      set: (path, data) => write('set', path, data),
      update: (path, data) => write('update', path, data),
      remove: path => write('remove', path),
      serverTimestamp: () => ({ '.sv': 'timestamp' }),
    },
    requireConnected() {
      if (!connected) throw new Error('Chưa kết nối Firebase.');
      return auth.currentUser;
    },
    ownTank(id) {
      if (!tanks.has(id)) throw new Error('Không tìm thấy bể trong tài khoản hiện tại.');
      return tanks.get(id);
    },
    ownSystem(tankId, systemId) {
      const tank = tanks.get(tankId);
      if (!tank?.systems?.[systemId]) throw new Error('Không tìm thấy hệ thống trong bể đã chọn.');
      return tank.systems[systemId];
    },
  });
  return {
    client, writes, auth,
    disconnect() { connected = false; },
    denyWrites(error) { failure = error; },
  };
}

const tankData = { name: '  Bể mới  ', location: '  Phòng khách  ', volumeLiters: 60 };

test('Spark path scopes reject traversal, Firebase special characters and invalid identifiers', () => {
  assert.equal(sparkTankPath('owner-a', 'tank-b'), 'sparkAquariums/owner-a/tank-b');
  assert.equal(sparkSystemPath('owner-a', 'tank-b', 'system-c'), 'sparkAquariums/owner-a/tank-b/systems/system-c');
  for (const id of ['', '../other-owner', 'x/y', 'x.y', 'x#y', 'x$y', 'x[y', 'x]y', 'a'.repeat(129), null, 42]) {
    assert.throws(() => sparkTankPath(id, 'tank'));
    assert.throws(() => sparkTankPath('owner', id));
    assert.throws(() => sparkSystemPath('owner', 'tank', id));
  }
});

test('Spark creation establishes owner data without inventing telemetry or physical acknowledgement', async () => {
  const h = harness();
  const { tankId } = await h.client.createTank({ ...tankData, ownerUid: 'someone-else', createdAt: 1 });
  const tank = h.writes[0];
  assert.match(tankId, /^[A-Za-z0-9_-]{8,64}$/);
  assert.equal(tank.path, `sparkAquariums/owner-a/${tankId}`);
  assert.deepEqual(Object.keys(tank.data), ['meta']);
  assert.deepEqual(tank.data.meta, {
    name: 'Bể mới', location: 'Phòng khách', volumeLiters: 60, ownerUid: 'owner-a',
    createdAt: { '.sv': 'timestamp' }, updatedAt: { '.sv': 'timestamp' },
  });

  const { systemId } = await h.client.createSystem('owned-tank', '  Bộ điều khiển  ');
  const system = h.writes[1];
  assert.equal(system.path, `sparkAquariums/owner-a/owned-tank/systems/${systemId}`);
  assert.deepEqual(Object.keys(system.data).sort(), ['config', 'desired', 'meta']);
  assert.equal(system.data.meta.name, 'Bộ điều khiển');
  assert.deepEqual(system.data.desired, { airPump: false, fan: false, relay: false, led1: false, led2: false, led3: false });
  assert.deepEqual(system.data.config, {
    servo: { minAngle: 10, maxAngle: 170 },
    thresholds: { minWaterTemperature: 23, maxWaterTemperature: 29, maxTds: 700, minAdapterVoltage: 10.5 },
  });
  assert.equal(system.data.reported, undefined);
  assert.equal(system.data.commands, undefined);
  assert.equal(system.data.acks, undefined);
});

test('Spark topology checks connectivity, membership and input validity before writing', async () => {
  const h = harness();
  await assert.rejects(h.client.createTank({ ...tankData, volumeLiters: '60' }));
  await assert.rejects(h.client.createTank({ ...tankData, volumeLiters: Infinity }));
  await assert.rejects(h.client.createSystem('owned-tank', '  '));
  await assert.rejects(h.client.updateTank('other-tank', tankData));
  await assert.rejects(h.client.deleteTank('other-tank'));
  await assert.rejects(h.client.deleteSystem('owned-tank', 'other-system'));
  await assert.rejects(h.client.createSystem('../owner-b/tank', 'Controller'));
  await assert.rejects(h.client.deleteSystem('owned-tank', 'x/y'));
  h.disconnect();
  await assert.rejects(h.client.createTank(tankData), /Chưa kết nối/);
  await assert.rejects(h.client.updateTank('owned-tank', tankData), /Chưa kết nối/);
  await assert.rejects(h.client.deleteTank('owned-tank'), /Chưa kết nối/);
  await assert.rejects(h.client.createSystem('owned-tank', 'Controller'), /Chưa kết nối/);
  await assert.rejects(h.client.deleteSystem('owned-tank', 'owned-system'), /Chưa kết nối/);
  assert.deepEqual(h.writes, []);
});

test('Spark metadata edits preserve identity fields and deletes remain within the active owner path', async () => {
  const h = harness();
  await h.client.updateTank('owned-tank', { ...tankData, ownerUid: 'owner-b', createdAt: 1 });
  assert.deepEqual(h.writes[0], {
    method: 'update', path: 'sparkAquariums/owner-a/owned-tank/meta',
    data: { name: 'Bể mới', location: 'Phòng khách', volumeLiters: 60, updatedAt: { '.sv': 'timestamp' } },
  });
  await h.client.deleteSystem('owned-tank', 'owned-system');
  await h.client.deleteTank('owned-tank');
  assert.deepEqual(h.writes.slice(1), [
    { method: 'remove', path: 'sparkAquariums/owner-a/owned-tank/systems/owned-system' },
    { method: 'remove', path: 'sparkAquariums/owner-a/owned-tank' },
  ]);
});

test('Spark cannot self-provision device roles and reports a denied write without succeeding', async () => {
  const h = harness();
  await assert.rejects(h.client.pairDevice('owned-tank', 'owned-system', 'code'), /quản trị cấp tài khoản/);
  assert.deepEqual(h.writes, []);
  const denied = Object.assign(new Error('Permission denied'), { code: 'PERMISSION_DENIED' });
  h.denyWrites(denied);
  await assert.rejects(h.client.createTank(tankData), error => error === denied);
  await assert.rejects(h.client.createSystem('owned-tank', 'Controller'), error => error === denied);
  assert.deepEqual(h.writes, []);
});
