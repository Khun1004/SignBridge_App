// ══════════════════════════════════════════════════════════════
//  app/registration.tsx — 커뮤니티 프로필 등록 (웹 Registration 포팅)
//  3단계 스텝: 기본정보 → 자세한소개 → 연락처
// ══════════════════════════════════════════════════════════════
import { communityApi } from "@/components/api/api";
import { useAuth } from "@/components/contexts/AuthContext";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const C = {
  accent: "#6366f1",
  text: "#1e1b4b",
  sub: "#6b7280",
  border: "#e5e7eb",
  bg: "#fafaf8",
  card: "#ffffff",
  err: "#ef4444",
  green: "#10b981",
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
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
  "기타",
];
const CONTACT_TYPES = [
  { id: "chat", label: "💬 오픈채팅", placeholder: "카카오 오픈채팅 링크" },
  { id: "phone", label: "📞 전화번호", placeholder: "010-0000-0000" },
  { id: "email", label: "📧 이메일", placeholder: "example@email.com" },
];
const STEPS = ["기본 정보", "자세한 소개", "연락처"];

export default function RegistrationScreen() {
  const router = useRouter();
  const { displayName, userEmail } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: displayName || "",
    role: "",
    region: "",
    intro: "",
    experience: "",
    speciality: "",
    contactType: "chat",
    contactValue: "",
    publicProfile: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const validate1 = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "이름을 입력해 주세요.";
    if (!form.role) e.role = "역할을 선택해 주세요.";
    if (!form.region) e.region = "지역을 선택해 주세요.";
    setErrors(e);
    return !Object.keys(e).length;
  };
  const validate2 = () => {
    const e: Record<string, string> = {};
    if (!form.intro.trim()) e.intro = "자기소개를 입력해 주세요.";
    setErrors(e);
    return !Object.keys(e).length;
  };
  const validate3 = () => {
    const e: Record<string, string> = {};
    if (!form.contactValue.trim()) e.contact = "연락처를 입력해 주세요.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const next = () => {
    if (step === 1 && !validate1()) return;
    if (step === 2 && !validate2()) return;
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    if (!validate3()) return;
    setSaving(true);
    try {
      await communityApi.save({
        name: form.name.trim(),
        userEmail: userEmail || "",
        role: form.role,
        region: form.region,
        intro: form.intro.trim(),
        experience: form.experience.trim(),
        speciality: form.speciality.trim(),
        contactType: form.contactType,
        contactValue: form.contactValue.trim(),
        publicProfile: form.publicProfile,
      });
      setSaved(true);
    } catch (e: any) {
      Alert.alert("오류", `저장 실패: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.successBox}>
          <Text style={{ fontSize: 64 }}>✅</Text>
          <Text style={st.successTitle}>등록 완료!</Text>
          <Text style={st.successDesc}>커뮤니티 프로필이 등록되었습니다.</Text>
          <TouchableOpacity style={st.btnPrimary} onPress={() => router.back()}>
            <Text style={st.btnPrimaryTxt}>← 커뮤니티로 돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const ctPlaceholder =
    CONTACT_TYPES.find((c) => c.id === form.contactType)?.placeholder || "";

  return (
    <SafeAreaView style={st.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* 스텝 인디케이터 */}
        <View style={st.stepsRow}>
          {STEPS.map((label, i) => {
            const state =
              step === i + 1 ? "active" : step > i + 1 ? "done" : "idle";
            return (
              <React.Fragment key={i}>
                <View style={st.stepWrap}>
                  <View
                    style={[
                      st.stepDot,
                      state === "active" && st.stepDotActive,
                      state === "done" && st.stepDotDone,
                    ]}
                  >
                    <Text
                      style={[
                        st.stepDotTxt,
                        (state === "active" || state === "done") &&
                          st.stepDotTxtOn,
                      ]}
                    >
                      {state === "done" ? "✓" : i + 1}
                    </Text>
                  </View>
                  <Text
                    style={[
                      st.stepLabel,
                      state === "active" && st.stepLabelActive,
                      state === "done" && st.stepLabelDone,
                    ]}
                  >
                    {label}
                  </Text>
                </View>
                {i < STEPS.length - 1 && (
                  <View
                    style={[st.stepLine, step > i + 1 && st.stepLineDone]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>

        <ScrollView
          contentContainerStyle={st.scrollBody}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* STEP 1 — 기본 정보 */}
          {step === 1 && (
            <View style={st.card}>
              <Text style={st.cardTitle}>👤 기본 정보</Text>

              <View style={st.field}>
                <Text style={st.label}>
                  이름 <Text style={st.req}>*</Text>
                </Text>
                <TextInput
                  style={[st.input, errors.name && st.inputErr]}
                  placeholder="이름 또는 닉네임"
                  placeholderTextColor="#9ca3af"
                  value={form.name}
                  onChangeText={(v) => update("name", v)}
                />
                {errors.name && <Text style={st.errTxt}>{errors.name}</Text>}
              </View>

              <View style={st.field}>
                <Text style={st.label}>
                  역할 <Text style={st.req}>*</Text>
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={st.toggleRow}>
                    {ROLE_OPTIONS.map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[
                          st.toggleBtn,
                          form.role === r && st.toggleBtnOn,
                        ]}
                        onPress={() => update("role", r)}
                      >
                        <Text
                          style={[
                            st.toggleTxt,
                            form.role === r && st.toggleTxtOn,
                          ]}
                        >
                          {r}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                {errors.role && <Text style={st.errTxt}>{errors.role}</Text>}
              </View>

              <View style={st.field}>
                <Text style={st.label}>
                  활동 지역 <Text style={st.req}>*</Text>
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={st.toggleRow}>
                    {REGION_OPTIONS.map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[
                          st.toggleBtn,
                          form.region === r && st.toggleBtnOn,
                        ]}
                        onPress={() => update("region", r)}
                      >
                        <Text
                          style={[
                            st.toggleTxt,
                            form.region === r && st.toggleTxtOn,
                          ]}
                        >
                          {r}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                {errors.region && (
                  <Text style={st.errTxt}>{errors.region}</Text>
                )}
              </View>

              <View style={st.field}>
                <Text style={st.label}>프로필 공개 여부</Text>
                <View style={st.toggleRow}>
                  {[
                    { v: true, l: "🌐 공개" },
                    { v: false, l: "🔒 비공개" },
                  ].map(({ v, l }) => (
                    <TouchableOpacity
                      key={String(v)}
                      style={[
                        st.toggleBtn,
                        form.publicProfile === v && st.toggleBtnOn,
                      ]}
                      onPress={() => update("publicProfile", v)}
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

              <TouchableOpacity style={st.btnPrimary} onPress={next}>
                <Text style={st.btnPrimaryTxt}>다음 → 자세한 소개</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2 — 자세한 소개 */}
          {step === 2 && (
            <View style={st.card}>
              <Text style={st.cardTitle}>📝 자세한 소개</Text>

              <View style={st.field}>
                <Text style={st.label}>
                  자기소개 <Text style={st.req}>*</Text>
                </Text>
                <TextInput
                  style={[st.textarea, errors.intro && st.inputErr]}
                  placeholder="간단한 자기소개를 작성해 주세요"
                  placeholderTextColor="#9ca3af"
                  value={form.intro}
                  onChangeText={(v) => update("intro", v)}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                {errors.intro && <Text style={st.errTxt}>{errors.intro}</Text>}
              </View>

              <View style={st.field}>
                <Text style={st.label}>
                  경력/경험 <Text style={st.opt}>(선택)</Text>
                </Text>
                <TextInput
                  style={st.textarea}
                  placeholder="수어 관련 경력이나 경험을 작성해 주세요"
                  placeholderTextColor="#9ca3af"
                  value={form.experience}
                  onChangeText={(v) => update("experience", v)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={st.field}>
                <Text style={st.label}>
                  전문 분야 <Text style={st.opt}>(선택)</Text>
                </Text>
                <TextInput
                  style={st.input}
                  placeholder="전문 분야를 입력하세요 (예: 농아 교육, 수화 통역)"
                  placeholderTextColor="#9ca3af"
                  value={form.speciality}
                  onChangeText={(v) => update("speciality", v)}
                />
              </View>

              <View style={st.btnRow}>
                <TouchableOpacity style={st.btnBack} onPress={() => setStep(1)}>
                  <Text style={st.btnBackTxt}>← 이전</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[st.btnPrimary, { flex: 1 }]}
                  onPress={next}
                >
                  <Text style={st.btnPrimaryTxt}>다음 → 연락처</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 3 — 연락처 */}
          {step === 3 && (
            <View style={st.card}>
              <Text style={st.cardTitle}>📞 연락처</Text>

              <View style={st.field}>
                <Text style={st.label}>
                  연락 방법 <Text style={st.req}>*</Text>
                </Text>
                <View style={st.toggleRow}>
                  {CONTACT_TYPES.map((ct) => (
                    <TouchableOpacity
                      key={ct.id}
                      style={[
                        st.toggleBtn,
                        form.contactType === ct.id && st.toggleBtnOn,
                      ]}
                      onPress={() => update("contactType", ct.id)}
                    >
                      <Text
                        style={[
                          st.toggleTxt,
                          form.contactType === ct.id && st.toggleTxtOn,
                        ]}
                      >
                        {ct.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={st.field}>
                <Text style={st.label}>
                  연락처 <Text style={st.req}>*</Text>
                </Text>
                <TextInput
                  style={[st.input, errors.contact && st.inputErr]}
                  placeholder={ctPlaceholder}
                  placeholderTextColor="#9ca3af"
                  value={form.contactValue}
                  onChangeText={(v) => update("contactValue", v)}
                />
                {errors.contact && (
                  <Text style={st.errTxt}>{errors.contact}</Text>
                )}
              </View>

              {/* 요약 */}
              <View style={st.summary}>
                <Text style={st.summaryTitle}>📋 입력 내용 확인</Text>
                {[
                  ["이름", form.name],
                  ["역할", form.role],
                  ["지역", form.region],
                  ["공개", form.publicProfile ? "공개" : "비공개"],
                  [
                    "연락처",
                    `${CONTACT_TYPES.find((c) => c.id === form.contactType)?.label} ${form.contactValue}`,
                  ],
                ].map(([k, v]) => (
                  <View key={k} style={st.summaryRow}>
                    <Text style={st.summaryKey}>{k}</Text>
                    <Text style={st.summaryVal}>{v || "-"}</Text>
                  </View>
                ))}
              </View>

              <View style={st.btnRow}>
                <TouchableOpacity style={st.btnBack} onPress={() => setStep(2)}>
                  <Text style={st.btnBackTxt}>← 이전</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[st.btnSubmit, saving && { opacity: 0.6 }]}
                  onPress={handleSubmit}
                  disabled={saving}
                >
                  <Text style={st.btnSubmitTxt}>
                    {saving ? "⏳ 저장 중..." : "💾 등록하기"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  // 스텝 인디케이터
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  stepWrap: { alignItems: "center", gap: 4 },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: C.border,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotActive: { borderColor: C.accent, backgroundColor: C.accent },
  stepDotDone: { borderColor: C.green, backgroundColor: C.green },
  stepDotTxt: { fontSize: 13, fontWeight: "700", color: "#9ca3af" },
  stepDotTxtOn: { color: "#fff" },
  stepLabel: { fontSize: 10, fontWeight: "600", color: "#9ca3af" },
  stepLabelActive: { color: C.accent },
  stepLabelDone: { color: C.green },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: C.border,
    marginBottom: 14,
    marginHorizontal: 4,
  },
  stepLineDone: { backgroundColor: C.green },

  scrollBody: { padding: 14, paddingBottom: 40 },

  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.border,
    padding: 20,
    gap: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: C.text,
    paddingBottom: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: "#f3f4f6",
  },

  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: "700", color: "#374151" },
  req: { color: C.err },
  opt: { fontWeight: "400", color: "#9ca3af", fontSize: 11 },
  input: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    padding: 11,
    fontSize: 14,
    color: "#111",
    backgroundColor: C.bg,
  },
  textarea: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    padding: 11,
    fontSize: 14,
    color: "#111",
    backgroundColor: C.bg,
    minHeight: 88,
    textAlignVertical: "top",
  },
  inputErr: { borderColor: C.err },
  errTxt: { fontSize: 11, color: C.err, fontWeight: "600" },

  toggleRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    backgroundColor: C.card,
  },
  toggleBtnOn: { borderColor: C.accent, backgroundColor: "#eef2ff" },
  toggleTxt: { fontSize: 12, fontWeight: "600", color: C.sub },
  toggleTxtOn: { color: C.accent },

  summary: {
    backgroundColor: "#f8f9ff",
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: C.accent,
    marginBottom: 4,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryKey: { fontSize: 13, color: "#9ca3af", fontWeight: "600" },
  summaryVal: { fontSize: 13, color: "#374151", fontWeight: "700" },

  btnRow: { flexDirection: "row", gap: 10 },
  btnBack: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.card,
  },
  btnBackTxt: { fontSize: 13, fontWeight: "700", color: C.sub },
  btnPrimary: {
    backgroundColor: C.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
  },
  btnPrimaryTxt: { color: "#fff", fontSize: 14, fontWeight: "700" },
  btnSubmit: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#8b5cf6",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
  },
  btnSubmitTxt: { color: "#fff", fontSize: 14, fontWeight: "700" },

  successBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 32,
  },
  successTitle: { fontSize: 28, fontWeight: "900", color: "#111" },
  successDesc: { fontSize: 15, color: C.sub, textAlign: "center" },
});
