// ══════════════════════════════════════════════════════════════
//  components/Translate/AvatarPanel.tsx
//  웹의 AIPanel을 React Native용으로 포팅
//  AvatarView(WebView 3D) + 컨트롤 버튼 + 포즈 안내 문구
// ══════════════════════════════════════════════════════════════
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AvatarView, { PoseName } from "./AvatarView";

// ─── 색상 토큰 ────────────────────────────────────────────────
const C = {
  accent: "#5b5ef4",
  sub: "#64748b",
  border: "#e4e8f2",
  card: "#ffffff",
  text: "#0f0f1a",
};

// ─── 포즈 → 색상 매핑 (웹 POSE_CFG 간소화 버전) ──────────────
const POSE_COLOR: Record<string, string> = {
  idle: "#94a3b8",
  hello: "#6366f1",
  point: "#0ea5e9",
  thanks: "#10b981",
  thumbUp: "#f59e0b",
  fist: "#ef4444",
  love: "#ec4899",
};

// ─── 포즈 → 한글 이름 ────────────────────────────────────────
const POSE_NAME: Record<string, string> = {
  idle: "대기",
  hello: "안녕하세요",
  point: "만나서 반갑습니다",
  thanks: "감사합니다",
  thumbUp: "좋아요",
  fist: "미안합니다",
  love: "사랑합니다",
};

// ─── 타입 ─────────────────────────────────────────────────────
export interface GuideStep {
  word: string;
  animType: string;
}

export interface Guide {
  steps: GuideStep[];
}

interface AvatarPanelProps {
  guide?: Guide | null; // 수어 가이드 (단계 목록)
  loading?: boolean; // AI 가이드 생성 중
  playing?: boolean; // 외부 재생 제어
}

// ─── animType → PoseName 변환 ────────────────────────────────
const A2P: Record<string, PoseName> = {
  hello: "hello",
  안녕: "hello",
  안녕하세요: "hello",
  point: "point",
  만나서반갑습니다: "point",
  만나: "point",
  반갑: "point",
  thanks: "thanks",
  고마: "thanks",
  감사: "thanks",
  thumbUp: "thumbUp",
  좋아: "thumbUp",
  최고: "thumbUp",
  fist: "fist",
  미안: "fist",
  죄송: "fist",
  사과: "fist",
  love: "love",
  사랑: "love",
};

function resolvePose(animType?: string): PoseName {
  if (!animType) return "idle";
  const t = animType.trim();
  if (A2P[t]) return A2P[t];
  const lower = t.toLowerCase();
  for (const [k, v] of Object.entries(A2P)) {
    if (k.toLowerCase() === lower) return v;
  }
  return "idle";
}

// ══════════════════════════════════════════════════════════════
//  AvatarPanel 컴포넌트
// ══════════════════════════════════════════════════════════════
export default function AvatarPanel({
  guide,
  loading = false,
  playing: externalPlaying = false,
}: AvatarPanelProps) {
  const [idx, setIdx] = useState(0);
  const [play, setPlay] = useState(false);
  const [activePose, setActivePose] = useState<PoseName>("idle");
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevExtRef = useRef(externalPlaying);

  // 외부 playing 변화 감지
  useEffect(() => {
    if (externalPlaying === prevExtRef.current) return;
    prevExtRef.current = externalPlaying;
    if (externalPlaying) {
      setIdx(0);
      setPlay(true);
    } else {
      setPlay(false);
    }
  }, [externalPlaying]);

  // guide 바뀌면 처음부터
  useEffect(() => {
    setIdx(0);
    setPlay(!!externalPlaying);
  }, [guide]);

  // 포즈 전환
  useEffect(() => {
    if (!guide?.steps?.length) {
      setActivePose("idle");
      return;
    }
    const step = guide.steps[idx];
    const pose = resolvePose(step?.animType);
    setActivePose(pose);
  }, [idx, guide]);

  // 자동 재생 타이머 (3초마다 다음 스텝)
  useEffect(() => {
    if (autoRef.current) clearTimeout(autoRef.current);
    if (!play || !guide?.steps?.length) return;
    autoRef.current = setTimeout(() => {
      setIdx((s) => (s + 1) % guide!.steps.length);
    }, 3000);
    return () => {
      if (autoRef.current) clearTimeout(autoRef.current);
    };
  }, [play, idx, guide]);

  const total = guide?.steps?.length ?? 0;
  const poseColor = POSE_COLOR[activePose] || C.accent;
  const curStep = guide?.steps?.[idx];

  return (
    <View style={st.container}>
      {/* ── 헤더 ── */}
      <View style={st.header}>
        <Text style={st.headerTxt}>🤟 수어 아바타</Text>
        {total > 0 && (
          <View
            style={[
              st.poseBadge,
              {
                backgroundColor: poseColor + "22",
                borderColor: poseColor + "55",
              },
            ]}
          >
            <Text style={[st.poseBadgeTxt, { color: poseColor }]}>
              {POSE_NAME[activePose] || activePose}
            </Text>
          </View>
        )}
      </View>

      {/* ── 3D 아바타 ── */}
      <AvatarView pose={activePose} playing={play} />

      {/* ── 로딩 오버레이 ── */}
      {loading && (
        <View style={st.loadingOverlay}>
          <Text style={st.loadingEmoji}>✨</Text>
          <Text style={st.loadingTxt}>수어 가이드 생성 중...</Text>
        </View>
      )}

      {/* ── guide 없고 로딩도 아닐 때 ── */}
      {!guide && !loading && (
        <View style={st.emptyBox}>
          <Text style={st.emptyTxt}>👆 텍스트 탭에서 내용을 입력하면</Text>
          <Text style={st.emptyTxt}>아바타가 수어 동작을 보여줍니다</Text>
        </View>
      )}

      {/* ── 현재 단어 표시 ── */}
      {curStep && total > 0 && (
        <View style={st.stepRow}>
          <Text style={st.stepWord}>{curStep.word}</Text>
          <Text style={st.stepCount}>
            {idx + 1} / {total}
          </Text>
        </View>
      )}

      {/* ── 단계 인디케이터 점 ── */}
      {total > 1 && (
        <View style={st.dotRow}>
          {guide!.steps.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => {
                setIdx(i);
                setPlay(false);
              }}
              activeOpacity={0.7}
            >
              <View style={[st.dot, i === idx && st.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── 컨트롤 버튼 ── */}
      {guide && total > 0 && (
        <View style={st.ctrlRow}>
          <TouchableOpacity
            style={[st.navBtn, idx === 0 && st.navBtnDisabled]}
            disabled={idx === 0}
            onPress={() => {
              setIdx((i) => Math.max(0, i - 1));
              setPlay(false);
            }}
            activeOpacity={0.8}
          >
            <Text style={st.navBtnTxt}>◀ 이전</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[st.playBtn, { backgroundColor: poseColor }]}
            onPress={() => setPlay((p) => !p)}
            activeOpacity={0.85}
          >
            <Text style={st.playBtnTxt}>{play ? "⏸ 일시정지" : "▶ 재생"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[st.navBtn, idx === total - 1 && st.navBtnDisabled]}
            disabled={idx === total - 1}
            onPress={() => {
              setIdx((i) => Math.min(total - 1, i + 1));
              setPlay(false);
            }}
            activeOpacity={0.8}
          >
            <Text style={st.navBtnTxt}>다음 ▶</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── 스타일 ───────────────────────────────────────────────────
const st = StyleSheet.create({
  container: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 12,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTxt: { fontSize: 14, fontWeight: "800", color: C.text },
  poseBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  poseBadgeTxt: { fontSize: 12, fontWeight: "700" },

  // 로딩 오버레이
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.82)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    zIndex: 10,
  },
  loadingEmoji: { fontSize: 28 },
  loadingTxt: { fontSize: 13, color: C.sub },

  // 빈 상태
  emptyBox: { alignItems: "center", gap: 6, paddingVertical: 8 },
  emptyTxt: { fontSize: 13, color: C.sub, textAlign: "center" },

  // 현재 단어
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f9ff",
    borderRadius: 10,
    padding: 10,
  },
  stepWord: { fontSize: 15, fontWeight: "800", color: C.text },
  stepCount: { fontSize: 12, color: C.sub },

  // 점 인디케이터
  dotRow: { flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#e2e8f0" },
  dotActive: { backgroundColor: C.accent, width: 18 },

  // 컨트롤
  ctrlRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  navBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: "center",
    backgroundColor: C.card,
  },
  navBtnDisabled: { opacity: 0.35 },
  navBtnTxt: { fontSize: 13, fontWeight: "700", color: C.sub },
  playBtn: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  playBtnTxt: { fontSize: 14, fontWeight: "800", color: "#fff" },
});
