/**
 * DictionaryScreen.tsx — 수어사전 및 도구함 화면
 * * 변경 사항:
 * · 웹 버전(DictPage)의 4대 핵심 도구함(어순 변환기, 수형 검색, 상황별 모음, 즐겨찾기) 탭 구조 완벽 이식
 * · 웹과 동일한 명칭, 캡션, 아이콘 뱃지 및 디자인 감성 반영
 * · 검색바 및 카드 레이아웃의 웹 CSS 스타일 모바일 최적화
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ── 🎨 웹 버전의 CSS 디자인 테마 반영 ──
const C = {
  accent: "#7c6fff", // 보라색 메인 포인트
  accent2: "#06b6d4", // 청록색 서브 포인트
  text: "#1a1a2e", // 짙은 남색 글꼴
  sub: "#666", // 회색 본문
  lightSub: "#aaa", // 연한 회색 설명글
  border: "#e8e8f0", // 경계선
  bg: "#ffffff", // 흰색 배경
  faint: "#f5f5fa", // 탭 내비게이션 배경
};

// ── 🛠️ 웹 DictPage.jsx의 TOOLS 구조 정의 ──
const TOOLS = [
  {
    id: "sentence",
    icon: "🔄",
    label: "어순 변환기",
    sub: "한국어 → KSL 어순",
  },
  { id: "shape", icon: "🖐", label: "수형 검색", sub: "손 모양으로 찾기" },
  { id: "situation", icon: "📍", label: "상황별 모음", sub: "병원·식당·교통" },
  { id: "favorites", icon: "🔖", label: "즐겨찾기", sub: "저장·메모 관리" },
];

export default function DictionaryScreen() {
  const [activeTab, setActiveTab] = useState("sentence");
  const [searchQuery, setSearchQuery] = useState("");

  // ── 각 탭에 매칭되는 렌더링 컨텐츠 (웹 구조 모바일 구현) ──
  const renderTabContent = () => {
    switch (activeTab) {
      case "sentence":
        return (
          <View style={s.toolContentCard}>
            <Text style={s.toolCardTitle}>
              🔄 한국어 → KSL 수어 어순 변환기
            </Text>
            <Text style={s.toolCardDesc}>
              입력하신 한국어 문장을 수어 표현 순서(어순)에 맞게 변환하여 핵심
              단어 배열을 안내합니다.
            </Text>
            <View style={s.mockInputContainer}>
              <TextInput
                style={s.mockInput}
                placeholder="예: 오늘 저녁에 친구를 만나러 병원에 갑니다."
                placeholderTextColor="#bbb"
                editable={false}
              />
              <TouchableOpacity style={s.mockActionBtn}>
                <Text style={s.mockActionBtnTxt}>변환하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case "shape":
        return (
          <View style={s.toolContentCard}>
            <Text style={s.toolCardTitle}>🖐 수형 검색 (손 모양 분류)</Text>
            <Text style={s.toolCardDesc}>
              수어를 구성하는 주먹, 편 손, 검지 손가락 등 50여 가지 손 모양
              형태별 특징을 선택하여 단어를 유추합니다.
            </Text>
            <View style={s.shapeGridMock}>
              {["✊ 주먹형", "✋ 편손형", "☝️ 검지형", "✌️ 가위형"].map(
                (sh, idx) => (
                  <View key={idx} style={s.shapeItemMock}>
                    <Text style={s.shapeItemText}>{sh}</Text>
                  </View>
                ),
              )}
            </View>
          </View>
        );
      case "situation":
        return (
          <View style={s.toolContentCard}>
            <Text style={s.toolCardTitle}>📍 상황별 수어 표현 모음</Text>
            <Text style={s.toolCardDesc}>
              일상생활, 관공서, 의료 기관, 교통 수단 등 특정 환경에서 자주
              쓰이는 필수 회화 표현들을 분류집으로 제공합니다.
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.tagRow}
            >
              {["🏥 병원", "🚓 경찰서", "🍕 식당", "🚌 교통", "🏦 은행"].map(
                (tag, idx) => (
                  <View key={idx} style={s.tagBadge}>
                    <Text style={s.tagText}>{tag}</Text>
                  </View>
                ),
              )}
            </ScrollView>
          </View>
        );
      case "favorites":
        return (
          <View style={s.toolContentCard}>
            <Text style={s.toolCardTitle}>🔖 나만의 즐겨찾기 & 메모 관리</Text>
            <Text style={s.toolCardDesc}>
              자주 찾는 수어 단어를 스크랩하고, 나만의 학습 메모를 남겨
              효율적으로 복습할 수 있는 공간입니다.
            </Text>
            <View style={s.emptyFavBox}>
              <Ionicons name="bookmark-outline" size={32} color="#ccc" />
              <Text style={s.emptyFavText}>저장된 단어가 없습니다.</Text>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContainer}
      >
        {/* ── 🏷️ 웹의 .tools-header 구조 반영 ── */}
        <View style={s.toolsHeader}>
          <Text style={s.toolsTitle}>🛠️ 수어 도구함</Text>
          <Text style={s.toolsSub}>
            어순 변환 · 수형 검색 · 상황별 표현 · 즐겨찾기
          </Text>
        </View>

        {/* ── 🔍 전체 수어 통합 검색창 (웹 헤더 검색과 동기화 대응) ── */}
        <View style={s.searchSection}>
          <View style={s.searchWrap}>
            <Ionicons name="search" size={16} color={C.lightSub} />
            <TextInput
              style={s.searchInput}
              placeholder="궁금한 수어 단어나 도구를 검색하세요..."
              placeholderTextColor="#bbb"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={16} color="#ccc" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── 🗂️ 웹의 .tools-nav 그리드 내비게이션 완벽 이식 ── */}
        <View style={s.toolsNavGrid}>
          {TOOLS.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={[s.toolsNavBtn, isActive && s.toolsNavBtnActive]}
                onPress={() => setActiveTab(t.id)}
                activeOpacity={0.8}
              >
                <Text style={s.tnbIcon}>{t.icon}</Text>
                <Text style={[s.tnbLabel, isActive && s.tnbLabelActive]}>
                  {t.label}
                </Text>
                <Text style={s.tnbSub} numberOfLines={1}>
                  {t.sub}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── 💻 활성화된 탭 컨텐츠 출력 영역 ── */}
        <View style={s.tabDisplayArea}>{renderTabContent()}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scrollContainer: { padding: 20, paddingBottom: 60 },

  // 웹 .tools-header 클래스 미러링 스타일
  toolsHeader: { alignItems: "center", marginBottom: 24, marginTop: 10 },
  toolsTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: C.text,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  toolsSub: { fontSize: 13, color: C.lightSub, fontWeight: "500" },

  // 검색바 영역
  searchSection: { marginBottom: 24 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fcfcfd",
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.text },

  // 웹 .tools-nav 4분할 그리드 이식 구조
  toolsNavGrid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    backgroundColor: C.faint,
    borderRadius: 16,
    padding: 6,
    marginBottom: 24,
  },
  toolsNavBtn: {
    width: "48.5%", // 2열 종대 그리드 배치 비율 계산
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  toolsNavBtnActive: {
    backgroundColor: "#ffffff",
    // 웹의 부드러운 박스 섀도우 구현 효과
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  tnbIcon: { fontSize: 22, marginBottom: 4 },
  tnbLabel: { fontSize: 14, fontWeight: "700", color: "#888", marginBottom: 2 },
  tnbLabelActive: { color: C.accent },
  tnbSub: { fontSize: 10, color: "#bbb", fontWeight: "500" },

  // 탭 컨텐츠 메인 박스
  tabDisplayArea: { flex: 1 },
  toolContentCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 16,
    padding: 20,
  },
  toolCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: C.text,
    marginBottom: 8,
  },
  toolCardDesc: {
    fontSize: 13,
    color: C.sub,
    lineHeight: 20,
    marginBottom: 16,
  },

  // 어순 변환기 내부 가상 폼 구조
  mockInputContainer: { gap: 10 },
  mockInput: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    backgroundColor: C.faint,
    color: C.text,
  },
  mockActionBtn: {
    backgroundColor: C.accent,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  mockActionBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 13 },

  // 수형 검색 내부 가상 그리드 구조
  shapeGridMock: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  shapeItemMock: {
    width: "48%",
    flexGrow: 1,
    padding: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  shapeItemText: { fontSize: 13, fontWeight: "600", color: C.text },

  // 상황별 표현 가상 태그 라인 구조
  tagRow: { gap: 6, paddingVertical: 4 },
  tagBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(6,182,212,0.06)",
    borderWidth: 1,
    borderColor: "rgba(6,182,212,0.15)",
    borderRadius: 20,
  },
  tagText: { color: C.accent2, fontWeight: "700", fontSize: 12 },

  // 즐겨찾기 비어있음 컴포넌트 구조
  emptyFavBox: { alignItems: "center", paddingVertical: 30, gap: 8 },
  emptyFavText: { fontSize: 13, color: "#bbb", fontWeight: "500" },
});
