import { DEFAULT_CONFIG, OUTPUT_KEYS, validateProfileName, validateTank } from './policy.js';

function invalid(message) { return Object.assign(new Error(message), { friendly: true }); }

function pathId(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(value)) {
    throw invalid('Mã tài khoản, bể hoặc hệ thống chưa hợp lệ.');
  }
  return value;
}

// Spark stores each owner's tanks in one subtree so it needs neither a secondary
// index maintained by Functions nor a broad read across other owners' tanks.
export function sparkTankPath(uid, tankId) {
  return `sparkAquariums/${pathId(uid)}/${pathId(tankId)}`;
}

export function sparkSystemPath(uid, tankId, systemId) {
  return `${sparkTankPath(uid, tankId)}/systems/${pathId(systemId)}`;
}

export function createSparkOperations({ db, dbSdk, auth, requireConnected, ownTank, ownSystem }) {
  function connectedUser() {
    const user = requireConnected();
    if (!user?.uid || auth.currentUser?.uid !== user.uid) {
      throw invalid('Vui lòng đăng nhập lại để tiếp tục.');
    }
    pathId(user.uid);
    return user;
  }

  function tankPath(tankId) {
    const user = connectedUser();
    const path = sparkTankPath(user.uid, tankId);
    ownTank(tankId);
    return path;
  }

  function systemPath(tankId, systemId) {
    const user = connectedUser();
    const path = sparkSystemPath(user.uid, tankId, systemId);
    ownSystem(tankId, systemId);
    return path;
  }

  return {
    async createTank(data) {
      const user = connectedUser();
      const validated = validateTank(data);
      const tankId = crypto.randomUUID();
      await dbSdk.set(dbSdk.ref(db, sparkTankPath(user.uid, tankId)), {
        meta: { ...validated, ownerUid: user.uid,
          createdAt: dbSdk.serverTimestamp(), updatedAt: dbSdk.serverTimestamp() },
      });
      return { tankId };
    },

    async updateTank(tankId, data) {
      const path = tankPath(tankId);
      const validated = validateTank(data);
      await dbSdk.update(dbSdk.ref(db, `${path}/meta`), {
        ...validated, updatedAt: dbSdk.serverTimestamp(),
      });
      return { updated: true };
    },

    async deleteTank(tankId) {
      await dbSdk.remove(dbSdk.ref(db, tankPath(tankId)));
      return { deleted: true };
    },

    async createSystem(tankId, name) {
      const path = tankPath(tankId);
      const validatedName = validateProfileName(name);
      const systemId = crypto.randomUUID();
      await dbSdk.set(dbSdk.ref(db, `${path}/systems/${systemId}`), {
        meta: { name: validatedName,
          createdAt: dbSdk.serverTimestamp(), updatedAt: dbSdk.serverTimestamp() },
        desired: Object.fromEntries(OUTPUT_KEYS.map(key => [key, false])),
        config: {
          servo: { ...DEFAULT_CONFIG.servo },
          thresholds: { ...DEFAULT_CONFIG.thresholds },
        },
      });
      return { systemId };
    },

    async deleteSystem(tankId, systemId) {
      await dbSdk.remove(dbSdk.ref(db, systemPath(tankId, systemId)));
      return { deleted: true };
    },

    async pairDevice(tankId, systemId) {
      systemPath(tankId, systemId);
      throw invalid('Thiết bị cần được quản trị cấp tài khoản và gán vào hệ thống trong Firebase. Sau khi gán, trang web sẽ tự nhận dữ liệu từ thiết bị.');
    },
  };
}
