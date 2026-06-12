// ══════════════════════════════════════════════════════════════
//  components/Chat/ChatInbox.tsx
//  웹 ChatRoom.jsx Inbox 섹션 → React Native 변환
//  채팅방 목록, 검색, 필터, 그룹 탭
// ══════════════════════════════════════════════════════════════
import chatService, { ChatRoom } from "@/components/Chat/ChatService";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const C = {
  accent: "#6C63FF",
  accentDk: "#4F46E5",
  bg: "#f8f8fc",
  white: "#ffffff",
  border: "#e8e8f0",
  text: "#1a1a2e",
  sub: "#6b7280",
  muted: "#a0aec0",
  unread: "#ef4444",
};

const OFFICIAL_ROOMS: ChatRoom[] = [
  {
    id: "official_signbridge",
    name: "SignBridge Official",
    sub: "공식 커뮤니티",
    avatar: "🤟",
    description:
      "SignBridge 공식 채팅방입니다. 공지사항, 수어 팁, 커뮤니티 소식을 공유해요.",
    memberCount: 1284,
    isOfficial: true,
    isGroup: true,
  },
  {
    id: "official_learners",
    name: "수어 배우기 방",
    sub: "학습자 모임",
    avatar: "📚",
    description: "수어를 배우는 분들을 위한 방입니다.",
    memberCount: 437,
    isOfficial: true,
    isGroup: true,
  },
];

function fmtRecent(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso),
    now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0)
    return d.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  if (diff === 1) return "어제";
  return d.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
}

interface Props {
  myEmail: string;
  myName: string;
  initialRoom?: ChatRoom | null;
  onOpenRoom: (room: ChatRoom) => void;
}

export default function ChatInbox({
  myEmail,
  myName,
  initialRoom,
  onOpenRoom,
}: Props) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"chats" | "groups">("chats");
  const [chatFilter, setChatFilter] = useState<"all" | "unread">("all");

  const loadRooms = useCallback(async () => {
    if (!myEmail) {
      setLoading(false);
      return;
    }
    try {
      const data = await chatService.getRooms(myEmail);
      setRooms(data);
    } catch {
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [myEmail]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // 커뮤니티에서 넘어온 방 자동 열기
  useEffect(() => {
    if (!initialRoom) return;
    onOpenRoom({ ...initialRoom, id: initialRoom.roomId || initialRoom.id });
  }, [initialRoom]);

  const unreadTotal = rooms.reduce((s, r) => s + (r.unread || 0), 0);

  const filteredRooms = rooms.filter((r) => {
    const matchS =
      r.name.includes(search) || (r.lastMsg || "").includes(search);
    const matchF =
      chatFilter === "all" || (chatFilter === "unread" && (r.unread || 0) > 0);
    return matchS && matchF;
  });

  const deleteRoom = (id: string | number) => {
    Alert.alert("대화 삭제", "이 대화를 삭제할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => setRooms((prev) => prev.filter((r) => r.id !== id)),
      },
    ]);
  };

  const muteRoom = (id: string | number) =>
    setRooms((prev) =>
      prev.map((r) => (r.id === id ? { ...r, muted: !r.muted } : r)),
    );

  const markRead = (id: string | number) =>
    setRooms((prev) =>
      prev.map((r) => (r.id === id ? { ...r, unread: 0 } : r)),
    );

  return (
    <View style={s.root}>
      {/* 탭 */}
      <View style={s.tabs}>
        <TouchableOpacity
          style={[s.tab, tab === "chats" && s.tabOn]}
          onPress={() => setTab("chats")}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={16}
              color={tab === "chats" ? C.accent : C.muted}
            />
            <Text style={[s.tabTxt, tab === "chats" && s.tabTxtOn]}>채팅</Text>
            {unreadTotal > 0 && (
              <View style={s.tabBadge}>
                <Text style={s.tabBadgeTxt}>{unreadTotal}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, tab === "groups" && s.tabOn]}
          onPress={() => setTab("groups")}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons
              name="people-outline"
              size={16}
              color={tab === "groups" ? C.accent : C.muted}
            />
            <Text style={[s.tabTxt, tab === "groups" && s.tabTxtOn]}>그룹</Text>
          </View>
        </TouchableOpacity>
      </View>

      {tab === "chats" && (
        <>
          {/* 검색 */}
          <View style={s.searchWrap}>
            <Ionicons name="search-outline" size={14} color={C.muted} />
            <TextInput
              style={s.searchInput}
              placeholder="검색..."
              placeholderTextColor={C.muted}
              value={search}
              onChangeText={setSearch}
            />
            {!!search && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Text style={{ color: C.muted, fontSize: 13 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 필터 */}
          <View style={s.filterRow}>
            {(["all", "unread"] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[s.filterBtn, chatFilter === f && s.filterBtnOn]}
                onPress={() => setChatFilter(f)}
              >
                <Text style={[s.filterTxt, chatFilter === f && s.filterTxtOn]}>
                  {f === "all"
                    ? "전체"
                    : `읽지 않음${unreadTotal > 0 ? ` ${unreadTotal}` : ""}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={s.empty}>
                <ActivityIndicator color={C.accent} />
              </View>
            ) : filteredRooms.length === 0 ? (
              <View style={s.empty}>
                <Text style={s.emptyIcon}>
                  {chatFilter === "unread" ? "✅" : "💬"}
                </Text>
                <Text style={s.emptyTxt}>
                  {chatFilter === "unread"
                    ? "읽지 않은 대화가 없어요"
                    : "아직 대화가 없어요"}
                </Text>
              </View>
            ) : (
              filteredRooms.map((room) => (
                <RoomRow
                  key={room.id}
                  room={room}
                  onOpen={() => onOpenRoom(room)}
                  onDelete={() => deleteRoom(room.id)}
                  onMute={() => muteRoom(room.id)}
                  onMarkRead={() => markRead(room.id)}
                />
              ))
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </>
      )}

      {tab === "groups" && (
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          <Text style={s.sectionLabel}>공식 채팅방</Text>
          {OFFICIAL_ROOMS.map((room) => (
            <TouchableOpacity
              key={room.id}
              style={s.groupCard}
              onPress={() => onOpenRoom(room)}
            >
              <View style={s.groupAv}>
                <Text style={s.groupAvTxt}>{room.avatar}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <Text style={s.groupName}>{room.name}</Text>
                  {room.isOfficial && (
                    <View style={s.officialBadge}>
                      <Text style={s.officialBadgeTxt}>공식</Text>
                    </View>
                  )}
                </View>
                <Text style={s.groupDesc} numberOfLines={1}>
                  {room.description}
                </Text>
                <Text style={s.groupMeta}>
                  👥 {(room.memberCount || 0).toLocaleString()}명
                </Text>
              </View>
              <TouchableOpacity
                style={s.joinBtn}
                onPress={() => onOpenRoom(room)}
              >
                <Text style={s.joinBtnTxt}>참여</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

// ── 채팅방 행 ────────────────────────────────────────────────
function RoomRow({
  room,
  onOpen,
  onDelete,
  onMute,
  onMarkRead,
}: {
  room: ChatRoom;
  onOpen: () => void;
  onDelete: () => void;
  onMute: () => void;
  onMarkRead: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View>
      <TouchableOpacity
        style={[s.roomRow, (room.unread || 0) > 0 && s.roomRowUnread]}
        onPress={onOpen}
      >
        <View style={s.roomAv}>
          <Text style={{ fontSize: 22 }}>
            {room.avatar || room.name?.charAt(0) || "💬"}
          </Text>
          {room.muted && <Text style={s.muteBadge}>🔕</Text>}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={s.roomTop}>
            <Text style={s.roomName} numberOfLines={1}>
              {room.name}
            </Text>
            <Text style={s.roomTime}>{fmtRecent(room.lastAt)}</Text>
          </View>
          <View style={s.roomBottom}>
            <Text style={s.roomLast} numberOfLines={1}>
              {room.lastMsg || "대화를 시작하세요"}
            </Text>
            {(room.unread || 0) > 0 && (
              <View style={s.unreadBadge}>
                <Text style={s.unreadBadgeTxt}>{room.unread}</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={s.dotsBtn}
          onPress={() => setMenuOpen((v) => !v)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="ellipsis-horizontal" size={16} color={C.muted} />
        </TouchableOpacity>
      </TouchableOpacity>

      {menuOpen && (
        <View style={s.roomMenu}>
          {(room.unread || 0) > 0 && (
            <TouchableOpacity
              style={s.menuItem}
              onPress={() => {
                markRead();
                setMenuOpen(false);
              }}
            >
              <Text style={s.menuItemTxt}>✓ 읽음으로 표시</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={s.menuItem}
            onPress={() => {
              onMute();
              setMenuOpen(false);
            }}
          >
            <Text style={s.menuItemTxt}>
              {room.muted ? "🔔 알림 켜기" : "🔕 알림 끄기"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.menuItem, s.menuItemDanger]}
            onPress={() => {
              setMenuOpen(false);
              onDelete();
            }}
          >
            <Text style={[s.menuItemTxt, { color: "#ef4444" }]}>
              🗑 대화 삭제
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  function markRead() {
    onMarkRead();
  }
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  tabs: {
    flexDirection: "row",
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabOn: { borderBottomColor: C.accent },
  tabTxt: { fontSize: 13, fontWeight: "600", color: C.muted },
  tabTxtOn: { color: C.accent },
  tabBadge: {
    backgroundColor: C.unread,
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  tabBadgeTxt: { fontSize: 10, fontWeight: "700", color: "#fff" },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.white,
    margin: 12,
    marginBottom: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: C.text },

  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
  },
  filterBtnOn: { backgroundColor: C.accent, borderColor: C.accent },
  filterTxt: { fontSize: 12, fontWeight: "600", color: C.sub },
  filterTxtOn: { color: "#fff" },

  empty: { alignItems: "center", paddingVertical: 60, gap: 8 },
  emptyIcon: { fontSize: 36 },
  emptyTxt: { fontSize: 14, color: C.muted },

  roomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  roomRowUnread: { backgroundColor: "#faf8ff" },
  roomAv: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  muteBadge: { position: "absolute", bottom: -2, right: -2, fontSize: 11 },
  roomTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  roomName: {
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
    flex: 1,
    marginRight: 6,
  },
  roomTime: { fontSize: 11, color: C.muted },
  roomBottom: { flexDirection: "row", alignItems: "center" },
  roomLast: { fontSize: 12, color: C.sub, flex: 1 },
  unreadBadge: {
    backgroundColor: C.unread,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: "center",
  },
  unreadBadgeTxt: { fontSize: 11, fontWeight: "700", color: "#fff" },
  dotsBtn: { padding: 4 },

  roomMenu: {
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginLeft: 16,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  menuItemDanger: {},
  menuItemTxt: { fontSize: 13, color: C.text },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: C.muted,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    letterSpacing: 0.5,
  },
  groupCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  groupAv: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  groupAvTxt: { fontSize: 24 },
  groupName: { fontSize: 14, fontWeight: "700", color: C.text },
  groupDesc: { fontSize: 12, color: C.sub, marginTop: 2 },
  groupMeta: { fontSize: 11, color: C.muted, marginTop: 3 },
  officialBadge: {
    backgroundColor: "#eef2ff",
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  officialBadgeTxt: { fontSize: 10, fontWeight: "700", color: "#6366f1" },
  joinBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  joinBtnTxt: { fontSize: 12, fontWeight: "700", color: "#fff" },
});
