// frontend/utils/socket.ts
import { io } from "socket.io-client";

const socket = io("http://192.168.1.7:8001", {
  autoConnect: false,
  transports: ["websocket"],
  query: {},
});

export const connectSocket = async (accessToken: string, refreshToken: string, userId?: string) => {
  socket.auth = { accessToken, refreshToken };
  if (userId) {
    socket.io.opts.query = { userId };
    console.log("Connecting socket with userId:", userId); // Thêm log để kiểm tra
  }
  socket.connect();
};

export const disconnectSocket = () => {
  socket.disconnect();
};

export default socket;

