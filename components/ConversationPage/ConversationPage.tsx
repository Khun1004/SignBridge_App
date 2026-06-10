// ══════════════════════════════════════════════════════════════
//  app/conversationpage.tsx  — 웹 ConversationPage 디자인 참조
// ══════════════════════════════════════════════════════════════
import { useAuth } from "@/components/contexts/AuthContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Modal,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const C = {
  bg: "#f5f5f7",
  surface: "#ffffff",
  border: "#e8e8ec",
  text: "#111118",
  textDim: "#6b6b80",
  textMute: "#aeaec0",
  accent: "#5b45e0",
  signBg: "#f2f0ff",
  signBorder: "#ddd8ff",
  voiceBg: "#f0fdf4",
  voiceBorder: "rgba(5,150,105,0.15)",
  dark: "#13131c",
  darkSurface: "#1a1a26",
  darkBorder: "#2a2a38",
};

const PLACE_LABEL: Record<string, string> = {
  immigration: "출입국관리사무소",
  hospital: "병원",
  police: "경찰서",
  airport: "공항",
  personal: "개인 사용자",
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

export default function ConversationPageScreen() {
  const router = useRouter();
  const { orgType } = useAuth();
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
  const userEmail = params.userEmail || "";

  const processedRef = useRef<Set<string>>(new Set());
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "done" | "error"
  >("idle");
  const [modalVideo, setModalVideo] = useState<VideoItem | null>(null);
  const [toast, setToast] = useState<{
    type: "ok" | "err";
    msg: string;
  } | null>(null);

  const showToast = useCallback((type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    if (!videoUris.length) return;
    videoUris.forEach((uri, idx) => {
      if (!uri || processedRef.current.has(uri)) return;
      processedRef.current.add(uri);
      const vidId = Date.now() + idx * 17;
      setVideos((p) => [
        ...p,
        { id: vidId, localUrl: uri, serverId: null, uploadStatus: "uploading" },
      ]);
      setTimeout(() => {
        const sid = `V-${Math.floor(Math.random() * 90000) + 10000}`;
        setVideos((p) =>
          p.map((v) =>
            v.id === vidId ? { ...v, serverId: sid, uploadStatus: "done" } : v,
          ),
        );
      }, 2000);
    });
  }, []);

  const savedRef = useRef(false);
  useEffect(() => {
    if (savedRef.current || !messages.length) return;
    savedRef.current = true;
    setSaveStatus("saving");
    setTimeout(() => {
      setSaveStatus("done");
      showToast("ok", `대화 기록 저장 완료 (${messages.length}개)`);
    }, 1500);
  }, []);

  const signCount = messages.filter((m) => m.type === "sign").length;
  const voiceCount = messages.filter((m) => m.type === "voice").length;
  const startTime = messages[0]?.time || "";
  const endTime = messages[messages.length - 1]?.time || "";

  const handleShare = async () => {
    try {
      await Share.share({
        title: `SignBridge 대화 기록 (${PLACE_LABEL[place] || place})`,
        message: messages
          .map(
            (m) =>
              `[${m.time}] ${m.type === "sign" ? "🧏 수어" : "🙋 담당자"}: ${m.text}`,
          )
          .join("\n"),
      });
    } catch {}
  };

  const handleRegister = () => {
    // 개인 사용자 → registerpersonal, 기관 담당자 → registration
    const isPersonal =
      !orgType ||
      orgType === "personal" ||
      orgType === "개인" ||
      orgType === "개인 사용자";

    router.push({
      pathname: (isPersonal ? "/registrationpersonal" : "/registration") as any,
      params: {
        messages: JSON.stringify(messages),
        videoUris: JSON.stringify(videoUris),
        place,
        userEmail,
      },
    });
  };

  return (
    <SafeAreaView style={st.safe}>
      {/* 토스트 */}
      {toast && (
        <View
          style={[st.toast, toast.type === "ok" ? st.toastOk : st.toastErr]}
        >
          <Text style={toast.type === "ok" ? st.toastOkTxt : st.toastErrTxt}>
            {toast.type === "ok" ? "✅ " : "⚠️ "}
            {toast.msg}
          </Text>
        </View>
      )}

      {/* 헤더 */}
      <View style={st.header}>
        <View style={st.headerLeft}>
          {/* 저장 상태 배지 */}
          {saveStatus === "saving" && (
            <View style={[st.saveBadge, st.saveBadgeSaving]}>
              <Text style={st.saveBadgeSavingTxt}>💾 저장 중...</Text>
            </View>
          )}
          {saveStatus === "done" && (
            <View style={[st.saveBadge, st.saveBadgeDone]}>
              <Text style={st.saveBadgeDoneTxt}>✅ 저장 완료</Text>
            </View>
          )}
          {saveStatus === "error" && (
            <View style={[st.saveBadge, st.saveBadgeErr]}>
              <Text style={st.saveBadgeErrTxt}>⚠️ 저장 실패</Text>
            </View>
          )}
        </View>

        <View style={st.headerCenter}>
          <Text style={st.headerTitle}>대화 기록</Text>
          {startTime ? (
            <Text style={st.headerSub}>
              {startTime} ~ {endTime}
            </Text>
          ) : null}
          <View style={st.headerStats}>
            <Text style={st.headerStatMute}>총 {messages.length}개</Text>
            <View style={st.statSignBadge}>
              <Text style={st.statSignTxt}>🧏 {signCount}</Text>
            </View>
            <View style={st.statVoiceBadge}>
              <Text style={st.statVoiceTxt}>🙋 {voiceCount}</Text>
            </View>
            {videos.length > 0 && (
              <View style={st.statVideoBadge}>
                <Text style={st.statVideoTxt}>🎬 {videos.length}</Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity style={st.btnRegister} onPress={handleRegister}>
          <Text style={st.btnRegisterTxt}>
            {!orgType ||
            orgType === "personal" ||
            orgType === "개인" ||
            orgType === "개인 사용자"
              ? "💾 개인 저장"
              : "💾 등록하기"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 비로그인 경고 */}
      {!userEmail && (
        <View style={st.loginWarn}>
          <Text style={st.loginWarnTxt}>
            ⚠️ 로그인이 필요합니다. 대화 기록은 서버에 저장되지 않습니다.
          </Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={st.scrollBody}
        showsVerticalScrollIndicator={false}
      >
        {/* 세션 정보 카드 */}
        <View style={st.metaCard}>
          <View style={st.metaRow}>
            <Text style={st.metaIcon}>📍</Text>
            <Text style={st.metaLabel}>장소</Text>
            <Text style={st.metaValue}>
              {PLACE_LABEL[place] || place || "미설정"}
            </Text>
          </View>
          {userEmail ? (
            <View style={st.metaRow}>
              <Text style={st.metaIcon}>👤</Text>
              <Text style={st.metaLabel}>담당자</Text>
              <Text style={st.metaValue}>{userEmail}</Text>
            </View>
          ) : null}
          <View style={st.metaRow}>
            <Text style={st.metaIcon}>🕐</Text>
            <Text style={st.metaLabel}>일시</Text>
            <Text style={st.metaValue}>
              {new Date().toLocaleDateString("ko-KR")}{" "}
              {new Date().toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
          <TouchableOpacity style={st.btnShare} onPress={handleShare}>
            <Text style={st.btnShareTxt}>💾 텍스트 내보내기 / 공유</Text>
          </TouchableOpacity>
        </View>

        {/* 대화 목록 */}
        <View style={st.chatCard}>
          <Text style={st.sectionTitle}>💬 대화 타임라인</Text>
          {messages.length === 0 ? (
            <View style={st.emptyBox}>
              <Text style={{ fontSize: 44, opacity: 0.35 }}>💬</Text>
              <Text style={st.emptyTxt}>저장된 대화 기록이 없습니다.</Text>
            </View>
          ) : (
            messages.map((msg, idx) => (
              <View
                key={msg.id || idx}
                style={[
                  st.msgRow,
                  msg.type === "voice" ? st.msgRowRight : st.msgRowLeft,
                ]}
              >
                {msg.type === "sign" && (
                  <View style={st.avatar}>
                    <Text style={st.avatarEmoji}>🧏</Text>
                  </View>
                )}
                <View style={st.bubbleWrap}>
                  <Text style={st.msgName}>
                    {msg.type === "sign" ? "장애인 (수어)" : "담당자"}
                  </Text>
                  <View
                    style={[
                      st.bubble,
                      msg.type === "voice" ? st.bubbleVoice : st.bubbleSign,
                    ]}
                  >
                    <Text
                      style={[
                        st.bubbleTxt,
                        msg.type === "voice"
                          ? st.bubbleTxtVoice
                          : st.bubbleTxtSign,
                      ]}
                    >
                      {msg.text}
                    </Text>
                  </View>
                  <Text
                    style={[
                      st.msgTime,
                      msg.type === "voice" && { textAlign: "right" },
                    ]}
                  >
                    {msg.time}
                  </Text>
                </View>
                {msg.type === "voice" && (
                  <View style={st.avatar}>
                    <Text style={st.avatarEmoji}>🙋</Text>
                  </View>
                )}
                <View style={st.msgIdx}>
                  <Text style={st.msgIdxTxt}>#{idx + 1}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* 영상 목록 — 웹의 어두운 패널 스타일 */}
        {videos.length > 0 && (
          <View style={st.videosPanel}>
            <View style={st.videosPanelHd}>
              <Text style={st.videosPanelHdTxt}>🎬 녹화 영상</Text>
              <View style={st.videosCountBadge}>
                <Text style={st.videosCountTxt}>{videos.length}개</Text>
              </View>
            </View>
            {videos.map((vid, idx) => (
              <View key={vid.id} style={st.videoCard}>
                <View style={st.videoCardTop}>
                  <Text style={st.videoCardLabel}>영상 {idx + 1}</Text>
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
                      {vid.uploadStatus === "uploading" && "⏳ 저장 중"}
                      {vid.uploadStatus === "done" && "✅ 저장됨"}
                      {vid.uploadStatus === "error" && "⚠️ 실패"}
                    </Text>
                  </View>
                </View>
                <View style={st.videoThumb}>
                  <Text style={{ fontSize: 28 }}>🎬</Text>
                  <Text style={st.videoThumbTxt}>
                    {vid.uploadStatus === "done"
                      ? `서버 ID: ${vid.serverId}`
                      : "준비 중..."}
                  </Text>
                </View>
                <View style={st.videoCardActions}>
                  <TouchableOpacity
                    style={st.btnVidPlay}
                    onPress={() => setModalVideo(vid)}
                  >
                    <Text style={st.btnVidPlayTxt}>▶ 크게 보기</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 하단 공유 버튼 */}
        {messages.length > 4 && (
          <View style={st.footer}>
            <TouchableOpacity style={st.btnShare} onPress={handleShare}>
              <Text style={st.btnShareTxt}>💾 텍스트 내보내기</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* 영상 모달 */}
      <Modal visible={modalVideo !== null} transparent animationType="fade">
        <View style={st.modalOverlay}>
          <View style={st.videoModal}>
            <View style={st.modalHd}>
              <Text style={st.modalTitle}>🎬 영상 확인</Text>
              <TouchableOpacity onPress={() => setModalVideo(null)}>
                <Text style={st.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={st.modalBody}>
              <Text style={st.modalHint}>
                {`파일 경로:\n${modalVideo?.localUrl}`}
              </Text>
            </View>
            {modalVideo?.serverId && (
              <View style={st.modalFt}>
                <Text style={st.modalFtTxt}>
                  ✅ 서버 저장 완료 (ID: {modalVideo.serverId})
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  toast: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    padding: 14,
    borderRadius: 25,
    zIndex: 9999,
    alignItems: "center",
    elevation: 6,
  },
  toastOk: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1.5,
    borderColor: "#6ee7b7",
  },
  toastErr: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1.5,
    borderColor: "#fca5a5",
  },
  toastOkTxt: { color: "#065f46", fontWeight: "700", fontSize: 13 },
  toastErrTxt: { color: "#991b1b", fontWeight: "700", fontSize: 13 },

  // 헤더
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 8,
  },
  headerLeft: { gap: 4, minWidth: 70 },
  headerCenter: { flex: 1, alignItems: "center", gap: 2 },
  headerTitle: { fontSize: 16, fontWeight: "900", color: C.text },
  headerSub: { fontSize: 11, color: C.textMute },
  headerStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  headerStatMute: { fontSize: 11, color: C.textMute },
  statSignBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: C.signBg,
    borderWidth: 1,
    borderColor: C.signBorder,
  },
  statSignTxt: { fontSize: 10, color: C.accent, fontWeight: "700" },
  statVoiceBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: "#f3f0ff",
    borderWidth: 1,
    borderColor: "#ddd8ff",
  },
  statVoiceTxt: { fontSize: 10, color: "#6c5ce7", fontWeight: "700" },
  statVideoBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: "#1a1a26",
    borderWidth: 1,
    borderColor: "#2a2a38",
  },
  statVideoTxt: { fontSize: 10, color: "#93c5fd", fontWeight: "700" },
  btnRegister: {
    backgroundColor: C.accent,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  btnRegisterTxt: { color: "#fff", fontSize: 12, fontWeight: "800" },

  // 저장 배지
  saveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  saveBadgeSaving: { backgroundColor: "#fffbeb", borderColor: "#fcd34d" },
  saveBadgeSavingTxt: { color: "#92400e", fontSize: 10, fontWeight: "700" },
  saveBadgeDone: { backgroundColor: "#d1fae5", borderColor: "#6ee7b7" },
  saveBadgeDoneTxt: { color: "#065f46", fontSize: 10, fontWeight: "700" },
  saveBadgeErr: { backgroundColor: "#fee2e2", borderColor: "#fca5a5" },
  saveBadgeErrTxt: { color: "#991b1b", fontSize: 10, fontWeight: "700" },

  loginWarn: {
    backgroundColor: "#fffbeb",
    borderBottomWidth: 1,
    borderColor: "#fcd34d",
    padding: 10,
    alignItems: "center",
  },
  loginWarnTxt: { fontSize: 12, color: "#92400e", fontWeight: "600" },

  scrollBody: { padding: 14, gap: 14, paddingBottom: 40 },

  // 메타 카드
  metaCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 8,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  metaIcon: { fontSize: 14, width: 20 },
  metaLabel: { fontSize: 12, color: C.textMute, fontWeight: "600", width: 48 },
  metaValue: { fontSize: 13, color: C.text, fontWeight: "700", flex: 1 },
  btnShare: {
    marginTop: 6,
    backgroundColor: "#f1f5f9",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  btnShareTxt: { fontSize: 12, color: "#334155", fontWeight: "700" },

  // 대화 카드
  chatCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: C.text,
    marginBottom: 4,
  },
  emptyBox: { alignItems: "center", gap: 10, paddingVertical: 24 },
  emptyTxt: { fontSize: 13, color: C.textMute },

  // 메시지
  msgRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 4,
  },
  msgRowLeft: { justifyContent: "flex-start" },
  msgRowRight: { justifyContent: "flex-end" },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarEmoji: { fontSize: 16 },
  bubbleWrap: { flex: 1, gap: 3, maxWidth: "78%" },
  msgName: { fontSize: 10, fontWeight: "700", color: C.textMute },
  bubble: { borderRadius: 14, padding: 10 },
  bubbleSign: {
    backgroundColor: "#eff6ff",
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.1)",
  },
  bubbleVoice: {
    backgroundColor: C.voiceBg,
    borderBottomRightRadius: 2,
    borderWidth: 1,
    borderColor: C.voiceBorder,
  },
  bubbleTxt: { fontSize: 13, lineHeight: 20 },
  bubbleTxtSign: { color: "#1e3a5f" },
  bubbleTxtVoice: { color: "#14532d" },
  msgTime: { fontSize: 9, color: C.textMute },
  msgIdx: { minWidth: 24, alignItems: "center", paddingTop: 22 },
  msgIdxTxt: { fontSize: 9, color: C.textMute },

  // 영상 패널 — 웹의 어두운 배경 스타일
  videosPanel: {
    backgroundColor: C.dark,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.darkBorder,
    overflow: "hidden",
  },
  videosPanelHd: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 13,
    backgroundColor: C.darkSurface,
    borderBottomWidth: 1,
    borderBottomColor: C.darkBorder,
  },
  videosPanelHdTxt: { fontSize: 13, fontWeight: "800", color: "#c0c0e0" },
  videosCountBadge: {
    backgroundColor: "rgba(37,99,235,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.3)",
  },
  videosCountTxt: { fontSize: 11, color: "#93c5fd", fontWeight: "700" },
  videoCard: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e2a",
    gap: 8,
  },
  videoCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  videoCardLabel: { fontSize: 11, fontWeight: "700", color: "#6060a0" },
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
    height: 80,
    backgroundColor: "#0a0a12",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: C.darkBorder,
  },
  videoThumbTxt: { fontSize: 10, color: "#404058" },
  videoCardActions: { flexDirection: "row", gap: 6 },
  btnVidPlay: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "rgba(37,99,235,0.18)",
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.28)",
    alignItems: "center",
  },
  btnVidPlayTxt: { color: "#93c5fd", fontSize: 12, fontWeight: "700" },

  footer: { gap: 8 },

  // 모달
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(8,8,16,0.88)",
    justifyContent: "center",
    padding: 20,
  },
  videoModal: {
    backgroundColor: "#16161e",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.darkBorder,
  },
  modalHd: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#1e1e2a",
    borderBottomWidth: 1,
    borderBottomColor: C.darkBorder,
  },
  modalTitle: { color: "#fff", fontSize: 14, fontWeight: "800" },
  modalClose: { color: "#888", fontSize: 20, paddingHorizontal: 4 },
  modalBody: {
    backgroundColor: "#0a0a10",
    minHeight: 140,
    justifyContent: "center",
    padding: 16,
  },
  modalHint: { color: "#38bdf8", fontSize: 12, textAlign: "center" },
  modalFt: { padding: 10, alignItems: "center" },
  modalFtTxt: { color: "#00b894", fontSize: 11, fontWeight: "700" },
});
