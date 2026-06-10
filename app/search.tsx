// app/search.tsx
import SearchScreen from "@/components/Search/SearchScreen";
import React from "react";
import { StyleSheet, View } from "react-native";

export default function SearchPage() {
  return (
    <View style={s.container}>
      <SearchScreen />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
});
