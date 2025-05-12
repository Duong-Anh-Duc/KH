import AdminNavbar from "@/components/AdminNavbar";
import { useAuth } from "@/context/AuthContext";
import { theme } from "@/styles/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useEffect } from "react";
import { SafeAreaView } from "react-native";
import { Toast } from "react-native-toast-notifications";

export default function AdminLayout() {
  const { user } = useAuth();

  // Kiểm tra quyền admin khi truy cập khu vực admin
  useEffect(() => {
    if (!user || user.role !== "admin") {
      Toast.show("Bạn không có quyền truy cập khu vực Admin!", {
        type: "danger",
        placement: "top",
        duration: 3000,
      });
      router.replace("/(auth)/login");
    }
  }, [user]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Drawer
        drawerContent={(props) => <AdminNavbar {...props} />}
        screenOptions={{
          headerShown: false,
          drawerPosition: "left",
          drawerType: "slide",
          swipeEnabled: false, // Tắt tính năng kéo để tránh kéo sang màn login
          drawerStyle: {
            width: 250,
            backgroundColor: theme.colors.primary,
          },
        }}
      >
        <Drawer.Screen
          name="dashboard"
          options={{
            drawerLabel: "Thống Kê",
            title: "Admin Dashboard",
            drawerIcon: () => <Ionicons name="stats-chart-outline" size={24} color="#fff" />,
          }}
        />
        <Drawer.Screen
          name="manage-courses"
          options={{
            drawerLabel: "Quản Lý Khóa Học",
            title: "Quản Lý Khóa Học",
            drawerIcon: () => <Ionicons name="book-outline" size={24} color="#fff" />,
          }}
        />
        <Drawer.Screen
          name="manage-courses/course-details"
          options={{
            drawerLabel: "Chi Tiết Khóa Học",
            title: "Chi Tiết Khóa Học",
            drawerItemStyle: { display: "none" },
          }}
        />
        <Drawer.Screen
          name="manage-users"
          options={{
            drawerLabel: "Quản Lý Người Dùng",
            title: "Quản Lý Người Dùng",
            drawerIcon: () => <Ionicons name="people-outline" size={24} color="#fff" />,
          }}
        />
        <Drawer.Screen
          name="manage-categories"
          options={{
            drawerLabel: "Quản Lý Danh Mục",
            title: "Quản Lý Danh Mục",
            drawerIcon: () => <Ionicons name="list-outline" size={24} color="#fff" />,
          }}
        />
        <Drawer.Screen
          name="manage-orders"
          options={{
            drawerLabel: "Quản Lý Hóa Đơn",
            title: "Quản Lý Hóa Đơn",
            drawerIcon: () => <Ionicons name="receipt-outline" size={24} color="#fff" />,
          }}
        />
        <Drawer.Screen
          name="manage-comments"
          options={{
            drawerLabel: "Quản Lý Comment",
            title: "Quản Lý Comment",
            drawerIcon: () => <Ionicons name="chatbox-outline" size={24} color="#fff" />,
          }}
        />
        <Drawer.Screen
          name="change-password"
          options={{
            drawerLabel: "Đổi Mật Khẩu",
            title: "Đổi Mật Khẩu",
            drawerIcon: () => <Ionicons name="lock-closed-outline" size={24} color="#fff" />,
          }}
        />
        <Drawer.Screen
          name="create-course"
          options={{
            drawerLabel: "Tạo Khóa Học",
            title: "Tạo Khóa Học Mới",
            drawerItemStyle: { display: "none" },
          }}
        />
        <Drawer.Screen
          name="create-lesson"
          options={{
            drawerLabel: "Thêm Bài Học",
            title: "Thêm Bài Học",
            drawerItemStyle: { display: "none" },
          }}
        />
        <Drawer.Screen
          name="edit-course"
          options={{
            drawerLabel: "Chỉnh Sửa Khóa Học",
            title: "Chỉnh Sửa Khóa Học",
            drawerItemStyle: { display: "none" },
          }}
        />
        <Drawer.Screen
          name="edit-lesson"
          options={{
            drawerLabel: "Chỉnh Sửa Bài Học",
            title: "Chỉnh Sửa Bài Học",
            drawerItemStyle: { display: "none" },
          }}
        />
        <Drawer.Screen
          name="enrolled-users"
          options={{
            drawerLabel: "Người Dùng Đăng Ký",
            title: "Người Dùng Đăng Ký Khóa Học",
            drawerItemStyle: { display: "none" },
          }}
        />
      </Drawer>
    </SafeAreaView>
  );
}