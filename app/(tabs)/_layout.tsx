// ══════════════════════════════════════════════════════════════
//  app/(tabs)/_layout.tsx — Clean White 탭바 + AI 입력바 (수정본)
// ══════════════════════════════════════════════════════════════
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const ACTIVE_COLOR = "#7b6fff";
const INACTIVE_COLOR = "rgba(255,255,255,0.45)";
const BOTTOM_INSET = Platform.OS === "ios" ? 34 : 12;
const AI_BAR_HEIGHT = 44;
const TAB_ROW_HEIGHT = 56;
// 탭바 전체 높이 = 탭 아이콘 영역 + AI바 + safe area
const TAB_BAR_HEIGHT = TAB_ROW_HEIGHT + AI_BAR_HEIGHT + 8 + BOTTOM_INSET;

interface TabItem {
  name: string;
  title: string;
}

const TABS: TabItem[] = [
  { name: "index", title: "홈" },
  { name: "practice", title: "연습" },
  { name: "translate", title: "번역기" },
  { name: "dictionary", title: "수어사전" },
  { name: "community", title: "커뮤니티" },
  { name: "about", title: "About" },
];

// ── 탭 버튼 ───────────────────────────────────────────────────
function TabButton({
  focused,
  label,
  children,
  onPress,
  onLongPress,
}: {
  focused: boolean;
  label: string;
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const dotOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1.08 : 1,
        useNativeDriver: true,
        damping: 12,
        stiffness: 220,
      }),
      Animated.spring(translateY, {
        toValue: focused ? -2 : 0,
        useNativeDriver: true,
        damping: 12,
        stiffness: 220,
      }),
      Animated.timing(dotOpacity, {
        toValue: focused ? 1 : 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabButton}
      android_ripple={{ color: "transparent" }}
    >
      <Animated.View
        style={[styles.tabInner, { transform: [{ scale }, { translateY }] }]}
      >
        <View style={styles.iconWrapper}>{children}</View>
        <Text
          style={[
            styles.tabLabel,
            focused ? styles.tabLabelActive : styles.tabLabelInactive,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        <Animated.View style={[styles.activeDot, { opacity: dotOpacity }]} />
      </Animated.View>
    </Pressable>
  );
}

// ── AI 바 (탭바 위에 절대위치로 렌더) ─────────────────────────
export function AIBar() {
  return (
    <View style={styles.aiBarWrapper} pointerEvents="box-none">
      <View style={styles.aiInner}>
        <IconSymbol size={15} name="sparkles" color={ACTIVE_COLOR} />
        <Text style={styles.aiPlaceholder}>AI에게 무엇이든 물어보세요...</Text>
        <IconSymbol size={17} name="mic" color={INACTIVE_COLOR} />
      </View>
    </View>
  );
}

// ── 탭바 배경 ─────────────────────────────────────────────────
function TabBarBackground() {
  return (
    <View style={styles.tabBarContainer}>
      {Platform.OS === "ios" ? (
        <BlurView intensity={72} tint="dark" style={StyleSheet.absoluteFill} />
      ) : null}
      <View style={styles.bgOverlay} />
      <View style={styles.topBorder} />
    </View>
  );
}

// ── 레이아웃 ─────────────────────────────────────────────────
export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: styles.tabBarStyle,
          tabBarButton: (props) => {
            const tabItem = TABS.find((t) => t.name === route.name);
            return (
              <TabButton
                focused={props.accessibilityState?.selected ?? false}
                label={tabItem?.title ?? ""}
                onPress={props.onPress as any}
                onLongPress={props.onLongPress as any}
              >
                {props.children}
              </TabButton>
            );
          },
          tabBarBackground: () => <TabBarBackground />,
          tabBarActiveTintColor: ACTIVE_COLOR,
          tabBarInactiveTintColor: INACTIVE_COLOR,
          tabBarLabelStyle: { display: "none" },
          tabBarIconStyle: { marginBottom: 0 },
        })}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <IconSymbol
                size={focused ? 24 : 22}
                name="house.fill"
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="practice"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <IconSymbol
                size={focused ? 24 : 22}
                name="target"
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="translate"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <IconSymbol size={focused ? 24 : 22} name="globe" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="dictionary"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <IconSymbol
                size={focused ? 24 : 22}
                name="book.fill"
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="community"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <IconSymbol
                size={focused ? 24 : 22}
                name="person.2.fill"
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="about"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <IconSymbol
                size={focused ? 24 : 22}
                name="info.circle.fill"
                color={color}
              />
            ),
          }}
        />
      </Tabs>

      {/* AI 바: Tabs 바깥 View 위에 절대위치 → 탭 버튼보다 위에 렌더됨 */}
      <AIBar />
    </View>
  );
}

// ── 스타일 ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Tabs 컴포넌트 자체의 탭바 영역
  // paddingBottom으로 탭 아이콘이 AI바 위쪽에 자리잡게 함
  tabBarStyle: {
    position: "absolute",
    backgroundColor: "transparent",
    borderTopWidth: 0,
    elevation: 0,
    height: TAB_BAR_HEIGHT,
    paddingBottom: AI_BAR_HEIGHT + 8 + BOTTOM_INSET,
    paddingTop: 4,
  },

  // 배경 컨테이너
  tabBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: TAB_BAR_HEIGHT,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 20,
  },
  topBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.12)",
    zIndex: 10,
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor:
      Platform.OS === "ios" ? "rgba(0,0,0,0.78)" : "rgba(0,0,0,0.96)",
  },

  // 탭 버튼
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  tabInner: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  iconWrapper: {
    marginBottom: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  tabLabelActive: { color: ACTIVE_COLOR },
  tabLabelInactive: { color: INACTIVE_COLOR },
  activeDot: {
    marginTop: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: ACTIVE_COLOR,
  },

  // AI 바 — Tabs 바깥에서 절대위치로 렌더
  aiBarWrapper: {
    position: "absolute",
    bottom: BOTTOM_INSET + 6,
    left: 12,
    right: 12,
    height: AI_BAR_HEIGHT,
    zIndex: 100,
  },
  aiInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 14,
  },
  aiPlaceholder: {
    flex: 1,
    fontSize: 13,
    color: "rgba(255,255,255,0.35)",
    letterSpacing: -0.1,
  },
});
