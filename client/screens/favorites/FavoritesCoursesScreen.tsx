import CourseCard from "@/components/cards/course.card";
import { useUser } from "@/context/UserContext";
import { CoursesType } from "@/types/courses";
import { SERVER_URI } from "@/utils/uri";
import {
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
} from "@expo-google-fonts/nunito";
import {
    Raleway_600SemiBold,
    Raleway_700Bold,
    useFonts,
} from "@expo-google-fonts/raleway";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router"; // Thêm import để xử lý focus
import React, { useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { Toast } from "react-native-toast-notifications";

export default function FavoriteCoursesScreen() {
  const [courses, setCourses] = useState<CoursesType[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  const fetchFavoriteCourses = async () => {
    try {
      setLoading(true);
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      if (!accessToken || !refreshToken || !user) {
        Toast.show("Vui lòng đăng nhập để xem danh sách yêu thích", {
          type: "warning",
          placement: "top",
          duration: 3000,
        });
        setCourses([]);
        return;
      }

      const response = await axios.get(`${SERVER_URI}/get-favorite-courses`, {
        headers: {
          "access-token": accessToken,
          "refresh-token": refreshToken,
        },
      });

      const favoriteCourses: CoursesType[] = response.data.courses || [];
      setCourses(favoriteCourses);
    } catch (error: any) {
      console.error("Lỗi khi lấy danh sách khóa học yêu thích:", error);
      Toast.show("Không thể lấy danh sách khóa học yêu thích", {
        type: "danger",
        placement: "top",
        duration: 3000,
      });
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  // Sử dụng useFocusEffect để tải lại danh sách khi màn hình được focus
  useFocusEffect(
    React.useCallback(() => {
      fetchFavoriteCourses();
    }, [user])
  );

  let [fontsLoaded, fontError] = useFonts({
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_700Bold,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Raleway_600SemiBold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <LinearGradient
      colors={["#009990", "#F6F7F9"]}
      style={{ flex: 1, paddingTop: 65 }}
    >
      <View style={{ flex: 1 }}>
        {/* Thêm tiêu đề */}
        <Text
          style={{
            fontSize: 24,
            fontFamily: "Raleway_700Bold",
            color: "#000",
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          Danh sách khóa học yêu thích của tôi
        </Text>
        {loading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color="#009990" />
            <Text style={{ fontSize: 18, fontFamily: "Nunito_700Bold" }}>
              Đang tải...
            </Text>
          </View>
        ) : courses.length === 0 ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ textAlign: "center", fontSize: 18 }}>
              Bạn chưa có khóa học yêu thích nào!
            </Text>
          </View>
        ) : (
          <ScrollView style={{ marginHorizontal: 15, gap: 12 }}>
            {courses.map((item: CoursesType, index: number) => (
              <CourseCard item={item} key={index} />
            ))}
          </ScrollView>
        )}
      </View>
    </LinearGradient>
  );
}