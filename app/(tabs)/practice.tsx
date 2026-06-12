// app/(tabs)/practice.tsx
// ── 🤟 한국수어 학습센터 메인 ─────────────────────────────────
import AITestMode from "@/components/Practice/AITestMode";
import CameraMode from "@/components/Practice/CameraMode";
import LearnMode from "@/components/Practice/LearnMode";
import PracticeMode from "@/components/Practice/PracticeMode";
import { C } from "@/components/Practice/PracticeUtils";
import { SIGNS } from "@/components/Practice/signs";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
        contentContainerStyle={{ paddingBottom: 40 }}
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
  safe: { flex: 1, backgroundColor: C.bg },

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
