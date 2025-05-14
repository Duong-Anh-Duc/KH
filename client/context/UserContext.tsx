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
}

interface UserContextType {
  user: IUser | null;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<IUser | null>>;
  fetchUser: () => Promise<void>;
  notifications: Array<{ id: string; message: string; type: string }>;
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
    Array<{ id: string; message: string; type: string }>
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
      await fetchNotifications();
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
          await fetchNotifications();
        } catch (refreshError: any) {
          console.error("Error refreshing token:", refreshError);
          Toast.show("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.", {
            type: "warning",
            placement: "top",
            duration: 4000,
            animationType: "zoom-in",
          });
          setUser(null);
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

      const dbNotifications: INotification[] =
        response.data.notifications || [];
      const formattedNotifications = dbNotifications.map((notification) => ({
        id: notification._id,
        message: notification.message,
        type: notification.status,
      }));

      setNotifications(formattedNotifications);
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      Toast.show("Không thể lấy thông báo. Vui lòng thử lại sau.", {
        type: "danger",
        placement: "top",
        duration: 4000,
        animationType: "zoom-in",
      });
    }
  };

  const addNotification = (message: string, type: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications((prev) => [...prev, { id, message, type }]);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  useEffect(() => {
    const initializeSocket = async () => {
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      if (accessToken && refreshToken && user?._id) {
        connectSocket(accessToken, refreshToken, user._id);

        socket.on("connect", () => {
          console.log("Connected to WebSocket server");
        });

        socket.on("connect_error", (error) => {
          console.error("Socket connection error:", error);
        });

        socket.on("orderSuccess", (data: { message: string; order: any }) => {
          console.log("Received orderSuccess event:", data);
          addNotification(data.message, "orderSuccess");
          Toast.show(data.message, { type: "success" });
          fetchNotifications(); // Cập nhật lại thông báo từ database
        });

        socket.on("newCourse", (data: { message: string; course: any }) => {
          console.log("Received newCourse event:", data);
          addNotification(data.message, "newCourse");
          Toast.show(data.message, { type: "info" });
          fetchNotifications();
        });

        socket.on(
          "newLesson",
          (data: { message: string; courseId: string; lesson: any }) => {
            console.log("Received newLesson event:", data);
            addNotification(data.message, "newLesson");
            Toast.show(data.message, { type: "info" });
            fetchNotifications();
          }
        );

        socket.on("courseUpdated", (data: { message: string; course: any }) => {
          console.log("Received courseUpdated event:", data);
          addNotification(data.message, "courseUpdated");
          Toast.show(data.message, { type: "info" });
          fetchNotifications();
        });

        socket.on(
          "newQuestionReply",
          (data: {
            message: string;
            courseId: string;
            contentId: string;
            questionId: string;
          }) => {
            console.log("Received newQuestionReply event:", data);
            addNotification(data.message, "newQuestionReply");
            Toast.show(data.message, { type: "info" });
            fetchNotifications();
          }
        );

        socket.on("userUpdated", (data: { message: string; user: IUser }) => {
          console.log("Received userUpdated event:", data);
          setUser(data.user);
          addNotification(data.message, "userUpdated");
          Toast.show(data.message, { type: "success" });
          fetchNotifications();
        });

        socket.on("disconnect", () => {
          console.log("Disconnected from WebSocket server");
        });
      }
    };

    if (user?._id) {
      initializeSocket();
    }

    return () => {
      disconnectSocket();
      socket.off("connect");
      socket.off("connect_error");
      socket.off("orderSuccess");
      socket.off("newCourse");
      socket.off("newLesson");
      socket.off("courseUpdated");
      socket.off("newQuestionReply");
      socket.off("userUpdated");
      socket.off("disconnect");
    };
  }, [user?._id]);

  console.log("user", user);

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
