// components/Practice/PracticeMode.tsx
// ── 🤟 연습 모드 (퀴즈) ───────────────────────────────────────
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  AIFeedbackBox,
  C,
  CatTabs,
  PARAM_META,
  ParamBadge,
  callClaude,
} from "./PracticeUtils";
import { Sign, signsForCat } from "./signs";

type HistoryItem = { word: string; chosen: string; ok: boolean; time: string };

export default function PracticeMode() {
  const [catId, setCatId] = useState("all");
  const [count, setCount] = useState(4);
  const [current, setCurrent] = useState<Sign | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [chosen, setChosen] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [score, setScore] = useState({ ok: 0, fail: 0 });
  const [aiText, setAiText] = useState("");
  const [aiLoad, setAiLoad] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const pool = signsForCat(catId);

  const nextQuestion = useCallback(() => {
    if (pool.length < 2) return;
    const q = pool[Math.floor(Math.random() * pool.length)];
    const wrongs = pool
      .filter((s) => s.id !== q.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, count - 1)
      .map((s) => s.word);
    const opts = [...wrongs, q.word].sort(() => Math.random() - 0.5);
    setCurrent(q);
    setChoices(opts);
    setChosen(null);
    setAiText("");
    setShowHint(false);
  }, [pool, count]);

  useEffect(() => {
    nextQuestion();
  }, [catId, count]);

  const handleChoice = async (c: string) => {
    if (chosen || !current) return;
    setChosen(c);
    const ok = c === current.word;
    const newStreak = ok ? streak + 1 : 0;
    setStreak(newStreak);
    setBestStreak((b) => Math.max(b, newStreak));
    setScore((prev) =>
      ok ? { ...prev, ok: prev.ok + 1 } : { ...prev, fail: prev.fail + 1 },
    );
    const now = new Date().toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setHistory((h) =>
      [{ word: current.word, chosen: c, ok, time: now }, ...h].slice(0, 8),
    );

    // AI 피드백 호출
    setAiLoad(true);
    try {
      const prompt = ok
        ? `한국수어 학습자가 "${current.word}"의 수어를 보고 정확히 맞혔습니다. 이 수어의 재미있는 기억법이나 실생활 활용 팁을 2문장 이내로 알려주세요.`
        : `한국수어 학습자가 "${current.word}" 수어를 보고 "${c}"라고 잘못 선택했습니다. 두 수어의 차이점을 2-3문장으로 명확히 설명해 주세요.`;
      const fb = await callClaude(prompt, "당신은 한국수어 전문 강사입니다.");
      setAiText(fb.trim());
    } catch {
      setAiText("피드백을 불러올 수 없습니다.");
    }
    setAiLoad(false);

    setTimeout(() => nextQuestion(), 1400);
  };

  if (!current)
    return (
      <View style={{ padding: 24, alignItems: "center" }}>
        <Text style={{ color: C.sub }}>해당 카테고리에 수어가 부족합니다.</Text>
      </View>
    );

  const total = score.ok + score.fail;
  const acc = total > 0 ? Math.round((score.ok / total) * 100) : 0;

  return (
    <View style={{ gap: 0 }}>
      <CatTabs
        active={catId}
        onChange={(id) => {
          setCatId(id);
          setScore({ ok: 0, fail: 0 });
          setHistory([]);
          setStreak(0);
        }}
      />

      {/* 옵션 바 */}
      <View style={s.optBar}>
        <Text style={s.optLabel}>보기 수</Text>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {[2, 4, 6].map((n) => (
            <TouchableOpacity
              key={n}
              style={[s.pill, count === n && s.pillActive]}
              onPress={() => setCount(n)}
              activeOpacity={0.75}
            >
              <Text style={[s.pillTxt, count === n && s.pillTxtActive]}>
                {n}개
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 점수 바 */}
      {total > 0 && (
        <View style={s.scoreRow}>
          <View style={s.scoreBadge}>
            <Text style={s.scoreTxt}>✅ {score.ok}</Text>
          </View>
          <View
            style={[
              s.scoreBadge,
              { borderColor: "#fca5a5", backgroundColor: "#fff5f5" },
            ]}
          >
            <Text style={[s.scoreTxt, { color: C.red }]}>❌ {score.fail}</Text>
          </View>
          <View
            style={[
              s.scoreBadge,
              {
                borderColor: "rgba(124,111,255,.3)",
                backgroundColor: "rgba(124,111,255,.06)",
              },
            ]}
          >
            <Text style={[s.scoreTxt, { color: C.accent }]}>정답률 {acc}%</Text>
          </View>
          <View
            style={[
              s.scoreBadge,
              {
                borderColor: streak >= 3 ? "#f59e0b44" : C.border,
                backgroundColor: streak >= 3 ? "#fff8e0" : "#fafafa",
              },
            ]}
          >
            <Text
              style={[s.scoreTxt, { color: streak >= 3 ? C.yellow : C.sub }]}
            >
              {streak >= 3 ? "🔥" : "⚡"}
              {streak}연속
            </Text>
          </View>
        </View>
      )}

      {/* 문제 카드 */}
      <View style={s.qCard}>
        <Text style={s.qEmoji}>{current.emoji}</Text>
        <Text style={s.qWord}>{current.word}</Text>
        <Text style={s.qDesc}>{current.desc}</Text>

        {/* 힌트 버튼 */}
        {!chosen && (
          <TouchableOpacity
            style={s.hintBtn}
            onPress={() => setShowHint((h) => !h)}
            activeOpacity={0.75}
          >
            <Text style={s.hintBtnTxt}>
              {showHint ? "힌트 숨기기" : "💡 힌트"}
            </Text>
          </TouchableOpacity>
        )}
        {showHint && !chosen && (
          <View style={s.hintParams}>
            <ParamBadge k="수위" v={current.params.수위} />
            <ParamBadge k="수동" v={current.params.수동} />
          </View>
        )}

        {chosen && (
          <View
            style={[
              s.resultBadge,
              chosen === current.word ? s.resultOk : s.resultFail,
            ]}
          >
            <Text style={s.resultBadgeTxt}>
              {chosen === current.word
                ? `✔ 정답! "${current.word}"`
                : `✕ 정답은 "${current.word}"`}
            </Text>
          </View>
        )}
      </View>

      {/* 보기 그리드 */}
      <View style={s.choicesGrid}>
        {choices.map((c) => {
          const isChosen = chosen === c;
          const isAnswer = c === current.word;
          let extraStyle = {};
          if (chosen) {
            if (isChosen && isAnswer) extraStyle = s.choiceOk;
            if (isChosen && !isAnswer) extraStyle = s.choiceFail;
            if (!isChosen && isAnswer) extraStyle = s.choiceReveal;
          }
          return (
            <TouchableOpacity
              key={c}
              style={[s.choice, extraStyle]}
              onPress={() => handleChoice(c)}
              disabled={!!chosen}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  s.choiceTxt,
                  (isChosen || (!isChosen && isAnswer && !!chosen)) && {
                    color: "#fff",
                  },
                ]}
              >
                {c}
              </Text>
              {chosen && isChosen && (
                <Text style={s.choiceMark}>{isAnswer ? " ✓" : " ✗"}</Text>
              )}
              {chosen && !isChosen && isAnswer && (
                <Text style={s.choiceMark}> ✓</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 다음 문제 */}
      <TouchableOpacity
        style={s.nextBtn}
        onPress={nextQuestion}
        activeOpacity={0.85}
      >
        <Text style={s.nextBtnTxt}>🔁 다음 문제</Text>
      </TouchableOpacity>

      {/* AI 피드백 */}
      {(aiLoad || aiText) && (
        <View style={s.feedWrap}>
          <AIFeedbackBox loading={aiLoad} text={aiText} />
        </View>
      )}

      {/* 파라미터 정보 */}
      {chosen && (
        <View style={s.paramsWrap}>
          <Text style={s.paramsTitle}>📋 수어 정보</Text>
          {Object.entries(current.params).map(([k, v]) =>
            PARAM_META[k] && v ? <ParamBadge key={k} k={k} v={v} /> : null,
          )}
        </View>
      )}

      {/* 히스토리 */}
      {history.length > 0 && (
        <View style={s.histWrap}>
          <Text style={s.histTitle}>🕐 최근 기록</Text>
          {history.map((h, i) => (
            <View key={i} style={s.histRow}>
              <Text style={s.histLabel}>{h.word}</Text>
              {!h.ok && (
                <Text style={s.histChosen} numberOfLines={1}>
                  {h.chosen}
                </Text>
              )}
              <Text style={s.histTime}>{h.time}</Text>
              <Text style={[s.histResult, h.ok ? s.histOk : s.histFail]}>
                {h.ok ? "✓" : "✗"}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  optBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f9f9fc",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 14,
    marginBottom: 14,
  },
  optLabel: { fontSize: 11, fontWeight: "700", color: C.muted },
  pill: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#e0e0ec",
    backgroundColor: "#fff",
  },
  pillActive: { backgroundColor: C.accent, borderColor: C.accent },
  pillTxt: { fontSize: 12, fontWeight: "600", color: "#666" },
  pillTxtActive: { color: "#fff" },

  scoreRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,.3)",
    backgroundColor: "rgba(16,185,129,.07)",
  },
  scoreTxt: { fontSize: 12, fontWeight: "700", color: C.green },

  qCard: {
    marginHorizontal: 14,
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 18,
    padding: 28,
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  qEmoji: { fontSize: 56 },
  qWord: {
    fontSize: 22,
    fontWeight: "900",
    color: C.text,
    letterSpacing: -0.5,
  },
  qDesc: { fontSize: 13, color: C.sub, textAlign: "center", lineHeight: 20 },

  hintBtn: {
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#c4b5fd",
    backgroundColor: "#ede9fe",
  },
  hintBtnTxt: { fontSize: 12, fontWeight: "700", color: C.accent },
  hintParams: { width: "100%", marginTop: 4 },

  resultBadge: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 4,
  },
  resultOk: { backgroundColor: C.green },
  resultFail: { backgroundColor: C.red },
  resultBadgeTxt: { color: "#fff", fontWeight: "700", fontSize: 13 },

  choicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 14,
    gap: 8,
    marginBottom: 14,
  },
  choice: {
    width: "47%",
    flexGrow: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.card,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  choiceOk: { backgroundColor: C.green, borderColor: C.green },
  choiceFail: { backgroundColor: C.red, borderColor: C.red },
  choiceReveal: {
    backgroundColor: "rgba(16,185,129,0.15)",
    borderColor: C.green,
  },
  choiceTxt: { fontSize: 14, fontWeight: "700", color: C.text },
  choiceMark: { fontSize: 14, color: "#fff" },

  nextBtn: {
    marginHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: "center",
    marginBottom: 14,
  },
  nextBtnTxt: { fontSize: 14, fontWeight: "700", color: C.sub },

  feedWrap: { paddingHorizontal: 14, marginBottom: 14 },
  paramsWrap: {
    marginHorizontal: 14,
    marginBottom: 14,
    backgroundColor: "#f9f9fc",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  paramsTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: C.muted,
    marginBottom: 8,
  },

  histWrap: {
    marginHorizontal: 14,
    marginBottom: 14,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
  },
  histTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#bbb",
    marginBottom: 7,
  },
  histRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  histLabel: { flex: 1, fontSize: 12, fontWeight: "600", color: "#333" },
  histChosen: {
    fontSize: 10,
    color: C.red,
    flex: 1,
    textAlign: "right",
    marginRight: 4,
  },
  histTime: { fontSize: 10, color: "#bbb" },
  histResult: { fontSize: 13, fontWeight: "700" },
  histOk: { color: C.green },
  histFail: { color: C.red },
});
