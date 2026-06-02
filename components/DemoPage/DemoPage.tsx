// ══════════════════════════════════════════════════════════════
//  app/demopage.tsx — 웹 DemoPage.jsx React Native 이식
//  3패널: 음성 패널 | 채팅 | 수어 패널
// ══════════════════════════════════════════════════════════════
import { LSTM_WS_URL } from "@/components/api/api";
import { Ionicons } from "@expo/vector-icons";
import {
  CameraType,
  CameraView as ExpoCameraView,
  useCameraPermissions,
} from "expo-camera";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

const { width: SW, height: SH } = Dimensions.get("window");
const isTablet = SW >= 768;

// ─── 색상 ─────────────────────────────────────────────────────
const C = {
  bg: "#0b0d11",
  surface: "rgba(19,22,29,0.92)",
  border: "rgba(255,255,255,0.08)",
  voice: "#3ecfcf",
  sign: "#a78bfa",
  green: "#4ade80",
  text: "#f0f2f7",
  sub: "#7a8099",
};

// ─── 수어 맵 ──────────────────────────────────────────────────
const SIGN_MAP = [
  { id: "hello", label: "안녕하세요", emoji: "🤟", meaning: "반가움 인사" },
  { id: "thanks", label: "감사합니다", emoji: "🙏", meaning: "고마움 표현" },
  { id: "yes", label: "네, 맞아요", emoji: "👍", meaning: "긍정 동의" },
  { id: "wait", label: "잠깐만요", emoji: "✋", meaning: "멈춤 요청" },
  { id: "help", label: "도움이 필요해요", emoji: "🤲", meaning: "도움 요청" },
  { id: "ok", label: "이해했습니다", emoji: "👌", meaning: "이해 완료" },
  { id: "nice", label: "괜찮습니다", emoji: "🖐️", meaning: "긍정 표현" },
  { id: "meet", label: "반갑습니다", emoji: "👋", meaning: "처음 인사" },
];

// ─── MediaPipe 랜드마크 WebView HTML ──────────────────────────
const LANDMARK_HTML = `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<style>* {margin:0;padding:0;} body{background:transparent;overflow:hidden;} canvas{position:absolute;top:0;left:0;width:100%;height:100%;}</style>
</head><body>
<canvas id="cv"></canvas>
<script>
const cv=document.getElementById('cv');const ctx=cv.getContext('2d');
function resize(){cv.width=window.innerWidth;cv.height=window.innerHeight;}
resize();window.addEventListener('resize',resize);
const CONN=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
function draw(lm){
  ctx.clearRect(0,0,cv.width,cv.height);
  if(!lm||!lm.length)return;
  const W=cv.width,H=cv.height;
  ctx.strokeStyle='rgba(99,220,180,0.85)';ctx.lineWidth=2.5;ctx.lineCap='round';
  CONN.forEach(([a,b])=>{if(!lm[a]||!lm[b])return;ctx.beginPath();ctx.moveTo(lm[a][0]*W,lm[a][1]*H);ctx.lineTo(lm[b][0]*W,lm[b][1]*H);ctx.stroke();});
  lm.forEach((p,i)=>{ctx.beginPath();ctx.arc(p[0]*W,p[1]*H,i===0?6:i%4===0?5:3.5,0,Math.PI*2);ctx.fillStyle=i%4===0?'#63dcb4':'#fff';ctx.strokeStyle='#63dcb4';ctx.lineWidth=1.5;ctx.fill();ctx.stroke();});
}
document.addEventListener('message',e=>{try{draw(JSON.parse(e.data));}catch{}});
window.addEventListener('message',e=>{try{draw(JSON.parse(e.data));}catch{}});
</script></body></html>`;

// ──────────────────────────────────────────────────────────────
interface Msg {
  id: number;
  from: "system" | "voice" | "sign";
  text: string;
  emoji?: string;
}

export default function DemoPage({ onClose }: { onClose?: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([
    { id: 0, from: "system", text: "소통 세션이 시작되었습니다." },
  ]);
  const [voiceText, setVoiceText] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [facing, setFacing] = useState<CameraType>("front");
  const [selectedSign, setSelectedSign] = useState(SIGN_MAP[0]);
  const [detectedSign, setDetectedSign] = useState<(typeof SIGN_MAP)[0] | null>(
    null,
  );
  const [landmarks, setLandmarks] = useState<number[][] | null>(null);
  const [activePanel, setActivePanel] = useState<"voice" | "chat" | "sign">(
    "sign",
  );

  // LSTM
  const [lstmWord, setLstmWord] = useState("");
  const [lstmConf, setLstmConf] = useState(0);
  const [lstmWords, setLstmWords] = useState<string[]>([]);
  const [lstmSentence, setLstmSentence] = useState("");
  const [lstmStatus, setLstmStatus] = useState<
    "disconnected" | "connecting" | "ready" | "error"
  >("disconnected");

  const wsRef = useRef<WebSocket | null>(null);
  const webViewRef = useRef<WebView>(null);
  const chatScrollRef = useRef<ScrollView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  // ── LSTM WebSocket ──────────────────────────────────────────
  useEffect(() => {
    if (!cameraOn) return;
    const connect = () => {
      setLstmStatus("connecting");
      const ws = new WebSocket(LSTM_WS_URL);
      wsRef.current = ws;
      ws.onopen = () => setLstmStatus("ready");
      ws.onerror = () => setLstmStatus("error");
      ws.onclose = () => {
        setLstmStatus("disconnected");
        setTimeout(connect, 3000);
      };
      ws.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          if (d.gesture && d.confidence >= 0.75) {
            setLstmWord(d.gesture);
            setLstmConf(d.confidence);
          }
          if (d.landmarks?.hands?.[0]) {
            const pts = d.landmarks.hands[0].landmarks;
            setLandmarks(pts);
            webViewRef.current?.injectJavaScript(`
              window.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(${JSON.stringify(pts)})}));true;
            `);
          }
        } catch {}
      };
    };
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [cameraOn]);

  // ── 메시지 추가 ────────────────────────────────────────────
  const addMsg = (from: Msg["from"], text: string, emoji?: string) => {
    setMessages((p) => [...p, { id: Date.now(), from, text, emoji }]);
    setTimeout(
      () => chatScrollRef.current?.scrollToEnd({ animated: true }),
      100,
    );
  };

  // ── 수어 전송 ──────────────────────────────────────────────
  const sendSign = () => {
    const s = detectedSign || selectedSign;
    addMsg("sign", s.label, s.emoji);
  };

  // ── LSTM ───────────────────────────────────────────────────
  const acceptLstmWord = () => {
    if (!lstmWord) return;
    setLstmWords((p) => [...p, lstmWord]);
    setLstmWord("");
    setLstmConf(0);
    setLstmSentence("");
  };

  const generateSentence = async () => {
    if (!lstmWords.length) return;
    try {
      const res = await fetch("http://localhost:8080/api/subtitle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words: lstmWords, place: "personal" }),
      });
      const data = await res.json();
      setLstmSentence(data.sentence || lstmWords.join(" "));
    } catch {
      setLstmSentence(lstmWords.join(" "));
    }
  };

  const sendLstmMsg = () => {
    if (!lstmSentence) return;
    addMsg("sign", lstmSentence, "🧠");
    setLstmWords([]);
    setLstmWord("");
    setLstmSentence("");
  };

  // ── 음성 전송 ──────────────────────────────────────────────
  const sendVoice = () => {
    if (!voiceText.trim()) return;
    addMsg("voice", voiceText.trim());
    setVoiceText("");
  };

  const statusColor =
    lstmStatus === "ready"
      ? C.green
      : lstmStatus === "connecting"
        ? "#fbbf24"
        : C.sub;

  // ── 탭 버튼 ────────────────────────────────────────────────
  const PANELS = [
    { id: "voice", label: "🎤 음성" },
    { id: "chat", label: "💬 채팅" },
    { id: "sign", label: "🤟 수어" },
  ] as const;

  // ── 카메라 권한 체크 ───────────────────────────────────────
  const handleCameraToggle = async () => {
    if (!cameraOn) {
      if (!permission?.granted) {
        await requestPermission();
      }
      setCameraOn(true);
    } else {
      setCameraOn(false);
      setLandmarks(null);
      setDetectedSign(null);
    }
  };

  return (
    <View style={s.root}>
      {/* ── 헤더 ── */}
      <View style={s.header}>
        <View>
          <View style={s.livePill}>
            <View style={s.liveDot} />
            <Text style={s.livePillTxt}>LIVE SESSION</Text>
          </View>
          <Text style={s.headerTitle}>실시간 수어·음성 소통</Text>
        </View>
        <View style={s.headerStats}>
          <View style={s.statBox}>
            <Text style={s.statVal}>0.3s</Text>
            <Text style={s.statLbl}>응답</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statVal}>98%</Text>
            <Text style={s.statLbl}>정확도</Text>
          </View>
        </View>
      </View>

      {/* ── 탭 전환 ── */}
      <View style={s.tabBar}>
        {PANELS.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[s.tabBtn, activePanel === p.id && s.tabBtnOn]}
            onPress={() => setActivePanel(p.id)}
          >
            <Text style={[s.tabBtnTxt, activePanel === p.id && s.tabBtnTxtOn]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ══════════════════════════════════════
          음성 패널
      ══════════════════════════════════════ */}
      {activePanel === "voice" && (
        <ScrollView
          style={s.panel}
          contentContainerStyle={{ padding: 16, gap: 14 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.panelHeaderRow}>
            <View
              style={[
                s.panelAvatar,
                {
                  backgroundColor: "rgba(62,207,207,.12)",
                  borderColor: "rgba(62,207,207,.25)",
                },
              ]}
            >
              <Ionicons name="mic-outline" size={20} color={C.voice} />
            </View>
            <View>
              <Text style={s.panelName}>음성 사용자</Text>
              <Text style={s.panelRole}>음성 → 텍스트 전송</Text>
            </View>
          </View>

          <Text style={s.sectionLabel}>🎤 음성 입력</Text>
          <View style={s.voiceBox}>
            <TextInput
              style={s.textarea}
              placeholder="직접 입력하거나 음성을 텍스트로 변환하세요"
              placeholderTextColor="rgba(255,255,255,.2)"
              value={voiceText}
              onChangeText={setVoiceText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          <View style={s.btnRow}>
            <TouchableOpacity
              style={[
                s.btn,
                {
                  flex: 2,
                  backgroundColor: "rgba(62,207,207,.1)",
                  borderColor: "rgba(62,207,207,.3)",
                },
              ]}
              onPress={() =>
                Alert.alert("안내", "음성 인식은 추후 지원 예정입니다.")
              }
            >
              <Text style={[s.btnTxt, { color: C.voice }]}>🎤 녹음</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btn, { flex: 1, backgroundColor: C.voice }]}
              onPress={sendVoice}
              disabled={!voiceText.trim()}
            >
              <Text style={[s.btnTxt, { color: "#000", fontWeight: "700" }]}>
                전송 →
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[s.sectionLabel, { marginTop: 8 }]}>📥 수신된 수어</Text>
          {messages
            .filter((m) => m.from === "sign")
            .slice(-4)
            .map((m) => (
              <View key={m.id} style={s.receivedItem}>
                <Text style={{ fontSize: 22 }}>{m.emoji || "🤟"}</Text>
                <Text style={s.receivedTxt}>{m.text}</Text>
              </View>
            ))}
          {messages.filter((m) => m.from === "sign").length === 0 && (
            <Text style={s.emptyTxt}>수어 메시지가 여기 표시됩니다</Text>
          )}
        </ScrollView>
      )}

      {/* ══════════════════════════════════════
          채팅 패널
      ══════════════════════════════════════ */}
      {activePanel === "chat" && (
        <View style={[s.panel, { flex: 1 }]}>
          <View style={s.chatHeader}>
            <Text style={s.chatHeaderTxt}>⬡ 실시간 대화</Text>
          </View>
          <ScrollView
            ref={chatScrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 12, gap: 8 }}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((m) => (
              <View
                key={m.id}
                style={[
                  m.from === "system"
                    ? s.msgSys
                    : m.from === "voice"
                      ? s.msgVoice
                      : s.msgSign,
                ]}
              >
                {m.from === "system" ? (
                  <Text style={s.msgSysTxt}>{m.text}</Text>
                ) : (
                  <View
                    style={[
                      s.bubble,
                      m.from === "voice" ? s.bubbleVoice : s.bubbleSign,
                    ]}
                  >
                    {m.emoji && <Text style={{ fontSize: 16 }}>{m.emoji}</Text>}
                    <Text style={s.bubbleTxt}>{m.text}</Text>
                    <Text style={s.bubbleType}>
                      {m.from === "voice" ? "🎤" : "🤟"}
                    </Text>
                  </View>
                )}
                {m.from !== "system" && (
                  <Text style={s.msgFrom}>
                    {m.from === "voice" ? "음성" : "수어"}
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
          <View style={s.chatFooter}>
            <Text style={s.chatFooterTxt}>
              AI 실시간 번역 · MediaPipe Hands
            </Text>
          </View>
        </View>
      )}

      {/* ══════════════════════════════════════
          수어 패널
      ══════════════════════════════════════ */}
      {activePanel === "sign" && (
        <ScrollView
          style={s.panel}
          contentContainerStyle={{ padding: 16, gap: 14 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 패널 헤더 */}
          <View style={s.panelHeaderRow}>
            <View
              style={[
                s.panelAvatar,
                {
                  backgroundColor: "rgba(167,139,250,.12)",
                  borderColor: "rgba(167,139,250,.25)",
                },
              ]}
            >
              <Ionicons name="hand-left-outline" size={20} color={C.sign} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.panelName}>수어 사용자</Text>
              <Text style={s.panelRole}>수어 인식 → 텍스트 변환</Text>
            </View>
            <Text style={[s.lstmBadge, { color: statusColor }]}>
              {lstmStatus === "ready"
                ? "● LSTM 연결됨"
                : lstmStatus === "connecting"
                  ? "○ 연결 중"
                  : "○ 미연결"}
            </Text>
          </View>

          {/* 카메라 */}
          <Text style={s.sectionLabel}>📷 MediaPipe Hands</Text>
          <View style={s.cameraWrap}>
            {cameraOn ? (
              <>
                <ExpoCameraView
                  style={StyleSheet.absoluteFill}
                  facing={facing}
                />
                {/* 랜드마크 오버레이 */}
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                  <WebView
                    ref={webViewRef}
                    source={{ html: LANDMARK_HTML }}
                    style={{ flex: 1, backgroundColor: "transparent" }}
                    scrollEnabled={false}
                    javaScriptEnabled
                    originWhitelist={["*"]}
                  />
                </View>
                {/* LIVE 배지 */}
                <View style={s.liveBadgeCam}>
                  <View style={s.liveDot} />
                  <Text style={s.liveBadgeCamTxt}>LIVE</Text>
                </View>
                {/* 전환 버튼 */}
                <TouchableOpacity
                  style={s.flipBtn}
                  onPress={() =>
                    setFacing((f) => (f === "front" ? "back" : "front"))
                  }
                >
                  <Text style={{ fontSize: 18 }}>🔄</Text>
                </TouchableOpacity>
                {/* 감지 오버레이 */}
                {(detectedSign || lstmWord) && (
                  <View style={s.detectedOverlay}>
                    <Text style={s.detectedEmoji}>
                      {detectedSign?.emoji || "🧠"}
                    </Text>
                    <Text style={s.detectedLabel}>
                      {detectedSign?.label || lstmWord}
                    </Text>
                    {detectedSign && (
                      <View style={s.detectedMeaning}>
                        <Text style={s.detectedMeaningTxt}>
                          {detectedSign.meaning}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
                {/* LSTM 인식 자막 */}
                {lstmWord && (
                  <View style={s.subtitleBar}>
                    <Text style={s.subtitleWord}>{lstmWord}</Text>
                    <Text style={s.subtitleConf}>
                      {Math.round(lstmConf * 100)}%
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View style={s.cameraPlaceholder}>
                <Ionicons
                  name="camera-outline"
                  size={48}
                  color="rgba(255,255,255,.2)"
                />
                <Text style={s.cameraPlaceholderTxt}>
                  카메라 시작 버튼을 누르세요
                </Text>
              </View>
            )}
          </View>

          <View style={s.btnRow}>
            <TouchableOpacity
              style={[
                s.btn,
                {
                  flex: 2,
                  backgroundColor: cameraOn
                    ? "rgba(239,68,68,.1)"
                    : "rgba(167,139,250,.1)",
                  borderColor: cameraOn
                    ? "rgba(239,68,68,.3)"
                    : "rgba(167,139,250,.3)",
                },
              ]}
              onPress={handleCameraToggle}
            >
              <Text
                style={[s.btnTxt, { color: cameraOn ? "#f87171" : C.sign }]}
              >
                {cameraOn ? "⏹ 종료" : "📷 카메라 시작"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btn, { flex: 1, backgroundColor: C.sign }]}
              onPress={sendSign}
            >
              <Text style={[s.btnTxt, { color: "#fff", fontWeight: "700" }]}>
                전송 →
              </Text>
            </TouchableOpacity>
          </View>

          {/* LSTM 단어 수집 */}
          {cameraOn && (
            <View style={s.lstmArea}>
              {lstmWord ? (
                <View style={s.lstmCurrentRow}>
                  <View>
                    <Text style={s.lstmCurrentLabel}>인식된 수어</Text>
                    <Text style={s.lstmCurrentWord}>{lstmWord}</Text>
                    <Text style={s.lstmCurrentConf}>
                      {Math.round(lstmConf * 100)}%
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={s.acceptBtn}
                    onPress={acceptLstmWord}
                  >
                    <Text style={s.acceptBtnTxt}>✅ 맞음</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={s.lstmHint}>
                  🤟 손 동작을 하면 단어가 인식됩니다
                </Text>
              )}
              {lstmWords.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View
                    style={{ flexDirection: "row", gap: 6, paddingVertical: 2 }}
                  >
                    {lstmWords.map((w, i) => (
                      <View key={i} style={s.wordChip}>
                        <Text style={s.wordChipTxt}>{w}</Text>
                        <TouchableOpacity
                          onPress={() =>
                            setLstmWords((p) => p.filter((_, j) => j !== i))
                          }
                        >
                          <Text style={{ fontSize: 10, color: "#9ca3af" }}>
                            ✕
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              )}
              {lstmWords.length > 0 && !lstmSentence && (
                <TouchableOpacity style={s.genBtn} onPress={generateSentence}>
                  <Text style={s.genBtnTxt}>✨ 문장 생성</Text>
                </TouchableOpacity>
              )}
              {!!lstmSentence && (
                <View style={s.sentenceBox}>
                  <Text style={s.sentenceLabel}>💬 생성된 문장</Text>
                  <Text style={s.sentenceTxt}>{lstmSentence}</Text>
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                    <TouchableOpacity
                      style={s.retryBtn}
                      onPress={() => setLstmSentence("")}
                    >
                      <Text style={s.retryBtnTxt}>↩ 다시</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.sendBtn} onPress={sendLstmMsg}>
                      <Text style={s.sendBtnTxt}>전송 →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* 빠른 수어 선택 */}
          <Text style={[s.sectionLabel, { marginTop: 8 }]}>
            ⚡ 빠른 수어 선택
          </Text>
          <View style={s.signGrid}>
            {SIGN_MAP.map((sign) => (
              <TouchableOpacity
                key={sign.id}
                style={[
                  s.signChip,
                  selectedSign.id === sign.id && s.signChipSel,
                ]}
                onPress={() => {
                  setSelectedSign(sign);
                  setDetectedSign(sign);
                }}
              >
                <Text style={{ fontSize: 18 }}>{sign.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.signChipLabel}>{sign.label}</Text>
                  <Text style={s.signChipMeaning}>{sign.meaning}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* 수신된 음성 */}
          <Text style={[s.sectionLabel, { marginTop: 8 }]}>📢 수신된 음성</Text>
          <View style={s.voiceReceived}>
            {messages.filter((m) => m.from === "voice").length > 0 ? (
              <Text style={s.voiceReceivedTxt}>
                {messages.filter((m) => m.from === "voice").slice(-1)[0].text}
              </Text>
            ) : (
              <Text style={s.emptyTxt}>음성 메시지가 텍스트로 표시됩니다</Text>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ── 하단 푸터 ── */}
      <View style={s.footer}>
        <Text style={s.footerTxt}>
          🎤 음성 사용자 ⟷ 🤟 수어 사용자 · AI 실시간 번역
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // 헤더
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: "rgba(8,10,18,0.6)",
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(74,222,128,.12)",
    borderWidth: 1,
    borderColor: "rgba(74,222,128,.25)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#4ade80" },
  livePillTxt: {
    color: "#4ade80",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  headerTitle: { fontSize: 16, fontWeight: "800", color: C.text },
  headerStats: { flexDirection: "row", gap: 8 },
  statBox: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,.04)",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statVal: { fontSize: 16, fontWeight: "800", color: C.text },
  statLbl: { fontSize: 9, color: C.sub },

  // 탭
  tabBar: {
    flexDirection: "row",
    backgroundColor: "rgba(19,22,29,0.9)",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabBtnOn: { borderBottomWidth: 2, borderBottomColor: C.sign },
  tabBtnTxt: { fontSize: 13, fontWeight: "600", color: C.sub },
  tabBtnTxtOn: { color: C.text, fontWeight: "700" },

  // 패널 공통
  panel: { flex: 1, backgroundColor: "rgba(19,22,29,0.85)" },
  panelHeaderRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  panelAvatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  panelName: { fontSize: 13, fontWeight: "700", color: C.text },
  panelRole: { fontSize: 11, color: C.sub, marginTop: 2 },
  lstmBadge: { fontSize: 10, fontWeight: "700" },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: C.sub,
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  // 음성 패널
  voiceBox: {
    backgroundColor: "rgba(19,22,29,0.8)",
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    padding: 12,
  },
  textarea: { color: C.text, fontSize: 13, lineHeight: 22, minHeight: 80 },
  btnRow: { flexDirection: "row", gap: 8 },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
  },
  btnTxt: { fontSize: 13, fontWeight: "600" },
  receivedItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(19,22,29,0.8)",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 10,
  },
  receivedTxt: { fontSize: 13, fontWeight: "600", color: C.text, flex: 1 },
  emptyTxt: {
    fontSize: 12,
    color: C.sub,
    textAlign: "center",
    paddingVertical: 12,
  },

  // 채팅
  chatHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: "rgba(0,0,0,.1)",
  },
  chatHeaderTxt: { fontSize: 13, fontWeight: "700", color: C.text },
  chatFooter: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
    alignItems: "center",
  },
  chatFooterTxt: { fontSize: 10, color: C.sub },
  msgSys: { alignItems: "center" },
  msgSysTxt: {
    backgroundColor: "rgba(255,255,255,.04)",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    fontSize: 11,
    color: C.sub,
  },
  msgVoice: { alignItems: "flex-start" },
  msgSign: { alignItems: "flex-end" },
  bubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 10,
    borderRadius: 14,
    maxWidth: "80%",
  },
  bubbleVoice: {
    backgroundColor: "rgba(62,207,207,.12)",
    borderWidth: 1,
    borderColor: "rgba(62,207,207,.2)",
    borderBottomLeftRadius: 4,
  },
  bubbleSign: {
    backgroundColor: "rgba(167,139,250,.12)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,.2)",
    borderBottomRightRadius: 4,
  },
  bubbleTxt: { fontSize: 13, color: C.text, flex: 1 },
  bubbleType: { fontSize: 13, opacity: 0.6 },
  msgFrom: { fontSize: 10, color: C.sub, marginTop: 3, paddingHorizontal: 4 },

  // 카메라
  cameraWrap: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
    borderWidth: 1.5,
    borderColor: C.border,
    maxHeight: 220,
  },
  cameraPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  cameraPlaceholderTxt: { fontSize: 12, color: C.sub },
  liveBadgeCam: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(10,12,20,.75)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  liveBadgeCamTxt: { fontSize: 10, fontWeight: "600", color: C.text },
  flipBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  detectedOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingBottom: 12,
    backgroundColor: "rgba(6,8,14,0.7)",
  },
  detectedEmoji: { fontSize: 30 },
  detectedLabel: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 1,
  },
  detectedMeaning: {
    backgroundColor: "rgba(167,139,250,.15)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,.3)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginTop: 3,
  },
  detectedMeaningTxt: { fontSize: 11, color: C.sign },
  subtitleBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,.7)",
    paddingVertical: 6,
  },
  subtitleWord: { fontSize: 16, fontWeight: "900", color: "#fff" },
  subtitleConf: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4ade80",
    backgroundColor: "rgba(74,222,128,.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  // LSTM
  lstmArea: {
    backgroundColor: "#f5f3ff",
    borderWidth: 1.5,
    borderColor: "#c4b5fd",
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  lstmCurrentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1.5,
    borderColor: "#ddd6fe",
  },
  lstmCurrentLabel: { fontSize: 11, color: "#888", marginBottom: 2 },
  lstmCurrentWord: { fontSize: 20, fontWeight: "900", color: "#5b45e0" },
  lstmCurrentConf: {
    fontSize: 11,
    color: "#10b981",
    fontWeight: "700",
    marginTop: 2,
  },
  lstmHint: {
    fontSize: 12,
    color: "#aaa",
    textAlign: "center",
    paddingVertical: 8,
  },
  acceptBtn: {
    backgroundColor: "#5b45e0",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  acceptBtnTxt: { fontSize: 13, fontWeight: "800", color: "#fff" },
  wordChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(91,69,224,.08)",
    borderWidth: 1.5,
    borderColor: "rgba(91,69,224,.2)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  wordChipTxt: { fontSize: 12, fontWeight: "700", color: "#5b45e0" },
  genBtn: {
    backgroundColor: "#5b45e0",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  genBtnTxt: { fontSize: 13, fontWeight: "800", color: "#fff" },
  sentenceBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1.5,
    borderColor: "#ddd6fe",
  },
  sentenceLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#5b45e0",
    marginBottom: 4,
  },
  sentenceTxt: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
    lineHeight: 22,
  },
  retryBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  retryBtnTxt: { fontSize: 12, fontWeight: "700", color: "#888" },
  sendBtn: {
    flex: 2,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#5b45e0",
    alignItems: "center",
  },
  sendBtnTxt: { fontSize: 12, fontWeight: "800", color: "#fff" },

  // 수어 그리드
  signGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  signChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "47%",
    backgroundColor: "rgba(19,22,29,0.8)",
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    padding: 10,
  },
  signChipSel: {
    borderColor: C.sign,
    backgroundColor: "rgba(167,139,250,.14)",
  },
  signChipLabel: { fontSize: 12, fontWeight: "600", color: C.text },
  signChipMeaning: { fontSize: 10, color: C.sub },

  // 수신 음성
  voiceReceived: {
    backgroundColor: "rgba(19,22,29,0.8)",
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    padding: 14,
    minHeight: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceReceivedTxt: {
    fontSize: 14,
    fontWeight: "600",
    color: C.text,
    textAlign: "center",
    lineHeight: 22,
  },

  // 푸터
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: "rgba(8,10,18,.6)",
    alignItems: "center",
  },
  footerTxt: { fontSize: 11, color: C.sub },
});
