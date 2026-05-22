// src/contexts/SessionContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  const [session, setSession] = useState(null);     // JWT user
  const [loadingSession, setLoadingSession] = useState(true);
  const [sessionError, setSessionError] = useState(null);

  const { loading: loadingUser, jwtUser } = useUser();

  useEffect(() => {
    // Single-request boot: Session is derived from /user (UserProvider).
    // Avoid an extra /auth/verify call.
    if (loadingUser) return;
    setSessionError(null);
    setSession(jwtUser || null);
    setLoadingSession(false);
  }, [loadingUser, jwtUser]);



  const clearSession = () => setSession(null);

  return (
    <SessionContext.Provider
      value={{
        session,
        loadingSession,
        sessionError,
        reloadSession: () => {}, // kept for compatibility; UserProvider refreshUser should be used
        clearSession,

      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used inside SessionProvider");
  }
  return ctx;
};
