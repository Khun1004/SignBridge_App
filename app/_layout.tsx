// app/_layout.tsx
import AppHeader from "@/components/AppHeader/AppHeader";
import { AuthProvider, useAuth } from "@/components/contexts/AuthContext";
import {
  CommunityProvider,
  useCommunity,
} from "@/components/contexts/CommunityContext";
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
  const { loggedIn, displayName, userEmail, orgType, login, logout } =
    useAuth();
  const { communityView, communityTitle, setCommunityView, setCommunityTitle } =
    useCommunity();

  const handleBack = () => {
    if (isCommunitySubView) {
      setCommunityView("list");
      setCommunityTitle("");
    } else {
      router.back();
    }
  };

  const currentTab = segments.includes("(tabs)")
    ? segments[segments.length - 1]
    : "";
  const isHome =
    segments.includes("(tabs)") &&
    (segments.length === 1 || currentTab === "index");
  const isMyPage = segments.includes("my");
  const isDemoPage = segments.includes("demopage") || segments.includes("demo");
  const isRegistration = segments.includes("registration");
  const isCommDetail = segments.includes("communitypersonaldetail");
  const isCommunitySubView =
    currentTab === "community" && communityView !== "list";
  const isBackHeader =
    isMyPage ||
    isDemoPage ||
    isRegistration ||
    isCommDetail ||
    isCommunitySubView;

  const [menuOpen, setMenuOpen] = useState(false);

  const getBackHeaderTitle = () => {
    if (isMyPage) return "마이페이지";
    if (isDemoPage) return "소통 데모 체험";
    if (isRegistration) return "프로필 등록";
    if (isCommDetail) return "프로필 상세";
    if (isCommunitySubView)
      return (
        communityTitle ||
        (communityView === "register" ? "프로필 등록" : "프로필 상세")
      );
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
        /* 마이페이지 / 데모 → 다크 헤더 */
        <View style={styles.myHeader}>
          <TouchableOpacity style={styles.myHeaderLeft} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="#a78bfa" />
            <Text style={styles.myHeaderTitle}>{getBackHeaderTitle()}</Text>
          </TouchableOpacity>
          <View style={styles.myHeaderRight}>
            {/* 검색 */}
            <TouchableOpacity
              style={styles.myHeaderIconBtn}
              onPress={() => router.navigate("/(tabs)/dictionary" as any)}
            >
              <Ionicons name="search-outline" size={22} color="#94a3b8" />
            </TouchableOpacity>
            {/* 알림 */}
            <TouchableOpacity
              style={styles.myHeaderIconBtn}
              onPress={() => Alert.alert("알림", "알림 센터를 엽니다.")}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color="#94a3b8"
              />
            </TouchableOpacity>
            {/* 홈 */}
            <TouchableOpacity
              style={styles.myHeaderIconBtn}
              onPress={() => {
                if (isCommunitySubView) {
                  setCommunityView("list");
                  setCommunityTitle("");
                }
                router.replace("/(tabs)/" as any);
              }}
            >
              <Ionicons name="home-outline" size={22} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>
      ) : isHome ? (
        /* 홈 → AppHeader */
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
          onLogin={(name, org, email) => login(name, org, email)}
          onLogout={() => {
            logout();
            router.replace("/(tabs)/" as any);
          }}
          onMyPage={goMyPage}
        />
      ) : (
        /* 서브 탭 → 딥 블루 헤더 */
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
          <Stack.Screen name="registration" />
          <Stack.Screen name="communitypersonaldetail" />
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        </Stack>
      </View>

      {/* ══ 홈 탭 — 플로팅 버튼 ══ */}
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
          {menuOpen && (
            <View style={styles.popupMenu}>
              <TouchableOpacity
                style={[styles.popupBtn, styles.popupCall]}
                onPress={goCall}
                activeOpacity={0.85}
              >
                <Ionicons name="call-outline" size={20} color="#fff" />
                <Text style={styles.popupLabel}>전화</Text>
              </TouchableOpacity>
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
      <AuthProvider>
        <CommunityProvider>
          <ScrollProvider>
            <AppShell />
          </ScrollProvider>
        </CommunityProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  body: { flex: 1 },

  // ── 마이페이지 / 데모 헤더 → 다크 ──
  myHeader: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#0f172a", // ← 딥 네이비 (블랙에 가까운)
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomWidth: 1,
    borderColor: "#1e293b",
    shadowColor: "#7c6fff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  myHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  myHeaderTitle: { fontSize: 18, fontWeight: "800", color: "#f1f5f9" },
  myHeaderRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  myHeaderIconBtn: { padding: 6 },

  // ── 서브 탭 헤더 ──
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

  // ── 케밥 메뉴 ──
  kebabWrap: {
    position: "absolute",
    right: 20,
    bottom: 160,
    alignItems: "flex-end",
  },
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
  popupMenu: { alignItems: "flex-end", gap: 8, marginBottom: 8 },
  popupCall: { backgroundColor: "#10b981" },
  popupChat: { backgroundColor: "#7c6fff" },
  popupRow: { flexDirection: "row", alignItems: "center", gap: 8 },
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
