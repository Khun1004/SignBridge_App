// ══════════════════════════════════════════════════════════════
//  components/AI/AIChatModal.tsx
//  풀스크린 AI 채팅 (Gemini API + 타이핑 애니메이션)
// ══════════════════════════════════════════════════════════════
import { aiApi } from "@/components/api/api";
import { useAuth } from "@/components/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ── 색상 상수 ──────────────────────────────────────────────────
const C = {
  bg: "#0a0a14",
  surface: "#13131f",
  surface2: "#1e1e30",
  border: "rgba(255,255,255,0.08)",
  accent: "#7c6fff",
  text: "#f0f2f7",
  sub: "#7a8099",
  green: "#10b981",
  userBg: "#7c6fff",
  aiBg: "#1e1e30",
};

// ── 빠른 질문 ──────────────────────────────────────────────────
const QUICK_QUESTIONS = [
  "안녕하세요 수어로 어떻게 해요?",
  "감사합니다 수어 알려주세요",
  "수어 배우는 좋은 방법은?",
  "청각장애인과 소통하는 팁",
  "도와주세요 수어로?",
  "수어 알파벳 알려주세요",
];

// ── 타입 정의 ────────────────────────────────────────────────
interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  loading?: boolean;
  typing?: boolean;
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

// ── 타이핑 애니메이션 함수 ────────────────────────────────────
function typeMessage(
  fullText: string,
  messageId: number,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  onDone?: () => void,
) {
  let index = 0;
  const interval = setInterval(() => {
    index++;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              content: fullText.slice(0, index),
              typing: index < fullText.length,
            }
          : m,
      ),
    );
    if (index >= fullText.length) {
      clearInterval(interval);
      onDone?.();
    }
  }, 18);
  return interval;
}

// ══════════════════════════════════════════════════════════════
//  메인 컴포넌트
// ══════════════════════════════════════════════════════════════
export default function AIChatModal({ visible, onClose }: Props) {
  const { loggedIn, displayName, userEmail } = useAuth(); // ✅ userEmail 올바르게 가져오기

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── 초기 메시지 (타이핑 애니메이션) ─────────────────────
  useEffect(() => {
    if (visible && messages.length === 0) {
      const welcomeText = `안녕하세요${displayName ? `, ${displayName}님` : ""}! 🤟\n\n저는 SignBridge AI 어시스턴트입니다.\n수어·청각장애·의사소통에 관해 무엇이든 물어보세요!`;
      const welcomeId = 0;

      setMessages([
        {
          id: welcomeId,
          role: "assistant",
          content: "",
          typing: true,
        },
      ]);

      setTimeout(() => {
        typingIntervalRef.current = typeMessage(
          welcomeText,
          welcomeId,
          setMessages,
        );
      }, 400);
    }
  }, [visible]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
  }, [messages]);

  // ── 언마운트 시 타이핑 정리 ──────────────────────────────
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, []);

  // ── TTS ──────────────────────────────────────────────────
  const speakMessage = (text: string) => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    Speech.speak(text, {
      language: "ko-KR",
      rate: 0.95,
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  // ── 메시지 전송 ──────────────────────────────────────────
  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    setInput("");
    setSending(true);

    const userMsg: Message = { id: Date.now(), role: "user", content };
    const loadingId = Date.now() + 1;
    const loadingMsg: Message = {
      id: loadingId,
      role: "assistant",
      content: "",
      loading: true,
    };
    setMessages((prev) => [...prev, userMsg, loadingMsg]);

    try {
      const history = [...messages, userMsg]
        .filter((m) => !m.loading)
        .map((m) => ({ role: m.role, content: m.content }));

      const data = await aiApi.chat(userEmail ?? "", history);
      const reply =
        data?.choices?.[0]?.message?.content ?? "응답을 가져오지 못했어요.";

      // 로딩 → 타이핑 시작 (빈 내용으로 먼저 교체)
      const replyId = Date.now() + 2;
      setMessages((prev) =>
        prev.map((m) =>
          m.loading
            ? { ...m, id: replyId, loading: false, content: "", typing: true }
            : m,
        ),
      );

      // 타이핑 애니메이션 시작
      typingIntervalRef.current = typeMessage(
        reply,
        replyId,
        setMessages,
        () => {
          speakMessage(reply);
        },
      );
    } catch (e: any) {
      console.error("AI 채팅 오류:", e?.message ?? e);
      setMessages((prev) =>
        prev.map((m) =>
          m.loading
            ? {
                ...m,
                loading: false,
                content: `오류: ${e?.message ?? "서버 연결 실패"}`,
              }
            : m,
        ),
      );
    } finally {
      setSending(false);
    }
  };

  const clearChat = () => {
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    Speech.stop();
    setSpeaking(false);

    const clearText = "대화가 초기화되었습니다. 무엇이든 물어보세요! 🤟";
    const clearId = Date.now();
    setMessages([
      { id: clearId, role: "assistant", content: "", typing: true },
    ]);
    setTimeout(() => {
      typingIntervalRef.current = typeMessage(clearText, clearId, setMessages);
    }, 200);
  };

  const handleClose = () => {
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    Speech.stop();
    setSpeaking(false);
    onClose();
  };

  // ── 비로그인 ────────────────────────────────────────────
  const renderGate = () => (
    <View style={s.gate}>
      <Text style={{ fontSize: 56 }}>🔒</Text>
      <Text style={s.gateTitle}>로그인이 필요합니다</Text>
      <Text style={s.gateSub}>
        AI 어시스턴트를 사용하려면 먼저 로그인 해주세요.
      </Text>
      <TouchableOpacity style={s.gateBtn} onPress={handleClose}>
        <Text style={s.gateBtnTxt}>닫기</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={s.root}>
        {/* ── 헤더 ── */}
        <View style={s.header}>
          <TouchableOpacity style={s.iconBtn} onPress={handleClose}>
            <Ionicons name="chevron-down" size={22} color={C.sub} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <View style={s.aiDot} />
            <Text style={s.headerTitle}>SignBridge AI</Text>
          </View>
          <TouchableOpacity style={s.iconBtn} onPress={clearChat}>
            <Ionicons name="refresh-outline" size={20} color={C.sub} />
          </TouchableOpacity>
        </View>

        {!loggedIn ? (
          renderGate()
        ) : (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            {/* ── 메시지 목록 ── */}
            <ScrollView
              ref={scrollRef}
              style={s.list}
              contentContainerStyle={{ padding: 16, gap: 14 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[s.row, msg.role === "user" ? s.rowUser : s.rowAI]}
                >
                  {msg.role === "assistant" && (
                    <View style={s.avatarAI}>
                      <Text style={{ fontSize: 16 }}>🤖</Text>
                    </View>
                  )}
                  <View style={{ maxWidth: "78%", gap: 5 }}>
                    <View
                      style={[
                        s.bubble,
                        msg.role === "user" ? s.bubbleUser : s.bubbleAI,
                      ]}
                    >
                      {msg.loading ? (
                        // 로딩 중 (서버 응답 대기)
                        <View style={s.loadingRow}>
                          <ActivityIndicator size="small" color={C.accent} />
                          <Text style={s.loadingTxt}>생각 중...</Text>
                        </View>
                      ) : (
                        // 텍스트 (타이핑 중이면 커서 표시)
                        <Text
                          style={[
                            s.bubbleTxt,
                            msg.role === "user" && { color: "#fff" },
                          ]}
                        >
                          {msg.content}
                          {msg.typing && (
                            <Text style={{ color: C.accent }}>▌</Text>
                          )}
                        </Text>
                      )}
                    </View>
                    {msg.role === "assistant" &&
                      !msg.loading &&
                      !msg.typing && (
                        <TouchableOpacity
                          style={s.ttsBtn}
                          onPress={() => speakMessage(msg.content)}
                        >
                          <Ionicons
                            name={
                              speaking ? "volume-high" : "volume-medium-outline"
                            }
                            size={14}
                            color={C.accent}
                          />
                          <Text style={s.ttsBtnTxt}>
                            {speaking ? "재생 중 (탭하면 정지)" : "소리로 듣기"}
                          </Text>
                        </TouchableOpacity>
                      )}
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* ── 빠른 질문 ── */}
            {messages.length <= 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={s.quickBar}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
              >
                {QUICK_QUESTIONS.map((q, i) => (
                  <TouchableOpacity
                    key={i}
                    style={s.quickChip}
                    onPress={() => send(q)}
                  >
                    <Text style={s.quickChipTxt}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* ── 입력바 ── */}
            <View style={s.inputBar}>
              <TextInput
                ref={inputRef}
                style={s.input}
                placeholder="무엇이든 물어보세요..."
                placeholderTextColor="rgba(255,255,255,0.22)"
                value={input}
                onChangeText={setInput}
                onSubmitEditing={() => send()} // ✅ 키보드 전송 버튼도 동작
                multiline
                maxLength={300}
              />
              <TouchableOpacity
                style={[s.sendBtn, (!input.trim() || sending) && s.sendBtnOff]}
                onPress={() => send()}
                disabled={!input.trim() || sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ── 스타일 ──────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.surface,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 16, fontWeight: "800", color: C.text },
  aiDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.green },

  gate: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 14,
  },
  gateTitle: { fontSize: 20, fontWeight: "800", color: C.text },
  gateSub: { fontSize: 14, color: C.sub, textAlign: "center", lineHeight: 22 },
  gateBtn: {
    marginTop: 8,
    backgroundColor: C.accent,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  gateBtnTxt: { color: "#fff", fontSize: 15, fontWeight: "700" },

  list: { flex: 1 },
  row: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  rowAI: { justifyContent: "flex-start" },
  rowUser: { justifyContent: "flex-end" },
  avatarAI: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.surface2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginBottom: 24,
  },

  bubble: { padding: 13, borderRadius: 18 },
  bubbleAI: {
    backgroundColor: C.aiBg,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  bubbleUser: { backgroundColor: C.userBg, borderBottomRightRadius: 4 },
  bubbleTxt: { fontSize: 14, color: C.text, lineHeight: 22 },

  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  loadingTxt: { fontSize: 13, color: C.sub },

  ttsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: 2,
  },
  ttsBtnTxt: { fontSize: 11, color: C.accent, fontWeight: "600" },

  quickBar: { maxHeight: 46, marginBottom: 6 },
  quickChip: {
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: "rgba(124,111,255,0.3)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexShrink: 0,
  },
  quickChipTxt: { fontSize: 12, color: C.accent, fontWeight: "600" },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    paddingBottom: Platform.OS === "ios" ? 28 : 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.surface,
  },
  input: {
    flex: 1,
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: "rgba(124,111,255,0.2)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: C.text,
    maxHeight: 110,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnOff: { backgroundColor: "rgba(124,111,255,0.3)" },
});
