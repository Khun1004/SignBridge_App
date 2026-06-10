// app/registrationpersonal.tsx
import RegisterPersonalScreen from "@/components/RegisterPersonal/RegisterPersonal";
import React from "react";
import { View } from "react-native";

export default function RegisterPersonalRoute() {
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <RegisterPersonalScreen />
    </View>
  );
}
