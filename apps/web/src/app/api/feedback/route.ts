import { NextRequest, NextResponse } from "next/server";

const feedbackApiUrl =
    process.env.INTERNAL_INTERACTION_API_URL ||
    process.env.NEXT_PUBLIC_INTERACTION_API_URL ||
    "http://localhost:3001/interactions/feedback";

export async function POST(request: NextRequest) {
    const payload = await request.json();

    try {
        const response = await fetch(feedbackApiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload),
            cache: "no-store"
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json(
                {
                    error: "local_request_failed",
                    status: response.status,
                    message: `Backend returned ${response.status}: ${errorText}`
                },
                { status: 502 }
            );
        }

        const data = await response.json();
        return NextResponse.json({ ok: true, data });
    } catch (error) {
        return NextResponse.json(
            {
                error: "remote_request_exception",
                message: error instanceof Error ? error.message : "Unknown remote error"
            },
            { status: 502 }
        );
    }
}
