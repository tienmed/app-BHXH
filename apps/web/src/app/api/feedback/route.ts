import { NextRequest, NextResponse } from "next/server";

const remoteUrl = process.env.GOOGLE_APPS_SCRIPT_URL || process.env.NEXT_PUBLIC_RECOMMENDATION_API_URL;

export async function POST(request: NextRequest) {
    const payload = await request.json();

    if (!remoteUrl) {
        return NextResponse.json(
            {
                error: "missing_remote_url",
                message: "GOOGLE_APPS_SCRIPT_URL is not configured."
            },
            { status: 503 }
        );
    }

    try {
        const response = await fetch(remoteUrl, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify({
                action: "submit-doctor-feedback",
                ...payload
            }),
            cache: "no-store"
        });

        if (!response.ok) {
            return NextResponse.json(
                {
                    error: "remote_request_failed",
                    status: response.status,
                    message: `Apps Script returned HTTP ${response.status}`
                },
                { status: 502 }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
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
