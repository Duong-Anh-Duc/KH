import QuestionsCard from "@/components/cards/question.card";
import useUser from "@/hooks/auth/useUser";
import { CommentType, CourseDataType, CoursesType } from "@/types/courses";
import { SERVER_URI } from "@/utils/uri";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { widthPercentageToDP } from "react-native-responsive-screen";
import { Toast } from "react-native-toast-notifications";
import { WebView } from "react-native-webview";

export default function LessonScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();
  const { courseId, lessonId, lessonIndex } = useLocalSearchParams();
  const [courseData, setCourseData] = useState<CoursesType | null>(null);
  const [lessonData, setLessonData] = useState<CourseDataType | null>(null);
  const [question, setQuestion] = useState("");

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setIsLoading(true);
        if (typeof courseId !== "string" || !courseId || !lessonId) {
          throw new Error("ID khóa học hoặc bài học không hợp lệ");
        }

        const response = await axios.get(`${SERVER_URI}/get-course/${courseId}`);
        const fetchedCourse: CoursesType = response.data.course;
        setCourseData(fetchedCourse);

        const accessToken = await AsyncStorage.getItem("access_token");
        const refreshToken = await AsyncStorage.getItem("refresh_token");
        const contentResponse = await axios.get(`${SERVER_URI}/get-course-content/${courseId}`, {
          headers: {
            "access-token": accessToken,
            "refresh-token": refreshToken,
          },
        });
        const content = contentResponse.data.content || [];
        const validContent = content.map((item: CourseDataType) => ({
          ...item,
          videoUrl: item.videoUrl && isValidUrl(item.videoUrl) ? item.videoUrl : "",
        }));
        const lesson = validContent.find((item: CourseDataType) => item._id === lessonId);
        setLessonData(lesson || validContent[parseInt(lessonIndex as string) || 0]);
      } catch (error: any) {
        console.error("Lỗi khi tải dữ liệu bài học:", error);
        Toast.show("Không thể tải nội dung bài học", { type: "danger" });
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, lessonId, lessonIndex]);

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleQuestionSubmit = async () => {
    if (!courseData || !lessonData) return;
    const accessToken = await AsyncStorage.getItem("access_token");
    const refreshToken = await AsyncStorage.getItem("refresh_token");

    await axios
      .put(
        `${SERVER_URI}/add-question`,
        {
          question: question,
          courseId: courseData?._id,
          contentId: lessonData?._id,
        },
        {
          headers: {
            "access-token": accessToken,
            "refresh-token": refreshToken,
          },
        }
      )
      .then((res) => {
        setQuestion("");
        Toast.show("Câu hỏi đã được tạo thành công!", {
          placement: "bottom",
        });
        fetchLessonData();
      })
      .catch((error) => {
        console.log(error);
        Toast.show("Không thể gửi câu hỏi, vui lòng thử lại", { type: "danger" });
      });
  };

  const fetchLessonData = async () => {
    if (!courseData) return;
    const accessToken = await AsyncStorage.getItem("access_token");
    const refreshToken = await AsyncStorage.getItem("refresh_token");
    try {
      const res = await axios.get(`${SERVER_URI}/get-course-content/${courseData._id}`, {
        headers: {
          "access-token": accessToken,
          "refresh-token": refreshToken,
        },
      });
      const content = res.data.content || [];
      const validContent = content.map((item: CourseDataType) => ({
        ...item,
        videoUrl: item.videoUrl && isValidUrl(item.videoUrl) ? item.videoUrl : "",
      }));
      const lesson = validContent.find((item: CourseDataType) => item._id === lessonId);
      setLessonData(lesson || validContent[parseInt(lessonIndex as string) || 0]);
    } catch (error) {
      Toast.show("Không thể tải nội dung bài học", { type: "danger" });
    }
  };

  if (isLoading || !courseData || !lessonData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Video */}
      <View style={styles.videoContainer}>
        <WebView
          source={{ uri: lessonData.videoUrl || "" }}
          allowsFullscreenVideo={true}
          style={styles.webView}
          onError={() => {
            Toast.show("Không thể tải video bài học", { type: "danger" });
          }}
        />
      </View>

      {/* Tiêu đề bài học */}
      <Text style={styles.lessonTitle}>
        {parseInt(lessonIndex as string) + 1}. {lessonData.title || "Không có tiêu đề"}
      </Text>

      {/* Phần Hỏi Đáp */}
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Hỏi Đáp</Text>
        <View style={styles.questionFormContainer}>
          <Text style={styles.questionFormTitle}>Đặt câu hỏi của bạn</Text>
          <TextInput
            value={question}
            onChangeText={setQuestion}
            placeholder="Nhập câu hỏi của bạn..."
            style={styles.textInput}
            multiline={true}
            placeholderTextColor="#999"
          />
          <View style={styles.submitButtonContainer}>
            <TouchableOpacity
              style={[styles.button, question === "" && styles.disabledButton]}
              disabled={question === ""}
              onPress={() => handleQuestionSubmit()}
            >
              <Text style={styles.buttonText}>Gửi câu hỏi</Text>
            </TouchableOpacity>
          </View>
        </View>
        {lessonData.questions?.length > 0 ? (
          lessonData.questions
            .slice()
            .reverse()
            .map((item: CommentType, index: number) => (
              <QuestionsCard
                key={item._id || index.toString()}
                item={item}
                fetchCourseContent={fetchLessonData}
                courseData={courseData}
                contentId={lessonData?._id}
              />
            ))
        ) : (
          <Text style={styles.emptyText}>Chưa có câu hỏi nào</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7F9",
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F6F7F9",
  },
  loadingText: {
    fontSize: 18,
    fontFamily: "Nunito_700Bold",
    color: "#333",
  },
  videoContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 12,
    marginBottom: 20,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  webView: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 22,
    fontFamily: "Raleway_700Bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  tabContent: {
    marginBottom: 30,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "Raleway_700Bold",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  questionFormContainer: {
    backgroundColor: "#F8F9FB",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2467EC",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  questionFormTitle: {
    fontSize: 18,
    fontFamily: "Raleway_700Bold",
    color: "#2467EC",
    marginBottom: 15,
    textAlign: "center",
  },
  textInput: {
    textAlignVertical: "top",
    backgroundColor: "#fff",
    borderRadius: 10,
    height: 120,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E1E2E5",
    fontSize: 16,
    fontFamily: "Nunito_400Regular",
    color: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  submitButtonContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  button: {
    width: widthPercentageToDP("40%"),
    height: 45,
    backgroundColor: "#2467EC",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
  },
  emptyText: {
    fontSize: 16,
    color: "#575757",
    textAlign: "center",
    marginVertical: 20,
    fontFamily: "Nunito_500Medium",
  },
});