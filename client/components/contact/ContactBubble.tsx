import { Nunito_400Regular, Nunito_600SemiBold, useFonts } from "@expo-google-fonts/nunito";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const ContactBubble = () => {
  const [isOpen, setIsOpen] = useState(false);

  let [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const handleEmail = async () => {
    const email = "ducytcg123456@gmail.com";
    const subject = "Liên hệ từ EduBridge";
    const body = "Chào bạn, tôi cần hỗ trợ...";

    const emailUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      await Linking.openURL(emailUrl);
    } catch (error) {
      console.error("Lỗi khi mở Gmail:", error);
      alert("Không thể mở ứng dụng Gmail. Vui lòng thử lại.");
    }
  };

  const handleZalo = async () => {
    const zaloId = "0338617203";
    const zaloUrl = `zalo://chat?phone=${zaloId}`; // URL scheme để mở Zalo

    try {
      const supported = await Linking.canOpenURL(zaloUrl);
      if (supported) {
        await Linking.openURL(zaloUrl);
      } else {
        // Nếu không mở được Zalo, thử mở link web của Zalo
        const webUrl = `https://zalo.me/${zaloId}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error("Lỗi khi mở Zalo:", error);
      alert("Không thể mở ứng dụng Zalo. Vui lòng cài đặt Zalo hoặc thử lại.");
    }
  };

  const handlePhone = async () => {
    const phoneNumber = "0338617203";
    const phoneUrl = `tel:${phoneNumber}`;

    try {
      await Linking.openURL(phoneUrl);
    } catch (error) {
      console.error("Lỗi khi mở ứng dụng gọi điện:", error);
      alert("Không thể mở ứng dụng gọi điện. Vui lòng thử lại.");
    }
  };

  return (
    <View style={styles.container}>
      {isOpen ? (
        <View style={styles.contactBox}>
          {/* Header của khung liên hệ */}
          <View style={styles.header}>
            <Text style={styles.title}>Liên hệ hỗ trợ</Text>
            <TouchableOpacity onPress={() => setIsOpen(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Tùy chọn liên hệ */}
          <TouchableOpacity style={styles.option} onPress={handleEmail}>
            <Ionicons name="mail" size={24} color="#009990" />
            <Text style={styles.optionText}>Email: ducytcg123456@gmail.com</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.option} onPress={handleZalo}>
            <Ionicons name="chatbubbles" size={24} color="#009990" />
            <Text style={styles.optionText}>Zalo: 0338617203</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.option} onPress={handlePhone}>
            <Ionicons name="call" size={24} color="#009990" />
            <Text style={styles.optionText}>Điện thoại: 0338617203</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.icon} onPress={() => setIsOpen(true)}>
          <Ionicons name="chatbubble-ellipses" size={30} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  icon: {
    backgroundColor: "#009990",
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  contactBox: {
    width: 300,
    backgroundColor: "#fff",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    overflow: "hidden",
  },
  header: {
    backgroundColor: "#009990",
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  optionText: {
    marginLeft: 10,
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: "#333",
  },
});

export default ContactBubble;