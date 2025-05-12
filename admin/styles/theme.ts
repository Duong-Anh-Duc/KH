// frontend/app/styles/theme.ts
export const theme = {
    colors: {
      primary: "#009990", // Màu chủ đạo
      secondary: "#2467EC", // Màu phụ
      background: "#F6F7F9", // Màu nền
      white: "#FFFFFF",
      text: "#333333", // Màu chữ chính
      textSecondary: "#575757", // Màu chữ phụ
      error: "#FF6347", // Màu lỗi
      success: "#2ECC71", // Màu thành công
      border: "#E1E2E5", // Màu viền
      disabled: "#CCCCCC", // Màu cho trạng thái vô hiệu hóa
    },
    typography: {
      fontFamily: {
        bold: "Raleway_700Bold",
        regular: "Nunito_400Regular",
        semiBold: "Nunito_600SemiBold",
        extraBold: "Nunito_700Bold",
      },
      fontSize: {
        h1: 24, // Tiêu đề lớn
        h2: 20, // Tiêu đề trung
        body: 16, // Nội dung chính
        caption: 14, // Chữ nhỏ (caption, chú thích)
        button: 16, // Chữ trên nút
      },
    },
    spacing: {
      small: 8,
      medium: 16,
      large: 24,
      extraLarge: 32,
    },
    borderRadius: {
      small: 6,
      medium: 8,
      large: 12,
    },
    elevation: {
      small: 2,
      medium: 4,
      large: 6,
    },
  };