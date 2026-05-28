// ══════════════════════════════════════════════════════════════
//  app/(tabs)/community.tsx
//  웹 Community.jsx → React Native 변환
//  서버 API 연동 + Registration + CommunityPersonalDetail 포함
// ══════════════════════════════════════════════════════════════
import { communityApi, CommunityMember } from "@/components/api/api";
import CommunityPersonalDetail, {
  CommunityMemberItem,
} from "@/components/Community/CommunityPersonalDetail";
import Registration, {
  RegistrationForm,
} from "@/components/Community/Registration";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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

type ViewMode = "list" | "register" | "detail";

interface Props {
  userEmail?: string;
  displayName?: string;
  onLoginRequired?: () => void;
  myProfile?: CommunityMemberItem | null;
  onProfileSave?: (profile: CommunityMemberItem) => void;
}

export default function CommunityScreen({
  userEmail = "",
  displayName = "",
  onLoginRequired,
  myProfile = null,
  onProfileSave,
}: Props) {
  const [view, setView] = useState<ViewMode>("list");
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<CommunityMemberItem | null>(null);
  const [editTarget, setEditTarget] = useState<CommunityMemberItem | null>(
    null,
  );
  const [filterRole, setFilterRole] = useState("전체");
  const [filterRegion, setFilterRegion] = useState("전체");

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

  useEffect(() => {
    loadMembers(filterRole, filterRegion);
  }, [filterRole, filterRegion]);

  // ── 등록하기 클릭 ───────────────────────────────────────────
  const handleRegisterClick = () => {
    if (!userEmail) {
      onLoginRequired?.();
      return;
    }
    setEditTarget(null);
    setView("register");
  };

  // ── 등록/수정 완료 ──────────────────────────────────────────
  const handleSubmit = async (form: RegistrationForm) => {
    const body = {
      name: form.name || displayName,
      userEmail,
      role: form.role,
      region: form.region,
      intro: form.intro,
      experience: form.experience,
      speciality: form.speciality,
      contactType: form.contactType,
      contactValue: form.contactValue,
      publicProfile: form.publicProfile,
      certFileNames: form.certFiles.map((f) => f.name),
    };

    let saved;
    if (editTarget?.id) {
      saved = await communityApi.update(editTarget.id, body);
    } else {
      saved = await communityApi.save(body);
    }

    const profileData: CommunityMemberItem = {
      ...saved,
      contact: { type: saved.contactType, value: saved.contactValue },
      avatar: saved.name?.charAt(0) || "?",
    };
    onProfileSave?.(profileData);
    await loadMembers(filterRole, filterRegion);
    setEditTarget(null);
    setView("list");
  };

  // ── 뷰 분기 ─────────────────────────────────────────────────
  if (view === "register") {
    return (
      <Registration
        defaultName={displayName}
        initialData={editTarget}
        isEdit={!!editTarget}
        onBack={() => {
          setView("list");
          setEditTarget(null);
        }}
        onSubmit={handleSubmit}
      />
    );
  }

  if (view === "detail" && selected) {
    return (
      <CommunityPersonalDetail
        member={selected}
        myEmail={userEmail}
        myName={displayName}
        onBack={() => {
          setView("list");
          setSelected(null);
        }}
        onEdit={(m) => {
          setEditTarget(m);
          setSelected(null);
          setView("register");
        }}
      />
    );
  }

  // ── 목록 화면 ───────────────────────────────────────────────
  return (
    <ScrollView style={s.page} showsVerticalScrollIndicator={false}>
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
        <TouchableOpacity
          style={s.registerBtn}
          onPress={handleRegisterClick}
          activeOpacity={0.85}
        >
          <Text style={s.registerBtnTxt}>+ 등록하기</Text>
        </TouchableOpacity>
      </View>

      {/* 내 프로필 배너 */}
      {myProfile && (
        <View style={s.myBanner}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={[
                s.cardAvatar,
                { width: 36, height: 36, borderRadius: 10 },
              ]}
            >
              <Text style={s.cardAvatarTxt}>
                {myProfile.avatar || myProfile.name?.charAt(0)}
              </Text>
            </View>
            <View>
              <Text style={s.myBannerLabel}>내 커뮤니티 프로필</Text>
              <Text style={s.myBannerName}>
                {myProfile.name} · {myProfile.role}
              </Text>
            </View>
          </View>
          <View style={s.regionBadge}>
            <Text style={s.regionBadgeTxt}>📍 {myProfile.region}</Text>
          </View>
        </View>
      )}

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
              onPress={() => {
                setSelected(member as CommunityMemberItem);
                setView("detail");
              }}
              activeOpacity={0.75}
            >
              <View style={s.cardAvatar}>
                <Text style={s.cardAvatarTxt}>
                  {member.avatar || member.name?.charAt(0) || "?"}
                </Text>
              </View>
              <View style={s.cardInfo}>
                <Text style={s.cardName}>{member.name}</Text>
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
  },
  registerBtnTxt: { color: C.white, fontSize: 13, fontWeight: "700" },

  // 내 배너
  myBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: C.accentBg,
    borderWidth: 1.5,
    borderColor: "#c7d2fe",
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  myBannerLabel: { fontSize: 12, color: C.accent, fontWeight: "700" },
  myBannerName: { fontSize: 13, fontWeight: "700", color: C.text },

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
