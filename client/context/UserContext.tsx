// frontend/context/UserContext.tsx
import socket, { connectSocket, disconnectSocket } from "@/utils/socket";
import { SERVER_URI } from "@/utils/uri";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Toast } from "react-native-toast-notifications";

interface IUser {
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

interface INotification {
  _id: string;
  title: string;
  message: string;
  status: string;
  createdAt: string;
  courseId?: string;
  price?: number;
}

interface UserContextType {
  user: IUser | null;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<IUser | null>>;
  fetchUser: () => Promise<void>;
  notifications: Array<{
    id: string;
    message: string;
    type: string;
    status: string;
    courseId?: string;
    price?: number;
  }>;
  clearNotifications: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      message: string;
      type: string;
      status: string;
      courseId?: string;
      price?: number;
    }>
  >([]);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      if (!accessToken || !refreshToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await axios.get(`${SERVER_URI}/me`, {
        headers: {
          "access-token": accessToken,
          "refresh-token": refreshToken,
        },
      });

      setUser(response.data.user);

      // Fetch notifications immediately after setting user
      if (response.data.user) {
        try {
          const notificationResponse = await axios.get(
            `${SERVER_URI}/get-notifications`,
            {
              headers: {
                "access-token": accessToken,
                "refresh-token": refreshToken,
              },
            }
          );

          if (notificationResponse.data.success) {
            const dbNotifications: INotification[] =
              notificationResponse.data.notifications || [];
            const formattedNotifications = dbNotifications.map(
              (notification) => ({
                id: notification._id,
                message: notification.message,
                type: notification.status,
                status: notification.status,
                courseId: notification.courseId,
                price: notification.price,
              })
            );

            setNotifications(formattedNotifications);
          }
        } catch (error: any) {
          if (error.response?.status !== 404) {
            console.error("Error fetching initial notifications:", error);
          }
        }
      }
    } catch (error: any) {
      console.error("Error fetching user:", error);
      if (error.response?.status === 401) {
        try {
          const refreshToken = await AsyncStorage.getItem("refresh_token");
          if (!refreshToken) {
            throw new Error("No refresh token available");
          }

          const response = await axios.post(
            `${SERVER_URI}/refresh-token`,
            {},
            {
              headers: {
                "refresh-token": refreshToken,
              },
            }
          );

          const newAccessToken = response.data.accessToken;
          await AsyncStorage.setItem("access_token", newAccessToken);

          const retryResponse = await axios.get(`${SERVER_URI}/me`, {
            headers: {
              "access-token": newAccessToken,
              "refresh-token": refreshToken,
            },
          });

          setUser(retryResponse.data.user);
          await fetchNotifications(); // Fetch notifications after token refresh
        } catch (refreshError: any) {
          console.error("Error refreshing token:", refreshError);
          Toast.show("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.", {
            type: "warning",
            placement: "top",
            duration: 4000,
            animationType: "zoom-in",
          });
          setUser(null);
          setNotifications([]); // Clear notifications when session expires
        }
      } else {
        Toast.show(
          "Không thể lấy thông tin người dùng. Vui lòng thử lại sau.",
          {
            type: "danger",
            placement: "top",
            duration: 4000,
            animationType: "zoom-in",
          }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      if (!accessToken || !refreshToken || !user?._id) {
        return;
      }

      const response = await axios.get(`${SERVER_URI}/get-notifications`, {
        headers: {
          "access-token": accessToken,
          "refresh-token": refreshToken,
        },
      });

      if (response.data.success) {
        const dbNotifications: INotification[] =
          response.data.notifications || [];
        const formattedNotifications = dbNotifications.map((notification) => ({
          id: notification._id,
          message: notification.message,
          type: notification.status,
          status: notification.status,
          courseId: notification.courseId,
          price: notification.price,
        }));

        setNotifications(formattedNotifications);
      }
    } catch (error: any) {
      console.error("Lỗi khi lấy thông báo:", error.message);
      // Chỉ hiển thị toast khi không phải lỗi 404
      if (error.response?.status !== 404) {
        Toast.show("Không thể lấy thông báo. Vui lòng thử lại sau.", {
          type: "danger",
          placement: "top",
          duration: 4000,
          animationType: "zoom-in",
        });
      }
    }
  };

  const addNotification = (message: string, type: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications((prev) => [...prev, { id, message, type, status: "new" }]);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  useEffect(() => {
    const initializeSocket = async () => {
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      if (accessToken && refreshToken && user?._id) {
        try {
          await connectSocket(accessToken, refreshToken, user._id);

          const handleNotification = async (data: any, type: string) => {
            console.log(`Received ${type} event:`, data);
            if (data.message) {
              addNotification(data.message, type);
              Toast.show(data.message, {
                type: type === "orderSuccess" ? "success" : "info",
                placement: "top",
                duration: 4000,
                animationType: "zoom-in",
              });
              await fetchNotifications();
            }
          };

          socket.on("orderSuccess", (data) =>
            handleNotification(data, "orderSuccess")
          );
          socket.on("newCourse", (data) =>
            handleNotification(data, "newCourse")
          );
          socket.on("newLesson", (data) =>
            handleNotification(data, "newLesson")
          );
          socket.on("courseUpdated", (data) =>
            handleNotification(data, "courseUpdated")
          );
          socket.on("newQuestionReply", (data) =>
            handleNotification(data, "newQuestionReply")
          );
          socket.on("userUpdated", (data) => {
            console.log("Received userUpdated event:", data);
            if (data.user) {
              setUser(data.user);
            }
            handleNotification(data, "userUpdated");
          });

          // Add reconnection handling
          socket.on("reconnect", async () => {
            console.log("Socket reconnected - refetching notifications");
            await fetchNotifications();
          });
        } catch (error) {
          console.error("Error initializing socket:", error);
          Toast.show("Không thể kết nối đến máy chủ thông báo", {
            type: "error",
            placement: "top",
            duration: 4000,
            animationType: "zoom-in",
          });
        }
      }
    };

    if (user?._id) {
      initializeSocket();
    }

    return () => {
      if (socket.connected) {
        socket.off("orderSuccess");
        socket.off("newCourse");
        socket.off("newLesson");
        socket.off("courseUpdated");
        socket.off("newQuestionReply");
        socket.off("userUpdated");
        socket.off("reconnect");
        disconnectSocket();
      }
    };
  }, [user?._id]);

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        setUser,
        fetchUser,
        notifications,
        clearNotifications,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
