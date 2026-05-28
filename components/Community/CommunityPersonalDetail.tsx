// ══════════════════════════════════════════════════════════════
//  components/Community/CommunityPersonalDetail.tsx
//  웹 CommunityPersonalDetail.jsx → React Native 변환
// ══════════════════════════════════════════════════════════════
import React from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const C = {
  accent: "#6366f1",
  accentBg: "#eef2ff",
  text: "#1e1b4b",
  sub: "#6b7280",
  border: "#e5e7eb",
  bg: "#f8f9ff",
  white: "#ffffff",
};

const CONTACT_LABEL: Record<string, string> = {
  chat: "💬 오픈채팅",
  phone: "📞 전화번호",
  email: "📧 이메일",
};

export interface CommunityMemberItem {
  id?: number;
  name: string;
  role: string;
  region: string;
  intro?: string;
  experience?: string;
  speciality?: string;
  certFileNames?: string[];
  contactType?: string;
  contactValue?: string;
  contact?: { type: string; value: string };
  publicProfile?: boolean;
  userEmail?: string;
  avatar?: string;
}

interface Props {
  member: CommunityMemberItem | null;
  onBack: () => void;
  myEmail?: string;
  myName?: string;
  onChat?: (roomId: string, name: string) => void;
  onEdit?: (member: CommunityMemberItem) => void;
}

export default function CommunityPersonalDetail({
  member,
  onBack,
  myEmail = "",
  myName = "",
  onChat,
  onEdit,
}: Props) {
  if (!member) return null;

  const contactType = member.contactType || member.contact?.type || "";
  const contactValue = member.contactValue || member.contact?.value || "";
  const avatarText = member.avatar || member.name?.charAt(0) || "?";

  const handleContact = () => {
    if (contactType === "chat") {
      Linking.openURL(contactValue).catch(() =>
        Alert.alert("오류", "링크를 열 수 없습니다."),
      );
    } else if (contactType === "phone") {
      Linking.openURL(`tel:${contactValue}`).catch(() =>
        Alert.alert("오류", "전화를 걸 수 없습니다."),
      );
    } else if (contactType === "email") {
      Linking.openURL(`mailto:${contactValue}`).catch(() =>
        Alert.alert("오류", "이메일을 열 수 없습니다."),
      );
    }
  };

  const handleChat = async () => {
    try {
      const res = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userA: myEmail,
          userAName: myName,
          userB: member.userEmail || member.name,
          userBName: member.name,
        }),
      });
      const room = await res.json();
      onChat?.(room.roomId, member.name);
    } catch {
      Alert.alert("오류", "채팅방을 만들 수 없습니다.");
    }
  };

  const specialities = member.speciality
    ? member.speciality
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <ScrollView style={st.page} showsVerticalScrollIndicator={false}>
      {/* 뒤로가기 */}
      <TouchableOpacity
        style={st.backBtn}
        onPress={onBack}
        activeOpacity={0.75}
      >
        <Text style={st.backBtnTxt}>← 커뮤니티로</Text>
      </TouchableOpacity>

      {/* 프로필 헤더 */}
      <View style={st.hero}>
        <View style={st.avatar}>
          <Text style={st.avatarTxt}>{avatarText}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.name}>{member.name}</Text>
          <View style={st.badges}>
            <View style={st.roleBadge}>
              <Text style={st.roleBadgeTxt}>{member.role}</Text>
            </View>
            <View style={st.regionBadge}>
              <Text style={st.regionBadgeTxt}>📍 {member.region}</Text>
            </View>
            {member.publicProfile === false && (
              <View style={st.privateBadge}>
                <Text style={st.privateBadgeTxt}>🔒 비공개</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* 자기소개 */}
      <View style={st.section}>
        <Text style={st.sectionTitle}>💬 자기소개</Text>
        <Text style={st.text}>{member.intro || "자기소개가 없습니다."}</Text>
      </View>

      {/* 경력 */}
      {!!member.experience && (
        <View style={st.section}>
          <Text style={st.sectionTitle}>📌 경력 / 활동 이력</Text>
          <Text style={st.text}>{member.experience}</Text>
        </View>
      )}

      {/* 전문 분야 */}
      {specialities.length > 0 && (
        <View style={st.section}>
          <Text style={st.sectionTitle}>🎯 전문 분야</Text>
          <View style={st.chips}>
            {specialities.map((s, i) => (
              <View key={i} style={st.chip}>
                <Text style={st.chipTxt}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 자격증 */}
      {(member.certFileNames?.length ?? 0) > 0 && (
        <View style={st.section}>
          <Text style={st.sectionTitle}>📄 자격증 / 증명서</Text>
          {member.certFileNames!.map((name, i) => (
            <View key={i} style={st.certItem}>
              <Text style={{ fontSize: 18 }}>
                {name.includes(".pdf") ? "📑" : "🖼️"}
              </Text>
              <Text style={st.certName}>{name}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 채팅하기 버튼 */}
      {!!myEmail && myEmail !== member.userEmail && (
        <TouchableOpacity
          style={st.chatBtn}
          onPress={handleChat}
          activeOpacity={0.85}
        >
          <Text style={st.chatBtnTxt}>💬 {member.name}님과 채팅하기</Text>
        </TouchableOpacity>
      )}

      {/* 연락 방법 */}
      {!!contactValue && (
        <View style={st.section}>
          <Text style={st.sectionTitle}>📞 연락 방법</Text>
          <View style={st.contactBox}>
            <Text style={st.contactLabel}>
              {CONTACT_LABEL[contactType] || "연락처"}
            </Text>
            <Text style={st.contactVal}>{contactValue}</Text>
          </View>
          <TouchableOpacity
            style={st.contactBtn}
            onPress={handleContact}
            activeOpacity={0.85}
          >
            <Text style={st.contactBtnTxt}>
              {contactType === "chat"
                ? "💬 채팅하기"
                : contactType === "phone"
                  ? "📞 전화하기"
                  : "📧 이메일 보내기"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 수정 버튼 (onEdit 있을 때만) */}
      {!!onEdit && (
        <TouchableOpacity
          style={st.editBtn}
          onPress={() => onEdit(member)}
          activeOpacity={0.85}
        >
          <Text style={st.editBtnTxt}>✏️ 프로필 수정</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.white, padding: 20 },
  backBtn: {
    alignSelf: "flex-start",
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 20,
  },
  backBtnTxt: { fontSize: 13, fontWeight: "600", color: C.sub },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#eef2ff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#e0e7ff",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarTxt: { color: C.white, fontSize: 28, fontWeight: "800" },
  name: { fontSize: 22, fontWeight: "800", color: C.text, marginBottom: 8 },
  badges: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  roleBadge: {
    backgroundColor: C.accentBg,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  roleBadgeTxt: { fontSize: 12, fontWeight: "600", color: C.accent },
  regionBadge: {
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  regionBadgeTxt: { fontSize: 12, color: C.sub },
  privateBadge: {
    backgroundColor: "#f9fafb",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  privateBadgeTxt: { fontSize: 12, color: "#9ca3af" },
  section: {
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: C.accent,
    marginBottom: 10,
  },
  text: { fontSize: 14, color: "#374151", lineHeight: 22 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  chipTxt: { fontSize: 12, fontWeight: "600", color: "#059669" },
  certItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.bg,
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },
  certName: { fontSize: 13, fontWeight: "600", color: "#374151" },
  chatBtn: {
    backgroundColor: C.accent,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  chatBtnTxt: { color: C.white, fontSize: 15, fontWeight: "700" },
  contactBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.bg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  contactLabel: { fontSize: 13, color: "#374151" },
  contactVal: { fontSize: 13, fontWeight: "700", color: "#4338ca" },
  contactBtn: {
    backgroundColor: C.accent,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  contactBtnTxt: { color: C.white, fontSize: 15, fontWeight: "700" },
  editBtn: {
    borderWidth: 1.5,
    borderColor: C.accent,
    borderRadius: 12,
    padding: 13,
    alignItems: "center",
    marginTop: 8,
  },
  editBtnTxt: { color: C.accent, fontSize: 14, fontWeight: "700" },
});
