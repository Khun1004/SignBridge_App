// ══════════════════════════════════════════════════════════════
//  hooks/useLSTMSign.ts
//  - LSTM 수어 인식 WebSocket 훅
//  - 손/팔 랜드마크 수신 추가 (웹 번역기처럼 오버레이용)
// ══════════════════════════════════════════════════════════════
import { useCallback, useEffect, useRef, useState } from "react";

interface UseLSTMSignOptions {
  onGesture?: (name: string, conf: number) => void;
  onLandmarks?: (data: { hands?: any[]; pose?: any[] }) => void;
  serverUrl?: string;
}

export type LSTMStatus = "disconnected" | "connecting" | "ready" | "error";

export default function useLSTMSign({
  onGesture,
  onLandmarks,
  serverUrl = "ws://192.168.1.102:8000/ws/sign",
}: UseLSTMSignOptions = {}) {
  const [lstmStatus, setLstmStatus] = useState<LSTMStatus>("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    setLstmStatus("connecting");
    try {
      const ws = new WebSocket(serverUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setLstmStatus("ready");
        console.log("[LSTM] 연결됨:", serverUrl);
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);

          // 수어 인식 결과
          if (data.gesture && data.confidence >= 0.75) {
            onGesture?.(data.gesture, data.confidence);
          }

          // 손/팔 랜드마크 (웹 번역기처럼 오버레이)
          if (data.landmarks) {
            onLandmarks?.(data.landmarks);
          }
        } catch {}
      };

      ws.onerror = () => setLstmStatus("error");

      ws.onclose = () => {
        setLstmStatus("disconnected");
        timerRef.current = setTimeout(connect, 3000);
      };
    } catch {
      setLstmStatus("error");
    }
  }, [serverUrl, onGesture, onLandmarks]);

  useEffect(() => {
    connect();
    return () => {
      timerRef.current && clearTimeout(timerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const sendLandmarks = useCallback((landmarks: number[][]) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ landmarks }));
  }, []);

  return { lstmStatus, sendLandmarks };
}
