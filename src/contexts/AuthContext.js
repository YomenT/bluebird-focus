import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const API_BASE = 'https://bluebirddocumentationadmin.pythonanywhere.com';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser && firebaseUser.emailVerified) {
                setUser(firebaseUser);
                const idToken = await firebaseUser.getIdToken();
                setToken(idToken);
            } else {
                setUser(null);
                setToken(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const getToken = useCallback(async () => {
        if (auth.currentUser) {
            const idToken = await auth.currentUser.getIdToken();
            setToken(idToken);
            return idToken;
        }
        return null;
    }, []);

    const apiCall = useCallback(async (path, options = {}, _retried = false) => {
        const idToken = await getToken();
        if (!idToken) throw new Error('Not authenticated');

        const response = await fetch(`${API_BASE}${path}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': idToken,
                'Requesting-User-Uid': auth.currentUser.uid,
                ...options.headers,
            },
        });

        // Handle clock skew: retry once after delay on 401
        if (response.status === 401 && !_retried) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            return apiCall(path, options, true);
        }

        return response;
    }, [getToken]);

    const value = {
        user,
        token,
        loading,
        apiCall,
        getToken,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
