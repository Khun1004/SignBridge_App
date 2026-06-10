// ══════════════════════════════════════════════════════════════
//  app/registerpersonal.tsx — 개인 대화 기록 저장 (웹 RegisterPersonal 포팅)
// ══════════════════════════════════════════════════════════════
import { personalApi } from "@/components/api/api";
import { useAuth } from "@/components/contexts/AuthContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
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
  accent: "#2563eb",
  text: "#111",
  sub: "#666",
  border: "#e4e2dc",
  bg: "#fafaf8",
  card: "#ffffff",
  err: "#ef4444",
  dark: "#13131c",
  darkSurface: "#1a1a26",
  darkBorder: "#2a2a38",
};

interface Message {
  id: number;
  type: "sign" | "voice";
  text: string;
  time: string;
}
interface VideoItem {
  id: number;
  localUrl: string;
  serverId: string | null;
  uploadStatus: "uploading" | "done" | "error";
}

export default function RegisterPersonalScreen() {
  const router = useRouter();
  const { displayName, userEmail, orgType } = useAuth();
  const params = useLocalSearchParams<{
    messages: string;
    videoUris: string;
    place: string;
    userEmail: string;
  }>();

  const messages: Message[] = params.messages
    ? JSON.parse(params.messages)
    : [];
  const videoUris: string[] = params.videoUris
    ? JSON.parse(params.videoUris)
    : [];
  const place = params.place || "personal";

  const [name, setName] = useState(displayName || "");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // 영상 상태 (업로드 시뮬레이션)
  const [videos] = useState<VideoItem[]>(
    videoUris.map((uri, i) => ({
      id: Date.now() + i,
      localUrl: uri,
      serverId: null,
      uploadStatus: "done" as const,
    })),
  );

  const signCount = messages.filter((m) => m.type === "sign").length;
  const voiceCount = messages.filter((m) => m.type === "voice").length;
  const now = new Date().toLocaleString("ko-KR");

  const handleSave = async () => {
    if (!name.trim()) {
      setError("이름을 입력해 주세요.");
      return;
    }
    const uploading = videos.filter(
      (v) => v.uploadStatus === "uploading",
    ).length;
    if (uploading > 0) {
      setError(`영상 ${uploading}개가 아직 저장 중입니다.`);
      return;
    }
    setError("");
    setSaving(true);
    try {
      const videoIds = videos
        .filter((v) => v.serverId)
        .map((v) => Number(v.serverId));
      await personalApi.saveCase({
        userEmail: (params.userEmail || userEmail)?.trim() || null,
        place,
        videoId: videoIds[0] ?? null,
        extraVideoIds: videoIds.slice(1),
        name: name.trim(),
        memo: memo.trim(),
        messages: messages.map((m) => ({
          msgType: m.type,
          content: m.text,
          pose: null,
          sentAt: m.time,
        })),
      });
      setSaved(true);
    } catch (e: any) {
      setError(`저장 실패: ${e.message}`);
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
          <Text style={st.successDesc}>
            개인 대화 기록이 저장되었습니다.{"\n"}
            {videos.length > 0 && `영상 ${videos.length}개 포함`}
          </Text>
          <TouchableOpacity
            style={st.btnPrimary}
            onPress={() =>
              router.replace({
                pathname: "/my" as any,
                params: {
                  displayName: displayName || "사용자",
                  orgType: orgType || "개인",
                  userEmail: userEmail || "",
                },
              })
            }
          >
            <Text style={st.btnPrimaryTxt}>확인 → 마이페이지로</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={st.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={st.scrollBody}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 배지 */}
          <View style={st.badgeRow}>
            <View style={st.badge}>
              <Text style={st.badgeTxt}>👤 개인용</Text>
            </View>
          </View>

          <Text style={st.pageTitle}>개인 대화 기록 등록</Text>
          <Text style={st.pageSubtitle}>
            대화 기록과 녹화 영상을 개인 저장소에 등록합니다.
          </Text>

          {/* 대화 미리보기 */}
          <View style={st.previewCard}>
            <View style={st.previewHeader}>
              <Text style={st.previewTitle}>📋 대화 내용 요약</Text>
              <View style={st.previewMeta}>
                <Text style={st.previewMetaTxt}>
                  {now} · 총 {messages.length}개
                </Text>
                <View style={st.tagBlue}>
                  <Text style={st.tagBlueTxt}>수어 {signCount}</Text>
                </View>
                <View style={st.tagGreen}>
                  <Text style={st.tagGreenTxt}>음성 {voiceCount}</Text>
                </View>
              </View>
            </View>
            <ScrollView style={st.previewList} nestedScrollEnabled>
              {messages.length === 0 ? (
                <Text style={st.emptyTxt}>대화 내용이 없습니다.</Text>
              ) : (
                messages.map((m, i) => (
                  <View
                    key={i}
                    style={[st.msgRow, m.type === "voice" && st.msgRowRight]}
                  >
                    <Text style={st.msgWho}>
                      {m.type === "sign" ? "🧏 수어" : "🙋 음성"}
                    </Text>
                    <Text
                      style={[
                        st.msgText,
                        m.type === "voice" && { textAlign: "right" },
                      ]}
                    >
                      {m.text}
                    </Text>
                    <Text style={st.msgTime}>{m.time}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>

          {/* 영상 목록 — 웹의 어두운 스타일 */}
          {videos.length > 0 && (
            <View style={st.videosCard}>
              <View style={st.videosHeader}>
                <Text style={st.videosHeaderTxt}>🎬 녹화 영상</Text>
                <View style={st.videosCountBadge}>
                  <Text style={st.videosCountTxt}>{videos.length}개</Text>
                </View>
              </View>
              {videos.map((vid, idx) => (
                <View key={vid.id} style={st.videoItem}>
                  <View style={st.videoItemTop}>
                    <Text style={st.videoLabel}>영상 {idx + 1}</Text>
                    <View
                      style={[
                        st.videoStatusBadge,
                        vid.uploadStatus === "done"
                          ? st.statusDone
                          : vid.uploadStatus === "uploading"
                            ? st.statusUploading
                            : st.statusErr,
                      ]}
                    >
                      <Text
                        style={[
                          st.videoStatusTxt,
                          vid.uploadStatus === "done"
                            ? st.statusDoneTxt
                            : vid.uploadStatus === "uploading"
                              ? st.statusUploadingTxt
                              : st.statusErrTxt,
                        ]}
                      >
                        {vid.uploadStatus === "done" && "✅ 저장됨"}
                        {vid.uploadStatus === "uploading" && "⏳ 저장 중"}
                        {vid.uploadStatus === "error" && "⚠️ 실패"}
                      </Text>
                    </View>
                  </View>
                  <View style={st.videoThumb}>
                    <Text style={{ fontSize: 20, opacity: 0.4 }}>🎬</Text>
                    <Text style={st.videoThumbTxt}>준비 중...</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* 입력 폼 */}
          <View style={st.formCard}>
            <View style={st.field}>
              <Text style={st.label}>
                이름 <Text style={st.req}>*</Text>
                {displayName ? (
                  <Text style={st.autofillHint}> · 자동 입력됨</Text>
                ) : null}
              </Text>
              <TextInput
                style={st.input}
                placeholder="본인 이름을 입력하세요"
                placeholderTextColor="#9ca3af"
                value={name}
                onChangeText={setName}
              />
            </View>
            <View style={st.field}>
              <Text style={st.label}>
                메모 <Text style={st.opt}>(선택)</Text>
              </Text>
              <TextInput
                style={st.textarea}
                placeholder="대화에 대한 메모를 입력하세요"
                placeholderTextColor="#9ca3af"
                value={memo}
                onChangeText={setMemo}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {error ? (
              <View style={st.errorBox}>
                <Text style={st.errorTxt}>⚠️ {error}</Text>
              </View>
            ) : null}

            {videos.some((v) => v.uploadStatus === "uploading") && (
              <View style={st.warnBox}>
                <Text style={st.warnTxt}>
                  ⏳ 영상을 서버에 저장 중입니다. 완료 후 등록해 주세요.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                st.btnPrimary,
                (saving ||
                  videos.some((v) => v.uploadStatus === "uploading")) && {
                  opacity: 0.6,
                },
              ]}
              onPress={handleSave}
              disabled={
                saving || videos.some((v) => v.uploadStatus === "uploading")
              }
            >
              <Text style={st.btnPrimaryTxt}>
                {saving ? "⏳ 저장 중..." : "💾 마이페이지에 저장하기"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scrollBody: { padding: 16, gap: 16, paddingBottom: 40 },

  badgeRow: { flexDirection: "row" },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 100,
    backgroundColor: "rgba(37,99,235,0.08)",
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.2)",
  },
  badgeTxt: { fontSize: 12, fontWeight: "700", color: C.accent },
  pageTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: C.text,
    letterSpacing: -0.5,
  },
  pageSubtitle: { fontSize: 14, color: C.sub },

  // 미리보기
  previewCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  previewHeader: {
    padding: 14,
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 6,
  },
  previewTitle: { fontSize: 13, fontWeight: "700", color: C.text },
  previewMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  previewMetaTxt: { fontSize: 11, color: C.sub },
  tagBlue: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
    backgroundColor: "rgba(37,99,235,0.08)",
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.2)",
  },
  tagBlueTxt: { fontSize: 10, color: C.accent, fontWeight: "700" },
  tagGreen: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
    backgroundColor: "rgba(5,150,105,0.08)",
    borderWidth: 1,
    borderColor: "rgba(5,150,105,0.2)",
  },
  tagGreenTxt: { fontSize: 10, color: "#059669", fontWeight: "700" },
  previewList: { maxHeight: 180, padding: 14 },
  emptyTxt: {
    color: "#bbb",
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 20,
  },
  msgRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 8,
  },
  msgRowRight: { flexDirection: "row-reverse" },
  msgWho: { fontSize: 11, fontWeight: "700", color: C.sub, flexShrink: 0 },
  msgText: { flex: 1, fontSize: 13, color: C.text, lineHeight: 20 },
  msgTime: { fontSize: 10, color: "#ccc", flexShrink: 0 },

  // 영상
  videosCard: {
    backgroundColor: C.dark,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2a38",
    overflow: "hidden",
  },
  videosHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 13,
    backgroundColor: "#1a1a26",
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a38",
  },
  videosHeaderTxt: { fontSize: 13, fontWeight: "800", color: "#c0c0e0" },
  videosCountBadge: {
    backgroundColor: "rgba(37,99,235,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.3)",
  },
  videosCountTxt: { fontSize: 11, color: "#93c5fd", fontWeight: "700" },
  videoItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e2a",
    gap: 8,
  },
  videoItemTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  videoLabel: { fontSize: 11, fontWeight: "700", color: "#6060a0" },
  videoStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
  },
  videoStatusTxt: { fontSize: 10, fontWeight: "700" },
  statusDone: {
    backgroundColor: "rgba(0,184,148,0.15)",
    borderColor: "rgba(0,184,148,0.3)",
  },
  statusDoneTxt: { color: "#00b894" },
  statusUploading: {
    backgroundColor: "rgba(240,165,0,0.15)",
    borderColor: "rgba(240,165,0,0.3)",
  },
  statusUploadingTxt: { color: "#f0a500" },
  statusErr: {
    backgroundColor: "rgba(229,83,83,0.15)",
    borderColor: "rgba(229,83,83,0.3)",
  },
  statusErrTxt: { color: "#e55353" },
  videoThumb: {
    height: 70,
    backgroundColor: "#0a0a12",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#2a2a38",
  },
  videoThumbTxt: { fontSize: 10, color: "#404058" },

  // 폼
  formCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    gap: 14,
  },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: "700", color: C.text },
  req: { color: C.err },
  opt: { fontWeight: "400", color: "#9ca3af", fontSize: 11 },
  autofillHint: {
    fontWeight: "500",
    color: C.accent,
    fontSize: 11,
    opacity: 0.7,
  },
  input: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: C.text,
    backgroundColor: C.bg,
  },
  textarea: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: C.text,
    backgroundColor: C.bg,
    minHeight: 80,
    textAlignVertical: "top",
  },
  errorBox: {
    padding: 10,
    backgroundColor: "#fef2f2",
    borderWidth: 1.5,
    borderColor: "#fca5a5",
    borderRadius: 10,
  },
  errorTxt: { fontSize: 13, fontWeight: "600", color: "#991b1b" },
  warnBox: {
    padding: 10,
    backgroundColor: "#fef3c7",
    borderWidth: 1.5,
    borderColor: "#fcd34d",
    borderRadius: 10,
  },
  warnTxt: { fontSize: 13, fontWeight: "600", color: "#92400e" },
  btnPrimary: {
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  btnPrimaryTxt: { color: "#fff", fontSize: 14, fontWeight: "700" },
  successBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 32,
  },
  successTitle: { fontSize: 28, fontWeight: "900", color: C.text },
  successDesc: {
    fontSize: 15,
    color: C.sub,
    textAlign: "center",
    lineHeight: 24,
  },
});
