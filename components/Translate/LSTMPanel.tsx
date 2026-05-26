// ══════════════════════════════════════════════════════════════
//  components/Translate/LSTMPanel.tsx
//  앱용 LSTM 수어 인식 패널
//  웹의 SubPanel과 동일한 흐름:
//  손동작 → 인식 → [✅ 맞음] → 단어 수집 → [✨ 문장 생성] → [전송]
// ══════════════════════════════════════════════════════════════
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const C = {
  accent: "#5b5ef4",
  sub: "#64748b",
  border: "#e4e8f2",
  card: "#ffffff",
  text: "#0f0f1a",
  green: "#10b981",
  purple: "#8b5cf6",
};

interface LSTMPanelProps {
  lstmStatus: "disconnected" | "connecting" | "ready" | "error";
  currentWord: string;
  currentConf: number;
  onAccept: () => void; // 맞음 버튼
  onSend: (text: string) => void; // 문장 전송
  buildSubtitle?: (words: string[]) => Promise<string>; // 문장 생성 API
}

// 마침표 추가
function addPeriods(text: string): string {
  if (!text) return text;
  const sentences = text.split(/(?<=[다요죠]) +/);
  return sentences
    .map((s) => {
      const t = s.trim();
      if (!t) return "";
      if (/[.?!]$/.test(t)) return t;
      return t + ".";
    })
    .filter(Boolean)
    .join(" ");
}

export default function LSTMPanel({
  lstmStatus,
  currentWord,
  currentConf,
  onAccept,
  onSend,
  buildSubtitle,
}: LSTMPanelProps) {
  const [collectedWords, setCollectedWords] = useState<string[]>([]);
  const [sentence, setSentence] = useState("");
  const [generating, setGenerating] = useState(false);

  const statusColor =
    lstmStatus === "ready"
      ? C.green
      : lstmStatus === "connecting"
        ? "#f59e0b"
        : "#ef4444";

  const statusLabel =
    lstmStatus === "ready"
      ? "● LSTM 연결됨"
      : lstmStatus === "connecting"
        ? "○ 연결 중..."
        : lstmStatus === "error"
          ? "✕ 연결 오류"
          : "○ 미연결";

  // 맞음 클릭
  const handleAccept = () => {
    if (!currentWord) return;
    setCollectedWords((prev) => [...prev, currentWord]);
    setSentence("");
    onAccept();
  };

  // 단어 삭제
  const removeWord = (i: number) => {
    setCollectedWords((prev) => prev.filter((_, j) => j !== i));
    setSentence("");
  };

  // 문장 생성
  const handleGenerate = async () => {
    if (!collectedWords.length) return;
    setGenerating(true);
    try {
      let result = "";
      if (buildSubtitle) {
        result = await buildSubtitle(collectedWords);
      } else {
        result = collectedWords.join(" ");
      }
      setSentence(addPeriods(result));
    } catch {
      setSentence(addPeriods(collectedWords.join(" ")));
    } finally {
      setGenerating(false);
    }
  };

  // 전송
  const handleSend = () => {
    if (!sentence) return;
    onSend(sentence);
    setCollectedWords([]);
    setSentence("");
  };

  // 다시
  const handleRetry = () => setSentence("");

  return (
    <View style={st.container}>
      {/* 상태 표시 */}
      <View style={st.statusRow}>
        <Text style={st.panelTitle}>🧠 LSTM 수어 인식</Text>
        <Text style={[st.status, { color: statusColor }]}>{statusLabel}</Text>
      </View>

      {/* 현재 인식 단어 */}
      <View style={[st.currentBox, currentWord ? st.currentBoxOn : null]}>
        {lstmStatus !== "ready" ? (
          <Text style={st.hint}>
            서버에 연결되면 자동으로 수어를 인식합니다
          </Text>
        ) : currentWord ? (
          <View style={st.currentHit}>
            <View style={{ flex: 1 }}>
              <Text style={st.currentLabel}>인식된 수어</Text>
              <Text style={st.currentWord}>{currentWord}</Text>
              <Text style={st.currentConf}>
                {Math.round(currentConf * 100)}%
              </Text>
            </View>
            <TouchableOpacity style={st.acceptBtn} onPress={handleAccept}>
              <Text style={st.acceptBtnTxt}>✅ 맞음</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={st.hint}>🤟 손 동작을 하면 단어가 인식됩니다</Text>
        )}
      </View>

      {/* 수집된 단어들 */}
      {collectedWords.length > 0 && (
        <View style={st.wordsSection}>
          <Text style={st.wordsLabel}>수집된 단어</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={st.wordsRow}>
              {collectedWords.map((w, i) => (
                <View key={i} style={st.wordChip}>
                  <Text style={st.wordChipTxt}>{w}</Text>
                  <TouchableOpacity onPress={() => removeWord(i)}>
                    <Text style={st.wordChipDel}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* 문장 생성 버튼 */}
      {collectedWords.length > 0 && !sentence && (
        <TouchableOpacity
          style={[st.genBtn, generating && { opacity: 0.6 }]}
          onPress={handleGenerate}
          disabled={generating}
          activeOpacity={0.85}
        >
          {generating ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={st.genBtnTxt}>✨ 문장 생성</Text>
          )}
        </TouchableOpacity>
      )}

      {/* 생성된 문장 */}
      {sentence !== "" && (
        <View style={st.sentenceBox}>
          <Text style={st.sentenceLabel}>💬 생성된 문장</Text>
          <Text style={st.sentenceTxt}>{sentence}</Text>
          <View style={st.sentenceActs}>
            <TouchableOpacity style={st.retryBtn} onPress={handleRetry}>
              <Text style={st.retryBtnTxt}>↩ 다시</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.sendBtn} onPress={handleSend}>
              <Text style={st.sendBtnTxt}>전송 →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  container: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#c4b5fd",
    padding: 14,
    gap: 12,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  panelTitle: { fontSize: 14, fontWeight: "800", color: C.text },
  status: { fontSize: 11, fontWeight: "700" },

  // 현재 인식
  currentBox: {
    minHeight: 64,
    backgroundColor: "#f5f3ff",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#ddd6fe",
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  currentBoxOn: {
    borderColor: C.accent,
    backgroundColor: "rgba(91,94,244,.06)",
  },
  hint: { fontSize: 13, color: C.sub, textAlign: "center" },
  currentHit: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 12,
  },
  currentLabel: { fontSize: 11, color: C.sub, marginBottom: 2 },
  currentWord: { fontSize: 22, fontWeight: "900", color: C.accent },
  currentConf: {
    fontSize: 11,
    color: C.green,
    fontWeight: "700",
    marginTop: 2,
  },
  acceptBtn: {
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  acceptBtnTxt: { fontSize: 13, fontWeight: "800", color: "#fff" },

  // 수집 단어
  wordsSection: { gap: 6 },
  wordsLabel: { fontSize: 11, fontWeight: "700", color: C.sub },
  wordsRow: { flexDirection: "row", gap: 6, paddingBottom: 2 },
  wordChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(91,94,244,.08)",
    borderWidth: 1.5,
    borderColor: "rgba(91,94,244,.2)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  wordChipTxt: { fontSize: 12, fontWeight: "700", color: C.accent },
  wordChipDel: { fontSize: 11, color: "#9ca3af" },

  // 문장 생성 버튼
  genBtn: {
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  genBtnTxt: { fontSize: 14, fontWeight: "800", color: "#fff" },

  // 생성된 문장
  sentenceBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#ddd6fe",
    padding: 12,
    gap: 8,
  },
  sentenceLabel: { fontSize: 11, fontWeight: "700", color: C.purple },
  sentenceTxt: {
    fontSize: 15,
    fontWeight: "700",
    color: C.text,
    lineHeight: 22,
  },
  sentenceActs: { flexDirection: "row", gap: 8 },
  retryBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  retryBtnTxt: { fontSize: 12, fontWeight: "700", color: C.sub },
  sendBtn: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: C.accent,
    alignItems: "center",
  },
  sendBtnTxt: { fontSize: 13, fontWeight: "800", color: "#fff" },
});
