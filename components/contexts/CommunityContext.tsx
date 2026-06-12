// ══════════════════════════════════════════════════════════════
//  components/contexts/CommunityContext.tsx
//  커뮤니티 뷰 상태를 _layout.tsx에서 읽기 위한 Context
// ══════════════════════════════════════════════════════════════
import React, { createContext, useContext, useState } from "react";

// "edit" 뷰 타입 추가 — 웹 Community.jsx와 동일하게 맞춤
type CommunityView = "list" | "register" | "edit" | "detail";

interface CommunityContextType {
  communityView: CommunityView;
  setCommunityView: (v: CommunityView) => void;
  communityTitle: string;
  setCommunityTitle: (t: string) => void;
}

const CommunityContext = createContext<CommunityContextType>({
  communityView: "list",
  setCommunityView: () => {},
  communityTitle: "",
  setCommunityTitle: () => {},
});

export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const [communityView, setCommunityView] = useState<CommunityView>("list");
  const [communityTitle, setCommunityTitle] = useState("");

  return (
    <CommunityContext.Provider
      value={{
        communityView,
        setCommunityView,
        communityTitle,
        setCommunityTitle,
      }}
    >
      {children}
    </CommunityContext.Provider>
  );
}

export function useCommunity() {
  return useContext(CommunityContext);
}
