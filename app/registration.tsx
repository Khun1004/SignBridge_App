// app/registration.tsx
import Registration from "@/components/Registration/Registration";
import React from "react";
import { View } from "react-native";

export default function RegistrationRoute() {
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Registration />
    </View>
  );
}
