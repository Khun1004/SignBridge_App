// 변경된 깔끔한 app/my.tsx 예시
import MyContentScreen from "@/components/My/My";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { View } from "react-native";

export default function MyScreenRoute() {
  const { displayName, orgType, userEmail } = useLocalSearchParams();

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <MyContentScreen
        displayName={displayName ?? "사용자"}
        orgType={orgType ?? "일반"}
        userEmail={userEmail ?? ""}
      />
    </View>
  );
}
