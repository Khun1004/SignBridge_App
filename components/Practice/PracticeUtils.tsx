// components/Practice/PracticeUtils.tsx
// ── 공유 유틸 + 공통 컴포넌트 ─────────────────────────────────
import React, { useEffect, useRef } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CATEGORIES, signsForCat } from "./signs";

// ── 색상 토큰 ────────────────────────────────────────────────
export const C = {
  accent: "#7c6fff",
  accent2: "#5b45e0",
  text: "#1a1a2e",
  sub: "#666",
  muted: "#aaa",
  border: "#e8e8f0",
  bg: "#f5f5fa",
  card: "#ffffff",
  green: "#10b981",
  red: "#ef4444",
  yellow: "#f59e0b",
};

// ── Anthropic API 호출 ────────────────────────────────────────
export async function callClaude(prompt: string, system = ""): Promise<string> {
  const body: Record<string, unknown> = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  };
  if (system) body.system = system;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return (
    (data.content as Array<{ text?: string }>)
      ?.map((b) => b.text ?? "")
      .join("") ?? ""
  );
}

// ── 스켈레톤 로딩 ────────────────────────────────────────────
export function SkeletonLine({ short }: { short?: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: false,
      }),
    ).start();
  }, []);
  const bg = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["#eee", "#f5f5f5", "#eee"],
  });
  return (
    <Animated.View
      style={[skStyles.line, short && skStyles.short, { backgroundColor: bg }]}
    />
  );
}
const skStyles = StyleSheet.create({
  line: { height: 9, borderRadius: 4, marginBottom: 5, width: "100%" },
  short: { width: "60%" },
});

// ── AI 피드백 박스 ────────────────────────────────────────────
interface AIFeedbackBoxProps {
  loading: boolean;
  text: string;
  placeholder?: string;
}
export function AIFeedbackBox({
  loading,
  text,
  placeholder,
}: AIFeedbackBoxProps) {
  const hasContent = !loading && !!text;
  return (
    <View
      style={[
        fbStyles.box,
        hasContent && fbStyles.boxActive,
        loading && fbStyles.boxLoading,
      ]}
    >
      <View style={fbStyles.header}>
        <Text style={fbStyles.icon}>🤖</Text>
        <Text style={fbStyles.title}>AI 피드백</Text>
        {loading && <View style={fbStyles.dot} />}
      </View>
      {!loading && !text && (
        <Text style={fbStyles.placeholder}>
          {placeholder ?? "수어를 선택하면 AI 피드백이 표시됩니다."}
        </Text>
      )}
      {loading && (
        <>
          <SkeletonLine />
          <SkeletonLine short />
        </>
      )}
      {!loading && !!text && <Text style={fbStyles.text}>{text}</Text>}
    </View>
  );
}
const fbStyles = StyleSheet.create({
  box: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 13,
    padding: 12,
    backgroundColor: "#fafafa",
  },
  boxActive: {
    borderColor: "rgba(124,111,255,0.3)",
    backgroundColor: "rgba(124,111,255,0.025)",
  },
  boxLoading: { borderColor: "rgba(124,111,255,0.18)" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 8,
  },
  icon: { fontSize: 13 },
  title: { fontSize: 11, fontWeight: "700", color: C.accent },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.accent,
    marginLeft: 4,
  },
  placeholder: { fontSize: 11, color: "#bbb" },
  text: { fontSize: 13, color: "#444", lineHeight: 22 },
});

// ── 카테고리 탭 ───────────────────────────────────────────────
interface CatTabsProps {
  active: string;
  onChange: (id: string) => void;
  showCounts?: boolean;
}
export function CatTabs({ active, onChange, showCounts }: CatTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={ctStyles.row}
    >
      {CATEGORIES.map((c) => {
        const count = signsForCat(c.id).length;
        const isActive = active === c.id;
        return (
          <TouchableOpacity
            key={c.id}
            style={[ctStyles.tab, isActive && ctStyles.tabActive]}
            onPress={() => onChange(c.id)}
            activeOpacity={0.75}
          >
            <Text style={ctStyles.tabIcon}>{c.icon}</Text>
            <Text style={[ctStyles.tabTxt, isActive && ctStyles.tabTxtActive]}>
              {c.label}
            </Text>
            {showCounts && (
              <Text style={[ctStyles.count, isActive && ctStyles.countActive]}>
                {count}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
const ctStyles = StyleSheet.create({
  row: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
    flexDirection: "row",
  },
  tab: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#e0e0ec",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tabActive: { backgroundColor: C.accent, borderColor: C.accent },
  tabIcon: { fontSize: 12 },
  tabTxt: { fontSize: 12, fontWeight: "600", color: "#666" },
  tabTxtActive: { color: "#fff" },
  count: {
    fontSize: 10,
    fontWeight: "700",
    color: "#999",
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 10,
    paddingHorizontal: 5,
  },
  countActive: { color: "#fff", backgroundColor: "rgba(255,255,255,0.25)" },
});

// ── 파라미터 배지 ─────────────────────────────────────────────
export const PARAM_META: Record<
  string,
  { label: string; sub: string; color: string }
> = {
  수형: { label: "수형", sub: "손 모양", color: "#7c6fff" },
  수위: { label: "수위", sub: "위치", color: "#3b82f6" },
  수동: { label: "수동", sub: "움직임", color: "#10b981" },
  수향: { label: "수향", sub: "방향", color: "#f59e0b" },
  비수지: { label: "비수지", sub: "표정·입", color: "#ec4899" },
};

export function ParamBadge({ k, v }: { k: string; v: string }) {
  const m = PARAM_META[k];
  if (!m) return null;
  return (
    <View
      style={[
        pbStyles.badge,
        { borderColor: m.color + "44", backgroundColor: m.color + "11" },
      ]}
    >
      <Text style={[pbStyles.key, { color: m.color }]}>
        {m.label} <Text style={pbStyles.sub}>{m.sub}</Text>
      </Text>
      <Text style={pbStyles.val}>{v}</Text>
    </View>
  );
}
const pbStyles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 6,
  },
  key: { fontSize: 11, fontWeight: "700" },
  sub: { fontSize: 10, fontWeight: "400", opacity: 0.7 },
  val: { fontSize: 13, color: "#333", marginTop: 2 },
});
