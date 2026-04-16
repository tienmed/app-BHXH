import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const payload = await request.json();

    try {
        const response = await fetch("http://localhost:3001/interactions/dismissal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        return NextResponse.json({ ok: response.ok, data });
    } catch (error) {
        return NextResponse.json({ ok: false, message: (error as Error).message }, { status: 502 });
    }
}
