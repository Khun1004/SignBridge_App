// app/_layout.tsx
import AppHeader from "@/components/AppHeader/AppHeader";
import {
  ScrollProvider,
  useScrollControl,
} from "@/components/contexts/ScrollContext";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

interface NotifItem {
  id: string;
  icon: string;
  text: string;
  time: string;
  unread: boolean;
}

const SAMPLE_NOTIFICATIONS: NotifItem[] = [
  {
    id: "1",
    icon: "🎉",
    text: "수어 번역 정확도가 98%를 달성했습니다!",
    time: "방금 전",
    unread: true,
  },
  {
    id: "2",
    icon: "📚",
    text: "새로운 수어 단어 50개가 추가되었습니다.",
    time: "1시간 전",
    unread: true,
  },
];

function AppShell() {
  const router = useRouter();
  const segments = useSegments() as string[];
  const { scrollUp, scrollDown } = useScrollControl();

  const isMyPage = segments.includes("my");
  const isDemoPage = segments.includes("demopage") || segments.includes("demo");
  const isBackHeader = isMyPage || isDemoPage;
  const currentTab = segments.includes("(tabs)")
    ? segments[segments.length - 1]
    : "";
  const isHome =
    segments.includes("(tabs)") &&
    (segments.length === 1 || currentTab === "index");

  // 케밥 메뉴 열림 상태
  const [menuOpen, setMenuOpen] = useState(false);

  const getBackHeaderTitle = () => {
    if (isMyPage) return "마이페이지";
    if (isDemoPage) return "소통 데모 체험";
    return "";
  };

  const getHeaderTitle = () => {
    switch (currentTab) {
      case "practice":
        return "연습하기";
      case "translate":
        return "수어 번역기";
      case "dictionary":
        return "수어 사전";
      case "community":
        return "커뮤니티";
      case "about":
        return "About";
      default:
        return "";
    }
  };

  const [loggedIn, setLoggedIn] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [orgType, setOrgType] = useState("");
  const [notifications] = useState<NotifItem[]>(SAMPLE_NOTIFICATIONS);

  const goMyPage = () => {
    router.navigate({
      pathname: "/my" as any,
      params: {
        displayName: displayName || "사용자",
        orgType: orgType || "일반",
        userEmail: userEmail || "",
      },
    });
  };

  const goChat = () => {
    setMenuOpen(false);
    router.replace("/(tabs)/translate" as any);
  };

  const goCall = () => {
    setMenuOpen(false);
    Alert.alert("알림", "전화 연결 기능은 준비 중입니다.");
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* ── 헤더 ── */}
      {isBackHeader ? (
        <View style={styles.myHeader}>
          <TouchableOpacity
            style={styles.myHeaderLeft}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#7c6fff" />
            <Text style={styles.myHeaderTitle}>{getBackHeaderTitle()}</Text>
          </TouchableOpacity>
          <View style={styles.myHeaderRight}>
            <TouchableOpacity
              style={styles.myHeaderIconBtn}
              onPress={() => Alert.alert("알림", "알림 센터를 엽니다.")}
            >
              <Ionicons name="notifications-outline" size={24} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.myHeaderIconBtn}
              onPress={() => router.replace("/(tabs)/" as any)}
            >
              <Ionicons name="home-outline" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      ) : isHome ? (
        <AppHeader
          loggedIn={loggedIn}
          displayName={displayName}
          notifications={notifications}
          onLogoPress={() => router.replace("/(tabs)/" as any)}
          onSearchSubmit={(text) => {
            router.navigate({
              pathname: "/(tabs)/dictionary" as any,
              params: { q: text },
            });
          }}
          onLogin={(name, org, email) => {
            setDisplayName(name || email.split("@")[0]);
            setUserEmail(email);
            setOrgType(org);
            setLoggedIn(true);
          }}
          onLogout={() => {
            setLoggedIn(false);
            setDisplayName("");
            setUserEmail("");
            setOrgType("");
            router.replace("/(tabs)/" as any);
          }}
          onMyPage={goMyPage}
        />
      ) : (
        <View style={styles.subHeader}>
          <Text style={styles.subHeaderTitle}>{getHeaderTitle()}</Text>
          <View style={styles.subHeaderRight}>
            <TouchableOpacity
              style={styles.subHeaderIconBtn}
              onPress={() => router.navigate("/(tabs)/dictionary" as any)}
            >
              <Ionicons name="search-outline" size={22} color="#ccc" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.subHeaderIconBtn}
              onPress={() => Alert.alert("알림", "새로운 알림이 없습니다.")}
            >
              <Ionicons name="notifications-outline" size={22} color="#ccc" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.subHeaderIconBtn}
              onPress={goMyPage}
            >
              {loggedIn ? (
                <View style={styles.myAvatar}>
                  <Text style={styles.myAvatarTxt}>
                    {displayName?.charAt(0)?.toUpperCase() || "U"}
                  </Text>
                </View>
              ) : (
                <Ionicons name="person-circle-outline" size={26} color="#ccc" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── 본문 ── */}
      <View style={styles.body}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="my" />
          <Stack.Screen name="demopage" />
          <Stack.Screen name="demo" />
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        </Stack>
      </View>

      {/* ══ 홈 탭 — 기존 플로팅 버튼 ══ */}
      {isHome && (
        <View style={styles.floatingSidebar}>
          <TouchableOpacity
            style={styles.fsbArrowBtn}
            onPress={scrollUp}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-up"
              size={16}
              color="rgba(255,255,255,0.85)"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fsbBtn, styles.fsbChat]}
            onPress={goChat}
            activeOpacity={0.8}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={22}
              color="#fff"
            />
            <Text style={styles.fsbLabel}>채팅</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fsbBtn, styles.fsbCall]}
            onPress={goCall}
            activeOpacity={0.8}
          >
            <Ionicons name="call-outline" size={22} color="#fff" />
            <Text style={styles.fsbLabel}>전화</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fsbArrowBtn}
            onPress={scrollDown}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-down"
              size={16}
              color="rgba(255,255,255,0.85)"
            />
          </TouchableOpacity>
        </View>
      )}

      {/* ══ 다른 탭 — 케밥 메뉴 ══ */}
      {!isHome && !isBackHeader && (
        <View style={styles.kebabWrap}>
          {/* 팝업 메뉴 (열렸을 때) */}
          {menuOpen && (
            <View style={styles.popupMenu}>
              {/* 전화 버튼 (위쪽) */}
              <TouchableOpacity
                style={[styles.popupBtn, styles.popupCall]}
                onPress={goCall}
                activeOpacity={0.85}
              >
                <Ionicons name="call-outline" size={20} color="#fff" />
                <Text style={styles.popupLabel}>전화</Text>
              </TouchableOpacity>

              {/* 하단 행: 채팅(왼쪽) + 닫기(오른쪽) */}
              <View style={styles.popupRow}>
                <TouchableOpacity
                  style={[styles.popupBtn, styles.popupChat]}
                  onPress={goChat}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.popupLabel}>채팅</Text>
                </TouchableOpacity>

                {/* ✕ 닫기 */}
                <TouchableOpacity
                  style={styles.kebabBtn}
                  onPress={() => setMenuOpen(false)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="close" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 케밥 아이콘 (닫혔을 때만) */}
          {!menuOpen && (
            <TouchableOpacity
              style={styles.kebabBtn}
              onPress={() => setMenuOpen(true)}
              activeOpacity={0.85}
            >
              <View style={styles.kebabDots}>
                <View style={styles.kebabDot} />
                <View style={styles.kebabDot} />
                <View style={styles.kebabDot} />
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ScrollProvider>
        <AppShell />
      </ScrollProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  body: { flex: 1 },

  subHeader: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    backgroundColor: "#1e3a8a",
    borderBottomWidth: 1,
    borderBottomColor: "#1d4ed8",
  },
  subHeaderTitle: { fontSize: 18, fontWeight: "700", color: "#ffffff" },
  subHeaderRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  subHeaderIconBtn: { padding: 4 },
  myAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#7c6fff",
    alignItems: "center",
    justifyContent: "center",
  },
  myAvatarTxt: { fontSize: 12, fontWeight: "800", color: "#fff" },

  myHeader: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8f0",
  },
  myHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 4 },
  myHeaderTitle: { fontSize: 19, fontWeight: "800", color: "#1a1a2e" },
  myHeaderRight: { flexDirection: "row", alignItems: "center", gap: 16 },
  myHeaderIconBtn: { padding: 4 },

  // ── 홈 플로팅 사이드바 ──
  floatingSidebar: {
    position: "absolute",
    right: 16,
    top: "50%",
    marginTop: -92,
    alignItems: "center",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  fsbArrowBtn: {
    width: 52,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(100,88,220,0.75)",
  },
  fsbBtn: {
    width: 52,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  fsbChat: { backgroundColor: "#7c6fff" },
  fsbCall: { backgroundColor: "#10b981" },
  fsbLabel: { fontSize: 10, fontWeight: "700", color: "#fff", marginTop: 2 },

  // ── 케밥 메뉴 래퍼 (우측 하단) ──
  kebabWrap: {
    position: "absolute",
    right: 20,
    bottom: 160,
    alignItems: "flex-end",
  },

  // 케밥 버튼 (⋮)
  kebabBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#7c6fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  kebabDots: { gap: 3.5, alignItems: "center" },
  kebabDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#fff" },

  // 팝업 메뉴
  popupMenu: { alignItems: "flex-end", gap: 8, marginBottom: 8 },

  // 전화 (위)
  popupCall: { backgroundColor: "#10b981" },

  // 채팅 (왼쪽)
  popupChat: { backgroundColor: "#7c6fff" },

  // 하단 행 (채팅 + 닫기)
  popupRow: { flexDirection: "row", alignItems: "center", gap: 8 },

  // 공통 팝업 버튼
  popupBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  popupLabel: { fontSize: 9, fontWeight: "700", color: "#fff", marginTop: 1 },
});
