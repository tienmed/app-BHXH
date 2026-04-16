import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const icdCode = searchParams.get("icdCode");
    const targetName = searchParams.get("targetName");

    try {
        const response = await fetch(`http://localhost:3001/interactions/feedback?icdCode=${icdCode}&targetName=${encodeURIComponent(targetName ?? "")}`);
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 502 });
    }
}
