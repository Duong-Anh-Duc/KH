import { dashboardStyles } from "@/styles/dashboard/dashboard.styles";
import api from "@/utils/api";
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { Raleway_700Bold, useFonts } from '@expo-google-fonts/raleway';
import { Link, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";
import { Toast } from "react-native-toast-notifications";

// Định nghĩa kiểu cho user
interface User {
  _id: string;
  name: string;
  email: string;
  enrollmentDate: string;
}

// Component wrapper để xử lý tải font
const FontLoader = ({ children }: { children: React.ReactNode }) => {
  const [fontsLoaded, fontError] = useFonts({
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#009990" />
        <Text style={{ marginTop: 10, fontSize: 16, color: "#333" }}>
          Đang tải font...
        </Text>
      </View>
    );
  }

  return <>{children}</>;
};

const EnrolledUsersScreen = () => {
  const { courseId } = useLocalSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnrolledUsers = async () => {
      try {
        if (!courseId || typeof courseId !== "string") {
          throw new Error("ID khóa học không hợp lệ");
        }
        setLoading(true);
        const response = await api.get(`/enrolled-users/${courseId}`);
        if (!response.data.users) {
          throw new Error("Không tìm thấy danh sách người dùng");
        }
        setUsers(response.data.users);
      } catch (error: any) {
        console.error("Lỗi khi tải danh sách người dùng:", error);
        setError(error.response?.data?.message || "Không thể tải danh sách người dùng!");
        Toast.show(error.response?.data?.message || "Không thể tải danh sách người dùng!", { type: "danger" });
        router.back(); // Điều hướng về màn hình trước đó nếu không tải được dữ liệu
      } finally {
        setLoading(false);
      }
    };
    fetchEnrolledUsers();
  }, [courseId]);

  return (
    <FontLoader>
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#009990" />
        </View>
      ) : error ? (
        <View style={dashboardStyles.container}>
          <Text style={[dashboardStyles.welcomeText, { fontFamily: "Raleway_700Bold", color: "red" }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[dashboardStyles.button, { backgroundColor: "#ccc", marginTop: 20 }]}
            onPress={() => router.back()}
          >
            <Text style={[dashboardStyles.buttonText, { fontFamily: "Nunito_600SemiBold" }]}>
              Quay Lại
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={dashboardStyles.container}>
          <Text style={[dashboardStyles.welcomeText, { fontFamily: "Raleway_700Bold" }]}>
            Người Dùng Đăng Ký Khóa Học
          </Text>
          <FlatList
            data={users}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View
                style={{
                  padding: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: "#ccc",
                }}
              >
                <Text style={{ fontFamily: "Nunito_400Regular" }}>
                  Tên: {item.name || "Không có tên"}
                </Text>
                <Text style={{ fontFamily: "Nunito_400Regular" }}>
                  Email: {item.email || "Không có email"}
                </Text>
                <Text style={{ fontFamily: "Nunito_400Regular" }}>
                  Ngày đăng ký: {item.enrollmentDate ? new Date(item.enrollmentDate).toLocaleDateString() : "Không có ngày"}
                </Text>
              </View>
            )}
            ListEmptyComponent={
              <Text style={{ fontFamily: "Nunito_400Regular", textAlign: "center", marginTop: 20 }}>
                Không có người dùng nào đăng ký khóa học này.
              </Text>
            }
          />
          <TouchableOpacity
            style={[dashboardStyles.button, { backgroundColor: "#ccc", marginTop: 20 }]}
          >
            <Link href={{ pathname: "/(admin)/manage-courses/course-details", params: { courseId } }}>
              <Text style={[dashboardStyles.buttonText, { fontFamily: "Nunito_600SemiBold" }]}>
                Quay Lại
              </Text>
            </Link>
          </TouchableOpacity>
        </View>
      )}
    </FontLoader>
  );
};

export default EnrolledUsersScreen;