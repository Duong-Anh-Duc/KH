import { dashboardStyles } from "@/styles/dashboard/dashboard.styles";
import api from "@/utils/api";
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { Raleway_700Bold, useFonts } from '@expo-google-fonts/raleway';
import { Link, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";
import { Toast } from "react-native-toast-notifications";

const EnrolledUsersScreen = () => {
  const { courseId } = useLocalSearchParams();
  const [users, setUsers] = useState<any[]>([]);
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

  useEffect(() => {
    const fetchEnrolledUsers = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/enrolled-users/${courseId}`);
        setUsers(response.data.users || []);
      } catch (error: any) {
        Toast.show("Không thể tải danh sách người dùng!", { type: "danger" });
      } finally {
        setLoading(false);
      }
    };
    fetchEnrolledUsers();
  }, [courseId]);

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
            <Text style={{ fontFamily: "Nunito_400Regular" }}>Tên: {item.name}</Text>
            <Text style={{ fontFamily: "Nunito_400Regular" }}>Email: {item.email}</Text>
            <Text style={{ fontFamily: "Nunito_400Regular" }}>
              Ngày đăng ký: {new Date(item.enrollmentDate).toLocaleDateString()}
            </Text>
          </View>
        )}
      />
      <TouchableOpacity
        style={[dashboardStyles.button, { backgroundColor: "#ccc", marginTop: 20 }]}
      >
        {/* @ts-ignore */}
        <Link href={{ pathname: "/(admin)/manage-courses/course-details", params: { courseId } }}>
          <Text style={[dashboardStyles.buttonText, { fontFamily: "Nunito_600SemiBold" }]}>
            Quay Lại
          </Text>
        </Link>
      </TouchableOpacity>
    </View>
  );
};

export default EnrolledUsersScreen;