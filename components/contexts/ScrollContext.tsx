// contexts/ScrollContext.tsx
import React, { createContext, useContext, useRef } from "react";
import { ScrollView } from "react-native";

interface ScrollContextType {
  registerScroll: (ref: ScrollView | null) => void;
  scrollUp: () => void;
  scrollDown: () => void;
  updateY: (y: number) => void;
}

const ScrollContext = createContext<ScrollContextType>({
  registerScroll: () => {},
  scrollUp: () => {},
  scrollDown: () => {},
  updateY: () => {},
});

export function ScrollProvider({ children }: { children: React.ReactNode }) {
  const scrollViewRef = useRef<ScrollView | null>(null);
  const currentY = useRef(0);
  const STEP = 300;

  const registerScroll = (ref: ScrollView | null) => {
    scrollViewRef.current = ref;
    currentY.current = 0;
  };

  const updateY = (y: number) => {
    currentY.current = y;
  };

  const scrollUp = () => {
    if (!scrollViewRef.current) return;
    const next = Math.max(0, currentY.current - STEP);
    currentY.current = next;
    scrollViewRef.current.scrollTo({ y: next, animated: true });
  };

  const scrollDown = () => {
    if (!scrollViewRef.current) return;
    const next = currentY.current + STEP;
    currentY.current = next;
    scrollViewRef.current.scrollTo({ y: next, animated: true });
  };

  return (
    <ScrollContext.Provider
      value={{ registerScroll, scrollUp, scrollDown, updateY }}
    >
      {children}
    </ScrollContext.Provider>
  );
}

export const useScrollControl = () => useContext(ScrollContext);
