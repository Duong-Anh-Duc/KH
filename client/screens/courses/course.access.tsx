import ReviewCard from "@/components/cards/review.card";
import useUser from "@/hooks/auth/useUser";
import { CourseDataType, CoursesType, ReviewType } from "@/types/courses";
import { SERVER_URI } from "@/utils/uri";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { widthPercentageToDP } from "react-native-responsive-screen";
import { Toast } from "react-native-toast-notifications";

export default function CourseAccessScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();
  const { courseId } = useLocalSearchParams();
  const [courseData, setCourseData] = useState<CoursesType | null>(null);
  const [courseContentData, setCourseContentData] = useState<CourseDataType[]>(
    []
  );
  const [activeButton, setActiveButton] = useState("Về Khóa Học");
  const [isExpanded, setIsExpanded] = useState(false);
  const [rating, setRating] = useState(1);
  const [review, setReview] = useState("");
  const [reviewAvailable, setReviewAvailable] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadCourseData = async () => {
    try {
      if (typeof courseId !== "string" || !courseId) {
        throw new Error("ID khóa học không hợp lệ");
      }

      const response = await axios.get(`${SERVER_URI}/get-course/${courseId}`);
      const fetchedCourse: CoursesType = response.data.course;
      setCourseData(fetchedCourse);
    } catch (error: any) {
      console.error("Lỗi khi tải dữ liệu khóa học:", error);
      Toast.show("Không thể tải thông tin khóa học", { type: "danger" });
      router.back();
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadCourseData(),
        courseData ? fetchCourseContent() : Promise.resolve(),
      ]);
    } catch (error) {
      console.error("Lỗi khi làm mới dữ liệu:", error);
    } finally {
      setRefreshing(false);
    }
  }, [courseData]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        await loadCourseData();
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [courseId]);

  useEffect(() => {
    const subscription = async () => {
      if (!courseData) return;
      await fetchCourseContent();
      const isReviewAvailable = courseData?.reviews?.find(
        (i: ReviewType) => i.user._id === user?._id
      );
      if (isReviewAvailable) {
        setReviewAvailable(true);
      }
    };
    subscription();
  }, [courseData, user]);

  const fetchCourseContent = async () => {
    if (!courseData) return;
    const accessToken = await AsyncStorage.getItem("access_token");
    const refreshToken = await AsyncStorage.getItem("refresh_token");
    try {
      const res = await axios.get(
        `${SERVER_URI}/get-course-content/${courseData._id}`,
        {
          headers: {
            "access-token": accessToken,
            "refresh-token": refreshToken,
          },
        }
      );
      const content = res.data.content || [];
      const validContent = content.map((item: CourseDataType) => ({
        ...item,
        videoUrl:
          item.videoUrl && isValidUrl(item.videoUrl) ? item.videoUrl : "",
      }));
      setCourseContentData(validContent);
    } catch (error) {
      setIsLoading(false);
      Toast.show("Không thể tải nội dung khóa học", { type: "danger" });
      router.push({
        pathname: "/(routes)/course-details",
        params: { courseId: courseData._id },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleReviewSubmit = async () => {
    if (!courseData || !courseData._id) {
      Toast.show("Không tìm thấy ID khóa học", { type: "danger" });
      return;
    }

    const isPurchased = user?.courses?.find(
      (course: any) => course.courseId === courseData._id
    );
    if (!isPurchased) {
      Toast.show("Bạn chưa mua khóa học này, không thể gửi đánh giá", {
        type: "warning",
      });
      return;
    }

    const accessToken = await AsyncStorage.getItem("access_token");
    const refreshToken = await AsyncStorage.getItem("refresh_token");

    if (!accessToken || !refreshToken) {
      Toast.show("Vui lòng đăng nhập để gửi đánh giá", { type: "warning" });
      router.push("/(routes)/login");
      return;
    }

    try {
      await axios.put(
        `${SERVER_URI}/add-review/${courseData._id}`,
        {
          review,
          rating,
        },
        {
          headers: {
            "access-token": accessToken,
            "refresh-token": refreshToken,
          },
        }
      );
      setRating(1);
      setReview("");
      Toast.show("Gửi đánh giá thành công!", { type: "success" });
      router.push({
        pathname: "/(routes)/course-details",
        params: { courseId: courseData._id },
      });
    } catch (error: any) {
      console.error("Lỗi khi gửi đánh giá:", error);
      Toast.show(
        error.response?.data?.message ||
          "Không thể gửi đánh giá, vui lòng thử lại",
        { type: "danger" }
      );
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity key={i} onPress={() => setRating(i)}>
          <FontAwesome
            name={i <= rating ? "star" : "star-o"}
            size={25}
            color={"#FF8D07"}
            style={{ marginHorizontal: 4 }}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  const renderLessonItem = ({
    item,
    index,
  }: {
    item: CourseDataType;
    index: number;
  }) => (
    <TouchableOpacity
      style={styles.lessonItem}
      onPress={() =>
        router.push({
          pathname: "/(routes)/lesson",
          params: {
            courseId: courseData?._id,
            lessonId: item._id,
            lessonIndex: index,
          },
        })
      }
    >
      <Text style={styles.lessonNumber}>{index + 1}.</Text>
      <Text style={styles.lessonTitle}>{item.title || "Không có tiêu đề"}</Text>
    </TouchableOpacity>
  );

  if (isLoading || !courseData || !courseContentData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={[1]}
      keyExtractor={() => "course-access"}
      renderItem={() => null}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#2467EC"]}
          tintColor="#2467EC"
        />
      }
      ListHeaderComponent={
        <>
          {/* Danh sách bài học */}
          <View style={styles.lessonListContainer}>
            <Text style={styles.lessonListTitle}>Danh sách bài học</Text>
            {courseContentData.map((item, index) => (
              <TouchableOpacity
                key={item._id?.toString() || index.toString()}
                style={styles.lessonItem}
                onPress={() =>
                  router.push({
                    pathname: "/(routes)/lesson",
                    params: {
                      courseId: courseData?._id,
                      lessonId: item._id,
                      lessonIndex: index,
                    },
                  })
                }
              >
                <Text style={styles.lessonNumber}>{index + 1}.</Text>
                <Text style={styles.lessonTitle}>
                  {item.title || "Không có tiêu đề"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabContainer}
          >
            {["Về Khóa Học", "Đánh Giá"].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabButton,
                  activeButton === tab && styles.activeTabButton,
                ]}
                onPress={() => setActiveButton(tab)}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    activeButton === tab && styles.activeTabButtonText,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      }
      ListFooterComponent={
        <>
          {activeButton === "Về Khóa Học" && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>Về khóa học</Text>
              <Text style={styles.description}>
                {isExpanded
                  ? courseData?.description || "Không có mô tả"
                  : courseData?.description.slice(0, 302) || "Không có mô tả"}
              </Text>
              {courseData?.description?.length > 302 && (
                <TouchableOpacity
                  style={styles.expandButton}
                  onPress={() => setIsExpanded(!isExpanded)}
                >
                  <Text style={styles.expandButtonText}>
                    {isExpanded ? "Thu gọn" : "Xem thêm"}
                    {isExpanded ? " -" : " +"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {activeButton === "Đánh Giá" && (
            <View style={styles.tabContent}>
              {!reviewAvailable && (
                <View style={styles.reviewFormContainer}>
                  <Text style={styles.reviewFormTitle}>
                    Viết đánh giá của bạn
                  </Text>
                  <View style={styles.ratingContainer}>
                    <Text style={styles.ratingLabel}>Đánh giá:</Text>
                    <View style={styles.starsContainer}>{renderStars()}</View>
                  </View>
                  <TextInput
                    value={review}
                    onChangeText={setReview}
                    placeholder="Nhập nhận xét của bạn..."
                    style={styles.textInput}
                    multiline={true}
                    placeholderTextColor="#999"
                  />
                  <View style={styles.submitButtonContainer}>
                    <TouchableOpacity
                      style={[
                        styles.button,
                        review === "" && styles.disabledButton,
                      ]}
                      disabled={review === ""}
                      onPress={() => handleReviewSubmit()}
                    >
                      <Text style={styles.buttonText}>Gửi đánh giá</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              {courseData?.reviews?.length > 0 ? (
                courseData.reviews.map((item: ReviewType, index: number) => (
                  <ReviewCard
                    key={item.user._id + index.toString()}
                    item={item}
                  />
                ))
              ) : (
                <Text style={styles.emptyText}>Chưa có đánh giá nào</Text>
              )}
            </View>
          )}
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
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
  lessonListContainer: {
    marginVertical: 20,
    marginHorizontal: 15,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  lessonListTitle: {
    fontSize: 22,
    fontFamily: "Raleway_700Bold",
    color: "#333",
    marginBottom: 15,
  },
  lessonItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: "#F8F9FB",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E1E2E5",
  },
  lessonNumber: {
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
    color: "#2467EC",
    marginRight: 10,
  },
  lessonTitle: {
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
    color: "#333",
    flex: 1,
  },
  tabContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#E1E9F8",
    borderRadius: 25,
    marginHorizontal: 15,
    marginBottom: 20,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginHorizontal: 5,
  },
  activeTabButton: {
    backgroundColor: "#2467EC",
  },
  tabButtonText: {
    color: "#333",
    fontFamily: "Nunito_600SemiBold",
    fontSize: 16,
  },
  activeTabButtonText: {
    color: "#fff",
  },
  tabContent: {
    marginHorizontal: 15,
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
  },
  description: {
    color: "#525258",
    fontSize: 16,
    textAlign: "justify",
    fontFamily: "Nunito_500Medium",
    lineHeight: 24,
  },
  expandButton: {
    marginTop: 10,
  },
  expandButtonText: {
    color: "#2467EC",
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
  },
  reviewFormContainer: {
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
  reviewFormTitle: {
    fontSize: 18,
    fontFamily: "Raleway_700Bold",
    color: "#2467EC",
    marginBottom: 15,
    textAlign: "center",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    justifyContent: "center",
  },
  ratingLabel: {
    fontSize: 18,
    fontFamily: "Nunito_600SemiBold",
    color: "#333",
    marginRight: 10,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
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
