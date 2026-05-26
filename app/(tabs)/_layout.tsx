// ══════════════════════════════════════════════════════════════
//  app/(tabs)/_layout.tsx
//  변경점:
//    · community 탭 추가 (커뮤니티)
//    · my 탭 제거 → 마이페이지는 AppHeader로 이동
// ══════════════════════════════════════════════════════════════
import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";

const ACCENT = "#7c6fff";
const SUB = "#888888";
const BORDER = "#e8e8f0";
const BG = "#ffffff";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: ACCENT,
        tabBarInactiveTintColor: SUB,
        tabBarStyle: {
          backgroundColor: BG,
          borderTopWidth: 1,
          borderTopColor: BORDER,
          height: Platform.OS === "ios" ? 84 : 64,
          paddingBottom: Platform.OS === "ios" ? 24 : 10,
          paddingTop: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: -0.2,
          marginTop: 2,
        },
      }}
    >
      {/* ── 홈 ── */}
      <Tabs.Screen
        name="index"
        options={{
          title: "홈",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={focused ? 26 : 24}
              name="house.fill"
              color={color}
            />
          ),
        }}
      />

      {/* ── 연습하기 ── */}
      <Tabs.Screen
        name="practice"
        options={{
          title: "연습",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={focused ? 26 : 24} name="target" color={color} />
          ),
        }}
      />

      {/* ── 번역기 ── */}
      <Tabs.Screen
        name="translate"
        options={{
          title: "번역기",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={focused ? 26 : 24} name="globe" color={color} />
          ),
        }}
      />

      {/* ── 수어사전 ── */}
      <Tabs.Screen
        name="dictionary"
        options={{
          title: "수어사전",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={focused ? 26 : 24}
              name="book.fill"
              color={color}
            />
          ),
        }}
      />

      {/* ── 커뮤니티 (신규) ── */}
      <Tabs.Screen
        name="community"
        options={{
          title: "커뮤니티",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={focused ? 26 : 24}
              name="person.2.fill"
              color={color}
            />
          ),
        }}
      />

      {/* ── About ── */}
      <Tabs.Screen
        name="about"
        options={{
          title: "About",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={focused ? 26 : 24}
              name="info.circle.fill"
              color={color}
            />
          ),
        }}
      />

      {/* my 탭 제거 → 마이페이지는 AppHeader 아바타 버튼으로 접근 */}
    </Tabs>
  );
}
