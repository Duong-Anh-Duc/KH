import { Ionicons } from "@expo/vector-icons";
import {
  DrawerDescriptorMap,
  DrawerNavigationHelpers,
  DrawerNavigationState,
} from "@react-navigation/drawer";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Toast } from "react-native-toast-notifications";
import { useAuth } from "../context/AuthContext";

// Define the props type for the drawerContent component
type DrawerContentProps = {
  state: DrawerNavigationState<any>;
  navigation: DrawerNavigationHelpers;
  descriptors: DrawerDescriptorMap;
};

// Update the AdminNavbar component to accept DrawerContentProps
const AdminNavbar = ({ state, navigation }: DrawerContentProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();
  const slideAnim = useState(new Animated.Value(-250))[0]; // Giá trị ban đầu: navbar ẩn

  const toggleNavbar = () => {
    setIsOpen(!isOpen);
    Animated.timing(slideAnim, {
      toValue: isOpen ? -250 : 0, // Mở: 0, Đóng: -250 (ẩn ra bên trái)
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

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
    <>
      {/* Nút hamburger để mở/đóng navbar */}
      <TouchableOpacity style={styles.hamburger} onPress={toggleNavbar}>
        <Ionicons name={isOpen ? "close" : "menu"} size={30} color="#fff" />
      </TouchableOpacity>

      {/* Thanh điều hướng */}
      <Animated.View style={[styles.navbar, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.navbarHeader}>
          <Text style={styles.navbarTitle}>Admin Menu</Text>
        </View>
        <TouchableOpacity
          style={styles.navbarItem}
          onPress={() => {
            router.push("/(admin)/dashboard");
            toggleNavbar();
          }}
        >
          <Ionicons name="stats-chart-outline" size={24} color="#fff" />
          <Text style={styles.navbarText}>Thống Kê</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navbarItem}
          onPress={() => {
            router.push("/(admin)/manage-courses");
            toggleNavbar();
          }}
        >
          <Ionicons name="book-outline" size={24} color="#fff" />
          <Text style={styles.navbarText}>Quản Lý Khóa Học</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navbarItem}
          onPress={() => {
            router.push("/(admin)/manage-users");
            toggleNavbar();
          }}
        >
          <Ionicons name="people-outline" size={24} color="#fff" />
          <Text style={styles.navbarText}>Quản Lý Người Dùng</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navbarItem}
          onPress={() => {
            router.push("/(admin)/manage-categories");
            toggleNavbar();
          }}
        >
          <Ionicons name="list-outline" size={24} color="#fff" />
          <Text style={styles.navbarText}>Quản Lý Danh Mục</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navbarItem}
          onPress={() => {
            router.push("/(admin)/manage-orders");
            toggleNavbar();
          }}
        >
          <Ionicons name="receipt-outline" size={24} color="#fff" />
          <Text style={styles.navbarText}>Quản Lý Hóa Đơn</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navbarItem}
          onPress={() => {
            router.push("/(admin)/manage-comments");
            toggleNavbar();
          }}
        >
          <Ionicons name="chatbox-outline" size={24} color="#fff" />
          <Text style={styles.navbarText}>Quản Lý Comment</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navbarItem}
          onPress={() => {
            router.push("/(admin)/change-password");
            toggleNavbar();
          }}
        >
          <Ionicons name="lock-closed-outline" size={24} color="#fff" />
          <Text style={styles.navbarText}>Đổi Mật Khẩu</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navbarItem, styles.logoutItem]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#fff" />
          <Text style={styles.navbarText}>Đăng Xuất</Text>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  hamburger: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 1000,
    backgroundColor: "#009990",
    padding: 10,
    borderRadius: 5,
  },
  navbar: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 250,
    height: "100%",
    backgroundColor: "#333",
    paddingTop: 80,
    paddingHorizontal: 20,
    zIndex: 999,
  },
  navbarHeader: {
    marginBottom: 20,
  },
  navbarTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  navbarItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },
  navbarText: {
    fontSize: 18,
    color: "#fff",
    marginLeft: 10,
  },
  logoutItem: {
    marginTop: "auto",
    marginBottom: 20,
  },
});

export default AdminNavbar;