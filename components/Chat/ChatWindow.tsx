// ══════════════════════════════════════════════════════════════
//  components/Chat/ChatWindow.tsx
//  웹 ChatWindow 컴포넌트 → React Native 변환
//  메시지 전송/수정/삭제, 리액션, 답장, 핀, 메시지 검색
// ══════════════════════════════════════════════════════════════
import chatService, {
  ChatMessage,
  ChatRoom,
} from "@/components/Chat/ChatService";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const C = {
  accent: "#6C63FF",
  accentBg: "#eef2ff",
  bg: "#f8f8fc",
  white: "#ffffff",
  border: "#e8e8f0",
  text: "#1a1a2e",
  sub: "#6b7280",
  muted: "#a0aec0",
  bubbleMe: "#6C63FF",
  bubbleThem: "#ffffff",
};

const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "😡", "👍"];
const ALL_EMOJIS = [
  "❤️",
  "😂",
  "😮",
  "😢",
  "😡",
  "👍",
  "🔥",
  "🙏",
  "👏",
  "🤟",
  "💯",
  "😍",
  "😀",
  "😃",
  "😄",
  "😁",
  "😆",
  "😊",
  "😇",
  "🙂",
  "😉",
  "😌",
  "😋",
  "😛",
  "😜",
  "🤪",
  "🤓",
  "😎",
  "👋",
  "🤚",
  "✋",
  "👌",
  "🤌",
  "✌️",
  "🤞",
  "🤟",
  "🤘",
  "👍",
  "👎",
  "✊",
  "👏",
  "🙌",
  "🙏",
  "🎉",
  "🎊",
  "🎈",
  "🏆",
  "⭐",
  "🌟",
  "💫",
  "✨",
  "🔥",
  "💥",
  "💬",
  "💭",
  "❤️",
  "💔",
  "💕",
  "💖",
];

function fmtTime(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function fmtDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso),
    today = new Date();
  const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "오늘";
  if (diff === 1) return "어제";
  return d.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}

interface Props {
  room: ChatRoom;
  myEmail: string;
  myName: string;
  onBack: () => void;
}

export default function ChatWindow({ room, myEmail, myName, onBack }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMsg, setEditingMsg] = useState<ChatMessage | null>(null);
  const [pinned, setPinned] = useState<ChatMessage | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [reactionTarget, setReactionTarget] = useState<ChatMessage | null>(
    null,
  );
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const flatRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  // ── 메시지 로드 ─────────────────────────────────────────
  useEffect(() => {
    chatService.connect();
    (async () => {
      try {
        const data = await chatService.getMessages(room.id);
        setMessages(data);
      } catch {
        setMessages([]);
      } finally {
        setLoading(false);
      }
    })();

    const unsub = chatService.subscribeToRoom(String(room.id), (msg) => {
      if (msg.type === "EDIT") {
        setMessages((prev) =>
          prev.map((m) =>
            String(m.id) === String(msg.id)
              ? { ...m, text: msg.text, edited: true }
              : m,
          ),
        );
        return;
      }
      if (msg.type === "DELETE") {
        setMessages((prev) =>
          prev.filter((m) => String(m.id) !== String(msg.id)),
        );
        return;
      }
      setMessages((prev) => {
        if (prev.find((m) => String(m.id) === String(msg.id))) return prev;
        return [...prev, msg];
      });
    });

    return () => unsub();
  }, [room.id]);

  const scrollToBottom = () =>
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);

  useEffect(() => {
    if (!loading) scrollToBottom();
  }, [loading]);
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // ── 전송 ────────────────────────────────────────────────
  const send = () => {
    const text = input.trim();
    if (!text) return;

    if (editingMsg) {
      chatService.editMessage(editingMsg.id, room.id, text);
      setMessages((prev) =>
        prev.map((m) =>
          String(m.id) === String(editingMsg.id)
            ? { ...m, text, edited: true }
            : m,
        ),
      );
      setEditingMsg(null);
      setInput("");
      return;
    }

    const msg: ChatMessage = {
      id: Date.now(),
      email: myEmail,
      name: myName,
      text,
      at: new Date().toISOString(),
      reactions: {},
      replyTo: replyTo
        ? {
            id: replyTo.id,
            name: replyTo.name || "",
            text: replyTo.text,
            fileName: replyTo.fileName,
          }
        : null,
    };

    setMessages((prev) => [...prev, msg]);
    chatService.sendMessage({
      roomId: room.id,
      senderEmail: myEmail,
      senderName: myName,
      text,
      replyToId: replyTo?.id,
    });
    setInput("");
    setReplyTo(null);
  };

  // ── 삭제 ────────────────────────────────────────────────
  const deleteMsg = (msg: ChatMessage) => {
    Alert.alert("메시지 삭제", "이 메시지를 삭제할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => {
          chatService.deleteMessage(msg.id, room.id);
          setMessages((prev) => prev.filter((m) => m.id !== msg.id));
        },
      },
    ]);
  };

  // ── 리액션 ──────────────────────────────────────────────
  const addReaction = (msgId: string | number, emoji: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId) return m;
        const r = { ...(m.reactions || {}) };
        r[myEmail] === emoji ? delete r[myEmail] : (r[myEmail] = emoji);
        return { ...m, reactions: r };
      }),
    );
    setReactionTarget(null);
    setShowEmojiPicker(false);
  };

  const aggregateReactions = (reactions?: Record<string, string>) => {
    const agg: Record<string, number> = {};
    Object.values(reactions || {}).forEach((e) => {
      agg[e] = (agg[e] || 0) + 1;
    });
    return Object.entries(agg);
  };

  // ── 메시지 길게 누르기 (컨텍스트 메뉴) ──────────────────
  const onLongPress = (msg: ChatMessage) => {
    const isMe = msg.email === myEmail;
    const options: string[] = ["답장", "리액션"];
    if (!msg.imageData && !msg.fileName) options.push("복사");
    if (pinned?.id === msg.id) options.push("고정 해제");
    else options.push("고정");
    if (isMe && !msg.imageData && !msg.fileName) options.push("수정");
    if (isMe) options.push("삭제");
    options.push("취소");

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: isMe ? options.indexOf("삭제") : undefined,
        },
        (idx) => handleMsgAction(options[idx], msg),
      );
    } else {
      // Android: Alert 기반 메뉴
      Alert.alert("메시지", undefined, [
        ...options
          .filter((o) => o !== "취소")
          .map((o) => ({
            text: o,
            style: (o === "삭제" ? "destructive" : "default") as
              | "destructive"
              | "default",
            onPress: () => handleMsgAction(o, msg),
          })),
        { text: "취소", style: "cancel" },
      ]);
    }
  };

  const handleMsgAction = (action: string, msg: ChatMessage) => {
    switch (action) {
      case "답장":
        setReplyTo(msg);
        setEditingMsg(null);
        inputRef.current?.focus();
        break;
      case "리액션":
        setReactionTarget(msg);
        break;
      case "복사":
        // RN Clipboard
        try {
          require("@react-native-clipboard/clipboard").default.setString(
            msg.text || "",
          );
        } catch {}
        break;
      case "고정":
        setPinned(msg);
        break;
      case "고정 해제":
        setPinned(null);
        break;
      case "수정":
        setEditingMsg(msg);
        setInput(msg.text || "");
        setReplyTo(null);
        inputRef.current?.focus();
        break;
      case "삭제":
        deleteMsg(msg);
        break;
    }
  };

  // ── 검색 결과 ────────────────────────────────────────────
  const searchResults = searchQ.trim()
    ? messages.filter((m) =>
        (m.text || m.fileName || "")
          .toLowerCase()
          .includes(searchQ.toLowerCase()),
      )
    : [];

  // ── 그룹핑 (날짜 구분선) ─────────────────────────────────
  type ListItem =
    | { type: "date"; date: string; key: string }
    | { type: "msg"; msg: ChatMessage; key: string };

  const listItems: ListItem[] = [];
  let lastDate = "";
  messages.forEach((msg) => {
    const dl = fmtDate(msg.at);
    if (dl !== lastDate) {
      listItems.push({ type: "date", date: dl, key: `date-${dl}` });
      lastDate = dl;
    }
    listItems.push({ type: "msg", msg, key: String(msg.id) });
  });

  // ── 렌더링 ──────────────────────────────────────────────
  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === "date") {
      return (
        <View style={st.dateDiv}>
          <View style={st.dateDivLine} />
          <Text style={st.dateDivTxt}>{item.date}</Text>
          <View style={st.dateDivLine} />
        </View>
      );
    }

    const { msg } = item;
    const isMe = msg.email === myEmail;
    const aggR = aggregateReactions(msg.reactions);
    const myR = (msg.reactions || {})[myEmail];
    const isPinned = pinned?.id === msg.id;

    if (msg.isSystem) {
      return (
        <View style={st.systemRow}>
          <Text style={st.systemTxt}>{msg.text}</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onLongPress={() => onLongPress(msg)}
        style={[st.msgBlock, isMe ? st.msgBlockMe : st.msgBlockThem]}
      >
        {/* 아바타 — 상대방만 */}
        {!isMe && (
          <View style={st.avatar}>
            <Text style={st.avatarTxt}>{(msg.name || "?").charAt(0)}</Text>
          </View>
        )}

        <View style={[st.bwrap, isMe && { alignItems: "flex-end" }]}>
          {/* 발신자 이름 (그룹, 상대방) */}
          {!isMe && room.isGroup && <Text style={st.sender}>{msg.name}</Text>}

          <View
            style={[st.bubbleRow, isMe && { flexDirection: "row-reverse" }]}
          >
            {/* 버블 */}
            <TouchableOpacity
              activeOpacity={0.85}
              onLongPress={() => onLongPress(msg)}
              style={[
                st.bubble,
                isMe ? st.bubbleMe : st.bubbleThem,
                isPinned && st.bubblePinned,
              ]}
            >
              {msg.forwarded && (
                <View style={st.fwdBadge}>
                  <Text style={st.fwdBadgeTxt}>
                    ↪ {msg.forwardedFrom}에서 전달됨
                  </Text>
                </View>
              )}

              {/* 답장 미리보기 */}
              {msg.replyTo && (
                <View style={st.replyInBubble}>
                  <Text style={st.replyInName}>{msg.replyTo.name}</Text>
                  <Text style={st.replyInText} numberOfLines={1}>
                    {msg.replyTo.fileName
                      ? `📎 ${msg.replyTo.fileName}`
                      : msg.replyTo.text}
                  </Text>
                </View>
              )}

              {msg.fileName && !msg.imageData ? (
                <View style={st.fileWrap}>
                  <Text style={{ fontSize: 20 }}>📎</Text>
                  <View>
                    <Text style={[st.fileName, isMe && { color: "#fff" }]}>
                      {msg.fileName}
                    </Text>
                    {msg.fileSize && (
                      <Text
                        style={[
                          st.fileSize,
                          isMe && { color: "rgba(255,255,255,0.7)" },
                        ]}
                      >
                        {msg.fileSize < 1024
                          ? `${msg.fileSize} B`
                          : msg.fileSize < 1048576
                            ? `${(msg.fileSize / 1024).toFixed(1)} KB`
                            : `${(msg.fileSize / 1048576).toFixed(1)} MB`}
                      </Text>
                    )}
                  </View>
                </View>
              ) : (
                <Text style={[st.bubbleTxt, isMe && st.bubbleTxtMe]}>
                  {msg.text}
                </Text>
              )}

              {msg.edited && (
                <Text
                  style={[
                    st.editedLabel,
                    isMe && { color: "rgba(255,255,255,0.6)" },
                  ]}
                >
                  수정됨
                </Text>
              )}
            </TouchableOpacity>

            {/* 시간 */}
            <View style={[st.sideMeta, isMe ? st.sideMetaMe : st.sideMetaThem]}>
              <Text style={st.timeTxt}>{fmtTime(msg.at)}</Text>
            </View>
          </View>

          {/* 리액션 */}
          {aggR.length > 0 && (
            <View
              style={[st.reactionsRow, isMe && { justifyContent: "flex-end" }]}
            >
              {aggR.map(([e, count]) => (
                <TouchableOpacity
                  key={e}
                  style={[st.reactionChip, myR === e && st.reactionMine]}
                  onPress={() => addReaction(msg.id, e)}
                >
                  <Text style={st.reactionTxt}>
                    {e} {count}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={st.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={56}
    >
      {/* 핀된 메시지 바 */}
      {pinned && (
        <View style={st.pinnedBar}>
          <Text style={{ fontSize: 12 }}>📌</Text>
          <Text style={st.pinnedTxt} numberOfLines={1}>
            <Text style={{ fontWeight: "700" }}>고정: </Text>
            {pinned.text || pinned.fileName}
          </Text>
          <TouchableOpacity onPress={() => setPinned(null)}>
            <Ionicons name="close" size={14} color={C.muted} />
          </TouchableOpacity>
        </View>
      )}

      {/* 메시지 검색 바 */}
      {showSearch && (
        <View style={st.searchBar}>
          <Ionicons name="search-outline" size={14} color={C.muted} />
          <TextInput
            style={st.searchInput}
            placeholder="메시지 검색..."
            placeholderTextColor={C.muted}
            value={searchQ}
            onChangeText={setSearchQ}
            autoFocus
          />
          {searchQ.trim() && (
            <Text style={st.searchCount}>{searchResults.length}건</Text>
          )}
          <TouchableOpacity
            onPress={() => {
              setShowSearch(false);
              setSearchQ("");
            }}
          >
            <Ionicons name="close" size={16} color={C.sub} />
          </TouchableOpacity>
        </View>
      )}

      {/* 메시지 목록 */}
      {loading ? (
        <View style={st.loadingBox}>
          <Text style={{ fontSize: 28, marginBottom: 8 }}>
            {room.avatar || "💬"}
          </Text>
          <Text style={st.loadingTxt}>{room.name}</Text>
          <Text style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
            첫 메시지를 보내보세요 👋
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={listItems}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={st.emptyBox}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>
                {room.avatar || "💬"}
              </Text>
              <Text style={st.loadingTxt}>{room.name}</Text>
              <Text style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                첫 메시지를 보내보세요 👋
              </Text>
            </View>
          }
        />
      )}

      {/* 수정 바 */}
      {editingMsg && (
        <View style={st.editBar}>
          <Ionicons name="pencil-outline" size={14} color={C.accent} />
          <View style={{ flex: 1 }}>
            <Text style={st.editBarLabel}>메시지 수정 중</Text>
            <Text style={st.editBarText} numberOfLines={1}>
              {editingMsg.text}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setEditingMsg(null);
              setInput("");
            }}
          >
            <Ionicons name="close" size={16} color={C.sub} />
          </TouchableOpacity>
        </View>
      )}

      {/* 답장 바 */}
      {replyTo && !editingMsg && (
        <View style={st.replyBar}>
          <Ionicons
            name="return-down-forward-outline"
            size={14}
            color={C.accent}
          />
          <View style={{ flex: 1 }}>
            <Text style={st.replyBarName}>{replyTo.name}에게 답장</Text>
            <Text style={st.replyBarText} numberOfLines={1}>
              {replyTo.fileName ? `📎 ${replyTo.fileName}` : replyTo.text}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setReplyTo(null)}>
            <Ionicons name="close" size={16} color={C.sub} />
          </TouchableOpacity>
        </View>
      )}

      {/* 입력 바 */}
      <View style={st.inputRow}>
        <TextInput
          ref={inputRef}
          style={st.input}
          placeholder={
            editingMsg ? "수정할 내용 입력…" : "메시지를 입력하세요…"
          }
          placeholderTextColor={C.muted}
          value={input}
          onChangeText={setInput}
          multiline
          onSubmitEditing={send}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[st.sendBtn, !input.trim() && st.sendBtnDisabled]}
          onPress={send}
          disabled={!input.trim()}
        >
          <Ionicons
            name="send"
            size={18}
            color={input.trim() ? "#fff" : C.muted}
          />
        </TouchableOpacity>
      </View>

      {/* 리액션 픽커 모달 */}
      <Modal
        visible={!!reactionTarget}
        transparent
        animationType="slide"
        onRequestClose={() => setReactionTarget(null)}
      >
        <TouchableOpacity
          style={st.emojiOverlay}
          activeOpacity={1}
          onPress={() => setReactionTarget(null)}
        >
          <View style={st.emojiSheet}>
            <Text style={st.emojiSheetTitle}>리액션 선택</Text>
            {/* 빠른 리액션 */}
            <View style={st.quickRow}>
              {QUICK_REACTIONS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={st.quickBtn}
                  onPress={() =>
                    reactionTarget && addReaction(reactionTarget.id, e)
                  }
                >
                  <Text style={{ fontSize: 26 }}>{e}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={st.quickBtn}
                onPress={() => setShowEmojiPicker(true)}
              >
                <Text style={{ fontSize: 20, color: C.sub }}>+</Text>
              </TouchableOpacity>
            </View>
            {showEmojiPicker && (
              <ScrollView
                style={st.emojiGrid}
                showsVerticalScrollIndicator={false}
              >
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {ALL_EMOJIS.map((e) => (
                    <TouchableOpacity
                      key={e}
                      style={st.emojiBtn}
                      onPress={() =>
                        reactionTarget && addReaction(reactionTarget.id, e)
                      }
                    >
                      <Text style={{ fontSize: 22 }}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // 날짜 구분선
  dateDiv: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 14,
  },
  dateDivLine: { flex: 1, height: 1, backgroundColor: C.border },
  dateDivTxt: { fontSize: 11, color: C.muted, fontWeight: "600" },

  // 시스템 메시지
  systemRow: { alignItems: "center", marginVertical: 8 },
  systemTxt: {
    fontSize: 11,
    color: C.muted,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },

  // 메시지 블록
  msgBlock: { flexDirection: "row", marginBottom: 8, alignItems: "flex-end" },
  msgBlockMe: { justifyContent: "flex-end" },
  msgBlockThem: { justifyContent: "flex-start" },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#e0e7ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    flexShrink: 0,
    marginBottom: 2,
  },
  avatarTxt: { fontSize: 14, fontWeight: "700", color: "#6366f1" },

  bwrap: { flex: 1, maxWidth: "80%" },
  sender: {
    fontSize: 11,
    fontWeight: "600",
    color: C.sub,
    marginBottom: 3,
    marginLeft: 2,
  },

  bubbleRow: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 9,
    maxWidth: "100%",
  },
  bubbleMe: {
    backgroundColor: C.bubbleMe,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: C.bubbleThem,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  bubblePinned: { borderWidth: 1.5, borderColor: "#f59e0b" },
  bubbleTxt: { fontSize: 14, color: C.text, lineHeight: 20 },
  bubbleTxtMe: { color: "#fff" },
  editedLabel: { fontSize: 10, color: C.muted, marginTop: 3 },

  // 전달 배지
  fwdBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 8,
    padding: 4,
    marginBottom: 5,
  },
  fwdBadgeTxt: { fontSize: 11, color: C.sub },

  // 답장 미리보기
  replyInBubble: {
    borderLeftWidth: 3,
    borderLeftColor: "rgba(255,255,255,0.5)",
    paddingLeft: 8,
    marginBottom: 6,
  },
  replyInName: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
    marginBottom: 2,
  },
  replyInText: { fontSize: 11, color: "rgba(255,255,255,0.7)" },

  // 파일
  fileWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  fileName: { fontSize: 13, fontWeight: "600", color: C.text },
  fileSize: { fontSize: 11, color: C.muted },

  sideMeta: { justifyContent: "flex-end", paddingBottom: 2 },
  sideMetaMe: { marginRight: 4 },
  sideMetaThem: { marginLeft: 4 },
  timeTxt: { fontSize: 10, color: C.muted, whiteSpace: "nowrap" } as any,

  // 리액션
  reactionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  reactionChip: {
    backgroundColor: C.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  reactionMine: { backgroundColor: "#eef2ff", borderColor: "#6366f1" },
  reactionTxt: { fontSize: 12 },

  // 핀 바
  pinnedBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fffbeb",
    borderBottomWidth: 1,
    borderBottomColor: "#fde68a",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pinnedTxt: { flex: 1, fontSize: 12, color: C.text },

  // 검색 바
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: C.text },
  searchCount: { fontSize: 11, color: C.accent, fontWeight: "700" },

  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  loadingTxt: { fontSize: 16, fontWeight: "700", color: C.text },

  // 수정 바
  editBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#eef2ff",
    borderTopWidth: 1,
    borderTopColor: "#c7d2fe",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  editBarLabel: { fontSize: 11, fontWeight: "700", color: C.accent },
  editBarText: { fontSize: 12, color: C.sub },

  // 답장 바
  replyBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f0f9ff",
    borderTopWidth: 1,
    borderTopColor: "#bae6fd",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  replyBarName: { fontSize: 11, fontWeight: "700", color: "#0284c7" },
  replyBarText: { fontSize: 12, color: C.sub },

  // 입력 바
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    backgroundColor: C.bg,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: C.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: C.border,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: C.border },

  // 리액션 모달
  emojiOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  emojiSheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 16,
    maxHeight: 380,
  },
  emojiSheetTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
    marginBottom: 14,
    textAlign: "center",
  },
  quickRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 14,
  },
  quickBtn: { padding: 6 },
  emojiGrid: { maxHeight: 200 },
  emojiBtn: { width: "12.5%", padding: 6, alignItems: "center" },
});
