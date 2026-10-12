// Firebase profile names must fit the 80-character Rules boundary, including
// names supplied by an identity provider rather than the website's form.
export function authProfileName(user) {
  for (const value of [user?.displayName, user?.email?.split('@')[0], 'Người dùng']) {
    if (typeof value !== 'string' || !value.trim()) continue;
    let name = '';
    for (const character of value.trim()) {
      if (name.length + character.length > 80) break;
      name += character;
    }
    if (name) return name;
  }
  return 'Người dùng';
}

export function createGoogleSignIn({ auth, authSdk, awaitSession, isActive = () => true }) {
  const provider = new authSdk.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  let pending = false;
  return function loginWithGoogle() {
    if (!isActive()) return Promise.reject(new Error('Kết nối đã đóng. Hãy tải lại trang.'));
    if (pending) return Promise.reject(Object.assign(new Error(), { code: 'auth/cancelled-popup-request' }));
    pending = true;
    let popup;
    try {
      // Open from the button's user gesture; never await imports or persistence
      // before this call. Redirect needs a different hosting configuration.
      popup = authSdk.signInWithPopup(auth, provider);
    } catch (error) {
      pending = false;
      return Promise.reject(error);
    }
    return Promise.resolve(popup).then(async result => {
      await awaitSession(result.user);
      // Firebase creates a user on the first Google sign-in. The session creates
      // its owner profile; no OAuth access token is copied into application data.
      return { isNewUser: authSdk.getAdditionalUserInfo(result)?.isNewUser === true };
    }).finally(() => { pending = false; });
  };
}
