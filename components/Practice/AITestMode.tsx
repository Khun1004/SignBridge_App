// components/Practice/AITestMode.tsx
// ── 🤖 AI 시험 모드 ───────────────────────────────────────────
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { C, CatTabs, SkeletonLine, callClaude } from "./PracticeUtils";
import { signsForCat } from "./signs";

type Phase = "intro" | "chat";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AITestMode() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [catId, setCatId] = useState("all");
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [qNum, setQNum] = useState(0);
  const [done, setDone] = useState(false);
  const [finalFb, setFinalFb] = useState("");
  const [fbLoad, setFbLoad] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const catSigns = signsForCat(catId);
  const TOTAL = Math.min(10, catSigns.length);

  const SYSTEM = `당신은 공인 한국수어(KSL) 시험관입니다.
시험 범위 수어:
${catSigns.map((s) => `- ${s.word}: 수형=${s.params.수형}, 수위=${s.params.수위}, 수동=${s.params.수동}`).join("\n")}

규칙:
1. 총 ${TOTAL}문제. 항상 [질문 N/${TOTAL}] 형식으로 번호 표시.
2. 문제 유형 교체: ①수어 동작 설명→이름 맞히기, ②이름→동작 설명, ③수형 설명→해당 수어 2가지.
3. 정답이면 "✅ 정답!" 으로 시작, 오답이면 "❌ 오답:" 으로 시작.
4. 오답 후 반드시 정확한 KSL 동작 설명 제공.
5. ${TOTAL}번째 채점 후 정확히 이 JSON 한 줄을 출력: {"score":N,"total":${TOTAL}}
6. 이후 "🏁 테스트 완료" 출력.
7. 전체 한국어, 친근하고 전문적 어조.`;

  const start = async () => {
    setMsgs([]);
    setQNum(0);
    setDone(false);
    setFinalFb("");
    setPhase("chat");
    setSending(true);
    try {
      const r = await callClaude(
        "한국수어 시험을 시작합니다. 첫 번째 질문을 해주세요.",
        SYSTEM,
      );
      setMsgs([{ role: "assistant", content: r }]);
      setQNum(1);
    } catch {
      setMsgs([
        {
          role: "assistant",
          content: "연결 오류. 잠시 후 다시 시도해 주세요.",
        },
      ]);
    }
    setSending(false);
  };

  const send = async () => {
    if (!input.trim() || sending || done) return;
    const text = input.trim();
    setInput("");
    const history: Message[] = [...msgs, { role: "user", content: text }];
    setMsgs(history);
    setSending(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM,
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const reply =
        (data.content as Array<{ text?: string }>)
          ?.map((b) => b.text ?? "")
          .join("") ?? "";
      const updated: Message[] = [
        ...history,
        { role: "assistant", content: reply },
      ];
      setMsgs(updated);

      if (reply.includes("🏁 테스트 완료")) {
        setDone(true);
        setFbLoad(true);
        const m = reply.match(/\{"score"\s*:\s*(\d+).*?\}/);
        const scoreVal = m ? parseInt(m[1]) : "?";
        try {
          const fb = await callClaude(
            `KSL 시험 결과: ${TOTAL}문제 중 ${scoreVal}개 정답. 학습자에게 구체적인 개선 방향과 격려를 한국어 3-4문장으로.`,
            "한국수어 전문 강사",
          );
          setFinalFb(fb.trim());
        } catch {
          setFinalFb("종합 분석을 불러올 수 없습니다.");
        }
        setFbLoad(false);
      } else {
        setQNum((q) => q + 1);
      }
    } catch {
      setMsgs((m) => [
        ...m,
        { role: "assistant", content: "오류가 발생했습니다." },
      ]);
    }
    setSending(false);
  };

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [msgs, sending]);

  // ── 인트로 화면 ──
  if (phase === "intro")
    return (
      <View style={s.wrap}>
        <CatTabs active={catId} onChange={setCatId} showCounts />

        <View style={s.introCard}>
          <Text style={s.introIcon}>🤖</Text>
          <Text style={s.introTitle}>AI 한국수어 시험</Text>
          <Text style={s.introDesc}>
            AI 시험관이 실제 KSL 지식을 평가합니다.{"\n"}
            수형·수위·수동 등 5요소를 정확히 알아야 합격!
          </Text>
        </View>

        <View style={s.rulesWrap}>
          {[
            ["🤖", `AI가 ${TOTAL}문제 출제`],
            ["💬", "수형·위치·동작을 텍스트로 설명"],
            ["✅", "즉각 채점 + 정확한 KSL 해설"],
            ["📊", "최종 AI 종합 분석"],
          ].map(([icon, text]) => (
            <View key={text} style={s.ruleRow}>
              <Text style={s.ruleIcon}>{icon}</Text>
              <Text style={s.ruleTxt}>{text}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={s.startBtn}
          onPress={start}
          activeOpacity={0.85}
        >
          <Text style={s.startBtnTxt}>시험 시작 →</Text>
        </TouchableOpacity>
      </View>
    );

  // ── 채팅 화면 ──
  return (
    <View style={s.chatWrap}>
      {/* 채팅 헤더 */}
      <View style={s.chatHeader}>
        <View style={s.chatHeaderLeft}>
          <Text style={s.chatAvatar}>🤖</Text>
          <View>
            <Text style={s.chatName}>한국수어 AI 시험관</Text>
            <Text style={s.chatStatus}>
              {sending
                ? "답변 작성 중..."
                : done
                  ? "시험 완료"
                  : `질문 ${Math.min(qNum, TOTAL)} / ${TOTAL}`}
            </Text>
          </View>
        </View>
        {/* 진행 바 */}
        <View style={s.progressTrack}>
          <View
            style={[
              s.progressFill,
              { width: `${(Math.min(qNum, TOTAL) / TOTAL) * 100}%` as any },
            ]}
          />
        </View>
      </View>

      {/* 메시지 목록 */}
      <ScrollView
        ref={scrollRef}
        style={s.msgList}
        contentContainerStyle={{ padding: 12, gap: 10 }}
        keyboardShouldPersistTaps="handled"
      >
        {msgs.map((m, i) => (
          <View key={i} style={[s.msgRow, m.role === "user" && s.msgRowUser]}>
            {m.role === "assistant" && <Text style={s.msgAvatar}>🤖</Text>}
            <View
              style={[s.bubble, m.role === "user" ? s.bubbleUser : s.bubbleAI]}
            >
              <Text style={[s.bubbleTxt, m.role === "user" && s.bubbleTxtUser]}>
                {m.content}
              </Text>
            </View>
          </View>
        ))}
        {sending && (
          <View style={s.msgRow}>
            <Text style={s.msgAvatar}>🤖</Text>
            <View style={[s.bubble, s.bubbleAI, s.bubbleTyping]}>
              <ActivityIndicator size="small" color={C.accent} />
            </View>
          </View>
        )}

        {/* 최종 AI 종합 분석 */}
        {done && (
          <View style={s.finalFbBox}>
            <View style={s.finalFbHeader}>
              <Text style={s.finalFbIcon}>🤖</Text>
              <Text style={s.finalFbTitle}>AI 종합 분석</Text>
              {fbLoad && <View style={s.fbDot} />}
            </View>
            {fbLoad ? (
              <>
                <SkeletonLine />
                <SkeletonLine />
                <SkeletonLine short />
              </>
            ) : (
              <Text style={s.finalFbTxt}>{finalFb}</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* 입력 영역 */}
      <View style={s.inputWrap}>
        {done ? (
          <TouchableOpacity
            style={s.restartBtn}
            onPress={() => setPhase("intro")}
            activeOpacity={0.85}
          >
            <Text style={s.restartBtnTxt}>🔁 다시 시작</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TextInput
              style={s.input}
              placeholder="수어 동작을 설명하거나 이름을 입력하세요..."
              placeholderTextColor="#ccc"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={send}
              returnKeyType="send"
              editable={!sending && !done}
              multiline
            />
            <TouchableOpacity
              style={[
                s.sendBtn,
                (!input.trim() || sending) && { opacity: 0.4 },
              ]}
              onPress={send}
              disabled={!input.trim() || sending}
              activeOpacity={0.85}
            >
              {sending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={s.sendBtnTxt}>전송 ↑</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 14, gap: 14 },

  introCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: C.border,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  introIcon: { fontSize: 52 },
  introTitle: { fontSize: 20, fontWeight: "900", color: C.text },
  introDesc: {
    fontSize: 14,
    color: C.sub,
    textAlign: "center",
    lineHeight: 22,
  },

  rulesWrap: { gap: 10 },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f9f9fc",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  ruleIcon: { fontSize: 20 },
  ruleTxt: { fontSize: 14, color: C.text, fontWeight: "600" },

  startBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: C.accent,
    alignItems: "center",
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  startBtnTxt: { fontSize: 15, fontWeight: "700", color: "#fff" },

  // 채팅
  chatWrap: { flex: 1, minHeight: 500 },
  chatHeader: {
    backgroundColor: "#0f172a",
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 0,
  },
  chatHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  chatAvatar: { fontSize: 28 },
  chatName: { fontSize: 14, fontWeight: "700", color: "#f1f5f9" },
  chatStatus: { fontSize: 11, color: "#94a3b8" },
  progressTrack: {
    flex: 1,
    height: 5,
    backgroundColor: "#1e293b",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: C.accent, borderRadius: 4 },

  msgList: { flex: 1, maxHeight: 380 },
  msgRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 6,
  },
  msgRowUser: { justifyContent: "flex-end" },
  msgAvatar: { fontSize: 20 },
  bubble: { maxWidth: "80%", borderRadius: 16, padding: 12 },
  bubbleAI: { backgroundColor: "#f1f5f9", borderBottomLeftRadius: 4 },
  bubbleUser: { backgroundColor: C.accent, borderBottomRightRadius: 4 },
  bubbleTyping: { paddingVertical: 10, paddingHorizontal: 16 },
  bubbleTxt: { fontSize: 13, color: C.text, lineHeight: 20 },
  bubbleTxtUser: { color: "#fff" },

  finalFbBox: {
    backgroundColor: "rgba(124,111,255,0.06)",
    borderWidth: 1.5,
    borderColor: "rgba(124,111,255,0.2)",
    borderRadius: 14,
    padding: 14,
    gap: 8,
    marginTop: 4,
  },
  finalFbHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  finalFbIcon: { fontSize: 16 },
  finalFbTitle: { fontSize: 13, fontWeight: "700", color: C.accent },
  fbDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent },
  finalFbTxt: { fontSize: 13, color: "#444", lineHeight: 20 },

  inputWrap: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
    color: C.text,
    maxHeight: 80,
  },
  sendBtn: {
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: C.accent,
    justifyContent: "center",
    minWidth: 64,
    alignItems: "center",
  },
  sendBtnTxt: { fontSize: 13, fontWeight: "700", color: "#fff" },
  restartBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: C.accent,
    alignItems: "center",
  },
  restartBtnTxt: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
