// ══════════════════════════════════════════════════════════════
//  practice.tsx — 한국수어 학습센터 (React Native)
//  원본: Practice.jsx + Practice.css
//  모드: 📖 학습 | 🤟 연습 | 📷 카메라 | 🤖 AI 시험
// ══════════════════════════════════════════════════════════════
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── 색상 토큰 (Practice.css) ─────────────────────────────────
const C = {
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

// ─── 수어 데이터 (signs.js 대체) ─────────────────────────────
const SIGNS = [
  // 인사
  {
    id: 1,
    emoji: "👋",
    word: "안녕하세요",
    category: "인사",
    desc: "손을 펼쳐 귀 옆에서 앞으로 흔든다.",
    level: 1,
  },
  {
    id: 2,
    emoji: "🙏",
    word: "감사합니다",
    category: "인사",
    desc: "두 손을 모아 가슴 앞에서 앞으로 내민다.",
    level: 1,
  },
  {
    id: 3,
    emoji: "👐",
    word: "반갑습니다",
    category: "인사",
    desc: "두 손을 펼쳐 서로 마주치듯 흔든다.",
    level: 1,
  },
  {
    id: 4,
    emoji: "🤝",
    word: "처음 뵙겠습니다",
    category: "인사",
    desc: "오른손을 앞으로 내밀며 고개를 숙인다.",
    level: 2,
  },
  // 감정
  {
    id: 5,
    emoji: "😊",
    word: "기쁨",
    category: "감정",
    desc: "두 손을 가슴에서 바깥으로 펼친다.",
    level: 1,
  },
  {
    id: 6,
    emoji: "😢",
    word: "슬픔",
    category: "감정",
    desc: "검지로 눈 아래를 쓸어내린다.",
    level: 1,
  },
  {
    id: 7,
    emoji: "😠",
    word: "화남",
    category: "감정",
    desc: "주먹을 쥐고 가슴 앞에서 떨린다.",
    level: 2,
  },
  {
    id: 8,
    emoji: "❤️",
    word: "사랑",
    category: "감정",
    desc: "두 손을 X자로 가슴에 얹는다.",
    level: 1,
  },
  // 숫자
  {
    id: 9,
    emoji: "1️⃣",
    word: "일",
    category: "숫자",
    desc: "검지를 세운다.",
    level: 1,
  },
  {
    id: 10,
    emoji: "2️⃣",
    word: "이",
    category: "숫자",
    desc: "검지와 중지를 세운다.",
    level: 1,
  },
  {
    id: 11,
    emoji: "3️⃣",
    word: "삼",
    category: "숫자",
    desc: "검지, 중지, 약지를 세운다.",
    level: 1,
  },
  {
    id: 12,
    emoji: "5️⃣",
    word: "오",
    category: "숫자",
    desc: "다섯 손가락을 모두 편다.",
    level: 1,
  },
  // 장소
  {
    id: 13,
    emoji: "🏠",
    word: "집",
    category: "장소",
    desc: "두 손으로 지붕 모양을 만든다.",
    level: 1,
  },
  {
    id: 14,
    emoji: "🏫",
    word: "학교",
    category: "장소",
    desc: "손을 펼쳐 책을 여는 동작을 한다.",
    level: 2,
  },
  {
    id: 15,
    emoji: "🏥",
    word: "병원",
    category: "장소",
    desc: "오른 검지로 왼팔 위에 십자를 그린다.",
    level: 2,
  },
  {
    id: 16,
    emoji: "🚉",
    word: "기차역",
    category: "장소",
    desc: "두 검지를 나란히 아래로 당긴다.",
    level: 2,
  },
  // 음식
  {
    id: 17,
    emoji: "🍚",
    word: "밥",
    category: "음식",
    desc: "손가락을 모아 입으로 가져간다.",
    level: 1,
  },
  {
    id: 18,
    emoji: "💧",
    word: "물",
    category: "음식",
    desc: "W 손 모양으로 입에 댄다.",
    level: 1,
  },
  {
    id: 19,
    emoji: "🍎",
    word: "사과",
    category: "음식",
    desc: "주먹 쥔 손을 볼에 돌린다.",
    level: 2,
  },
  {
    id: 20,
    emoji: "☕",
    word: "커피",
    category: "음식",
    desc: "오른손 검지로 왼 손바닥에 원을 그린다.",
    level: 2,
  },
];

const CATEGORIES = [
  "전체",
  ...Array.from(new Set(SIGNS.map((s) => s.category))),
];

// ─── AI 피드백 시뮬레이션 ─────────────────────────────────────
const AI_TIPS: Record<string, string> = {
  안녕하세요:
    "손목을 자연스럽게 좌우로 흔들고, 시선은 상대방을 향하세요. 팔꿈치는 너무 높이 올리지 않는 것이 자연스럽습니다.",
  감사합니다:
    "두 손의 방향이 같도록 유지하고, 천천히 앞으로 내밀어 진심을 전달하세요.",
  기쁨: "표정도 함께 웃으면 더 자연스럽습니다. 손을 바깥으로 펼칠 때 밝고 경쾌하게 표현하세요.",
  default:
    "정확한 손 모양과 움직임이 중요합니다. 거울 앞에서 반복 연습하면 더 빠르게 습득할 수 있어요.",
};

async function fetchAIFeedback(word: string): Promise<string> {
  await new Promise((r) => setTimeout(r, 1200));
  return AI_TIPS[word] ?? AI_TIPS.default;
}

// ─── 스켈레톤 로딩 ───────────────────────────────────────────
function SkeletonLine({ short }: { short?: boolean }) {
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
      style={[sk.line, short && sk.short, { backgroundColor: bg }]}
    />
  );
}
const sk = StyleSheet.create({
  line: { height: 9, borderRadius: 4, marginBottom: 5, width: "100%" },
  short: { width: "60%" },
});

// ─── AI 피드백 박스 ───────────────────────────────────────────
function AIFeedbackBox({ word, trigger }: { word: string; trigger: number }) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [text, setText] = useState("");

  useEffect(() => {
    if (!word || trigger === 0) {
      setState("idle");
      return;
    }
    setState("loading");
    fetchAIFeedback(word).then((t) => {
      setText(t);
      setState("done");
    });
  }, [trigger]);

  const hasContent = state === "done";

  return (
    <View
      style={[
        fb.box,
        hasContent && fb.boxActive,
        state === "loading" && fb.boxLoading,
      ]}
    >
      <View style={fb.header}>
        <Text style={fb.icon}>🤖</Text>
        <Text style={fb.title}>AI 피드백</Text>
        {state === "loading" && <View style={fb.dot} />}
      </View>
      {state === "idle" && (
        <Text style={fb.placeholder}>
          수어를 선택하면 AI 피드백이 표시됩니다.
        </Text>
      )}
      {state === "loading" && (
        <>
          <SkeletonLine />
          <SkeletonLine short />
        </>
      )}
      {state === "done" && <Text style={fb.text}>{text}</Text>}
    </View>
  );
}
const fb = StyleSheet.create({
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

// ─── 카테고리 필터 탭 ─────────────────────────────────────────
function CatTabs({
  cats,
  active,
  onChange,
  counts,
}: {
  cats: string[];
  active: string;
  onChange: (c: string) => void;
  counts?: Record<string, number>;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={ct.row}
    >
      {cats.map((c) => (
        <TouchableOpacity
          key={c}
          style={[ct.tab, active === c && ct.tabActive]}
          onPress={() => onChange(c)}
          activeOpacity={0.75}
        >
          <Text style={[ct.tabTxt, active === c && ct.tabTxtActive]}>{c}</Text>
          {counts && (
            <Text style={[ct.count, active === c && ct.countActive]}>
              {counts[c] ?? 0}
            </Text>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
const ct = StyleSheet.create({
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

// ══════════════════════════════════════════════════════════════
//  📖 학습 모드 (LearnMode)
// ══════════════════════════════════════════════════════════════
function LearnMode() {
  const [cat, setCat] = useState("전체");
  const [selected, setSelected] = useState<(typeof SIGNS)[0] | null>(null);
  const [aiFeedback, setAiFeedback] = useState(0);

  const filtered = SIGNS.filter((s) => cat === "전체" || s.category === cat);
  const counts = CATEGORIES.reduce(
    (acc, c) => {
      acc[c] =
        c === "전체"
          ? SIGNS.length
          : SIGNS.filter((s) => s.category === c).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <View>
      <CatTabs
        cats={CATEGORIES}
        active={cat}
        onChange={(c) => {
          setCat(c);
          setSelected(null);
        }}
        counts={counts}
      />

      {/* 수어 카드 그리드 */}
      <View style={lm.grid}>
        {filtered.map((sign) => (
          <TouchableOpacity
            key={sign.id}
            style={[lm.card, selected?.id === sign.id && lm.cardActive]}
            onPress={() => {
              setSelected(sign);
              setAiFeedback((v) => v + 1);
            }}
            activeOpacity={0.75}
          >
            <Text style={lm.cardEmoji}>{sign.emoji}</Text>
            <Text style={lm.cardWord}>{sign.word}</Text>
            <View
              style={[
                lm.level,
                { backgroundColor: sign.level === 1 ? "#e8fff4" : "#fff8e0" },
              ]}
            >
              <Text
                style={[
                  lm.levelTxt,
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
        <View style={lm.detail}>
          <View style={lm.detailTop}>
            <Text style={lm.detailEmoji}>{selected.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={lm.detailWord}>{selected.word}</Text>
              <Text style={lm.detailCat}>{selected.category}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelected(null)}>
              <Text style={lm.detailClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={lm.detailDesc}>
            <Text style={lm.detailDescLabel}>동작 설명</Text>
            <Text style={lm.detailDescTxt}>{selected.desc}</Text>
          </View>
          <AIFeedbackBox word={selected.word} trigger={aiFeedback} />
        </View>
      )}
    </View>
  );
}
const lm = StyleSheet.create({
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
  detailDesc: { backgroundColor: "#f5f5fa", borderRadius: 10, padding: 12 },
  detailDescLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: C.muted,
    marginBottom: 5,
  },
  detailDescTxt: { fontSize: 14, color: C.text, lineHeight: 22 },
});

// ══════════════════════════════════════════════════════════════
//  🤟 연습 모드 (PracticeMode)
// ══════════════════════════════════════════════════════════════
type HistoryItem = { word: string; chosen: string; ok: boolean; time: string };

function PracticeMode() {
  const [cat, setCat] = useState("전체");
  const [count, setCount] = useState(4);
  const [current, setCurrent] = useState<(typeof SIGNS)[0] | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [chosen, setChosen] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [score, setScore] = useState({ ok: 0, fail: 0 });
  const [aiFeedback, setAiFeedback] = useState(0);

  const pool = SIGNS.filter((s) => cat === "전체" || s.category === cat);

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
  }, [pool, count]);

  useEffect(() => {
    nextQuestion();
  }, [cat, count]);

  const handleChoice = (c: string) => {
    if (chosen) return;
    setChosen(c);
    const ok = c === current!.word;
    setScore((s) => (ok ? { ...s, ok: s.ok + 1 } : { ...s, fail: s.fail + 1 }));
    const now = new Date().toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setHistory((h) =>
      [{ word: current!.word, chosen: c, ok, time: now }, ...h].slice(0, 8),
    );
    if (!ok) setAiFeedback((v) => v + 1);
    setTimeout(() => nextQuestion(), 1000);
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
        cats={CATEGORIES}
        active={cat}
        onChange={(c) => {
          setCat(c);
          setScore({ ok: 0, fail: 0 });
          setHistory([]);
        }}
      />

      {/* 옵션 바 */}
      <View style={pm.optBar}>
        <Text style={pm.optLabel}>보기 수</Text>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {[2, 4, 6].map((n) => (
            <TouchableOpacity
              key={n}
              style={[pm.pill, count === n && pm.pillActive]}
              onPress={() => setCount(n)}
              activeOpacity={0.75}
            >
              <Text style={[pm.pillTxt, count === n && pm.pillTxtActive]}>
                {n}개
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 점수 */}
      {total > 0 && (
        <View style={pm.scoreRow}>
          <View style={pm.scoreBadge}>
            <Text style={pm.scoreTxt}>✅ {score.ok}</Text>
          </View>
          <View
            style={[
              pm.scoreBadge,
              { borderColor: "#fca5a5", backgroundColor: "#fff5f5" },
            ]}
          >
            <Text style={[pm.scoreTxt, { color: C.red }]}>❌ {score.fail}</Text>
          </View>
          <View
            style={[
              pm.scoreBadge,
              {
                borderColor: "rgba(124,111,255,.3)",
                backgroundColor: "rgba(124,111,255,.06)",
              },
            ]}
          >
            <Text style={[pm.scoreTxt, { color: C.accent }]}>
              정답률 {acc}%
            </Text>
          </View>
        </View>
      )}

      {/* 문제 카드 */}
      <View style={pm.qCard}>
        <Text style={pm.qEmoji}>{current.emoji}</Text>
        <Text style={pm.qWord}>{current.word}</Text>
        <Text style={pm.qDesc}>{current.desc}</Text>
      </View>

      {/* 보기 */}
      <View style={pm.choicesGrid}>
        {choices.map((c) => {
          const isChosen = chosen === c;
          const isAnswer = c === current.word;
          let style = pm.choice;
          if (isChosen && isAnswer) style = { ...pm.choice, ...pm.choiceOk };
          if (isChosen && !isAnswer) style = { ...pm.choice, ...pm.choiceFail };
          if (!isChosen && chosen && isAnswer)
            style = { ...pm.choice, ...pm.choiceOk };
          return (
            <TouchableOpacity
              key={c}
              style={style}
              onPress={() => handleChoice(c)}
              disabled={!!chosen}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  pm.choiceTxt,
                  isChosen && isAnswer && { color: "#fff" },
                  isChosen && !isAnswer && { color: "#fff" },
                ]}
              >
                {c}
              </Text>
              {isChosen && (
                <Text style={{ fontSize: 14 }}>{isAnswer ? " ✓" : " ✗"}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 오답 피드백 */}
      {chosen && chosen !== current.word && (
        <View style={pm.feedWrap}>
          <AIFeedbackBox word={current.word} trigger={aiFeedback} />
        </View>
      )}

      {/* 히스토리 */}
      {history.length > 0 && (
        <View style={pm.histWrap}>
          <Text style={pm.histTitle}>최근 기록</Text>
          {history.map((h, i) => (
            <View key={i} style={pm.histRow}>
              <Text style={pm.histLabel}>{h.word}</Text>
              {!h.ok && (
                <Text style={pm.histChosen} numberOfLines={1}>
                  {h.chosen}
                </Text>
              )}
              <Text style={pm.histTime}>{h.time}</Text>
              <Text style={[pm.histResult, h.ok ? pm.histOk : pm.histFail]}>
                {h.ok ? "✓" : "✗"}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
const pm = StyleSheet.create({
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
  scoreTxt: { fontSize: 13, fontWeight: "700", color: C.green },
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
  },
  choiceOk: { backgroundColor: C.green, borderColor: C.green },
  choiceFail: { backgroundColor: C.red, borderColor: C.red },
  choiceTxt: { fontSize: 15, fontWeight: "700", color: C.text },
  feedWrap: { paddingHorizontal: 14, marginBottom: 14 },
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

// ══════════════════════════════════════════════════════════════
//  📷 카메라 모드 (GestureCheck 대체)
// ══════════════════════════════════════════════════════════════
function CameraMode() {
  const [active, setActive] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ]),
    ).start();
    // 인식 시뮬레이션
    const timer = setTimeout(() => {
      const pick = SIGNS[Math.floor(Math.random() * SIGNS.length)];
      setResult(pick.word);
    }, 2500);
    return () => clearTimer(timer);
  }, [active]);

  function clearTimer(t: ReturnType<typeof setTimeout>) {
    clearTimeout(t);
  }

  const handleStart = () => {
    setActive(true);
    setResult(null);
  };
  const handleStop = () => {
    setActive(false);
    pulse.setValue(1);
  };

  return (
    <View style={cam.wrap}>
      {/* 카메라 뷰 */}
      <View style={cam.vidBox}>
        {active ? (
          <View style={cam.camActive}>
            <Animated.Text
              style={[cam.camEmoji, { transform: [{ scale: pulse }] }]}
            >
              🤟
            </Animated.Text>
            <Text style={cam.camHint}>수어를 카메라에 보여주세요</Text>
            <Text style={cam.camSub}>실제 앱에서 expo-camera로 교체</Text>
            {result && (
              <View style={cam.resultOverlay}>
                <Text style={cam.resultEmoji}>
                  {SIGNS.find((s) => s.word === result)?.emoji}
                </Text>
                <Text style={cam.resultWord}>{result}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={cam.camIdle}>
            <Text style={{ fontSize: 48 }}>📷</Text>
            <Text style={cam.idleTxt}>카메라 인식 모드</Text>
            <Text style={cam.idleSub}>
              MediaPipe 기반 실시간 수어 인식{"\n"}(실제 기기에서 사용 가능)
            </Text>
          </View>
        )}
      </View>

      {/* 컨트롤 */}
      <View style={cam.controls}>
        {!active ? (
          <TouchableOpacity
            style={cam.startBtn}
            onPress={handleStart}
            activeOpacity={0.85}
          >
            <Text style={cam.startBtnTxt}>📷 카메라 시작</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={cam.stopBtn}
            onPress={handleStop}
            activeOpacity={0.85}
          >
            <Text style={cam.stopBtnTxt}>⏹ 중지</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 인식 결과 */}
      {result && (
        <View style={cam.resultCard}>
          <Text style={cam.resultCardLabel}>🎯 인식 결과</Text>
          <View style={cam.resultCardRow}>
            <Text style={{ fontSize: 36 }}>
              {SIGNS.find((s) => s.word === result)?.emoji}
            </Text>
            <View>
              <Text style={cam.resultCardWord}>{result}</Text>
              <Text style={cam.resultCardCat}>
                {SIGNS.find((s) => s.word === result)?.category}
              </Text>
            </View>
          </View>
          <Text style={cam.resultCardDesc}>
            {SIGNS.find((s) => s.word === result)?.desc}
          </Text>
        </View>
      )}

      {/* 안내 */}
      <View style={cam.infoBox}>
        <Text style={cam.infoTitle}>📌 사용 방법</Text>
        {[
          "카메라 시작 버튼을 눌러 인식을 시작합니다.",
          "카메라 앞에 손을 위치시키고 수어를 표현합니다.",
          "AI가 실시간으로 수어를 인식하여 텍스트로 변환합니다.",
          "인식된 결과는 하단에 표시됩니다.",
        ].map((t, i) => (
          <View key={i} style={cam.infoRow}>
            <Text style={cam.infoNum}>{i + 1}</Text>
            <Text style={cam.infoTxt}>{t}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
const cam = StyleSheet.create({
  wrap: { padding: 14, gap: 14 },
  vidBox: {
    width: "100%",
    aspectRatio: 4 / 3,
    backgroundColor: "#0d0d1a",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#1e1e3a",
  },
  camActive: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#0a0a18",
  },
  camEmoji: { fontSize: 64 },
  camHint: { fontSize: 15, color: "#c0c0ff", fontWeight: "700" },
  camSub: { fontSize: 11, color: "#606080" },
  camIdle: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  idleTxt: { fontSize: 18, fontWeight: "900", color: "#aaa" },
  idleSub: { fontSize: 12, color: "#666", textAlign: "center", lineHeight: 20 },
  resultOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(124,111,255,0.85)",
    padding: 14,
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
  },
  resultEmoji: { fontSize: 28 },
  resultWord: { fontSize: 20, fontWeight: "900", color: "#fff" },
  controls: { alignItems: "center" },
  startBtn: {
    paddingHorizontal: 34,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: C.accent,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  startBtnTxt: { fontSize: 15, fontWeight: "700", color: "#fff" },
  stopBtn: {
    paddingHorizontal: 34,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: C.red,
  },
  stopBtnTxt: { fontSize: 15, fontWeight: "700", color: "#fff" },
  resultCard: {
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: "rgba(124,111,255,.3)",
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  resultCardLabel: { fontSize: 12, fontWeight: "700", color: C.accent },
  resultCardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  resultCardWord: { fontSize: 20, fontWeight: "900", color: C.text },
  resultCardCat: { fontSize: 12, color: C.sub },
  resultCardDesc: { fontSize: 13, color: C.sub, lineHeight: 20 },
  infoBox: {
    backgroundColor: "#f9f9fc",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: C.text,
    marginBottom: 4,
  },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  infoNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.accent,
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 20,
    flexShrink: 0,
  },
  infoTxt: { fontSize: 13, color: C.sub, flex: 1, lineHeight: 20 },
});

// ══════════════════════════════════════════════════════════════
//  🤖 AI 시험 모드 (AITestMode)
// ══════════════════════════════════════════════════════════════
type AIPhase = "setup" | "question" | "result";
interface AIQItem {
  sign: (typeof SIGNS)[0];
  userInput: string;
  ok: boolean;
  feedback: string;
}

function AITestMode() {
  const [cat, setCat] = useState("전체");
  const [total, setTotal] = useState(5);
  const [phase, setPhase] = useState<AIPhase>("setup");
  const [queue, setQueue] = useState<(typeof SIGNS)[0][]>([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [results, setResults] = useState<AIQItem[]>([]);
  const [loading, setLoading] = useState(false);

  const pool = SIGNS.filter((s) => cat === "전체" || s.category === cat);

  const startTest = () => {
    const q = [...pool]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(total, pool.length));
    setQueue(q);
    setIdx(0);
    setResults([]);
    setInput("");
    setPhase("question");
  };

  const handleAnswer = async () => {
    if (!input.trim()) return;
    setLoading(true);
    const sign = queue[idx];
    const ok = input.trim() === sign.word || sign.desc.includes(input.trim());
    const fb = await fetchAIFeedback(sign.word);
    const item: AIQItem = { sign, userInput: input.trim(), ok, feedback: fb };
    const next = [...results, item];
    setResults(next);
    setLoading(false);
    setInput("");

    if (idx + 1 >= queue.length) setPhase("result");
    else setIdx((i) => i + 1);
  };

  // ── 설정 화면 ──
  if (phase === "setup")
    return (
      <View style={at.wrap}>
        <CatTabs cats={CATEGORIES} active={cat} onChange={setCat} />
        <View style={at.optBar}>
          <Text style={at.optLabel}>문제 수</Text>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {[3, 5, 10].map((n) => (
              <TouchableOpacity
                key={n}
                style={[at.pill, total === n && at.pillActive]}
                onPress={() => setTotal(n)}
                activeOpacity={0.75}
              >
                <Text style={[at.pillTxt, total === n && at.pillTxtActive]}>
                  {n}문제
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={at.infoRow}>
          {[
            {
              icon: "🤖",
              title: "AI 채점",
              desc: "수어 설명을 입력하면 AI가 정오를 판단합니다.",
            },
            {
              icon: "💬",
              title: "즉시 피드백",
              desc: "틀린 경우 AI가 올바른 동작을 설명해 줍니다.",
            },
            {
              icon: "📊",
              title: "결과 분석",
              desc: "시험 후 카테고리별 성취도를 확인할 수 있습니다.",
            },
          ].map((b) => (
            <View key={b.title} style={at.infoCard}>
              <Text style={{ fontSize: 28 }}>{b.icon}</Text>
              <Text style={at.infoCardTitle}>{b.title}</Text>
              <Text style={at.infoCardDesc}>{b.desc}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          style={at.startBtn}
          onPress={startTest}
          activeOpacity={0.85}
        >
          <Text style={at.startBtnTxt}>🤖 AI 시험 시작</Text>
        </TouchableOpacity>
      </View>
    );

  // ── 결과 화면 ──
  if (phase === "result") {
    const correct = results.filter((r) => r.ok).length;
    const acc = Math.round((correct / results.length) * 100);
    return (
      <ScrollView contentContainerStyle={at.wrap}>
        <View style={at.resultHero}>
          <Text style={at.resultScore}>{acc}점</Text>
          <Text style={at.resultSub}>
            {correct}/{results.length} 정답
          </Text>
          <Text style={at.resultMsg}>
            {acc >= 80
              ? "🎉 훌륭해요! 수어 실력이 많이 늘었네요."
              : acc >= 50
                ? "👍 잘 하고 있어요! 조금만 더 연습해봐요."
                : "💪 꾸준히 연습하면 반드시 실력이 늘어요!"}
          </Text>
        </View>
        {results.map((r, i) => (
          <View
            key={i}
            style={[at.resultCard, r.ok ? at.resultCardOk : at.resultCardFail]}
          >
            <View style={at.resultCardTop}>
              <Text style={{ fontSize: 24 }}>{r.sign.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={at.resultCardWord}>{r.sign.word}</Text>
                <Text style={at.resultCardAnswer}>내 답: {r.userInput}</Text>
              </View>
              <Text style={{ fontSize: 20 }}>{r.ok ? "✅" : "❌"}</Text>
            </View>
            {!r.ok && (
              <View style={at.resultFeedback}>
                <Text style={at.resultFeedbackTxt}>🤖 {r.feedback}</Text>
              </View>
            )}
          </View>
        ))}
        <TouchableOpacity
          style={at.startBtn}
          onPress={() => setPhase("setup")}
          activeOpacity={0.85}
        >
          <Text style={at.startBtnTxt}>다시 시험 보기</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── 문제 화면 ──
  const sign = queue[idx];
  return (
    <View style={at.wrap}>
      {/* 진행 바 */}
      <View style={at.progress}>
        <View
          style={[
            at.progressFill,
            { width: `${(idx / queue.length) * 100}%` as any },
          ]}
        />
      </View>
      <Text style={at.progressTxt}>
        {idx + 1} / {queue.length}
      </Text>

      {/* 문제 */}
      <View style={at.qCard}>
        <Text style={at.qEmoji}>{sign.emoji}</Text>
        <Text style={at.qDesc}>{sign.desc}</Text>
        <Text style={at.qHint}>이 수어는 무엇을 의미할까요?</Text>
      </View>

      {/* 입력 */}
      <View style={at.inputRow}>
        <TextInput
          style={at.input}
          placeholder="수어의 의미를 입력하세요..."
          placeholderTextColor="#ccc"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleAnswer}
          returnKeyType="done"
          editable={!loading}
        />
        <TouchableOpacity
          style={[at.submitBtn, (!input.trim() || loading) && { opacity: 0.4 }]}
          onPress={handleAnswer}
          disabled={!input.trim() || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={at.submitBtnTxt}>제출 →</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 이전 답 */}
      {results.length > 0 && (
        <View style={at.prevWrap}>
          <Text style={at.prevTitle}>이전 답변</Text>
          {results
            .slice(-2)
            .reverse()
            .map((r, i) => (
              <View
                key={i}
                style={[at.prevRow, r.ok ? at.prevOk : at.prevFail]}
              >
                <Text style={{ fontSize: 16 }}>{r.sign.emoji}</Text>
                <Text style={at.prevWord}>{r.sign.word}</Text>
                <Text style={at.prevAnswer}>{r.userInput}</Text>
                <Text>{r.ok ? "✅" : "❌"}</Text>
              </View>
            ))}
        </View>
      )}
    </View>
  );
}
const at = StyleSheet.create({
  wrap: { padding: 14, gap: 14 },
  optBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f9f9fc",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 14,
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
  infoRow: { flexDirection: "row", gap: 10 },
  infoCard: {
    flex: 1,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 8,
  },
  infoCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: C.text,
    textAlign: "center",
  },
  infoCardDesc: {
    fontSize: 11,
    color: C.sub,
    textAlign: "center",
    lineHeight: 18,
  },
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
  progress: {
    height: 6,
    backgroundColor: "#e8e8f0",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: C.accent, borderRadius: 6 },
  progressTxt: { fontSize: 12, color: C.sub, textAlign: "right" },
  qCard: {
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 18,
    padding: 28,
    alignItems: "center",
    gap: 12,
  },
  qEmoji: { fontSize: 64 },
  qDesc: { fontSize: 14, color: C.text, textAlign: "center", lineHeight: 22 },
  qHint: { fontSize: 12, color: C.muted, fontStyle: "italic" },
  inputRow: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: C.text,
    backgroundColor: C.card,
  },
  submitBtn: {
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 72,
  },
  submitBtnTxt: { fontSize: 14, fontWeight: "700", color: "#fff" },
  prevWrap: {
    backgroundColor: "#f9f9fc",
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  prevTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: C.muted,
    marginBottom: 2,
  },
  prevRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    borderRadius: 10,
  },
  prevOk: { backgroundColor: "rgba(16,185,129,.08)" },
  prevFail: { backgroundColor: "rgba(239,68,68,.06)" },
  prevWord: { fontSize: 13, fontWeight: "700", color: C.text, flex: 1 },
  prevAnswer: { fontSize: 12, color: C.sub, flex: 1 },
  resultHero: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 28,
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  resultScore: {
    fontSize: 56,
    fontWeight: "900",
    color: C.accent,
    letterSpacing: -2,
  },
  resultSub: { fontSize: 16, fontWeight: "700", color: C.sub },
  resultMsg: {
    fontSize: 14,
    color: C.text,
    textAlign: "center",
    lineHeight: 22,
  },
  resultCard: { borderRadius: 14, padding: 14, gap: 10, borderWidth: 1.5 },
  resultCardOk: {
    backgroundColor: "rgba(16,185,129,.05)",
    borderColor: "rgba(16,185,129,.2)",
  },
  resultCardFail: {
    backgroundColor: "rgba(239,68,68,.04)",
    borderColor: "rgba(239,68,68,.15)",
  },
  resultCardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  resultCardWord: { fontSize: 15, fontWeight: "700", color: C.text },
  resultCardAnswer: { fontSize: 12, color: C.sub },
  resultFeedback: {
    backgroundColor: "rgba(124,111,255,.06)",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(124,111,255,.15)",
  },
  resultFeedbackTxt: { fontSize: 13, color: "#444", lineHeight: 20 },
});

// ══════════════════════════════════════════════════════════════
//  메인 PracticeScreen
// ══════════════════════════════════════════════════════════════
const TABS = [
  { icon: "📖", label: "학습" },
  { icon: "🤟", label: "연습" },
  { icon: "📷", label: "카메라" },
  { icon: "🤖", label: "AI 시험" },
];

export default function PracticeScreen() {
  const [mode, setMode] = useState(0);

  return (
    <SafeAreaView style={s.safe}>
      {/* 페이지 헤더 */}
      <View style={s.pageHeader}>
        <Text style={s.pageTitle}>🤟 한국수어 학습센터</Text>
        <Text style={s.pageSub}>
          국립국어원 한국수어사전 기반 · {SIGNS.length}개 수어 학습 · AI 피드백
        </Text>
      </View>

      {/* 모드 탭 */}
      <View style={s.modeTabs}>
        {TABS.map(({ icon, label }, i) => (
          <TouchableOpacity
            key={label}
            style={[s.modeTab, mode === i && s.modeTabActive]}
            onPress={() => setMode(i)}
            activeOpacity={0.8}
          >
            <Text style={s.modeTabIcon}>{icon}</Text>
            <Text style={[s.modeTabTxt, mode === i && s.modeTabTxtActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 본문 */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {mode === 0 && <LearnMode />}
        {mode === 1 && <PracticeMode />}
        {mode === 2 && <CameraMode />}
        {mode === 3 && <AITestMode />}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f5fa" },

  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    alignItems: "center",
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: C.text,
    marginBottom: 5,
  },
  pageSub: { fontSize: 12, color: C.sub, textAlign: "center", lineHeight: 18 },

  modeTabs: {
    flexDirection: "row",
    marginHorizontal: 14,
    marginBottom: 12,
    backgroundColor: "#f0f0f5",
    borderRadius: 14,
    padding: 5,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 3,
  },
  modeTabActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  modeTabIcon: { fontSize: 16 },
  modeTabTxt: { fontSize: 11, fontWeight: "700", color: C.sub },
  modeTabTxtActive: { color: C.text },
});
