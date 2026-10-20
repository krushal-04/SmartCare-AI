import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const AuthContext = createContext(null);

export const AUTH_STORAGE_KEY_TOKEN = "token";
export const AUTH_STORAGE_KEY_USER = "user";
export const AUTH_EVENT_NAME = "smartcare-auth-changed";

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => {
        try {
            return localStorage.getItem(AUTH_STORAGE_KEY_TOKEN) || null;
        } catch {
            return null;
        }
    });

    const [user, setUser] = useState(() => {
        try {
            const raw = localStorage.getItem(AUTH_STORAGE_KEY_USER);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    });

    const [loading] = useState(false);

    const syncFromStorage = useCallback(() => {
        try {
            const curToken = localStorage.getItem(AUTH_STORAGE_KEY_TOKEN) || null;
            const curUserRaw = localStorage.getItem(AUTH_STORAGE_KEY_USER);
            const curUser = curUserRaw ? JSON.parse(curUserRaw) : null;

            setToken(curToken);
            setUser(curUser);
        } catch {
            setToken(null);
            setUser(null);
        }
    }, []);

    useEffect(() => {
        const handleStorage = () => syncFromStorage();
        window.addEventListener("storage", handleStorage);
        window.addEventListener(AUTH_EVENT_NAME, handleStorage);

        return () => {
            window.removeEventListener("storage", handleStorage);
            window.removeEventListener(AUTH_EVENT_NAME, handleStorage);
        };
    }, [syncFromStorage]);

    const login = useCallback((newToken, newUser) => {
        try {
            localStorage.setItem(AUTH_STORAGE_KEY_TOKEN, newToken);
            localStorage.setItem(AUTH_STORAGE_KEY_USER, JSON.stringify(newUser));
        } catch (e) {
            console.error("Failed to write auth to localStorage", e);
        }
        setToken(newToken);
        setUser(newUser);
        window.dispatchEvent(new Event(AUTH_EVENT_NAME));
    }, []);

    const logout = useCallback(() => {
        try {
            localStorage.removeItem(AUTH_STORAGE_KEY_TOKEN);
            localStorage.removeItem(AUTH_STORAGE_KEY_USER);
        } catch (e) {
            console.error("Failed to clear auth from localStorage", e);
        }
        setToken(null);
        setUser(null);
        window.dispatchEvent(new Event(AUTH_EVENT_NAME));
    }, []);

    const updateUser = useCallback((updatedUserData) => {
        setUser((prev) => {
            const merged = { ...prev, ...updatedUserData };
            try {
                localStorage.setItem(AUTH_STORAGE_KEY_USER, JSON.stringify(merged));
            } catch (e) {
                console.error("Failed to update user in localStorage", e);
            }
            return merged;
        });
        window.dispatchEvent(new Event(AUTH_EVENT_NAME));
    }, []);

    const role = user?.role || null;
    const isAuthenticated = Boolean(token && user);

    const value = {
        token,
        user,
        role,
        isAuthenticated,
        loading,
        login,
        logout,
        updateUser,
        refreshAuth: syncFromStorage,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        // Fallback if accessed outside of provider
        try {
            const curToken = localStorage.getItem(AUTH_STORAGE_KEY_TOKEN) || null;
            const curUserRaw = localStorage.getItem(AUTH_STORAGE_KEY_USER);
            const curUser = curUserRaw ? JSON.parse(curUserRaw) : null;
            return {
                token: curToken,
                user: curUser,
                role: curUser?.role || null,
                isAuthenticated: Boolean(curToken && curUser),
                loading: false,
                login: () => {},
                logout: () => {},
                updateUser: () => {},
                refreshAuth: () => {},
            };
        } catch {
            return {
                token: null,
                user: null,
                role: null,
                isAuthenticated: false,
                loading: false,
                login: () => {},
                logout: () => {},
                updateUser: () => {},
                refreshAuth: () => {},
            };
        }
    }
    return context;
}

export default AuthContext;
