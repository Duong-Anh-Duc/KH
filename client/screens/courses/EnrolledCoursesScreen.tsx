import CourseCard from "@/components/cards/course.card";
import useUser from "@/hooks/auth/useUser";
import { CoursesType } from "@/types/courses";
import { SERVER_URI } from "@/utils/uri";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  View,
  RefreshControl,
} from "react-native";
import { Toast } from "react-native-toast-notifications";

export default function EnrolledCoursesScreen() {
  const [courses, setCourses] = useState<CoursesType[]>([]);
  const [loader, setLoader] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { loading, user, refreshUser } = useUser();

  const fetchCourses = async () => {
    if (!user || loading) return;
    try {
      if (!refreshing) {
        setLoader(true);
      }
      const response = await axios.get(`${SERVER_URI}/get-courses`);
      const fetchedCourses: CoursesType[] = response.data.courses || [];
      const data = fetchedCourses.filter((i: CoursesType) =>
        user?.courses?.some((d: any) => d.courseId === i._id)
      );
      setCourses(data);
    } catch (error: any) {
      console.error("Lỗi khi lấy danh sách khóa học:", error);
      Toast.show("Không thể lấy danh sách khóa học. Vui lòng thử lại sau.", {
        type: "danger",
      });
    } finally {
      setLoader(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshUser();
      await fetchCourses();
    } catch (error) {
      console.error("Lỗi khi làm mới dữ liệu:", error);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [user, loading]);

  if ((loader || loading) && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#009990" />
        <Text style={{ marginTop: 10, fontSize: 16, color: "#333" }}>
          Đang tải...
        </Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={["#009990", "#F6F7F9"]} style={{ flex: 1 }}>
      {courses.length === 0 ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ fontSize: 16, color: "#333" }}>
            Bạn chưa đăng ký khóa học nào!
          </Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <CourseCard item={item} key={item._id} />}
          contentContainerStyle={{ padding: 10 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#009990"]}
              tintColor="#009990"
            />
          }
        />
      )}
    </LinearGradient>
  );
}
