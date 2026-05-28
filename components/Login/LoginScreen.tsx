// ══════════════════════════════════════════════════════════════
//  LoginScreen.tsx — 로그인 모달 (API 연결)
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
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { mo } from "../SignUp/authStyles";

export interface LoginScreenProps {
  visible: boolean;
  onClose: () => void;
  onLogin: (name: string, orgType: string, email: string) => void;
  onSwitchToSignup: () => void;
}

const normalizeOrgType = (raw: string): string => {
  const map: Record<string, string> = {
    개인: "personal",
    출입국관리사무소: "immigration",
    출입국외국인사무소: "immigration",
    공항: "airport",
    병원: "hospital",
    경찰서: "police",
  };

  return map[raw] ?? raw ?? "personal";
};

export default function LoginScreen({
  visible,
  onClose,
  onLogin,
  onSwitchToSignup,
}: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [eFocus, setEFocus] = useState(false);
  const [pFocus, setPFocus] = useState(false);

  const reset = () => {
    setEmail("");
    setPw("");
    setError("");
    setLoading(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    setError("");

    if (!email.includes("@")) {
      setError("올바른 이메일을 입력해주세요.");
      return;
    }

    if (!pw) {
      setError("비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      const data = await authApi.login({
        email,
        password: pw,
      });

      const normalizedType = normalizeOrgType(data.orgType);

      console.log("[Login] 성공:", data.name, normalizedType);

      onLogin(data.name, normalizedType, data.email);
      reset();
      onClose();
    } catch (e: any) {
      console.error("[Login] 실패:", e.message);

      if (e.message.includes("401") || e.message.includes("비밀번호")) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else if (e.message.includes("404") || e.message.includes("없")) {
        setError("등록되지 않은 이메일입니다.");
      } else if (e.message.includes("Network") || e.message.includes("fetch")) {
        setError("서버에 연결할 수 없습니다. 네트워크를 확인해주세요.");
      } else {
        setError(e.message || "로그인에 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        style={mo.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={mo.backdrop} onPress={close} />

        <View style={mo.card}>
          <View style={mo.topBar} />

          <TouchableOpacity style={mo.xBtn} onPress={close} activeOpacity={0.7}>
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
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 14,
                  }}
                  resizeMode="contain"
                />
              </View>

              <Text style={mo.title}>로그인</Text>
              <Text style={mo.sub}>SignBridge에 오신 것을 환영합니다.</Text>
            </View>

            <View style={{ gap: 14 }}>
              <View style={{ gap: 5 }}>
                <Text style={mo.lbl}>이메일</Text>

                <TextInput
                  style={[mo.inp, eFocus && mo.inpFoc]}
                  placeholder="example@email.com"
                  placeholderTextColor="#c0c0d0"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setEFocus(true)}
                  onBlur={() => setEFocus(false)}
                />
              </View>

              <View style={{ gap: 5 }}>
                <Text style={mo.lbl}>비밀번호</Text>

                <TextInput
                  style={[mo.inp, pFocus && mo.inpFoc]}
                  placeholder="••••••••"
                  placeholderTextColor="#c0c0d0"
                  value={pw}
                  onChangeText={setPw}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={submit}
                  onFocus={() => setPFocus(true)}
                  onBlur={() => setPFocus(false)}
                />
              </View>

              {error !== "" && (
                <View style={mo.errBox}>
                  <Text style={mo.errTxt}>⚠️ {error}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[mo.btn, loading && { opacity: 0.7 }]}
                onPress={submit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={mo.btnTxt}>로그인</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={mo.sw}>
              <Text style={mo.swTxt}>계정이 없으신가요? </Text>

              <TouchableOpacity
                onPress={() => {
                  close();
                  onSwitchToSignup();
                }}
                activeOpacity={0.7}
              >
                <Text style={mo.swLink}>회원가입</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
