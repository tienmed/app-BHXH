import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "App BHXH | Quan tri",
  description: "Cổng thông tin quản trị phác đồ, quy tắc xuất toán và version governance cho pilot."
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
