import { Ionicons } from "@expo/vector-icons";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import { router } from "expo-router";
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Toast } from "react-native-toast-notifications";
import { useAuth } from "../context/AuthContext";
import { theme } from "../styles/theme";

const AdminNavbar = ({ navigation }: DrawerContentComponentProps) => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      "Xác nhận đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng xuất",
          onPress: async () => {
            await logout();
            Toast.show("Đăng xuất thành công!", {
              type: "success",
              placement: "top",
              duration: 3000,
            });
            router.replace("/(auth)/login");
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.navbar}>
        <View style={styles.navbarHeader}>
          <Text style={styles.navbarTitle}>Admin Menu</Text>
        </View>
        <TouchableOpacity
          style={styles.navbarItem}
          onPress={() => {
            router.push("/(admin)/dashboard");
            navigation.closeDrawer();
          }}
        >
          <Ionicons name="stats-chart-outline" size={theme.typography.fontSize.body} color={theme.colors.white} />
          <Text style={styles.navbarText}>Thống Kê</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navbarItem}
          onPress={() => {
            router.push("/(admin)/manage-courses");
            navigation.closeDrawer();
          }}
        >
          <Ionicons name="book-outline" size={theme.typography.fontSize.body} color={theme.colors.white} />
          <Text style={styles.navbarText}>Quản Lý Khóa Học</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navbarItem}
          onPress={() => {
            router.push("/(admin)/manage-users");
            navigation.closeDrawer();
          }}
        >
          <Ionicons name="people-outline" size={theme.typography.fontSize.body} color={theme.colors.white} />
          <Text style={styles.navbarText}>Quản Lý Người Dùng</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navbarItem}
          onPress={() => {
            router.push("/(admin)/manage-categories");
            navigation.closeDrawer();
          }}
        >
          <Ionicons name="list-outline" size={theme.typography.fontSize.body} color={theme.colors.white} />
          <Text style={styles.navbarText}>Quản Lý Danh Mục</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navbarItem}
          onPress={() => {
            router.push("/(admin)/manage-invoices" as any); // Cập nhật route
            navigation.closeDrawer();
          }}
        >
          <Ionicons name="receipt-outline" size={theme.typography.fontSize.body} color={theme.colors.white} />
          <Text style={styles.navbarText}>Quản Lý Hóa Đơn</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navbarItem}
          onPress={() => {
            router.push("/(admin)/manage-comments");
            navigation.closeDrawer();
          }}
        >
          <Ionicons name="chatbox-outline" size={theme.typography.fontSize.body} color={theme.colors.white} />
          <Text style={styles.navbarText}>Quản Lý Comment</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navbarItem}
          onPress={() => {
            router.push("/(admin)/change-password");
            navigation.closeDrawer();
          }}
        >
          <Ionicons name="lock-closed-outline" size={theme.typography.fontSize.body} color={theme.colors.white} />
          <Text style={styles.navbarText}>Đổi Mật Khẩu</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navbarItem, styles.logoutItem]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={theme.typography.fontSize.body} color={theme.colors.white} />
          <Text style={styles.navbarText}>Đăng Xuất</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  navbar: {
    width: 250,
    height: "100%",
    backgroundColor: theme.colors.primary,
    paddingTop: theme.spacing.extraLarge,
    paddingHorizontal: theme.spacing.medium,
    elevation: theme.elevation.large,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  navbarHeader: {
    marginBottom: theme.spacing.large,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.white,
    paddingBottom: theme.spacing.small,
  },
  navbarTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.h1,
    color: theme.colors.white,
    textAlign: "center",
  },
  navbarItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.medium,
    marginBottom: theme.spacing.small,
    borderRadius: theme.borderRadius.small,
    backgroundColor: theme.colors.primary,
  },
  navbarText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.body,
    color: theme.colors.white,
    marginLeft: theme.spacing.medium,
  },
  logoutItem: {
    marginTop: "auto",
    marginBottom: theme.spacing.large,
    borderTopWidth: 1,
    borderTopColor: theme.colors.white,
    paddingTop: theme.spacing.medium,
  },
});

export default AdminNavbar;