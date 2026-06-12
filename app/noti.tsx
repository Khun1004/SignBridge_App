// app/noti.tsx
import Noti, { NotifItem } from "@/components/Noti/Noti";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";

const INITIAL_NOTIFICATIONS: NotifItem[] = [
  {
    id: "1",
    icon: "🎉",
    text: "수어 번역 정확도가 98%를 달성했습니다!",
    time: "방금 전",
    unread: true,
    category: "system",
  },
  {
    id: "2",
    icon: "📚",
    text: "새로운 수어 단어 50개가 추가되었습니다.",
    time: "1시간 전",
    unread: true,
    category: "update",
  },
  {
    id: "3",
    icon: "🤝",
    text: "커뮤니티에 새 멤버가 가입했습니다.",
    time: "3시간 전",
    unread: false,
    category: "community",
  },
  {
    id: "4",
    icon: "🤟",
    text: "실시간 번역 기능이 업데이트되었습니다.",
    time: "어제",
    unread: false,
    category: "translate",
  },
  {
    id: "5",
    icon: "📢",
    text: "SignBridge v2.0 업데이트가 출시되었습니다.",
    time: "2일 전",
    unread: false,
    category: "update",
  },
];

export default function NotiPage() {
  const [notifications] = useState<NotifItem[]>(INITIAL_NOTIFICATIONS);

  return (
    <View style={s.container}>
      <Noti notifications={notifications} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
});
