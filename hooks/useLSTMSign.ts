// ══════════════════════════════════════════════════════════════
//  hooks/useLSTMSign.ts  v2
//
//  변경 사항:
//  - serverUrl 기본값 → /ws/sign/frame (앱 전용 엔드포인트)
//  - sendFrame(base64) 추가 — 카메라 JPEG → 서버 전송
//  - 서버로부터 landmarks 메시지 수신 → onLandmarks 콜백
//  - no_hand 메시지 수신 → onLandmarks(null) 호출
// ══════════════════════════════════════════════════════════════
import { LSTM_WS_URL } from "@/components/api/api";
import { useCallback, useEffect, useRef, useState } from "react";
export type LSTMStatus = "disconnected" | "connecting" | "ready" | "error";

interface UseLSTMSignOptions {
  onGesture?: (name: string, conf: number) => void;
  onLandmarks?: (data: { hands?: any[]; pose?: any[] } | null) => void;
  onSubtitle?: (sentence: string) => void;
  serverUrl?: string;
}

const RECONNECT_BASE = 2000;
const RECONNECT_MAX = 30000;
const MAX_RETRIES = 10;

export default function useLSTMSign({
  onGesture,
  onLandmarks,
  onSubtitle,
  serverUrl = LSTM_WS_URL, // ← api.ts에서 가져온 값을 기본값으로
}: UseLSTMSignOptions = {}) {
  const [lstmStatus, setLstmStatus] = useState<LSTMStatus>("disconnected");

  const wsRef = useRef<WebSocket | null>(null);
  const retryCount = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmounted = useRef(false);
  const onGestureRef = useRef(onGesture);
  const onLandmarksRef = useRef(onLandmarks);
  const onSubtitleRef = useRef(onSubtitle);

  useEffect(() => {
    onGestureRef.current = onGesture;
  }, [onGesture]);
  useEffect(() => {
    onLandmarksRef.current = onLandmarks;
  }, [onLandmarks]);
  useEffect(() => {
    onSubtitleRef.current = onSubtitle;
  }, [onSubtitle]);

  // ── 재연결 스케줄 ─────────────────────────────────────────
  const scheduleReconnectRef = useRef<(() => void) | null>(null);
  scheduleReconnectRef.current = () => {
    if (unmounted.current) return;
    clearTimeout(retryTimer.current ?? undefined);
    retryCount.current += 1;
    if (retryCount.current > MAX_RETRIES) {
      setLstmStatus("error");
      return;
    }
    const delay = Math.min(
      RECONNECT_BASE * Math.pow(1.5, retryCount.current - 1),
      RECONNECT_MAX,
    );
    retryTimer.current = setTimeout(() => connectRef.current?.(), delay);
  };

  // ── 연결 ─────────────────────────────────────────────────
  const connectRef = useRef<(() => void) | null>(null);
  connectRef.current = () => {
    if (unmounted.current) return;
    const cur = wsRef.current;
    if (
      cur &&
      (cur.readyState === WebSocket.OPEN ||
        cur.readyState === WebSocket.CONNECTING)
    )
      return;

    setLstmStatus("connecting");
    let ws: WebSocket;
    try {
      ws = new WebSocket(serverUrl);
    } catch {
      setLstmStatus("error");
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => {
      if (unmounted.current) {
        ws.close();
        return;
      }
      retryCount.current = 0;
      setLstmStatus("ready");
      console.log("[LSTM] 연결됨:", serverUrl);
    };

    ws.onmessage = (e) => {
      if (unmounted.current) return;
      try {
        const data = JSON.parse(e.data);

        // 수어 인식 결과
        if (data.type === "gesture" && data.confidence >= 0.75) {
          onGestureRef.current?.(data.gesture, data.confidence);
        }

        // 랜드마크 오버레이 데이터 (서버가 MediaPipe로 추출)
        if (data.type === "landmarks") {
          onLandmarksRef.current?.({ hands: data.hands });
        }

        // 손 없음 — 오버레이 지우기
        if (data.type === "no_hand") {
          onLandmarksRef.current?.(null);
        }

        // 자막 (FLUSH_SEC 침묵 후 Claude가 생성)
        if (data.type === "subtitle") {
          onSubtitleRef.current?.(data.sentence);
        }
      } catch {}
    };

    ws.onerror = () => {
      if (!unmounted.current)
        console.warn("[LSTM] 연결 오류 — server.py 실행 확인");
    };

    ws.onclose = (e) => {
      if (unmounted.current) return;
      console.log(`[LSTM] 연결 종료 (code=${e.code})`);
      setLstmStatus("disconnected");
      scheduleReconnectRef.current?.();
    };
  };

  // ── 마운트 / 언마운트 ─────────────────────────────────────
  useEffect(() => {
    unmounted.current = false;
    const initTimer = setTimeout(() => connectRef.current?.(), 300);
    return () => {
      unmounted.current = true;
      clearTimeout(initTimer);
      clearTimeout(retryTimer.current ?? undefined);
      const ws = wsRef.current;
      if (ws) {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        if (
          ws.readyState === WebSocket.OPEN ||
          ws.readyState === WebSocket.CONNECTING
        ) {
          ws.close(1000, "unmount");
        }
        wsRef.current = null;
      }
    };
  }, []);

  // ── 이미지 프레임 전송 (앱 → 서버) ─────────────────────────
  // base64: expo-camera의 takePictureAsync / captureRef 결과
  const sendFrame = useCallback((base64Image: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    try {
      ws.send(JSON.stringify({ type: "frame", image: base64Image }));
    } catch (err) {
      console.error("[LSTM] sendFrame 오류:", err);
    }
  }, []);

  // ── 장소 설정 전송 ────────────────────────────────────────
  const setPlace = useCallback((place: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    try {
      ws.send(JSON.stringify({ type: "set_place", place }));
    } catch {}
  }, []);

  // ── 랜드마크 직접 전송 (웹 호환용, 선택) ─────────────────
  const sendLandmarks = useCallback((landmarks: number[][]) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    try {
      ws.send(JSON.stringify({ landmarks }));
    } catch {}
  }, []);

  return { lstmStatus, sendFrame, sendLandmarks, setPlace };
}
