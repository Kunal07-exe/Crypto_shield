import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('cs_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('cs_token') || null);
  const [portalMode, setPortalModeState] = useState(() => localStorage.getItem('cs_portal') || 'investigator');

  const setPortalMode = useCallback((mode) => {
    setPortalModeState(mode);
    localStorage.setItem('cs_portal', mode);
  }, []);

  const loginInvestigator = useCallback((userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    setPortalModeState('investigator');
    localStorage.setItem('cs_user', JSON.stringify(userData));
    localStorage.setItem('cs_token', authToken);
    localStorage.setItem('cs_portal', 'investigator');
  }, []);

  const loginWallet = useCallback((walletData, authToken) => {
    setUser(walletData);
    setToken(authToken);
    setPortalModeState('user');
    localStorage.setItem('cs_user', JSON.stringify(walletData));
    localStorage.setItem('cs_token', authToken);
    localStorage.setItem('cs_portal', 'user');
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setPortalModeState('investigator');
    localStorage.removeItem('cs_user');
    localStorage.removeItem('cs_token');
    localStorage.removeItem('cs_portal');
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      portalMode,
      setPortalMode,
      loginInvestigator,
      loginWallet,
      logout,
      isAuthenticated: !!token
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
