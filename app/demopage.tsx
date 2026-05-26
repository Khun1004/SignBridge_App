import DemoPage from "@/components/DemoPage/DemoPage";
import React from "react";
import { View } from "react-native";

export default function DemoScreenRoute() {
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <DemoPage />
    </View>
  );
}
