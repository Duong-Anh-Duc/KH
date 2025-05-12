import CustomInput from "@/components/CustomInput";
import { useAuth } from "@/context/AuthContext";
import { authStyles } from "@/styles/auth/auth.styles";
import { commonStyles } from "@/styles/common/common.styles";
import api from "@/utils/api";
import { Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { Raleway_600SemiBold, Raleway_700Bold, useFonts } from '@expo-google-fonts/raleway';
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Toast } from "react-native-toast-notifications";

const ChangePasswordScreen = () => {
  const [isOldPasswordVisible, setOldPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [buttonSpinner, setButtonSpinner] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const { user } = useAuth();

  let [fontsLoaded, fontError] = useFonts({
    Raleway_600SemiBold,
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_700Bold,
    Nunito_600SemiBold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const validateInputs = () => {
    let isValid = true;
    if (!passwordData.oldPassword) {
      setError((prev) => ({ ...prev, oldPassword: "Vui lòng nhập mật khẩu cũ" }));
      isValid = false;
    }
    if (!passwordData.newPassword) {
      setError((prev) => ({ ...prev, newPassword: "Vui lòng nhập mật khẩu mới" }));
      isValid = false;
    }
    if (!passwordData.confirmPassword) {
      setError((prev) => ({ ...prev, confirmPassword: "Vui lòng xác nhận mật khẩu" }));
      isValid = false;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError((prev) => ({ ...prev, confirmPassword: "Mật khẩu xác nhận không khớp" }));
      isValid = false;
    }
    return isValid;
  };

  const handleChangePassword = async () => {
    setButtonSpinner(true);
    if (!validateInputs()) {
      setButtonSpinner(false);
      return;
    }

    try {
      await api.put("/update-user-password", {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });
      Toast.show("Đổi mật khẩu thành công!", { type: "success" });
      router.push("/(admin)/dashboard");
    } catch (error: any) {
      Toast.show(error.response?.data?.message || "Đổi mật khẩu thất bại!", { type: "danger" });
    } finally {
      setButtonSpinner(false);
    }
  };

  return (
    <LinearGradient colors={["#009990", "#F6F7F9"]} style={{ flex: 1, paddingTop: 20 }}>
      <ScrollView>
        <Text style={[authStyles.welcomeText, { fontFamily: "Raleway_700Bold" }]}>
          Đổi Mật Khẩu
        </Text>
        <View style={authStyles.inputContainer}>
          <CustomInput
            iconName="lock-closed-outline"
            secureTextEntry
            isPasswordVisible={isOldPasswordVisible}
            togglePasswordVisibility={() => setOldPasswordVisible(!isOldPasswordVisible)}
            placeholder="Mật Khẩu Cũ"
            value={passwordData.oldPassword}
            onChangeText={(value) => setPasswordData({ ...passwordData, oldPassword: value })}
          />
          {error.oldPassword && (
            <View style={[commonStyles.errorContainer, { top: 70 }]}>
              <Text style={{ color: "red", fontSize: 11 }}>{error.oldPassword}</Text>
            </View>
          )}
          <CustomInput
            iconName="lock-closed-outline"
            secureTextEntry
            isPasswordVisible={isNewPasswordVisible}
            togglePasswordVisibility={() => setNewPasswordVisible(!isNewPasswordVisible)}
            placeholder="Mật Khẩu Mới"
            value={passwordData.newPassword}
            onChangeText={(value) => setPasswordData({ ...passwordData, newPassword: value })}
          />
          {error.newPassword && (
            <View style={[commonStyles.errorContainer, { top: 145 }]}>
              <Text style={{ color: "red", fontSize: 11 }}>{error.newPassword}</Text>
            </View>
          )}
          <CustomInput
            iconName="lock-closed-outline"
            secureTextEntry
            isPasswordVisible={isConfirmPasswordVisible}
            togglePasswordVisibility={() => setConfirmPasswordVisible(!isConfirmPasswordVisible)}
            placeholder="Xác Nhận Mật Khẩu"
            value={passwordData.confirmPassword}
            onChangeText={(value) => setPasswordData({ ...passwordData, confirmPassword: value })}
          />
          {error.confirmPassword && (
            <View style={[commonStyles.errorContainer, { top: 220 }]}>
              <Text style={{ color: "red", fontSize: 11 }}>{error.confirmPassword}</Text>
            </View>
          )}
          <TouchableOpacity
            style={{
              padding: 16,
              borderRadius: 8,
              marginHorizontal: 16,
              backgroundColor: "#009990",
              marginTop: 30,
            }}
            onPress={handleChangePassword}
          >
            {buttonSpinner ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={{ color: "white", textAlign: "center", fontSize: 16, fontFamily: "Raleway_700Bold" }}>
                Đổi Mật Khẩu
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default ChangePasswordScreen;