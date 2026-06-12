// ══════════════════════════════════════════════════════════════
//  api.ts — SignBridge React Native API 클라이언트
//  웹의 api.jsx와 동일한 구조 (React Native 환경 대응)
// ══════════════════════════════════════════════════════════════

export const SERVER_IP = "192.168.0.109";
export const BASE_URL = `http://${SERVER_IP}:8080/api`;
export const LSTM_WS_URL = `ws://${SERVER_IP}:8000/ws/sign/frame`;

async function request<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "서버 오류가 발생했습니다.");
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return response.text() as unknown as T;
}

// ══════════════════════════════════════════════════════════════
//  타입 정의
// ══════════════════════════════════════════════════════════════

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  name: string;
  email: string;
  orgType: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  orgType: string;
  officeName?: string;
  orgCode?: string;
  address?: string;
  addressDetail?: string;
  zonecode?: string;
  disabilityGrade?: string;
  preferredSign?: string;
}

export interface ProfileResponse {
  name: string;
  email: string;
  orgType: string;
  officeName?: string;
  orgCode?: string;
  address?: string;
  addressDetail?: string;
  zonecode?: string;
  disabilityGrade?: string;
  preferredSign?: string;
}

export interface ProfileUpdateRequest {
  name?: string;
  disabilityGrade?: string;
  preferredSign?: string;
}

export interface CommunityMember {
  id: number;
  name: string;
  chatId?: string; // ← 추가: @아이디
  userEmail: string;
  role: string;
  region: string;
  intro: string;
  experience?: string;
  speciality?: string;
  contactType: string;
  contactValue: string;
  publicProfile: boolean;
  certFileNames: string[];
  avatar: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityMemberRequest {
  name: string;
  chatId?: string; // ← 추가
  userEmail: string;
  role: string;
  region: string;
  intro: string;
  experience?: string;
  speciality?: string;
  contactType: string;
  contactValue: string;
  publicProfile: boolean;
  certFileNames?: string[];
}

// ══════════════════════════════════════════════════════════════
//  인증 API
// ══════════════════════════════════════════════════════════════
export const authApi = {
  login: (data: LoginRequest) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  signup: (data: SignupRequest) =>
    request<LoginResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  googleLogin: (credential: string) =>
    request<LoginResponse>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential }),
    }),
};

// ══════════════════════════════════════════════════════════════
//  마이페이지 API
// ══════════════════════════════════════════════════════════════
export const myPageApi = {
  getProfile: (email: string) =>
    request<ProfileResponse>(`/mypage/profile/${encodeURIComponent(email)}`),
  getCases: (email: string) =>
    request<any[]>(`/mypage/cases/${encodeURIComponent(email)}`),
  updateProfile: (email: string, data: ProfileUpdateRequest) =>
    request<ProfileResponse>(`/mypage/profile/${encodeURIComponent(email)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

export const aiApi = {
  chat: (userEmail: string, messages: { role: string; content: string }[]) =>
    request<any>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ userEmail, messages }),
    }),
};

// ══════════════════════════════════════════════════════════════
//  커뮤니티 API
// ══════════════════════════════════════════════════════════════
export const communityApi = {
  /** 전체 목록 조회 (역할/지역/키워드 필터) */
  getMembers: (params?: {
    role?: string;
    region?: string;
    keyword?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.role && params.role !== "전체") q.append("role", params.role);
    if (params?.region && params.region !== "전체")
      q.append("region", params.region);
    if (params?.keyword && params.keyword.trim())
      q.append("keyword", params.keyword.trim());
    return request<CommunityMember[]>(`/community/members?${q}`);
  },

  /** 내 프로필 조회 — 웹 communityApi.getMyProfile과 동일 */
  getMyProfile: (email: string) =>
    request<CommunityMember>(
      `/community/members/me?email=${encodeURIComponent(email)}`,
    ),

  /** 단건 조회 */
  getMember: (id: number) =>
    request<CommunityMember>(`/community/members/${id}`),

  /** 등록 또는 수정 (이메일 기준 upsert) */
  save: (data: CommunityMemberRequest) =>
    request<CommunityMember>("/community/members", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /** 수정 */
  update: (id: number, data: CommunityMemberRequest) =>
    request<CommunityMember>(`/community/members/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  /**
   * 삭제 — 웹 api.jsx와 동일하게 id + email 모두 전달
   * 웹: delete: (id, email) => request(`/community/members/${id}?email=...`, DELETE)
   */
  delete: (id: number, email: string) =>
    request<void>(
      `/community/members/${id}?email=${encodeURIComponent(email)}`,
      { method: "DELETE" },
    ),
};

// ══════════════════════════════════════════════════════════════
//  번역 API
// ══════════════════════════════════════════════════════════════
export const translateApi = {
  buildSubtitle: (words: string[], place = "personal") =>
    request<{ sentence: string }>("/subtitle", {
      method: "POST",
      body: JSON.stringify({ words, place }),
    }),
  getSignGuide: (text: string) =>
    request<any>("/sign-guide", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
};

// ══════════════════════════════════════════════════════════════
//  개인 케이스 API
// ══════════════════════════════════════════════════════════════
export const personalApi = {
  saveCase: (data: any) =>
    request<any>("/personal/cases", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getCases: (email: string) =>
    request<any[]>(`/personal/cases?email=${encodeURIComponent(email)}`),
  deleteCase: (id: number) =>
    request<void>(`/personal/cases/${id}`, { method: "DELETE" }),
};

// ══════════════════════════════════════════════════════════════
//  출입국 케이스 API
// ══════════════════════════════════════════════════════════════
export const immigrationApi = {
  getCases: (email: string) =>
    request<any[]>(`/immigration/cases?email=${encodeURIComponent(email)}`),
  saveRecord: (data: any) =>
    request<any>("/immigration/cases", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ══════════════════════════════════════════════════════════════
//  경찰 케이스 API
// ══════════════════════════════════════════════════════════════
export const policeApi = {
  getCases: (email: string) =>
    request<any[]>(`/police/cases?email=${encodeURIComponent(email)}`),
  saveRecord: (data: any) =>
    request<any>("/police/cases", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ══════════════════════════════════════════════════════════════
//  공통 API
// ══════════════════════════════════════════════════════════════
export const commonApi = {
  getStatus: () => request<any>("/status"),
};
