// components/Practice/signs.ts
// ── 수어 데이터 (국립국어원 한국수어사전 기반) ─────────────────

export interface Sign {
  id: number;
  emoji: string;
  word: string;
  category: string;
  desc: string;
  level: 1 | 2;
  params: {
    수형: string;
    수위: string;
    수동: string;
    수향?: string;
    비수지?: string;
  };
}

export interface Category {
  id: string;
  label: string;
  icon: string;
}

export const SIGNS: Sign[] = [
  // ── 인사 ──
  {
    id: 1,
    emoji: "👋",
    word: "안녕하세요",
    category: "인사",
    desc: "오른손을 펼쳐 귀 옆에서 앞으로 가볍게 흔든다.",
    level: 1,
    params: {
      수형: "open",
      수위: "얼굴 옆 (귀 높이)",
      수동: "앞으로 내밀며 좌우 흔들기",
      수향: "앞",
      비수지: "밝은 표정, 눈 맞춤",
    },
  },
  {
    id: 2,
    emoji: "🙏",
    word: "감사합니다",
    category: "인사",
    desc: "손끝을 모아 입술 아래에 댔다가 앞으로 내민다.",
    level: 1,
    params: {
      수형: "flato",
      수위: "입 앞",
      수동: "앞 아래로 뻗기",
      수향: "앞",
      비수지: "진심 어린 표정",
    },
  },
  {
    id: 3,
    emoji: "👐",
    word: "반갑습니다",
    category: "인사",
    desc: "양손을 펼쳐 가슴 앞에서 서로 가볍게 마주친다.",
    level: 1,
    params: {
      수형: "open",
      수위: "가슴 앞",
      수동: "좌우 양손 가볍게 마주치기",
      비수지: "밝은 미소",
    },
  },
  {
    id: 4,
    emoji: "🤝",
    word: "처음 뵙겠습니다",
    category: "인사",
    desc: "오른손을 앞으로 내밀며 고개를 살짝 숙인다.",
    level: 2,
    params: {
      수형: "open",
      수위: "가슴~어깨 높이",
      수동: "앞으로 내밀기",
      비수지: "고개 숙임",
    },
  },
  {
    id: 5,
    emoji: "👋",
    word: "안녕히 가세요",
    category: "인사",
    desc: "손을 위에서 아래로 내리며 흔든다.",
    level: 1,
    params: {
      수형: "open",
      수위: "머리 위",
      수동: "아래로 내리며 흔들기",
      비수지: "미소",
    },
  },

  // ── 감정 ──
  {
    id: 6,
    emoji: "😊",
    word: "기쁨",
    category: "감정",
    desc: "두 손을 가슴 앞에서 바깥으로 펼친다.",
    level: 1,
    params: {
      수형: "open",
      수위: "가슴 앞",
      수동: "바깥으로 펼치기",
      비수지: "환한 미소",
    },
  },
  {
    id: 7,
    emoji: "😢",
    word: "슬픔",
    category: "감정",
    desc: "양 검지로 눈 아래를 쓸어내린다.",
    level: 1,
    params: {
      수형: "point1",
      수위: "눈 아래",
      수동: "아래로 쓸기",
      비수지: "슬픈 표정, 눈썹 내림",
    },
  },
  {
    id: 8,
    emoji: "😠",
    word: "화남",
    category: "감정",
    desc: "주먹을 쥐고 가슴 앞에서 앞으로 밀며 떨린다.",
    level: 2,
    params: {
      수형: "fist",
      수위: "가슴 앞",
      수동: "앞으로 밀기 + 떨기",
      비수지: "찡그린 표정",
    },
  },
  {
    id: 9,
    emoji: "❤️",
    word: "사랑",
    category: "감정",
    desc: "두 팔을 X자로 가슴 위에 얹는다.",
    level: 1,
    params: {
      수형: "open",
      수위: "가슴",
      수동: "X자 교차하여 얹기",
      비수지: "따뜻한 표정",
    },
  },
  {
    id: 10,
    emoji: "😨",
    word: "두려움",
    category: "감정",
    desc: "양손을 가슴 앞에 세우고 몸을 살짝 뒤로 젖힌다.",
    level: 2,
    params: {
      수형: "open",
      수위: "가슴 앞",
      수동: "가슴 앞에 세우기",
      비수지: "눈 크게 뜨기, 입 벌림",
    },
  },

  // ── 숫자 ──
  {
    id: 11,
    emoji: "1️⃣",
    word: "일",
    category: "숫자",
    desc: "검지만 세운다.",
    level: 1,
    params: { 수형: "point1", 수위: "가슴 앞", 수동: "정지" },
  },
  {
    id: 12,
    emoji: "2️⃣",
    word: "이",
    category: "숫자",
    desc: "검지와 중지를 세운다.",
    level: 1,
    params: { 수형: "point2", 수위: "가슴 앞", 수동: "정지" },
  },
  {
    id: 13,
    emoji: "3️⃣",
    word: "삼",
    category: "숫자",
    desc: "검지·중지·약지를 세운다.",
    level: 1,
    params: { 수형: "threefinger", 수위: "가슴 앞", 수동: "정지" },
  },
  {
    id: 14,
    emoji: "5️⃣",
    word: "오",
    category: "숫자",
    desc: "다섯 손가락을 모두 편다.",
    level: 1,
    params: { 수형: "open", 수위: "가슴 앞", 수동: "정지" },
  },
  {
    id: 15,
    emoji: "🔟",
    word: "십",
    category: "숫자",
    desc: "엄지를 세운 주먹을 좌우로 흔든다.",
    level: 1,
    params: { 수형: "thumb", 수위: "가슴 앞", 수동: "좌우 흔들기" },
  },

  // ── 장소 ──
  {
    id: 16,
    emoji: "🏠",
    word: "집",
    category: "장소",
    desc: "양손으로 지붕 모양(역V)을 만든다.",
    level: 1,
    params: {
      수형: "open",
      수위: "머리 위",
      수동: "역V 모양 만들기",
      비수지: "중립",
    },
  },
  {
    id: 17,
    emoji: "🏫",
    word: "학교",
    category: "장소",
    desc: "양손으로 책 펼치는 동작을 한다.",
    level: 2,
    params: {
      수형: "open",
      수위: "가슴 앞",
      수동: "양옆으로 펼치기",
    },
  },
  {
    id: 18,
    emoji: "🏥",
    word: "병원",
    category: "장소",
    desc: "오른 검지로 왼 팔뚝 위에 십자를 그린다.",
    level: 2,
    params: {
      수형: "point1",
      수위: "팔뚝",
      수동: "십자 그리기",
    },
  },
  {
    id: 19,
    emoji: "🚉",
    word: "기차역",
    category: "장소",
    desc: "양 검지를 나란히 아래로 당긴다.",
    level: 2,
    params: {
      수형: "point1",
      수위: "가슴 앞",
      수동: "양손 동시에 아래로",
    },
  },
  {
    id: 20,
    emoji: "🏦",
    word: "은행",
    category: "장소",
    desc: "오른 엄지와 검지로 동전 쥐는 모양을 만들어 아래로 내린다.",
    level: 2,
    params: {
      수형: "thumb",
      수위: "가슴 앞",
      수동: "아래로 내리기",
    },
  },

  // ── 음식 ──
  {
    id: 21,
    emoji: "🍚",
    word: "밥",
    category: "음식",
    desc: "손가락을 모아 입으로 가져간다.",
    level: 1,
    params: {
      수형: "flato",
      수위: "입 앞",
      수동: "입으로 가져가기",
      비수지: "입을 살짝 벌림",
    },
  },
  {
    id: 22,
    emoji: "💧",
    word: "물",
    category: "음식",
    desc: "W 손 모양으로 입에 댄다.",
    level: 1,
    params: {
      수형: "waterhand",
      수위: "입",
      수동: "입에 대기",
    },
  },
  {
    id: 23,
    emoji: "🍎",
    word: "사과",
    category: "음식",
    desc: "주먹 쥔 손을 볼에 돌린다.",
    level: 2,
    params: {
      수형: "fist",
      수위: "볼",
      수동: "볼에서 회전",
    },
  },
  {
    id: 24,
    emoji: "☕",
    word: "커피",
    category: "음식",
    desc: "오른 검지로 왼 손바닥에 원을 그린다.",
    level: 2,
    params: {
      수형: "point1",
      수위: "가슴 앞",
      수동: "원 그리기",
    },
  },
  {
    id: 25,
    emoji: "🍞",
    word: "빵",
    category: "음식",
    desc: "오른손으로 왼 손등을 쓸어내린다.",
    level: 1,
    params: {
      수형: "open",
      수위: "가슴 앞",
      수동: "손등 쓸기",
    },
  },
];

export const CATEGORIES: Category[] = [
  { id: "all", label: "전체", icon: "🔤" },
  { id: "인사", label: "인사", icon: "👋" },
  { id: "감정", label: "감정", icon: "😊" },
  { id: "숫자", label: "숫자", icon: "🔢" },
  { id: "장소", label: "장소", icon: "📍" },
  { id: "음식", label: "음식", icon: "🍽️" },
];

export function signsForCat(catId: string): Sign[] {
  return catId === "all" ? SIGNS : SIGNS.filter((s) => s.category === catId);
}
