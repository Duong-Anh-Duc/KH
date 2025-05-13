// frontend/app/(tabs)/search.tsx
import { View, Text, SafeAreaView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import SearchInput from "@/components/common/search.input";
import Header from "@/components/header/header";

export default function SearchScreen() {
  return (
    <LinearGradient colors={["#009990", "#F6F7F9"]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ marginTop: 15 }}>
          <Header />
        </View>
        <SearchInput showFilters={true} />
      </SafeAreaView>
    </LinearGradient>
  );
}
