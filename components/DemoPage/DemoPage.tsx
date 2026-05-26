// ══════════════════════════════════════════════════════════════
//  DemoPage.tsx  ←  SignBridge Core Demo Stage (React Native + TS)
// ══════════════════════════════════════════════════════════════
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Line } from "react-native-svg";

const { width: SW } = Dimensions.get("window");

/* ─────────────────────────────────────────
   타입 및 상수 정의 (Data Tokens)
───────────────────────────────────────── */
interface SignItem {
  id: string;
  label: string;
  emoji: string;
  desc: string;
  handShape: string;
  meaning: string;
}

interface VoiceItem {
  id: string;
  text: string;
  sender: "user" | "bot";
}

interface DemoPageProps {
  onClose?: () => void;
}

const SIGN_MAP: SignItem[] = [
  {
    id: "hello",
    label: "안녕하세요",
    emoji: "🤟",
    desc: "ILY sign",
    handShape: "☝️✌️",
    meaning: "반가움 인사",
  },
  {
    id: "thanks",
    label: "감사합니다",
    emoji: "🙏",
    desc: "Both palms up",
    handShape: "🙏",
    meaning: "고마움 표현",
  },
  {
    id: "yes",
    label: "네, 맞아요",
    emoji: "👍",
    desc: "Thumb up",
    handShape: "👍",
    meaning: "긍정 동의",
  },
  {
    id: "wait",
    label: "잠깐만요",
    emoji: "✋",
    desc: "Open palm stop",
    handShape: "✋",
    meaning: "멈춤 요청",
  },
  {
    id: "help",
    label: "도움이 필요해요",
    emoji: "🤲",
    desc: "Cupped hands",
    handShape: "🤲",
    meaning: "도움 요청",
  },
  {
    id: "ok",
    label: "이해했습니다",
    emoji: "👌",
    desc: "OK gesture",
    handShape: "👌",
    meaning: "이해 완료",
  },
];

const VOICE_SEQUENCE: VoiceItem[] = [
  {
    id: "v1",
    text: "안녕하세요! AI 수어 통역 프레임워크 실시간 모바일 인앱 데모입니다.",
    sender: "bot",
  },
  {
    id: "v2",
    text: "카메라 캡처 영역의 관절을 인식하여 하단에 번역 타임라인을 생성합니다.",
    sender: "bot",
  },
  {
    id: "v3",
    text: "수어 피드와 음성 신호 간의 교차 변환이 부드럽게 고속 중계됩니다.",
    sender: "bot",
  },
  {
    id: "v4",
    text: "네, 정밀한 손가락 포인트 트래킹 데이터가 화면에 즉시 반사되고 있네요.",
    sender: "user",
  },
];

export default function DemoPage({ onClose }: DemoPageProps) {
  // ── 핵심 엔진 상태 제어 ──
  const [streamActive, setStreamActive] = useState<boolean>(true);
  const [landmarksVisible, setLandmarksVisible] = useState<boolean>(true);

  const [signTimeline, setSignTimeline] = useState<SignItem[]>([SIGN_MAP[0]]);
  const [activeSign, setActiveSign] = useState<SignItem | null>(SIGN_MAP[0]);

  const [voiceList, setVoiceList] = useState<VoiceItem[]>([VOICE_SEQUENCE[0]]);
  const [voiceIndex, setVoiceIndex] = useState<number>(1);
  const [isVoiceTyping, setIsVoiceTyping] = useState<boolean>(false);

  const [fps, setFps] = useState<number>(60);
  const [latency, setLatency] = useState<number>(32);

  const signScrollRef = useRef<ScrollView | null>(null);
  const voiceScrollRef = useRef<ScrollView | null>(null);

  // ── 지터 메트릭 변동 시뮬레이터 ──
  useEffect(() => {
    if (!streamActive) return;
    const timer = setInterval(() => {
      setFps(Math.floor(58 + Math.random() * 4));
      setLatency(Math.floor(28 + Math.random() * 8));
    }, 1200);
    return () => clearInterval(timer);
  }, [streamActive]);

  // ── 실시간 가상 수어 분류기 패치 ──
  useEffect(() => {
    if (!streamActive) return;
    const interval = setInterval(() => {
      const pick = SIGN_MAP[Math.floor(Math.random() * SIGN_MAP.length)];
      setActiveSign(pick);
      setSignTimeline((prev) => [...prev, pick].slice(-15));
    }, 4500);
    return () => clearInterval(interval);
  }, [streamActive]);

  // ── 수신 데이터 스트리밍 피더 함수 ──
  const feedNextVoice = useCallback(() => {
    if (voiceIndex >= VOICE_SEQUENCE.length || isVoiceTyping) return;
    setIsVoiceTyping(true);

    setTimeout(() => {
      setVoiceList((prev) => [...prev, VOICE_SEQUENCE[voiceIndex]]);
      setVoiceIndex((prev) => prev + 1);
      setIsVoiceTyping(false);
    }, 1500);
  }, [voiceIndex, isVoiceTyping]);

  useEffect(() => {
    if (!streamActive) return;
    const interval = setInterval(() => {
      feedNextVoice();
    }, 8000);
    return () => clearInterval(interval);
  }, [streamActive, feedNextVoice]);

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0b0d11" />

      {/* ── 🛰️ 상단 앱 네비게이션 헤더 ── */}
      <View style={s.navbar}>
        <View>
          <View style={s.liveBadge}>
            <Text style={s.liveBadgeText}>LIVE SHIFT</Text>
          </View>
          <Text style={s.navTitle}>SignBridge Mobile Dev</Text>
        </View>
        {onClose && (
          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <Text style={s.closeBtnText}>✕ 닫기</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={s.scrollLayout} showsVerticalScrollIndicator={false}>
        {/* ── 📹 1. 비전 캡처 엔진 카메라 스트림 영역 ── */}
        <View style={s.panel}>
          <View style={s.panelHeader}>
            <View style={s.row}>
              <View
                style={[
                  s.pulseDot,
                  { backgroundColor: streamActive ? "#4ade80" : "#ef4444" },
                ]}
              />
              <Text style={s.panelTitle}>Vision Capture Stream</Text>
            </View>
            <View style={s.rowGap}>
              <TouchableOpacity
                style={[s.toggleBtn, landmarksVisible && s.toggleBtnActive]}
                onPress={() => setLandmarksVisible(!landmarksVisible)}
                disabled={!streamActive}
              >
                <Text
                  style={[
                    s.toggleBtnTxt,
                    landmarksVisible && s.toggleBtnTxtActive,
                  ]}
                >
                  Mesh
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.toggleBtn, streamActive && s.toggleBtnActive]}
                onPress={() => setStreamActive(!streamActive)}
              >
                <Text
                  style={[s.toggleBtnTxt, streamActive && s.toggleBtnTxtActive]}
                >
                  {streamActive ? "Pause" : "Run"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 가상 카메라 모니터 스크린 */}
          <View style={s.monitorFrame}>
            {streamActive ? (
              <ImageBackground
                source={{
                  uri: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80",
                }}
                style={s.monitorBg}
                resizeMode="cover"
              >
                <View style={s.monitorOverlay} />

                {/* 🖐️ 가상 랜드마크 포인트 오버레이 (Svg 연산 엔진) */}
                {landmarksVisible && (
                  <View style={StyleSheet.absoluteFill}>
                    <Svg style={StyleSheet.absoluteFill}>
                      <Line
                        x1={SW * 0.45}
                        y1={150}
                        x2={SW * 0.35}
                        y2={120}
                        stroke="#a78bfa"
                        strokeWidth="2"
                      />
                      <Line
                        x1={SW * 0.35}
                        y1={120}
                        x2={SW * 0.3}
                        y2={90}
                        stroke="#a78bfa"
                        strokeWidth="2"
                      />
                      <Line
                        x1={SW * 0.45}
                        y1={150}
                        x2={SW * 0.43}
                        y2={100}
                        stroke="#a78bfa"
                        strokeWidth="2"
                      />
                      <Line
                        x1={SW * 0.43}
                        y1={100}
                        x2={SW * 0.42}
                        y2={60}
                        stroke="#a78bfa"
                        strokeWidth="2"
                      />
                      <Line
                        x1={SW * 0.45}
                        y1={150}
                        x2={SW * 0.52}
                        y2={105}
                        stroke="#a78bfa"
                        strokeWidth="2"
                      />
                      <Line
                        x1={SW * 0.52}
                        y1={105}
                        x2={SW * 0.55}
                        y2={70}
                        stroke="#a78bfa"
                        strokeWidth="2"
                      />
                    </Svg>
                    {/* 가상 마디 조인트 좌표 */}
                    <View
                      style={[
                        s.meshNode,
                        {
                          top: 150,
                          left: SW * 0.45,
                          backgroundColor: "#4ade80",
                        },
                      ]}
                    />
                    <View style={[s.meshNode, { top: 120, left: SW * 0.35 }]} />
                    <View style={[s.meshNode, { top: 90, left: SW * 0.3 }]} />
                    <View style={[s.meshNode, { top: 100, left: SW * 0.43 }]} />
                    <View style={[s.meshNode, { top: 60, left: SW * 0.42 }]} />
                    <View style={[s.meshNode, { top: 105, left: SW * 0.52 }]} />
                    <View style={[s.meshNode, { top: 70, left: SW * 0.55 }]} />
                  </View>
                )}

                {/* 하단 분류 결과 스낵 정보창 */}
                {activeSign && (
                  <View style={s.visionToast}>
                    <Text style={s.toastBadge}>CLASSIFIED</Text>
                    <Text style={s.toastText} numberOfLines={1}>
                      {activeSign.label} ({activeSign.desc})
                    </Text>
                  </View>
                )}
              </ImageBackground>
            ) : (
              <View style={s.monitorFallback}>
                <Text style={s.fallbackTxt}>Engine Connection Idle Mode</Text>
              </View>
            )}
          </View>

          {/* 📊 하드웨어 계측 위젯 대시보드 */}
          <View style={s.metricsRow}>
            <View style={s.metricBox}>
              <Text style={s.metricLbl}>FPS</Text>
              <Text
                style={[
                  s.metricVal,
                  { color: streamActive ? "#4ade80" : "#7a8099" },
                ]}
              >
                {streamActive ? `${fps}f` : "0"}
              </Text>
            </View>
            <View style={s.metricBox}>
              <Text style={s.metricLbl}>LATENCY</Text>
              <Text style={[s.metricVal, { color: "#3ecfcf" }]}>
                {streamActive ? `${latency}ms` : "-"}
              </Text>
            </View>
            <View style={s.metricBox}>
              <Text style={s.metricLbl}>JOINTS</Text>
              <Text style={s.metricVal}>21 Pts</Text>
            </View>
            <View style={s.metricBox}>
              <Text style={s.metricLbl}>ACC</Text>
              <Text style={[s.metricVal, { color: "#fbbf24" }]}>98.2%</Text>
            </View>
          </View>
        </View>

        {/* ── 🤟 2. 실시간 수어 번역 타임라인 로그 ── */}
        <View style={s.panel}>
          <View style={s.panelHeader}>
            <Text style={s.panelTitle}>Sign Translation Log</Text>
            <Text style={s.counterTxt}>Stack: {signTimeline.length}</Text>
          </View>

          <ScrollView
            ref={signScrollRef}
            style={s.logContainer}
            nestedScrollEnabled
            onContentSizeChange={() =>
              signScrollRef.current?.scrollToEnd({ animated: true })
            }
          >
            {signTimeline.map((item, idx) => (
              <View key={`${item.id}-${idx}`} style={s.logRow}>
                <Text style={s.logAvatar}>{item.emoji}</Text>
                <View style={s.logBody}>
                  <View style={s.rowJustify}>
                    <Text style={s.logRowTitle}>{item.label}</Text>
                    <Text style={s.logTimeBadge}>0.3s Match</Text>
                  </View>
                  <Text style={s.logRowDesc} numberOfLines={1}>
                    {item.meaning} · Matrix: {item.handShape}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ── 🗣️ 3. 오디오 및 텍스트 교차 피드백 패널 ── */}
        <View style={s.panel}>
          <View style={s.panelHeader}>
            <Text style={s.panelTitle}>Voice Translation Feed</Text>
            <TouchableOpacity
              style={s.simulateBtn}
              onPress={feedNextVoice}
              disabled={
                !streamActive ||
                voiceIndex >= VOICE_SEQUENCE.length ||
                isVoiceTyping
              }
            >
              <Text style={s.simulateBtnTxt}>Simulate</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={voiceScrollRef}
            style={s.voiceContainer}
            nestedScrollEnabled
            onContentSizeChange={() =>
              voiceScrollRef.current?.scrollToEnd({ animated: true })
            }
          >
            {voiceList.map((v) => (
              <View
                key={v.id}
                style={[
                  s.bubble,
                  v.sender === "user" ? s.bubbleUser : s.bubbleBot,
                ]}
              >
                <Text
                  style={[
                    s.bubbleTxt,
                    v.sender === "user" ? s.bubbleTxtUser : s.bubbleTxtBot,
                  ]}
                >
                  {v.text}
                </Text>
                <Text style={s.bubbleSender}>
                  {v.sender === "user"
                    ? "✓ STT 국문 자막"
                    : "⊙ 원격 오디오 신호"}
                </Text>
              </View>
            ))}

            {isVoiceTyping && (
              <View style={s.voiceLoadingRow}>
                <Text style={s.voiceLoadingTxt}>
                  음성 시그널 데이터 스트리밍 연산 중...
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─────────────────────────────────────────
   🎨 스타일 시트 아키텍처 (Design Sheet)
───────────────────────────────────────── */
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0d11" },
  navbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  liveBadge: {
    backgroundColor: "rgba(167,139,250,0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 2,
  },
  liveBadgeText: {
    color: "#a78bfa",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  navTitle: { color: "#f0f2f7", fontSize: 16, fontWeight: "800" },
  closeBtn: {
    backgroundColor: "#1a1e28",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  closeBtnText: { color: "#7a8099", fontSize: 12, fontWeight: "700" },

  scrollLayout: { flex: 1, padding: 12 },
  row: { flexDirection: "row", alignItems: "center" },
  rowGap: { flexDirection: "row", gap: 6 },
  rowJustify: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  panel: {
    backgroundColor: "rgba(19,22,29,0.85)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 14,
    marginBottom: 12,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  panelTitle: { color: "#f0f2f7", fontSize: 14, fontWeight: "700" },
  pulseDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },

  toggleBtn: {
    backgroundColor: "#1a1e28",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  toggleBtnActive: { backgroundColor: "#7c6fff" },
  toggleBtnTxt: { color: "#7a8099", fontSize: 11, fontWeight: "600" },
  toggleBtnTxtActive: { color: "#fff" },

  monitorFrame: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  monitorBg: { flex: 1, justifyContent: "flex-end" },
  monitorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  meshNode: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3ecfcf",
    marginLeft: -3,
    marginTop: -3,
  },

  visionToast: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(11,13,17,0.85)",
    margin: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  toastBadge: {
    backgroundColor: "#fbbf24",
    color: "#000",
    fontSize: 9,
    fontWeight: "900",
    paddingHorizontal: 4,
    borderRadius: 3,
    marginRight: 8,
  },
  toastText: { color: "#f0f2f7", fontSize: 12, fontWeight: "600", flex: 1 },
  monitorFallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  fallbackTxt: { color: "#444859", fontSize: 13 },

  metricsRow: { flexDirection: "row", marginTop: 10, gap: 6 },
  metricBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  metricLbl: {
    color: "#7a8099",
    fontSize: 9,
    fontWeight: "600",
    marginBottom: 2,
  },
  metricVal: { color: "#f0f2f7", fontSize: 13, fontWeight: "800" },

  counterTxt: { color: "#7a8099", fontSize: 11 },
  logContainer: { maxHeight: 150 },
  logRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
    alignItems: "center",
  },
  logAvatar: { fontSize: 22, marginRight: 10 },
  logBody: { flex: 1 },
  logRowTitle: { color: "#f0f2f7", fontSize: 13, fontWeight: "700" },
  logRowDesc: { color: "#7a8099", fontSize: 11, marginTop: 1 },
  logTimeBadge: { color: "#a78bfa", fontSize: 10, fontWeight: "600" },

  simulateBtn: {
    backgroundColor: "rgba(62,207,207,0.1)",
    borderWidth: 1,
    borderColor: "rgba(62,207,207,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  simulateBtnTxt: { color: "#3ecfcf", fontSize: 11, fontWeight: "700" },
  voiceContainer: { maxHeight: 160 },
  bubble: { padding: 10, borderRadius: 12, marginBottom: 8, maxWidth: "85%" },
  bubbleBot: { backgroundColor: "#1a1e28", alignSelf: "flex-start" },
  bubbleUser: { backgroundColor: "#7c6fff", alignSelf: "flex-end" },
  bubbleTxt: { fontSize: 13, lineHeight: 18 },
  bubbleTxtBot: { color: "#f0f2f7" },
  bubbleTxtUser: { color: "#fff" },
  bubbleSender: {
    fontSize: 9,
    color: "#7a8099",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  voiceLoadingRow: { paddingVertical: 6, alignItems: "center" },
  voiceLoadingTxt: { color: "#7a8099", fontSize: 11 },
});
