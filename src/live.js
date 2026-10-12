import {
  canControl, commandState, COMMAND_TTL_MS, validateCommand, validateConfig,
  validateOutput, validateProfileName, validateTank,
} from './policy.js';
import { createSparkOperations, sparkSystemPath } from './spark.js';
import { authProfileName, createGoogleSignIn } from './auth.js';

const errorMessages = {
  'invalid-email': 'Địa chỉ email chưa hợp lệ.',
  'invalid-credential': 'Email hoặc mật khẩu chưa đúng.',
  'wrong-password': 'Email hoặc mật khẩu chưa đúng.',
  'user-not-found': 'Email hoặc mật khẩu chưa đúng.',
  'email-already-in-use': 'Email này đã được đăng ký.',
  'weak-password': 'Mật khẩu cần ít nhất 6 ký tự.',
  'too-many-requests': 'Có quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.',
  'network-request-failed': 'Không thể kết nối. Kiểm tra mạng và thử lại.',
  'user-disabled': 'Tài khoản đã bị vô hiệu hóa.',
  'operation-not-allowed': 'Phương thức đăng nhập này chưa được bật trong Firebase.',
  'configuration-not-found': 'Authentication chưa được khởi tạo cho project. Cần bật Email/Password trong Firebase Console.',
  'popup-blocked': 'Trình duyệt đã chặn cửa sổ Google. Cho phép cửa sổ bật lên cho website này rồi thử lại.',
  'popup-closed-by-user': 'Bạn đã đóng cửa sổ Google trước khi đăng nhập xong. Có thể thử lại.',
  'cancelled-popup-request': 'Một lần đăng nhập Google đang được xử lý. Hãy hoàn tất cửa sổ đang mở.',
  'unauthorized-domain': 'Tên miền này chưa được cho phép đăng nhập trong Firebase.',
  'account-exists-with-different-credential': 'Email này đã dùng một cách đăng nhập khác. Hãy đăng nhập bằng phương thức đã dùng trước đây.',
  'operation-not-supported-in-this-environment': 'Hãy mở website bằng Safari, Chrome hoặc Edge để đăng nhập Google.',
  'web-storage-unsupported': 'Trình duyệt đang chặn dữ liệu website. Cho phép lưu dữ liệu rồi thử lại bằng Safari, Chrome hoặc Edge.',
  'unauthenticated': 'Vui lòng đăng nhập lại để tiếp tục.',
  'permission-denied': 'Tài khoản không có quyền truy cập hoặc cấu hình Firebase chưa đúng.',
  'PERMISSION_DENIED': 'Tài khoản không có quyền truy cập hoặc cấu hình Firebase chưa đúng.',
  'failed-precondition': 'Yêu cầu chưa đủ điều kiện. Kiểm tra mã ghép và thiết bị.',
  'not-found': 'Không tìm thấy bể, hệ thống hoặc mã ghép thiết bị.',
  'already-exists': 'Hệ thống này đã có thiết bị. Hãy tạo hệ thống khác.',
  'resource-exhausted': 'Đã đạt giới hạn số lượng bể hoặc hệ thống.',
  'invalid-argument': 'Thông tin chưa hợp lệ. Kiểm tra lại dữ liệu đã nhập.',
  'unavailable': 'Dịch vụ hiện chưa khả dụng. Vui lòng thử lại sau.',
  'aborted': 'Dữ liệu vừa thay đổi. Vui lòng thử lại.',
};

function friendlyError(error) {
  if (error?.friendly) return error;
  const code = String(error?.code ?? '').split('/').pop();
  // SDK error messages can include request details; only expose our own messages.
  return Object.assign(new Error(errorMessages[code] || 'Không hoàn tất được yêu cầu. Kiểm tra kết nối và cấu hình Firebase.'), { friendly: true });
}
function userError(message) { return Object.assign(new Error(message), { friendly: true }); }
function validateId(id) {
  if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw userError('Mã bể hoặc hệ thống chưa hợp lệ.');
  return id;
}

export async function createLiveClient(config, onState, onError = () => {}) {
  if (!config || !['apiKey', 'authDomain', 'databaseURL', 'projectId', 'appId'].every(key => typeof config[key] === 'string' && config[key].trim())) {
    throw userError('Chưa có cấu hình Firebase Web. Điền thông tin project để kết nối bể thật.');
  }
  let databaseUrl;
  try {
    const url = new URL(config.databaseURL);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
      !/^[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.(firebaseio\.com|firebasedatabase\.app)$/.test(url.hostname) ||
      !['', '/'].includes(url.pathname)) throw new Error();
    databaseUrl = url.origin;
  } catch { throw userError('Database URL cần là địa chỉ HTTPS của Firebase Realtime Database, không kèm đường dẫn.'); }

  const spark = config.backendMode === 'spark';
  const [appSdk, authSdk, dbSdk] = await Promise.all([
    import('firebase/app'), import('firebase/auth'), import('firebase/database'),
  ]);
  const appName = `aquarium-web-${config.projectId}`;
  const app = appSdk.getApps().find(item => item.name === appName) || appSdk.initializeApp(config, appName);
  const auth = authSdk.getAuth(app);
  auth.languageCode = 'vi';
  const db = dbSdk.getDatabase(app, databaseUrl);
  const functionsSdk = spark ? null : await import('firebase/functions');
  const functions = functionsSdk?.getFunctions(app, 'asia-southeast1');
  let persistence = 'local';
  try { await authSdk.setPersistence(auth, authSdk.browserLocalPersistence); }
  catch {
    try { await authSdk.setPersistence(auth, authSdk.browserSessionPersistence); persistence = 'session'; }
    catch { await authSdk.setPersistence(auth, authSdk.inMemoryPersistence); persistence = 'memory'; }
  }

  let disposed = false;
  let generation = 0;
  let cachedOffset = null;
  let state = { mode: 'live', backendMode: spark ? 'spark' : 'functions', persistence, user: null, tanks: [], notifications: [], connected: false, serverOffset: null };
  const sessionListeners = [];
  const tankListeners = new Map();
  const tankMap = new Map();
  const localCommands = new Map();
  const commandReservations = new Set();
  const activeRequests = new Set();
  const rootListeners = [];
  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });
  let sessionTask = Promise.resolve();
  let initializedUid = null;
  let sessionError = null;

  const report = (error, context = 'sdk') => {
    if (!disposed) onError(Object.assign(friendlyError(error), {
      context, diagnosticCode:String(error?.code || '').replace(/[^A-Za-z0-9_/-]/g,'').slice(0,80),
    }));
  };
  const emit = () => { if (!disposed) onState({ ...state }); };
  const serverNow = () => Math.round(Date.now() + (state.serverOffset ?? 0));
  const scope = (tankId, systemId) => `${tankId}/${systemId}`;
  const hardwarePath = (tankId, systemId) => spark
    ? sparkSystemPath(requireUser().uid, tankId, systemId)
    : `aquariums/${tankId}/systems/${systemId}`;

  function publishTanks() {
    state.tanks = [...tankMap.values()].map(tank => ({
      ...tank,
      systems: Object.fromEntries(Object.entries(tank.systems ?? {}).map(([id, system]) => {
        const local = localCommands.get(scope(tank.id, id)) ?? {};
        const commands = { ...(system.commands ?? {}) };
        for (const [commandId, command] of Object.entries(local)) {
          commands[commandId] = { ...command, ...(commands[commandId] ?? {}),
            clientStatus: commands[commandId] ? 'waiting' : command.clientStatus };
        }
        return [id, { ...system, commands, acks: system.acks ?? {} }];
      })),
    })).sort((left, right) => String(left.meta?.name ?? '').localeCompare(String(right.meta?.name ?? ''), 'vi'));
    emit();
  }

  function abortRequests() {
    for (const controller of activeRequests) controller.abort();
    activeRequests.clear();
  }
  function clearSession() {
    generation += 1;
    abortRequests();
    for (const unsubscribe of sessionListeners.splice(0)) unsubscribe();
    for (const unsubscribe of tankListeners.values()) unsubscribe();
    tankListeners.clear(); tankMap.clear(); localCommands.clear(); commandReservations.clear();
    state = { ...state, user: null, tanks: [], notifications: [] };
    initializedUid = null;
  }
  function listen(path, callback, currentGeneration) {
    const unsubscribe = dbSdk.onValue(typeof path === 'string' ? dbSdk.ref(db, path) : path,
      snapshot => { if (!disposed && currentGeneration === generation) callback(snapshot); },
      error => { if (currentGeneration === generation) report(error); });
    sessionListeners.push(unsubscribe);
  }
  function requireUser() {
    const user = auth.currentUser;
    if (disposed || !user || user.uid !== state.user?.uid) throw userError('Vui lòng đăng nhập để tiếp tục.');
    return user;
  }
  function requireConnected() {
    const user = requireUser();
    if (!state.connected) throw userError('Chưa kết nối Firebase. Hãy thử lại khi có mạng.');
    return user;
  }
  function ownTank(tankId) {
    validateId(tankId);
    requireConnected();
    const tank = state.tanks.find(item => item.id === tankId);
    if (!tank) throw userError('Không tìm thấy bể trong tài khoản hiện tại.');
    return tank;
  }
  function ownSystem(tankId, systemId) {
    validateId(systemId);
    const system = ownTank(tankId).systems?.[systemId];
    if (!system) throw userError('Không tìm thấy hệ thống trong bể đã chọn.');
    return system;
  }
  function physicalSystem(tankId, systemId) {
    const system = ownSystem(tankId, systemId);
    if (!canControl(state, system, serverNow())) throw userError('Thiết bị mất liên lạc hoặc chưa có thời gian máy chủ. Chưa thể điều khiển.');
    return system;
  }
  async function execute(action) {
    try { return await action(); }
    catch (error) { throw error?.code ? friendlyError(error) : userError(error?.message || 'Không hoàn tất được yêu cầu.'); }
  }
  async function callable(name, data) {
    requireConnected();
    const response = await functionsSdk.httpsCallable(functions, name)(data);
    return response.data;
  }
  function putLocalCommand(tankId, systemId, command) {
    const key = scope(tankId, systemId);
    const previous = localCommands.get(key) ?? {};
    localCommands.set(key, { ...previous, [command.id]: command });
    publishTanks();
  }

  // Direct REST requests deliberately bypass the SDK's offline write queue.
  // A physical operation is attempted once; a lost response is an uncertain result.
  async function physicalWrite(path, value, token, timeoutMs = 8000) {
    const controller = new AbortController();
    activeRequests.add(controller);
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${databaseUrl}/${path}.json?auth=${encodeURIComponent(token)}&print=silent`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value), signal: controller.signal, cache: 'no-store',
      });
      if (!response.ok) {
        const error = userError(response.status === 401 || response.status === 403
          ? 'Yêu cầu bị từ chối. Kiểm tra quyền, kết nối thiết bị và thời hạn lệnh.'
          : 'Dịch vụ chưa xác nhận yêu cầu. Không tự động gửi lại.');
        error.definitelyRejected = [400, 401, 403, 404].includes(response.status);
        throw error;
      }
    } catch (error) {
      if (error.friendly) throw error;
      throw userError('Kết nối bị gián đoạn; kết quả chưa được xác nhận. Không tự động gửi lại.');
    } finally { clearTimeout(timeout); activeRequests.delete(controller); }
  }

  rootListeners.push(dbSdk.onValue(dbSdk.ref(db, '.info/connected'), snapshot => {
    state.connected = snapshot.val() === true;
    if (!state.connected) abortRequests();
    state.serverOffset = state.connected ? cachedOffset : null;
    emit();
    // .info values are SDK-local metadata. Its onValue listener below receives
    // the server offset; a network get() on this reserved path can fail.
  }, report));
  rootListeners.push(dbSdk.onValue(dbSdk.ref(db, '.info/serverTimeOffset'), snapshot => {
    const offset = snapshot.val();
    cachedOffset = typeof offset === 'number' && Number.isFinite(offset) ? offset : null;
    state.serverOffset = state.connected ? cachedOffset : null;
    emit();
  }, report));

  const unsubscribeAuth = authSdk.onAuthStateChanged(auth, user => {
    sessionTask = initializeSession(user);
  }, error => { report(error); resolveReady(); });

  async function initializeSession(user) {
    if (disposed) return;
    sessionError = null;
    clearSession(); emit();
    if (!user) { resolveReady(); return; }
    const currentGeneration = generation;
    try {
      const tokenResult = await authSdk.getIdTokenResult(user);
      if (disposed || currentGeneration !== generation || auth.currentUser?.uid !== user.uid) return;
      const deviceRole = spark ? (await dbSdk.get(dbSdk.ref(db, `sparkDeviceAccounts/${user.uid}`))).val() === true : false;
      if (disposed || currentGeneration !== generation || auth.currentUser?.uid !== user.uid) return;
      if (tokenResult.claims.aquariumDevice === true || deviceRole) {
        report(userError('Tài khoản thiết bị không dùng để quản lý bể. Hãy dùng tài khoản chủ bể.'));
        await authSdk.signOut(auth); return;
      }
      state.user = { uid: user.uid, email: user.email ?? '', displayName: authProfileName(user), emailVerified: user.emailVerified };
      emit();
      listen(`users/${user.uid}/profile`, snapshot => {
        if (snapshot.exists()) state.user = { ...state.user, displayName: snapshot.val().displayName || state.user.displayName };
        emit();
      }, currentGeneration);
      if (spark) listen(`sparkAquariums/${user.uid}`, snapshot => {
        tankMap.clear();
        for (const [id, tank] of Object.entries(snapshot.val() ?? {})) {
          tankMap.set(id, { id, meta: tank.meta ?? {}, systems: tank.systems ?? {} });
        }
        publishTanks();
      }, currentGeneration);
      else listen(`userAquariums/${user.uid}`, snapshot => {
        const ids = new Set(Object.entries(snapshot.val() ?? {}).filter(([, value]) => value === true).map(([id]) => id));
        for (const [id, unsubscribe] of tankListeners) if (!ids.has(id)) {
          unsubscribe(); tankListeners.delete(id); tankMap.delete(id);
        }
        for (const id of ids) if (!tankListeners.has(id)) {
          const unsubscribe = dbSdk.onValue(dbSdk.ref(db, `aquariums/${id}`), tankSnapshot => {
            if (disposed || currentGeneration !== generation) return;
            const tank = tankSnapshot.val();
            if (tank) tankMap.set(id, { id, meta: tank.meta ?? {}, systems: tank.systems ?? {} });
            else tankMap.delete(id);
            publishTanks();
          }, error => {
            if (currentGeneration === generation) { tankMap.delete(id); publishTanks(); report(error); }
          });
          tankListeners.set(id, unsubscribe);
        }
        publishTanks();
      }, currentGeneration);
      if (!spark) listen(dbSdk.query(dbSdk.ref(db, `notifications/${user.uid}`), dbSdk.orderByChild('createdAt'), dbSdk.limitToLast(100)), snapshot => {
        state.notifications = Object.entries(snapshot.val() ?? {}).map(([id, item]) => ({ ...item, id }))
          .sort((left, right) => right.createdAt - left.createdAt);
        emit();
      }, currentGeneration);
      await dbSdk.runTransaction(dbSdk.ref(db, `users/${user.uid}/profile`), current => current ? undefined : {
        displayName: state.user?.displayName || 'Người dùng', avatarPath: '',
        createdAt: dbSdk.serverTimestamp(), updatedAt: dbSdk.serverTimestamp(),
      }, { applyLocally: false });
      if (disposed || currentGeneration !== generation) return;
      await dbSdk.runTransaction(dbSdk.ref(db, `users/${user.uid}/preferences`), current => current ? undefined : {
        themeMode: 'system', notificationsEnabled: false, offlineAlerts: true, thresholdAlerts: true,
      }, { applyLocally: false });
      if (currentGeneration === generation) initializedUid = user.uid;
    } catch (error) {
      if (currentGeneration === generation) {
        sessionError = friendlyError(error); report(sessionError);
        try { await authSdk.signOut(auth); } catch {}
      }
    }
    finally { resolveReady(); }
  }

  async function awaitSession(user) {
    // Auth dispatches its change callback before returning sign-in credentials.
    await sessionTask;
    if (disposed || auth.currentUser?.uid !== user.uid || state.user?.uid !== user.uid || initializedUid !== user.uid) {
      throw sessionError || userError('Chưa khởi tạo được phiên bể cá. Kiểm tra kết nối và thử đăng nhập lại.');
    }
  }
  emit();

  const sparkOperations = spark ? createSparkOperations({db, dbSdk, auth, requireConnected, ownTank, ownSystem}) : null;
  const googleSignIn = createGoogleSignIn({ auth, authSdk, awaitSession, isActive: () => !disposed });
  return {
    ready,
    loginWithGoogle: () => execute(googleSignIn),
    login: (email, password) => execute(async () => {
      const credential = await authSdk.signInWithEmailAndPassword(auth, email.trim(), password);
      await awaitSession(credential.user);
      return credential;
    }),
    register: (name, email, password) => execute(async () => {
      const displayName = validateProfileName(name);
      const credential = await authSdk.createUserWithEmailAndPassword(auth, email.trim(), password);
      await awaitSession(credential.user);
      try {
        await authSdk.updateProfile(credential.user, { displayName });
        await dbSdk.runTransaction(dbSdk.ref(db, `users/${credential.user.uid}/profile`), current => current
          ? { ...current, displayName, updatedAt: dbSdk.serverTimestamp() }
          : { displayName, avatarPath: '', createdAt: dbSdk.serverTimestamp(), updatedAt: dbSdk.serverTimestamp() }, { applyLocally: false });
        return { registered: true };
      } catch {
        return { registered: true, profilePending: true };
      }
    }),
    resetPassword: email => execute(async () => {
      await authSdk.sendPasswordResetEmail(auth, email.trim()); return { sent: true };
    }),
    logout: () => execute(async () => { clearSession(); emit(); await authSdk.signOut(auth); }),
    createTank: data => execute(() => spark ? sparkOperations.createTank(data) : callable('createAquarium', validateTank(data))),
    updateTank: (id, data) => execute(async () => {
      if (spark) return sparkOperations.updateTank(id, data);
      ownTank(id);
      await dbSdk.update(dbSdk.ref(db, `aquariums/${id}/meta`), { ...validateTank(data), updatedAt: dbSdk.serverTimestamp() });
      return { updated: true };
    }),
    deleteTank: id => execute(() => { if (spark) return sparkOperations.deleteTank(id); ownTank(id); return callable('deleteAquarium', { tankId: id }); }),
    createSystem: (tankId, name) => execute(() => {
      if (spark) return sparkOperations.createSystem(tankId, name);
      ownTank(tankId); return callable('createSystem', { tankId, name: validateProfileName(name) });
    }),
    deleteSystem: (tankId, systemId) => execute(() => {
      if (spark) return sparkOperations.deleteSystem(tankId, systemId);
      ownSystem(tankId, systemId); return callable('deleteSystem', { tankId, systemId });
    }),
    pairDevice: (tankId, systemId, pairingCode) => execute(() => {
      if (spark) return sparkOperations.pairDevice(tankId, systemId);
      ownSystem(tankId, systemId);
      if (typeof pairingCode !== 'string' || !/^[A-Za-z0-9_-]{16,128}$/.test(pairingCode.trim())) throw userError('Mã ghép thiết bị chưa hợp lệ.');
      return callable('pairDevice', { tankId, systemId, pairingCode: pairingCode.trim() });
    }),
    setOutput: (tankId, systemId, key, value) => execute(async () => {
      validateOutput(key, value); physicalSystem(tankId, systemId);
      const user = requireUser(); const currentGeneration = generation;
      const token = await authSdk.getIdToken(user);
      if (currentGeneration !== generation || auth.currentUser?.uid !== user.uid) throw userError('Phiên đăng nhập đã thay đổi.');
      physicalSystem(tankId, systemId);
      await physicalWrite(`${hardwarePath(tankId, systemId)}/desired/${key}`, value, token);
      return { updated: true };
    }),
    sendCommand: (tankId, systemId, type, value) => execute(async () => {
      const system = physicalSystem(tankId, systemId);
      const parameters = validateCommand(type, value, system);
      const key = scope(tankId, systemId);
      if (commandReservations.has(key) || Object.entries(system.commands ?? {}).some(([id, command]) => commandState(command, system.acks?.[id], serverNow()).pending)) {
        throw userError('Vui lòng chờ lệnh hiện tại được xử lý.');
      }
      const user = requireUser(); const currentGeneration = generation;
      // Leave one second inside the rules' maximum TTL for clock-offset uncertainty.
      const commandLifetime = COMMAND_TTL_MS - 1000;
      const command = { id: crypto.randomUUID(), type, ...parameters, createdAt: serverNow(),
        expiresAt: serverNow() + commandLifetime, requestedBy: user.uid, clientStatus: 'sending' };
      let attempted = false;
      commandReservations.add(key); putLocalCommand(tankId, systemId, command);
      try {
        const token = await authSdk.getIdToken(user);
        if (currentGeneration !== generation || auth.currentUser?.uid !== user.uid) throw userError('Phiên đăng nhập đã thay đổi.');
        validateCommand(type, value, physicalSystem(tankId, systemId));
        command.createdAt = serverNow(); command.expiresAt = command.createdAt + commandLifetime;
        putLocalCommand(tankId, systemId, command);
        const payload = { id: command.id, type, ...parameters, createdAt: dbSdk.serverTimestamp(), expiresAt: command.expiresAt, requestedBy: user.uid };
        attempted = true;
        await physicalWrite(`${hardwarePath(tankId, systemId)}/commands/${command.id}`, payload, token, 10_000);
        if (currentGeneration === generation) putLocalCommand(tankId, systemId, { ...command, clientStatus: 'waiting' });
        return { id: command.id };
      } catch (error) {
        if (currentGeneration === generation) putLocalCommand(tankId, systemId, { ...command,
          clientStatus: !attempted || error.definitelyRejected ? 'error' : 'unknown',
          message: !attempted ? 'Chưa gửi được yêu cầu. Kiểm tra kết nối và thông tin điều khiển.' : 'Kết quả chưa được xác nhận. Không tự động gửi lại.' });
        throw error;
      } finally { if (currentGeneration === generation) commandReservations.delete(key); }
    }),
    saveConfig: (tankId, systemId, configData) => execute(async () => {
      ownSystem(tankId, systemId);
      const data = validateConfig(configData);
      await dbSdk.update(dbSdk.ref(db, `${hardwarePath(tankId, systemId)}/config`), data);
      return { updated: true };
    }),
    saveProfile: name => execute(async () => {
      const user = requireConnected(); const displayName = validateProfileName(name);
      await dbSdk.update(dbSdk.ref(db, `users/${user.uid}/profile`), { displayName, updatedAt: dbSdk.serverTimestamp() });
      await authSdk.updateProfile(user, { displayName }); return { updated: true };
    }),
    markRead: id => execute(async () => {
      const user = requireConnected(); validateId(id);
      if (state.notifications.some(item => item.id === id && item.readAt === 0)) {
        await dbSdk.set(dbSdk.ref(db, `notifications/${user.uid}/${id}/readAt`), dbSdk.serverTimestamp());
      }
      return { updated: true };
    }),
    markAllRead: () => execute(async () => {
      const user = requireConnected();
      const updates = Object.fromEntries(state.notifications.filter(item => item.readAt === 0).map(item => [`${item.id}/readAt`, dbSdk.serverTimestamp()]));
      if (Object.keys(updates).length) await dbSdk.update(dbSdk.ref(db, `notifications/${user.uid}`), updates);
      return { updated: true };
    }),
    dispose: async () => {
      if (disposed) return;
      disposed = true; clearSession(); unsubscribeAuth();
      for (const unsubscribe of rootListeners) unsubscribe();
      dbSdk.goOffline(db);
      await appSdk.deleteApp(app);
    },
  };
}
