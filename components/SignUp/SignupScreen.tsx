// ══════════════════════════════════════════════════════════════
//  SignupScreen.tsx — 회원가입 (expo-auth-session Google 로그인)
//  Expo Go 호환 버전
// ══════════════════════════════════════════════════════════════
import { authApi } from "@/components/api/api";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
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

import { C, mo } from "./../SignUp/authStyles";
import AddressSearchModal, { AddressData } from "./AddressSearchModal";

// ── 비밀번호 강도 표시 컴포넌트 ────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8자 이상", ok: password.length >= 8 },
    { label: "영문 대문자", ok: /[A-Z]/.test(password) },
    { label: "영문 소문자", ok: /[a-z]/.test(password) },
    { label: "숫자", ok: /\d/.test(password) },
    { label: "특수문자(!@#$)", ok: /[!@#$%^&*]/.test(password) },
  ];
  const passed = checks.filter((c) => c.ok).length;
  const color =
    passed <= 2
      ? "#ef4444"
      : passed <= 3
        ? "#f59e0b"
        : passed <= 4
          ? "#3b82f6"
          : "#10b981";
  const label =
    passed <= 2
      ? "약함"
      : passed <= 3
        ? "보통"
        : passed <= 4
          ? "강함"
          : "매우 강함";

  return (
    <View style={{ marginTop: 8, gap: 6 }}>
      {/* 강도 바 */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View
          style={{
            flex: 1,
            height: 4,
            backgroundColor: "#e5e7eb",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${(passed / 5) * 100}%` as any,
              height: "100%",
              backgroundColor: color,
              borderRadius: 4,
            }}
          />
        </View>
        <Text style={{ fontSize: 11, fontWeight: "700", color, minWidth: 50 }}>
          {label}
        </Text>
      </View>
      {/* 체크 항목 */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5 }}>
        {checks.map((c) => (
          <View
            key={c.label}
            style={{
              paddingHorizontal: 7,
              paddingVertical: 2,
              borderRadius: 20,
              backgroundColor: c.ok
                ? "rgba(16,185,129,0.1)"
                : "rgba(0,0,0,0.05)",
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "600",
                color: c.ok ? "#059669" : "#9ca3af",
              }}
            >
              {c.ok ? "✓" : "○"} {c.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── 기관 유형 ────────────────────────────────────────────────
const ORG_TYPES = [
  {
    id: "personal",
    icon: "👤",
    label: "개인",
    desc: "청각장애인 개인 사용자",
    color: "#2563eb",
  },
  {
    id: "immigration",
    icon: "🛂",
    label: "출입국외국인사무소",
    desc: "출입국 심사 및 외국인 업무",
    color: "#7c3aed",
  },
  {
    id: "airport",
    icon: "✈️",
    label: "공항",
    desc: "공항 안내 및 탑승 서비스",
    color: "#0891b2",
  },
  {
    id: "hospital",
    icon: "🏥",
    label: "병원",
    desc: "의료 기관 및 응급실",
    color: "#059669",
  },
  {
    id: "police",
    icon: "👮",
    label: "경찰서",
    desc: "경찰 업무 및 민원 처리",
    color: "#dc2626",
  },
];

type OrgField = {
  id: string;
  label: string;
  placeholder?: string;
  required: boolean;
  hint?: string;
};
const ORG_FIELDS: Record<string, OrgField[]> = {
  personal: [
    {
      id: "disabilityGrade",
      label: "장애 등급",
      placeholder: "예: 청각장애 1급 (해당 없으면 비워두세요)",
      required: false,
    },
    { id: "address", label: "거주 지역 (주소)", required: false },
  ],
  immigration: [
    {
      id: "officeName",
      label: "사무소명",
      placeholder: "예: 인천출입국·외국인사무소",
      required: true,
    },
    {
      id: "orgCode",
      label: "사무소 관리 코드",
      placeholder: "예: IMM-ICN-001",
      hint: "법무부 출입국·외국인정책본부에서 발급한 사무소 관리 코드를 입력하세요.",
      required: true,
    },
    { id: "address", label: "주소", required: true },
  ],
  airport: [
    {
      id: "officeName",
      label: "공항명",
      placeholder: "예: 인천국제공항",
      required: true,
    },
    {
      id: "orgCode",
      label: "IATA 공항 코드",
      placeholder: "예: ICN",
      hint: "국제항공운송협회(IATA)에서 부여한 3자리 공항 코드를 입력하세요.",
      required: true,
    },
    { id: "address", label: "주소", required: true },
  ],
  hospital: [
    {
      id: "officeName",
      label: "병원명",
      placeholder: "예: 서울아산병원",
      required: true,
    },
    {
      id: "orgCode",
      label: "요양기관 기호",
      placeholder: "예: 12345678",
      hint: "건강보험심사평가원(HIRA)에 등록된 8자리 요양기관 기호를 입력하세요.",
      required: true,
    },
    { id: "address", label: "주소", required: true },
  ],
  police: [
    {
      id: "officeName",
      label: "경찰서명",
      placeholder: "예: 서울 강남경찰서",
      required: true,
    },
    {
      id: "orgCode",
      label: "경찰청 기관 코드",
      placeholder: "예: POL-1174",
      hint: "경찰청에서 부여한 기관 고유 코드를 입력하세요.",
      required: true,
    },
    { id: "address", label: "주소", required: true },
  ],
};

const SIGN_OPTIONS = [
  "수어 사용자 (청각장애인)",
  "수어 학습자",
  "가족/보호자",
  "수어 관심자",
  "기타",
];
const STEP_LABELS = ["기관 선택", "기본 정보", "상세 입력"];

export interface SignupScreenProps {
  visible: boolean;
  onClose: () => void;
  onSignedUpName?: (name: string) => void;
  onSwitchToLogin: () => void;
}

export default function SignupScreen({
  visible,
  onClose,
  onSignedUpName,
  onSwitchToLogin,
}: SignupScreenProps) {
  const [step, setStep] = useState(1);
  const [orgType, setOrgType] = useState("");
  const [addrModalVisible, setAddrModalVisible] = useState(false);
  const [googleFilled, setGoogleFilled] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPw, setShowPw] = useState(false); // 비밀번호 표시
  const [showPwConfirm, setShowPwConfirm] = useState(false); // 비밀번호 확인 표시
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
    disabilityGrade: "",
    preferredSign: "",
    officeName: "",
    orgCode: "",
    address: "",
    zonecode: "",
    addressDetail: "",
    agreeTerms: false as boolean,
    agreePrivacy: false as boolean,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // ── Google OAuth 설정 ────────────────────────────────────
  // Google Cloud Console에서 발급한 클라이언트 ID를 입력하세요

  const isOrg = orgType && orgType !== "personal";
  const orgInfo = ORG_TYPES.find((o) => o.id === orgType);
  const orgFields = ORG_FIELDS[orgType] || [];
  const upd = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleAddressSelect = (data: AddressData, detail: string) => {
    setForm((f) => ({
      ...f,
      zonecode: data.zonecode,
      address: data.address,
      addressDetail: detail || data.buildingName || "",
    }));
    setErrors((e) => {
      const next = { ...e };
      delete next.address;
      return next;
    });
  };

  const reset = () => {
    setStep(1);
    setOrgType("");
    setErrors({});
    setGoogleFilled(false);
    setForm({
      name: "",
      email: "",
      password: "",
      passwordConfirm: "",
      disabilityGrade: "",
      preferredSign: "",
      officeName: "",
      orgCode: "",
      address: "",
      zonecode: "",
      addressDetail: "",
      agreeTerms: false,
      agreePrivacy: false,
    });
  };
  const close = () => {
    reset();
    onClose();
  };

  // ── Google 로그인 (Android 전용 — 동적 import) ──────────────
  const handleGoogleSignup = async () => {
    if (Platform.OS !== "android") return;
    setGoogleLoading(true);
    setErrors({});
    try {
      // Android 빌드에서만 동적으로 로드
      const { GoogleSignin, statusCodes } =
        await import("@react-native-google-signin/google-signin");
      GoogleSignin.configure({
        webClientId:
          "411621867441-kppj03er9lmphs2aqea4e4cbau9qes65.apps.googleusercontent.com",
        offlineAccess: true,
      });
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const user = (response as any).data?.user || (response as any).user;
      const name = user?.name || "";
      const email = user?.email || "";
      setForm((f) => ({
        ...f,
        name,
        email,
        password: "",
        passwordConfirm: "",
      }));
      setGoogleFilled(true);
    } catch (error: any) {
      const SIGN_IN_CANCELLED = "SIGN_IN_CANCELLED";
      if (error.code === SIGN_IN_CANCELLED) {
        // 취소 — 무시
      } else {
        setErrors({ google: error.message || "Google 로그인에 실패했습니다." });
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── 유효성 검사 ─────────────────────────────────────────────
  const v1 = () => {
    if (!orgType) {
      setErrors({ orgType: "기관을 선택해주세요." });
      return false;
    }
    setErrors({});
    return true;
  };
  const v2 = () => {
    const e: Record<string, string> = {};
    if (!isOrg && !form.name.trim()) e.name = "이름을 입력해주세요.";
    if (!form.email.includes("@")) e.email = "올바른 이메일을 입력해주세요.";
    if (!googleFilled) {
      const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
      if (!form.password) {
        e.password = "비밀번호를 입력해주세요.";
      } else if (!pwRegex.test(form.password)) {
        e.password =
          "영문 대소문자, 숫자, 특수문자를 포함한 8자 이상이어야 합니다.";
      }
      if (form.password !== form.passwordConfirm)
        e.passwordConfirm = "비밀번호가 일치하지 않습니다.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const v3 = () => {
    const e: Record<string, string> = {};
    orgFields.forEach((f) => {
      if (f.required && !(form as any)[f.id]?.toString().trim())
        e[f.id] = `${f.label}을(를) 입력해주세요.`;
    });
    if (!form.agreeTerms) e.agreeTerms = "이용약관에 동의해주세요.";
    if (!form.agreePrivacy)
      e.agreePrivacy = "개인정보 처리방침에 동의해주세요.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = async () => {
    if (step === 1) {
      if (v1()) {
        setErrors({});
        setStep(2);
      }
      return;
    }
    if (step === 2) {
      if (v2()) {
        setErrors({});
        setStep(3);
      }
      return;
    }
    if (!v3()) return;

    setLoading(true);
    try {
      await authApi.signup({
        name: isOrg ? form.officeName : form.name,
        email: form.email,
        password: form.password || "google_oauth",
        orgType,
        officeName: form.officeName || undefined,
        orgCode: form.orgCode || undefined,
        address: form.address || undefined,
        addressDetail: form.addressDetail || undefined,
        zonecode: form.zonecode || undefined,
        disabilityGrade: form.disabilityGrade || undefined,
        preferredSign: form.preferredSign || undefined,
      });
      setStep(4);
    } catch (e: any) {
      if (e.message.includes("409") || e.message.includes("이미")) {
        setErrors({ submit: "이미 사용 중인 이메일입니다." });
      } else if (e.message.includes("Network") || e.message.includes("fetch")) {
        setErrors({
          submit: "서버에 연결할 수 없습니다. 네트워크를 확인해주세요.",
        });
      } else {
        setErrors({ submit: e.message || "회원가입에 실패했습니다." });
      }
    } finally {
      setLoading(false);
    }
  };

  // ══ 완료 화면 ══
  if (step === 4)
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <Pressable style={mo.overlay} onPress={close}>
          <Pressable
            style={[
              mo.card,
              { alignItems: "center", paddingVertical: 36, gap: 14 },
            ]}
            onPress={() => {}}
          >
            <View style={mo.topBar} />
            <TouchableOpacity
              style={mo.xBtn}
              onPress={close}
              activeOpacity={0.7}
            >
              <Text style={mo.xTxt}>✕</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 52 }}>🎉</Text>
            <Text style={mo.title}>가입이 완료되었습니다!</Text>
            <Text style={[mo.sub, { textAlign: "center" }]}>
              {isOrg
                ? "기관 계정이 생성되었습니다."
                : `${form.name}님, 환영합니다!`}
              {"\n"}로그인 후 서비스를 이용해주세요.
            </Text>
            {orgInfo && (
              <View
                style={[
                  mo.badge,
                  {
                    borderColor: orgInfo.color + "55",
                    backgroundColor: orgInfo.color + "12",
                  },
                ]}
              >
                <Text>{orgInfo.icon}</Text>
                <Text style={[mo.badgeTxt, { color: orgInfo.color }]}>
                  {orgInfo.label}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={[mo.btn, { width: "100%" }]}
              onPress={() => {
                const n = isOrg ? form.officeName : form.name;
                reset();
                onSignedUpName?.(n);
                onSwitchToLogin();
              }}
              activeOpacity={0.85}
            >
              <Text style={mo.btnTxt}>로그인하러 가기 →</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    );

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <AddressSearchModal
          visible={addrModalVisible}
          onClose={() => setAddrModalVisible(false)}
          onSelect={handleAddressSelect}
        />
        <KeyboardAvoidingView
          style={mo.overlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable style={mo.backdrop} onPress={close} />
          <View style={[mo.card, { maxHeight: "92%" as any }]}>
            <View style={mo.topBar} />
            <TouchableOpacity
              style={mo.xBtn}
              onPress={close}
              activeOpacity={0.7}
            >
              <Text style={mo.xTxt}>✕</Text>
            </TouchableOpacity>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={mo.hd}>
                <View style={mo.logoBox}>
                  <Image
                    source={require("../../assets/images/SignBridge.png")}
                    style={{ width: 100, height: 100, borderRadius: 14 }}
                    resizeMode="contain"
                  />
                </View>
                <Text style={mo.title}>회원가입</Text>
                <Text style={mo.sub}>
                  새 계정을 만들어 SignBridge를 시작하세요.
                </Text>
              </View>

              {/* 스텝 인디케이터 */}
              <View style={sg.steps}>
                {STEP_LABELS.map((lbl, i) => {
                  const n = i + 1;
                  const done = step > n;
                  const now = step === n;
                  return (
                    <React.Fragment key={n}>
                      <View style={sg.sWrap}>
                        <View style={[sg.dot, (now || done) && sg.dotOn]}>
                          <Text
                            style={[sg.dotTxt, (now || done) && sg.dotTxtOn]}
                          >
                            {done ? "✓" : n}
                          </Text>
                        </View>
                        <Text
                          style={[sg.stepLbl, (now || done) && sg.stepLblOn]}
                        >
                          {lbl}
                        </Text>
                      </View>
                      {i < STEP_LABELS.length - 1 && (
                        <View style={[sg.line, done && sg.lineDone]} />
                      )}
                    </React.Fragment>
                  );
                })}
              </View>

              {/* ════ STEP 1: 기관 선택 ════ */}
              {step === 1 && (
                <View style={{ gap: 8 }}>
                  <Text style={mo.sub}>소속 기관을 선택해주세요.</Text>
                  {errors.orgType && (
                    <Text style={mo.errField}>{errors.orgType}</Text>
                  )}
                  {ORG_TYPES.map((org) => (
                    <TouchableOpacity
                      key={org.id}
                      style={[
                        sg.orgBtn,
                        {
                          borderColor:
                            orgType === org.id ? org.color : C.border,
                        },
                        orgType === org.id && {
                          backgroundColor: org.color + "08",
                        },
                      ]}
                      onPress={() => {
                        setOrgType(org.id);
                        setErrors({});
                      }}
                      activeOpacity={0.75}
                    >
                      <View
                        style={[
                          sg.orgIco,
                          { backgroundColor: org.color + "14" },
                        ]}
                      >
                        <Text style={{ fontSize: 18 }}>{org.icon}</Text>
                      </View>
                      <View
                        style={{
                          flex: 1,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                        }}
                      >
                        <Text style={sg.orgLbl}>{org.label}</Text>
                        <Text style={sg.orgDesc}>{org.desc}</Text>
                      </View>
                      {orgType === org.id && (
                        <Text style={[sg.orgChk, { color: org.color }]}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* ════ STEP 2: 기본 정보 ════ */}
              {step === 2 && (
                <View style={{ gap: 12 }}>
                  {orgInfo && <OrgBanner orgInfo={orgInfo} />}

                  {/* ── Google 가입 버튼 (Android 전용) ── */}
                  {Platform.OS === "android" && (
                    <>
                      <View style={sg.dividerWrap}>
                        <View style={sg.dividerLine} />
                        <Text style={sg.dividerTxt}>Google로 자동 입력</Text>
                        <View style={sg.dividerLine} />
                      </View>
                      <TouchableOpacity
                        style={[
                          sg.googleBtn,
                          googleLoading && { opacity: 0.6 },
                        ]}
                        onPress={handleGoogleSignup}
                        disabled={googleLoading}
                        activeOpacity={0.85}
                      >
                        {googleLoading ? (
                          <ActivityIndicator color="#444" size="small" />
                        ) : (
                          <>
                            <Text style={sg.googleIcon}>G</Text>
                            <Text style={sg.googleBtnTxt}>
                              Sign up with Google
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                      {googleFilled && (
                        <View style={sg.googleFilledBanner}>
                          <Text style={sg.googleFilledTxt}>
                            ✅ Google 계정 정보가 자동 입력되었습니다
                          </Text>
                        </View>
                      )}
                      {errors.google && (
                        <Text style={mo.errField}>⚠️ {errors.google}</Text>
                      )}
                      <View style={sg.dividerWrap}>
                        <View style={sg.dividerLine} />
                        <Text style={sg.dividerTxt}>또는 직접 입력</Text>
                        <View style={sg.dividerLine} />
                      </View>
                    </>
                  )}

                  {/* 이름 */}
                  {!isOrg && (
                    <View style={{ gap: 5 }}>
                      <Text style={mo.lbl}>
                        이름 <Text style={{ color: C.red }}>*</Text>
                        {googleFilled && (
                          <Text style={sg.autoFillTxt}>
                            {" "}
                            · Google에서 자동 입력됨
                          </Text>
                        )}
                      </Text>
                      <TextInput
                        style={[mo.inp, errors.name && mo.inpErr]}
                        placeholder="홍길동"
                        placeholderTextColor="#c0c0d0"
                        value={form.name}
                        onChangeText={(v) => upd("name", v)}
                      />
                      {errors.name && (
                        <Text style={mo.errField}>{errors.name}</Text>
                      )}
                    </View>
                  )}

                  {/* 이메일 — Google 자동입력 시 읽기 전용 */}
                  <View style={{ gap: 5 }}>
                    <Text style={mo.lbl}>
                      이메일 <Text style={{ color: C.red }}>*</Text>
                      {googleFilled && (
                        <Text style={sg.autoFillTxt}>
                          {" "}
                          · Google에서 자동 입력됨
                        </Text>
                      )}
                    </Text>
                    <TextInput
                      style={[
                        mo.inp,
                        errors.email && mo.inpErr,
                        googleFilled && sg.inpReadOnly,
                      ]}
                      placeholder="example@email.com"
                      placeholderTextColor="#c0c0d0"
                      value={form.email}
                      onChangeText={
                        googleFilled ? undefined : (v) => upd("email", v)
                      }
                      editable={!googleFilled}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {errors.email && (
                      <Text style={mo.errField}>{errors.email}</Text>
                    )}
                  </View>

                  {/* 비밀번호 */}
                  <View style={{ gap: 5 }}>
                    <Text style={mo.lbl}>
                      비밀번호 <Text style={{ color: C.red }}>*</Text>
                    </Text>
                    <View style={sg.pwWrap}>
                      <TextInput
                        style={[sg.pwInput, errors.password && mo.inpErr]}
                        placeholder="영문 대소문자+숫자+특수문자 8자 이상"
                        placeholderTextColor="#c0c0d0"
                        value={form.password}
                        onChangeText={(v) => upd("password", v)}
                        secureTextEntry={!showPw}
                      />
                      <TouchableOpacity
                        style={sg.eyeBtn}
                        onPress={() => setShowPw((p) => !p)}
                        activeOpacity={0.7}
                      >
                        <Text style={sg.eyeIcon}>{showPw ? "🙈" : "👁️"}</Text>
                      </TouchableOpacity>
                    </View>
                    {!!form.password && (
                      <PasswordStrength password={form.password} />
                    )}
                    {errors.password && (
                      <Text style={mo.errField}>{errors.password}</Text>
                    )}
                  </View>

                  {/* 비밀번호 확인 */}
                  <View style={{ gap: 5 }}>
                    <Text style={mo.lbl}>
                      비밀번호 확인 <Text style={{ color: C.red }}>*</Text>
                    </Text>
                    <View style={sg.pwWrap}>
                      <TextInput
                        style={[
                          sg.pwInput,
                          errors.passwordConfirm && mo.inpErr,
                        ]}
                        placeholder="비밀번호를 다시 입력"
                        placeholderTextColor="#c0c0d0"
                        value={form.passwordConfirm}
                        onChangeText={(v) => upd("passwordConfirm", v)}
                        secureTextEntry={!showPwConfirm}
                      />
                      <TouchableOpacity
                        style={sg.eyeBtn}
                        onPress={() => setShowPwConfirm((p) => !p)}
                        activeOpacity={0.7}
                      >
                        <Text style={sg.eyeIcon}>
                          {showPwConfirm ? "🙈" : "👁️"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {errors.passwordConfirm && (
                      <Text style={mo.errField}>{errors.passwordConfirm}</Text>
                    )}
                  </View>
                </View>
              )}

              {/* ════ STEP 3: 상세 입력 ════ */}
              {step === 3 && (
                <View style={{ gap: 12 }}>
                  {orgInfo && <OrgBanner orgInfo={orgInfo} />}
                  {isOrg && (
                    <Text style={[mo.sub, { lineHeight: 20 }]}>
                      기관 정보와 공식 인증 코드를 입력해주세요.{"\n"}
                      허위 입력 시 이용이 제한될 수 있습니다.
                    </Text>
                  )}
                  {orgFields.map((field) => {
                    if (field.id === "address")
                      return (
                        <View key="address" style={{ gap: 6 }}>
                          <Text style={mo.lbl}>
                            {field.label}{" "}
                            {field.required ? (
                              <Text style={{ color: C.red }}>*</Text>
                            ) : (
                              <Text style={sg.optional}>(선택)</Text>
                            )}
                          </Text>
                          <View style={sg.addrRow}>
                            <View
                              style={[
                                sg.zonecodeDisplay,
                                errors.address &&
                                  !form.zonecode && { borderColor: C.red },
                              ]}
                            >
                              {form.zonecode ? (
                                <Text style={sg.zonecodeValue}>
                                  📮 {form.zonecode}
                                </Text>
                              ) : (
                                <Text style={sg.zonecodePlaceholder}>
                                  우편번호
                                </Text>
                              )}
                            </View>
                            <TouchableOpacity
                              style={sg.addrSearchBtn}
                              onPress={() => setAddrModalVisible(true)}
                              activeOpacity={0.8}
                            >
                              <Text style={sg.addrSearchTxt}>🔍 주소 검색</Text>
                            </TouchableOpacity>
                          </View>
                          <TouchableOpacity
                            style={[
                              sg.addrReadOnly,
                              errors.address && mo.inpErr,
                              form.address && sg.addrReadOnlyFilled,
                            ]}
                            onPress={() => setAddrModalVisible(true)}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                sg.addrReadOnlyTxt,
                                !form.address && { color: "#c0c0d0" },
                              ]}
                              numberOfLines={2}
                            >
                              {form.address ||
                                "도로명 주소 (주소 검색 버튼을 눌러주세요)"}
                            </Text>
                            {form.address && (
                              <TouchableOpacity
                                style={sg.addrClearBtn}
                                onPress={() => {
                                  upd("address", "");
                                  upd("zonecode", "");
                                  upd("addressDetail", "");
                                }}
                                hitSlop={{
                                  top: 8,
                                  bottom: 8,
                                  left: 8,
                                  right: 8,
                                }}
                              >
                                <Text style={sg.addrClearTxt}>✕</Text>
                              </TouchableOpacity>
                            )}
                          </TouchableOpacity>
                          <TextInput
                            style={[
                              mo.inp,
                              !form.address && sg.addrDetailDisabled,
                            ]}
                            placeholder={
                              form.address
                                ? "상세 주소 입력 (동/호수 등)"
                                : "위에서 주소를 먼저 검색해주세요"
                            }
                            placeholderTextColor="#c0c0d0"
                            value={form.addressDetail}
                            onChangeText={(v) => upd("addressDetail", v)}
                            editable={!!form.address}
                          />
                          {errors.address && (
                            <Text style={mo.errField}>{errors.address}</Text>
                          )}
                        </View>
                      );
                    return (
                      <View key={field.id} style={{ gap: 5 }}>
                        <Text style={mo.lbl}>
                          {field.label}{" "}
                          {field.required ? (
                            <Text style={{ color: C.red }}>*</Text>
                          ) : (
                            <Text style={sg.optional}>(선택)</Text>
                          )}
                        </Text>
                        {field.hint && (
                          <View style={sg.hintBox}>
                            <Text style={sg.hintTxt}>ℹ️ {field.hint}</Text>
                          </View>
                        )}
                        <TextInput
                          style={[mo.inp, errors[field.id] && mo.inpErr]}
                          placeholder={field.placeholder}
                          placeholderTextColor="#c0c0d0"
                          value={(form as any)[field.id] || ""}
                          onChangeText={(v) => upd(field.id, v)}
                        />
                        {errors[field.id] && (
                          <Text style={mo.errField}>{errors[field.id]}</Text>
                        )}
                      </View>
                    );
                  })}
                  {!isOrg && (
                    <View style={{ gap: 6 }}>
                      <Text style={mo.lbl}>
                        수어와의 관계 <Text style={sg.optional}>(선택)</Text>
                      </Text>
                      <View style={sg.signPicker}>
                        {SIGN_OPTIONS.map((opt) => (
                          <TouchableOpacity
                            key={opt}
                            style={[
                              sg.signOpt,
                              form.preferredSign === opt && sg.signOptOn,
                            ]}
                            onPress={() =>
                              upd(
                                "preferredSign",
                                form.preferredSign === opt ? "" : opt,
                              )
                            }
                            activeOpacity={0.75}
                          >
                            <Text
                              style={[
                                sg.signOptTxt,
                                form.preferredSign === opt && sg.signOptTxtOn,
                              ]}
                            >
                              {opt}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                  <View style={sg.agreeGroup}>
                    <TouchableOpacity
                      style={sg.agreeRow}
                      onPress={() => upd("agreeTerms", !form.agreeTerms)}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[sg.checkbox, form.agreeTerms && sg.checkboxOn]}
                      >
                        {form.agreeTerms && <Text style={sg.checkmark}>✓</Text>}
                      </View>
                      <Text style={sg.agreeTxt}>
                        [필수] 이용약관에 동의합니다.
                      </Text>
                    </TouchableOpacity>
                    {errors.agreeTerms && (
                      <Text style={mo.errField}>{errors.agreeTerms}</Text>
                    )}
                    <TouchableOpacity
                      style={sg.agreeRow}
                      onPress={() => upd("agreePrivacy", !form.agreePrivacy)}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          sg.checkbox,
                          form.agreePrivacy && sg.checkboxOn,
                        ]}
                      >
                        {form.agreePrivacy && (
                          <Text style={sg.checkmark}>✓</Text>
                        )}
                      </View>
                      <Text style={sg.agreeTxt}>
                        [필수] 개인정보 처리방침에 동의합니다.
                      </Text>
                    </TouchableOpacity>
                    {errors.agreePrivacy && (
                      <Text style={mo.errField}>{errors.agreePrivacy}</Text>
                    )}
                  </View>
                  {errors.submit && (
                    <View style={mo.errBox}>
                      <Text style={mo.errTxt}>⚠️ {errors.submit}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* 버튼 행 */}
              <View
                style={[sg.btnRow, step === 1 && { flexDirection: "column" }]}
              >
                {step > 1 && (
                  <TouchableOpacity
                    style={mo.backBtn}
                    onPress={() => {
                      setErrors({});
                      setStep((s) => s - 1);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={mo.backTxt}>← 이전</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[mo.btn, { flex: 1 }, loading && { opacity: 0.7 }]}
                  onPress={next}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={mo.btnTxt}>
                      {step === 3 ? "가입 완료" : "다음 →"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={mo.sw}>
                <Text style={mo.swTxt}>이미 계정이 있으신가요? </Text>
                <TouchableOpacity
                  onPress={() => {
                    close();
                    onSwitchToLogin();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={mo.swLink}>로그인</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

function OrgBanner({ orgInfo }: { orgInfo: (typeof ORG_TYPES)[0] }) {
  return (
    <View
      style={[
        sg.banner,
        {
          borderColor: orgInfo.color + "44",
          backgroundColor: orgInfo.color + "10",
        },
      ]}
    >
      <Text style={{ fontSize: 22 }}>{orgInfo.icon}</Text>
      <Text style={{ fontSize: 14, fontWeight: "700", color: orgInfo.color }}>
        {orgInfo.label}
      </Text>
    </View>
  );
}

const sg = StyleSheet.create({
  steps: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  sWrap: { alignItems: "center", gap: 4 },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: C.border,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  dotOn: { borderColor: C.accent, backgroundColor: C.accent },
  dotTxt: { fontSize: 11, fontWeight: "700", color: C.sub },
  dotTxtOn: { color: "#fff" },
  stepLbl: { fontSize: 10, fontWeight: "700", color: C.sub },
  stepLblOn: { color: C.accent },
  line: {
    width: 32,
    height: 2,
    backgroundColor: C.border,
    marginBottom: 12,
    marginHorizontal: 6,
  },
  lineDone: { backgroundColor: C.accent },
  orgBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    overflow: "hidden",
  },
  orgIco: {
    width: 44,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1.5,
    borderRightColor: C.border,
  },
  orgLbl: { fontSize: 13, fontWeight: "700", color: C.text, marginBottom: 2 },
  orgDesc: { fontSize: 11, color: C.sub },
  orgChk: {
    width: 28,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "900",
    paddingRight: 4,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderWidth: 1.5,
    borderRadius: 12,
    marginBottom: 4,
  },
  // Google 버튼
  dividerWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  dividerTxt: { fontSize: 11, color: C.sub, flexShrink: 0 },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 48,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  googleIcon: { fontSize: 18, fontWeight: "900", color: "#4285F4" },
  googleBtnTxt: { fontSize: 14, fontWeight: "700", color: "#444" },
  googleFilledBanner: {
    backgroundColor: "rgba(16,185,129,0.08)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
    borderRadius: 8,
    padding: 10,
  },
  googleFilledTxt: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
    textAlign: "center",
  },
  autoFillTxt: { fontSize: 10, fontWeight: "600", color: "#059669" },
  autoFillHint: { fontSize: 10, color: C.sub },
  inpReadOnly: { backgroundColor: "#f3f4f6", color: "#6b7280" },
  // 주소
  addrRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  zonecodeDisplay: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 11,
    backgroundColor: "#f9f9fc",
    minHeight: 44,
    justifyContent: "center",
  },
  zonecodeValue: { fontSize: 13, fontWeight: "700", color: C.accent },
  zonecodePlaceholder: { fontSize: 13, color: "#c0c0d0" },
  addrSearchBtn: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.accent,
    backgroundColor: "rgba(124,111,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  addrSearchTxt: { fontSize: 12, fontWeight: "700", color: C.accent },
  addrReadOnly: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 10,
    backgroundColor: "#f9f9fc",
    minHeight: 44,
    gap: 6,
  },
  addrReadOnlyFilled: {
    borderColor: "rgba(124,111,255,0.35)",
    backgroundColor: "rgba(124,111,255,0.04)",
  },
  addrReadOnlyTxt: { flex: 1, fontSize: 13, color: C.text, lineHeight: 18 },
  addrClearBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  addrClearTxt: { fontSize: 9, fontWeight: "900", color: "#888" },
  addrDetailDisabled: { backgroundColor: "#f4f4f8" },
  hintBox: {
    backgroundColor: "rgba(124,111,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(124,111,255,0.15)",
    borderRadius: 8,
    padding: 8,
  },
  hintTxt: { fontSize: 11, color: C.sub, lineHeight: 17 },
  optional: { fontWeight: "400" as const, color: "#aaa", fontSize: 11 },
  signPicker: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  signOpt: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.bg,
  },
  signOptOn: {
    borderColor: C.accent,
    backgroundColor: "rgba(124,111,255,0.08)",
  },
  signOptTxt: { fontSize: 12, fontWeight: "600", color: C.sub },
  signOptTxtOn: { color: C.accent },
  agreeGroup: {
    backgroundColor: "#f9f9fc",
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    padding: 14,
    gap: 10,
  },
  agreeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: C.border,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkboxOn: { borderColor: C.accent, backgroundColor: C.accent },
  checkmark: { fontSize: 11, color: "#fff", fontWeight: "900" as const },
  agreeTxt: { fontSize: 13, color: C.text, flex: 1 },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 18, marginBottom: 8 },
  // 비밀번호 눈 토글
  pwWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    backgroundColor: C.bg,
  },
  pwInput: { flex: 1, padding: 11, fontSize: 14, color: C.text },
  eyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  eyeIcon: { fontSize: 16 },
});
