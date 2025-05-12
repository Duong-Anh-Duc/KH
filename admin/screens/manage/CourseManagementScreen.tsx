import { dashboardStyles } from "@/styles/dashboard/dashboard.styles";
import api from "@/utils/api";
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { Raleway_700Bold, useFonts } from '@expo-google-fonts/raleway';
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native"; // Thêm StyleSheet vào import
import { Toast } from "react-native-toast-notifications";

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

interface CoursesType {
  _id: string;
  name: string;
  description: string;
  categories: string;
  price: number;
  estimatedPrice?: number;
  thumbnail: {
    public_id: string | any;
    url: string | any;
  };
  tags: string;
  level: string;
  demoUrl: string;
  benefits: { title: string }[];
  prerequisites: { title: string }[];
  reviews: any[];
  courseData: any[];
  ratings?: number;
  purchased: number;
  isHidden: boolean;
}

const CourseManagementScreen = () => {
  const [courses, setCourses] = useState<CoursesType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get("/get-admin-courses");
      setCourses(response.data.courses || []);
    } catch (error: any) {
      console.error("Lỗi khi tải danh sách khóa học:", error);
      Toast.show(error.response?.data?.message || "Không thể tải danh sách khóa học!", { type: "danger" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleHideCourse = async (courseId: string, isHidden: boolean) => {
    try {
      await api.put(`/hide-course/${courseId}`, { isHidden: !isHidden });
      setCourses(courses.map((course) => 
        course._id === courseId ? { ...course, isHidden: !isHidden } : course
      ));
      Toast.show(isHidden ? "Hiện khóa học thành công!" : "Ẩn khóa học thành công!", { type: "success" });
    } catch (error: any) {
      console.error("Lỗi khi cập nhật trạng thái khóa học:", error);
      Toast.show(error.response?.data?.message || "Không thể cập nhật trạng thái khóa học!", { type: "danger" });
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa khóa học này? Hành động này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          onPress: async () => {
            try {
              await api.delete(`/delete-course/${courseId}`);
              setCourses(courses.filter((course) => course._id !== courseId));
              Toast.show("Xóa khóa học thành công!", { type: "success" });
            } catch (error: any) {
              console.error("Lỗi khi xóa khóa học:", error);
              Toast.show(error.response?.data?.message || "Không thể xóa khóa học!", { type: "danger" });
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCourses();
  };

  return (
    <FontLoader>
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#009990" />
        </View>
      ) : (
        <View style={dashboardStyles.container}>
          <Text style={[dashboardStyles.welcomeText, { fontFamily: "Raleway_700Bold" }]}>
            Quản Lý Khóa Học
          </Text>
          <TouchableOpacity style={dashboardStyles.button}>
            <Link href="/(admin)/create-course">
              <Text style={[dashboardStyles.buttonText, { fontFamily: "Nunito_600SemiBold" }]}>
                Tạo Khóa Học Mới
              </Text>
            </Link>
          </TouchableOpacity>
          <FlatList
            data={courses}
            keyExtractor={(item) => item._id}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            renderItem={({ item }) => (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  padding: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: "#ccc",
                  backgroundColor: item.isHidden ? "#f0f0f0" : "white",
                }}
              >
                <View>
                  <Text style={{ fontFamily: "Nunito_400Regular" }}>{item.name}</Text>
                  <Text style={{ fontFamily: "Nunito_400Regular", color: "#575757", fontSize: 12 }}>
                    Giá: {item.price.toFixed(2)} VNĐ | Học viên: {item.purchased}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TouchableOpacity style={{ backgroundColor: "#2467EC", padding: 5, borderRadius: 5, marginRight: 5 }}>
                    <Link href={{ pathname: "/(admin)/manage-courses/course-details", params: { courseId: item._id } }}>
                      <Text style={{ color: "white", fontFamily: "Nunito_600SemiBold" }}>Xem</Text>
                    </Link>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ backgroundColor: "#009990", padding: 5, borderRadius: 5, marginRight: 5 }}>
                    <Link href={{ pathname: "/(admin)/edit-course", params: { courseId: item._id } }}>
                      <Text style={{ color: "white", fontFamily: "Nunito_600SemiBold" }}>Sửa</Text>
                    </Link>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ backgroundColor: item.isHidden ? "green" : "gray", padding: 5, borderRadius: 5, marginRight: 5 }}
                    onPress={() => handleHideCourse(item._id, item.isHidden)}
                  >
                    <Text style={{ color: "white", fontFamily: "Nunito_600SemiBold" }}>{item.isHidden ? "Hiện" : "Ẩn"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ backgroundColor: "red", padding: 5, borderRadius: 5 }}
                    onPress={() => handleDeleteCourse(item._id)}
                  >
                    <Text style={{ color: "white", fontFamily: "Nunito_600SemiBold" }}>Xóa</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <Text style={{ fontFamily: "Nunito_400Regular", textAlign: "center", marginTop: 20 }}>
                Không có khóa học nào để hiển thị.
              </Text>
            }
          />
        </View>
      )}
    </FontLoader>
  );
};

export default CourseManagementScreen;

const styles = StyleSheet.create({
  errorContainer: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: "#FF6347",
    padding: 10,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 1000,
  },
  errorText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
  },
  clearErrorButton: {
    padding: 5,
  },
});