// components/Practice/LearnMode.tsx
// ── 📖 학습 모드 ──────────────────────────────────────────────
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  AIFeedbackBox,
  C,
  CatTabs,
  ParamBadge,
  callClaude,
} from "./PracticeUtils";
import { Sign, signsForCat } from "./signs";

export default function LearnMode() {
  const [catId, setCatId] = useState("all");
  const [selected, setSelected] = useState<Sign | null>(null);
  const [aiText, setAiText] = useState("");
  const [aiLoad, setAiLoad] = useState(false);

  const pool = signsForCat(catId);

  const handleSelect = (sign: Sign) => {
    setSelected(sign);
    setAiText("");
  };

  const askAI = async () => {
    if (!selected) return;
    setAiLoad(true);
    setAiText("");
    try {
      const t = await callClaude(
        `한국수어 "${selected.word}" 초보자를 위한 추가 정보:\n1. 손 모양의 기원/이유 (1-2문장)\n2. 실생활 예시 문장 2개 (수어 어순)\n3. 혼동하기 쉬운 수어 1개와 구별법`,
        "한국농아인협회 공인 한국수어 강사. 정확하고 친근하게.",
      );
      setAiText(t.trim());
    } catch {
      setAiText("AI 설명을 불러올 수 없습니다.");
    }
    setAiLoad(false);
  };

  return (
    <View>
      <CatTabs
        active={catId}
        onChange={(id) => {
          setCatId(id);
          setSelected(null);
          setAiText("");
        }}
        showCounts
      />

      {/* 수어 카드 그리드 */}
      <View style={s.grid}>
        {pool.map((sign) => (
          <TouchableOpacity
            key={sign.id}
            style={[s.card, selected?.id === sign.id && s.cardActive]}
            onPress={() => handleSelect(sign)}
            activeOpacity={0.75}
          >
            <Text style={s.cardEmoji}>{sign.emoji}</Text>
            <Text style={s.cardWord}>{sign.word}</Text>
            <View
              style={[
                s.level,
                { backgroundColor: sign.level === 1 ? "#e8fff4" : "#fff8e0" },
              ]}
            >
              <Text
                style={[
                  s.levelTxt,
                  { color: sign.level === 1 ? C.green : C.yellow },
                ]}
              >
                {"★".repeat(sign.level)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* 상세 패널 */}
      {selected && (
        <View style={s.detail}>
          {/* 헤더 */}
          <View style={s.detailTop}>
            <Text style={s.detailEmoji}>{selected.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.detailWord}>{selected.word}</Text>
              <Text style={s.detailCat}>{selected.category}</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setSelected(null);
                setAiText("");
              }}
            >
              <Text style={s.detailClose}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 동작 설명 */}
          <View style={s.descBox}>
            <Text style={s.descLabel}>동작 설명</Text>
            <Text style={s.descTxt}>{selected.desc}</Text>
          </View>

          {/* 수어 파라미터 */}
          <View style={s.paramsWrap}>
            <Text style={s.paramsTitle}>수어 5요소</Text>
            <View style={s.paramsGrid}>
              {Object.entries(selected.params).map(([k, v]) =>
                v ? <ParamBadge key={k} k={k} v={v} /> : null,
              )}
            </View>
          </View>

          {/* AI 심화 설명 버튼 */}
          <TouchableOpacity
            style={[s.aiBtn, aiLoad && { opacity: 0.6 }]}
            onPress={askAI}
            disabled={aiLoad}
            activeOpacity={0.85}
          >
            <Text style={s.aiBtnTxt}>
              {aiLoad
                ? "🤖 생성 중..."
                : "🤖 AI 심화 설명 (기원 · 예문 · 혼동어)"}
            </Text>
          </TouchableOpacity>

          {/* AI 피드백 */}
          {(aiLoad || aiText) && (
            <AIFeedbackBox loading={aiLoad} text={aiText} />
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 14,
  },
  card: {
    width: "22%",
    flexGrow: 1,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 6,
    backgroundColor: C.card,
  },
  cardActive: {
    borderColor: C.accent,
    backgroundColor: "rgba(124,111,255,0.05)",
  },
  cardEmoji: { fontSize: 28 },
  cardWord: {
    fontSize: 12,
    fontWeight: "700",
    color: C.text,
    textAlign: "center",
  },
  level: { borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
  levelTxt: { fontSize: 10, fontWeight: "700" },

  detail: {
    marginHorizontal: 14,
    marginBottom: 14,
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  detailTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  detailEmoji: { fontSize: 44 },
  detailWord: {
    fontSize: 20,
    fontWeight: "900",
    color: C.text,
    marginBottom: 3,
  },
  detailCat: { fontSize: 12, color: C.sub },
  detailClose: { fontSize: 18, color: "#ccc", fontWeight: "700" },

  descBox: { backgroundColor: "#f5f5fa", borderRadius: 10, padding: 12 },
  descLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: C.muted,
    marginBottom: 5,
  },
  descTxt: { fontSize: 14, color: C.text, lineHeight: 22 },

  paramsWrap: {},
  paramsTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: C.muted,
    marginBottom: 8,
  },
  paramsGrid: { gap: 0 },

  aiBtn: {
    backgroundColor: "rgba(124,111,255,0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(124,111,255,0.25)",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  aiBtnTxt: { fontSize: 13, fontWeight: "700", color: C.accent },
});
