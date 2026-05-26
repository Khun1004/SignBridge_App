// ══════════════════════════════════════════════════════════════
//  components/My/My.tsx — 마이페이지 통합 대시보드 컴포넌트
//  (웹 MyPage.jsx의 기관별 테마 및 통계 레이아웃 완벽 이식)
// ══════════════════════════════════════════════════════════════
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ── 🎨 웹 MyPage.css 구조 기반의 기관별 메타데이터 맵핑 ──
const ORG_META: Record<string, { icon: string; label: string; color: string }> =
  {
    immigration: { icon: "🛂", label: "출입국외국인사무소", color: "#7c3aed" },
    airport: { icon: "✈️", label: "공항", color: "#0891b2" },
    hospital: { icon: "🏥", label: "병원", color: "#059669" },
    police: { icon: "👮", label: "경찰서", color: "#dc2626" },
    personal: { icon: "👤", label: "개인 회원", color: "#2563eb" },
  };

interface MyContentProps {
  displayName: string;
  orgType: string; // 'immigration', 'airport', 'hospital', 'police' 등
  userEmail: string;
}

export default function MyContentScreen({
  displayName,
  orgType,
  userEmail,
}: MyContentProps) {
  // 소문자 변환 및 기본값 매칭을 통해 매끄러운 메타 바인딩 처리
  const currentOrgKey = orgType ? orgType.toLowerCase() : "personal";
  const meta = ORG_META[currentOrgKey] || ORG_META.personal;

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── 👤 1. 프로필 상단 카드 (웹 테마 컬러 그라디언트 포인트 반영) ── */}
      <View style={[s.profileCard, { borderLeftColor: meta.color }]}>
        <View style={s.avatarArea}>
          <Text style={s.avatarEmoji}>{meta.icon}</Text>
          <View>
            <View style={[s.badge, { backgroundColor: meta.color + "20" }]}>
              <Text style={[s.badgeText, { color: meta.color }]}>
                {meta.label}
              </Text>
            </View>
            <Text style={s.nameTxt}>{displayName || "사용자"}님</Text>
            <Text style={s.emailTxt}>{userEmail || "이메일 정보 없음"}</Text>
          </View>
        </View>
      </View>

      {/* ── 📊 2. 웹 마이페이지 대시보드 통계 섹션 (.mp-stats-grid) ── */}
      <Text style={s.sectionTitle}>📈 오늘의 활동 요약</Text>
      <View style={{ display: "none" }}>{/* 구조 매칭 인지용 */}</View>
      <View style={s.statsGrid}>
        <View style={s.statCard}>
          <Ionicons name="chatbubbles-outline" size={24} color={meta.color} />
          <Text style={s.statValue}>12회</Text>
          <Text style={s.statLabel}>누적 대화 건수</Text>
        </View>

        <View style={s.statCard}>
          <Ionicons name="videocam-outline" size={24} color="#06b6d4" />
          <Text style={s.statValue}>85분</Text>
          <Text style={s.statLabel}>수어 변역 이용</Text>
        </View>
      </View>

      {/* ── 📂 3. 대화 기록 히스토리 목록 (웹 기록 컴포넌트 이식) ── */}
      <View style={s.historyHeader}>
        <Text style={s.sectionTitle}>🗂️ 최근 번역 및 상담 히스토리</Text>
        <TouchableOpacity>
          <Text style={[s.moreBtn, { color: meta.color }]}>전체보기</Text>
        </TouchableOpacity>
      </View>

      {/* 가상 히스토리 로우들 */}
      <View style={s.historyList}>
        <View style={s.historyItem}>
          <View style={s.historyLeft}>
            <View style={s.iconBg}>
              <Text style={{ fontSize: 16 }}>🤟</Text>
            </View>
            <View>
              <Text style={s.historyTitle}>출입국 심사 동행 수어 번역</Text>
              <Text style={s.historyTime}>2026.05.19 · 완료</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#ccc" />
        </View>

        <View style={s.historyItem}>
          <View style={s.historyLeft}>
            <View style={s.iconBg}>
              <Text style={{ fontSize: 16 }}>📝</Text>
            </View>
            <View>
              <Text style={s.historyTitle}>민원인 서류 작성 가이드 상담</Text>
              <Text style={s.historyTime}>2026.05.18 · 완료</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#ccc" />
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  content: { padding: 20, paddingBottom: 40 },

  // 프로필 메인 컴포넌트 스타일 (.my-page 상단 리팩토링)
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 6, // 웹의 다이내믹 시각 구분을 측면 선 두께감으로 처리
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 24,
  },
  avatarArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarEmoji: {
    fontSize: 44,
    backgroundColor: "#f1f3f5",
    width: 68,
    height: 68,
    borderRadius: 34,
    textAlign: "center",
    textAlignVertical: "center",
    lineHeight: 64, // iOS 이모지 수직 중앙 정렬용
  },
  nameTxt: { fontSize: 22, fontWeight: "800", color: "#1a1a2e", marginTop: 4 },
  emailTxt: { fontSize: 13, color: "#888", marginTop: 2 },

  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },

  // 대시보드 통계 그리드 스타일 (.mp-stats-grid 매칭)
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1a1a2e",
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e8e8f0",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a1a2e",
    marginTop: 8,
    marginBottom: 2,
  },
  statLabel: { fontSize: 12, color: "#666", fontWeight: "500" },

  // 히스토리 리스트 스타일 리팩토링
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  moreBtn: { fontSize: 13, fontWeight: "700" },
  historyList: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8e8f0",
    overflow: "hidden",
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f5",
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
  },
  historyTitle: { fontSize: 14, fontWeight: "600", color: "#1a1a2e" },
  historyTime: { fontSize: 11, color: "#aaa", marginTop: 4 },
});
