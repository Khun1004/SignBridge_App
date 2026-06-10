// ══════════════════════════════════════════════════════════════
//  components/Translate/SignCameraView.tsx
//  원본과 동일 — 카메라 + 랜드마크 오버레이만 담당
//  프레임 캡처는 translate.tsx에서 처리
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
const cv  = document.getElementById('cv');
const ctx = cv.getContext('2d');

function resize() {
  cv.width  = window.innerWidth;
  cv.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17],
];

function drawLandmarks(data) {
  ctx.clearRect(0, 0, cv.width, cv.height);
  if (!data) return;
  const W = cv.width, H = cv.height;

  if (data.hands) {
    data.hands.forEach((hand) => {
      // hand = [{x,y,z}, ...] 형식 (서버에서 보낸 형식)
      const pts = hand;
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth   = 2;
      HAND_CONNECTIONS.forEach(([a,b]) => {
        if (!pts[a] || !pts[b]) return;
        ctx.beginPath();
        ctx.moveTo(pts[a].x * W, pts[a].y * H);
        ctx.lineTo(pts[b].x * W, pts[b].y * H);
        ctx.stroke();
      });
      pts.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x*W, p.y*H, i===0?5:3, 0, Math.PI*2);
        ctx.fillStyle = i===0 ? '#ff6b35' : '#00ff88';
        ctx.fill();
      });
    });
  }
}

document.addEventListener('message', (e) => {
  try { drawLandmarks(JSON.parse(e.data)); } catch {}
});
window.addEventListener('message', (e) => {
  try { drawLandmarks(JSON.parse(e.data)); } catch {}
});
</script>
</body>
</html>`;

// ─── 타입 ─────────────────────────────────────────────────────
interface CameraViewProps {
  isActive: boolean;
  isRecording: boolean;
  recSec: number;
  currentWord: string;
  currentConf: number;
  lstmStatus: "disconnected" | "connecting" | "ready" | "error";
  onStart: () => void;
  onStop: () => void;
  landmarks?: { hands?: any[]; pose?: any[] } | null;
  // ★ 카메라 ref를 부모(translate.tsx)로 노출 — 프레임 캡처용
  cameraRef?: React.RefObject<ExpoCameraView | null>;
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
  cameraRef,
}: CameraViewProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("front");
  const webViewRef = useRef<WebView>(null);

  // 랜드마크가 바뀌면 WebView에 전송 (오버레이 그리기)
  React.useEffect(() => {
    if (!landmarks) {
      // 손 없을 때 오버레이 지우기
      webViewRef.current?.injectJavaScript(`
        window.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(null) })); true;
      `);
      return;
    }
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
            {/* 카메라 — ref를 부모에서 전달받아 연결 */}
            <ExpoCameraView ref={cameraRef} style={st.camera} facing={facing} />

            {/* 랜드마크 오버레이 제거 — 깔끔한 카메라 화면 */}

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

            {/* 자막 바 */}
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
  vidBox: {
    height: 280,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#0f0f1a",
  },
  camera: { ...StyleSheet.absoluteFillObject },
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
