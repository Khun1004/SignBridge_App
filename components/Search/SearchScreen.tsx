// components/Search/SearchScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const C = {
  accent: "#7c6fff",
  accentLt: "#6c5ce7",
  text: "#1a1a2e",
  sub: "#666",
  border: "#e0dff8",
  bg: "#f5f3ff",
  surface: "#ece9ff",
  red: "#ef4444",
  green: "#10b981",
};

// ── 수어 데이터베이스 ──────────────────────────────────────────
interface SignWord {
  id: string;
  word: string;
  category: string;
  description: string;
  handShape: string; // 손 모양 설명
  movement: string; // 동작 설명
  expression: string; // 표정/비수지 설명
  tips: string; // 학습 팁
  related: string[]; // 관련 단어
  emoji: string;
}

const SIGN_DB: SignWord[] = [
  {
    id: "1",
    word: "안녕하세요",
    category: "인사",
    description:
      "상대방을 처음 만나거나 하루를 시작할 때 사용하는 기본 인사 표현입니다.",
    handShape: "오른손을 펴서 손바닥이 앞을 향하게 합니다",
    movement: "손을 이마 옆에서 앞으로 내밀며 가볍게 흔듭니다",
    expression: "밝고 친근한 표정, 눈 맞춤 유지",
    tips: "손을 너무 크게 흔들지 않고 자연스럽게 움직이는 것이 포인트입니다",
    related: ["안녕히 가세요", "안녕히 계세요", "반갑습니다"],
    emoji: "👋",
  },
  {
    id: "2",
    word: "감사합니다",
    category: "예절",
    description:
      "고마움을 표현할 때 사용하는 수어입니다. 일상에서 가장 많이 쓰이는 표현 중 하나입니다.",
    handShape: "오른손 손끝을 모아 입술 아래에 댑니다",
    movement: "손을 앞으로 뻗으며 약간 아래로 내립니다",
    expression:
      "진심 어린 표정, 가벼운 목례와 함께 사용하면 더욱 자연스럽습니다",
    tips: "손의 속도를 너무 빠르게 하지 말고 천천히 정성스럽게 표현하세요",
    related: ["고맙습니다", "죄송합니다", "괜찮습니다"],
    emoji: "🙏",
  },
  {
    id: "3",
    word: "도와주세요",
    category: "요청",
    description:
      "도움이 필요할 때 상대방에게 요청하는 표현입니다. 긴급 상황에서도 활용됩니다.",
    handShape: "왼손 주먹 위에 오른손 엄지를 올려 받칩니다",
    movement: "두 손을 함께 앞으로 내밀며 올립니다",
    expression: "간절하거나 급한 표정, 눈썹을 약간 올립니다",
    tips: "긴급할 때는 동작을 빠르고 크게, 일상적 요청은 작고 부드럽게 표현하세요",
    related: ["부탁합니다", "필요해요", "긴급"],
    emoji: "🤝",
  },
  {
    id: "4",
    word: "만나서 반갑습니다",
    category: "인사",
    description:
      "처음 만나는 사람에게 반가움을 표현하는 수어입니다. 공식적인 자리에서도 사용됩니다.",
    handShape: "양손을 가슴 앞에서 마주 보게 펼칩니다",
    movement: "양손을 가슴 중앙으로 모으듯 합장하며 살짝 흔듭니다",
    expression: "밝고 환한 미소, 상대방과 눈을 맞춥니다",
    tips: "악수하듯 자연스럽게 연결하면 더욱 자연스러운 표현이 됩니다",
    related: ["안녕하세요", "처음 뵙겠습니다", "반갑습니다"],
    emoji: "🤗",
  },
  {
    id: "5",
    word: "사랑합니다",
    category: "감정",
    description:
      "깊은 애정과 사랑을 표현하는 수어입니다. 가족, 친구, 연인 모두에게 사용할 수 있습니다.",
    handShape:
      "오른손 엄지·검지·소지를 펴고 나머지를 접습니다 (I Love You 핸드셰이프)",
    movement: "손을 가슴에서 상대방을 향해 부드럽게 내밉니다",
    expression: "따뜻하고 진심 어린 표정, 부드러운 눈빛",
    tips: "국제 수어에서도 통용되는 'ILY' 핸드셰이프로 표현하면 전 세계 농인에게 전달됩니다",
    related: ["좋아해요", "보고 싶어요", "행복해요"],
    emoji: "❤️",
  },
];

const RECENT_DUMMY = ["안녕하세요", "감사합니다", "도움", "사랑"];

interface SearchScreenProps {
  initialQuery?: string;
}

export default function SearchScreen({ initialQuery = "" }: SearchScreenProps) {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState(initialQuery);
  const [recent, setRecent] = useState<string[]>(RECENT_DUMMY);
  const [results, setResults] = useState<SignWord[]>([]);
  const [searched, setSearched] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  const suggestions = query.trim()
    ? SIGN_DB.filter(
        (s) =>
          s.word.toLowerCase().includes(query.toLowerCase()) ||
          s.category.includes(query),
      ).map((s) => s.word)
    : [];

  const handleSubmit = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setRecent((prev) => [t, ...prev.filter((r) => r !== t)].slice(0, 10));
    setQuery(t);
    const found = SIGN_DB.filter(
      (w) =>
        w.word.includes(t) ||
        w.category.includes(t) ||
        w.description.includes(t) ||
        w.related.some((r) => r.includes(t)),
    );
    setResults(found);
    setSearched(true);
    setExpandedId(null);
  };

  const handleReset = () => {
    setSearched(false);
    setResults([]);
    setQuery("");
    setExpandedId(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const removeRecent = (item: string) =>
    setRecent((prev) => prev.filter((r) => r !== item));

  const toggleExpand = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  // ── 검색 결과 뷰 ──────────────────────────────────────────────
  if (searched) {
    return (
      <ScrollView
        style={s.container}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* 입력 영역 */}
        <View style={s.inputWrap}>
          <Ionicons
            name="search"
            size={17}
            color={C.accent}
            style={s.leadIcon}
          />
          <TextInput
            ref={inputRef}
            style={s.input}
            placeholder="수어 단어를 검색하세요..."
            placeholderTextColor="#bbb"
            value={query}
            onChangeText={(v) => {
              setQuery(v);
              if (!v.trim()) {
                setSearched(false);
                setResults([]);
              }
            }}
            onSubmitEditing={() => handleSubmit(query)}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={handleReset} style={s.clearBtn}>
            <Ionicons name="close-circle" size={17} color="#bbb" />
          </TouchableOpacity>
          <TouchableOpacity
            style={s.searchBtn}
            onPress={() => handleSubmit(query)}
          >
            <Text style={s.searchBtnTxt}>검색</Text>
          </TouchableOpacity>
        </View>

        {/* 결과 수 */}
        <Text style={s.resultCount}>
          "{query}" 검색 결과 {results.length}개
        </Text>

        {/* 결과 카드 목록 */}
        {results.length > 0 ? (
          results.map((item) => (
            <View key={item.id} style={s.card}>
              {/* 카드 헤더 */}
              <TouchableOpacity
                style={s.cardHeader}
                onPress={() => toggleExpand(item.id)}
                activeOpacity={0.75}
              >
                <View style={s.cardHeaderLeft}>
                  <Text style={s.cardEmoji}>{item.emoji}</Text>
                  <View>
                    <Text style={s.cardWord}>{item.word}</Text>
                    <View style={s.categoryBadge}>
                      <Text style={s.categoryTxt}>{item.category}</Text>
                    </View>
                  </View>
                </View>
                <Ionicons
                  name={expandedId === item.id ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={C.accent}
                />
              </TouchableOpacity>

              {/* 기본 설명 */}
              <View style={s.cardBody}>
                <Text style={s.cardDesc}>{item.description}</Text>
              </View>

              {/* 펼쳐진 상세 내용 */}
              {expandedId === item.id && (
                <View style={s.cardDetail}>
                  <View style={s.detailDivider} />

                  <DetailRow
                    icon="hand-left-outline"
                    label="손 모양"
                    value={item.handShape}
                  />
                  <DetailRow
                    icon="swap-horizontal-outline"
                    label="동작"
                    value={item.movement}
                  />
                  <DetailRow
                    icon="happy-outline"
                    label="표정"
                    value={item.expression}
                  />
                  <DetailRow
                    icon="bulb-outline"
                    label="학습 팁"
                    value={item.tips}
                    accent
                  />

                  {/* 관련 단어 */}
                  <View style={s.relatedWrap}>
                    <Text style={s.relatedLabel}>관련 단어</Text>
                    <View style={s.relatedTags}>
                      {item.related.map((r) => (
                        <TouchableOpacity
                          key={r}
                          style={s.relatedTag}
                          onPress={() => handleSubmit(r)}
                          activeOpacity={0.7}
                        >
                          <Text style={s.relatedTagTxt}>{r}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={s.noResult}>
            <Ionicons name="search-outline" size={44} color="#d4ccff" />
            <Text style={s.noResultTitle}>"{query}" 검색 결과가 없습니다</Text>
            <Text style={s.noResultSub}>
              다른 단어로 검색하거나{"\n"}수어 사전을 이용해 보세요
            </Text>
          </View>
        )}

        {/* 수어 사전 안내 배너 */}
        <DictBanner
          query={query}
          onPress={() =>
            router.navigate({
              pathname: "/(tabs)/dictionary" as any,
              params: { q: query },
            })
          }
        />
      </ScrollView>
    );
  }

  // ── 기본 뷰 ────────────────────────────────────────────────────
  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      {/* 입력 영역 */}
      <View style={s.inputWrap}>
        <Ionicons name="search" size={17} color={C.accent} style={s.leadIcon} />
        <TextInput
          ref={inputRef}
          style={s.input}
          placeholder="수어 단어를 검색하세요..."
          placeholderTextColor="#bbb"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => handleSubmit(query)}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")} style={s.clearBtn}>
            <Ionicons name="close-circle" size={17} color="#bbb" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={s.searchBtn}
          onPress={() => handleSubmit(query)}
        >
          <Text style={s.searchBtnTxt}>검색</Text>
        </TouchableOpacity>
      </View>

      {/* 수어 사전 상시 안내 배너 */}
      <DictBanner
        onPress={() => router.navigate("/(tabs)/dictionary" as any)}
      />

      {/* 자동완성 */}
      {suggestions.length > 0 && (
        <View style={s.section}>
          {suggestions.map((item) => (
            <TouchableOpacity
              key={item}
              style={s.suggRow}
              onPress={() => handleSubmit(item)}
              activeOpacity={0.7}
            >
              <Ionicons name="search-outline" size={14} color={C.accent} />
              <Text style={s.suggTxt}>{item}</Text>
              <TouchableOpacity
                onPress={() => setQuery(item)}
                style={s.fillBtn}
              >
                <Ionicons name="arrow-back-outline" size={14} color="#bbb" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 최근 검색어 */}
      {query.length === 0 && recent.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>최근 검색어</Text>
            <TouchableOpacity onPress={() => setRecent([])}>
              <Text style={s.clearAll}>전체 삭제</Text>
            </TouchableOpacity>
          </View>
          {recent.map((item) => (
            <TouchableOpacity
              key={item}
              style={s.recentRow}
              onPress={() => handleSubmit(item)}
              activeOpacity={0.7}
            >
              <Ionicons name="time-outline" size={14} color="#bbb" />
              <Text style={s.recentTxt}>{item}</Text>
              <TouchableOpacity
                onPress={() => removeRecent(item)}
                style={s.removeBtn}
              >
                <Ionicons name="close" size={14} color="#bbb" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 빠른 검색 추천 */}
      {query.length === 0 && (
        <View style={s.quickWrap}>
          <Text style={s.quickTitle}>자주 찾는 수어</Text>
          <View style={s.quickGrid}>
            {SIGN_DB.map((w) => (
              <TouchableOpacity
                key={w.id}
                style={s.quickChip}
                onPress={() => handleSubmit(w.word)}
                activeOpacity={0.75}
              >
                <Text style={s.quickEmoji}>{w.emoji}</Text>
                <Text style={s.quickWord}>{w.word}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* 빈 상태 */}
      {query.length === 0 && recent.length === 0 && (
        <View style={s.empty}>
          <Ionicons name="search-outline" size={48} color="#d4ccff" />
          <Text style={s.emptyTxt}>검색어를 입력해 보세요</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ── 공통 컴포넌트 ────────────────────────────────────────────────

function DetailRow({
  icon,
  label,
  value,
  accent,
}: {
  icon: any;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={ds.row}>
      <View style={[ds.iconWrap, accent && ds.iconWrapAccent]}>
        <Ionicons name={icon} size={14} color={accent ? "#fff" : C.accent} />
      </View>
      <View style={ds.texts}>
        <Text style={ds.label}>{label}</Text>
        <Text style={ds.value}>{value}</Text>
      </View>
    </View>
  );
}

function DictBanner({
  query,
  onPress,
}: {
  query?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={s.dictBanner}
      activeOpacity={0.82}
      onPress={onPress}
    >
      <View style={s.dictBannerLeft}>
        <Ionicons name="book-outline" size={22} color={C.accent} />
        <View style={s.dictBannerTexts}>
          <Text style={s.dictBannerTitle}>수어 사전</Text>
          <Text style={s.dictBannerSub}>
            수어 사전에서도 궁금한 수어 기능들이 있습니다
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={C.accent} />
    </TouchableOpacity>
  );
}

// ── 스타일 ────────────────────────────────────────────────────────

const ds = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  iconWrapAccent: { backgroundColor: C.accent },
  texts: { flex: 1 },
  label: { fontSize: 11, fontWeight: "700", color: C.sub, marginBottom: 2 },
  value: { fontSize: 13, color: C.text, lineHeight: 18 },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingBottom: 40 },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: C.accent,
    borderRadius: 12,
    margin: 16,
    marginTop: 12,
    overflow: "hidden",
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  leadIcon: { paddingLeft: 12 },
  input: {
    flex: 1,
    paddingVertical: 11,
    paddingLeft: 8,
    paddingRight: 4,
    fontSize: 14,
    color: C.text,
  },
  clearBtn: { paddingHorizontal: 8 },
  searchBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: C.accent,
  },
  searchBtnTxt: { fontSize: 13, fontWeight: "700", color: "#fff" },

  resultCount: {
    fontSize: 12,
    color: C.sub,
    marginHorizontal: 16,
    marginBottom: 10,
  },

  // 결과 카드
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.border,
    overflow: "hidden",
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardEmoji: { fontSize: 28 },
  cardWord: { fontSize: 16, fontWeight: "800", color: C.text, marginBottom: 4 },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: C.surface,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  categoryTxt: { fontSize: 10, fontWeight: "700", color: C.accentLt },
  cardBody: {
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  cardDesc: { fontSize: 13, color: C.sub, lineHeight: 19 },

  // 상세
  cardDetail: { backgroundColor: "#faf9ff" },
  detailDivider: {
    height: 1,
    backgroundColor: C.border,
    marginHorizontal: 14,
    marginBottom: 4,
  },
  relatedWrap: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  relatedLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: C.sub,
    marginBottom: 8,
  },
  relatedTags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  relatedTag: {
    backgroundColor: C.surface,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#c4b5fd",
  },
  relatedTagTxt: { fontSize: 12, fontWeight: "600", color: C.accentLt },

  // 수어 사전 배너
  dictBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#c4b5fd",
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  dictBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  dictBannerTexts: { flex: 1, gap: 2 },
  dictBannerTitle: { fontSize: 14, fontWeight: "700", color: C.accent },
  dictBannerSub: { fontSize: 12, color: C.sub, lineHeight: 17 },

  // 섹션
  section: {
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 12,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: C.sub,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  clearAll: { fontSize: 12, color: C.red },
  suggRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0eeff",
  },
  suggTxt: { flex: 1, fontSize: 14, color: C.text },
  fillBtn: { padding: 4 },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0eeff",
  },
  recentTxt: { flex: 1, fontSize: 14, color: C.text },
  removeBtn: { padding: 4 },

  // 빠른 검색
  quickWrap: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  quickTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: C.sub,
    marginBottom: 10,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#c4b5fd",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  quickEmoji: { fontSize: 16 },
  quickWord: { fontSize: 13, fontWeight: "600", color: C.accentLt },

  // 빈/결과없음
  empty: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 60,
    paddingBottom: 80,
  },
  emptyTxt: { fontSize: 14, color: "#bbb" },
  noResult: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingTop: 40,
    paddingBottom: 40,
  },
  noResultTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: C.text,
    textAlign: "center",
  },
  noResultSub: {
    fontSize: 13,
    color: C.sub,
    textAlign: "center",
    lineHeight: 20,
  },
});
