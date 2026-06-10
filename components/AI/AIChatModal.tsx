// ══════════════════════════════════════════════════════════════
//  components/AI/AIChatModal.tsx
//  풀스크린 AI 채팅 (로컬 키워드 매칭 방식 — API 비용 없음)
// ══════════════════════════════════════════════════════════════
import { useAuth } from "@/components/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ── 색상 상수 ──────────────────────────────────────────────────
const C = {
  bg: "#0a0a14",
  surface: "#13131f",
  surface2: "#1e1e30",
  border: "rgba(255,255,255,0.08)",
  accent: "#7c6fff",
  text: "#f0f2f7",
  sub: "#7a8099",
  green: "#10b981",
  userBg: "#7c6fff",
  aiBg: "#1e1e30",
};

// ── 빠른 질문 ──────────────────────────────────────────────────
const QUICK_QUESTIONS = [
  "안녕하세요 수어로 어떻게 해요?",
  "감사합니다 수어 알려주세요",
  "수어 배우는 좋은 방법은?",
  "청각장애인과 소통하는 팁",
  "도와주세요 수어로?",
  "수어 알파벳 알려주세요",
];

// ══════════════════════════════════════════════════════════════
//  로컬 Q&A 데이터베이스 (키워드 → 답변)
//  keywords 중 하나라도 사용자 입력에 포함되면 매칭
// ══════════════════════════════════════════════════════════════
interface QAEntry {
  keywords: string[];
  answer: string;
}

const QA_DATABASE: QAEntry[] = [
  // ── 인사 ──────────────────────────────────────────────────
  {
    keywords: ["안녕", "안녕하세요", "반갑", "처음"],
    answer:
      "안녕하세요! 🤟\n\n'안녕하세요' 수어는 오른손을 펼쳐 이마 옆에서 앞으로 살짝 내미는 동작이에요.\n\n손바닥이 상대방을 향하게 하고, 부드럽게 흔들어 주면 더 자연스럽습니다. 밝은 표정도 함께 지어 주세요! 😊",
  },
  {
    keywords: ["감사", "고마", "고맙"],
    answer:
      "감사합니다 수어는 이렇게 해요! 🙏\n\n① 오른손 손끝을 모아 턱 아래에 댑니다.\n② 손을 아래 앞쪽으로 살짝 내밀어요.\n\n마치 턱에서 상대방을 향해 감사의 마음을 보내는 느낌입니다. 표정도 밝고 따뜻하게 지어 주세요!",
  },
  {
    keywords: ["도와", "도움", "help"],
    answer:
      "'도와주세요' 수어를 알려드릴게요! 🤝\n\n① 왼손을 수평으로 펼쳐 아래에 놓습니다.\n② 오른손 엄지를 세워 왼손 위에 올립니다.\n③ 두 손을 함께 위로 올려요.\n\n'들어올린다'는 느낌으로 동작하면 자연스럽습니다. 표정은 진지하게!",
  },
  // ── 수어 표현 ──────────────────────────────────────────────
  {
    keywords: ["사랑", "좋아"],
    answer:
      "'사랑해요' 수어는 이렇게요! ❤️\n\n오른손으로 주먹을 쥐고 검지와 새끼손가락만 펴서 가슴에 대세요. 그 상태로 상대방 쪽으로 손을 내밀어요.\n\n또는 양손을 교차해서 가슴에 얹는 동작도 '사랑'을 표현해요. 표정은 따뜻하고 진심 어린 눈빛으로!",
  },
  {
    keywords: ["미안", "죄송", "sorry"],
    answer:
      "'미안합니다' 수어예요 🙇\n\n오른손 주먹을 쥐고 가슴 위에서 원을 그리듯 돌려요. 시계 방향으로 두세 번 천천히 돌리면 됩니다.\n\n표정은 고개를 살짝 숙이며 진지한 표정을 지어 주세요. 눈 맞춤도 중요해요.",
  },
  {
    keywords: ["화장실", "어디", "방향"],
    answer:
      "'화장실이 어디에요?' 수어예요! 🚻\n\n① '화장실': 손가락으로 W 모양을 만들어 흔들기\n② '어디': 검지를 세워 좌우로 흔들기\n\n실생활에서 바로 쓸 수 있는 유용한 표현이에요. 표정은 의문형으로 눈썹을 살짝 올려 주세요.",
  },
  {
    keywords: ["이름", "누구", "name"],
    answer:
      "'이름이 무엇인가요?' 수어예요 😊\n\n① '이름': 오른손 검지와 중지를 펴서 이마 옆에서 내림\n② '무엇': 검지를 세워 좌우로 흔들기\n\n상대방의 이름을 물을 때 쓰는 기본 표현이에요. 질문할 때는 표정이 중요하니 눈썹을 살짝 올려 주세요!",
  },
  {
    keywords: ["좋아요", "좋다", "완벽", "훌륭"],
    answer:
      "'좋아요' 수어예요! 👍\n\n엄지손가락을 위로 세워 살짝 흔들어 주면 돼요. 아주 간단하죠?\n\n또는 두 손을 가슴 앞에서 위로 올리는 동작도 긍정을 표현해요. 밝은 미소도 잊지 마세요!",
  },
  {
    keywords: ["싫어", "안돼", "아니", "no"],
    answer:
      "'아니요' / '싫어요' 수어예요!\n\n손을 좌우로 흔들거나, 검지를 세워 앞으로 흔들어요. 고개를 가로젓는 것도 함께 해주면 더 명확해요.\n\n수어에서는 표정과 고개 움직임도 중요한 문법 역할을 해요!",
  },
  {
    keywords: ["맞아", "그래", "응", "yes", "예"],
    answer:
      "'네' / '맞아요' 수어예요! ✅\n\n주먹을 쥐고 위아래로 살짝 흔들어요. 고개를 함께 끄덕이면 더 자연스럽습니다.\n\n수어에서 고개 끄덕임은 긍정을 나타내는 중요한 신호예요.",
  },
  // ── 수어 학습 ──────────────────────────────────────────────
  {
    keywords: ["배우", "공부", "학습", "어떻게"],
    answer:
      "수어를 잘 배우려면 이렇게 해보세요! 📚\n\n① 기본 인사부터 시작하기 — 안녕, 감사합니다, 죄송해요\n② 매일 10~15분씩 꾸준히 연습\n③ 거울 보며 내 표정과 손동작 확인\n④ 유튜브나 앱으로 원어민 영상 시청\n⑤ 청각장애인 커뮤니티와 실제로 소통 시도\n\n가장 중요한 것은 꾸준함이에요. 하루 조금씩!",
  },
  {
    keywords: ["알파벳", "자모", "지문자", "수지"],
    answer:
      "한국 수어 지문자(수지 알파벳)를 소개할게요! 🤌\n\n한국 수어에는 한글 자음과 모음을 손가락으로 표현하는 '지문자' 체계가 있어요.\n\n① ㄱ: 검지를 구부려 ㄱ 모양\n② ㄴ: 검지와 엄지로 ㄴ 모양\n③ ㅇ: 엄지와 검지로 원 모양\n\n지문자는 이름이나 특별한 단어를 표현할 때 특히 유용해요!",
  },
  {
    keywords: ["숫자", "수"],
    answer:
      "수어 숫자 표현이에요! 🔢\n\n① 1: 검지만 펴기\n② 2: 검지 + 중지\n③ 3: 검지 + 중지 + 약지\n④ 4: 엄지 빼고 나머지 네 손가락\n⑤ 5: 손 전체 펴기\n⑥ 6: 엄지 + 새끼손가락\n⑦ 7: 엄지 + 약지\n⑧ 8: 엄지 + 중지\n⑨ 9: 엄지 + 검지\n⑩ 10: 엄지만 펴거나 주먹 흔들기",
  },
  {
    keywords: ["속도", "빠르", "빨리"],
    answer:
      "수어 속도에 대해 알려드릴게요! ⏱️\n\n원어민 수어 화자는 생각보다 빠르게 수어를 해요. 처음에는 천천히 연습하고 점점 속도를 높여가는 게 좋아요.\n\n연습 팁:\n• 처음엔 거울 보며 느리게\n• 영상으로 보고 따라 하기\n• 녹화해서 비교해보기\n• 꾸준한 반복이 핵심!",
  },
  // ── 청각장애 소통 ──────────────────────────────────────────
  {
    keywords: ["소통", "대화", "말하기", "이야기"],
    answer:
      "청각장애인과 소통하는 팁을 알려드릴게요! 💬\n\n① 눈 맞춤 유지하기 — 수어 대화에서 가장 중요해요\n② 입 모양 크게, 천천히 말하기\n③ 필담(메모장에 써서 소통)도 효과적\n④ 스마트폰 문자나 채팅 앱 활용\n⑤ 갑자기 뒤에서 부르지 않기\n⑥ 밝은 곳에서 대화해서 입 모양이 잘 보이게 하기",
  },
  {
    keywords: ["청각", "장애", "농인", "농"],
    answer:
      "청각장애에 대해 알려드릴게요! 👂\n\n청각장애는 소리를 듣는 데 어려움이 있는 상태예요. 선천성과 후천성으로 나뉘어요.\n\n• 농인(Deaf): 대부분 수어를 모국어로 사용\n• 난청인: 보청기나 잔존 청력을 활용\n• 인공와우: 수술로 청력을 일부 회복\n\n수어는 농인 문화와 정체성의 중요한 부분이에요! 존중하는 마음으로 배워보세요.",
  },
  {
    keywords: ["보청기"],
    answer:
      "보청기에 대해 알려드릴게요! 🔊\n\n보청기는 소리를 증폭시켜 청력 손실을 보완하는 장치예요.\n\n• 귓속형, 귀걸이형 등 다양한 종류\n• 잔존 청력이 있는 분들께 효과적\n• 모든 청각장애인이 사용하진 않아요\n\n보청기 사용자와 대화할 때도 천천히 또렷하게 말하고, 배경 소음이 적은 환경을 만들어 주세요.",
  },
  {
    keywords: ["수어 통역", "통역사", "통역"],
    answer:
      "수어 통역에 대해 알려드릴게요! 🙋\n\n수어 통역사는 음성 언어와 수어를 실시간으로 통역해 주는 전문가예요.\n\n• 병원, 법원, 방송 등 다양한 곳에서 활동\n• 한국에는 '한국수어' 자격증 제도가 있어요\n• 영상 통역 서비스(VRS)도 점점 늘어나는 추세\n\n통역사를 통해 소통할 때는 통역사가 아닌 당사자를 바라보며 말하는 게 예의예요.",
  },
  // ── SignBridge 앱 ──────────────────────────────────────────
  {
    keywords: ["signbridge", "앱", "기능", "이 앱"],
    answer:
      "SignBridge 앱에 대해 알려드릴게요! 📱\n\nSignBridge는 수어와 음성 언어의 소통 다리 역할을 하는 앱이에요.\n\n주요 기능:\n• 수어 영상 학습 콘텐츠\n• AI 기반 수어 인식\n• 실시간 소통 지원\n• 청각장애 관련 정보 제공\n\n궁금한 기능이 있으면 더 물어보세요!",
  },
  // ── 문화/예절 ──────────────────────────────────────────────
  {
    keywords: ["예절", "예의", "매너", "존중"],
    answer:
      "청각장애인과 소통할 때의 예절이에요! 🙏\n\n① 대화 시작 전 가볍게 어깨나 팔을 터치해 주의 끌기\n② 눈 맞춤 유지 (시선을 돌리면 대화가 끊겨요)\n③ 통역사와 대화할 때 통역사가 아닌 당사자 바라보기\n④ 천천히 또렷하게 입 모양 만들기\n⑤ 수어를 배우려는 노력 자체가 큰 존중이에요!",
  },
  {
    keywords: ["문화", "농문화", "공동체", "커뮤니티"],
    answer:
      "농(Deaf) 문화에 대해 알려드릴게요! 🌍\n\n농 문화는 청각장애인들이 공유하는 언어, 가치관, 전통을 포함해요.\n\n• 수어는 단순한 도구가 아닌 문화와 정체성의 핵심\n• 농학교를 중심으로 강한 커뮤니티 형성\n• 농인의 날, 농 스포츠 등 다양한 문화 행사\n• '장애'가 아닌 '차이'로 보는 시각이 중요해요\n\n농 문화를 이해하면 더 깊은 소통이 가능해요!",
  },
  // ── 일상 수어 표현 ──────────────────────────────────────────
  {
    keywords: ["밥", "먹다", "식사"],
    answer:
      "'밥 먹었어요?' 수어예요! 🍚\n\n① '밥': 두 손으로 밥그릇 모양을 만들거나, 손가락을 모아 입에 넣는 시늉\n② '먹다': 오른손을 모아 입으로 가져가는 동작\n③ 질문할 때: 눈썹을 살짝 올려 의문 표정\n\n식사와 관련된 수어는 실생활에서 바로 써볼 수 있어요!",
  },
  {
    keywords: ["날씨", "오늘", "기온", "더워", "추워"],
    answer:
      "날씨 관련 수어를 알려드릴게요! ☀️\n\n• 맑다: 두 손을 위로 펼치며 태양처럼 펼치기\n• 덥다: 손으로 얼굴 앞에서 부채질하기\n• 춥다: 양팔로 몸을 감싸 떠는 동작\n• 비: 손가락을 위에서 아래로 흔들기\n• 눈: 손가락을 흔들며 아래로 떨어뜨리기\n\n날씨 표현은 자연스러운 동작과 비슷해서 기억하기 쉬워요!",
  },
  {
    keywords: ["물", "음료", "마시"],
    answer:
      "'물 마실게요' 수어예요! 💧\n\n① '물': C자 모양 손으로 입에 가져가기 또는 W 손 모양\n② '마시다': 컵을 들고 마시는 시늉\n\n음료 관련 수어는 동작이 직관적이라 처음 배우는 분도 기억하기 쉬워요!",
  },
  // ── 응급/중요 상황 ────────────────────────────────────────
  {
    keywords: ["위험", "응급", "긴급", "경찰", "119", "112"],
    answer:
      "응급 상황 수어예요! 🚨\n\n'도와주세요!' 긴급 표현:\n① 두 손을 머리 위로 들어 크게 흔들기\n② 또는 양손을 앞으로 내밀며 '도움' 표현\n\n응급 상황에서는:\n• 119 / 112 문자 신고 가능 (청각장애인 문자 신고)\n• '손말이음' 앱으로 영상 119 신고 가능\n• 주변 사람에게 메모로 알리기\n\n안전이 최우선이에요!",
  },
  {
    keywords: ["병원", "아프", "아파", "몸"],
    answer:
      "병원 관련 수어예요! 🏥\n\n① '아프다': 아픈 부위에 손을 대고 찡그린 표정\n② '병원': 두 손 검지로 적십자(+) 표시\n③ '의사': 손목 맥박 재는 동작\n\n병원에서 청각장애인은 필담, 수어 통역 서비스를 요청할 권리가 있어요. 대부분의 큰 병원에 수어 통역 연계 서비스가 있답니다.",
  },
];

// ── 기본 답변 (매칭 없을 때) ──────────────────────────────────
const DEFAULT_ANSWERS = [
  "좋은 질문이에요! 🤟\n\n저는 수어와 청각장애 소통 전문 AI입니다. 수어 표현, 청각장애 문화, 소통 방법에 대해 물어봐 주세요!\n\n예시: '감사합니다 수어로 어떻게 해요?', '청각장애인과 대화하는 팁 알려주세요'",
  "그 부분은 제가 잘 모르겠어요 😊\n\n수어 표현이나 청각장애 소통에 관한 질문을 해주시면 더 잘 도와드릴 수 있어요!\n\n아래 빠른 질문 버튼을 눌러보시거나, 구체적인 수어 표현을 물어봐 주세요.",
  "좀 더 구체적으로 알려주시면 도움이 될 것 같아요 🙏\n\n예를 들어:\n• '~수어로 어떻게 해요?'\n• '청각장애인과 소통하는 방법'\n• '수어 배우는 팁'\n\n이런 형태로 질문해 주시면 좋겠어요!",
];

// ── 답변 찾기 함수 ──────────────────────────────────────────
function findAnswer(userInput: string): string {
  const input = userInput.toLowerCase().replace(/\s/g, "");
  for (const qa of QA_DATABASE) {
    for (const keyword of qa.keywords) {
      if (input.includes(keyword.replace(/\s/g, ""))) {
        return qa.answer;
      }
    }
  }
  return DEFAULT_ANSWERS[Math.floor(Math.random() * DEFAULT_ANSWERS.length)];
}

// ── 타입 정의 ────────────────────────────────────────────────
interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  loading?: boolean;
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

// ══════════════════════════════════════════════════════════════
//  메인 컴포넌트
// ══════════════════════════════════════════════════════════════
export default function AIChatModal({ visible, onClose }: Props) {
  const { loggedIn, displayName } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  // ── 초기 메시지 ──────────────────────────────────────────
  useEffect(() => {
    if (visible && messages.length === 0) {
      setMessages([
        {
          id: 0,
          role: "assistant",
          content: `안녕하세요${displayName ? `, ${displayName}님` : ""}! 🤟\n\n저는 SignBridge AI 어시스턴트입니다.\n수어·청각장애·의사소통에 관해 무엇이든 물어보세요!`,
        },
      ]);
    }
  }, [visible]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
  }, [messages]);

  // ── TTS ──────────────────────────────────────────────────
  const speakMessage = (text: string) => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    Speech.speak(text, {
      language: "ko-KR",
      rate: 0.95,
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  // ── 메시지 전송 (로컬 처리) ──────────────────────────────
  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    setInput("");
    setSending(true);

    const userMsg: Message = { id: Date.now(), role: "user", content };
    const loadingMsg: Message = {
      id: Date.now() + 1,
      role: "assistant",
      content: "",
      loading: true,
    };
    setMessages((prev) => [...prev, userMsg, loadingMsg]);

    // 로컬에서 답변 생성 (네트워크 없음)
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 600));
    const reply = findAnswer(content);

    setMessages((prev) =>
      prev.map((m) =>
        m.loading ? { ...m, loading: false, content: reply } : m,
      ),
    );
    setSending(false);
    speakMessage(reply);
  };

  const clearChat = () => {
    Speech.stop();
    setSpeaking(false);
    setMessages([
      {
        id: Date.now(),
        role: "assistant",
        content: "대화가 초기화되었습니다. 무엇이든 물어보세요! 🤟",
      },
    ]);
  };

  const handleClose = () => {
    Speech.stop();
    setSpeaking(false);
    onClose();
  };

  // ── 비로그인 ────────────────────────────────────────────
  const renderGate = () => (
    <View style={s.gate}>
      <Text style={{ fontSize: 56 }}>🔒</Text>
      <Text style={s.gateTitle}>로그인이 필요합니다</Text>
      <Text style={s.gateSub}>
        AI 어시스턴트를 사용하려면 먼저 로그인 해주세요.
      </Text>
      <TouchableOpacity style={s.gateBtn} onPress={handleClose}>
        <Text style={s.gateBtnTxt}>닫기</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={s.root}>
        {/* ── 헤더 ── */}
        <View style={s.header}>
          <TouchableOpacity style={s.iconBtn} onPress={handleClose}>
            <Ionicons name="chevron-down" size={22} color={C.sub} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <View style={s.aiDot} />
            <Text style={s.headerTitle}>SignBridge AI</Text>
          </View>
          <TouchableOpacity style={s.iconBtn} onPress={clearChat}>
            <Ionicons name="refresh-outline" size={20} color={C.sub} />
          </TouchableOpacity>
        </View>

        {!loggedIn ? (
          renderGate()
        ) : (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            {/* ── 메시지 목록 ── */}
            <ScrollView
              ref={scrollRef}
              style={s.list}
              contentContainerStyle={{ padding: 16, gap: 14 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[s.row, msg.role === "user" ? s.rowUser : s.rowAI]}
                >
                  {msg.role === "assistant" && (
                    <View style={s.avatarAI}>
                      <Text style={{ fontSize: 16 }}>🤖</Text>
                    </View>
                  )}
                  <View style={{ maxWidth: "78%", gap: 5 }}>
                    <View
                      style={[
                        s.bubble,
                        msg.role === "user" ? s.bubbleUser : s.bubbleAI,
                      ]}
                    >
                      {msg.loading ? (
                        <View style={s.loadingRow}>
                          <ActivityIndicator size="small" color={C.accent} />
                          <Text style={s.loadingTxt}>생각 중...</Text>
                        </View>
                      ) : (
                        <Text
                          style={[
                            s.bubbleTxt,
                            msg.role === "user" && { color: "#fff" },
                          ]}
                        >
                          {msg.content}
                        </Text>
                      )}
                    </View>
                    {msg.role === "assistant" && !msg.loading && (
                      <TouchableOpacity
                        style={s.ttsBtn}
                        onPress={() => speakMessage(msg.content)}
                      >
                        <Ionicons
                          name={
                            speaking ? "volume-high" : "volume-medium-outline"
                          }
                          size={14}
                          color={C.accent}
                        />
                        <Text style={s.ttsBtnTxt}>
                          {speaking ? "재생 중 (탭하면 정지)" : "소리로 듣기"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* ── 빠른 질문 ── */}
            {messages.length <= 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={s.quickBar}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
              >
                {QUICK_QUESTIONS.map((q, i) => (
                  <TouchableOpacity
                    key={i}
                    style={s.quickChip}
                    onPress={() => send(q)}
                  >
                    <Text style={s.quickChipTxt}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* ── 입력바 ── */}
            <View style={s.inputBar}>
              <TextInput
                ref={inputRef}
                style={s.input}
                placeholder="무엇이든 물어보세요..."
                placeholderTextColor="rgba(255,255,255,0.22)"
                value={input}
                onChangeText={setInput}
                multiline
                maxLength={300}
              />
              <TouchableOpacity
                style={[s.sendBtn, (!input.trim() || sending) && s.sendBtnOff]}
                onPress={() => send()}
                disabled={!input.trim() || sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ── 스타일 ──────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.surface,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 16, fontWeight: "800", color: C.text },
  aiDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.green },

  gate: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 14,
  },
  gateTitle: { fontSize: 20, fontWeight: "800", color: C.text },
  gateSub: { fontSize: 14, color: C.sub, textAlign: "center", lineHeight: 22 },
  gateBtn: {
    marginTop: 8,
    backgroundColor: C.accent,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  gateBtnTxt: { color: "#fff", fontSize: 15, fontWeight: "700" },

  list: { flex: 1 },
  row: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  rowAI: { justifyContent: "flex-start" },
  rowUser: { justifyContent: "flex-end" },
  avatarAI: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.surface2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginBottom: 24,
  },

  bubble: { padding: 13, borderRadius: 18 },
  bubbleAI: {
    backgroundColor: C.aiBg,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  bubbleUser: { backgroundColor: C.userBg, borderBottomRightRadius: 4 },
  bubbleTxt: { fontSize: 14, color: C.text, lineHeight: 22 },

  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  loadingTxt: { fontSize: 13, color: C.sub },

  ttsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: 2,
  },
  ttsBtnTxt: { fontSize: 11, color: C.accent, fontWeight: "600" },

  quickBar: { maxHeight: 46, marginBottom: 6 },
  quickChip: {
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: "rgba(124,111,255,0.3)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexShrink: 0,
  },
  quickChipTxt: { fontSize: 12, color: C.accent, fontWeight: "600" },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    paddingBottom: Platform.OS === "ios" ? 28 : 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.surface,
  },
  input: {
    flex: 1,
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: "rgba(124,111,255,0.2)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: C.text,
    maxHeight: 110,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnOff: { backgroundColor: "rgba(124,111,255,0.3)" },
});
