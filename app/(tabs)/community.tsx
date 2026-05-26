// ══════════════════════════════════════════════════════════════
//  app/(tabs)/community.tsx
//  웹 Community.jsx → React Native 변환
// ══════════════════════════════════════════════════════════════
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── 색상 토큰 ────────────────────────────────────────────────
const C = {
  accent: "#6366f1",
  accentDk: "#4f46e5",
  accentBg: "#eef2ff",
  text: "#1e1b4b",
  sub: "#6b7280",
  border: "#e5e7eb",
  bg: "#f8f9ff",
  white: "#ffffff",
  red: "#ef4444",
  redBg: "#fef2f2",
  cardBg: "#f3f4f6",
};

// ─── 데이터 ───────────────────────────────────────────────────
const SAMPLE_MEMBERS: Member[] = [
  {
    id: 1,
    name: "쿤산",
    role: "수어 선생님",
    region: "서울",
    intro:
      "안녕하세요! 저는 10년 경력의 수어 선생님입니다. 초급부터 고급까지 체계적으로 가르쳐 드립니다.",
    contact: { type: "chat", value: "https://open.kakao.com/example1" },
    avatar: "쿤",
  },
  {
    id: 2,
    name: "토야",
    role: "수어 선생님",
    region: "부산",
    intro: "청각장애인 전문 수어 통역사이자 선생님입니다. 편하게 연락 주세요!",
    contact: { type: "phone", value: "010-1234-5678" },
    avatar: "토",
  },
];

const ROLE_OPTIONS = ["수어 선생님", "수어 통역사", "학습자", "연구자", "기타"];
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

// ─── 타입 ────────────────────────────────────────────────────
interface Member {
  id: number;
  name: string;
  role: string;
  region: string;
  intro: string;
  contact: { type: "chat" | "phone"; value: string };
  avatar: string;
}

interface RegisterForm {
  name: string;
  role: string;
  region: string;
  intro: string;
  contactType: "chat" | "phone";
  contactValue: string;
}

// ══════════════════════════════════════════════════════════════
//  등록 모달
// ══════════════════════════════════════════════════════════════
function RegisterModal({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (form: RegisterForm) => void;
}) {
  const [form, setForm] = useState<RegisterForm>({
    name: "",
    role: "",
    region: "",
    intro: "",
    contactType: "chat",
    contactValue: "",
  });
  const [error, setError] = useState("");
  const [roleOpen, setRoleOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);

  const set = <K extends keyof RegisterForm>(k: K, v: RegisterForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.name.trim()) return setError("이름을 입력해 주세요.");
    if (!form.role) return setError("역할을 선택해 주세요.");
    if (!form.region) return setError("지역을 선택해 주세요.");
    if (!form.intro.trim()) return setError("자기소개를 입력해 주세요.");
    if (!form.contactValue.trim()) return setError("연락처를 입력해 주세요.");
    setError("");
    onSubmit(form);
    setForm({
      name: "",
      role: "",
      region: "",
      intro: "",
      contactType: "chat",
      contactValue: "",
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={m.overlay} onPress={onClose}>
        <Pressable style={m.modal} onPress={() => {}}>
          {/* 헤더 */}
          <View style={m.header}>
            <Text style={m.title}>프로필 등록</Text>
            <TouchableOpacity style={m.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={16} color={C.sub} />
            </TouchableOpacity>
          </View>

          {/* 바디 */}
          <ScrollView style={m.body} showsVerticalScrollIndicator={false}>
            {/* 이름 */}
            <View style={m.field}>
              <Text style={m.label}>이름</Text>
              <TextInput
                style={m.input}
                placeholder="이름을 입력하세요"
                placeholderTextColor="#bbb"
                value={form.name}
                onChangeText={(v) => set("name", v)}
              />
            </View>

            {/* 역할 + 지역 */}
            <View style={m.fieldRow}>
              <View style={[m.field, { flex: 1 }]}>
                <Text style={m.label}>역할</Text>
                <TouchableOpacity
                  style={m.select}
                  onPress={() => {
                    setRoleOpen(true);
                    setRegionOpen(false);
                  }}
                >
                  <Text style={form.role ? m.selectVal : m.selectPlaceholder}>
                    {form.role || "선택하세요"}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={C.sub} />
                </TouchableOpacity>
                {roleOpen && (
                  <View style={m.dropdown}>
                    {ROLE_OPTIONS.map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[
                          m.dropItem,
                          form.role === r && m.dropItemActive,
                        ]}
                        onPress={() => {
                          set("role", r);
                          setRoleOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            m.dropText,
                            form.role === r && m.dropTextActive,
                          ]}
                        >
                          {r}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={[m.field, { flex: 1 }]}>
                <Text style={m.label}>지역</Text>
                <TouchableOpacity
                  style={m.select}
                  onPress={() => {
                    setRegionOpen(true);
                    setRoleOpen(false);
                  }}
                >
                  <Text style={form.region ? m.selectVal : m.selectPlaceholder}>
                    {form.region || "선택하세요"}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={C.sub} />
                </TouchableOpacity>
                {regionOpen && (
                  <View style={m.dropdown}>
                    {REGION_OPTIONS.map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[
                          m.dropItem,
                          form.region === r && m.dropItemActive,
                        ]}
                        onPress={() => {
                          set("region", r);
                          setRegionOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            m.dropText,
                            form.region === r && m.dropTextActive,
                          ]}
                        >
                          {r}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* 자기소개 */}
            <View style={m.field}>
              <Text style={m.label}>자기소개</Text>
              <TextInput
                style={m.textarea}
                placeholder="간단히 소개해 주세요 (활동 경력, 전문 분야 등)"
                placeholderTextColor="#bbb"
                value={form.intro}
                onChangeText={(v) => set("intro", v)}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* 연락 방법 */}
            <View style={m.field}>
              <Text style={m.label}>연락 방법</Text>
              <View style={m.contactTypeRow}>
                <TouchableOpacity
                  style={[
                    m.typeBtn,
                    form.contactType === "chat" && m.typeBtnActive,
                  ]}
                  onPress={() => set("contactType", "chat")}
                >
                  <Text
                    style={[
                      m.typeBtnText,
                      form.contactType === "chat" && m.typeBtnTextActive,
                    ]}
                  >
                    💬 오픈채팅 링크
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    m.typeBtn,
                    form.contactType === "phone" && m.typeBtnActive,
                  ]}
                  onPress={() => set("contactType", "phone")}
                >
                  <Text
                    style={[
                      m.typeBtnText,
                      form.contactType === "phone" && m.typeBtnTextActive,
                    ]}
                  >
                    📞 전화번호
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={m.input}
                placeholder={
                  form.contactType === "chat"
                    ? "카카오 오픈채팅 링크를 입력하세요"
                    : "010-0000-0000"
                }
                placeholderTextColor="#bbb"
                value={form.contactValue}
                onChangeText={(v) => set("contactValue", v)}
                keyboardType={
                  form.contactType === "phone" ? "phone-pad" : "url"
                }
              />
            </View>

            {/* 에러 */}
            {!!error && (
              <View style={m.errorBox}>
                <Text style={m.errorText}>⚠️ {error}</Text>
              </View>
            )}

            <View style={{ height: 8 }} />
          </ScrollView>

          {/* 푸터 */}
          <View style={m.footer}>
            <TouchableOpacity style={m.cancelBtn} onPress={onClose}>
              <Text style={m.cancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity style={m.submitBtn} onPress={handleSubmit}>
              <Text style={m.submitText}>등록하기</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════
//  상세 모달
// ══════════════════════════════════════════════════════════════
function DetailModal({
  member,
  onClose,
}: {
  member: Member | null;
  onClose: () => void;
}) {
  if (!member) return null;

  const handleContact = () => {
    if (member.contact.type === "chat") {
      Linking.openURL(member.contact.value).catch(() =>
        Alert.alert("오류", "링크를 열 수 없습니다."),
      );
    } else {
      Linking.openURL(`tel:${member.contact.value}`).catch(() =>
        Alert.alert("오류", "전화를 걸 수 없습니다."),
      );
    }
  };

  return (
    <Modal
      visible={!!member}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={m.overlay} onPress={onClose}>
        <Pressable style={[m.modal, { maxWidth: 400 }]} onPress={() => {}}>
          {/* 헤더 */}
          <View style={m.header}>
            <Text style={m.title}>프로필 상세</Text>
            <TouchableOpacity style={m.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={16} color={C.sub} />
            </TouchableOpacity>
          </View>

          {/* 바디 */}
          <View style={d.body}>
            {/* 아바타 + 이름 */}
            <View style={d.top}>
              <View style={d.avatar}>
                <Text style={d.avatarText}>{member.avatar}</Text>
              </View>
              <View>
                <Text style={d.name}>{member.name}</Text>
                <View style={d.tags}>
                  <View style={s.roleBadge}>
                    <Text style={s.roleBadgeText}>{member.role}</Text>
                  </View>
                  <View style={s.regionBadge}>
                    <Text style={s.regionBadgeText}>📍 {member.region}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 자기소개 */}
            <View>
              <Text style={d.sectionLabel}>자기소개</Text>
              <View style={d.infoBox}>
                <Text style={d.infoText}>{member.intro}</Text>
              </View>
            </View>

            {/* 연락 방법 */}
            <View>
              <Text style={d.sectionLabel}>연락 방법</Text>
              <View style={d.infoBox}>
                <Text style={d.infoText}>
                  {member.contact.type === "chat"
                    ? "💬 오픈채팅"
                    : `📞 ${member.contact.value}`}
                </Text>
              </View>
            </View>
          </View>

          {/* 푸터 */}
          <View style={m.footer}>
            <TouchableOpacity style={m.cancelBtn} onPress={onClose}>
              <Text style={m.cancelText}>닫기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={m.submitBtn} onPress={handleContact}>
              <Text style={m.submitText}>
                {member.contact.type === "chat" ? "💬 채팅하기" : "📞 전화하기"}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════
//  메인 화면
// ══════════════════════════════════════════════════════════════
export default function CommunityScreen() {
  const [members, setMembers] = useState<Member[]>(SAMPLE_MEMBERS);
  const [showRegister, setShowRegister] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [filterRole, setFilterRole] = useState("전체");
  const [filterRegion, setFilterRegion] = useState("전체");

  const handleRegister = (form: RegisterForm) => {
    const newMember: Member = {
      id: Date.now(),
      name: form.name,
      role: form.role,
      region: form.region,
      intro: form.intro,
      contact: { type: form.contactType, value: form.contactValue },
      avatar: form.name.charAt(0),
    };
    setMembers((prev) => [newMember, ...prev]);
    setShowRegister(false);
  };

  const filtered = members.filter((m) => {
    const roleOk = filterRole === "전체" || m.role === filterRole;
    const regionOk = filterRegion === "전체" || m.region === filterRegion;
    return roleOk && regionOk;
  });

  return (
    <ScrollView style={s.page} showsVerticalScrollIndicator={false}>
      {/* ── 헤더 ── */}
      <View style={s.header}>
        <View>
          <View style={s.headerTag}>
            <Text style={s.headerTagText}>COMMUNITY</Text>
          </View>
          <Text style={s.title}>커뮤니티</Text>
          <Text style={s.subtitle}>
            수어 선생님, 통역사, 학습자를 찾아보세요
          </Text>
        </View>
        <TouchableOpacity
          style={s.registerBtn}
          onPress={() => setShowRegister(true)}
        >
          <Text style={s.registerBtnText}>+ 등록하기</Text>
        </TouchableOpacity>
      </View>

      {/* ── 필터 ── */}
      <View style={s.filters}>
        {/* 역할 필터 */}
        <View style={s.filterGroup}>
          <Text style={s.filterLabel}>역할</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={s.filterRow}>
              {["전체", ...ROLE_OPTIONS].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[s.filterBtn, filterRole === r && s.filterBtnActive]}
                  onPress={() => setFilterRole(r)}
                >
                  <Text
                    style={[
                      s.filterBtnText,
                      filterRole === r && s.filterBtnTextActive,
                    ]}
                  >
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* 지역 필터 */}
        <View style={s.filterGroup}>
          <Text style={s.filterLabel}>지역</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={s.filterRow}>
              {["전체", ...REGION_OPTIONS].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[s.filterBtn, filterRegion === r && s.filterBtnActive]}
                  onPress={() => setFilterRegion(r)}
                >
                  <Text
                    style={[
                      s.filterBtnText,
                      filterRegion === r && s.filterBtnTextActive,
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

      {/* ── 멤버 목록 ── */}
      <View style={s.list}>
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyText}>조건에 맞는 멤버가 없습니다.</Text>
          </View>
        ) : (
          filtered.map((member) => (
            <TouchableOpacity
              key={member.id}
              style={s.card}
              onPress={() => setSelectedMember(member)}
              activeOpacity={0.75}
            >
              {/* 아바타 */}
              <View style={s.cardAvatar}>
                <Text style={s.cardAvatarText}>{member.avatar}</Text>
              </View>

              {/* 정보 */}
              <View style={s.cardInfo}>
                <Text style={s.cardName}>{member.name}</Text>
                <View style={s.cardMeta}>
                  <View style={s.roleBadge}>
                    <Text style={s.roleBadgeText}>{member.role}</Text>
                  </View>
                  <View style={s.regionBadge}>
                    <Text style={s.regionBadgeText}>📍 {member.region}</Text>
                  </View>
                </View>
                <Text style={s.cardIntro} numberOfLines={1}>
                  {member.intro}
                </Text>
              </View>

              {/* 화살표 */}
              <View style={s.cardArrow}>
                <Ionicons name="chevron-forward" size={18} color={C.sub} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={{ height: 40 }} />

      {/* ── 등록 모달 ── */}
      <RegisterModal
        visible={showRegister}
        onClose={() => setShowRegister(false)}
        onSubmit={handleRegister}
      />

      {/* ── 상세 모달 ── */}
      <DetailModal
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </ScrollView>
  );
}

// ══════════════════════════════════════════════════════════════
//  스타일
// ══════════════════════════════════════════════════════════════

/* 메인 */
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
  headerTagText: {
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
    flexShrink: 0,
  },
  registerBtnText: { color: C.white, fontSize: 13, fontWeight: "700" },

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
  filterBtnActive: { backgroundColor: C.accent, borderColor: C.accent },
  filterBtnText: { fontSize: 12, color: "#374151" },
  filterBtnTextActive: { color: C.white, fontWeight: "600" },

  // 목록
  list: { paddingHorizontal: 20, gap: 12 },
  empty: { paddingVertical: 60, alignItems: "center" },
  emptyText: { fontSize: 15, color: "#9ca3af" },

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
  cardAvatarText: { color: C.white, fontSize: 20, fontWeight: "800" },
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

  // 공통 배지
  roleBadge: {
    backgroundColor: C.accentBg,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 2,
  },
  roleBadgeText: { fontSize: 11, fontWeight: "600", color: C.accent },
  regionBadge: {
    backgroundColor: C.cardBg,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 2,
  },
  regionBadgeText: { fontSize: 11, color: C.sub },
});

/* 모달 공통 */
const m = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    backgroundColor: C.white,
    borderRadius: 20,
    width: "100%",
    maxWidth: 480,
    maxHeight: "90%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.18,
    shadowRadius: 40,
    elevation: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBg,
  },
  title: { fontSize: 18, fontWeight: "800", color: C.text },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.cardBg,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { paddingHorizontal: 24, paddingTop: 20, maxHeight: 420 },
  field: { gap: 6, marginBottom: 16 },
  fieldRow: { flexDirection: "row", gap: 12, marginBottom: 0 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151" },
  input: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1f2937",
    backgroundColor: C.white,
  },
  textarea: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1f2937",
    backgroundColor: C.white,
    minHeight: 80,
  },
  select: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.white,
  },
  selectVal: { fontSize: 14, color: "#1f2937" },
  selectPlaceholder: { fontSize: 14, color: "#bbb" },
  dropdown: {
    position: "absolute",
    top: 76,
    left: 0,
    right: 0,
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  dropItem: { paddingHorizontal: 14, paddingVertical: 10 },
  dropItemActive: { backgroundColor: C.accentBg },
  dropText: { fontSize: 14, color: "#374151" },
  dropTextActive: { color: C.accent, fontWeight: "600" },
  contactTypeRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  typeBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: "center",
    backgroundColor: C.white,
  },
  typeBtnActive: { borderColor: C.accent, backgroundColor: C.accentBg },
  typeBtnText: { fontSize: 13, color: C.sub },
  typeBtnTextActive: { color: C.accent, fontWeight: "700" },
  errorBox: {
    backgroundColor: C.redBg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  errorText: { fontSize: 13, color: C.red },
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: C.cardBg,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: C.white,
  },
  cancelText: { fontSize: 14, fontWeight: "600", color: C.sub },
  submitBtn: {
    flex: 2,
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  submitText: { fontSize: 14, fontWeight: "700", color: C.white },
});

/* 상세 모달 바디 */
const d = StyleSheet.create({
  body: { padding: 24, gap: 20 },
  top: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: { color: C.white, fontSize: 26, fontWeight: "800" },
  name: { fontSize: 20, fontWeight: "800", color: C.text, marginBottom: 6 },
  tags: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9ca3af",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  infoBox: {
    backgroundColor: C.bg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  infoText: { fontSize: 14, color: "#374151", lineHeight: 22 },
});
