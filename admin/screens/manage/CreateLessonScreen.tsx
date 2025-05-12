import { dashboardStyles } from "@/styles/dashboard/dashboard.styles";
import api from "@/utils/api";
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { Raleway_700Bold, useFonts } from '@expo-google-fonts/raleway';
import * as VideoPicker from "expo-image-picker";
import { Link, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity } from "react-native";
import { Toast } from "react-native-toast-notifications";

const CreateLessonScreen = () => {
  const { courseId } = useLocalSearchParams();
  const [lessonData, setLessonData] = useState({
    title: "",
    description: "",
    videoSection: "",
    videoLength: "",
    videoPlayer: "",
    suggestion: "",
  });
  const [videoFile, setVideoFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  let [fontsLoaded, fontError] = useFonts({
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const pickVideo = async () => {
    const { status } = await VideoPicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Toast.show("Cần quyền truy cập thư viện video!", { type: "danger" });
      return;
    }

    const result = await VideoPicker.launchImageLibraryAsync({
      mediaTypes: VideoPicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setVideoFile(result.assets[0].uri);
    }
  };

  const handleCreateLesson = async () => {
    if (!lessonData.title || !lessonData.description || !lessonData.videoSection || !lessonData.videoLength || !lessonData.videoPlayer) {
      Toast.show("Vui lòng điền đầy đủ thông tin!", { type: "danger" });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("courseId", courseId as string);
      formData.append("title", lessonData.title);
      formData.append("description", lessonData.description);
      formData.append("videoSection", lessonData.videoSection);
      formData.append("videoLength", lessonData.videoLength);
      formData.append("videoPlayer", lessonData.videoPlayer);
      formData.append("suggestion", lessonData.suggestion);

      if (videoFile) {
        formData.append("videoFile", {
          uri: videoFile,
          name: "lesson_video.mp4",
          type: "video/mp4",
        } as any);
      }

      await api.post("/add-lesson", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Toast.show("Thêm bài học thành công!", { type: "success" });
    } catch (error: any) {
      Toast.show("Không thể thêm bài học!", { type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={dashboardStyles.container}>
      <Text style={[dashboardStyles.welcomeText, { fontFamily: "Raleway_700Bold" }]}>
        Thêm Bài Học
      </Text>
      <TextInput
        style={{ borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 10, borderRadius: 5 }}
        placeholder="Tiêu đề bài học"
        value={lessonData.title}
        onChangeText={(text) => setLessonData({ ...lessonData, title: text })}
      />
      <TextInput
        style={{ borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 10, borderRadius: 5 }}
        placeholder="Mô tả"
        value={lessonData.description}
        onChangeText={(text) => setLessonData({ ...lessonData, description: text })}
      />
      <TextInput
        style={{ borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 10, borderRadius: 5 }}
        placeholder="Phần video (Video Section)"
        value={lessonData.videoSection}
        onChangeText={(text) => setLessonData({ ...lessonData, videoSection: text })}
      />
      <TextInput
        style={{ borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 10, borderRadius: 5 }}
        placeholder="Độ dài video (phút)"
        value={lessonData.videoLength}
        onChangeText={(text) => setLessonData({ ...lessonData, videoLength: text })}
        keyboardType="numeric"
      />
      <TextInput
        style={{ borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 10, borderRadius: 5 }}
        placeholder="Video Player (e.g., Vimeo, YouTube)"
        value={lessonData.videoPlayer}
        onChangeText={(text) => setLessonData({ ...lessonData, videoPlayer: text })}
      />
      <TextInput
        style={{ borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 10, borderRadius: 5 }}
        placeholder="Gợi ý (nếu có)"
        value={lessonData.suggestion}
        onChangeText={(text) => setLessonData({ ...lessonData, suggestion: text })}
      />
      <TouchableOpacity
        style={{ backgroundColor: "#009990", padding: 10, borderRadius: 5, marginBottom: 10 }}
        onPress={pickVideo}
      >
        <Text style={{ color: "white", textAlign: "center", fontFamily: "Nunito_600SemiBold" }}>
          {videoFile ? "Thay đổi video" : "Chọn video"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={dashboardStyles.button}
        onPress={handleCreateLesson}
      >
        {loading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={[dashboardStyles.buttonText, { fontFamily: "Nunito_600SemiBold" }]}>
            Thêm Bài Học
          </Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[dashboardStyles.button, { backgroundColor: "#ccc", marginTop: 10 }]}
      >
        {/* @ts-ignore */}
        <Link href={{ pathname: "/(admin)/manage-courses/course-details", params: { courseId } }}>
          <Text style={[dashboardStyles.buttonText, { fontFamily: "Nunito_600SemiBold" }]}>
            Quay Lại
          </Text>
        </Link>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default CreateLessonScreen;