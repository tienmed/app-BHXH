import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "admin_icd_authoring_disabled",
      message: "Chức năng tạo/cập nhật dữ liệu ICD đã bị vô hiệu hóa trên web admin. Hãy dùng pipeline import dữ liệu riêng."
    },
    { status: 410 }
  );
}
