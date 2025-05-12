import CustomHeader from "@/components/CustomHeader";
import { useAuth } from "@/context/AuthContext";
import { dashboardStyles } from "@/styles/dashboard/dashboard.styles";
import { theme } from "@/styles/theme";
import api from "@/utils/api";
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { Raleway_700Bold, useFonts } from '@expo-google-fonts/raleway';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { router, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Toast } from 'react-native-toast-notifications';

// Định nghĩa ParamList cho DrawerNavigator
type DrawerParamList = {
  dashboard: undefined;
  "manage-courses": undefined;
  "manage-courses/course-details": undefined;
  "manage-users": undefined;
  "manage-categories": undefined;
  "manage-orders": undefined;
  "manage-comments": undefined;
  "change-password": undefined;
  "create-course": undefined;
  "create-lesson": undefined;
  "edit-course": undefined;
  "edit-lesson": undefined;
  "enrolled-users": undefined;
};

const DashboardScreen = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();

  let [fontsLoaded, fontError] = useFonts({
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [usersRes, coursesRes, ordersRes] = await Promise.all([
          api.get("/users/count"),
          api.get("/courses/count"),
          api.get("/orders/count"),
        ]);
        setStats({
          totalUsers: usersRes.data.count || 0,
          totalCourses: coursesRes.data.count || 0,
          totalOrders: ordersRes.data.count || 0,
        });
      } catch (error: any) {
        Toast.show("Không thể tải dữ liệu thống kê!", {
          type: "danger",
          placement: "top",
          duration: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStats();
    } else {
      router.replace("/(auth)/login");
    }
  }, [user]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Sử dụng CustomHeader */}
        <CustomHeader title="Admin Dashboard" navigation={navigation} />
        <ScrollView style={[dashboardStyles.container, { backgroundColor: theme.colors.background }]}>
          <Text style={[dashboardStyles.welcomeText, { fontFamily: "Raleway_700Bold" }]}>
            Chào mừng, {user?.email}!
          </Text>
          <View style={dashboardStyles.card}>
            <Text style={[dashboardStyles.cardTitle, { fontFamily: "Nunito_700Bold" }]}>
              Tổng số người dùng
            </Text>
            <Text style={[dashboardStyles.cardValue, { fontFamily: "Nunito_600SemiBold" }]}>
              {stats.totalUsers}
            </Text>
          </View>
          <View style={dashboardStyles.card}>
            <Text style={[dashboardStyles.cardTitle, { fontFamily: "Nunito_700Bold" }]}>
              Tổng số khóa học
            </Text>
            <Text style={[dashboardStyles.cardValue, { fontFamily: "Nunito_600SemiBold" }]}>
              {stats.totalCourses}
            </Text>
          </View>
          <View style={dashboardStyles.card}>
            <Text style={[dashboardStyles.cardTitle, { fontFamily: "Nunito_700Bold" }]}>
              Tổng số hóa đơn
            </Text>
            <Text style={[dashboardStyles.cardValue, { fontFamily: "Nunito_600SemiBold" }]}>
              {stats.totalOrders}
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});

export default DashboardScreen;