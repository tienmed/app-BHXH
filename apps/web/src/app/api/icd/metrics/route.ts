import { NextResponse } from "next/server";
import { clinicalEngine } from "@/lib/clinical-engine";

export async function GET() {
  try {
    const data = await clinicalEngine.getIcdCoverage();
    return NextResponse.json(data);
  } catch (error) {
    console.error("ICD metrics fetch error:", error);
    return NextResponse.json({ totalIcd: 0, byGroup: [], timezone: "Asia/Ho_Chi_Minh", source: "local-csv" }, { status: 500 });
  }
}
