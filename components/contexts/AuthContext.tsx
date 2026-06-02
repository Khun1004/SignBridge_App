// ══════════════════════════════════════════════════════════════
//  components/contexts/AuthContext.tsx
//  앱 전체에서 로그인 상태를 공유하는 Context
// ══════════════════════════════════════════════════════════════
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthState {
  loggedIn: boolean;
  userEmail: string;
  displayName: string;
  orgType: string;
  login: (name: string, org: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  loggedIn: false,
  userEmail: "",
  displayName: "",
  orgType: "",
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [orgType, setOrgType] = useState("");

  // 앱 시작 시 저장된 로그인 정보 복원
  useEffect(() => {
    (async () => {
      try {
        const email = await AsyncStorage.getItem("userEmail");
        const name = await AsyncStorage.getItem("displayName");
        const org = await AsyncStorage.getItem("orgType");
        if (email) {
          setUserEmail(email);
          setDisplayName(name || "");
          setOrgType(org || "");
          setLoggedIn(true);
        }
      } catch {}
    })();
  }, []);

  const login = async (name: string, org: string, email: string) => {
    const n = name || email.split("@")[0];
    setDisplayName(n);
    setUserEmail(email);
    setOrgType(org);
    setLoggedIn(true);
    await AsyncStorage.setItem("userEmail", email);
    await AsyncStorage.setItem("displayName", n);
    await AsyncStorage.setItem("orgType", org);
  };

  const logout = async () => {
    setLoggedIn(false);
    setDisplayName("");
    setUserEmail("");
    setOrgType("");
    await AsyncStorage.multiRemove(["userEmail", "displayName", "orgType"]);
  };

  return (
    <AuthContext.Provider
      value={{ loggedIn, userEmail, displayName, orgType, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
