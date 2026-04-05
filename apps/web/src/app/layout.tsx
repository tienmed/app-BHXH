import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "App BHXH | Bac si",
  description: "Khung pilot ngoại trú nội khoa cho gợi ý chỉ định và cảnh báo nguy cơ xuất toán."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
