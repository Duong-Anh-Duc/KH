// frontend/app/(tabs)/search.tsx
import { LinearGradient } from "expo-linear-gradient";
import SearchInput from "@/components/common/search.input";
import Header from "@/components/header/header";

export default function SearchScreen() {
  return (
    <LinearGradient
      colors={["#009990", "#F6F7F9"]}
      style={{ flex: 1, paddingTop: 50 }}
    >
      <Header />
      <SearchInput showFilters={true} />
    </LinearGradient>
  );
}
