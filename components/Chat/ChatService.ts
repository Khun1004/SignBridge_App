// ══════════════════════════════════════════════════════════════
//  chatService.ts — SignBridge React Native 채팅 서비스
//  웹 chatService.js → React Native 변환
//  SockJS 대신 WebSocket + STOMP 프로토콜 직접 구현
// ══════════════════════════════════════════════════════════════
import { SERVER_IP } from "@/components/api/api";

const BASE_URL = `http://${SERVER_IP}:8080`;
const WS_URL = `ws://${SERVER_IP}:8080/ws-chat/websocket`;

export interface ChatMessage {
  id: number | string;
  roomId?: string | number;
  senderEmail?: string;
  senderName?: string;
  email?: string; // 로컬 호환용
  name?: string;
  text?: string;
  fileName?: string;
  fileSize?: number;
  imageData?: string;
  at?: string;
  sentAt?: string;
  reactions?: Record<string, string>;
  replyTo?: {
    id: string | number;
    name: string;
    text?: string;
    fileName?: string;
  } | null;
  edited?: boolean;
  forwarded?: boolean;
  forwardedFrom?: string;
  isSystem?: boolean;
  type?: string;
}

export interface ChatRoom {
  id: string | number;
  roomId?: string | number;
  name: string;
  avatar?: string;
  sub?: string;
  lastMsg?: string;
  lastAt?: string;
  unread?: number;
  muted?: boolean;
  isGroup?: boolean;
  isOfficial?: boolean;
  memberCount?: number;
  description?: string;
}

type MessageHandler = (msg: ChatMessage) => void;

class ChatService {
  private ws: WebSocket | null = null;
  private connected = false;
  private subscriptions: Map<string, MessageHandler> = new Map();
  private pendingQueue: (() => void)[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private baseUrl = BASE_URL;

  connect(baseUrl = BASE_URL) {
    if (this.connected) return;
    this.baseUrl = baseUrl;
    this._openWs();
  }

  private _openWs() {
    try {
      // STOMP over plain WebSocket
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        // Send STOMP CONNECT frame
        this.ws?.send("CONNECT\naccept-version:1.2\nheart-beat:0,0\n\n\0");
      };

      this.ws.onmessage = (e) => {
        const raw: string = e.data;
        if (raw.startsWith("CONNECTED")) {
          this.connected = true;
          console.log("[ChatService] STOMP connected");
          this.pendingQueue.forEach((fn) => fn());
          this.pendingQueue = [];
          // Re-subscribe to all active rooms
          this.subscriptions.forEach((_, roomId) => {
            this._stompSubscribe(roomId);
          });
          return;
        }
        if (raw.startsWith("MESSAGE")) {
          const bodyStart = raw.indexOf("\n\n") + 2;
          const body = raw.slice(bodyStart).replace(/\0$/, "");
          const destMatch = raw.match(/destination:([^\n]+)/);
          const dest = destMatch?.[1]?.trim();
          if (dest) {
            const roomMatch = dest.match(/\/topic\/room\/(.+)/);
            if (roomMatch) {
              const roomId = roomMatch[1];
              try {
                const msg: ChatMessage = JSON.parse(body);
                // normalize fields
                msg.email = msg.email || msg.senderEmail;
                msg.name = msg.name || msg.senderName;
                msg.at = msg.at || msg.sentAt || new Date().toISOString();
                if (!msg.reactions) msg.reactions = {};
                this.subscriptions.get(roomId)?.(msg);
              } catch {}
            }
          }
        }
      };

      this.ws.onerror = (e) => {
        console.warn("[ChatService] WebSocket error", e);
      };

      this.ws.onclose = () => {
        this.connected = false;
        console.log("[ChatService] Disconnected — reconnecting in 4s");
        this.reconnectTimer = setTimeout(() => this._openWs(), 4000);
      };
    } catch (e) {
      console.warn("[ChatService] connect failed", e);
    }
  }

  private _stompSubscribe(roomId: string) {
    const frame = `SUBSCRIBE\nid:sub-${roomId}\ndestination:/topic/room/${roomId}\n\n\0`;
    this.ws?.send(frame);
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.connected = false;
    this.subscriptions.clear();
  }

  subscribeToRoom(
    roomId: string | number,
    onMessage: MessageHandler,
  ): () => void {
    const key = String(roomId);
    this.subscriptions.set(key, onMessage);
    if (this.connected) {
      this._stompSubscribe(key);
    }
    return () => {
      this.subscriptions.delete(key);
      if (this.connected) {
        this.ws?.send(`UNSUBSCRIBE\nid:sub-${key}\n\n\0`);
      }
    };
  }

  sendMessage(payload: {
    roomId: string | number;
    senderEmail: string;
    senderName: string;
    text: string;
    replyToId?: string | number;
  }) {
    this._publish("/app/chat.send", payload);
  }

  editMessage(id: string | number, roomId: string | number, newText: string) {
    this._publish("/app/chat.edit", {
      id,
      roomId,
      text: newText,
      type: "EDIT",
    });
  }

  deleteMessage(id: string | number, roomId: string | number) {
    this._publish("/app/chat.delete", { id, roomId, type: "DELETE" });
  }

  private _publish(destination: string, body: object) {
    const send = () => {
      const frame = `SEND\ndestination:${destination}\ncontent-type:application/json\n\n${JSON.stringify(body)}\0`;
      this.ws?.send(frame);
    };
    if (this.connected) {
      send();
    } else {
      this.pendingQueue.push(send);
    }
  }

  // ── REST ──────────────────────────────────────────────────

  async getRooms(email: string): Promise<ChatRoom[]> {
    const res = await fetch(
      `${this.baseUrl}/api/chat/rooms?email=${encodeURIComponent(email)}`,
    );
    if (!res.ok) throw new Error("Failed to load rooms");
    const data = await res.json();
    return data.map((r: any) => ({ ...r, id: r.roomId || r.id }));
  }

  async getMessages(roomId: string | number): Promise<ChatMessage[]> {
    const res = await fetch(
      `${this.baseUrl}/api/chat/rooms/${roomId}/messages`,
    );
    if (!res.ok) throw new Error("Failed to load messages");
    const data: any[] = await res.json();
    return data.map((m) => ({
      ...m,
      email: m.email || m.senderEmail,
      name: m.name || m.senderName,
      at: m.at || m.sentAt || new Date().toISOString(),
      reactions: m.reactions || {},
    }));
  }

  async createDirectRoom(
    emailA: string,
    nameA: string,
    emailB: string,
    nameB: string,
  ): Promise<ChatRoom> {
    const res = await fetch(`${this.baseUrl}/api/chat/rooms/direct`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailA, nameA, emailB, nameB }),
    });
    if (!res.ok) throw new Error("Failed to create room");
    const r = await res.json();
    return { ...r, id: r.roomId || r.id };
  }
}

const chatService = new ChatService();
export default chatService;
