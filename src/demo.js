import {
  DEFAULT_CONFIG,
  OUTPUT_KEYS,
  validateCommand,
  validateConfig,
  validateOutput,
  validateProfileName,
  validateTank,
} from './policy.js';

export const DEMO_STORAGE_KEY = 'aquarium-control-web-demo-v1';
const STORAGE_WARNING = 'Trình duyệt không cho lưu dữ liệu demo. Các thay đổi chỉ giữ trong phiên hiện tại.';
const terminalAcks = new Set(['applied', 'error', 'expired']);
const clone = value => JSON.parse(JSON.stringify(value));
const outputDefaults = () => Object.fromEntries(OUTPUT_KEYS.map(key => [key, false]));

function storageFor(options) {
  if ('storage' in options) return options.storage;
  try { return globalThis.localStorage; } catch { return null; }
}

function simulateSensors(now, index = 0) {
  const wave = Math.sin(now / 55_000 + index * 1.8);
  const round = (value, places = 1) => Number(value.toFixed(places));
  const values = {
    waterTemperature: round(26.6 + wave * 0.35 + index * 0.2),
    ambientTemperature: round(29.1 + wave * 0.45),
    humidity: round(67.4 + wave * 1.2),
    tds: round((index ? 212 : 368) + wave * 3, 0),
    adapterVoltage: round(12.1 + wave * 0.04, 2),
  };
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { value, valid: true, updatedAt: now }]));
}

function newSystem(name, now, active = false) {
  const desired = { ...outputDefaults(), airPump: active, led1: active };
  return {
    meta: { name, createdAt: now, updatedAt: now },
    desired,
    reported: { lastSeen: now, sensors: simulateSensors(now), outputs: { ...desired } },
    config: clone(DEFAULT_CONFIG),
    commands: {},
    acks: {},
  };
}

function seed(now) {
  return {
    version: 1,
    user: { uid: 'demo', email: 'demo@aquarium.local', displayName: 'Người dùng demo' },
    tanks: [
      {
        id: 'demo-planted',
        meta: { name: 'Bể thủy sinh', location: 'Phòng khách', volumeLiters: 120, ownerUid: 'demo', createdAt: now, updatedAt: now },
        systems: { 'demo-main': newSystem('Hệ thống chính', now, true) },
      },
      {
        id: 'demo-small',
        meta: { name: 'Bể cá nhỏ', location: 'Góc làm việc', volumeLiters: 60, ownerUid: 'demo', createdAt: now, updatedAt: now },
        systems: { 'demo-small-main': newSystem('Hệ thống chính', now, true) },
      },
    ],
    notifications: [{
      id: 'demo-welcome', title: 'Bản demo đã sẵn sàng',
      body: 'Dữ liệu và thao tác đều được mô phỏng trên trình duyệt này. Chưa kết nối với bể cá thật.',
      type: 'info', createdAt: now, readAt: 0, tankId: '', systemId: '',
    }],
    alertFlags: {},
  };
}

function loadSaved(storage, now) {
  try {
    const raw = storage?.getItem(DEMO_STORAGE_KEY);
    if (!raw) return seed(now);
    const saved = JSON.parse(raw);
    if (saved.version !== 1 || !Array.isArray(saved.tanks) || saved.tanks.length > 50 || !Array.isArray(saved.notifications)) throw new Error('Invalid demo state');
    saved.user = { uid: 'demo', email: 'demo@aquarium.local', displayName: validateProfileName(saved.user?.displayName) };
    const seen = new Set();
    for (const tank of saved.tanks) {
      if (!/^[A-Za-z0-9_-]{1,64}$/.test(tank.id) || seen.has(tank.id)) throw new Error('Invalid tank ID');
      seen.add(tank.id);
      tank.meta = { ...tank.meta, ...validateTank(tank.meta), ownerUid: 'demo' };
      if (!tank.systems || typeof tank.systems !== 'object' || Array.isArray(tank.systems) || Object.keys(tank.systems).length > 20) throw new Error('Invalid systems');
      for (const [id, system] of Object.entries(tank.systems)) {
        if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) throw new Error('Invalid system ID');
        system.meta.name = validateProfileName(system.meta?.name);
        system.config = validateConfig(system.config);
        system.desired = Object.fromEntries(OUTPUT_KEYS.map(key => {
          validateOutput(key, system.desired?.[key]);
          return [key, system.desired[key]];
        }));
        system.reported = { lastSeen: now, outputs: { ...system.desired }, sensors: simulateSensors(now) };
        system.commands ||= {};
        system.acks ||= {};
        // A refreshed page never resumes a one-shot action with an uncertain result.
        for (const commandId of Object.keys(system.commands)) {
          if (!terminalAcks.has(system.acks[commandId]?.status)) {
            system.acks[commandId] = { status: 'error', processedAt: now, message: 'Đã tải lại bản demo; kết quả lệnh cũ chưa xác định. Lệnh không được chạy lại.' };
          }
        }
      }
    }
    saved.notifications = saved.notifications.filter(item => item && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.body === 'string').slice(0, 150);
    saved.alertFlags = saved.alertFlags && typeof saved.alertFlags === 'object' ? saved.alertFlags : {};
    return saved;
  } catch { return seed(now); }
}

/** Local simulation. Runtime injection keeps timing, storage failures and reload behavior testable. */
export function createDemoClient(onState, options = {}) {
  const now = options.now || (() => Date.now());
  const storage = storageFor(options);
  const setTimer = options.setTimeout || globalThis.setTimeout.bind(globalThis);
  const clearTimer = options.clearTimeout || globalThis.clearTimeout.bind(globalThis);
  const setRepeater = options.setInterval || globalThis.setInterval.bind(globalThis);
  const clearRepeater = options.clearInterval || globalThis.clearInterval.bind(globalThis);
  let data = loadSaved(storage, now());
  let disposed = false;
  let serial = 0;
  const timers = new Set();
  const outputTimers = new Map();
  let storageWarning = storage ? '' : STORAGE_WARNING;

  function persist() {
    try { storage?.setItem(DEMO_STORAGE_KEY, JSON.stringify(data)); }
    catch { storageWarning = STORAGE_WARNING; }
  }

  function emit() {
    if (disposed) return;
    onState({
      mode: 'demo', connected: true, timeReliable: true, serverOffset: 0, serverNow: now(),
      user: clone(data.user), profile: { displayName: data.user.displayName },
      tanks: clone(data.tanks), notifications: clone(data.notifications), storageWarning,
    });
  }

  function change() { persist(); emit(); }
  function assertActive() { if (disposed) throw new Error('Phiên demo đã kết thúc.'); }
  function tankFor(id) {
    assertActive();
    const tank = data.tanks.find(item => item.id === id);
    if (!tank) throw new Error('Không tìm thấy bể cá.');
    return tank;
  }
  function systemFor(tankId, systemId) {
    const system = tankFor(tankId).systems[systemId];
    if (!system) throw new Error('Không tìm thấy hệ thống.');
    return system;
  }
  function makeId(kind) {
    serial += 1;
    const entropy = options.random ? options.random().toString(36).slice(2, 10) : globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 10);
    return `${kind}-${now().toString(36)}-${serial}-${entropy}`.slice(0, 64);
  }
  function schedule(fn, delay) {
    let id;
    id = setTimer(() => { timers.delete(id); if (!disposed) fn(); }, delay);
    timers.add(id);
    return id;
  }
  function notify(title, body, tankId = '', systemId = '', type = 'info') {
    data.notifications.unshift({ id: makeId('notice'), title, body, tankId, systemId, type, createdAt: now(), readAt: 0 });
    data.notifications = data.notifications.slice(0, 150);
  }

  function evaluateAlerts(tank, systemId, system) {
    const thresholds = system.config.thresholds;
    const values = system.reported.sensors;
    const alerts = {
      temperatureLow: [values.waterTemperature.value < thresholds.minWaterTemperature, 'Nhiệt độ nước thấp hơn ngưỡng đã đặt.'],
      temperatureHigh: [values.waterTemperature.value > thresholds.maxWaterTemperature, 'Nhiệt độ nước cao hơn ngưỡng đã đặt.'],
      tds: [values.tds.value > thresholds.maxTds, 'TDS cao hơn ngưỡng đã đặt.'],
      voltage: [values.adapterVoltage.value < thresholds.minAdapterVoltage, 'Điện áp nguồn thấp hơn ngưỡng đã đặt.'],
    };
    for (const [key, [active, description]] of Object.entries(alerts)) {
      const flag = `${tank.id}/${systemId}/${key}`;
      if (active && !data.alertFlags[flag]) notify('Cảnh báo mô phỏng', `${tank.meta.name}: ${description}`, tank.id, systemId, 'threshold');
      if (!active && data.alertFlags[flag]) notify('Đã về ngưỡng an toàn · Demo', `${tank.meta.name}: Chỉ số mô phỏng đã trở lại trong ngưỡng.`, tank.id, systemId);
      data.alertFlags[flag] = active;
    }
  }

  function refreshSensors() {
    data.tanks.forEach((tank, index) => {
      for (const [systemId, system] of Object.entries(tank.systems)) {
        system.reported.lastSeen = now();
        system.reported.sensors = simulateSensors(now(), index);
        evaluateAlerts(tank, systemId, system);
      }
    });
    change();
  }

  const heartbeat = setRepeater(refreshSensors, 5000);
  refreshSensors();

  return {
    async createTank(input) {
      assertActive();
      const meta = validateTank(input);
      if (data.tanks.length >= 50) throw new Error('Mỗi tài khoản có tối đa 50 bể.');
      const tankId = makeId('tank');
      data.tanks.push({ id: tankId, meta: { ...meta, ownerUid: 'demo', createdAt: now(), updatedAt: now() }, systems: {} });
      change();
      return { tankId };
    },
    async updateTank(tankId, input) {
      const tank = tankFor(tankId);
      tank.meta = { ...tank.meta, ...validateTank({ ...tank.meta, ...input }), updatedAt: now() };
      change();
      return { updated: true };
    },
    async deleteTank(tankId) {
      tankFor(tankId);
      data.tanks = data.tanks.filter(tank => tank.id !== tankId);
      data.notifications = data.notifications.filter(item => item.tankId !== tankId);
      for (const key of Object.keys(data.alertFlags)) if (key.startsWith(`${tankId}/`)) delete data.alertFlags[key];
      change();
      return { deleted: true };
    },
    async createSystem(tankId, name) {
      const tank = tankFor(tankId);
      const normalizedName = validateProfileName(name);
      if (Object.keys(tank.systems).length >= 20) throw new Error('Mỗi bể có tối đa 20 hệ thống.');
      const systemId = makeId('system');
      tank.systems[systemId] = newSystem(normalizedName, now());
      change();
      return { systemId };
    },
    async deleteSystem(tankId, systemId) {
      systemFor(tankId, systemId);
      delete tankFor(tankId).systems[systemId];
      data.notifications = data.notifications.filter(item => item.tankId !== tankId || item.systemId !== systemId);
      for (const key of Object.keys(data.alertFlags)) if (key.startsWith(`${tankId}/${systemId}/`)) delete data.alertFlags[key];
      change();
      return { deleted: true };
    },
    async pairDevice(tankId, systemId, pairingCode) {
      const system = systemFor(tankId, systemId);
      if (typeof pairingCode !== 'string' || !pairingCode.trim()) throw new Error('Nhập mã ghép nối để thử thao tác demo.');
      if (pairingCode.trim().length > 256) throw new Error('Mã ghép nối quá dài.');
      system.reported.lastSeen = now();
      notify('Ghép nối mô phỏng thành công', 'Đây là thao tác thử. Chưa ghép với thiết bị thật.', tankId, systemId);
      change();
      return { paired: true, simulated: true };
    },
    async setOutput(tankId, systemId, key, value) {
      const system = systemFor(tankId, systemId);
      validateOutput(key, value);
      system.desired[key] = value;
      const timerKey = `${tankId}/${systemId}/${key}`;
      if (outputTimers.has(timerKey)) {
        clearTimer(outputTimers.get(timerKey));
        timers.delete(outputTimers.get(timerKey));
      }
      const timer = schedule(() => {
        outputTimers.delete(timerKey);
        const current = data.tanks.find(item => item.id === tankId)?.systems[systemId];
        if (!current) return;
        current.reported.outputs[key] = current.desired[key];
        change();
      }, 600);
      outputTimers.set(timerKey, timer);
      change();
      return { updated: true };
    },
    async sendCommand(tankId, systemId, type, value) {
      const system = systemFor(tankId, systemId);
      const payload = validateCommand(type, value, system);
      const id = makeId('command');
      const createdAt = now();
      system.commands[id] = { id, type, ...payload, createdAt, expiresAt: createdAt + 15000, requestedBy: 'demo' };
      change();
      const advance = status => {
        const current = data.tanks.find(item => item.id === tankId)?.systems[systemId];
        if (!current || terminalAcks.has(current.acks[id]?.status)) return;
        if (status !== 'applied' && now() >= current.commands[id].expiresAt) {
          current.acks[id] = { status: 'expired', processedAt: now(), message: 'Lệnh mô phỏng đã hết hạn.' };
        } else {
          current.acks[id] = { status, processedAt: now(), message: status === 'applied' ? 'Đã hoàn tất thao tác mô phỏng.' : '' };
          if (status === 'applied') notify('Lệnh mô phỏng đã hoàn tất', type === 'servo' ? `Servo mô phỏng đã đến góc ${payload.angle}°.` : `Còi mô phỏng hoạt động trong ${payload.durationMs} ms.`, tankId, systemId);
        }
        change();
      };
      schedule(() => advance('accepted'), 200);
      schedule(() => advance('executing'), 650);
      schedule(() => advance('applied'), type === 'buzzer' ? 650 + payload.durationMs : 1400);
      return { id };
    },
    async saveConfig(tankId, systemId, config) {
      const system = systemFor(tankId, systemId);
      system.config = validateConfig(config);
      evaluateAlerts(tankFor(tankId), systemId, system);
      change();
      return { updated: true };
    },
    async saveProfile(name) {
      assertActive();
      data.user.displayName = validateProfileName(name);
      change();
      return { updated: true };
    },
    async markRead(id) {
      assertActive();
      const notification = data.notifications.find(item => item.id === id);
      if (!notification) throw new Error('Không tìm thấy thông báo.');
      if (!notification.readAt) notification.readAt = now();
      change();
    },
    async markAllRead() {
      assertActive();
      for (const notification of data.notifications) if (!notification.readAt) notification.readAt = now();
      change();
    },
    async logout() {
      this.dispose();
      onState({ mode: 'signed-out', user: null, tanks: [], notifications: [], connected: false, timeReliable: false, serverOffset: 0 });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      clearRepeater(heartbeat);
      for (const timer of timers) clearTimer(timer);
      timers.clear();
      outputTimers.clear();
    },
  };
}
