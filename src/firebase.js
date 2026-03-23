// Firebase Auth via REST API — avoids the Firebase JS SDK's gapi/iframe
// machinery which is blocked when the app origin is tauri://localhost.
const API_KEY = 'AIzaSyCXp9s1vBlm1HnAf4tC83g5AbfabBy0F2U';
const SIGN_IN_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
const LOOKUP_URL  = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`;
const REFRESH_URL = `https://securetoken.googleapis.com/v1/token?key=${API_KEY}`;
const RESET_URL   = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${API_KEY}`;
const STORAGE_KEY = 'bb_focus_refresh_token';

// In-memory auth state — callbacks registered by onAuthStateChanged
let _currentUser = null;
let _listeners   = [];
let _initialized = false;

function _notify(user) {
    _currentUser = user;
    if (user) {
        localStorage.setItem(STORAGE_KEY, user._refreshToken);
    } else {
        localStorage.removeItem(STORAGE_KEY);
    }
    _listeners.forEach(fn => fn(user));
}

function _buildUserObj(localId, email, emailVerified, idToken, refreshToken, expiresIn) {
    const expiresAt = Date.now() + parseInt(expiresIn, 10) * 1000;
    return {
        uid: localId,
        email,
        emailVerified: emailVerified ?? false,
        _idToken: idToken,
        _refreshToken: refreshToken,
        _expiresAt: expiresAt,
        getIdToken: async (forceRefresh = false) => {
            if (forceRefresh || Date.now() > _currentUser._expiresAt - 60_000) {
                await _refreshIdToken();
            }
            return _currentUser._idToken;
        },
    };
}

async function _refreshIdToken() {
    if (!_currentUser?._refreshToken) return;
    const res = await fetch(REFRESH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=refresh_token&refresh_token=${_currentUser._refreshToken}`,
    });
    const data = await res.json();
    if (!res.ok) { _notify(null); return; }
    _currentUser._idToken      = data.id_token;
    _currentUser._refreshToken = data.refresh_token;
    _currentUser._expiresAt    = Date.now() + parseInt(data.expires_in, 10) * 1000;
    localStorage.setItem(STORAGE_KEY, data.refresh_token);
}

// On startup, restore session from a persisted refresh token
async function _restoreSession() {
    const savedRefreshToken = localStorage.getItem(STORAGE_KEY);
    if (!savedRefreshToken) return null;

    const res = await fetch(REFRESH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=refresh_token&refresh_token=${savedRefreshToken}`,
    });
    const data = await res.json();
    if (!res.ok) { localStorage.removeItem(STORAGE_KEY); return null; }

    // Fetch profile to get emailVerified
    const lookup = await fetch(LOOKUP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: data.id_token }),
    });
    const profile = await lookup.json();
    const user = profile.users?.[0];
    if (!user) { localStorage.removeItem(STORAGE_KEY); return null; }

    return _buildUserObj(
        data.user_id, user.email, user.emailVerified,
        data.id_token, data.refresh_token, data.expires_in
    );
}

// Public surface used by AuthContext
export const auth = {
    get currentUser() { return _currentUser; },
};

export function onAuthStateChanged(authObj, callback) {
    _listeners.push(callback);

    if (!_initialized) {
        _initialized = true;
        _restoreSession().then(user => {
            _currentUser = user;
            if (user) localStorage.setItem(STORAGE_KEY, user._refreshToken);
            _listeners.forEach(fn => fn(user));
        });
    } else {
        callback(_currentUser);
    }

    return () => {
        _listeners = _listeners.filter(fn => fn !== callback);
    };
}

export async function loginWithEmailAndPassword(email, password) {
    const res = await fetch(SIGN_IN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Login failed');

    const lookup = await fetch(LOOKUP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: data.idToken }),
    });
    const profile = await lookup.json();
    const user = profile.users?.[0];
    if (!user) throw new Error('Could not retrieve user profile');

    _notify(_buildUserObj(
        data.localId, data.email, user.emailVerified,
        data.idToken, data.refreshToken, data.expiresIn
    ));
}

export async function resetPassword(email) {
    const res = await fetch(RESET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestType: 'PASSWORD_RESET', email }),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Password reset failed');
    }
}

export async function logout() {
    _notify(null);
}
