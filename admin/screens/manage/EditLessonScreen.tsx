import { dashboardStyles } from "@/styles/dashboard/dashboard.styles";
import api from "@/utils/api";
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { Raleway_700Bold, useFonts } from '@expo-google-fonts/raleway';
import * as VideoPicker from "expo-image-picker";
import { Link, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Toast } from "react-native-toast-notifications";

// Định nghĩa kiểu cho lessonData
interface LessonData {
  title: string;
  description: string;
  videoSection: string;
  videoLength: string;
  videoPlayer: string;
  suggestion: string;
  videoUrl: string;
}

// Định nghĩa kiểu cho lesson từ API
interface LessonFromAPI {
  _id: string;
  title: string;
  description: string;
  videoSection: string;
  videoLength: number;
  videoPlayer: string;
  suggestion: string;
  videoUrl: string;
}

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

const EditLessonScreen = () => {
  const { courseId, lessonId } = useLocalSearchParams();
  const [lessonData, setLessonData] = useState<LessonData>({
    title: "",
    description: "",
    videoSection: "",
    videoLength: "",
    videoPlayer: "",
    suggestion: "",
    videoUrl: "",
  });
  const [videoFile, setVideoFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        if (!courseId || typeof courseId !== "string" || !lessonId || typeof lessonId !== "string") {
          throw new Error("ID khóa học hoặc bài học không hợp lệ");
        }
        setLoading(true);
        const response = await api.get(`/get-course/${courseId}`);
        const course = response.data.course;
        if (!course || !course.courseData) {
          throw new Error("Không tìm thấy khóa học hoặc dữ liệu bài học");
        }
        const lesson: LessonFromAPI = course.courseData.find((item: any) => item._id === lessonId);
        if (!lesson) {
          throw new Error("Không tìm thấy bài học");
        }
        setLessonData({
          title: lesson.title || "",
          description: lesson.description || "",
          videoSection: lesson.videoSection || "",
          videoLength: lesson.videoLength ? lesson.videoLength.toString() : "",
          videoPlayer: lesson.videoPlayer || "",
          suggestion: lesson.suggestion || "",
          videoUrl: lesson.videoUrl || "",
        });
      } catch (error: any) {
        console.error("Lỗi khi tải thông tin bài học:", error);
        setError(error.response?.data?.message || "Không thể tải thông tin bài học!");
        Toast.show(error.response?.data?.message || "Không thể tải thông tin bài học!", { type: "danger" });
        router.back(); // Điều hướng về màn hình trước đó nếu không tải được dữ liệu
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [courseId, lessonId]);

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

  const handleUpdateLesson = async () => {
    if (!courseId || typeof courseId !== "string" || !lessonId || typeof lessonId !== "string") {
      Toast.show("ID khóa học hoặc bài học không hợp lệ!", { type: "danger" });
      return;
    }

    if (!lessonData.title || !lessonData.description || !lessonData.videoSection || !lessonData.videoLength || !lessonData.videoPlayer) {
      Toast.show("Vui lòng điền đầy đủ thông tin!", { type: "danger" });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("courseId", courseId);
      formData.append("lessonId", lessonId);
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

      await api.put("/edit-lesson", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Toast.show("Cập nhật bài học thành công!", { type: "success" });
      router.replace({ pathname: "/(admin)/manage-courses/course-details", params: { courseId } }); // Điều hướng về chi tiết khóa học
    } catch (error: any) {
      console.error("Lỗi khi cập nhật bài học:", error);
      Toast.show(error.response?.data?.message || "Không thể cập nhật bài học!", { type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FontLoader>
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#009990" />
        </View>
      ) : error ? (
        <View style={dashboardStyles.container}>
          <Text style={[dashboardStyles.welcomeText, { fontFamily: "Raleway_700Bold", color: "red" }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[dashboardStyles.button, { backgroundColor: "#ccc", marginTop: 20 }]}
            onPress={() => router.back()}
          >
            <Text style={[dashboardStyles.buttonText, { fontFamily: "Nunito_600SemiBold" }]}>
              Quay Lại
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={dashboardStyles.container}>
          <Text style={[dashboardStyles.welcomeText, { fontFamily: "Raleway_700Bold" }]}>
            Chỉnh Sửa Bài Học
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
              {videoFile || lessonData.videoUrl ? "Thay đổi video" : "Chọn video"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={dashboardStyles.button}
            onPress={handleUpdateLesson}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={[dashboardStyles.buttonText, { fontFamily: "Nunito_600SemiBold" }]}>
                Cập Nhật Bài Học
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[dashboardStyles.button, { backgroundColor: "#ccc", marginTop: 10 }]}
          >
            <Link href={{ pathname: "/(admin)/manage-courses/course-details", params: { courseId } }}>
              <Text style={[dashboardStyles.buttonText, { fontFamily: "Nunito_600SemiBold" }]}>
                Quay Lại
              </Text>
            </Link>
          </TouchableOpacity>
        </ScrollView>
      )}
    </FontLoader>
  );
};

export default EditLessonScreen;