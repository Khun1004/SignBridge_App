// ══════════════════════════════════════════════════════════════
//  components/Chat/ChatScreen.tsx
//  채팅 탭 메인 — 목록(ChatInbox)과 채팅방(ChatWindow) 전환
// ══════════════════════════════════════════════════════════════
import ChatInbox from "@/components/Chat/ChatInbox";
import { ChatRoom } from "@/components/Chat/ChatService";
import ChatWindow from "@/components/Chat/ChatWindow";
import { useAuth } from "@/components/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const C = {
  accent: "#6C63FF",
  bg: "#f8f8fc",
  white: "#ffffff",
  border: "#e8e8f0",
  text: "#1a1a2e",
  sub: "#6b7280",
};

interface Props {
  initialRoom?: ChatRoom | null; // 커뮤니티에서 채팅 시작 시 전달
}

export default function ChatScreen({ initialRoom }: Props) {
  const { userEmail, displayName } = useAuth();
  const [openRoom, setOpenRoom] = useState<ChatRoom | null>(null);

  const handleOpenRoom = (room: ChatRoom) => {
    setOpenRoom({ ...room, id: room.roomId || room.id });
  };

  const handleBack = () => {
    setOpenRoom(null);
  };

  if (openRoom) {
    return (
      <View style={s.root}>
        {/* 채팅방 헤더 */}
        <View style={s.chatHeader}>
          <TouchableOpacity style={s.backBtn} onPress={handleBack}>
            <Ionicons name="chevron-back" size={22} color={C.accent} />
          </TouchableOpacity>
          <View style={s.chatHeaderAv}>
            <Text style={{ fontSize: 20 }}>
              {openRoom.avatar || openRoom.name?.charAt(0) || "💬"}
            </Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.chatHeaderName} numberOfLines={1}>
              {openRoom.name}
            </Text>
            {openRoom.sub && (
              <Text style={s.chatHeaderSub} numberOfLines={1}>
                {openRoom.sub}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={s.headerIconBtn}
            onPress={() => {
              // 메시지 검색은 ChatWindow 내부에서 처리 — 버튼 클릭 시 ChatWindow에 알림
              // 간단히 구현: ChatWindow가 자체 검색 바 토글
            }}
          ></TouchableOpacity>
        </View>

        <ChatWindow
          room={openRoom}
          myEmail={userEmail}
          myName={displayName}
          onBack={handleBack}
        />
      </View>
    );
  }

  return (
    <View style={s.root}>
      {/* 채팅 목록 헤더 */}
      <View style={s.inboxHeader}>
        <Text style={s.inboxTitle}>채팅</Text>
      </View>

      <ChatInbox
        myEmail={userEmail}
        myName={displayName}
        initialRoom={initialRoom}
        onOpenRoom={handleOpenRoom}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  inboxHeader: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  inboxTitle: { fontSize: 20, fontWeight: "800", color: "#f1f5f9" },

  chatHeader: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 8,
    gap: 8,
  },
  backBtn: { padding: 6 },
  chatHeaderAv: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  chatHeaderName: { fontSize: 15, fontWeight: "700", color: C.text },
  chatHeaderSub: { fontSize: 11, color: C.sub },
  headerIconBtn: { padding: 6 },
});
