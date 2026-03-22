import React, { useState } from 'react';
import { loginWithEmailAndPassword, resetPassword } from '../firebase';
import { openExternal, BLUEBIRD_DOCS_URL } from '../utils/openExternal';
import '../styles/Login.css';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resetSent, setResetSent] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setResetSent(false);
        setLoading(true);

        try {
            await loginWithEmailAndPassword(email, password);
        } catch (err) {
            if (err.code === 'auth/invalid-credential') {
                setError('Invalid email or password.');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Too many attempts. Please try again later.');
            } else {
                setError('Failed to sign in. Please try again.');
            }
        }
        setLoading(false);
    };

    const handleReset = async () => {
        if (!email) {
            setError('Enter your email address first.');
            return;
        }
        try {
            await resetPassword(email);
            setResetSent(true);
            setError('');
        } catch {
            setError('Failed to send reset email.');
        }
    };

    const handleCreateAccount = () => {
        openExternal(`${BLUEBIRD_DOCS_URL}/register`);
    };

    return (
        <div className="login">
            <div className="login__brand">
                <div className="login__orb" />
                <h1 className="login__title">Bluebird Focus</h1>
                <p className="login__subtitle">A quiet space for deep work</p>
            </div>

            <form className="login__form" onSubmit={handleLogin}>
                <input
                    type="email"
                    className="login__input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                    autoFocus
                />
                <input
                    type="password"
                    className="login__input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                />

                {error && <p className="login__error">{error}</p>}
                {resetSent && <p className="login__success">Reset email sent. Check your inbox.</p>}

                <button
                    type="submit"
                    className="login__btn login__btn--submit"
                    disabled={loading}
                >
                    {loading ? 'Signing in...' : 'Sign in'}
                </button>

                <div className="login__links">
                    <button
                        type="button"
                        className="login__link"
                        onClick={handleReset}
                    >
                        Forgot password?
                    </button>
                    <span className="login__link-divider">·</span>
                    <button
                        type="button"
                        className="login__link"
                        onClick={handleCreateAccount}
                    >
                        Create account
                    </button>
                </div>
            </form>

            <p className="login__footer">
                Sign in with your Bluebird account
            </p>
        </div>
    );
}

export default Login;
