import cloudinary from "cloudinary";
import ejs from "ejs";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import path from "path";
import CourseModel from "../models/course.model";
import NotificationModel from "../models/notification.Model";
import userModel, { IUser } from "../models/user.model";
import { io } from "../server";
import ErrorHandler from "../utils/ErrorHandler";
import { generateTokens } from "../utils/jwt";
import { redis } from "../utils/redis";
import sendMail from "../utils/sendMail";

interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

interface IActivationToken {
  token: string;
  activationCode: string;
}

export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.ACTIVATION_SECRET as Secret,
    {
      expiresIn: "5m",
    }
  );

  return { token, activationCode };
};

export const registrationUserService = async (data: IRegistrationBody) => {
  const { name, email, password } = data;

  const isEmailExist = await userModel.findOne({ email });
  if (isEmailExist) {
    throw new ErrorHandler("Email đã tồn tại", 400);
  }

  const user: IRegistrationBody = { name, email, password };
  const activationToken = createActivationToken(user);
  const activationCode = activationToken.activationCode;

  const mailData = { user: { name: user.name }, activationCode };
  const html = await ejs.renderFile(
    path.join(__dirname, "../mails/activation-mail.ejs"),
    mailData
  );

  await sendMail({
    email: user.email,
    subject: "Kích hoạt tài khoản của bạn",
    template: "activation-mail.ejs",
    data: mailData,
  });

  return {
    message: `Vui lòng kiểm tra email: ${user.email} để kích hoạt tài khoản!`,
    activationToken: activationToken.token,
  };
};

export const activateUserService = async (activationData: { activation_token: string; activation_code: string }) => {
  const { activation_token, activation_code } = activationData;

  const newUser: { user: IUser; activationCode: string } = jwt.verify(
    activation_token,
    process.env.ACTIVATION_SECRET as string
  ) as { user: IUser; activationCode: string };

  if (newUser.activationCode !== activation_code) {
    throw new ErrorHandler("Mã kích hoạt không hợp lệ", 400);
  }

  const { name, email, password } = newUser.user;

  const existUser = await userModel.findOne({ email });
  if (existUser) {
    throw new ErrorHandler("Email đã tồn tại", 400);
  }

  await userModel.create({ name, email, password });
};

export const loginUserService = async (loginData: { email: string; password: string }) => {
  const { email, password } = loginData;

  const loginAttemptsKey = `login_attempts:${email}`;
  const attempts = await redis.get(loginAttemptsKey);
  const loginAttempts = attempts ? parseInt(attempts) : 0;

  if (loginAttempts >= 5) {
    throw new ErrorHandler("Tài khoản đã bị khóa do nhập sai quá nhiều lần. Vui lòng thử lại sau 30 phút.", 403);
  }

  const user = await userModel.findOne({ email }).select("+password");
  if (!user) {
    await redis.set(loginAttemptsKey, (loginAttempts + 1).toString(), "EX", 1800); // Lưu số lần thử trong 30 phút
    throw new ErrorHandler("Email hoặc mật khẩu không hợp lệ", 400);
  }

  // Kiểm tra trạng thái isBanned
  if (user.isBanned) {
    throw new ErrorHandler("Bạn đã bị cấm vui lòng liên hệ admin để mở khoá!", 403);
  }

  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    await redis.set(loginAttemptsKey, (loginAttempts + 1).toString(), "EX", 1800);
    throw new ErrorHandler("Email hoặc mật khẩu không hợp lệ", 400);
  }

  await redis.del(loginAttemptsKey); // Reset số lần thử nếu đăng nhập thành công
  await redis.set(user._id, JSON.stringify(user));
  const { accessToken, refreshToken } = generateTokens(user);
  return { user, accessToken, refreshToken };
};

export const logoutUserService = async (userId: string) => {
  await redis.del(userId);
  return { message: "Đăng xuất thành công" };
};

export const updateAccessTokenService = async (refreshTokenInput: string) => {
  const decoded = jwt.verify(
    refreshTokenInput,
    process.env.REFRESH_TOKEN as string
  ) as JwtPayload;

  if (!decoded) {
    throw new ErrorHandler("Không thể làm mới token", 400);
  }

  const session = await redis.get(decoded.id as string);
  if (!session) {
    throw new ErrorHandler("Vui lòng đăng nhập để truy cập tài nguyên này!", 400);
  }

  const user = JSON.parse(session);

  // Tạo token mới
  const { accessToken, refreshToken } = generateTokens(user);

  // Cập nhật session trong Redis
  await redis.set(user._id, JSON.stringify(user), "EX", 604800);

  return { user, accessToken, refreshToken };
};

export const getUserInfoService = async (userId: string) => {
  const userJson = await redis.get(userId);
  if (!userJson) {
    throw new ErrorHandler("Người dùng không tồn tại", 404);
  }
  return JSON.parse(userJson);
};
// backend/services/user.service.ts
export const updateUserInfoService = async (userId: string, updateData: { name?: string; email?: string }) => {
  const { name } = updateData;

  const user = await userModel.findById(userId);
  if (!user) {
    throw new ErrorHandler("Người dùng không tồn tại", 404);
  }

  if (name) {
    user.name = name;
  }

  await user.save();
  await redis.set(userId, JSON.stringify(user));

  // Lưu thông báo vào database
  await NotificationModel.create({
    userId: userId,
    title: "Cập Nhật Tài Khoản",
    message: "Thông tin tài khoản của bạn đã được cập nhật thành công!",
    status: "unread",
  });

  // Gửi thông báo qua socket.io
  io.to(userId).emit("userUpdated", {
    message: "Thông tin tài khoản của bạn đã được cập nhật thành công!",
    user,
  });

  return user;
};

export const updatePasswordService = async (userId: string, passwordData: { oldPassword: string; newPassword: string }) => {
  const { oldPassword, newPassword } = passwordData;

  if (!oldPassword || !newPassword) {
    throw new ErrorHandler("Vui lòng nhập mật khẩu cũ và mới", 400);
  }

  const user = await userModel.findById(userId).select("+password");
  if (!user || user.password === undefined) {
    throw new ErrorHandler("Người dùng không hợp lệ", 400);
  }

  const isPasswordMatch = await user.comparePassword(oldPassword);
  if (!isPasswordMatch) {
    throw new ErrorHandler("Mật khẩu cũ không đúng", 400);
  }

  user.password = newPassword;
  await user.save();
  await redis.set(userId, JSON.stringify(user));

  // Lưu thông báo vào database
  await NotificationModel.create({
    userId: userId,
    title: "Cập Nhật Mật Khẩu",
    message: "Mật khẩu của bạn đã được cập nhật thành công!",
    status: "unread",
  });

  // Gửi thông báo qua socket.io
  io.to(userId).emit("userUpdated", {
    message: "Mật khẩu của bạn đã được cập nhật thành công!",
    user,
  });

  return user;
};

export const updateProfilePictureService = async (userId: string, avatar: string) => {
  const user = await userModel.findById(userId).select("+password");
  if (!user) {
    throw new ErrorHandler("Người dùng không tồn tại", 404);
  }

  if (avatar) {
    if (user.avatar?.public_id) {
      await cloudinary.v2.uploader.destroy(user.avatar.public_id);
      const myCloud = await cloudinary.v2.uploader.upload(avatar, {
        folder: "avatars",
        width: 150,
      });
      user.avatar = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    } else {
      const myCloud = await cloudinary.v2.uploader.upload(avatar, {
        folder: "avatars",
        width: 150,
      });
      user.avatar = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    }
  }

  await user.save();
  await redis.set(userId, JSON.stringify(user));

  // Lưu thông báo vào database
  await NotificationModel.create({
    userId: userId,
    title: "Cập Nhật Ảnh Đại Diện",
    message: "Ảnh đại diện của bạn đã được cập nhật thành công!",
    status: "unread",
  });

  // Gửi thông báo qua socket.io
  io.to(userId).emit("userUpdated", {
    message: "Ảnh đại diện của bạn đã được cập nhật thành công!",
    user,
  });

  return user;
};



export const forgotPasswordService = async (email: string) => {
  if (!email) {
    throw new ErrorHandler("Vui lòng nhập email của bạn", 400);
  }

  const user = await userModel.findOne({ email });
  if (!user) {
    throw new ErrorHandler("Email không tồn tại", 404);
  }

  const resetCode = Math.floor(1000 + Math.random() * 9000).toString();
  const resetToken = jwt.sign(
    { email, resetCode },
    process.env.RESET_PASSWORD_SECRET as Secret,
    { expiresIn: "10m" }
  );

  await redis.set(`reset:${email}`, resetToken, "EX", 600);

  const data = { user: { name: user.name }, resetCode };
  await sendMail({
    email: user.email,
    subject: "Đặt lại mật khẩu",
    template: "reset-password-mail.ejs",
    data,
  });

  return {
    message: `Mã đặt lại đã được gửi đến ${email}. Vui lòng kiểm tra hộp thư của bạn.`,
    resetToken,
  };
};

export const resetPasswordService = async (resetData: { resetToken: string; resetCode: string; newPassword: string }) => {
  const { resetToken, resetCode, newPassword } = resetData;

  if (!resetToken || !resetCode || !newPassword) {
    throw new ErrorHandler("Vui lòng cung cấp đầy đủ các trường bắt buộc", 400);
  }

  const decoded = jwt.verify(
    resetToken,
    process.env.RESET_PASSWORD_SECRET as string
  ) as { email: string; resetCode: string };

  if (decoded.resetCode !== resetCode) {
    throw new ErrorHandler("Mã đặt lại không hợp lệ", 400);
  }

  const storedToken = await redis.get(`reset:${decoded.email}`);
  if (storedToken !== resetToken) {
    throw new ErrorHandler("Token đặt lại không hợp lệ hoặc đã hết hạn", 400);
  }

  const passwordRegex = /^(?=.*[!@#$&*])(?=.*[0-9]).{6,}$/;
  if (!passwordRegex.test(newPassword)) {
    throw new ErrorHandler(
      "Mật khẩu phải có ít nhất 6 ký tự, chứa một số và một ký tự đặc biệt",
      400
    );
  }

  const user = await userModel.findOne({ email: decoded.email }).select("+password");
  if (!user) {
    throw new ErrorHandler("Người dùng không tồn tại", 404);
  }

  user.password = newPassword;
  await user.save();

  await redis.del(`reset:${decoded.email}`);

  return { message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới." };
};

export const getAllUsersService = async () => {
  const users = await userModel.find().sort({ createdAt: -1 });
  return users;
};

export const updateUserRoleService = async (email: string, role: string) => {
  const user = await userModel.findOne({ email });
  if (!user) {
    throw new ErrorHandler("Người dùng không tồn tại", 404);
  }

  user.role = role;
  await user.save();

  return user;
};

export const deleteUserService = async (userId: string) => {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new ErrorHandler("Người dùng không tồn tại", 404);
  }

  await user.deleteOne({ id: userId });
  await redis.del(userId);

  return { message: "Xóa người dùng thành công" };
};

export const getUserCoursesService = async (userId: string) => {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new ErrorHandler("Người dùng không tồn tại", 404);
  }

  return user.courses || [];
};

export const banUserService = async (userId: string, isBanned: boolean) => {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new ErrorHandler("Người dùng không tồn tại", 404);
  }

  user.isBanned = isBanned;
  await user.save();

  await redis.set(userId, JSON.stringify(user));

  return {
    message: isBanned ? "Khóa người dùng thành công!" : "Bỏ khóa người dùng thành công!",
  };
};
export const addToFavoritesService = async (userId: string, courseId: string) => {
  if (!courseId) {
    throw new ErrorHandler("Vui lòng cung cấp courseId", 400);
  }

  const user = await userModel.findById(userId);
  if (!user) {
    throw new ErrorHandler("Người dùng không tồn tại", 404);
  }

  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw new ErrorHandler("Khóa học không tồn tại", 404);
  }

  // Kiểm tra xem khóa học đã có trong danh sách yêu thích chưa
  const isAlreadyFavorite = user.favorites.some(
    (item: any) => item.courseId === courseId
  );
  if (isAlreadyFavorite) {
    throw new ErrorHandler("Khóa học đã có trong danh sách yêu thích", 400);
  }

  // Thêm khóa học vào danh sách yêu thích
  user.favorites.push({ courseId });
  await user.save();

  return { success: true, message: "Đã thêm khóa học vào danh sách yêu thích" };
};

// Xóa khóa học khỏi danh sách yêu thích
export const removeFromFavoritesService = async (userId: string, courseId: string) => {
  if (!courseId) {
    throw new ErrorHandler("Vui lòng cung cấp courseId", 400);
  }

  const user = await userModel.findById(userId);
  if (!user) {
    throw new ErrorHandler("Người dùng không tồn tại", 404);
  }

  // Kiểm tra xem khóa học có trong danh sách yêu thích không
  const isFavorite = user.favorites.some(
    (item: any) => item.courseId === courseId
  );
  if (!isFavorite) {
    throw new ErrorHandler("Khóa học không có trong danh sách yêu thích", 400);
  }

  // Xóa khóa học khỏi danh sách yêu thích
  user.favorites = user.favorites.filter(
    (item: any) => item.courseId !== courseId
  );
  await user.save();

  return { success: true, message: "Đã xóa khóa học khỏi danh sách yêu thích" };
};

// Lấy danh sách khóa học yêu thích
export const getFavoriteCoursesService = async (userId: string) => {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new ErrorHandler("Người dùng không tồn tại", 404);
  }

  const favoriteCourseIds = user.favorites.map((item: any) => item.courseId);
  const favoriteCourses = await CourseModel.find({
    _id: { $in: favoriteCourseIds },
  });

  return favoriteCourses;
};