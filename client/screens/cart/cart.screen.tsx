import { useCart } from "@/context/CartContext";
import { SERVER_URI } from "@/utils/uri";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useStripe } from "@stripe/stripe-react-native";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Toast } from "react-native-toast-notifications";

type CartItemType = {
  courseId: string;
  courseName: string;
  priceAtPurchase: number;
  thumbnail?: {
    public_id: string;
    url: string;
  };
  quantity?: number;
};

export default function CartScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { cartItems, removeFromCart, clearCart, fetchCart } = useCart();

  const fetchEnrolledCourses = async () => {
    try {
      console.log("Bắt đầu lấy danh sách khóa học đã đăng ký...");
      const cachedEnrolledCourses = await AsyncStorage.getItem("enrolledCourses");
      if (cachedEnrolledCourses) {
        console.log("Danh sách khóa học đã đăng ký được lấy từ cache:", cachedEnrolledCourses);
        setEnrolledCourses(JSON.parse(cachedEnrolledCourses));
        return;
      }

      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      console.log("Access Token:", accessToken);
      console.log("Refresh Token:", refreshToken);

      if (!accessToken || !refreshToken) {
        console.log("Không có access_token hoặc refresh_token, bỏ qua fetchEnrolledCourses.");
        return;
      }

      const response = await axios.get(`${SERVER_URI}/user-courses`, {
        headers: {
          "access-token": accessToken,
          "refresh-token": refreshToken,
        },
      });

      console.log("Phản hồi từ API user-courses:", response.data);

      const courses = response.data.courses.map((course: any) => course.courseId);
      setEnrolledCourses(courses);
      await AsyncStorage.setItem("enrolledCourses", JSON.stringify(courses));
      console.log("Đã lưu danh sách khóa học đã đăng ký vào AsyncStorage:", courses);
    } catch (error: any) {
      console.error("Lỗi khi lấy danh sách khóa học đã đăng ký:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      Toast.show("Không thể lấy danh sách khóa học đã đăng ký", { type: "danger" });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("Bắt đầu tải dữ liệu giỏ hàng...");
        setIsLoading(true);
        await fetchCart();
        await fetchEnrolledCourses();
      } catch (error: any) {
        console.error("Lỗi khi tải dữ liệu giỏ hàng:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        Toast.show("Không thể tải dữ liệu giỏ hàng", { type: "danger" });
      } finally {
        setIsLoading(false);
        console.log("Hoàn tất tải dữ liệu giỏ hàng.");
      }
    };

    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      console.log("Làm mới dữ liệu giỏ hàng...");
      await AsyncStorage.removeItem("enrolledCourses");
      await fetchCart();
      await fetchEnrolledCourses();
    } catch (error: any) {
      console.error("Lỗi khi làm mới dữ liệu:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      Toast.show("Không thể làm mới dữ liệu", { type: "danger" });
    } finally {
      setRefreshing(false);
      console.log("Hoàn tất làm mới dữ liệu.");
    }
  };

  const calculateTotalPrice = () => {
    const totalPrice = cartItems
      .filter((item) => selectedCourseIds.includes(item.courseId))
      .reduce((total: number, item: CartItemType) => {
        return total + Number(item.priceAtPurchase);
      }, 0);
    console.log("Tổng giá tính toán:", totalPrice);
    return totalPrice.toFixed(2);
  };

  const toggleSelection = (courseId: string) => {
    console.log(`Chuyển đổi trạng thái chọn cho khóa học ${courseId}`);
    setSelectedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
    console.log("Danh sách khóa học đã chọn:", selectedCourseIds);
  };

  const handleCourseDetails = (item: CartItemType) => {
    console.log("Xem chi tiết khóa học:", item.courseId);
    if (!item.courseId) {
      console.log("Dữ liệu khóa học không hợp lệ:", item);
      Toast.show("Dữ liệu khóa học không hợp lệ", { type: "danger" });
      return;
    }
    router.push({
      pathname: "/(routes)/course-details",
      params: {
        courseId: item.courseId,
      },
    });
  };

  const handleAccessCourse = async (courseId: string) => {
    try {
      console.log(`Truy cập khóa học ${courseId}...`);
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      console.log("Access Token:", accessToken);
      console.log("Refresh Token:", refreshToken);

      if (!accessToken || !refreshToken) {
        console.log("Không có token, chuyển hướng đến màn hình đăng nhập.");
        Toast.show("Vui lòng đăng nhập để truy cập khóa học", { type: "warning" });
        router.push("/(routes)/login");
        return;
      }

      const response = await axios.get(`${SERVER_URI}/get-course-content/${courseId}`, {
        headers: {
          "access-token": accessToken,
          "refresh-token": refreshToken,
        },
      });

      console.log("Phản hồi từ API get-course-content:", response.data);

      router.push({
        pathname: "/(routes)/course-access",
        params: { courseId },
      });
    } catch (error: any) {
      console.error("Lỗi khi truy cập khóa học:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      Toast.show("Không thể truy cập khóa học", { type: "danger" });
    }
  };

  const handleRemoveItem = async (courseId: string) => {
    try {
      console.log(`Xóa khóa học ${courseId} khỏi giỏ hàng...`);
      await removeFromCart(courseId);
      console.log(`Đã xóa khóa học ${courseId} khỏi giỏ hàng.`);
      Toast.show("Đã xóa khóa học khỏi giỏ hàng!", { type: "success" });
    } catch (error: any) {
      console.error("Lỗi khi xóa khóa học khỏi giỏ hàng:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      Toast.show("Không thể xóa khóa học khỏi giỏ hàng", { type: "danger" });
    }
  };

  const handleShowModal = () => {
    console.log("Hiển thị modal xác nhận thanh toán...");
    if (selectedCourseIds.length === 0) {
      console.log("Không có khóa học nào được chọn để thanh toán.");
      Toast.show("Vui lòng chọn ít nhất một khóa học để thanh toán", {
        type: "warning",
      });
      return;
    }
    console.log("Danh sách khóa học được chọn để thanh toán:", selectedCourseIds);
    setIsModalVisible(true);
  };

  const handlePayment = async () => {
    setIsModalVisible(false);
    try {
      setIsLoading(true);
      console.log("Bắt đầu xử lý thanh toán...");

      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");
      console.log("Access Token:", accessToken);
      console.log("Refresh Token:", refreshToken);

      if (!accessToken || !refreshToken) {
        console.log("Không có token, chuyển hướng đến màn hình đăng nhập.");
        Toast.show("Vui lòng đăng nhập để thanh toán", { type: "warning" });
        router.push("/(routes)/login");
        return;
      }

      const amount = Math.round(Number(calculateTotalPrice()));
      console.log("Tạo PaymentIntent với số tiền:", amount);

      const paymentIntentResponse = await axios.post(
        `${SERVER_URI}/payment`,
        { amount },
        {
          headers: {
            "access-token": accessToken,
            "refresh-token": refreshToken,
          },
        }
      );
      console.log("Phản hồi từ API /payment:", paymentIntentResponse.data);

      const { client_secret: clientSecret, paymentIntentId } = paymentIntentResponse.data;

      console.log("Khởi tạo PaymentSheet với clientSecret:", clientSecret);
      const initSheetResponse = await initPaymentSheet({
        merchantDisplayName: "EduBridge",
        paymentIntentClientSecret: clientSecret,
        returnURL: "edubridge://payment-complete",
      });
      console.log("Kết quả khởi tạo PaymentSheet:", initSheetResponse);

      if (initSheetResponse.error) {
        console.error("Lỗi khởi tạo PaymentSheet:", {
          message: initSheetResponse.error.message,
          code: initSheetResponse.error.code,
          localizedMessage: initSheetResponse.error.localizedMessage,
        });
        Toast.show(`Lỗi khởi tạo thanh toán: ${initSheetResponse.error.message}`, { type: "danger" });
        return;
      }

      console.log("Hiển thị PaymentSheet...");
      const paymentResponse = await presentPaymentSheet();
      console.log("Kết quả từ PaymentSheet:", paymentResponse);

      if (paymentResponse.error) {
        console.error("Lỗi thanh toán từ PaymentSheet:", {
          message: paymentResponse.error.message,
          code: paymentResponse.error.code,
          localizedMessage: paymentResponse.error.localizedMessage,
        });
        Toast.show(`Thanh toán thất bại: ${paymentResponse.error.message}`, { type: "danger" });
      } else {
        console.log("Thanh toán thành công, lấy chi tiết PaymentIntent...");
        const paymentIntentDetailsResponse = await axios.get(
          `${SERVER_URI}/payment-intent/${paymentIntentId}`,
          {
            headers: {
              "access-token": accessToken,
              "refresh-token": refreshToken,
            },
          }
        );
        console.log("Chi tiết PaymentIntent:", paymentIntentDetailsResponse.data);

        console.log("Tạo đơn hàng...");
        await createOrder(paymentResponse, paymentIntentDetailsResponse.data);
      }
    } catch (error: any) {
      console.error("Lỗi xử lý thanh toán:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config,
      });
      Toast.show(error.response?.data?.message || "Lỗi khi xử lý thanh toán", { type: "danger" });
    } finally {
      setIsLoading(false);
      console.log("Hoàn tất xử lý thanh toán.");
    }
  };

  const createOrder = async (paymentResponse: any, paymentIntentDetails: any) => {
    try {
      setIsLoading(true);
      console.log("Bắt đầu tạo đơn hàng...");

      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      console.log("Access Token:", accessToken);
      console.log("Refresh Token:", refreshToken);

      if (!accessToken || !refreshToken) {
        console.log("Không có token, chuyển hướng đến màn hình đăng nhập.");
        Toast.show("Vui lòng đăng nhập để tạo đơn hàng", { type: "warning" });
        router.push("/(routes)/login");
        return;
      }

      console.log("Dữ liệu gửi lên API /create-mobile-order:", {
        selectedCourseIds,
        payment_info: {
          ...paymentResponse,
          paymentIntent: paymentIntentDetails,
        },
      });

      const response = await axios.post(
        `${SERVER_URI}/create-mobile-order`,
        {
          selectedCourseIds,
          payment_info: {
            ...paymentResponse,
            paymentIntent: paymentIntentDetails,
          },
        },
        {
          headers: {
            "access-token": accessToken,
            "refresh-token": refreshToken,
          },
        }
      );

      console.log("Phản hồi từ API /create-mobile-order:", response.data);

      setOrderSuccess(true);
      setOrderDetails(response.data.order);
      await fetchCart();
      await fetchEnrolledCourses();
      Toast.show("Thanh toán thành công!", { type: "success" });
    } catch (error: any) {
      console.error("Lỗi khi tạo đơn hàng:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config,
      });
      Toast.show(error.response?.data?.message || "Lỗi khi tạo đơn hàng", { type: "danger" });
    } finally {
      setIsLoading(false);
      console.log("Hoàn tất tạo đơn hàng.");
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#009990" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={["#009990", "#F6F7F9"]} style={styles.container}>
      {orderSuccess ? (
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#009990" style={styles.successIcon} />
          <Text style={styles.successTitle}>
            Thanh Toán Thành Công!
          </Text>
          <Text style={styles.successText}>
            Cảm ơn bạn đã mua hàng!
          </Text>
          <View style={styles.orderDetails}>
            <Text style={styles.orderText}>
              Mã đơn hàng: {orderDetails?._id?.slice(0, 6) ?? "N/A"}
            </Text>
            <Text style={styles.orderText}>
              Trạng thái: {orderDetails?.status ?? "N/A"}
            </Text>
            <Text style={styles.orderText}>
              Tổng giá: {orderDetails?.totalPrice?.toFixed(2) ?? "0"} VNĐ
            </Text>
            <Text style={styles.orderText}>
              Số lượng khóa học: {orderDetails?.courses?.length ?? 0}
            </Text>
            <Text style={styles.orderText}>
              Người mua: {orderDetails?.userName ?? "N/A"}
            </Text>
            <Text style={styles.orderText}>
              Phương thức thanh toán: {orderDetails?.payment_info?.paymentMethod ?? "N/A"}
            </Text>
            <Text style={styles.orderText}>
              Thời gian thanh toán:{" "}
              {orderDetails?.payment_info?.created
                ? new Date(orderDetails.payment_info.created * 1000).toLocaleString()
                : "N/A"}
            </Text>
            <Text style={styles.orderText}>
              Bạn sẽ nhận được email thông báo!
            </Text>
          </View>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setOrderSuccess(false);
              router.push("/(tabs)");
            }}
          >
            <Text style={styles.backButtonText}>Quay lại Trang chủ</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerText}>Giỏ Hàng</Text>
            <View style={styles.cartCount}>
              <Text style={styles.cartCountText}>{cartItems.length}</Text>
            </View>
          </View>
          <FlatList<CartItemType>
            data={cartItems}
            keyExtractor={(item) => item.courseId || Math.random().toString()}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => toggleSelection(item.courseId)}
                >
                  <Ionicons
                    name={
                      selectedCourseIds.includes(item.courseId)
                        ? "checkbox"
                        : "square-outline"
                    }
                    size={24}
                    color={
                      selectedCourseIds.includes(item.courseId)
                        ? "#009990"
                        : "#808080"
                    }
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.courseImageContainer}
                  onPress={() => handleCourseDetails(item)}
                >
                  <Image
                    source={{ uri: item.thumbnail?.url || "https://via.placeholder.com/80" }}
                    style={styles.courseImage}
                  />
                </TouchableOpacity>
                <View style={styles.courseDetails}>
                  <TouchableOpacity onPress={() => handleCourseDetails(item)}>
                    <Text style={styles.courseName}>{item.courseName}</Text>
                  </TouchableOpacity>
                  <Text style={styles.coursePrice}>
                    {(item.priceAtPurchase).toFixed(2)} VNĐ
                  </Text>
                  {enrolledCourses.includes(item.courseId) ? (
                    <TouchableOpacity
                      style={styles.accessButton}
                      onPress={() => handleAccessCourse(item.courseId)}
                    >
                      <MaterialIcons name="play-circle-outline" size={20} color="#fff" />
                      <Text style={styles.accessButtonText}>Truy cập khóa học</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveItem(item.courseId)}
                    >
                      <MaterialIcons name="delete" size={20} color="#fff" />
                      <Text style={styles.removeButtonText}>Xóa</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Ionicons name="cart-outline" size={80} color="#575757" style={styles.emptyIcon} />
                <Text style={styles.emptyText}>
                  Giỏ Hàng Của Bạn Đang Trống!
                </Text>
                <TouchableOpacity
                  style={styles.shopButton}
                  onPress={() => router.push("/(tabs)")}
                >
                  <Text style={styles.shopButtonText}>Khám phá khóa học</Text>
                </TouchableOpacity>
              </View>
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            initialNumToRender={5}
            windowSize={10}
            removeClippedSubviews={true}
            getItemLayout={(data, index) => ({
              length: 120,
              offset: 120 * index,
              index,
            })}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
          {cartItems.length > 0 && (
            <View style={styles.footer}>
              <Text style={styles.totalText}>
                Tổng Cộng: {calculateTotalPrice()} VNĐ
              </Text>
              <TouchableOpacity
                style={[
                  styles.checkoutButton,
                  {
                    opacity: selectedCourseIds.length === 0 ? 0.5 : 1,
                  },
                ]}
                onPress={handleShowModal}
                disabled={selectedCourseIds.length === 0 || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.checkoutButtonText}>
                    Thanh Toán ({selectedCourseIds.length})
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
          <Modal
            animationType="slide"
            transparent={true}
            visible={isModalVisible}
            onRequestClose={() => setIsModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Xác nhận thanh toán</Text>
                <Text style={styles.modalMessage}>
                  Bạn có chắc chắn muốn thanh toán không?
                </Text>
                <FlatList
                  data={cartItems.filter((item) => selectedCourseIds.includes(item.courseId))}
                  keyExtractor={(item) => item.courseId}
                  renderItem={({ item }) => (
                    <View style={styles.modalCourseItem}>
                      <Text style={styles.modalCourseName}>{item.courseName}</Text>
                      <Text style={styles.modalCoursePrice}>
                        {(item.priceAtPurchase).toFixed(2)} VNĐ
                      </Text>
                    </View>
                  )}
                  style={styles.modalCourseList}
                />
                <Text style={styles.modalTotal}>
                  Tổng Cộng: {calculateTotalPrice()} VNĐ
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setIsModalVisible(false)}
                  >
                    <Text style={styles.modalCancelText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalConfirmButton}
                    onPress={handlePayment}
                  >
                    <Text style={styles.modalConfirmText}>Xác nhận</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
    fontFamily: "Nunito_600SemiBold",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E1E2E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerText: {
    fontSize: 24,
    fontFamily: "Raleway_700Bold",
    color: "#333",
  },
  cartCount: {
    backgroundColor: "#141517",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  cartCountText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: "Raleway_700Bold",
    color: "#009990",
    textAlign: "center",
  },
  successText: {
    fontSize: 16,
    fontFamily: "Nunito_400Regular",
    color: "#575757",
    marginTop: 10,
    textAlign: "center",
  },
  orderDetails: {
    marginTop: 20,
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: 15,
    borderRadius: 10,
    width: "100%",
  },
  orderText: {
    fontSize: 16,
    fontFamily: "Nunito_400Regular",
    color: "#575757",
    marginVertical: 5,
  },
  backButton: {
    backgroundColor: "#009990",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
    textAlign: "center",
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    height: 120,
  },
  checkbox: {
    marginRight: 10,
  },
  courseImageContainer: {
    marginRight: 12,
    borderRadius: 8,
    overflow: "hidden",
  },
  courseImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  courseDetails: {
    flex: 1,
    justifyContent: "space-between",
  },
  courseName: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: "#333",
  },
  coursePrice: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: "#575757",
    marginTop: 5,
  },
  removeButton: {
    backgroundColor: "#FF6347",
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginTop: 10,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
  },
  removeButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    marginLeft: 5,
  },
  accessButton: {
    backgroundColor: "#009990",
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginTop: 10,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
  },
  accessButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    marginLeft: 5,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    marginTop: 100,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontFamily: "Raleway_700Bold",
    color: "#333",
    marginTop: 20,
  },
  shopButton: {
    backgroundColor: "#009990",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  shopButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
  },
  footer: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E1E2E5",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  totalText: {
    fontSize: 18,
    fontFamily: "Nunito_700Bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  checkoutButton: {
    backgroundColor: "#009990",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
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
    textAlign: "center",
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: "Nunito_400Regular",
    color: "#575757",
    textAlign: "center",
    marginBottom: 15,
  },
  modalCourseList: {
    maxHeight: 200,
    marginBottom: 15,
  },
  modalCourseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#E1E2E5",
  },
  modalCourseName: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: "#333",
  },
  modalCoursePrice: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: "#575757",
  },
  modalTotal: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalCancelButton: {
    backgroundColor: "#FF6347",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flex: 1,
    marginRight: 10,
  },
  modalCancelText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
    textAlign: "center",
  },
  modalConfirmButton: {
    backgroundColor: "#009990",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flex: 1,
  },
  modalConfirmText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
    textAlign: "center",
  },
});