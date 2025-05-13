import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

interface CustomHeaderProps {
  title: string;
  showBackButton?: boolean;
  rightIcon?: string;
  onRightIconPress?: () => void;
}

export default function CustomHeader({
  title,
  showBackButton = false,
  rightIcon,
  onRightIconPress,
}: CustomHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.leftContainer}>
        {showBackButton && (
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.title}>{title}</Text>

      <View style={styles.rightContainer}>
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightButton}
          >
            <Ionicons name={rightIcon as any} size={24} color="#333" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "transparent",
    height: 60,
  },
  leftContainer: {
    width: 40,
  },
  rightContainer: {
    width: 40,
    alignItems: "flex-end",
  },
  backButton: {
    padding: 8,
  },
  rightButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: "Raleway_700Bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
});
