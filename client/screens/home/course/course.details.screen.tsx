// frontend/app/(routes)/course-details.tsx
import ReviewCard from "@/components/cards/review.card";
import CourseLesson from "@/components/courses/course.lesson";
import { useCart } from "@/context/CartContext";
import { useUser } from "@/context/UserContext";
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
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import { Toast } from "react-native-toast-notifications";
import { Video, ResizeMode } from "expo-av";

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: {
    public_id: string;
    url: string;
  };
  role: string;
  isVerified: boolean;
  courses: Array<{ courseId: string }>;
}

interface ReviewType {
  user: User;
  rating?: number;
  comment: string;
  commentReplies?: ReviewType[];
}

interface PrerequisiteType {
  title: string;
}

interface BenefitType {
  title: string;
}

interface CommentType {
  _id: string;
  user: User;
  question: string;
  questionReplies: CommentType[];
}

interface LinkType {
  title: string;
  url: string;
}

interface CourseDataType {
  _id: string | any;
  title: string;
  description: string;
  videoUrl: string;
  videoThumbnail: object;
  videoSection: string;
  videoLength: number;
  videoPlayer: string;
  links: LinkType[];
  suggestion: string;
  questions: CommentType[];
}

interface CoursesType {
  _id: any;
  name: string;
  description: string;
  categories: string;
  price: number;
  estimatedPrice?: number;
  thumbnail: {
    public_id: string | any;
    url: string | any;
  };
  tags: string;
  level: string;
  demoUrl: string;
  benefits: BenefitType[];
  prerequisites: PrerequisiteType[];
  reviews: ReviewType[];
  courseData: CourseDataType[];
  ratings?: number;
  purchased: number;
}

export default function CourseDetailScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [activeButton, setActiveButton] = useState("Về Khóa Học");
  const { user, loading: userLoading, fetchUser } = useUser();
  const [isExpanded, setIsExpanded] = useState(false);
  const { courseId } = useLocalSearchParams();
  const [courseData, setCourseData] = useState<CoursesType | null>(null);
  const [checkPurchased, setCheckPurchased] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const { addToCart, removeFromCart, cartItems, errorMessage, clearError } =
    useCart();
  const [isDemoModalVisible, setIsDemoModalVisible] = useState(false); // Trạng thái để hiển thị modal video demo

  const isCourseInCart = cartItems.some((item) => item.courseId === courseId);

  const fetchCourseData = async () => {
    try {
      setIsLoading(true);
      if (typeof courseId !== "string" || !courseId) {
        throw new Error("ID khóa học không hợp lệ");
      }

      const response = await axios.get(`${SERVER_URI}/get-courses`);
      const fetchedCourses: CoursesType[] = response.data.courses || [];

      const selectedCourse = fetchedCourses.find(
        (course: CoursesType) => course._id === courseId
      );

      if (!selectedCourse) {
        throw new Error("Không tìm thấy khóa học");
      }

      setCourseData(selectedCourse);

      if (user) {
        const accessToken = await AsyncStorage.getItem("access_token");
        const refreshToken = await AsyncStorage.getItem("refresh_token");
        const favoritesResponse = await axios.get(
          `${SERVER_URI}/get-favorite-courses`,
          {
            headers: {
              "access-token": accessToken,
              "refresh-token": refreshToken,
            },
          }
        );
        const favoriteCourses = favoritesResponse.data.courses || [];
        setIsFavorite(
          favoriteCourses.some((course: CoursesType) => course._id === courseId)
        );
      }
    } catch (error: any) {
      console.error("Lỗi khi tải dữ liệu khóa học:", error);
      Toast.show("Không thể tải thông tin khóa học", { type: "danger" });
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchCourseData(),
        user ? fetchUser() : Promise.resolve(),
      ]);
    } catch (error) {
      console.error("Lỗi khi làm mới dữ liệu:", error);
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        await fetchCourseData();
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, [courseId]);

  useEffect(() => {
    if (user && courseData) {
      const isPurchased = user.courses?.find(
        (i: any) => i.courseId === courseData?._id
      );
      setCheckPurchased(!!isPurchased);
    } else {
      setCheckPurchased(false);
    }
  }, [user, courseData]);

  const handleAddToCart = async () => {
    if (!courseData) return;
    try {
      await addToCart(courseData);
      if (!errorMessage) {
        Toast.show("Thêm sản phẩm vào giỏ hàng thành công!", {
          type: "success",
          placement: "top",
          duration: 3000,
        });
      } else {
        Toast.show(errorMessage || "Lỗi khi thêm vào giỏ hàng", {
          type: "danger",
          placement: "top",
          duration: 3000,
        });
      }
    } catch (error: any) {
      console.error("Lỗi khi thêm vào giỏ hàng:", error);
      Toast.show(error.response?.data?.message || "Lỗi khi thêm vào giỏ hàng", {
        type: "danger",
        placement: "top",
        duration: 3000,
      });
    }
  };

  const handleRemoveFromCart = async () => {
    if (!courseId) return;
    try {
      await removeFromCart(courseId as string);
      Toast.show("Đã xóa sản phẩm khỏi giỏ hàng!", {
        type: "success",
        placement: "top",
        duration: 3000,
      });
      clearError();
    } catch (error: any) {
      console.error("Lỗi khi xóa khỏi giỏ hàng:", error);
      Toast.show(
        error.response?.data?.message || "Không thể xóa sản phẩm khỏi giỏ hàng",
        {
          type: "danger",
          placement: "top",
          duration: 3000,
        }
      );
    }
  };

  const handleAccessCourse = async () => {
    if (!courseData) return;
    if (!checkPurchased) {
      Toast.show("Bạn chưa mua khóa học này!", { type: "warning" });
      return;
    }

    try {
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      if (!accessToken || !refreshToken || !user) {
        Toast.show("Vui lòng đăng nhập để truy cập khóa học", {
          type: "warning",
        });
        router.push("/(routes)/login");
        return;
      }

      await axios.get(`${SERVER_URI}/get-course-content/${courseData._id}`, {
        headers: {
          "access-token": accessToken,
          "refresh-token": refreshToken,
        },
      });

      router.push({
        pathname: "/(routes)/course-access",
        params: { courseId: courseData._id },
      });
    } catch (error: any) {
      console.error("Lỗi khi truy cập khóa học:", error);
      if (error.response?.status === 401) {
        Toast.show("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.", {
          type: "warning",
        });
        await AsyncStorage.removeItem("access_token");
        await AsyncStorage.removeItem("refresh_token");
        router.push("/(routes)/login");
      } else {
        Toast.show("Bạn không có quyền truy cập khóa học này", {
          type: "danger",
        });
      }
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      if (!accessToken || !refreshToken || !user) {
        Toast.show("Vui lòng đăng nhập để thêm vào danh sách yêu thích", {
          type: "warning",
          placement: "top",
          duration: 3000,
        });
        router.push("/(routes)/login");
        return;
      }

      const endpoint = isFavorite
        ? "/remove-from-favorites"
        : "/add-to-favorites";
      const response = await axios.post(
        `${SERVER_URI}${endpoint}`,
        { courseId },
        {
          headers: {
            "access-token": accessToken,
            "refresh-token": refreshToken,
          },
        }
      );

      setIsFavorite(!isFavorite);
      Toast.show(
        response.data.message ||
          (isFavorite
            ? "Đã xóa khỏi danh sách yêu thích"
            : "Đã thêm vào danh sách yêu thích thành công"),
        {
          type: "success",
          placement: "top",
          duration: 3000,
        }
      );

      // Không điều hướng đến trang danh sách yêu thích (theo yêu cầu trước đó)
      // router.replace("/(tabs)/favorites");
    } catch (error: any) {
      console.error("Lỗi khi thêm/xóa khóa học yêu thích:", error);
      Toast.show(
        error.response?.data?.message || "Lỗi khi cập nhật danh sách yêu thích",
        {
          type: "danger",
          placement: "top",
          duration: 3000,
        }
      );
    }
  };

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

  if (isLoading || userLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#009990" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!courseData) {
    return null;
  }

  return (
    <LinearGradient colors={["#009990", "#F6F7F9"]} style={styles.container}>
      {errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity
            onPress={clearError}
            style={styles.clearErrorButton}
          >
            <Ionicons name="close-circle" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.thumbnailContainer}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Bán Chạy Nhất</Text>
          </View>
          <View style={styles.ratingContainer}>
            <FontAwesome name="star" size={14} color={"#FFB800"} />
            <Text style={styles.ratingText}>{courseData?.ratings ?? 0}</Text>
          </View>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleToggleFavorite}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={24}
              color={isFavorite ? "#FF6347" : "#000"}
            />
          </TouchableOpacity>
          <Image
            source={{
              uri:
                courseData?.thumbnail.url || "https://via.placeholder.com/230",
            }}
            style={styles.thumbnail}
          />
          {courseData?.demoUrl && (
            <TouchableOpacity
              style={styles.demoButton}
              onPress={() => setIsDemoModalVisible(true)}
            >
              <Ionicons name="play-circle-outline" size={24} color="#fff" />
              <Text style={styles.demoButtonText}>Xem demo</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.courseTitle}>
          {courseData?.name ?? "Khóa học không xác định"}
        </Text>
        <View style={styles.priceContainer}>
          <View style={styles.priceWrapper}>
            <Text style={styles.priceText}>
              {courseData?.price?.toFixed(2) ?? "0"} VNĐ
            </Text>
            <Text style={styles.estimatedPriceText}>
              {courseData?.estimatedPrice?.toFixed(2) ?? "0"} VNĐ
            </Text>
          </View>
          <Text style={styles.purchasedText}>
            {courseData?.purchased ?? 0} học viên
          </Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Điều Kiện Tiên Quyết Của Khóa Học
          </Text>
          {courseData?.prerequisites?.length > 0 ? (
            courseData.prerequisites.map(
              (item: PrerequisiteType, index: number) => (
                <View key={index} style={styles.listItem}>
                  <Ionicons
                    name="checkmark-done-outline"
                    size={18}
                    color="#2467EC"
                  />
                  <Text style={styles.listItemText}>{item.title}</Text>
                </View>
              )
            )
          ) : (
            <Text style={styles.emptyText}>Không có điều kiện tiên quyết</Text>
          )}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lợi Ích Của Khóa Học</Text>
          {courseData?.benefits?.length > 0 ? (
            courseData.benefits.map((item: BenefitType, index: number) => (
              <View key={index} style={styles.listItem}>
                <Ionicons
                  name="checkmark-done-outline"
                  size={18}
                  color="#2467EC"
                />
                <Text style={styles.listItemText}>{item.title}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Không có lợi ích được liệt kê</Text>
          )}
        </View>
        <View style={styles.tabContainer}>
          {["Về Khóa Học", "Bài Giảng", "Đánh Giá"].map((tab) => (
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
        </View>
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
        {activeButton === "Bài Giảng" && (
          <View style={styles.tabContent}>
            <CourseLesson courseDetails={courseData} />
          </View>
        )}
        {activeButton === "Đánh Giá" && (
          <View style={styles.tabContent}>
            <View style={styles.reviewsContainer}>
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
          </View>
        )}
      </ScrollView>
      <View style={styles.footer}>
        {checkPurchased ? (
          <TouchableOpacity
            style={styles.accessButton}
            onPress={handleAccessCourse}
          >
            <Text style={styles.accessButtonText}>Truy cập khóa học</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.cartButton,
              isCourseInCart && styles.removeCartButton,
            ]}
            onPress={isCourseInCart ? handleRemoveFromCart : handleAddToCart}
          >
            <Text style={styles.cartButtonText}>
              {isCourseInCart ? "Xóa khỏi giỏ hàng" : "Thêm vào giỏ hàng"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modal để hiển thị video demo */}
      <Modal
        visible={isDemoModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsDemoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Video Demo</Text>
            <Video
              source={{ uri: courseData?.demoUrl }}
              style={styles.demoVideo}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={false}
            />
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setIsDemoModalVisible(false)}
            >
              <Text style={styles.closeModalButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F6F7F9",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
    fontFamily: "Nunito_600SemiBold",
  },
  thumbnailContainer: {
    marginHorizontal: 15,
    position: "relative",
  },
  badge: {
    position: "absolute",
    zIndex: 1,
    backgroundColor: "#FFB013",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginTop: 10,
    marginLeft: 10,
  },
  badgeText: {
    color: "#000",
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
  },
  ratingContainer: {
    position: "absolute",
    zIndex: 14,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141517",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginTop: 10,
    marginRight: 10,
  },
  ratingText: {
    color: "white",
    marginLeft: 5,
    fontFamily: "Nunito_600SemiBold",
    fontSize: 14,
  },
  favoriteButton: {
    position: "absolute",
    zIndex: 14,
    right: 10,
    top: 50,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    padding: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  thumbnail: {
    width: "100%",
    height: 230,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  demoButton: {
    position: "absolute",
    zIndex: 14,
    bottom: 10,
    left: 10,
    backgroundColor: "rgba(0, 153, 144, 0.9)", // Màu nền của nút "Xem demo"
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  demoButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    marginLeft: 5,
  },
  courseTitle: {
    marginHorizontal: 15,
    marginTop: 15,
    fontSize: 24,
    fontFamily: "Raleway_700Bold",
    color: "#333",
    textAlign: "center",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  priceWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceText: {
    color: "#333",
    fontSize: 22,
    fontFamily: "Nunito_700Bold",
  },
  estimatedPriceText: {
    color: "#808080",
    fontSize: 18,
    marginLeft: 10,
    textDecorationLine: "line-through",
    fontFamily: "Nunito_500Medium",
  },
  purchasedText: {
    fontSize: 16,
    color: "#575757",
    fontFamily: "Nunito_600SemiBold",
  },
  section: {
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 15,
    marginVertical: 10,
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
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  listItemText: {
    paddingLeft: 10,
    fontSize: 16,
    fontFamily: "Nunito_500Medium",
    color: "#525258",
    lineHeight: 22,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginHorizontal: 15,
    backgroundColor: "#E1E9F8",
    borderRadius: 25,
    paddingVertical: 10,
    marginVertical: 15,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
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
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
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
    alignSelf: "center",
  },
  expandButtonText: {
    color: "#2467EC",
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
  },
  reviewsContainer: {
    padding: 10,
    backgroundColor: "#F8F9FB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2467EC",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyText: {
    fontSize: 16,
    color: "#575757",
    textAlign: "center",
    marginVertical: 20,
    fontFamily: "Nunito_500Medium",
  },
  footer: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    paddingVertical: 15,
    marginBottom: 10,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  accessButton: {
    backgroundColor: "#009990",
    paddingVertical: 16,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  cartButton: {
    backgroundColor: "#009990",
    paddingVertical: 16,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  removeCartButton: {
    backgroundColor: "#FF6347",
  },
  accessButtonText: {
    textAlign: "center",
    color: "#fff",
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
  },
  cartButtonText: {
    textAlign: "center",
    color: "#fff",
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
  },
  errorContainer: {
    position: "absolute",
    top: 50,
    left: 15,
    right: 15,
    backgroundColor: "#FF6347",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 1000,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  errorText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
  },
  clearErrorButton: {
    padding: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Raleway_700Bold",
    color: "#333",
    marginBottom: 15,
  },
  demoVideo: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 15,
  },
  closeModalButton: {
    backgroundColor: "#009990",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  closeModalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
  },
});
