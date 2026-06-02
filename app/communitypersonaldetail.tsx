// ══════════════════════════════════════════════════════════════
//  app/communitypersonaldetail.tsx — 커뮤니티 프로필 상세 페이지
// ══════════════════════════════════════════════════════════════
import CommunityPersonalDetail, {
  CommunityMemberItem,
} from "@/components/Community/CommunityPersonalDetail";
import { useAuth } from "@/components/contexts/AuthContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { View } from "react-native";

export default function CommunityPersonalDetailPage() {
  const router = useRouter();
  const { userEmail, displayName } = useAuth();

  const params = useLocalSearchParams<{
    memberId?: string;
    memberData?: string;
  }>();

  // community.tsx에서 JSON으로 넘겨준 멤버 데이터 파싱
  const member = useMemo<CommunityMemberItem | null>(() => {
    if (!params.memberData) return null;
    try {
      return JSON.parse(params.memberData);
    } catch {
      return null;
    }
  }, [params.memberData]);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <CommunityPersonalDetail
        member={member}
        myEmail={userEmail}
        myName={displayName}
        onBack={() => router.back()}
      />
    </View>
  );
}
