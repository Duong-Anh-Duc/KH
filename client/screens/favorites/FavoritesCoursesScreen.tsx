import CourseCard from "@/components/cards/course.card";
import Header from "@/components/header/header";
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
import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { Toast } from "react-native-toast-notifications";

export default function FavoriteCoursesScreen() {
  const [courses, setCourses] = useState<CoursesType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useUser();

  const fetchFavoriteCourses = async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }
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
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchFavoriteCourses();
    } catch (error) {
      console.error("Lỗi khi làm mới dữ liệu:", error);
    }
  }, []);

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
    <LinearGradient colors={["#009990", "#F6F7F9"]} style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <View style={{ marginTop: 15 }}>
          <Header />
        </View>

        {loading && !refreshing ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <ActivityIndicator size="large" color="#009990" />
            <Text style={{ fontSize: 18, fontFamily: "Nunito_700Bold" }}>
              Đang tải...
            </Text>
          </View>
        ) : courses.length === 0 ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <Text
              style={{
                textAlign: "center",
                fontSize: 18,
                fontFamily: "Nunito_600SemiBold",
                color: "#666",
              }}
            >
              Bạn chưa có khóa học yêu thích nào!
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
      </View>
    </LinearGradient>
  );
}
