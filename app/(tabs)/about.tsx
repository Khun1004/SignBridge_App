import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─── 색상 토큰 (About.css :root 변수) ────────────────────────────────────────
const C = {
  bg: "#f5f4f0",
  surface: "#ffffff",
  ink: "#0d0d0d",
  dim: "#6b6b6b",
  muted: "#a8a8a8",
  border: "#e4e2dc",
  accent: "#6366f1",
  accent2: "#a855f7",
};

// ─── 데이터 ───────────────────────────────────────────────────────────────────
const STATS = [
  { value: 337, suffix: "만+", label: "국내 청각장애인" },
  { value: 98, suffix: "%", label: "수어 인식 정확도" },
  { value: 500, suffix: "+", label: "수어 사전 단어" },
  { value: 10, suffix: "+", label: "연계 공공기관" },
];

const FEATURES = [
  {
    icon: "⚡",
    badge: "0.3초",
    title: "실시간 번역",
    desc: "고도화된 AI 모델로 수어를 즉각적으로 텍스트로 변환합니다.",
  },
  {
    icon: "🧠",
    badge: "98%",
    title: "인식 정확도",
    desc: "수천 시간의 학습 데이터로 정밀 수어 인식을 구현했습니다.",
  },
  {
    icon: "📚",
    badge: "500+",
    title: "수어 사전",
    desc: "표준 수어 및 일상 수어 500가지 이상을 DB로 보유합니다.",
  },
  {
    icon: "🏛️",
    badge: "10+",
    title: "연계 기관",
    desc: "공항, 병원, 경찰서 등 10개 이상의 공공기관과 협력합니다.",
  },
  {
    icon: "🌐",
    badge: "3개",
    title: "지원 언어",
    desc: "한국수어, 미국수어(ASL), 국제수어(ISL)를 지원합니다.",
  },
  {
    icon: "🔒",
    badge: "100%",
    title: "보안 기록",
    desc: "모든 대화 기록은 암호화되어 법적 증거로 활용 가능합니다.",
  },
];

const TIMELINE = [
  {
    year: "2024.01",
    title: "프로젝트 시작",
    desc: "청각장애인 소통 문제 연구 및 아이디어 발굴",
  },
  {
    year: "2024.06",
    title: "AI 모델 v1 완성",
    desc: "한국수어 50개 단어 실시간 인식 달성",
  },
  {
    year: "2024.10",
    title: "파일럿 테스트",
    desc: "인천공항 출입국사무소와 시범 운영 시작",
  },
  {
    year: "2025.01",
    title: "SignBridge 정식 출시",
    desc: "앱 공개 및 공공기관 연계 서비스 확장",
  },
  {
    year: "2025.06",
    title: "글로벌 확장",
    desc: "국제수어(ISL) 지원 및 해외 기관 파트너십",
  },
];

const TEAM = [
  {
    emoji: "👑",
    name: "쿤산",
    role: "Team Lead · Full Stack",
    desc: "AI 수어 번역 시스템 설계, 개발, 기획 전반을 총괄합니다.",
  },
  {
    emoji: "🤝",
    name: "토야",
    role: "Full Stack · Design",
    desc: "UI/UX 디자인부터 프론트엔드·백엔드 개발까지 함께합니다.",
  },
];

// ─── 숫자 카운트업 훅 ─────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1800, active = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, active]);
  return count;
}

// ─── 페이드+슬라이드인 훅 ────────────────────────────────────────────────────
function useFadeIn(delay = 0) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  const start = () =>
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 650,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 650,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  return { opacity, translateY, start };
}

// ─── 손 흔들기 이모지 ─────────────────────────────────────────────────────────
function WaveSign({ size = 52 }: { size?: number }) {
  const rot = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(rot, {
          toValue: 1,
          duration: 550,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(rot, {
          toValue: -1,
          duration: 550,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(rot, {
          toValue: 0,
          duration: 550,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ]),
    ).start();
  }, []);
  const rotate = rot.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-15deg", "0deg", "15deg"],
  });
  return (
    <Animated.Text style={{ fontSize: size, transform: [{ rotate }] }}>
      🤟
    </Animated.Text>
  );
}

// ─── 통계 아이템 ─────────────────────────────────────────────────────────────
function StatItem({
  value,
  suffix,
  label,
  active,
}: {
  value: number;
  suffix: string;
  label: string;
  active: boolean;
}) {
  const count = useCountUp(value, 1600, active);
  return (
    <View style={s.statItem}>
      <Text style={s.statNumber}>
        {count}
        {suffix}
      </Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────
export default function AboutScreen() {
  const [statsActive, setStatsActive] = useState(false);
  const hero = useFadeIn(0);
  const mission = useFadeIn(0);
  const feat = useFadeIn(0);
  const tl = useFadeIn(0);
  const team = useFadeIn(0);
  const cta = useFadeIn(0);

  useEffect(() => {
    hero.start();
    const t1 = setTimeout(() => {
      setStatsActive(true);
      mission.start();
    }, 200);
    const t2 = setTimeout(() => feat.start(), 450);
    const t3 = setTimeout(() => tl.start(), 700);
    const t4 = setTimeout(() => team.start(), 900);
    const t5 = setTimeout(() => cta.start(), 1100);
    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout);
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ══ HERO ══ */}
        <View style={s.hero}>
          <View style={[s.heroDeco, s.deco1]} />
          <View style={[s.heroDeco, s.deco2]} />
          <Animated.View
            style={[
              s.heroInner,
              {
                opacity: hero.opacity,
                transform: [{ translateY: hero.translateY }],
              },
            ]}
          >
            <View style={s.eyebrow}>
              <View style={s.eyebrowDot} />
              <Text style={s.eyebrowText}>AI 수어 번역 플랫폼</Text>
            </View>
            <Text style={s.heroLine1}>언어의</Text>
            <Text style={s.heroLine2}>장벽을</Text>
            <Text style={s.heroLine3}>허뭅니다</Text>
            <Text style={s.heroSub}>
              SignBridge는 인공지능 기술을 통해{"\n"}
              농인과 청인 사이의 자유로운 소통을 돕는{"\n"}
              수어 다리를 만듭니다.
            </Text>
            <WaveSign size={52} />
          </Animated.View>
        </View>

        {/* ══ 통계 ══ */}
        <View style={s.statsSection}>
          <View style={s.statsGrid}>
            {STATS.map((st, i) => (
              <React.Fragment key={st.label}>
                <StatItem
                  value={st.value}
                  suffix={st.suffix}
                  label={st.label}
                  active={statsActive}
                />
                {i < STATS.length - 1 && <View style={s.statsDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ══ 미션 ══ */}
        <Animated.View
          style={[
            s.missionSection,
            {
              opacity: mission.opacity,
              transform: [{ translateY: mission.translateY }],
            },
          ]}
        >
          <Text style={s.missionLabel}>Our Mission</Text>
          <Text style={s.missionQuote}>
            {'"단순한 번역을 넘어,\n누구나 자신의 언어로\n세상과 연결되는\n'}
            <Text style={s.missionAccent}>디지털 환경</Text>
            {'을 구축합니다."'}
          </Text>
          <Text style={s.missionBody}>
            한국에는 약 337만 명의 청각장애인이 있습니다. 하지만 공항, 병원,
            경찰서 같은 공공 공간에서 전문 수어 통역사를 구하기는 쉽지 않습니다.
            SignBridge는 AI 기술로 그 빈자리를 채웁니다.
          </Text>
          {/* 브릿지 비주얼 */}
          <View style={s.bridgeRow}>
            <View style={[s.bridgeCard, s.bridgeCardLeft]}>
              <Text style={s.bridgeCardEmoji}>🧏</Text>
              <Text style={s.bridgeCardLabel}>농인</Text>
            </View>
            <View style={s.bridgeCenter}>
              <View style={s.bridgeLine} />
              <View style={s.bridgeIconBox}>
                <Text style={s.bridgeIconText}>🤖</Text>
              </View>
              <Text style={s.bridgeAILabel}>AI</Text>
              <View style={s.bridgeLine} />
            </View>
            <View style={[s.bridgeCard, s.bridgeCardRight]}>
              <Text style={s.bridgeCardEmoji}>🙋</Text>
              <Text style={s.bridgeCardLabel}>청인</Text>
            </View>
          </View>
        </Animated.View>

        {/* ══ 특징 ══ */}
        <View style={s.featuresSection}>
          <Animated.View
            style={{
              opacity: feat.opacity,
              transform: [{ translateY: feat.translateY }],
            }}
          >
            <Text style={s.sectionTagLight}>Why SignBridge?</Text>
            <Text style={s.sectionTitleLight}>
              기술이 만드는{"\n"}소통의 혁신
            </Text>
            <View style={s.featuresGrid}>
              {FEATURES.map((f) => (
                <View key={f.title} style={s.featureCard}>
                  <View style={s.featureTop}>
                    <Text style={s.featureIcon}>{f.icon}</Text>
                    <View style={s.featureBadge}>
                      <Text style={s.featureBadgeText}>{f.badge}</Text>
                    </View>
                  </View>
                  <Text style={s.featureTitle}>{f.title}</Text>
                  <Text style={s.featureDesc}>{f.desc}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </View>

        {/* ══ 타임라인 ══ */}
        <View style={s.timelineSection}>
          <Animated.View
            style={{
              opacity: tl.opacity,
              transform: [{ translateY: tl.translateY }],
            }}
          >
            <Text style={s.sectionTag}>우리의 여정</Text>
            <Text style={s.sectionTitle}>SignBridge의{"\n"}발자취</Text>
            {TIMELINE.map((t, i) => (
              <View key={t.year} style={s.tlItem}>
                <Text style={s.tlYear}>{t.year}</Text>
                <View style={s.tlDotWrap}>
                  <View style={s.tlDot} />
                  {i < TIMELINE.length - 1 && <View style={s.tlLine} />}
                </View>
                <View
                  style={[
                    s.tlRight,
                    i === TIMELINE.length - 1 && s.tlRightLast,
                  ]}
                >
                  <Text style={s.tlTitle}>{t.title}</Text>
                  <Text style={s.tlDesc}>{t.desc}</Text>
                </View>
              </View>
            ))}
          </Animated.View>
        </View>

        {/* ══ 팀 ══ */}
        <View style={s.teamSection}>
          <Animated.View
            style={{
              opacity: team.opacity,
              transform: [{ translateY: team.translateY }],
            }}
          >
            <Text style={s.sectionTag}>Team</Text>
            <Text style={s.sectionTitle}>함께 만드는{"\n"}SignBridge</Text>
            <View style={s.teamGrid}>
              {TEAM.map((m) => (
                <View key={m.name} style={s.teamCard}>
                  <Text style={s.teamAvatar}>{m.emoji}</Text>
                  <Text style={s.teamRole}>{m.role}</Text>
                  <Text style={s.teamName}>{m.name}</Text>
                  <Text style={s.teamDesc}>{m.desc}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </View>

        {/* ══ CTA ══ */}
        <View style={s.ctaSection}>
          <View style={s.ctaDeco1} />
          <View style={s.ctaDeco2} />
          <Animated.View
            style={[
              s.ctaInner,
              {
                opacity: cta.opacity,
                transform: [{ translateY: cta.translateY }],
              },
            ]}
          >
            <WaveSign size={52} />
            <Text style={s.ctaTitle}>함께 더 나은{"\n"}세상을 만들어요</Text>
            <Text style={s.ctaSub}>
              수어 사용자, 개발자, 연구자 모두를 환영합니다.{"\n"}더 나은 소통은
              함께 만들어가는 것입니다.
            </Text>
            <View style={s.ctaBtns}>
              <TouchableOpacity style={s.ctaBtnPrimary} activeOpacity={0.85}>
                <Text style={s.ctaBtnPrimaryText}>📬 문의하기</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.ctaBtnOutline} activeOpacity={0.85}>
                <Text style={s.ctaBtnOutlineText}>🌐 GitHub</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.ctaNote}>무료 오픈소스 프로젝트 · MIT License</Text>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── 스타일 ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  // HERO
  hero: {
    backgroundColor: C.ink,
    minHeight: 460,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 72,
    paddingHorizontal: 28,
    overflow: "hidden",
  },
  heroDeco: { position: "absolute", borderRadius: 9999 },
  deco1: {
    width: 340,
    height: 340,
    backgroundColor: "rgba(99,102,241,0.28)",
    top: -120,
    left: -80,
  },
  deco2: {
    width: 220,
    height: 220,
    backgroundColor: "rgba(168,85,247,0.2)",
    bottom: -70,
    right: -50,
  },
  heroInner: { alignItems: "center", zIndex: 1 },

  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 7,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginBottom: 32,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.accent,
  },
  eyebrowText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 2,
  },

  heroLine1: {
    fontSize: 58,
    fontWeight: "300",
    color: "#ffffff",
    letterSpacing: -2,
    lineHeight: 60,
  },
  heroLine2: {
    fontSize: 58,
    fontWeight: "300",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: -2,
    lineHeight: 60,
  },
  heroLine3: {
    fontSize: 58,
    fontWeight: "900",
    color: C.accent,
    letterSpacing: -3,
    lineHeight: 64,
    marginBottom: 24,
  },
  heroSub: {
    fontSize: 15,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 26,
    textAlign: "center",
    marginBottom: 28,
  },

  // 통계
  statsSection: {
    backgroundColor: C.surface,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: C.border,
  },
  statsGrid: { flexDirection: "row", alignItems: "center" },
  statItem: { flex: 1, paddingVertical: 26, alignItems: "center" },
  statsDivider: { width: 1, height: 48, backgroundColor: C.border },
  statNumber: {
    fontSize: 26,
    fontWeight: "700",
    color: C.accent,
    marginBottom: 5,
  },
  statLabel: { fontSize: 11, color: C.dim, textAlign: "center" },

  // 미션
  missionSection: {
    backgroundColor: C.bg,
    paddingHorizontal: 28,
    paddingVertical: 52,
  },
  missionLabel: {
    fontSize: 10,
    letterSpacing: 3,
    color: C.accent,
    textTransform: "uppercase",
    marginBottom: 18,
  },
  missionQuote: {
    fontSize: 24,
    fontStyle: "italic",
    color: C.ink,
    lineHeight: 36,
    letterSpacing: -0.5,
    marginBottom: 18,
  },
  missionAccent: { color: C.accent, fontStyle: "normal", fontWeight: "700" },
  missionBody: { fontSize: 14, color: C.dim, lineHeight: 24, marginBottom: 40 },

  bridgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  bridgeCard: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 20,
    paddingHorizontal: 22,
    borderRadius: 18,
    borderWidth: 1.5,
    minWidth: 88,
  },
  bridgeCardLeft: {
    borderColor: "rgba(99,102,241,0.25)",
    backgroundColor: "rgba(99,102,241,0.04)",
  },
  bridgeCardRight: {
    borderColor: "rgba(168,85,247,0.25)",
    backgroundColor: "rgba(168,85,247,0.04)",
  },
  bridgeCardEmoji: { fontSize: 34 },
  bridgeCardLabel: { fontSize: 13, fontWeight: "700", color: C.dim },
  bridgeCenter: { alignItems: "center", gap: 4, paddingHorizontal: 12 },
  bridgeLine: { width: 2, height: 26, backgroundColor: C.accent, opacity: 0.3 },
  bridgeIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  bridgeIconText: { fontSize: 22 },
  bridgeAILabel: {
    fontSize: 10,
    fontWeight: "700",
    color: C.accent,
    letterSpacing: 2,
  },

  // 특징
  featuresSection: {
    backgroundColor: C.ink,
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  sectionTagLight: {
    fontSize: 10,
    letterSpacing: 3,
    color: "rgba(168,85,247,0.8)",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  sectionTitleLight: {
    fontSize: 32,
    fontStyle: "italic",
    color: "#ffffff",
    letterSpacing: -1,
    lineHeight: 38,
    marginBottom: 28,
  },
  featuresGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  featureCard: {
    width: "47%",
    flexGrow: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 20,
  },
  featureTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  featureIcon: { fontSize: 26 },
  featureBadge: {
    backgroundColor: "rgba(99,102,241,0.18)",
    borderRadius: 100,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  featureBadgeText: { fontSize: 12, fontWeight: "700", color: C.accent },
  featureTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 6,
  },
  featureDesc: {
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    lineHeight: 19,
  },

  // 타임라인
  timelineSection: {
    backgroundColor: C.bg,
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  sectionTag: {
    fontSize: 10,
    letterSpacing: 3,
    color: C.accent,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 32,
    fontStyle: "italic",
    color: C.ink,
    letterSpacing: -1,
    lineHeight: 38,
    marginBottom: 32,
  },
  tlItem: { flexDirection: "row", alignItems: "flex-start" },
  tlYear: {
    width: 70,
    fontSize: 11,
    color: C.muted,
    letterSpacing: 0.3,
    paddingTop: 17,
  },
  tlDotWrap: { width: 26, alignItems: "center", paddingTop: 19 },
  tlDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.accent,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
  tlLine: {
    width: 2,
    flex: 1,
    minHeight: 42,
    backgroundColor: C.accent,
    opacity: 0.18,
    marginTop: 5,
  },
  tlRight: {
    flex: 1,
    paddingLeft: 14,
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tlRightLast: { borderBottomWidth: 0 },
  tlTitle: { fontSize: 15, fontWeight: "700", color: C.ink, marginBottom: 4 },
  tlDesc: { fontSize: 12, color: C.dim, lineHeight: 19 },

  // 팀
  teamSection: {
    backgroundColor: C.bg,
    paddingBottom: 60,
    paddingHorizontal: 24,
  },
  teamGrid: { flexDirection: "row", gap: 14 },
  teamCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 18,
    paddingVertical: 36,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  teamAvatar: { fontSize: 42, marginBottom: 12 },
  teamRole: {
    fontSize: 9,
    letterSpacing: 1.5,
    color: C.accent,
    textTransform: "uppercase",
    marginBottom: 5,
    textAlign: "center",
  },
  teamName: { fontSize: 16, fontWeight: "700", color: C.ink, marginBottom: 8 },
  teamDesc: { fontSize: 12, color: C.dim, lineHeight: 18, textAlign: "center" },

  // CTA
  ctaSection: {
    backgroundColor: "#1e1b4b",
    paddingVertical: 80,
    paddingHorizontal: 28,
    alignItems: "center",
    overflow: "hidden",
  },
  ctaDeco1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 9999,
    backgroundColor: "rgba(99,102,241,0.35)",
    top: -100,
    left: -60,
  },
  ctaDeco2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 9999,
    backgroundColor: "rgba(168,85,247,0.3)",
    bottom: -70,
    right: 20,
  },
  ctaInner: { zIndex: 1, alignItems: "center" },
  ctaTitle: {
    fontSize: 36,
    fontStyle: "italic",
    fontWeight: "400",
    color: "#ffffff",
    letterSpacing: -1.5,
    lineHeight: 42,
    textAlign: "center",
    marginTop: 18,
    marginBottom: 16,
  },
  ctaSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 32,
  },
  ctaBtns: { flexDirection: "row", gap: 12, marginBottom: 18 },
  ctaBtnPrimary: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 26,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
  },
  ctaBtnPrimaryText: { fontSize: 14, fontWeight: "700", color: "#312e81" },
  ctaBtnOutline: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
    borderRadius: 12,
    paddingHorizontal: 26,
    paddingVertical: 14,
  },
  ctaBtnOutlineText: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
  },
  ctaNote: { fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: 1 },
});
