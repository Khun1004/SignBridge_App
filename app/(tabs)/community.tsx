// ══════════════════════════════════════════════════════════════
//  app/(tabs)/community.tsx
// ══════════════════════════════════════════════════════════════
import { communityApi, CommunityMember } from "@/components/api/api";
import { useAuth } from "@/components/contexts/AuthContext";
import { useCommunity } from "@/components/contexts/CommunityContext";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const C = {
  accent: "#6366f1",
  accentBg: "#eef2ff",
  text: "#1e1b4b",
  sub: "#6b7280",
  border: "#e5e7eb",
  bg: "#f8f9ff",
  white: "#ffffff",
  cardBg: "#f3f4f6",
  red: "#ef4444",
  redBg: "#fff5f5",
  redBorder: "#fecaca",
};

const ROLE_OPTIONS = [
  "수어 선생님",
  "수어 통역사",
  "수어 학습자",
  "가족/보호자",
  "수어 관심자",
  "연구자",
  "기타",
];
const REGION_OPTIONS = [
  "서울",
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "울산",
  "경기",
  "기타",
];

export default function CommunityScreen() {
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterRole, setFilterRole] = useState("전체");
  const [filterRegion, setFilterRegion] = useState("전체");

  // 내 프로필 상태
  const [myProfile, setMyProfile] = useState<CommunityMember | null>(null);

  // 삭제 확인 모달
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { loggedIn, userEmail, displayName } = useAuth();
  const { setCommunityView, setCommunityTitle } = useCommunity();
  const router = useRouter();

  // ── 목록 로드 ───────────────────────────────────────────────
  const loadMembers = useCallback(async (role = "", region = "") => {
    setLoading(true);
    try {
      const data = await communityApi.getMembers({ role, region });
      setMembers(Array.isArray(data) ? data : []);
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── 내 프로필 로드 ──────────────────────────────────────────
  const loadMyProfile = useCallback(async () => {
    if (!userEmail) {
      setMyProfile(null);
      return;
    }
    try {
      const data = await communityApi.getMyProfile(userEmail);
      setMyProfile(data ?? null);
    } catch {
      setMyProfile(null);
    }
  }, [userEmail]);

  useEffect(() => {
    loadMembers(filterRole, filterRegion);
  }, [filterRole, filterRegion]);

  // 화면 포커스 시 내 프로필 새로고침 (등록/수정 후 돌아왔을 때 반영)
  useFocusEffect(
    useCallback(() => {
      loadMyProfile();
    }, [loadMyProfile]),
  );

  // ── 등록하기 클릭 ───────────────────────────────────────────
  const handleRegisterClick = () => {
    if (!loggedIn) {
      Alert.alert("로그인 필요", "등록하려면 먼저 로그인 해주세요.");
      return;
    }
    router.push("/registrationcommunity" as any);
  };

  // ── 수정하기 클릭 ───────────────────────────────────────────
  const handleEditClick = () => {
    if (!myProfile) return;
    router.push({
      pathname: "/registrationcommunity" as any,
      params: {
        isEdit: "true",
        memberId: String(myProfile.id),
        memberData: JSON.stringify(myProfile),
      },
    });
  };

  // ── 삭제 확인 ───────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!myProfile || !userEmail) return;
    setDeleteLoading(true);
    try {
      await communityApi.delete(myProfile.id, userEmail);
      setMyProfile(null);
      await loadMembers(filterRole, filterRegion);
      setDeleteConfirm(false);
    } catch {
      Alert.alert("오류", "삭제에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── 목록 화면 ───────────────────────────────────────────────
  return (
    <ScrollView
      style={s.page}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* 헤더 */}
      <View style={s.header}>
        <View>
          <View style={s.headerTag}>
            <Text style={s.headerTagTxt}>COMMUNITY</Text>
          </View>
          <Text style={s.title}>커뮤니티</Text>
          <Text style={s.subtitle}>
            수어 선생님, 통역사, 학습자를 찾아보세요
          </Text>
        </View>
        {/* 프로필 없을 때만 등록 버튼 표시 */}
        {!myProfile && (
          <TouchableOpacity
            style={[s.registerBtn, !loggedIn && s.registerBtnDisabled]}
            onPress={handleRegisterClick}
            activeOpacity={loggedIn ? 0.85 : 1}
            disabled={!loggedIn}
          >
            <Text style={s.registerBtnTxt}>+ 등록하기</Text>
            {!loggedIn && <Text style={s.registerBtnHint}>🔒</Text>}
          </TouchableOpacity>
        )}
      </View>

      {/* 로그인 안내 배너 (비로그인 시) */}
      {!loggedIn && (
        <View style={s.loginBanner}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={C.accent}
          />
          <Text style={s.loginBannerTxt}>
            등록하려면 <Text style={{ fontWeight: "800" }}>홈 화면</Text>에서
            로그인 해주세요
          </Text>
        </View>
      )}

      {/* ── 내 프로필 배너 (등록된 경우) ── */}
      {myProfile && (
        <View style={s.myProfileBanner}>
          <View style={s.myProfileLeft}>
            <View style={s.myProfileAvatar}>
              <Text style={s.myProfileAvatarTxt}>
                {myProfile.avatar || myProfile.name?.charAt(0) || "?"}
              </Text>
            </View>
            <View>
              <Text style={s.myProfileLabel}>내 커뮤니티 프로필</Text>
              <Text style={s.myProfileName}>
                {myProfile.name} · {myProfile.role}
                {myProfile.chatId ? (
                  <Text style={s.myProfileChatId}> @{myProfile.chatId}</Text>
                ) : null}
              </Text>
            </View>
          </View>
          <View style={s.myProfileActions}>
            <View style={s.regionBadgeSmall}>
              <Text style={s.regionBadgeSmallTxt}>📍 {myProfile.region}</Text>
            </View>
            <TouchableOpacity style={s.editBtn} onPress={handleEditClick}>
              <Text style={s.editBtnTxt}>✏️ 수정</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.deleteBtn}
              onPress={() => setDeleteConfirm(true)}
            >
              <Text style={s.deleteBtnTxt}>🗑 삭제</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── 삭제 확인 모달 ── */}
      <Modal
        visible={deleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirm(false)}
      >
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setDeleteConfirm(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={s.modalBox}>
              <Text style={s.modalIcon}>🗑</Text>
              <Text style={s.modalTitle}>프로필을 삭제할까요?</Text>
              <Text style={s.modalDesc}>
                삭제하면 커뮤니티 목록에서 사라지며 복구할 수 없습니다.
              </Text>
              <View style={s.modalBtns}>
                <TouchableOpacity
                  style={s.modalCancel}
                  onPress={() => setDeleteConfirm(false)}
                >
                  <Text style={s.modalCancelTxt}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.modalConfirm, deleteLoading && { opacity: 0.6 }]}
                  onPress={handleDeleteConfirm}
                  disabled={deleteLoading}
                >
                  <Text style={s.modalConfirmTxt}>
                    {deleteLoading ? "삭제 중..." : "삭제하기"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 필터 */}
      <View style={s.filters}>
        <View style={s.filterGroup}>
          <Text style={s.filterLabel}>역할</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={s.filterRow}>
              {["전체", ...ROLE_OPTIONS].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[s.filterBtn, filterRole === r && s.filterBtnOn]}
                  onPress={() => setFilterRole(r)}
                >
                  <Text
                    style={[
                      s.filterBtnTxt,
                      filterRole === r && s.filterBtnTxtOn,
                    ]}
                  >
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
        <View style={s.filterGroup}>
          <Text style={s.filterLabel}>지역</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={s.filterRow}>
              {["전체", ...REGION_OPTIONS].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[s.filterBtn, filterRegion === r && s.filterBtnOn]}
                  onPress={() => setFilterRegion(r)}
                >
                  <Text
                    style={[
                      s.filterBtnTxt,
                      filterRegion === r && s.filterBtnTxtOn,
                    ]}
                  >
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* 멤버 목록 */}
      <View style={s.list}>
        {loading ? (
          <View style={s.empty}>
            <ActivityIndicator color={C.accent} />
            <Text style={s.emptyTxt}>불러오는 중...</Text>
          </View>
        ) : members.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyTxt}>조건에 맞는 멤버가 없습니다.</Text>
          </View>
        ) : (
          members.map((member) => (
            <TouchableOpacity
              key={member.id}
              style={s.card}
              onPress={() =>
                router.push({
                  pathname: "/communitypersonaldetail" as any,
                  params: {
                    memberId: String(member.id),
                    memberData: JSON.stringify({
                      ...member,
                      avatar: member.avatar || member.name?.charAt(0) || "?",
                      contact: {
                        type: member.contactType,
                        value: member.contactValue,
                      },
                    }),
                  },
                })
              }
              activeOpacity={0.75}
            >
              <View style={s.cardAvatar}>
                <Text style={s.cardAvatarTxt}>
                  {member.avatar || member.name?.charAt(0) || "?"}
                </Text>
              </View>
              <View style={s.cardInfo}>
                <Text style={s.cardName}>
                  {member.name}
                  {member.chatId ? (
                    <Text style={s.cardChatId}> @{member.chatId}</Text>
                  ) : null}
                </Text>
                <View style={s.cardMeta}>
                  <View style={s.roleBadge}>
                    <Text style={s.roleBadgeTxt}>{member.role}</Text>
                  </View>
                  <View style={s.regionBadge}>
                    <Text style={s.regionBadgeTxt}>📍 {member.region}</Text>
                  </View>
                </View>
                <Text style={s.cardIntro} numberOfLines={1}>
                  {member.intro}
                </Text>
              </View>
              <View style={s.cardArrow}>
                <Ionicons name="chevron-forward" size={18} color={C.sub} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.white },

  // 헤더
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    paddingTop: 24,
    gap: 12,
  },
  headerTag: {
    backgroundColor: C.accentBg,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  headerTagTxt: {
    fontSize: 11,
    fontWeight: "700",
    color: C.accent,
    letterSpacing: 1,
  },
  title: { fontSize: 26, fontWeight: "800", color: C.text, marginBottom: 2 },
  subtitle: { fontSize: 13, color: C.sub },
  registerBtn: {
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  registerBtnDisabled: { backgroundColor: "#c4c4d4", opacity: 0.6 },
  registerBtnTxt: { color: C.white, fontSize: 13, fontWeight: "700" },
  registerBtnHint: { fontSize: 13 },

  // 로그인 배너
  loginBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: C.accentBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  loginBannerTxt: { fontSize: 13, color: C.accent, flex: 1 },

  // ── 내 프로필 배너 ──
  myProfileBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: C.accentBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#c7d2fe",
    padding: 12,
    gap: 8,
  },
  myProfileLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  myProfileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  myProfileAvatarTxt: { color: C.white, fontSize: 14, fontWeight: "800" },
  myProfileLabel: { fontSize: 11, color: C.accent, fontWeight: "700" },
  myProfileName: { fontSize: 13, fontWeight: "700", color: C.text },
  myProfileChatId: { color: C.accent, fontWeight: "600" },
  myProfileActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  regionBadgeSmall: {
    backgroundColor: C.cardBg,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  regionBadgeSmallTxt: { fontSize: 11, color: C.sub },
  editBtn: {
    backgroundColor: C.accentBg,
    borderWidth: 1.5,
    borderColor: "#c7d2fe",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  editBtnTxt: { fontSize: 12, fontWeight: "700", color: C.accent },
  deleteBtn: {
    backgroundColor: C.redBg,
    borderWidth: 1.5,
    borderColor: C.redBorder,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  deleteBtnTxt: { fontSize: 12, fontWeight: "700", color: C.red },

  // ── 삭제 확인 모달 ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalBox: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 28,
    width: 320,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  modalIcon: { fontSize: 36, marginBottom: 12 },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: C.text,
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 13,
    color: C.sub,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24,
  },
  modalBtns: { flexDirection: "row", gap: 10, width: "100%" },
  modalCancel: {
    flex: 1,
    backgroundColor: C.cardBg,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  modalCancelTxt: { fontSize: 14, fontWeight: "700", color: "#374151" },
  modalConfirm: {
    flex: 1,
    backgroundColor: C.red,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  modalConfirmTxt: { fontSize: 14, fontWeight: "700", color: C.white },

  // 필터
  filters: {
    backgroundColor: C.bg,
    borderRadius: 14,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 14,
    gap: 10,
  },
  filterGroup: { gap: 8 },
  filterLabel: { fontSize: 12, fontWeight: "700", color: C.sub },
  filterRow: { flexDirection: "row", gap: 6 },
  filterBtn: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: C.white,
  },
  filterBtnOn: { backgroundColor: C.accent, borderColor: C.accent },
  filterBtnTxt: { fontSize: 12, color: "#374151" },
  filterBtnTxtOn: { color: C.white, fontWeight: "600" },

  // 목록
  list: { paddingHorizontal: 20, gap: 12 },
  empty: { paddingVertical: 60, alignItems: "center", gap: 10 },
  emptyTxt: { fontSize: 15, color: "#9ca3af" },

  // 카드
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 16,
    padding: 16,
  },
  cardAvatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardAvatarTxt: { color: C.white, fontSize: 20, fontWeight: "800" },
  cardInfo: { flex: 1, minWidth: 0 },
  cardName: { fontSize: 16, fontWeight: "700", color: C.text, marginBottom: 4 },
  cardChatId: { fontSize: 14, color: C.accent, fontWeight: "600" },
  cardMeta: { flexDirection: "row", gap: 6, marginBottom: 5, flexWrap: "wrap" },
  cardIntro: { fontSize: 13, color: C.sub },
  cardArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.cardBg,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  // 배지
  roleBadge: {
    backgroundColor: C.accentBg,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 2,
  },
  roleBadgeTxt: { fontSize: 11, fontWeight: "600", color: C.accent },
  regionBadge: {
    backgroundColor: C.cardBg,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 2,
  },
  regionBadgeTxt: { fontSize: 11, color: C.sub },
});
