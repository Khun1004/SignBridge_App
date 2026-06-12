// ══════════════════════════════════════════════════════════════
//  app/chat.tsx — 채팅 페이지
// ══════════════════════════════════════════════════════════════
import ChatScreen from "@/components/Chat/ChatScreen";
import { useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { View } from "react-native";

export default function ChatRoute() {
  const params = useLocalSearchParams<{ roomData?: string }>();

  // 커뮤니티 등에서 roomData를 넘겨줬을 때 자동으로 해당 방 열기
  const initialRoom = useMemo(() => {
    if (!params.roomData) return null;
    try {
      return JSON.parse(params.roomData);
    } catch {
      return null;
    }
  }, [params.roomData]);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <ChatScreen initialRoom={initialRoom} />
    </View>
  );
}
