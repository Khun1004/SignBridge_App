// ══════════════════════════════════════════════════════════════
//  AppHeader.tsx — 알림 버튼 → /noti 페이지로 이동
// ══════════════════════════════════════════════════════════════
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import LoginScreen from "../Login/LoginScreen";
import SignupScreen from "../SignUp/SignupScreen";

const C = {
  accent: "#7c6fff",
  accentLt: "#6c5ce7",
  text: "#1a1a2e",
  sub: "#666",
  border: "#e0dff8",
  bg: "#f5f3ff",
  surface: "#ece9ff",
  red: "#ef4444",
};

const ROW1_H = 52;
const ROW2_H = 44;

interface NotifItem {
  id: string;
  icon: string;
  text: string;
  time: string;
  unread: boolean;
}

interface AppHeaderProps {
  loggedIn: boolean;
  displayName: string;
  notifications: NotifItem[];
  onSearchSubmit?: (text: string) => void;
  onLogin?: (name: string, orgType: string, email: string) => void;
  onLogout?: () => void;
  onMyPage?: () => void;
  onLogoPress?: () => void;
  onNoti?: () => void; // ★ 알림 페이지 이동 콜백
}

export default function AppHeader({
  loggedIn,
  displayName,
  notifications = [],
  onSearchSubmit,
  onLogin,
  onLogout,
  onMyPage,
  onLogoPress,
  onNoti, // ★ 추가
}: AppHeaderProps) {
  const router = useRouter();
  const [signedUpName, setSignedUpName] = useState("");
  const [authModal, setAuthModal] = useState<"login" | "signup" | null>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;
  const navLabel =
    displayName.length > 5 ? displayName.slice(0, 5) + "…" : displayName;

  const handleLoginSuccess = (name: string, orgType: string, email: string) => {
    setAuthModal(null);
    onLogin?.(name, orgType, email);
  };

  const handleSearchPress = () => {
    router.navigate("/search" as any);
  };

  // ★ 알림 버튼: onNoti prop 우선, 없으면 /noti 직접 이동
  const handleNotiPress = () => {
    if (onNoti) {
      onNoti();
    } else {
      router.navigate("/noti" as any);
    }
  };

  return (
    <>
      <View style={s.wrapper}>
        {/* 상단 보라 포인트 라인 */}
        <View style={s.accentLine} />

        {/* ─── 1행 ─── */}
        <View style={s.row1}>
          <TouchableOpacity
            style={s.logo}
            onPress={onLogoPress}
            activeOpacity={0.75}
          >
            <Image
              source={require("../../assets/images/SignBridge.png")}
              style={s.logoImage}
              resizeMode="contain"
            />
            <Text style={s.logoTxt}>SignBridge</Text>
          </TouchableOpacity>

          <View style={s.actions}>
            {loggedIn ? (
              <View style={s.authGroup}>
                <TouchableOpacity
                  style={s.myBtn}
                  onPress={onMyPage}
                  activeOpacity={0.75}
                >
                  <Text style={s.myTxt} numberOfLines={1}>
                    {navLabel}님
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.logoutBtn}
                  onPress={onLogout}
                  activeOpacity={0.75}
                >
                  <Text style={s.logoutTxt}>로그아웃</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.myIconBtn}
                  onPress={onMyPage}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={C.accentLt}
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={s.authGroup}>
                <TouchableOpacity
                  style={s.loginBtn}
                  onPress={() => setAuthModal("login")}
                  activeOpacity={0.75}
                >
                  <Text style={s.loginTxt}>로그인</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.signupBtn}
                  onPress={() => setAuthModal("signup")}
                  activeOpacity={0.75}
                >
                  <Text style={s.signupTxt}>회원가입</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* ─── 2행 ─── */}
        <View style={s.row2}>
          {/* 검색바 — 터치하면 /search 로 이동 */}
          <TouchableOpacity
            style={s.search}
            onPress={handleSearchPress}
            activeOpacity={0.85}
          >
            <Ionicons
              name="search"
              size={15}
              color="#bbb"
              style={s.searchLeadIcon}
            />
            <Text style={s.searchPlaceholder}>수어 단어를 검색하세요...</Text>
          </TouchableOpacity>

          {/* ★ 알림 버튼 — 터치하면 /noti 로 이동 */}
          <TouchableOpacity
            style={[s.icoBtn, unreadCount > 0 && s.icoBtnOn]}
            onPress={handleNotiPress}
            activeOpacity={0.75}
          >
            <Ionicons
              name="notifications-outline"
              size={18}
              color={unreadCount > 0 ? C.accent : C.sub}
            />
            {unreadCount > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeTxt}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <LoginScreen
        visible={authModal === "login"}
        onClose={() => setAuthModal(null)}
        onLogin={handleLoginSuccess}
        onSwitchToSignup={() => setAuthModal("signup")}
      />
      <SignupScreen
        visible={authModal === "signup"}
        onClose={() => setAuthModal(null)}
        onSignedUpName={(n) => setSignedUpName(n)}
        onSwitchToLogin={() => setAuthModal("login")}
      />
    </>
  );
}

const s = StyleSheet.create({
  wrapper: {
    backgroundColor: C.bg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: "#c4b5fd",
    shadowColor: "#7c6fff",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 200,
    overflow: "hidden",
  },
  accentLine: {
    height: 2,
    backgroundColor: C.accent,
    opacity: 0.8,
  },
  row1: {
    height: ROW1_H,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    gap: 10,
  },
  row2: {
    height: ROW2_H,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  logo: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 0 },
  logoImage: { width: 38, height: 38, borderRadius: 10 },
  logoTxt: {
    fontWeight: "700",
    fontSize: 17,
    color: C.accent,
    letterSpacing: -0.3,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  authGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  myBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: C.accent,
    backgroundColor: "rgba(124,111,255,0.15)",
    maxWidth: 90,
  },
  myTxt: { fontSize: 12, fontWeight: "700", color: C.accent },
  myIconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: C.accent,
    backgroundColor: "rgba(124,111,255,0.15)",
  },
  logoutBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#fca5a5",
    backgroundColor: "#fff1f1",
  },
  logoutTxt: { fontSize: 12, fontWeight: "700", color: "#ef4444" },
  loginBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#c4b5fd",
    backgroundColor: "#ede9fe",
  },
  loginTxt: { fontSize: 12, fontWeight: "700", color: "#6c5ce7" },
  signupBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: C.accent,
  },
  signupTxt: { fontSize: 12, fontWeight: "700", color: "#fff" },
  icoBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#c4b5fd",
    backgroundColor: "#ede9fe",
  },
  icoBtnOn: {
    borderColor: C.accent,
    backgroundColor: "rgba(124,111,255,0.12)",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 17,
    height: 17,
    backgroundColor: C.red,
    borderRadius: 20,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  badgeTxt: { color: "#fff", fontSize: 9, fontWeight: "700" },

  search: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#d4ccff",
    borderRadius: 10,
    overflow: "hidden",
    flex: 1,
    paddingVertical: 7,
  },
  searchLeadIcon: { paddingLeft: 10 },
  searchPlaceholder: {
    flex: 1,
    paddingLeft: 8,
    fontSize: 13,
    color: "#aaa",
  },
});
