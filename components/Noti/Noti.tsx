// components/Noti/Noti.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const C = {
  accent: "#7c6fff",
  accentLt: "#ede9fe",
  text: "#1a1a2e",
  sub: "#64748b",
  border: "#e8e4ff",
  bg: "#f8f7ff",
  surface: "#ffffff",
  red: "#ef4444",
  green: "#10b981",
  yellow: "#f59e0b",
  blue: "#3b82f6",
};

export interface NotifItem {
  id: string;
  icon: string;
  text: string;
  time: string;
  unread: boolean;
  category?: "system" | "update" | "community" | "translate";
}

interface NotiProps {
  notifications: NotifItem[];
  onMarkAllRead?: () => void;
  onMarkRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  system: C.accent,
  update: C.green,
  community: C.blue,
  translate: C.yellow,
};

const CATEGORY_LABELS: Record<string, string> = {
  system: "시스템",
  update: "업데이트",
  community: "커뮤니티",
  translate: "번역",
};

export default function Noti({
  notifications,
  onMarkAllRead,
  onMarkRead,
  onDelete,
}: NotiProps) {
  const [items, setItems] = useState<NotifItem[]>(notifications);

  const unreadCount = items.filter((n) => n.unread).length;

  const handleMarkRead = (id: string) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n)),
    );
    onMarkRead?.(id);
  };

  const handleMarkAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
    onMarkAllRead?.();
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    onDelete?.(id);
  };

  const renderItem = ({ item }: { item: NotifItem }) => {
    const catColor = CATEGORY_COLORS[item.category ?? "system"] ?? C.accent;
    const catLabel = CATEGORY_LABELS[item.category ?? "system"] ?? "시스템";

    return (
      <TouchableOpacity
        style={[s.card, item.unread && s.cardUnread]}
        onPress={() => handleMarkRead(item.id)}
        activeOpacity={0.75}
      >
        {/* 왼쪽 컬러 바 */}
        {item.unread && (
          <View style={[s.unreadBar, { backgroundColor: catColor }]} />
        )}

        {/* 아이콘 */}
        <View style={[s.iconWrap, { backgroundColor: catColor + "22" }]}>
          <Text style={s.iconText}>{item.icon}</Text>
        </View>

        {/* 본문 */}
        <View style={s.content}>
          <View style={s.topRow}>
            <View style={[s.catBadge, { backgroundColor: catColor + "22" }]}>
              <Text style={[s.catText, { color: catColor }]}>{catLabel}</Text>
            </View>
            <Text style={s.time}>{item.time}</Text>
          </View>
          <Text style={[s.notiText, item.unread && s.notiTextBold]}>
            {item.text}
          </Text>
        </View>

        {/* 삭제 버튼 */}
        <TouchableOpacity
          style={s.deleteBtn}
          onPress={() => handleDelete(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={16} color="#94a3b8" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.container}>
      {/* 요약 바 */}
      <View style={s.summaryBar}>
        <View style={s.summaryLeft}>
          <View style={s.unreadBadge}>
            <Text style={s.unreadBadgeText}>{unreadCount}</Text>
          </View>
          <Text style={s.summaryText}>읽지 않은 알림</Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.75}>
            <Text style={s.markAllBtn}>모두 읽음</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 알림 목록 */}
      {items.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>🔔</Text>
          <Text style={s.emptyTitle}>알림이 없습니다</Text>
          <Text style={s.emptySub}>새로운 알림이 오면 여기에 표시됩니다.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={s.separator} />}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  summaryBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  summaryLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  summaryText: { fontSize: 13, fontWeight: "600", color: C.text },
  markAllBtn: {
    fontSize: 12,
    fontWeight: "700",
    color: C.accent,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: C.accentLt,
  },

  list: { padding: 12 },
  separator: { height: 8 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: "#7c6fff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    overflow: "hidden",
  },
  cardUnread: {
    backgroundColor: "#f5f3ff",
    borderColor: "#c4b5fd",
  },
  unreadBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },

  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  iconText: { fontSize: 20 },

  content: { flex: 1, gap: 4 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  catText: { fontSize: 10, fontWeight: "700" },
  time: { fontSize: 11, color: C.sub },
  notiText: { fontSize: 13, color: C.sub, lineHeight: 19 },
  notiTextBold: { color: C.text, fontWeight: "600" },

  deleteBtn: { padding: 4, flexShrink: 0 },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingTop: 80,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: C.text },
  emptySub: { fontSize: 13, color: C.sub, textAlign: "center", lineHeight: 20 },
});
