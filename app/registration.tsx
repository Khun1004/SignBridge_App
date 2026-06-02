// ══════════════════════════════════════════════════════════════
//  app/registration.tsx — 커뮤니티 프로필 등록/수정 페이지
// ══════════════════════════════════════════════════════════════
import { communityApi } from "@/components/api/api";
import Registration, {
  RegistrationForm,
} from "@/components/Community/Registration";
import { useAuth } from "@/components/contexts/AuthContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Alert, View } from "react-native";

export default function RegistrationPage() {
  const router = useRouter();
  const { userEmail, displayName } = useAuth();

  const params = useLocalSearchParams<{
    isEdit?: string;
    memberId?: string;
    memberData?: string;
  }>();

  const isEdit = params.isEdit === "true";
  const memberId = params.memberId ? Number(params.memberId) : undefined;

  // communitypersonaldetail.tsx에서 넘겨준 기존 데이터
  const initialData = useMemo(() => {
    if (!params.memberData) return null;
    try {
      return JSON.parse(params.memberData) as Partial<RegistrationForm>;
    } catch {
      return null;
    }
  }, [params.memberData]);

  const handleSubmit = async (form: RegistrationForm) => {
    try {
      const body = {
        name: form.name || displayName,
        userEmail,
        role: form.role,
        region: form.region,
        intro: form.intro,
        experience: form.experience,
        speciality: form.speciality,
        contactType: form.contactType,
        contactValue: form.contactValue,
        publicProfile: form.publicProfile,
        certFileNames: form.certFiles.map((f) => f.name),
      };
      if (isEdit && memberId) {
        await communityApi.update(memberId, body);
      } else {
        await communityApi.save(body);
      }
      router.back();
    } catch {
      Alert.alert("오류", "저장에 실패했습니다. 다시 시도해 주세요.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Registration
        defaultName={displayName}
        initialData={initialData}
        isEdit={isEdit}
        onBack={() => router.back()}
        onSubmit={handleSubmit}
      />
    </View>
  );
}
