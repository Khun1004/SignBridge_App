// ══════════════════════════════════════════════════════════════
//  AppHeader.tsx — 상태 충돌 버그 수정본
// ══════════════════════════════════════════════════════════════
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import LoginScreen from "../Login/LoginScreen";
import SignupScreen from "../SignUp/SignupScreen";

const C = {
  accent: "#7c6fff",
  text: "#1a1a2e",
  sub: "#666",
  border: "#e8e8f0",
  bg: "#ffffff",
  searchBg: "#f4f4f8",
  red: "#ef4444",
};

const ROW1_H = 52;
const ROW2_H = 44;
const HEADER_H = ROW1_H + ROW2_H;

interface NotifItem {
  id: string;
  icon: string;
  text: string;
  time: string;
  unread: boolean;
}

interface AppHeaderProps {
  loggedIn: boolean; // 부모의 상태를 직접 받음
  displayName: string;
  notifications: NotifItem[];
  onSearchSubmit?: (text: string) => void;
  onLogin?: (name: string, orgType: string, email: string) => void;
  onLogout?: () => void;
  onMyPage?: () => void;
  onLogoPress?: () => void;
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
}: AppHeaderProps) {
  const [signedUpName, setSignedUpName] = useState("");
  const [searchText, setSearchText] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [authModal, setAuthModal] = useState<"login" | "signup" | null>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;
  const navLabel =
    displayName.length > 5 ? displayName.slice(0, 5) + "…" : displayName;

  const handleSearch = () => {
    if (onSearchSubmit && searchText.trim()) onSearchSubmit(searchText.trim());
  };

  const handleLoginSuccess = (name: string, orgType: string, email: string) => {
    setAuthModal(null);
    if (onLogin) onLogin(name, orgType, email);
  };

  return (
    <>
      <View style={s.wrapper}>
        {/* ─── 1행: 로고 + 액션 ─── */}
        <View style={s.row1}>
          <TouchableOpacity
            style={s.logo}
            onPress={onLogoPress}
            activeOpacity={0.75}
          >
            <View style={s.logoBox}>
              <Text style={s.logoIco}>SB</Text>
            </View>
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
                  <Ionicons name="person-outline" size={18} color={C.accent} />
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

        {/* ─── 2행: 검색바 + 알림 ─── */}
        <View style={s.row2}>
          <View style={[s.search, searchFocused && s.searchFoc]}>
            <Ionicons
              name="search"
              size={15}
              color={searchFocused ? C.accent : "#bbb"}
              style={s.searchLeadIcon}
            />
            <TextInput
              style={s.searchInp}
              placeholder="수어 단어를 검색하세요..."
              placeholderTextColor="#bbb"
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            {searchText.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchText("")}
                style={s.searchClearBtn}
              >
                <Ionicons name="close-circle" size={15} color="#bbb" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleSearch} style={s.searchBtn}>
              <Text style={s.searchBtnTxt}>검색</Text>
            </TouchableOpacity>
          </View>

          <View>
            <TouchableOpacity
              style={[s.icoBtn, unreadCount > 0 && s.icoBtnOn]}
              onPress={() => setNotifOpen(true)}
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
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 200,
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
  logo: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 0 },
  logoBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  logoIco: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 0.5,
  },
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
  icoBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  icoBtnOn: {
    borderColor: C.accent,
    backgroundColor: "rgba(124,111,255,0.05)",
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
  authGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  myIconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: C.accent,
    backgroundColor: "rgba(124,111,255,0.06)",
  },
  myBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: C.accent,
    backgroundColor: "rgba(124,111,255,0.06)",
    maxWidth: 90,
  },
  myTxt: { fontSize: 12, fontWeight: "700", color: C.accent },
  logoutBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#fca5a5",
  },
  logoutTxt: { fontSize: 12, fontWeight: "700", color: C.red },
  loginBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  loginTxt: { fontSize: 12, fontWeight: "700", color: C.sub },
  signupBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: C.accent,
  },
  signupTxt: { fontSize: 12, fontWeight: "700", color: "#fff" },
  search: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.searchBg,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    overflow: "hidden",
    flex: 1,
  },
  searchFoc: { borderColor: C.accent },
  searchLeadIcon: { paddingLeft: 10 },
  searchInp: {
    flex: 1,
    paddingVertical: 7,
    paddingLeft: 8,
    paddingRight: 4,
    fontSize: 13,
    color: C.text,
  },
  searchClearBtn: { paddingHorizontal: 6, paddingVertical: 8 },
  searchBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBtnTxt: { fontSize: 12, fontWeight: "700", color: "#fff" },
});
