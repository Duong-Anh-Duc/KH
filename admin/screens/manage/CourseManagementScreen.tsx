import { dashboardStyles } from "@/styles/dashboard/dashboard.styles";
import api from "@/utils/api";
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { Raleway_700Bold, useFonts } from '@expo-google-fonts/raleway';
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";
import { Toast } from "react-native-toast-notifications";

const CourseManagementScreen = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  let [fontsLoaded, fontError] = useFonts({
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get("/get-admin-courses");
      setCourses(response.data.courses || []);
    } catch (error: any) {
      Toast.show("Không thể tải danh sách khóa học!", { type: "danger" });
    } finally {
      setLoading(false);
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
      Toast.show("Không thể cập nhật trạng thái khóa học!", { type: "danger" });
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await api.delete(`/delete-course/${courseId}`);
      setCourses(courses.filter((course) => course._id !== courseId));
      Toast.show("Xóa khóa học thành công!", { type: "success" });
    } catch (error: any) {
      Toast.show("Không thể xóa khóa học!", { type: "danger" });
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#009990" />
      </View>
    );
  }

  return (
    <View style={dashboardStyles.container}>
      <Text style={[dashboardStyles.welcomeText, { fontFamily: "Raleway_700Bold" }]}>
        Quản Lý Khóa Học
      </Text>
      <TouchableOpacity style={dashboardStyles.button}>
        {/* @ts-ignore */}
        <Link href="/(admin)/create-course">
          <Text style={[dashboardStyles.buttonText, { fontFamily: "Nunito_600SemiBold" }]}>
            Tạo Khóa Học Mới
          </Text>
        </Link>
      </TouchableOpacity>
      <FlatList
        data={courses}
        keyExtractor={(item) => item._id}
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
            <Text style={{ fontFamily: "Nunito_400Regular" }}>{item.name}</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity style={{ backgroundColor: "#2467EC", padding: 5, borderRadius: 5, marginRight: 5 }}>
                  {/* @ts-ignore */}
                <Link href={{ pathname: "/(admin)/course-details", params: { courseId: item._id } }}>
                  <Text style={{ color: "white", fontFamily: "Nunito_600SemiBold" }}>Xem</Text>
                </Link>
              </TouchableOpacity>
              <TouchableOpacity style={{ backgroundColor: "#009990", padding: 5, borderRadius: 5, marginRight: 5 }}>
                {/* @ts-ignore */}
                <Link href={{ pathname: "/(admin)/edit-course", params: { courseId: item._id } }}>
                  <Text style={{ color: "white", fontFamily: "Nunito_600SemiBold" }}>Sửa</Text>
                </Link>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: item.isHidden ? "green" : "gray", padding: 5, borderRadius: 5, marginRight: 5 }}
                onPress={() => handleHideCourse(item._id, item.isHidden || false)}
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
      />
    </View>
  );
};

export default CourseManagementScreen;