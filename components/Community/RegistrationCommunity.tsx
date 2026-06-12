// ══════════════════════════════════════════════════════════════
//  components/Community/RegistrationCommunity.tsx
//  웹 Registration.jsx → React Native 변환 (3단계)
// ══════════════════════════════════════════════════════════════
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const C = {
  accent: "#6366f1",
  accentBg: "#eef2ff",
  accentDk: "#4f46e5",
  text: "#1e1b4b",
  sub: "#6b7280",
  border: "#e5e7eb",
  bg: "#f8f9ff",
  white: "#ffffff",
  red: "#ef4444",
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

// 웹과 동일한 4가지 연락 타입
const CONTACT_TYPES = [
  { id: "signbridge", label: "💬 SignBridge" },
  { id: "chat", label: "💬 오픈채팅" },
  { id: "phone", label: "📞 전화번호" },
  { id: "email", label: "📧 이메일" },
];

export interface RegistrationForm {
  name: string;
  chatId: string;
  role: string;
  region: string;
  intro: string;
  experience: string;
  speciality: string;
  contactType: string;
  contactValue: string;
  publicProfile: boolean;
  certFiles: { name: string }[];
}

interface Props {
  defaultName?: string;
  existingChatId?: string; // 수정 시 이미 잠긴 chatId
  initialData?: Partial<RegistrationForm> | null;
  isEdit?: boolean;
  onBack: () => void;
  onSubmit: (form: RegistrationForm) => Promise<void>;
}

const STEPS = ["기본 정보", "자세한 소개", "연락처"];

export default function RegistrationCommunityPage({
  defaultName = "",
  existingChatId = "",
  initialData = null,
  isEdit = false,
  onBack,
  onSubmit,
}: Props) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<RegistrationForm>({
    name: initialData?.name || defaultName,
    chatId: initialData?.chatId || existingChatId || "",
    role: initialData?.role || "",
    region: initialData?.region || "",
    intro: initialData?.intro || "",
    experience: initialData?.experience || "",
    speciality: initialData?.speciality || "",
    contactType: initialData?.contactType || "signbridge",
    contactValue: initialData?.contactValue || "",
    publicProfile: initialData?.publicProfile ?? true,
    certFiles: initialData?.certFiles || [],
  });

  const set = <K extends keyof RegistrationForm>(
    k: K,
    v: RegistrationForm[K],
  ) => setForm((f) => ({ ...f, [k]: v }));

  // chatId가 이미 있으면 잠금 처리 (수정 시)
  const chatIdLocked = isEdit && !!existingChatId;

  // ── 유효성 검사 ──────────────────────────────────────────────
  const validate = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!form.name.trim()) e.name = "이름을 입력해 주세요.";
      if (!form.role) e.role = "역할을 선택해 주세요.";
      if (!form.region) e.region = "지역을 선택해 주세요.";
      if (!form.intro.trim()) e.intro = "자기소개를 입력해 주세요.";
    }
    if (s === 3) {
      // signbridge 타입은 contactValue 불필요
      if (form.contactType !== "signbridge" && !form.contactValue.trim()) {
        e.contactValue = "연락처를 입력해 주세요.";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = async () => {
    if (!validate(step)) return;
    if (step < 3) {
      setStep((s) => s + 1);
      return;
    }
    setLoading(true);
    try {
      await onSubmit(form);
    } catch {
      Alert.alert("오류", "저장에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  // ── 선택 버튼 그룹 ────────────────────────────────────────────
  const ToggleGroup = ({
    options,
    value,
    onChange,
  }: {
    options: string[];
    value: string;
    onChange: (v: string) => void;
  }) => (
    <View style={st.toggleGroup}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[st.toggle, value === opt && st.toggleOn]}
          onPress={() => onChange(opt)}
          activeOpacity={0.75}
        >
          <Text style={[st.toggleTxt, value === opt && st.toggleTxtOn]}>
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView
      style={st.page}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* 스텝 인디케이터 */}
      <View style={st.steps}>
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = step > n;
          const now = step === n;
          return (
            <React.Fragment key={n}>
              <View style={st.stepWrap}>
                <View style={[st.dot, now && st.dotNow, done && st.dotDone]}>
                  <Text style={[st.dotTxt, (now || done) && st.dotTxtOn]}>
                    {done ? "✓" : n}
                  </Text>
                </View>
                <Text
                  style={[
                    st.stepLbl,
                    now && st.stepLblNow,
                    done && st.stepLblDone,
                  ]}
                >
                  {label}
                </Text>
              </View>
              {i < STEPS.length - 1 && (
                <View style={[st.stepLine, done && st.stepLineDone]} />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* ════ STEP 1: 기본 정보 ════ */}
      {step === 1 && (
        <View style={st.card}>
          <Text style={st.sectionTitle}>기본 정보</Text>

          {/* 이름 */}
          <View style={st.field}>
            <Text style={st.label}>
              이름 <Text style={{ color: C.red }}>*</Text>
            </Text>
            <TextInput
              style={[st.input, errors.name && st.inputErr]}
              placeholder="이름을 입력하세요"
              placeholderTextColor="#bbb"
              value={form.name}
              onChangeText={(v) => set("name", v)}
            />
            {errors.name && <Text style={st.err}>{errors.name}</Text>}
          </View>

          {/* Chat ID — 잠김(수정) vs 입력(신규) */}
          <View style={st.field}>
            <Text style={st.label}>
              Chat ID{" "}
              <Text style={st.optTxt}>
                (선택 · 고유 아이디, 한 번 설정 후 변경 불가)
              </Text>
            </Text>
            {chatIdLocked ? (
              // 잠금 표시 — 웹 reg-chatid-locked
              <View style={st.chatIdLocked}>
                <Text style={st.chatIdLockedAt}>@</Text>
                <Text style={st.chatIdLockedValue}>{form.chatId}</Text>
                <View style={st.chatIdLockedBadge}>
                  <Text style={st.chatIdLockedBadgeTxt}>변경 불가</Text>
                </View>
              </View>
            ) : (
              <View style={st.chatIdInputWrap}>
                <Text style={st.chatIdAt}>@</Text>
                <TextInput
                  style={[st.chatIdInput, errors.chatId && st.inputErr]}
                  placeholder="chat_id (영문·숫자·_)"
                  placeholderTextColor="#bbb"
                  value={form.chatId}
                  onChangeText={(v) =>
                    set("chatId", v.replace(/[^a-zA-Z0-9_]/g, ""))
                  }
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}
            {errors.chatId && <Text style={st.err}>{errors.chatId}</Text>}
          </View>

          {/* 역할 */}
          <View style={st.field}>
            <Text style={st.label}>
              역할 <Text style={{ color: C.red }}>*</Text>
            </Text>
            <ToggleGroup
              options={ROLE_OPTIONS}
              value={form.role}
              onChange={(v) => set("role", v)}
            />
            {errors.role && <Text style={st.err}>{errors.role}</Text>}
          </View>

          {/* 지역 */}
          <View style={st.field}>
            <Text style={st.label}>
              지역 <Text style={{ color: C.red }}>*</Text>
            </Text>
            <ToggleGroup
              options={REGION_OPTIONS}
              value={form.region}
              onChange={(v) => set("region", v)}
            />
            {errors.region && <Text style={st.err}>{errors.region}</Text>}
          </View>

          {/* 자기소개 */}
          <View style={st.field}>
            <Text style={st.label}>
              자기소개 <Text style={{ color: C.red }}>*</Text>
            </Text>
            <TextInput
              style={[st.textarea, errors.intro && st.inputErr]}
              placeholder="간단히 소개해 주세요"
              placeholderTextColor="#bbb"
              value={form.intro}
              onChangeText={(v) => set("intro", v)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {errors.intro && <Text style={st.err}>{errors.intro}</Text>}
          </View>

          {/* 공개 여부 */}
          <View style={st.field}>
            <Text style={st.label}>공개 여부</Text>
            <View style={st.toggleGroup}>
              {[
                { v: true, l: "🌐 공개" },
                { v: false, l: "🔒 비공개" },
              ].map(({ v, l }) => (
                <TouchableOpacity
                  key={l}
                  style={[st.toggle, form.publicProfile === v && st.toggleOn]}
                  onPress={() => set("publicProfile", v)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      st.toggleTxt,
                      form.publicProfile === v && st.toggleTxtOn,
                    ]}
                  >
                    {l}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* ════ STEP 2: 자세한 소개 ════ */}
      {step === 2 && (
        <View style={st.card}>
          <Text style={st.sectionTitle}>
            자세한 소개 <Text style={st.optTxt}>(선택)</Text>
          </Text>

          {/* 경력 */}
          <View style={st.field}>
            <Text style={st.label}>경력 / 활동 이력</Text>
            <TextInput
              style={st.textarea}
              placeholder="경력이나 활동 이력을 입력하세요"
              placeholderTextColor="#bbb"
              value={form.experience}
              onChangeText={(v) => set("experience", v)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* 전문 분야 */}
          <View style={st.field}>
            <Text style={st.label}>전문 분야</Text>
            <TextInput
              style={st.input}
              placeholder="예: 의료수어, 법정수어 (쉼표로 구분)"
              placeholderTextColor="#bbb"
              value={form.speciality}
              onChangeText={(v) => set("speciality", v)}
            />
          </View>
        </View>
      )}

      {/* ════ STEP 3: 연락처 ════ */}
      {step === 3 && (
        <View style={st.card}>
          <Text style={st.sectionTitle}>연락처</Text>

          {/* 연락 유형 */}
          <View style={st.field}>
            <Text style={st.label}>
              연락 방법 <Text style={{ color: C.red }}>*</Text>
            </Text>
            <View style={st.contactTypes}>
              {CONTACT_TYPES.map(({ id, label }) => (
                <TouchableOpacity
                  key={id}
                  style={[
                    st.contactTypeBtn,
                    form.contactType === id && st.contactTypeBtnOn,
                  ]}
                  onPress={() => set("contactType", id)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      st.contactTypeTxt,
                      form.contactType === id && st.contactTypeTxtOn,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* SignBridge 선택 시 앱 내 채팅 안내 */}
          {form.contactType === "signbridge" && (
            <View style={st.signbridgeHint}>
              <Text style={st.signbridgeHintTxt}>
                💡 상대방이 앱 내 SignBridge 채팅으로 연락합니다. 별도 입력
                불필요!
              </Text>
            </View>
          )}

          {/* SignBridge가 아닌 경우 연락처 입력 */}
          {form.contactType !== "signbridge" && (
            <View style={st.field}>
              <Text style={st.label}>
                {form.contactType === "chat"
                  ? "오픈채팅 링크"
                  : form.contactType === "phone"
                    ? "전화번호"
                    : "이메일"}{" "}
                <Text style={{ color: C.red }}>*</Text>
              </Text>
              <TextInput
                style={[st.input, errors.contactValue && st.inputErr]}
                placeholder={
                  form.contactType === "chat"
                    ? "https://open.kakao.com/..."
                    : form.contactType === "phone"
                      ? "010-0000-0000"
                      : "example@email.com"
                }
                placeholderTextColor="#bbb"
                value={form.contactValue}
                onChangeText={(v) => set("contactValue", v)}
                keyboardType={
                  form.contactType === "phone"
                    ? "phone-pad"
                    : form.contactType === "email"
                      ? "email-address"
                      : "url"
                }
                autoCapitalize="none"
              />
              {errors.contactValue && (
                <Text style={st.err}>{errors.contactValue}</Text>
              )}
            </View>
          )}

          {/* 요약 */}
          <View style={st.summary}>
            <Text style={st.summaryTitle}>📋 등록 요약</Text>
            {[
              ["이름", form.name],
              ["Chat ID", form.chatId ? `@${form.chatId}` : "-"],
              ["역할", form.role],
              ["지역", form.region],
              ["공개", form.publicProfile ? "공개" : "비공개"],
            ].map(([k, v]) => (
              <View key={k} style={st.summaryRow}>
                <Text style={st.summaryKey}>{k}</Text>
                <Text style={st.summaryVal}>{v || "-"}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 버튼 행 */}
      <View style={st.btnRow}>
        {step > 1 && (
          <TouchableOpacity
            style={st.btnBack}
            onPress={() => setStep((s) => s - 1)}
            activeOpacity={0.8}
          >
            <Text style={st.btnBackTxt}>← 이전</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[st.btnNext, { flex: 1 }, loading && { opacity: 0.7 }]}
          onPress={handleNext}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={st.btnNextTxt}>
              {step === 3 ? (isEdit ? "수정 완료" : "등록하기") : "다음 →"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.white, padding: 20 },

  // 스텝
  steps: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  stepWrap: { alignItems: "center", gap: 4 },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: C.border,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
  },
  dotNow: { borderColor: C.accent, backgroundColor: C.accent },
  dotDone: { borderColor: "#10b981", backgroundColor: "#10b981" },
  dotTxt: { fontSize: 13, fontWeight: "700", color: "#9ca3af" },
  dotTxtOn: { color: C.white },
  stepLbl: { fontSize: 11, fontWeight: "600", color: "#9ca3af" },
  stepLblNow: { color: C.accent },
  stepLblDone: { color: "#10b981" },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: C.border,
    marginBottom: 14,
    marginHorizontal: 6,
  },
  stepLineDone: { backgroundColor: "#10b981" },

  // 카드
  card: {
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 20,
    padding: 22,
    gap: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: C.text,
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: "#f3f4f6",
  },
  optTxt: { fontSize: 11, fontWeight: "400", color: C.sub },

  // 필드
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: "700", color: "#374151" },
  input: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: "#111",
    backgroundColor: "#fafaf8",
  },
  textarea: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: "#111",
    backgroundColor: "#fafaf8",
    minHeight: 90,
  },
  inputErr: { borderColor: C.red },
  err: { fontSize: 11, color: C.red, fontWeight: "600" },

  // chatId 잠금 표시 — 웹 reg-chatid-locked
  chatIdLocked: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.bg,
    borderWidth: 1.5,
    borderColor: "#e0e7ff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  chatIdLockedAt: { color: C.accent, fontWeight: "700", fontSize: 15 },
  chatIdLockedValue: {
    fontSize: 15,
    fontWeight: "700",
    color: C.text,
    flex: 1,
  },
  chatIdLockedBadge: {
    backgroundColor: C.accentBg,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  chatIdLockedBadgeTxt: { fontSize: 11, fontWeight: "700", color: C.accent },

  // chatId 입력 (신규)
  chatIdInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    backgroundColor: "#fafaf8",
    paddingHorizontal: 14,
    overflow: "hidden",
  },
  chatIdAt: {
    fontSize: 15,
    fontWeight: "700",
    color: C.accent,
    marginRight: 4,
  },
  chatIdInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 14,
    color: "#111",
  },

  // 토글 그룹
  toggleGroup: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  toggle: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: C.white,
  },
  toggleOn: { borderColor: C.accent, backgroundColor: C.accentBg },
  toggleTxt: { fontSize: 13, fontWeight: "600", color: C.sub },
  toggleTxtOn: { color: C.accent },

  // 연락처
  contactTypes: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  contactTypeBtn: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: "center",
    backgroundColor: C.white,
  },
  contactTypeBtnOn: { borderColor: C.accent, backgroundColor: C.accentBg },
  contactTypeTxt: { fontSize: 12, fontWeight: "600", color: C.sub },
  contactTypeTxtOn: { color: C.accent, fontWeight: "700" },

  // SignBridge 선택 안내
  signbridgeHint: {
    backgroundColor: C.accentBg,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  signbridgeHintTxt: { fontSize: 13, color: C.accent, lineHeight: 20 },

  // 요약
  summary: { backgroundColor: C.bg, borderRadius: 12, padding: 16, gap: 8 },
  summaryTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: C.accent,
    marginBottom: 4,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryKey: { fontSize: 13, color: C.sub, fontWeight: "600" },
  summaryVal: { fontSize: 13, color: "#374151", fontWeight: "700" },

  // 버튼
  btnRow: { flexDirection: "row", gap: 10 },
  btnBack: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnBackTxt: { fontSize: 14, fontWeight: "700", color: C.sub },
  btnNext: {
    backgroundColor: C.accent,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  btnNextTxt: { color: C.white, fontSize: 15, fontWeight: "700" },
});
