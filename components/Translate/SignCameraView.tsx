// ══════════════════════════════════════════════════════════════
//  components/Translate/SignCameraView.tsx
//  웹 번역기처럼:
//  - 카메라 위에 MediaPipe 손/팔 랜드마크 오버레이
//  - 인식된 수어 자막 표시
//  - 수어 선택 버튼 제거
// ══════════════════════════════════════════════════════════════
import {
  CameraType,
  CameraView as ExpoCameraView,
  useCameraPermissions,
} from "expo-camera";
import React, { useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

const C = {
  accent: "#5b5ef4",
  sub: "#64748b",
  border: "#e4e8f2",
  err: "#ef4444",
  text: "#0f0f1a",
  green: "#10b981",
};

// ─── REC 점 ──────────────────────────────────────────────────
function RecDot() {
  const anim = useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 0.15,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);
  return <Animated.View style={[st.recDot, { opacity: anim }]} />;
}

// ─── MediaPipe 랜드마크 WebView HTML ─────────────────────────
const LANDMARK_HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:transparent; overflow:hidden; }
  canvas { position:absolute; top:0; left:0; width:100%; height:100%; }
</style>
</head>
<body>
<canvas id="cv"></canvas>
<script>
const cv   = document.getElementById('cv');
const ctx  = cv.getContext('2d');
let landmarks = null;

function resize() {
  cv.width  = window.innerWidth;
  cv.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// 손 연결선
const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17],
];

// 포즈(팔) 연결선
const POSE_CONNECTIONS = [
  [11,12],[11,13],[13,15],[12,14],[14,16],
  [11,23],[12,24],[23,24],
];

function drawLandmarks(data) {
  ctx.clearRect(0, 0, cv.width, cv.height);
  if (!data) return;

  const W = cv.width;
  const H = cv.height;

  // ── 손 랜드마크 ──────────────────────────────────────────
  if (data.hands) {
    data.hands.forEach((hand) => {
      const pts = hand.landmarks;
      // 연결선
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth   = 2;
      HAND_CONNECTIONS.forEach(([a,b]) => {
        if (!pts[a] || !pts[b]) return;
        ctx.beginPath();
        ctx.moveTo(pts[a][0] * W, pts[a][1] * H);
        ctx.lineTo(pts[b][0] * W, pts[b][1] * H);
        ctx.stroke();
      });
      // 관절 점
      pts.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p[0]*W, p[1]*H, i===0?5:3, 0, Math.PI*2);
        ctx.fillStyle = i===0 ? '#ff6b35' : '#00ff88';
        ctx.fill();
      });
    });
  }

  // ── 포즈(팔) 랜드마크 ────────────────────────────────────
  if (data.pose) {
    const pts = data.pose;
    ctx.strokeStyle = '#7c6fff';
    ctx.lineWidth   = 2.5;
    POSE_CONNECTIONS.forEach(([a,b]) => {
      if (!pts[a] || !pts[b]) return;
      if (pts[a][3] < 0.5 || pts[b][3] < 0.5) return; // visibility
      ctx.beginPath();
      ctx.moveTo(pts[a][0]*W, pts[a][1]*H);
      ctx.lineTo(pts[b][0]*W, pts[b][1]*H);
      ctx.stroke();
    });
    pts.forEach((p, i) => {
      if (p[3] < 0.5) return;
      ctx.beginPath();
      ctx.arc(p[0]*W, p[1]*H, 4, 0, Math.PI*2);
      ctx.fillStyle = '#7c6fff';
      ctx.fill();
    });
  }
}

// React Native → WebView 메시지
document.addEventListener('message', (e) => {
  try { landmarks = JSON.parse(e.data); drawLandmarks(landmarks); } catch {}
});
window.addEventListener('message', (e) => {
  try { landmarks = JSON.parse(e.data); drawLandmarks(landmarks); } catch {}
});
</script>
</body>
</html>`;

// ─── 타입 ─────────────────────────────────────────────────────
export interface SignButton {
  emoji: string;
  name: string;
  meaning: string;
  color: string;
}

interface CameraViewProps {
  isActive: boolean;
  isRecording: boolean;
  recSec: number;
  currentWord: string; // LSTM 인식 단어
  currentConf: number; // LSTM 신뢰도
  lstmStatus: "disconnected" | "connecting" | "ready" | "error";
  onStart: () => void;
  onStop: () => void;
  // 랜드마크 데이터 (Python 서버에서 받은 것)
  landmarks?: { hands?: any[]; pose?: any[] } | null;
}

function fmtTime(sec: number) {
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}

// ══════════════════════════════════════════════════════════════
export default function SignCameraView({
  isActive,
  isRecording,
  recSec,
  currentWord,
  currentConf,
  lstmStatus,
  onStart,
  onStop,
  landmarks,
}: CameraViewProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("front");
  const webViewRef = useRef<WebView>(null);

  // 랜드마크가 바뀌면 WebView에 전송
  React.useEffect(() => {
    if (!landmarks) return;
    webViewRef.current?.injectJavaScript(`
      window.dispatchEvent(new MessageEvent('message', {
        data: JSON.stringify(${JSON.stringify(landmarks)})
      })); true;
    `);
  }, [landmarks]);

  const statusColor =
    lstmStatus === "ready"
      ? C.green
      : lstmStatus === "connecting"
        ? "#f59e0b"
        : "#94a3b8";

  if (!permission)
    return (
      <View style={st.permBox}>
        <Text style={st.permTxt}>카메라 권한 확인 중...</Text>
      </View>
    );

  if (!permission.granted)
    return (
      <View style={st.permBox}>
        <Text style={st.permEmoji}>📷</Text>
        <Text style={st.permTxt}>
          수어 인식을 위해 카메라 접근이 필요합니다
        </Text>
        <TouchableOpacity
          style={st.permBtn}
          onPress={requestPermission}
          activeOpacity={0.85}
        >
          <Text style={st.permBtnTxt}>카메라 권한 허용</Text>
        </TouchableOpacity>
      </View>
    );

  return (
    <View style={st.wrapper}>
      {/* ── Start / Stop ── */}
      <View style={st.camRow}>
        <TouchableOpacity
          style={[st.btnStart, isActive && st.btnDisabled]}
          onPress={onStart}
          disabled={isActive}
          activeOpacity={0.85}
        >
          <Text style={st.btnTxt}>▶ Start</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[st.btnStop, !isActive && st.btnDisabled]}
          onPress={onStop}
          disabled={!isActive}
          activeOpacity={0.85}
        >
          <Text style={st.btnTxt}>⏹ Stop</Text>
        </TouchableOpacity>
      </View>

      {/* ── 카메라 + 랜드마크 오버레이 ── */}
      <View style={st.vidBox}>
        {isActive ? (
          <>
            {/* 카메라 */}
            <ExpoCameraView style={st.camera} facing={facing} />

            {/* MediaPipe 랜드마크 오버레이 */}
            <View style={st.landmarkOverlay} pointerEvents="none">
              <WebView
                ref={webViewRef}
                source={{ html: LANDMARK_HTML }}
                style={{ flex: 1, backgroundColor: "transparent" }}
                scrollEnabled={false}
                bounces={false}
                javaScriptEnabled
                originWhitelist={["*"]}
              />
            </View>

            {/* REC 배지 */}
            {isRecording && (
              <View style={st.recBadge}>
                <RecDot />
                <Text style={st.recBadgeTxt}>REC {fmtTime(recSec)}</Text>
              </View>
            )}

            {/* 전면/후면 전환 */}
            <TouchableOpacity
              style={st.flipBtn}
              onPress={() =>
                setFacing((f) => (f === "front" ? "back" : "front"))
              }
              activeOpacity={0.8}
            >
              <Text style={st.flipBtnTxt}>🔄</Text>
            </TouchableOpacity>

            {/* LSTM 상태 배지 */}
            <View
              style={[st.lstmBadge, { backgroundColor: statusColor + "cc" }]}
            >
              <Text style={st.lstmBadgeTxt}>
                {lstmStatus === "ready"
                  ? "🧠 LSTM"
                  : lstmStatus === "connecting"
                    ? "○ 연결 중"
                    : "○ 미연결"}
              </Text>
            </View>

            {/* 자막 바 — 인식된 단어 표시 */}
            {currentWord ? (
              <View style={st.subtitleBar}>
                <View style={st.subtitleContent}>
                  <Text style={st.subtitleWord}>{currentWord}</Text>
                  <Text style={st.subtitleConf}>
                    {Math.round(currentConf * 100)}%
                  </Text>
                </View>
                <Text style={st.subtitleBrand}>SignBridge</Text>
              </View>
            ) : (
              <View style={st.subtitleBarEmpty}>
                <Text style={st.subtitleEmptyTxt}>
                  🧏 손 동작을 하면 수어가 인식됩니다
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={st.vidPh}>
            <Text style={st.vidPhEmoji}>{recSec > 0 ? "🎬" : "🤟"}</Text>
            <Text style={st.vidPhTxt}>
              {recSec > 0
                ? "녹화 완료\n대화를 종료하면 영상을 확인할 수 있어요"
                : "▶ Start를 눌러\n카메라를 시작하세요"}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrapper: { gap: 12 },

  // 권한
  permBox: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderRadius: 16,
    backgroundColor: "#f8f9ff",
    borderWidth: 1.5,
    borderColor: C.border,
    padding: 20,
  },
  permEmoji: { fontSize: 36 },
  permTxt: { fontSize: 13, color: C.sub, textAlign: "center", lineHeight: 20 },
  permBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.accent,
  },
  permBtnTxt: { fontSize: 13, fontWeight: "700", color: "#fff" },

  // Start/Stop
  camRow: { flexDirection: "row", gap: 10 },
  btnStart: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: C.accent,
    alignItems: "center",
  },
  btnStop: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: C.err,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.35 },
  btnTxt: { fontSize: 14, fontWeight: "800", color: "#fff" },

  // 카메라
  vidBox: {
    height: 280,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#0f0f1a",
  },
  camera: { ...StyleSheet.absoluteFillObject },

  // 랜드마크 오버레이
  landmarkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },

  vidPh: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  vidPhEmoji: { fontSize: 40 },
  vidPhTxt: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 22,
  },

  // REC
  recBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#ef4444" },
  recBadgeTxt: { fontSize: 12, fontWeight: "700", color: "#fff" },

  // 전환 버튼
  flipBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  flipBtnTxt: { fontSize: 18 },

  // LSTM 상태
  lstmBadge: {
    position: "absolute",
    top: 10,
    left: "50%",
    transform: [{ translateX: -40 }],
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  lstmBadgeTxt: { fontSize: 11, fontWeight: "700", color: "#fff" },

  // 자막
  subtitleBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  subtitleContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  subtitleWord: { fontSize: 18, fontWeight: "900", color: "#fff" },
  subtitleConf: {
    fontSize: 12,
    fontWeight: "700",
    color: "#00ff88",
    backgroundColor: "rgba(0,255,136,0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  subtitleBrand: { fontSize: 10, color: "rgba(255,255,255,0.5)" },
  subtitleBarEmpty: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
  },
  subtitleEmptyTxt: { fontSize: 12, color: "rgba(255,255,255,0.7)" },
});
