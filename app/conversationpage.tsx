import ConversationPageScreen from "@/components/ConversationPage/ConversationPage";
import React from "react";
import { View } from "react-native";

export default function ConversationScreenRoute() {
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <ConversationPageScreen />
    </View>
  );
}
