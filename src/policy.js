export const DEVICE_TIMEOUT_MS = 30_000;
export const SENSOR_TIMEOUT_MS = 60_000;
export const COMMAND_TTL_MS = 15_000;
export const COMMAND_COMPLETION_TIMEOUT_MS = 10_000;

export const OUTPUT_KEYS = Object.freeze(['airPump', 'fan', 'relay', 'led1', 'led2', 'led3']);
export const SENSOR_DEFINITIONS = Object.freeze({
  waterTemperature: { label: 'Nhiệt độ nước', unit: '°C', min: -55, max: 125 },
  ambientTemperature: { label: 'Nhiệt độ môi trường', unit: '°C', min: 0, max: 50 },
  humidity: { label: 'Độ ẩm', unit: '%', min: 0, max: 100 },
  tds: { label: 'TDS', unit: 'ppm', min: 0, max: 10_000 },
  adapterVoltage: { label: 'Nguồn điện', unit: 'V', min: 0, max: 60 },
});
export const DEFAULT_CONFIG = Object.freeze({
  servo: Object.freeze({ minAngle: 10, maxAngle: 170 }),
  thresholds: Object.freeze({ minWaterTemperature: 23, maxWaterTemperature: 29, maxTds: 700, minAdapterVoltage: 10.5 }),
});

const finite = value => typeof value === 'number' && Number.isFinite(value);
const inRange = (value, min, max) => finite(value) && value >= min && value <= max;
const fail = message => { throw new Error(message); };

export function deviceOnline(system, now = Date.now()) {
  const lastSeen = system?.reported?.lastSeen;
  return finite(now) && finite(lastSeen) && lastSeen > 0 && now - lastSeen >= -5000 && now - lastSeen <= DEVICE_TIMEOUT_MS;
}

export function sensorValue(system, key, now = Date.now()) {
  const definition = SENSOR_DEFINITIONS[key];
  const reading = system?.reported?.sensors?.[key];
  if (!definition || !deviceOnline(system, now) || reading?.valid !== true ||
    !inRange(reading.value, definition.min, definition.max) || !finite(reading.updatedAt) || reading.updatedAt <= 0 ||
    now - reading.updatedAt < -5000 || now - reading.updatedAt > SENSOR_TIMEOUT_MS) return null;
  return reading.value;
}

export function canControl(state, system, now = Date.now()) {
  if (!system) return false;
  if (state?.mode === 'demo') return true;
  return state?.mode === 'live' && Boolean(state.user?.uid) && state.connected === true &&
    finite(state.serverOffset) && deviceOnline(system, now) && system.reported.lastSeen <= now;
}

export function commandState(command, ack, now = Date.now()) {
  const result = (status, label, message, pending = false) => ({ status, label, message, pending, terminal: !pending });
  if (!command) return result('unknown', 'Chưa có lệnh', '');
  if (ack?.status === 'applied') return result('applied', 'Đã thực hiện', 'Thiết bị đã hoàn tất lệnh.');
  if (ack?.status === 'expired') return result('expired', 'Đã hết hạn', 'Thiết bị xác nhận lệnh hết hạn và không thực hiện.');
  if (ack?.status === 'error') return result('error', 'Thiết bị báo lỗi', 'Thiết bị không xác nhận hoàn tất lệnh.');
  if (ack?.status === 'executing') {
    if (finite(ack.processedAt) && now >= ack.processedAt + COMMAND_COMPLETION_TIMEOUT_MS) {
      return result('unknown', 'Chưa rõ kết quả', 'Chưa nhận được kết quả thực hiện. Không tự động gửi lại.');
    }
    return result('waiting', 'Đang thực hiện', 'Đang chờ thiết bị hoàn tất lệnh.', true);
  }
  if (command.clientStatus === 'error') return result('error', 'Không gửi được', command.message || 'Yêu cầu bị từ chối.');
  if (!finite(command.expiresAt) || now >= command.expiresAt) {
    return result('unknown', 'Chưa rõ kết quả', 'Đã quá hạn chờ xác nhận. Không tự động gửi lại.');
  }
  if (ack?.status === 'accepted') return result('waiting', 'Đã tiếp nhận', 'Thiết bị đã tiếp nhận; đang chờ thực hiện.', true);
  if (command.clientStatus === 'unknown') return result('unknown', 'Chưa rõ kết quả', 'Kết nối bị gián đoạn. Đang chờ xác nhận, không tự động gửi lại.', true);
  if (command.clientStatus === 'sending') return result('sending', 'Đang gửi', 'Đang gửi yêu cầu đến hệ thống.', true);
  return result('waiting', 'Chờ xác nhận', 'Đang chờ thiết bị xác nhận thực hiện.', true);
}

export function validateProfileName(value) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 80) fail('Tên cần từ 1 đến 80 ký tự.');
  return value.trim();
}

export function validateTank(data = {}) {
  const name = validateProfileName(data.name);
  const location = data.location ?? '';
  if (typeof location !== 'string' || location.trim().length > 120) fail('Vị trí cần tối đa 120 ký tự.');
  if (!inRange(data.volumeLiters, 1, 1_000_000)) fail('Dung tích cần từ 1 đến 1.000.000 lít.');
  return { name, location: location.trim(), volumeLiters: data.volumeLiters };
}

export function validateOutput(key, value) {
  if (!OUTPUT_KEYS.includes(key) || typeof value !== 'boolean') fail('Thông tin điều khiển chưa hợp lệ.');
  return { key, value };
}

export function validateConfig(config = {}) {
  const servo = config.servo ?? {};
  const thresholds = config.thresholds ?? {};
  if (!Number.isInteger(servo.minAngle) || !Number.isInteger(servo.maxAngle) ||
    !inRange(servo.minAngle, 0, 180) || !inRange(servo.maxAngle, 0, 180) || servo.minAngle >= servo.maxAngle) {
    fail('Góc servo cần là số nguyên từ 0 đến 180°; góc nhỏ nhất phải nhỏ hơn góc lớn nhất.');
  }
  if (!inRange(thresholds.minWaterTemperature, -55, 125) || !inRange(thresholds.maxWaterTemperature, -55, 125) ||
    thresholds.minWaterTemperature >= thresholds.maxWaterTemperature) fail('Ngưỡng nhiệt độ chưa hợp lệ; ngưỡng thấp phải nhỏ hơn ngưỡng cao.');
  if (!inRange(thresholds.maxTds, 0, 10_000)) fail('Ngưỡng TDS cần từ 0 đến 10.000 ppm.');
  if (!inRange(thresholds.minAdapterVoltage, 0, 60)) fail('Ngưỡng điện áp cần từ 0 đến 60 V.');
  return {
    servo: { minAngle: servo.minAngle, maxAngle: servo.maxAngle },
    thresholds: {
      minWaterTemperature: thresholds.minWaterTemperature, maxWaterTemperature: thresholds.maxWaterTemperature,
      maxTds: thresholds.maxTds, minAdapterVoltage: thresholds.minAdapterVoltage,
    },
  };
}

export function validateCommand(type, value, system) {
  if (type === 'servo') {
    const limits = system?.config?.servo;
    if (!limits || !Number.isInteger(limits.minAngle) || !Number.isInteger(limits.maxAngle) ||
      !inRange(limits.minAngle, 0, 180) || !inRange(limits.maxAngle, 0, 180) || limits.minAngle >= limits.maxAngle) {
      fail('Chưa có giới hạn servo hợp lệ cho hệ thống này.');
    }
    if (!Number.isInteger(value) || !inRange(value, limits.minAngle, limits.maxAngle)) {
      fail(`Góc cần nằm trong giới hạn ${limits.minAngle}–${limits.maxAngle}°.`);
    }
    return { angle: value };
  }
  if (type === 'buzzer') {
    if (!Number.isInteger(value) || !inRange(value, 100, 5000)) fail('Thời lượng âm báo cần từ 100 đến 5.000 mili giây.');
    return { durationMs: value };
  }
  fail('Loại lệnh chưa hợp lệ.');
}
