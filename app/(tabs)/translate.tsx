// ══════════════════════════════════════════════════════════════
//  app/(tabs)/translate.tsx
//  수어 탭: 카메라 + LSTM 손 인식 + SubPanel 흐름
//  텍스트 탭: 입력 → 전송 → 아바타 + 대화 동시 전송
// ══════════════════════════════════════════════════════════════
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { translateApi } from "@/components/api/api";
import AvatarPanel, { Guide } from "@/components/Translate/AvatarPanel";
import SignCameraView from "@/components/Translate/SignCameraView";
import useLSTMSign from "@/hooks/useLSTMSign";

// ─── 색상 ─────────────────────────────────────────────────────
const C = {
  accent: "#5b5ef4",
  accent2: "#06d6c8",
  sign: "#2563eb",
  reply: "#059669",
  err: "#ef4444",
  text: "#0f0f1a",
  sub: "#64748b",
  border: "#e4e8f2",
  bg: "#f0f2fa",
  card: "#ffffff",
  warn: "#f59e0b",
  warnBg: "#fffbeb",
  warnText: "#92400e",
  green: "#10b981",
  purple: "#8b5cf6",
};
const CP = {
  bg: "#f5f5f7",
  surface: "#ffffff",
  border: "#e8e8ec",
  text: "#111118",
  textDim: "#6b6b80",
  textMute: "#aeaec0",
  accent: "#5b45e0",
  signBg: "#f2f0ff",
  signBorder: "#ddd8ff",
  voiceFrom: "#6c5ce7",
};

const PLACE_LABEL: Record<string, string> = {
  immigration: "출입국사무소",
  police: "경찰서",
  hospital: "병원",
  default: "현장",
};

// 마침표 추가
function addPeriods(text: string): string {
  if (!text) return text;
  const t = text.trim();
  return /[.?!]$/.test(t) ? t : t + ".";
}

type MsgType = "sign" | "voice";
type ActiveTab = "sign" | "avatar" | "text" | "chat";
type InputMode = "text" | "voice";

interface Message {
  id: number;
  type: MsgType;
  text: string;
  time: string;
}
interface VideoItem {
  id: number;
  localUrl: string;
  serverId: string | null;
  uploadStatus: "uploading" | "done" | "error";
}

function fmtTime(sec: number) {
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}

// ══════════════════════════════════════════════════════════════
export default function TranslateScreen({
  place = "immigration",
  userEmail = "officer@example.com",
  onFinalRegister,
}: {
  place?: string;
  userEmail?: string;
  onFinalRegister?: (m: Message[], v: VideoItem[]) => void;
}) {
  const [screenMode, setScreenMode] = useState<"translate" | "conversation">(
    "translate",
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [videoUris, setVideoUris] = useState<string[]>([]);

  if (screenMode === "conversation") {
    return (
      <ConversationPage
        messages={messages}
        videoUris={videoUris}
        place={place}
        userEmail={userEmail}
        onBack={() => setScreenMode("translate")}
        onRegister={(vids) => {
          if (onFinalRegister) onFinalRegister(messages, vids);
          else {
            Alert.alert("완료", "등록이 완료되었습니다.");
            setMessages([]);
            setVideoUris([]);
            setScreenMode("translate");
          }
        }}
      />
    );
  }
  return (
    <TranslateView
      place={place}
      initialMessages={messages}
      onEndConversation={(msgs) => {
        setMessages(msgs);
        setScreenMode("conversation");
      }}
      onMockRecordComplete={(uri) => setVideoUris((p) => [...p, uri])}
    />
  );
}

// ══════════════════════════════════════════════════════════════
//  TranslateView
// ══════════════════════════════════════════════════════════════
function TranslateView({
  onEndConversation,
  onMockRecordComplete,
  place = "immigration",
  initialMessages = [],
}: {
  onEndConversation?: (m: Message[]) => void;
  onMockRecordComplete?: (uri: string) => void;
  place?: string;
  initialMessages?: Message[];
}) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("sign");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const msgsRef = useRef<Message[]>(initialMessages);

  // 카메라
  const [cameraActive, setCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recSec, setRecSec] = useState(0);

  // ── LSTM SubPanel 상태 ──────────────────────────────────────
  const [lstmWord, setLstmWord] = useState("");
  const [lstmConf, setLstmConf] = useState(0);
  const [collectedWords, setCollectedWords] = useState<string[]>([]);
  const [lstmSentence, setLstmSentence] = useState("");
  const [lstmGenerating, setLstmGenerating] = useState(false);

  const [landmarks, setLandmarks] = useState<any>(null);

  const { lstmStatus } = useLSTMSign({
    onGesture: useCallback((name: string, conf: number) => {
      setLstmWord(name);
      setLstmConf(conf);
    }, []),
    onLandmarks: useCallback((data: any) => {
      setLandmarks(data);
    }, []),
    serverUrl: "ws://192.168.0.80:8000/ws/sign", // ← LSTM 서버 IP (별도)
  });

  const handleLstmAccept = () => {
    if (!lstmWord) return;
    setCollectedWords((p) => [...p, lstmWord]);
    setLstmWord("");
    setLstmConf(0);
    setLstmSentence("");
  };
  const handleLstmRemoveWord = (i: number) => {
    setCollectedWords((p) => p.filter((_, j) => j !== i));
    setLstmSentence("");
  };
  const handleLstmGenerate = async () => {
    if (!collectedWords.length) return;
    setLstmGenerating(true);
    try {
      const data = await translateApi.buildSubtitle(collectedWords, place);
      setLstmSentence(addPeriods(data.sentence || collectedWords.join(" ")));
    } catch {
      setLstmSentence(addPeriods(collectedWords.join(" ")));
    } finally {
      setLstmGenerating(false);
    }
  };
  const handleLstmSend = () => {
    if (!lstmSentence) return;
    addMsg("sign", lstmSentence);
    setCollectedWords([]);
    setLstmSentence("");
    setLstmWord("");
    setLstmConf(0);
    setActiveTab("chat");
  };

  // 아바타
  const [aiGuide, setAiGuide] = useState<Guide | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [avatarPlaying, setAvatarPlaying] = useState(false);

  // 텍스트
  const [textInput, setTextInput] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [pendingReply, setPendingReply] = useState<string | null>(null);

  const [ttsOn, setTtsOn] = useState(true);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showStopWarn, setShowStopWarn] = useState(false);

  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const startCamera = useCallback(() => {
    setCameraActive(true);
    setIsRecording(true);
    setRecSec(0);
    recTimerRef.current = setInterval(() => setRecSec((v) => v + 1), 1000);
  }, []);

  const stopCamera = useCallback(() => {
    setCameraActive(false);
    setIsRecording(false);
    if (recTimerRef.current) {
      clearInterval(recTimerRef.current);
      recTimerRef.current = null;
    }
    onMockRecordComplete?.(`file://clip_${Date.now()}.mp4`);
  }, [onMockRecordComplete]);

  // 텍스트 → 아바타 + 대화 동시 전송
  const submitText = useCallback(() => {
    const v = textInput.trim();
    if (!v) return;
    setPendingReply(v);
    setAiLoading(true);
    setAvatarPlaying(false);
    setTimeout(() => {
      const mockGuide: Guide = {
        steps: v
          .split(/\s+/)
          .slice(0, 6)
          .map((word) => ({
            word,
            animType: word.includes("안녕")
              ? "hello"
              : word.includes("감사") || word.includes("고마")
                ? "thanks"
                : word.includes("사랑")
                  ? "love"
                  : word.includes("좋")
                    ? "thumbUp"
                    : word.includes("미안") || word.includes("죄송")
                      ? "fist"
                      : "idle",
          })),
      };
      setAiGuide(mockGuide);
      setAiLoading(false);
    }, 1200);
    setTextInput("");
  }, [textInput]);

  // 텍스트 전송 → 아바타 재생 + 대화에도 추가
  const sendReply = useCallback(() => {
    if (!pendingReply) return;
    addMsg("voice", pendingReply); // ← 대화에도 추가
    setPendingReply(null);
    setAvatarPlaying(true);
    setActiveTab("avatar"); // 아바타 탭으로 이동
    setTimeout(
      () => setAvatarPlaying(false),
      (aiGuide?.steps?.length ?? 1) * 3000 + 500,
    );
  }, [pendingReply, aiGuide]);

  const addMsg = (type: MsgType, text: string) => {
    const m: Message = {
      id: Date.now(),
      type,
      text,
      time: new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => {
      const n = [...prev, m];
      msgsRef.current = n;
      return n;
    });
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  useEffect(
    () => () => {
      if (recTimerRef.current) clearInterval(recTimerRef.current);
    },
    [],
  );

  const TABS: { id: ActiveTab; label: string }[] = [
    { id: "sign", label: "🖐 수어" },
    { id: "avatar", label: "🤟 아바타" },
    { id: "text", label: "⌨️ 텍스트" },
    {
      id: "chat",
      label: `💬 대화${messages.length > 0 ? ` (${messages.length})` : ""}`,
    },
  ];

  const lstmStatusColor =
    lstmStatus === "ready"
      ? C.green
      : lstmStatus === "connecting"
        ? "#f59e0b"
        : "#ef4444";
  const lstmStatusLabel =
    lstmStatus === "ready"
      ? "● LSTM 연결됨"
      : lstmStatus === "connecting"
        ? "○ 연결 중..."
        : lstmStatus === "error"
          ? "✕ 오류"
          : "○ 미연결";

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={s.warnBanner}>
          <Text style={s.warnBannerTxt}>
            ⚠️ 이 화면의 모든 내용은 기록됩니다.
          </Text>
        </View>

        {showStopWarn && (
          <View style={s.stopWarn}>
            <Text style={s.stopWarnTxt}>
              ⚠️ 먼저 <Text style={{ fontWeight: "700" }}>⏹ Stop</Text>을 눌러
              녹화를 중지해 주세요.
            </Text>
            <TouchableOpacity onPress={() => setShowStopWarn(false)}>
              <Text style={s.stopWarnClose}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={s.topBar}>
          <View style={s.placeBadge}>
            <Text style={s.placeBadgeTxt}>
              📍 {PLACE_LABEL[place] ?? place}
            </Text>
          </View>
          {isRecording && (
            <View style={s.recBadge}>
              <Text style={s.recBadgeTxt}>● REC {fmtTime(recSec)}</Text>
            </View>
          )}
          <TouchableOpacity
            style={[s.ttsBtn, ttsOn && s.ttsBtnOn]}
            onPress={() => setTtsOn((v) => !v)}
            activeOpacity={0.75}
          >
            <Text style={[s.ttsBtnTxt, ttsOn && s.ttsBtnTxtOn]}>🔊 읽기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.btnEnd}
            onPress={() => {
              if (isRecording) {
                setShowStopWarn(true);
                return;
              }
              setShowEndConfirm(true);
            }}
            activeOpacity={0.85}
          >
            <Text style={s.btnEndTxt}>종료 →</Text>
          </TouchableOpacity>
        </View>

        <View style={s.tabRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[s.tabBtn, activeTab === tab.id && s.tabBtnOn]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.8}
            >
              <Text
                style={[s.tabBtnTxt, activeTab === tab.id && s.tabBtnTxtOn]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.scrollContent}
        >
          {/* ════ 수어 탭 — 카메라 + LSTM SubPanel ════ */}
          {activeTab === "sign" && (
            <View style={{ gap: 14 }}>
              {/* 카메라 */}
              <View style={s.card}>
                <Text style={s.cardHdTxt}>
                  🖐 수어 인식 <Text style={s.cardHdSub}>청각장애인</Text>
                </Text>
                <SignCameraView
                  isActive={cameraActive}
                  isRecording={isRecording}
                  recSec={recSec}
                  currentWord={lstmWord}
                  currentConf={lstmConf}
                  lstmStatus={lstmStatus}
                  landmarks={landmarks}
                  onStart={startCamera}
                  onStop={stopCamera}
                />
              </View>

              {/* LSTM SubPanel */}
              <View style={s.card}>
                {/* 헤더 */}
                <View style={s.lstmHeader}>
                  <Text style={s.cardHdTxt}>🧠 LSTM 수어 인식</Text>
                  <Text style={[s.lstmStatus, { color: lstmStatusColor }]}>
                    {lstmStatusLabel}
                  </Text>
                </View>

                {/* 현재 인식 단어 */}
                <View style={[s.lstmBox, lstmWord && s.lstmBoxOn]}>
                  {lstmStatus !== "ready" ? (
                    <Text style={s.lstmHint}>
                      카메라를 켜면 손 동작을 자동으로 인식합니다
                    </Text>
                  ) : lstmWord ? (
                    <View style={s.lstmHit}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.lstmWordLabel}>인식된 수어</Text>
                        <Text style={s.lstmWord}>{lstmWord}</Text>
                        <Text style={s.lstmConf}>
                          {Math.round(lstmConf * 100)}%
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={s.acceptBtn}
                        onPress={handleLstmAccept}
                      >
                        <Text style={s.acceptBtnTxt}>✅ 맞음</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={s.lstmHint}>
                      🤟 손 동작을 하면 단어가 인식됩니다
                    </Text>
                  )}
                </View>

                {/* 수집된 단어 */}
                {collectedWords.length > 0 && (
                  <View style={{ gap: 6 }}>
                    <Text style={s.wordsLabel}>수집된 단어</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      <View style={s.wordsRow}>
                        {collectedWords.map((w, i) => (
                          <View key={i} style={s.wordChip}>
                            <Text style={s.wordChipTxt}>{w}</Text>
                            <TouchableOpacity
                              onPress={() => handleLstmRemoveWord(i)}
                            >
                              <Text style={s.wordChipDel}>✕</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                )}

                {/* 문장 생성 버튼 */}
                {collectedWords.length > 0 && !lstmSentence && (
                  <TouchableOpacity
                    style={[s.genBtn, lstmGenerating && { opacity: 0.6 }]}
                    onPress={handleLstmGenerate}
                    disabled={lstmGenerating}
                    activeOpacity={0.85}
                  >
                    {lstmGenerating ? (
                      <Text style={s.genBtnTxt}>생성 중...</Text>
                    ) : (
                      <Text style={s.genBtnTxt}>✨ 문장 생성</Text>
                    )}
                  </TouchableOpacity>
                )}

                {/* 생성된 문장 + 전송 */}
                {lstmSentence !== "" && (
                  <View style={s.sentenceBox}>
                    <Text style={s.sentenceLabel}>💬 생성된 문장</Text>
                    <Text style={s.sentenceTxt}>{lstmSentence}</Text>
                    <View style={s.sentenceActs}>
                      <TouchableOpacity
                        style={s.retryBtn}
                        onPress={() => setLstmSentence("")}
                      >
                        <Text style={s.retryBtnTxt}>↩ 다시</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.sendBtn}
                        onPress={handleLstmSend}
                      >
                        <Text style={s.sendBtnTxt}>전송하기 →</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* ════ 아바타 탭 ════ */}
          {activeTab === "avatar" && (
            <View style={s.card}>
              <Text style={s.cardHdTxt}>
                🤟 수어 아바타 <Text style={s.cardHdSub}>담당자 응답 시연</Text>
              </Text>
              <AvatarPanel
                guide={aiGuide}
                loading={aiLoading}
                playing={avatarPlaying}
              />
              {!aiGuide && !aiLoading && (
                <TouchableOpacity
                  style={s.goTextBtn}
                  onPress={() => setActiveTab("text")}
                  activeOpacity={0.85}
                >
                  <Text style={s.goTextBtnTxt}>⌨️ 텍스트 입력하러 가기 →</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ════ 텍스트 탭 ════ */}
          {activeTab === "text" && (
            <View style={s.card}>
              <Text style={s.cardHdTxt}>
                ⌨️ 텍스트 입력 <Text style={s.cardHdSub}>담당자</Text>
              </Text>
              <View style={s.inputTabs}>
                {(["text", "voice"] as InputMode[]).map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[s.inputTab, inputMode === mode && s.inputTabOn]}
                    onPress={() => setInputMode(mode)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        s.inputTabTxt,
                        inputMode === mode && s.inputTabTxtOn,
                      ]}
                    >
                      {mode === "text" ? "⌨️ 텍스트" : "🎙️ 음성"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {!pendingReply ? (
                <>
                  {inputMode === "text" && (
                    <View style={{ gap: 10 }}>
                      <TextInput
                        style={s.textarea}
                        placeholder="담당자가 전달할 내용을 입력하세요..."
                        placeholderTextColor="#a0aec0"
                        value={textInput}
                        onChangeText={setTextInput}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                      />
                      <TouchableOpacity
                        style={[
                          s.suggestBtn,
                          textInput.trim() ? s.suggestBtnOn : s.suggestBtnOff,
                        ]}
                        onPress={submitText}
                        disabled={!textInput.trim()}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            s.suggestBtnTxt,
                            textInput.trim() && s.suggestBtnTxtOn,
                          ]}
                        >
                          수어문 추출 → 아바타 시연
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {inputMode === "voice" && (
                    <View style={s.voiceRow}>
                      <Text style={s.voiceHint}>
                        🎙️ 음성 입력은 추후 지원 예정입니다
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={s.previewCard}>
                  <Text style={s.previewLbl}>✉️ 전송할 내용</Text>
                  <View style={s.previewTxtBox}>
                    <Text style={s.previewTxt}>{pendingReply}</Text>
                  </View>
                  <Text style={s.previewQ}>
                    이 내용을 아바타로 시연하고 대화에도 전송할까요?
                  </Text>
                  <View style={s.previewActs}>
                    <TouchableOpacity
                      style={s.btnRetake}
                      onPress={() => setPendingReply(null)}
                      activeOpacity={0.8}
                    >
                      <Text style={s.btnRetakeTxt}>↩ 다시 입력</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.btnSendReply}
                      onPress={sendReply}
                      activeOpacity={0.85}
                    >
                      <Text style={s.btnSendReplyTxt}>전송하기 →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* ════ 대화 기록 탭 ════ */}
          {activeTab === "chat" && (
            <View style={s.card}>
              <Text style={s.cardHdTxt}>
                💬 대화 기록
                {messages.length > 0 && (
                  <Text style={s.msgCount}> {messages.length}개</Text>
                )}
              </Text>
              {messages.length === 0 ? (
                <View style={s.chatEmpty}>
                  <Text style={{ fontSize: 32 }}>💬</Text>
                  <Text style={s.chatEmptyTxt}>
                    수어 또는 텍스트로 대화를 시작하세요
                  </Text>
                </View>
              ) : (
                messages.map((msg) => (
                  <View
                    key={msg.id}
                    style={[
                      s.msgRow,
                      msg.type === "voice" ? s.msgRowRight : s.msgRowLeft,
                    ]}
                  >
                    {msg.type === "sign" && (
                      <View style={s.msgAvatar}>
                        <Text>🧏</Text>
                      </View>
                    )}
                    <View
                      style={[
                        s.msgBubble,
                        msg.type === "sign"
                          ? s.msgBubbleSign
                          : s.msgBubbleVoice,
                      ]}
                    >
                      <Text style={s.msgNm}>
                        {msg.type === "sign" ? "🧏 청각장애인" : "🙋 담당자"}
                      </Text>
                      <Text
                        style={[
                          s.msgTxt,
                          msg.type === "sign" ? s.msgTxtSign : s.msgTxtVoice,
                        ]}
                      >
                        {msg.text}
                      </Text>
                      <Text style={s.msgTime}>{msg.time}</Text>
                    </View>
                    {msg.type === "voice" && (
                      <View style={s.msgAvatar}>
                        <Text>🙋</Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>

        <Modal visible={showEndConfirm} transparent animationType="fade">
          <Pressable
            style={s.modalOverlay}
            onPress={() => setShowEndConfirm(false)}
          >
            <Pressable style={s.endModal}>
              <Text style={{ fontSize: 32 }}>🏁</Text>
              <Text style={s.endModalTitle}>대화를 종료할까요?</Text>
              <Text style={s.endModalDesc}>
                대화 기록 및 요약보고서 화면으로 이동합니다.
              </Text>
              <View style={s.endModalActs}>
                <TouchableOpacity
                  style={s.endCancel}
                  onPress={() => setShowEndConfirm(false)}
                >
                  <Text style={s.endCancelTxt}>계속하기</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.endOk}
                  onPress={() => {
                    setShowEndConfirm(false);
                    onEndConversation?.(msgsRef.current);
                  }}
                >
                  <Text style={s.endOkTxt}>종료하기</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ══════════════════════════════════════════════════════════════
function ConversationPage({
  messages = [],
  videoUris = [],
  onBack,
  onRegister,
  userEmail = "",
  place = "immigration",
}: {
  messages: Message[];
  videoUris?: string[];
  onBack: () => void;
  onRegister: (v: VideoItem[]) => void;
  userEmail?: string;
  place?: string;
}) {
  const processedRef = useRef<Set<string>>(new Set());
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "done" | "error"
  >("idle");
  const [modalVideo, setModalVideo] = useState<VideoItem | null>(null);

  useEffect(() => {
    videoUris.forEach((uri) => {
      if (processedRef.current.has(uri)) return;
      processedRef.current.add(uri);
      const vidId = Date.now() + Math.floor(Math.random() * 1000);
      setVideos((p) => [
        ...p,
        { id: vidId, localUrl: uri, serverId: null, uploadStatus: "uploading" },
      ]);
      setTimeout(() => {
        const sid = `V-${Math.floor(Math.random() * 90000) + 10000}`;
        setVideos((p) =>
          p.map((v) =>
            v.localUrl === uri
              ? { ...v, serverId: sid, uploadStatus: "done" }
              : v,
          ),
        );
      }, 2000);
    });
  }, [videoUris]);

  useEffect(() => {
    setSaveStatus("saving");
    setTimeout(() => setSaveStatus("done"), 1500);
  }, [messages]);

  const handleShare = async () => {
    try {
      await Share.share({
        title: `수어 번역 보고서 (${place})`,
        message: messages
          .map(
            (m) =>
              `[${m.time}] ${m.type === "sign" ? "청각장애인" : "담당자"}: ${m.text}`,
          )
          .join("\n"),
      });
    } catch {}
  };

  const signCount = messages.filter((m) => m.type === "sign").length;
  const voiceCount = messages.filter((m) => m.type === "voice").length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.btnBack} onPress={onBack}>
          <Text style={styles.btnBackTxt}>◀ 돌아가기</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>대화 요약 보고서</Text>
          <View style={styles.statsRow}>
            <View style={styles.statSign}>
              <Text style={styles.statSignTxt}>수어 {signCount}회</Text>
            </View>
            <View style={styles.statVoice}>
              <Text style={styles.statVoiceTxt}>응답 {voiceCount}회</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.btnRegister}
          onPress={() => onRegister(videos)}
        >
          <Text style={styles.btnRegisterTxt}>등록하기</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollBody}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.saveStatusCard}>
          <Text style={styles.sectionTitle}>💾 저장 상태</Text>
          {saveStatus === "saving" && (
            <View style={[styles.badge, styles.badgeSaving]}>
              <Text style={styles.badgeSavingTxt}>⏳ 저장 중...</Text>
            </View>
          )}
          {saveStatus === "done" && (
            <View style={[styles.badge, styles.badgeDone]}>
              <Text style={styles.badgeDoneTxt}>✅ 저장 완료</Text>
            </View>
          )}
        </View>
        <View style={styles.metaCard}>
          <Text style={styles.metaTitle}>📍 세션 요약</Text>
          <Text style={styles.metaText}>
            • 현장: {place === "immigration" ? "출입국사무소" : place}
          </Text>
          <Text style={styles.metaText}>
            • 담당자: {userEmail || "비로그인"}
          </Text>
          <Text style={styles.metaText}>
            • 일시: {new Date().toLocaleDateString("ko-KR")} 세션
          </Text>
          <TouchableOpacity style={styles.btnShare} onPress={handleShare}>
            <Text style={styles.btnShareTxt}>🔗 스크립트 공유</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.videoSectionCard}>
          <Text style={styles.sectionTitle}>
            🎬 녹화 영상 ({videos.length})
          </Text>
          {videos.length === 0 ? (
            <Text style={styles.emptyText}>
              이번 세션에서 추출된 영상이 없습니다.
            </Text>
          ) : (
            videos.map((vid, idx) => (
              <View key={vid.id} style={styles.videoCard}>
                <View style={styles.videoThumbnailPlaceholder}>
                  <Text style={{ fontSize: 20 }}>📹</Text>
                  <Text style={styles.videoThumbTxt}>클립 {idx + 1}</Text>
                </View>
                <View style={styles.videoCardBody}>
                  <Text style={styles.videoStatusTxt}>
                    {vid.uploadStatus === "uploading"
                      ? "⏳ 업로드 중..."
                      : `✅ 완료 (${vid.serverId})`}
                  </Text>
                  <TouchableOpacity
                    style={styles.btnPlayVid}
                    onPress={() => setModalVideo(vid)}
                  >
                    <Text style={styles.btnPlayVidTxt}>▶ 확인</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
        <View style={styles.chatLogCard}>
          <Text style={styles.sectionTitle}>💬 대화 스크립트</Text>
          {messages.map((msg) => (
            <View
              key={msg.id}
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
                  {msg.type === "sign" ? "🧏 청각장애인" : "🙋 담당자"}
                </Text>
                <Text style={styles.bubbleText}>{msg.text}</Text>
                <Text style={styles.bubbleTime}>{msg.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={modalVideo !== null} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={styles.videoModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🎬 영상 프리뷰</Text>
              <TouchableOpacity onPress={() => setModalVideo(null)}>
                <Text style={styles.modalCloseBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text
                style={styles.modalPlayHint}
              >{`파일:\n${modalVideo?.localUrl}`}</Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ══════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  warnBanner: {
    backgroundColor: C.warnBg,
    borderBottomWidth: 1,
    borderBottomColor: "#fde68a",
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
  },
  warnBannerTxt: { fontSize: 12, color: C.warnText, fontWeight: "600" },
  stopWarn: {
    backgroundColor: "#fff3cd",
    borderWidth: 1,
    borderColor: "#ffc107",
    borderRadius: 10,
    margin: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stopWarnTxt: { fontSize: 13, color: "#7d4e00", flex: 1 },
  stopWarnClose: { fontSize: 16, color: "#7d4e00", paddingLeft: 8 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  placeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: C.border,
  },
  placeBadgeTxt: { fontSize: 11, fontWeight: "700", color: C.sub },
  recBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fca5a5",
  },
  recBadgeTxt: { fontSize: 11, fontWeight: "700", color: "#dc2626" },
  ttsBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "#f8f9ff",
  },
  ttsBtnOn: { borderColor: C.accent, backgroundColor: "rgba(91,94,244,.08)" },
  ttsBtnTxt: { fontSize: 11, fontWeight: "700", color: C.sub },
  ttsBtnTxtOn: { color: C.accent },
  btnEnd: {
    marginLeft: "auto",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: C.err,
  },
  btnEndTxt: { fontSize: 12, fontWeight: "800", color: "#fff" },
  tabRow: {
    flexDirection: "row",
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 4,
    paddingTop: 6,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnOn: { borderBottomColor: C.accent },
  tabBtnTxt: { fontSize: 10, fontWeight: "600", color: C.sub },
  tabBtnTxtOn: { color: C.accent, fontWeight: "800" },
  scrollContent: { padding: 14, gap: 12 },
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 14,
  },
  cardHdTxt: { fontSize: 15, fontWeight: "800", color: C.text },
  cardHdSub: { fontSize: 12, fontWeight: "600", color: C.sub },

  // LSTM SubPanel
  lstmHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lstmStatus: { fontSize: 11, fontWeight: "700" },
  lstmBox: {
    minHeight: 64,
    backgroundColor: "#f5f3ff",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#ddd6fe",
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  lstmBoxOn: { borderColor: C.accent, backgroundColor: "rgba(91,94,244,.06)" },
  lstmHint: { fontSize: 13, color: C.sub, textAlign: "center" },
  lstmHit: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 12,
  },
  lstmWordLabel: { fontSize: 11, color: C.sub, marginBottom: 2 },
  lstmWord: { fontSize: 22, fontWeight: "900", color: C.accent },
  lstmConf: { fontSize: 11, color: C.green, fontWeight: "700", marginTop: 2 },
  acceptBtn: {
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 4,
  },
  acceptBtnTxt: { fontSize: 13, fontWeight: "800", color: "#fff" },
  wordsLabel: { fontSize: 11, fontWeight: "700", color: C.sub },
  wordsRow: { flexDirection: "row", gap: 6, paddingBottom: 2 },
  wordChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(91,94,244,.08)",
    borderWidth: 1.5,
    borderColor: "rgba(91,94,244,.2)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  wordChipTxt: { fontSize: 12, fontWeight: "700", color: C.accent },
  wordChipDel: { fontSize: 11, color: "#9ca3af" },
  genBtn: {
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    elevation: 4,
  },
  genBtnTxt: { fontSize: 14, fontWeight: "800", color: "#fff" },
  sentenceBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#ddd6fe",
    padding: 12,
    gap: 8,
  },
  sentenceLabel: { fontSize: 11, fontWeight: "700", color: C.purple },
  sentenceTxt: {
    fontSize: 15,
    fontWeight: "700",
    color: C.text,
    lineHeight: 22,
  },
  sentenceActs: { flexDirection: "row", gap: 8 },
  retryBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  retryBtnTxt: { fontSize: 12, fontWeight: "700", color: C.sub },
  sendBtn: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: C.accent,
    alignItems: "center",
  },
  sendBtnTxt: { fontSize: 13, fontWeight: "800", color: "#fff" },

  goTextBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(91,94,244,.08)",
    borderWidth: 1.5,
    borderColor: C.accent + "33",
    alignItems: "center",
  },
  goTextBtnTxt: { fontSize: 14, fontWeight: "700", color: C.accent },
  inputTabs: { flexDirection: "row", gap: 8 },
  inputTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: "center",
    backgroundColor: C.card,
  },
  inputTabOn: { borderColor: C.accent, backgroundColor: "rgba(91,94,244,.06)" },
  inputTabTxt: { fontSize: 13, fontWeight: "700", color: C.sub },
  inputTabTxtOn: { color: C.accent },
  textarea: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: C.text,
    backgroundColor: "#f8f9ff",
    minHeight: 100,
    textAlignVertical: "top",
  },
  suggestBtn: { borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  suggestBtnOn: { backgroundColor: C.accent },
  suggestBtnOff: { backgroundColor: "#e2e8f0" },
  suggestBtnTxt: { fontSize: 14, fontWeight: "800", color: "#aaa" },
  suggestBtnTxtOn: { color: "#fff" } as any,
  voiceRow: { alignItems: "center", paddingVertical: 24 },
  voiceHint: { fontSize: 13, color: C.sub, textAlign: "center" },
  previewCard: { gap: 12, alignItems: "center" },
  previewLbl: { fontSize: 13, fontWeight: "700", color: C.sub },
  previewTxtBox: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "rgba(5,150,105,.15)",
    borderRadius: 14,
    padding: 14,
    width: "100%",
  },
  previewTxt: {
    fontSize: 15,
    color: "#14532d",
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 22,
  },
  previewQ: { fontSize: 13, color: C.sub, textAlign: "center" },
  previewActs: { flexDirection: "row", gap: 10, width: "100%" },
  btnRetake: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: "center",
    backgroundColor: C.card,
  },
  btnRetakeTxt: { fontSize: 13, fontWeight: "700", color: C.sub },
  btnSendReply: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: C.reply,
    alignItems: "center",
  },
  btnSendReplyTxt: { fontSize: 14, fontWeight: "800", color: "#fff" },
  msgCount: { fontSize: 12, fontWeight: "600", color: "#888" },
  chatEmpty: { alignItems: "center", gap: 10, paddingVertical: 28 },
  chatEmptyTxt: { fontSize: 13, color: C.sub },
  msgRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 10,
  },
  msgRowLeft: { justifyContent: "flex-start" },
  msgRowRight: { justifyContent: "flex-end" },
  msgAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  msgBubble: { maxWidth: "76%", borderRadius: 14, padding: 10 },
  msgBubbleSign: {
    backgroundColor: "#eff6ff",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(37,99,235,.1)",
  },
  msgBubbleVoice: {
    backgroundColor: "#f0fdf4",
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(5,150,105,.1)",
  },
  msgNm: { fontSize: 11, fontWeight: "700", color: C.sub, marginBottom: 4 },
  msgTxt: { fontSize: 13.5, lineHeight: 21 },
  msgTxtSign: { color: "#1e3a5f" },
  msgTxtVoice: { color: "#14532d" },
  msgTime: { fontSize: 10, color: "#ccc", marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(10,10,20,0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  endModal: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 32,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    gap: 12,
  },
  endModalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111118",
    letterSpacing: -0.4,
  },
  endModalDesc: {
    fontSize: 14,
    color: "#6b6b80",
    lineHeight: 24,
    textAlign: "center",
  },
  endModalActs: { flexDirection: "row", gap: 10, width: "100%", marginTop: 8 },
  endCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#f3f3f8",
    borderWidth: 1.5,
    borderColor: "#e4e4ec",
    alignItems: "center",
  },
  endCancelTxt: { fontSize: 14, fontWeight: "700", color: "#6b6b80" },
  endOk: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#ef4444",
    alignItems: "center",
  },
  endOkTxt: { fontSize: 14, fontWeight: "700", color: "#fff" },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CP.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: CP.surface,
    borderBottomWidth: 1,
    borderColor: CP.border,
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
  headerCenter: { alignItems: "center", flex: 1 },
  title: { fontSize: 16, fontWeight: "900", color: CP.text },
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
  sectionTitle: { fontSize: 14, fontWeight: "800", color: CP.text },
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
  videoCard: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: CP.border,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    marginBottom: 8,
  },
  videoThumbnailPlaceholder: {
    width: 64,
    height: 54,
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
  videoStatusTxt: { fontSize: 11, color: CP.textDim },
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
  videoModal: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 16,
    width: "90%",
    maxWidth: 360,
    alignSelf: "center",
  },
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
    height: 160,
    borderRadius: 10,
    justifyContent: "center",
    padding: 14,
  },
  modalPlayHint: { color: "#38bdf8", fontSize: 11, textAlign: "center" },
});
