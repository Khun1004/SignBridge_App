// ══════════════════════════════════════════════════════════════
//  app/my.tsx — 마이페이지
//  탭: 등록기록 | 커뮤니티 | 프로필
//  기관 유형에 따라 등록기록 탭에 케이스 페이지 분기
// ══════════════════════════════════════════════════════════════
import {
  communityApi,
  immigrationApi,
  myPageApi,
  personalApi,
  policeApi,
} from "@/components/api/api";
import Registration from "@/components/Community/RegistrationCommunity";
import { useAuth } from "@/components/contexts/AuthContext";
import ImmigrationCasePage from "@/components/ImmigrationCasePage/ImmigrationCasePage";
import PoliceCasePage from "@/components/PoliceCasePage/PoliceCasePage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const C = {
  personal: "#2563eb",
  immig: "#7c3aed",
  police: "#dc2626",
  hospital: "#059669",
  accent: "#5b45e0",
  text: "#111118",
  textDim: "#6b6b80",
  textMuted: "#aeaec0",
  border: "#e8e8ec",
  bg: "#f5f5f7",
  surface: "#ffffff",
};

const ORG_META: Record<string, { icon: string; label: string; color: string }> =
  {
    immigration: { icon: "🛂", label: "출입국외국인사무소", color: C.immig },
    airport: { icon: "✈️", label: "공항", color: "#0891b2" },
    hospital: { icon: "🏥", label: "병원", color: C.hospital },
    police: { icon: "👮", label: "경찰서", color: C.police },
    personal: { icon: "👤", label: "개인 사용자", color: C.personal },
  };

function normalizeOrgType(raw: string): string {
  const map: Record<string, string> = {
    개인: "personal",
    출입국관리사무소: "immigration",
    출입국외국인사무소: "immigration",
    경찰서: "police",
    병원: "hospital",
    공항: "airport",
  };
  return map[raw] || raw || "personal";
}

export default function MyPage() {
  const router = useRouter();
  const { loggedIn, userEmail, displayName, orgType } = useAuth();

  const orgKey = normalizeOrgType(orgType);
  const meta = ORG_META[orgKey] || ORG_META.personal;

  const [activeTab, setActiveTab] = useState("등록기록");
  const [profile, setProfile] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [immCases, setImmCases] = useState<any[]>([]);
  const [policeCases, setPoliceCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [myCommProfile, setMyCommProfile] = useState<any>(null);

  const [commEditMode, setCommEditMode] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editGrade, setEditGrade] = useState("");
  const [editSign, setEditSign] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const TABS = ["등록기록", "커뮤니티", "프로필"];

  // ── 데이터 로드 ────────────────────────────────────────────
  useEffect(() => {
    if (!userEmail) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const p = await myPageApi.getProfile(userEmail);
        setProfile(p);

        // 기관 유형에 따라 다른 케이스 API 호출
        if (orgKey === "immigration") {
          const data = await immigrationApi.getCases(userEmail).catch(() => []);
          setImmCases(Array.isArray(data) ? data : []);
        } else if (orgKey === "police") {
          const data = await policeApi.getCases(userEmail).catch(() => []);
          setPoliceCases(Array.isArray(data) ? data : []);
        } else {
          const data = await personalApi.getCases(userEmail);
          setCases(Array.isArray(data) ? data : []);
        }

        const cp = await communityApi.getMyProfile(userEmail).catch(() => null);
        if (cp) setMyCommProfile({ ...cp, avatar: cp.name?.charAt(0) || "?" });
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, [userEmail, orgKey]);

  // ── 프로필 저장 ────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setEditError("이름을 입력해 주세요.");
      return;
    }
    setEditSaving(true);
    setEditError("");
    try {
      const updated = await myPageApi.updateProfile(userEmail, {
        name: editName.trim(),
        disabilityGrade: editGrade,
        preferredSign: editSign,
      });
      setProfile(updated);
      setEditMode(false);
    } catch (e: any) {
      setEditError(`저장 실패: ${e.message}`);
    } finally {
      setEditSaving(false);
    }
  };

  const name = profile?.name || displayName || "사용자";
  const email = profile?.email || userEmail || "-";
  const joined = profile?.joinedAt
    ? new Date(profile.joinedAt).toLocaleDateString("ko-KR")
    : "-";

  // 등록기록 카운트 (기관 유형별)
  const recordCount =
    orgKey === "immigration"
      ? immCases.length
      : orgKey === "police"
        ? policeCases.length
        : cases.length;

  // ── 커뮤니티 프로필 수정 ───────────────────────────────────
  if (commEditMode) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <View style={s.header}>
          <TouchableOpacity
            style={s.headerLeft}
            onPress={() => setCommEditMode(false)}
          >
            <Ionicons name="chevron-back" size={24} color="#7c6fff" />
            <Text style={s.headerTitle}>커뮤니티 프로필 수정</Text>
          </TouchableOpacity>
        </View>
        <Registration
          defaultName={displayName}
          initialData={myCommProfile}
          existingChatId={myCommProfile?.chatId || ""}
          isEdit={true}
          onBack={() => setCommEditMode(false)}
          onSubmit={async (form) => {
            try {
              const body = {
                name: displayName,
                chatId: myCommProfile?.chatId || undefined,
                userEmail,
                role: form.role,
                region: form.region,
                intro: form.intro,
                experience: form.experience,
                speciality: form.speciality,
                contactType: form.contactType,
                contactValue:
                  form.contactType === "signbridge" ? "" : form.contactValue,
                publicProfile: form.publicProfile,
                certFileNames: form.certFiles.map((f: any) => f.name),
              };
              const saved = myCommProfile?.id
                ? await communityApi.update(myCommProfile.id, body)
                : await communityApi.save(body);
              setMyCommProfile({
                ...saved,
                avatar: saved.name?.charAt(0) || "?",
              });
              setCommEditMode(false);
            } catch {
              Alert.alert("오류", "수정에 실패했습니다.");
            }
          }}
        />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <ScrollView
        style={s.page}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── 프로필 히어로 ── */}
        <View style={s.hero}>
          <View style={[s.avatar, { backgroundColor: meta.color + "20" }]}>
            <Text style={s.avatarTxt}>{name.charAt(0)}</Text>
          </View>
          <View style={s.heroInfo}>
            <Text style={s.heroName}>{name}</Text>
            <Text style={s.heroEmail}>{email}</Text>
            <View style={s.heroBadges}>
              <View style={[s.badge, { backgroundColor: meta.color + "18" }]}>
                <Text style={[s.badgeTxt, { color: meta.color }]}>
                  {meta.icon} {meta.label}
                </Text>
              </View>
              <View style={s.badgeGray}>
                <Text style={s.badgeGrayTxt}>가입일 {joined}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={s.editProfileBtn}
            onPress={() => {
              setEditName(profile?.name || displayName || "");
              setEditGrade(profile?.disabilityGrade || "");
              setEditSign(profile?.preferredSign || "");
              setEditError("");
              setEditMode(true);
            }}
          >
            <Text style={s.editProfileBtnTxt}>✏️ 수정</Text>
          </TouchableOpacity>
        </View>

        {/* 통계 */}
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={[s.statVal, { color: C.accent }]}>{recordCount}</Text>
            <Text style={s.statLbl}>등록 기록</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Text style={[s.statVal, { color: C.accent }]}>
              {myCommProfile ? 1 : 0}
            </Text>
            <Text style={s.statLbl}>커뮤니티</Text>
          </View>
        </View>

        {/* ── 탭 ── */}
        <View style={s.tabs}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t}
              style={[s.tab, activeTab === t && s.tabOn]}
              onPress={() => setActiveTab(t)}
            >
              <Text style={[s.tabTxt, activeTab === t && s.tabTxtOn]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading && (
          <View style={s.loadingBox}>
            <ActivityIndicator color={C.accent} />
            <Text style={s.loadingTxt}>불러오는 중...</Text>
          </View>
        )}

        {/* ════ 등록기록 탭 ════ */}
        {!loading && activeTab === "등록기록" && (
          <View style={s.tabContent}>
            {/* 출입국 기관 */}
            {orgKey === "immigration" && (
              <ImmigrationCasePage
                cases={immCases}
                loading={loading}
                displayName={displayName}
                profile={profile}
                onRegister={() =>
                  router.push("/registrationimmigration" as any)
                }
              />
            )}

            {/* 경찰서 */}
            {orgKey === "police" && (
              <PoliceCasePage
                cases={policeCases}
                loading={loading}
                displayName={displayName}
                profile={profile}
                onRegister={() => router.push("/registrationpolice" as any)}
              />
            )}

            {/* 개인 / 기타 */}
            {orgKey !== "immigration" && orgKey !== "police" && (
              <>
                {cases.length === 0 ? (
                  <View style={s.empty}>
                    <Text style={s.emptyIcon}>📋</Text>
                    <Text style={s.emptyTxt}>등록된 기록이 없습니다.</Text>
                    <Text style={s.emptyHint}>
                      번역기에서 대화 종료 후 등록하면 여기에 저장됩니다.
                    </Text>
                  </View>
                ) : (
                  cases.map((c, i) => (
                    <View key={c.id ?? i} style={s.recordCard}>
                      <View style={s.recordTop}>
                        <Text style={s.recordId}>
                          CASE-{String(c.id ?? i + 1).padStart(3, "0")}
                        </Text>
                        <View style={s.statusBadge}>
                          <Text style={s.statusTxt}>✅ 등록됨</Text>
                        </View>
                      </View>
                      <View style={s.recordMeta}>
                        <Text style={s.recordMetaTxt}>👤 {c.name || "-"}</Text>
                        <Text style={s.recordMetaTxt}>
                          📅 {c.createdAt || "-"}
                        </Text>
                        <Text style={s.recordMetaTxt}>
                          💬 {c.messageCount || 0}개 메시지
                        </Text>
                      </View>
                      {c.memo && (
                        <View style={s.memoChip}>
                          <Text style={s.memoChipTxt}>{c.memo}</Text>
                        </View>
                      )}
                      {c.messages?.length > 0 && (
                        <View style={s.bubbleList}>
                          {c.messages.map((msg: any, mi: number) => (
                            <View
                              key={mi}
                              style={[
                                s.bubble,
                                msg.msgType === "voice"
                                  ? s.bubbleRight
                                  : s.bubbleLeft,
                              ]}
                            >
                              <Text style={s.bubbleWho}>
                                {msg.msgType === "sign"
                                  ? "🧏 청각장애인"
                                  : "🙋 담당자"}
                              </Text>
                              <Text
                                style={[
                                  s.bubbleTxt,
                                  msg.msgType === "voice" && s.bubbleTxtVoice,
                                ]}
                              >
                                {msg.content || "-"}
                              </Text>
                              <Text style={s.bubbleTime}>
                                {msg.sentAt || ""}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  ))
                )}
              </>
            )}
          </View>
        )}

        {/* ════ 커뮤니티 탭 ════ */}
        {!loading && activeTab === "커뮤니티" && (
          <View style={s.tabContent}>
            {!myCommProfile ? (
              <View style={s.empty}>
                <Text style={s.emptyIcon}>🤟</Text>
                <Text style={s.emptyTxt}>커뮤니티 프로필이 없습니다.</Text>
                <Text style={s.emptyHint}>
                  커뮤니티 메뉴에서 등록하면 여기에 표시됩니다.
                </Text>
              </View>
            ) : (
              <View style={s.commCard}>
                <View style={s.commTop}>
                  <View style={s.commAvatar}>
                    <Text style={s.commAvatarTxt}>{myCommProfile.avatar}</Text>
                  </View>
                  <View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Text style={s.commName}>{myCommProfile.name}</Text>
                      {!!myCommProfile.chatId && (
                        <Text style={s.commChatId}>
                          @{myCommProfile.chatId}
                        </Text>
                      )}
                    </View>
                    <View style={s.commBadges}>
                      <View style={s.roleBadge}>
                        <Text style={s.roleBadgeTxt}>{myCommProfile.role}</Text>
                      </View>
                      <View style={s.regionBadge}>
                        <Text style={s.regionBadgeTxt}>
                          📍 {myCommProfile.region}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={s.commIntroBox}>
                  <Text style={s.commIntroLabel}>자기소개</Text>
                  <Text style={s.commIntroTxt}>{myCommProfile.intro}</Text>
                </View>
                {myCommProfile.experience && (
                  <View style={s.commIntroBox}>
                    <Text style={s.commIntroLabel}>경력 / 활동 이력</Text>
                    <Text style={s.commIntroTxt}>
                      {myCommProfile.experience}
                    </Text>
                  </View>
                )}
                {myCommProfile.speciality && (
                  <View style={s.commIntroBox}>
                    <Text style={s.commIntroLabel}>전문 분야</Text>
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: 6,
                        marginTop: 4,
                      }}
                    >
                      {myCommProfile.speciality
                        .split(",")
                        .map((sp: string, si: number) => (
                          <View key={si} style={s.specChip}>
                            <Text style={s.specChipTxt}>{sp.trim()}</Text>
                          </View>
                        ))}
                    </View>
                  </View>
                )}
                <View style={s.commIntroBox}>
                  <Text style={s.commIntroLabel}>연락 방법</Text>
                  <Text style={s.commIntroTxt}>
                    {myCommProfile.contactType === "signbridge"
                      ? "💬 SignBridge 앱 내 채팅"
                      : myCommProfile.contactType === "chat"
                        ? `💬 오픈채팅: ${myCommProfile.contactValue}`
                        : myCommProfile.contactType === "phone"
                          ? `📞 ${myCommProfile.contactValue}`
                          : myCommProfile.contactType === "email"
                            ? `📧 ${myCommProfile.contactValue}`
                            : "-"}
                  </Text>
                </View>
                <TouchableOpacity
                  style={s.commEditBtn}
                  onPress={() => setCommEditMode(true)}
                >
                  <Text style={s.commEditBtnTxt}>✏️ 프로필 수정</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ════ 프로필 탭 ════ */}
        {!loading && activeTab === "프로필" && (
          <View style={s.tabContent}>
            <View style={s.profileSection}>
              <Text style={s.profileSectionTitle}>🪪 기본 정보</Text>
              {[
                ["이름", profile?.name || displayName || "-"],
                ["이메일", email],
                ["사용자 유형", meta.label],
                ["가입일", joined],
                ["장애 등급", profile?.disabilityGrade || "-"],
                ["주 사용 수어", profile?.preferredSign || "-"],
              ].map(([k, v]) => (
                <View key={k} style={s.profileRow}>
                  <Text style={s.profileKey}>{k}</Text>
                  <Text style={s.profileVal}>{v}</Text>
                </View>
              ))}
            </View>
            <View style={s.profileSection}>
              <Text style={s.profileSectionTitle}>📍 주소 정보</Text>
              {[
                ["주소", profile?.address || "-"],
                ["상세주소", profile?.addressDetail || "-"],
                ["우편번호", profile?.zonecode || "-"],
              ].map(([k, v]) => (
                <View key={k} style={s.profileRow}>
                  <Text style={s.profileKey}>{k}</Text>
                  <Text style={s.profileVal}>{v}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={s.editProfileBtn2}
              onPress={() => {
                setEditName(profile?.name || displayName || "");
                setEditGrade(profile?.disabilityGrade || "");
                setEditSign(profile?.preferredSign || "");
                setEditError("");
                setEditMode(true);
              }}
            >
              <Text style={s.editProfileBtn2Txt}>✏️ 프로필 수정하기</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ── 프로필 수정 모달 ── */}
      <Modal visible={editMode} transparent animationType="fade">
        <Pressable style={s.modalOverlay} onPress={() => setEditMode(false)}>
          <Pressable style={s.modal} onPress={() => {}}>
            <View style={s.modalHd}>
              <Text style={s.modalHdTxt}>✏️ 프로필 수정</Text>
              <TouchableOpacity onPress={() => setEditMode(false)}>
                <Ionicons name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={s.modalBody}>
              <View style={s.editField}>
                <Text style={s.editLabel}>
                  이름 <Text style={{ color: "#ef4444" }}>*</Text>
                </Text>
                <TextInput
                  style={s.editInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="이름 입력"
                />
              </View>
              <View style={s.editField}>
                <Text style={s.editLabel}>장애 등급</Text>
                <TextInput
                  style={s.editInput}
                  value={editGrade}
                  onChangeText={setEditGrade}
                  placeholder="예: 청각장애 1급"
                />
              </View>
              <View style={s.editField}>
                <Text style={s.editLabel}>주로 사용하는 수어</Text>
                <TextInput
                  style={s.editInput}
                  value={editSign}
                  onChangeText={setEditSign}
                  placeholder="예: 한국수어"
                />
              </View>
              {!!editError && (
                <View style={s.editError}>
                  <Text style={s.editErrorTxt}>⚠️ {editError}</Text>
                </View>
              )}
              <TouchableOpacity
                style={[s.editSaveBtn, editSaving && { opacity: 0.6 }]}
                onPress={handleSaveProfile}
                disabled={editSaving}
              >
                {editSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={s.editSaveBtnTxt}>💾 저장하기</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 4 },
  headerTitle: { fontSize: 19, fontWeight: "800", color: "#1a1a2e" },
  page: { flex: 1 },

  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 20,
    backgroundColor: C.surface,
    borderRadius: 18,
    margin: 16,
    borderWidth: 1.5,
    borderColor: C.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTxt: { fontSize: 26, fontWeight: "900", color: C.text },
  heroInfo: { flex: 1 },
  heroName: {
    fontSize: 20,
    fontWeight: "900",
    color: C.text,
    letterSpacing: -0.5,
  },
  heroEmail: { fontSize: 12, color: C.textDim, marginTop: 2 },
  heroBadges: { flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeTxt: { fontSize: 11, fontWeight: "700" },
  badgeGray: {
    backgroundColor: "#f3f3f8",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: C.border,
  },
  badgeGrayTxt: { fontSize: 11, color: C.textDim },
  editProfileBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: "#f8f8fc",
  },
  editProfileBtnTxt: { fontSize: 12, fontWeight: "700", color: C.textDim },

  statsRow: {
    flexDirection: "row",
    backgroundColor: C.surface,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: C.border,
    overflow: "hidden",
  },
  statBox: { flex: 1, alignItems: "center", paddingVertical: 14 },
  statDivider: { width: 1, backgroundColor: C.border },
  statVal: { fontSize: 24, fontWeight: "900", letterSpacing: -0.5 },
  statLbl: { fontSize: 11, color: C.textDim, fontWeight: "600", marginTop: 3 },

  tabs: {
    flexDirection: "row",
    marginHorizontal: 16,
    backgroundColor: "#ebebf0",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: "center" },
  tabOn: {
    backgroundColor: C.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  tabTxt: { fontSize: 13, fontWeight: "700", color: C.textDim },
  tabTxtOn: { color: C.accent },
  tabContent: { paddingHorizontal: 16, gap: 10 },
  loadingBox: { alignItems: "center", gap: 10, padding: 40 },
  loadingTxt: { fontSize: 14, color: C.textDim },

  empty: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 50,
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  emptyIcon: { fontSize: 38, opacity: 0.35 },
  emptyTxt: { fontSize: 15, fontWeight: "700", color: C.textDim },
  emptyHint: {
    fontSize: 12,
    color: C.textMuted,
    textAlign: "center",
    paddingHorizontal: 20,
  },

  recordCard: {
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  recordTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recordId: { fontSize: 13, fontWeight: "700", color: C.text },
  statusBadge: {
    backgroundColor: "#e8fff4",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  statusTxt: { fontSize: 11, fontWeight: "700", color: "#10b981" },
  recordMeta: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  recordMetaTxt: { fontSize: 12, color: C.textDim },
  memoChip: {
    backgroundColor: "#f2f0ff",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  memoChipTxt: { fontSize: 12, fontWeight: "600", color: C.accent },
  bubbleList: { gap: 8, marginTop: 4 },
  bubble: { maxWidth: "85%", padding: 10, borderRadius: 12 },
  bubbleLeft: {
    alignSelf: "flex-start",
    backgroundColor: "#f2f0ff",
    borderBottomLeftRadius: 2,
  },
  bubbleRight: {
    alignSelf: "flex-end",
    backgroundColor: "#ede9fe",
    borderBottomRightRadius: 2,
  },
  bubbleWho: {
    fontSize: 10,
    fontWeight: "700",
    color: C.textDim,
    marginBottom: 3,
  },
  bubbleTxt: { fontSize: 13, color: C.text, lineHeight: 18 },
  bubbleTxtVoice: { color: "#4c1d95" },
  bubbleTime: { fontSize: 9, color: C.textMuted, marginTop: 3 },

  commCard: {
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 16,
    padding: 18,
    gap: 12,
  },
  commTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  commAvatar: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
  },
  commAvatarTxt: { color: "#fff", fontSize: 20, fontWeight: "800" },
  commName: { fontSize: 17, fontWeight: "700", color: C.text },
  commChatId: { fontSize: 13, fontWeight: "700", color: "#6366f1" },
  commBadges: { flexDirection: "row", gap: 6, marginTop: 4 },
  roleBadge: {
    backgroundColor: "#eef2ff",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 2,
  },
  roleBadgeTxt: { fontSize: 11, fontWeight: "600", color: "#6366f1" },
  regionBadge: {
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 2,
  },
  regionBadgeTxt: { fontSize: 11, color: C.textDim },
  commIntroBox: { backgroundColor: "#f8f9ff", borderRadius: 10, padding: 12 },
  commIntroLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: C.textMuted,
    marginBottom: 4,
  },
  commIntroTxt: { fontSize: 13, color: "#374151", lineHeight: 20 },
  specChip: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  specChipTxt: { fontSize: 12, fontWeight: "600", color: "#059669" },
  commEditBtn: {
    borderWidth: 1.5,
    borderColor: "#6366f1",
    borderRadius: 12,
    padding: 13,
    alignItems: "center",
    marginTop: 4,
  },
  commEditBtnTxt: { color: "#6366f1", fontSize: 14, fontWeight: "700" },

  profileSection: {
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 10,
  },
  profileSectionTitle: {
    padding: 14,
    fontSize: 13,
    fontWeight: "800",
    color: C.text,
    backgroundColor: "#fafafa",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f3f8",
  },
  profileKey: { width: 90, fontSize: 12, fontWeight: "600", color: C.textDim },
  profileVal: { flex: 1, fontSize: 13, fontWeight: "500", color: C.text },
  editProfileBtn2: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    padding: 13,
    alignItems: "center",
    backgroundColor: C.surface,
    marginTop: 4,
  },
  editProfileBtn2Txt: { fontSize: 14, fontWeight: "700", color: C.textDim },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(10,10,20,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modal: {
    backgroundColor: C.surface,
    borderRadius: 20,
    width: "100%",
    maxWidth: 480,
    maxHeight: "80%",
    overflow: "hidden",
  },
  modalHd: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  modalHdTxt: { fontSize: 15, fontWeight: "800", color: C.text },
  modalBody: { padding: 20 },
  editField: { marginBottom: 14 },
  editLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: C.textDim,
    marginBottom: 6,
  },
  editInput: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    padding: 11,
    fontSize: 14,
    color: C.text,
    backgroundColor: "#fafaf8",
  },
  editError: {
    backgroundColor: "#fef2f2",
    borderRadius: 9,
    padding: 10,
    marginBottom: 12,
  },
  editErrorTxt: { fontSize: 12, color: "#ef4444", fontWeight: "600" },
  editSaveBtn: {
    backgroundColor: C.personal,
    borderRadius: 11,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  editSaveBtnTxt: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
