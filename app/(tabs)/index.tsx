// ══════════════════════════════════════════════════════════════
//  app/(tabs)/index.tsx  ←  HomeScreen (React Native)
// ══════════════════════════════════════════════════════════════
import { useScrollControl } from "@/components/contexts/ScrollContext";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SW } = Dimensions.get("window");

const ACCENT = "#7c6fff";
const ACCENT2 = "#06b6d4";
const TEXT = "#1a1a2e";
const SUB = "#666";

/* ── 슬라이드 데이터 ── */
const SLIDES = [
  {
    img: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80",
    imgTag: "수어 학습",
    tag: "LEARN",
    title: "단계별 수어 학습 프로그램",
    desc: "초급부터 고급까지, 게임처럼 즐기는 커리큘럼. 매일 10분으로 일상 수어를 마스터하세요.",
    link: "커리큘럼 보기",
  },
  {
    img: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
    imgTag: "실시간 번역",
    tag: "LIVE",
    title: "카메라 하나로 즉시 번역",
    desc: "웹캠을 켜는 순간 번역이 시작됩니다. 청각장애인과의 대화를 실시간 텍스트로 중계합니다.",
    link: "실시간 번역 하기",
  },
  {
    img: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80",
    imgTag: "커뮤니티",
    tag: "COMMUNITY",
    title: "함께 만드는 SignBridge",
    desc: "수어 사용자, 개발자, 연구자가 모여 더 나은 번역 데이터를 만들어갑니다.",
    link: "커뮤니티 참여",
  },
];

const STEPS = [
  {
    icon: "📷",
    title: "카메라 인식",
    desc: "웹캠으로 손동작을 실시간 촬영합니다. 별도 장비 없이 일반 카메라만으로 동작합니다.",
  },
  {
    icon: "🤖",
    title: "AI 분석",
    desc: "Pose 모델이 손 관절 21개 포인트를 정밀 추적하여 제스처를 분류합니다.",
  },
  {
    icon: "💬",
    title: "텍스트 변환",
    desc: "인식된 수어를 0.3초 이내 한국어 텍스트로 표시하고 음성으로도 출력합니다.",
  },
];

const STATS = [
  { num: "337만", label: "국내 청각장애" },
  { num: "7천만", label: "전세계 사용자" },
  { num: "98%", label: "목표 정확도" },
  { num: "0.3초", label: "번역 속도" },
];

interface HomeScreenProps {
  onDemo?: () => void;
  onAbout?: () => void;
  onCommunity?: () => void;
  onPractice?: () => void;
  onTranslate?: () => void;
}

interface SliderProps {
  onCommunity?: () => void;
  onPractice?: () => void;
  onTranslate?: () => void;
}

/* ── 🎚️ 1. 이미지 슬라이더 컴포넌트 ── */
function ImageSlider({ onCommunity, onPractice, onTranslate }: SliderProps) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const total = SLIDES.length;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(
      () => setCurrent((c) => (c + 1) % total),
      4000,
    );
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const go = (idx: number) => {
    setCurrent(idx);
    startTimer();
  };

  const slide = SLIDES[current];
  const progressPct = ((current + 1) / total) * 100;

  const handleLinkPress = () => {
    if (slide.link === "커리큘럼 보기") {
      if (onPractice) onPractice();
      else router.push("/practice" as any);
    } else if (slide.link === "실시간 번역 하기") {
      if (onTranslate) onTranslate();
      else router.push("/trans" as any);
    } else if (slide.link === "커뮤니티 참여") {
      if (onCommunity) onCommunity();
      else router.push("/community" as any);
    }
  };

  return (
    <View style={sl.wrap}>
      <View style={sl.header}>
        <View>
          <Text style={sl.sectionTag}>기능 탐색</Text>
          <Text style={sl.sectionTitle}>
            SignBridge가 제공하는{"\n"}세 가지 경험
          </Text>
        </View>
        <View style={sl.navRow}>
          <TouchableOpacity
            style={sl.navBtn}
            onPress={() => go((current - 1 + total) % total)}
          >
            <Text style={sl.navBtnText}>‹</Text>
          </TouchableOpacity>
          <View style={sl.dots}>
            {SLIDES.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => go(i)}
                style={[sl.dot, i === current && sl.dotActive]}
              />
            ))}
          </View>
          <TouchableOpacity
            style={sl.navBtn}
            onPress={() => go((current + 1) % total)}
          >
            <Text style={sl.navBtnText}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={sl.card}>
        <Image source={{ uri: slide.img }} style={sl.img} resizeMode="cover" />
        <View style={sl.imgTagWrap}>
          <Text style={sl.imgTag}>{slide.imgTag}</Text>
        </View>
        <View style={sl.body}>
          <Text style={sl.bodyTag}>{slide.tag}</Text>
          <Text style={sl.title}>{slide.title}</Text>
          <Text style={sl.desc}>{slide.desc}</Text>
          <TouchableOpacity style={sl.linkBtn} onPress={handleLinkPress}>
            <Text style={sl.linkText}>{slide.link} →</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={sl.progressBg}>
        <View style={[sl.progressFill, { width: `${progressPct}%` as any }]} />
      </View>
    </View>
  );
}

/* ── 📱 2. 메인 홈 화면 컴포넌트 ── */
export default function HomeScreen({
  onDemo,
  onAbout,
  onCommunity,
  onPractice,
  onTranslate,
}: HomeScreenProps) {
  const router = useRouter();
  const floatAnim = useRef(new Animated.Value(0)).current;

  // ★ ScrollContext 연결
  const { registerScroll, updateY } = useScrollControl();

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <ScrollView
      style={s.scroll}
      showsVerticalScrollIndicator={false}
      // ★ ref 연결: 플로팅 버튼이 이 ScrollView를 제어하게 됨
      ref={(ref) => registerScroll(ref)}
      // ★ 스크롤 위치 동기화: currentY가 실제 위치와 맞도록
      onScroll={(e) => updateY(e.nativeEvent.contentOffset.y)}
      scrollEventThrottle={16}
      // ★ 탭바(약 80px)가 콘텐츠를 가리지 않도록 하단 패딩
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* ── 🌌 히어로 섹션 ── */}
      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=85",
        }}
        style={s.heroBg}
        resizeMode="cover"
      >
        <View style={s.heroOverlay} />

        <View style={s.heroContent}>
          <View style={s.glassCard}>
            <Text style={s.eyebrow}>AI 수어 번역 시스템</Text>
            <View style={s.divider} />
            <Text style={s.heroTitle}>
              <Text style={s.heroMain}>손짓이{"\n"}</Text>
              <Text style={s.heroSub}>말이 됩니다</Text>
            </Text>
            <Text style={s.heroDesc}>
              SignBridge는 카메라로 수어를 인식하여{"\n"}실시간으로 텍스트로
              변환합니다.{"\n"}
              청각장애인과 비장애인 사이의{"\n"}소통 장벽을 허무는 AI
              플랫폼입니다.
            </Text>

            <View style={s.heroBtns}>
              <TouchableOpacity
                style={s.btnPrimary}
                onPress={onDemo ?? (() => router.push("/demopage" as any))}
              >
                <Text style={s.btnPrimaryText}>🎥 소통 데모 체험하기</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.btnOutline}
                onPress={onAbout ?? (() => router.push("/about" as any))}
              >
                <Text style={s.btnOutlineText}>📖 더 알아보기</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Animated.View
            style={[s.liveCard, { transform: [{ translateY: floatAnim }] }]}
          >
            <View style={s.liveChip}>
              <View style={s.liveDot} />
              <Text style={s.liveChipText}>실시간 인식 중</Text>
            </View>
            <Text style={s.liveEmoji}>🤟</Text>
            <Text style={s.liveWord}>안녕하세요</Text>
            <Text style={s.liveEn}>HELLO</Text>
            <View style={s.liveBarBg}>
              <View style={s.liveBarFill} />
            </View>
            <Text style={s.liveAcc}>정확도 98.2%</Text>
          </Animated.View>
        </View>

        <View style={s.statsHeroContainer}>
          <View style={s.statsHeroGlassLine}>
            {STATS.map((item, idx) => (
              <View
                key={idx}
                style={[
                  s.statHeroCard,
                  idx === STATS.length - 1 && { borderRightWidth: 0 },
                ]}
              >
                <Text style={s.statHeroCardNum}>{item.num}</Text>
                <Text style={s.statHeroCardLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ImageBackground>

      {/* ── 🎚️ 슬라이더 ── */}
      <ImageSlider
        onCommunity={onCommunity}
        onPractice={onPractice}
        onTranslate={onTranslate}
      />

      {/* ── 🛠️ 작동 원리 섹션 ── */}
      <View style={s.section}>
        <Text style={s.sectionTag}>작동 원리</Text>
        <Text style={s.sectionTitle}>세 단계로 완성되는 번역</Text>

        <View style={s.stepsWrapper}>
          <View style={s.stepsConnectorLine} />

          {STEPS.map((step, i) => (
            <View key={i} style={s.stepCard}>
              <View style={s.stepCircleFrame}>
                <Text style={s.stepCircleNum}>0{i + 1}</Text>
                <View style={s.stepIconBadge}>
                  <Text style={s.stepIconText}>{step.icon}</Text>
                </View>
              </View>

              <View style={s.stepBody}>
                <Text style={s.stepLabel}>STEP 0{i + 1}</Text>
                <Text style={s.stepTitle}>{step.title}</Text>
                <Text style={s.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ── 🤟 하단 CTA 섹션 ── */}
      <View style={s.cta}>
        <Text style={s.ctaLabel}>Join SignBridge</Text>
        <Text style={s.ctaTitle}>소통의 장벽을{"\n"}함께 허뭅시다</Text>
        <Text style={s.ctaSub}>
          수어 사용자, 개발자, 연구자 모두를 환영합니다.{"\n"}더 나은 세상은
          함께 만들어가는 것입니다.
        </Text>
        <TouchableOpacity
          style={s.ctaBtn}
          onPress={onCommunity ?? (() => router.push("/community" as any))}
        >
          <Text style={s.ctaBtnText}>🤟 프로젝트 참여하기</Text>
        </TouchableOpacity>
        <Text style={s.ctaNote}>무료 오픈소스 프로젝트</Text>
      </View>
    </ScrollView>
  );
}

/* ── 슬라이더 고유 스타일 ── */
const sl = StyleSheet.create({
  wrap: { padding: 20, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  sectionTag: {
    fontSize: 11,
    fontWeight: "700",
    color: ACCENT,
    letterSpacing: 1,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: TEXT,
    lineHeight: 26,
  },
  navRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0eeff",
    alignItems: "center",
    justifyContent: "center",
  },
  navBtnText: { fontSize: 18, color: ACCENT, fontWeight: "700" },
  dots: { flexDirection: "row", gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#e0e0f0" },
  dotActive: { backgroundColor: ACCENT, width: 18 },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e8e8f0",
  },
  img: { width: "100%", height: 180 },
  imgTagWrap: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  imgTag: { color: "#fff", fontSize: 11, fontWeight: "700" },
  body: { padding: 16 },
  bodyTag: {
    fontSize: 10,
    fontWeight: "800",
    color: ACCENT,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  title: { fontSize: 16, fontWeight: "800", color: TEXT, marginBottom: 8 },
  desc: { fontSize: 13, color: SUB, lineHeight: 20, marginBottom: 12 },
  linkBtn: { alignSelf: "flex-start" },
  linkText: { color: ACCENT, fontWeight: "700", fontSize: 13 },
  progressBg: {
    height: 3,
    backgroundColor: "#f0eeff",
    borderRadius: 2,
    marginTop: 16,
  },
  progressFill: { height: 3, backgroundColor: ACCENT, borderRadius: 2 },
});

/* ── 메인 컴포넌트 스타일 ── */
const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#fff" },
  heroBg: { minHeight: 570, justifyContent: "space-between" },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,10,30,0.58)",
  },
  heroContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 20,
    gap: 16,
    paddingTop: 60,
  },

  glassCard: {
    flex: 1,
    minWidth: SW * 0.55,
    backgroundColor: "rgba(255,255,255,0.11)",
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  eyebrow: {
    color: ACCENT2,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginBottom: 12,
  },
  heroTitle: { marginBottom: 12 },
  heroMain: { fontSize: 30, fontWeight: "900", color: "#fff" },
  heroSub: { fontSize: 26, fontWeight: "900", color: ACCENT2 },
  heroDesc: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 21,
    marginBottom: 18,
  },
  heroBtns: { gap: 10 },
  btnPrimary: {
    backgroundColor: ACCENT,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  btnPrimaryText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  btnOutline: {
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.5)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  btnOutlineText: { color: "#fff", fontWeight: "600", fontSize: 13 },

  liveCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    minWidth: 130,
    alignSelf: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  liveChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f0fdf4",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#22c55e" },
  liveChipText: { fontSize: 10, color: "#16a34a", fontWeight: "700" },
  liveEmoji: { fontSize: 36, marginBottom: 6 },
  liveWord: { fontSize: 16, fontWeight: "800", color: TEXT, marginBottom: 2 },
  liveEn: { fontSize: 10, color: SUB, letterSpacing: 2, marginBottom: 10 },
  liveBarBg: {
    width: "100%",
    height: 5,
    backgroundColor: "#e8e8f0",
    borderRadius: 3,
    marginBottom: 6,
  },
  liveBarFill: {
    width: "98%",
    height: 5,
    backgroundColor: ACCENT,
    borderRadius: 3,
  },
  liveAcc: { fontSize: 11, color: ACCENT, fontWeight: "700" },

  statsHeroContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
    width: "100%",
  },
  statsHeroGlassLine: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
  },
  statHeroCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 2,
  },
  statHeroCardNum: {
    fontSize: 16,
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: 2,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statHeroCardLabel: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.75)",
    fontWeight: "600",
    letterSpacing: -0.4,
  },

  section: { padding: 20, backgroundColor: "#fafafa" },
  sectionTag: {
    fontSize: 11,
    fontWeight: "700",
    color: ACCENT,
    letterSpacing: 1,
    marginBottom: 6,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: TEXT,
    textAlign: "center",
    marginBottom: 32,
  },

  stepsWrapper: { position: "relative" },
  stepsConnectorLine: {
    position: "absolute",
    left: 26,
    top: 20,
    bottom: 40,
    width: 2,
    backgroundColor: "rgba(124,111,255,0.15)",
  },
  stepCard: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 36,
    alignItems: "flex-start",
  },
  stepCircleFrame: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleNum: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ACCENT,
    color: "#fff",
    fontWeight: "900",
    fontSize: 14,
    textAlign: "center",
    textAlignVertical: "center",
    lineHeight: 42,
  },
  stepIconBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e8e8f0",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  stepIconText: { fontSize: 12 },

  stepBody: { flex: 1, paddingTop: 2 },
  stepLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: ACCENT,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  stepTitle: { fontSize: 15, fontWeight: "700", color: TEXT, marginBottom: 4 },
  stepDesc: { fontSize: 12, color: SUB, lineHeight: 19 },

  cta: {
    backgroundColor: ACCENT,
    padding: 32,
    alignItems: "center",
    margin: 20,
    borderRadius: 24,
  },
  ctaLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 32,
  },
  ctaSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 20,
  },
  ctaBtn: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 13,
  },
  ctaBtnText: { color: ACCENT, fontWeight: "800", fontSize: 14 },
  ctaNote: { color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 10 },
});
