import { v2 as cloudinary } from "cloudinary";
import http from "http";
import { Server } from "socket.io";
import { app } from "./app";
import connectDB from "./utils/db";
require("dotenv").config();
const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Handle join event
  socket.on("join", (userId) => {
    console.log(`User ${userId} joining room ${userId}`);
    socket.join(userId);
    socket.join("allUsers");
  });

  // Handle leave event
  socket.on("leave", (userId) => {
    console.log(`User ${userId} leaving room ${userId}`);
    socket.leave(userId);
    socket.leave("allUsers");
  });

  socket.on("joinAdmin", () => {
    socket.join("adminRoom");
    console.log("Admin joined adminRoom");
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_SECRET_KEY,
});

server.listen(process.env.PORT, () => {
  console.log(`Server is connected with port ${process.env.PORT}`);
  connectDB();
});
