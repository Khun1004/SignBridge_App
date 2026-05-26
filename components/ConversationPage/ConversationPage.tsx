import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// TODO: 프로젝트 경로에 맞게 임포트 경로를 수정하세요.
// import { conversationApi } from '../../../assets/components/api/api';

// ─── 색상 토큰 및 디자인 정의 ─────────────────────────────────
const CP = {
  bg: "#f5f5f7",
  surface: "#ffffff",
  border: "#e8e8ec",
  text: "#111118",
  textDim: "#6b6b80",
  textMute: "#aeaec0",
  accent: "#5b45e0",
  accent2: "#7c6fff",
  signBg: "#f2f0ff",
  signBorder: "#ddd8ff",
  voiceFrom: "#6c5ce7",
  green: "#00b894",
  red: "#e55353",
  yellow: "#f0a500",
};

// ─── 타입 정의 ────────────────────────────────────────────────
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

interface ConversationPageProps {
  messages: Message[];
  videoBlobs?: any[]; // 웹 환경 호환용 혹은 비디오 리스트
  videoUris?: string[]; // React Native 친화적인 로컬 파일 URI 배열 (추천)
  onBack: () => void;
  onRegister: (videos: VideoItem[]) => void;
  onVideosChange?: (videos: VideoItem[]) => void;
  userEmail?: string;
  place?: string;
}

export default function ConversationPage({
  messages = [],
  videoBlobs = [],
  videoUris = [],
  onBack,
  onRegister,
  onVideosChange,
  userEmail = "",
  place = "immigration",
}: ConversationPageProps) {
  const processedRef = useRef<Set<number | string>>(new Set());
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

  // 부모(App) 컴포넌트에 영상 상태 동기화
  const updateVideos = useCallback(
    (updater: any) => {
      setVideos((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        onVideosChange?.(next);
        return next;
      });
    },
    [onVideosChange],
  );

  // ─── 비디오 파일(URI/Blob) 처리 및 업로드 시뮬레이션 ─────────────────
  const combinedVideos = videoUris.length > 0 ? videoUris : videoBlobs;

  useEffect(() => {
    if (!combinedVideos?.length) return;

    combinedVideos.forEach((item, idx) => {
      if (!item) return;
      // 인덱스나 경로를 기반으로 중복 처리 방지
      const uniqueKey = typeof item === "string" ? item : idx;
      if (processedRef.current.has(uniqueKey)) return;
      processedRef.current.add(uniqueKey);

      // 로컬 경로 할당 (React Native는 파일 시스템 경로 string을 그대로 사용 가능)
      const localUrl = typeof item === "string" ? item : "blob_mock_uri_" + idx;
      const vidId = Date.now() + idx * 17;

      updateVideos((prev: VideoItem[]) => [
        ...prev,
        {
          id: vidId,
          localUrl,
          serverId: null,
          uploadStatus: "uploading",
        },
      ]);

      // 비동기 서버 업로드 프로세스 수행
      (async () => {
        try {
          // 예시: const result = await conversationApi.uploadVideo(item, userEmail);
          // 여기서는 가상 타이머로 업로드 성공 시뮬레이션을 수행합니다.
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const mockServerId = `V-${Math.floor(Math.random() * 90000) + 10000}`;

          updateVideos((prev: VideoItem[]) =>
            prev.map((v) =>
              v.id === vidId
                ? { ...v, serverId: mockServerId, uploadStatus: "done" }
                : v,
            ),
          );
        } catch (e) {
          console.error("[UPLOAD ERROR]", e);
          updateVideos((prev: VideoItem[]) =>
            prev.map((v) =>
              v.id === vidId ? { ...v, uploadStatus: "error" } : v,
            ),
          );
          showToast(
            "err",
            `영상 ${idx + 1} 서버 저장 실패. 로컬에서 재생 가능합니다.`,
          );
        }
      })();
    });
  }, [combinedVideos?.length]);

  // ─── 마운트 시 대화 기록 저장 자동 트리거 (1회) ────────────────────
  const savedRef = useRef(false);
  useEffect(() => {
    if (savedRef.current || !messages.length) return;
    savedRef.current = true;

    (async () => {
      setSaveStatus("saving");
      try {
        // 예시: await conversationApi.saveHistory(messages, userEmail, place);
        await new Promise((resolve) => setTimeout(resolve, 1500)); // 시뮬레이션
        setSaveStatus("done");
        showToast("ok", "대화 내용이 서버에 안전하게 자동 저장되었습니다.");
      } catch (error) {
        setSaveStatus("error");
        showToast("err", "대화 기록 서버 저장 실패. 네트워크를 확인하세요.");
      }
    })();
  }, [messages, userEmail, place, showToast]);

  // 통계 계산
  const signCount = messages.filter((m) => m.type === "sign").length;
  const voiceCount = messages.filter((m) => m.type === "voice").length;

  // 공유 기능 (모바일 전용 내보내기/인쇄 대체)
  const handleShare = async () => {
    try {
      const textDump = messages
        .map(
          (m) =>
            `[${m.time}] ${m.type === "sign" ? "청각장애인" : "담당자"}: ${m.text}`,
        )
        .join("\n");
      await Share.share({
        title: `수어 번역 대화 기록 (${place})`,
        message: textDump,
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ── 상단 토스트 메시지 알림 ── */}
      {toast && (
        <View
          style={[
            styles.toast,
            toast.type === "ok" ? styles.toastOk : styles.toastErr,
          ]}
        >
          <Text
            style={toast.type === "ok" ? styles.toastOkTxt : styles.toastErrTxt}
          >
            {toast.type === "ok" ? "✅ " : "❌ "} {toast.msg}
          </Text>
        </View>
      )}

      {/* ── 헤더 영역 ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.btnBack}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.btnBackTxt}>◀ 돌아가기</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.title}>대화 요약 보고서</Text>
          <View style={styles.statsRow}>
            <View style={styles.statSign}>
              <Text style={styles.statSignTxt}>수어 인식 {signCount}회</Text>
            </View>
            <View style={styles.statVoice}>
              <Text style={styles.statVoiceTxt}>
                담당자 응답 {voiceCount}회
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.btnRegister}
          onPress={() => {
            onRegister(videos);
            Alert.alert("완료", "대화 요약본 등록이 완료되었습니다.");
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.btnRegisterTxt}>등록하기</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollBody}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 로그인 상태 안내 배너 ── */}
        {!userEmail ? (
          <View style={styles.loginWarn}>
            <Text style={styles.loginWarnTxt}>
              ⚠️ 비로그인 상태입니다. 기록이 마이페이지에 매핑되지 않을 수
              있습니다.
            </Text>
          </View>
        ) : (
          <View style={styles.saveStatusCard}>
            <Text style={styles.sectionTitle}>💾 대화 기록 저장 상태</Text>
            {saveStatus === "saving" && (
              <View style={[styles.badge, styles.badgeSaving]}>
                <Text style={styles.badgeSavingTxt}>⏳ 서버 저장 중...</Text>
              </View>
            )}
            {saveStatus === "done" && (
              <View style={[styles.badge, styles.badgeDone]}>
                <Text style={styles.badgeDoneTxt}>✅ 서버 저장 완료</Text>
              </View>
            )}
            {saveStatus === "error" && (
              <View style={[styles.badge, styles.badgeErr]}>
                <Text style={styles.badgeErrTxt}>
                  ❌ 저장 실패 (재시도 필요)
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── 세션 메타 정보 카드 ── */}
        <View style={styles.metaCard}>
          <Text style={styles.metaTitle}>📍 대화 정보</Text>
          <Text style={styles.metaText}>
            • 장소:{" "}
            <Text style={{ fontWeight: "700" }}>
              {place === "immigration" ? "출입국사무소" : place}
            </Text>
          </Text>
          {userEmail ? (
            <Text style={styles.metaText}>• 담당자 계정: {userEmail}</Text>
          ) : null}
          <Text style={styles.metaText}>
            • 대화 일시: {new Date().toLocaleDateString("ko-KR")}{" "}
            {new Date().toLocaleTimeString("ko-KR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>

          <TouchableOpacity style={styles.btnShare} onPress={handleShare}>
            <Text style={styles.btnShareTxt}>
              🔗 대화 텍스트 내보내기 / 공유
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── 녹화된 수어 영상 목록 카드 ── */}
        <View style={styles.videoSectionCard}>
          <Text style={styles.sectionTitle}>
            🎬 녹화된 수어 세션 ({videos.length}개)
          </Text>
          {videos.length === 0 ? (
            <Text style={styles.emptyText}>
              이번 대화에서 녹화된 수어 영상이 없습니다.
            </Text>
          ) : (
            <View style={styles.videoGrid}>
              {videos.map((vid, idx) => (
                <View key={vid.id} style={styles.videoCard}>
                  <View style={styles.videoThumbnailPlaceholder}>
                    <Text style={{ fontSize: 24 }}>📹</Text>
                    <Text style={styles.videoThumbTxt}>영상 {idx + 1}</Text>
                  </View>

                  <View style={styles.videoCardBody}>
                    <Text style={styles.videoStatusTxt}>
                      {vid.uploadStatus === "uploading" &&
                        "⏳ 클라우드 업로드 중..."}
                      {vid.uploadStatus === "done" &&
                        `✅ 클라우드 저장 완료\n(ID: ${vid.serverId})`}
                      {vid.uploadStatus === "error" &&
                        "❌ 업로드 실패 (로컬 재생 가능)"}
                    </Text>

                    <TouchableOpacity
                      style={styles.btnPlayVid}
                      onPress={() => setModalVideo(vid)}
                    >
                      <Text style={styles.btnPlayVidTxt}>▶ 영상 확인</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── 대화 로그 스크립트 복기 ── */}
        <View style={styles.chatLogCard}>
          <Text style={styles.sectionTitle}>💬 대화 타임라인 스크립트</Text>
          {messages.map((msg, idx) => (
            <View
              key={msg.id || idx}
              style={[
                styles.chatRow,
                msg.type === "voice" ? styles.chatRowRight : styles.chatRowLeft,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  msg.type === "voice" ? styles.bubbleVoice : styles.bubbleSign,
                ]}
              >
                <Text style={styles.bubbleSpeaker}>
                  {msg.type === "sign"
                    ? "🧏 청각장애인 (수어)"
                    : "🙋 담당자 (텍스트/음성)"}
                </Text>
                <Text style={styles.bubbleText}>{msg.text}</Text>
                <Text style={styles.bubbleTime}>{msg.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ── 모바일 간이 비디오 모달 플레이어 ── */}
      <Modal visible={modalVideo !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.videoModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🎬 영상 플레이어</Text>
              <TouchableOpacity onPress={() => setModalVideo(null)}>
                <Text style={styles.modalCloseBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalPlayHint}>
                {`선택된 영상 경로:\n${modalVideo?.localUrl}`}
              </Text>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 13,
                  textAlign: "center",
                  marginTop: 10,
                }}
              >
                (React Native 환경에서는 expo-av 패ild나 react-native-video
                패키지를 연동하여 이 영역에서 실제 비디오를 재생할 수 있습니다.)
              </Text>
            </View>
            <View style={styles.modalFooter}>
              <Text style={styles.modalFooterTxt}>
                서버 동기화 ID:{" "}
                {modalVideo?.serverId || "없음 (로컬 임시 파일)"}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── 스타일 시트 정의 ─────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CP.bg,
  },
  toast: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    padding: 14,
    borderRadius: 25,
    zIndex: 9999,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
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

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: CP.surface,
    borderBottomWidth: 1,
    borderBottomColor: CP.border,
  },
  btnBack: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: CP.signBorder,
    borderRadius: 8,
    backgroundColor: CP.signBg,
  },
  btnBackTxt: { fontSize: 12, fontWeight: "700", color: CP.accent },
  headerCenter: { alignItems: "center", flex: 1, mx: 8 },
  title: { fontSize: 17, fontWeight: "900", color: CP.text },
  statsRow: { flexDirection: "row", gap: 6, marginTop: 4 },
  statSign: {
    backgroundColor: CP.signBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CP.signBorder,
  },
  statSignTxt: { fontSize: 10, color: CP.accent, fontWeight: "700" },
  statVoice: {
    backgroundColor: "#f3f0ff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd8ff",
  },
  statVoiceTxt: { fontSize: 10, color: CP.voiceFrom, fontWeight: "700" },
  btnRegister: {
    backgroundColor: CP.accent,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  btnRegisterTxt: { color: "#fff", fontSize: 12, fontWeight: "800" },

  scrollBody: { padding: 14, gap: 14 },

  loginWarn: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fcd34d",
    padding: 12,
    borderRadius: 10,
  },
  loginWarnTxt: {
    fontSize: 12,
    color: "#92400e",
    fontWeight: "600",
    textAlign: "center",
  },

  saveStatusCard: {
    backgroundColor: CP.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: CP.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: CP.text,
    marginBottom: 4,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeSaving: { backgroundColor: "#fffbeb", borderColor: "#fcd34d" },
  badgeSavingTxt: { color: "#92400e", fontSize: 11, fontWeight: "700" },
  badgeDone: { backgroundColor: "#d1fae5", borderColor: "#6ee7b7" },
  badgeDoneTxt: { color: "#065f46", fontSize: 11, fontWeight: "700" },
  badgeErr: { backgroundColor: "#fee2e2", borderColor: "#fca5a5" },
  badgeErrTxt: { color: "#991b1b", fontSize: 11, fontWeight: "700" },

  metaCard: {
    backgroundColor: CP.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: CP.border,
  },
  metaTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: CP.text,
    marginBottom: 8,
  },
  metaText: { fontSize: 13, color: CP.textDim, marginBottom: 4 },
  btnShare: {
    marginTop: 10,
    backgroundColor: "#f1f5f9",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  btnShareTxt: { fontSize: 12, color: "#334155", fontWeight: "700" },

  videoSectionCard: {
    backgroundColor: CP.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: CP.border,
  },
  emptyText: {
    color: CP.textMute,
    fontSize: 12,
    textAlign: "center",
    paddingVertical: 16,
  },
  videoGrid: { gap: 10, marginTop: 8 },
  videoCard: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: CP.border,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  videoThumbnailPlaceholder: {
    width: 70,
    height: 60,
    backgroundColor: "#e2e8f0",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  videoThumbTxt: {
    fontSize: 10,
    fontWeight: "600",
    color: CP.textDim,
    marginTop: 2,
  },
  videoCardBody: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
  },
  videoStatusTxt: { fontSize: 11, color: CP.textDim, lineHeight: 15 },
  btnPlayVid: {
    backgroundColor: "rgba(91,69,224,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(91,69,224,0.2)",
  },
  btnPlayVidTxt: { color: CP.accent, fontSize: 11, fontWeight: "700" },

  chatLogCard: {
    backgroundColor: CP.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: CP.border,
  },
  chatRow: { flexDirection: "row", marginBottom: 12 },
  chatRowLeft: { justifyContent: "flex-start" },
  chatRowRight: { justifyContent: "flex-end" },
  bubble: { maxWidth: "85%", padding: 10, borderRadius: 12 },
  bubbleSign: {
    backgroundColor: "#eff6ff",
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.1)",
  },
  bubbleVoice: {
    backgroundColor: "#f0fdf4",
    borderBottomRightRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(5,150,105,0.1)",
  },
  bubbleSpeaker: {
    fontSize: 10,
    fontWeight: "700",
    color: CP.textDim,
    marginBottom: 4,
  },
  bubbleText: { fontSize: 13, color: CP.text, lineHeight: 18 },
  bubbleTime: {
    fontSize: 9,
    color: CP.textMute,
    textAlign: "right",
    marginTop: 4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    padding: 20,
  },
  videoModal: { backgroundColor: "#1e293b", borderRadius: 16, padding: 16 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: { color: "#fff", fontSize: 15, fontWeight: "800" },
  modalCloseBtn: { color: "#fff", fontSize: 20, paddingHorizontal: 6 },
  modalBody: {
    backgroundColor: "#0f172a",
    height: 200,
    borderRadius: 10,
    justifyContent: "center",
    padding: 14,
  },
  modalPlayHint: {
    color: "#38bdf8",
    fontSize: 12,
    textAlign: "center",
    fontFamily: 'Platform.OS === "ios" ? "Courier" : "monospace"',
  },
  modalFooter: { marginTop: 10, alignItems: "center" },
  modalFooterTxt: { color: "#94a3b8", fontSize: 11 },
});
